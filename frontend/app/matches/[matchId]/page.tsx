'use client'
import SelectedEventPanel from '@/components/SelectedEventPanel'
import VideoReviewPanel from '@/components/VideoReviewPanel'
import { getMatch, getScoringEvents, reviewScoringEvent, getScoreSummary } from '@/app/api'
import type { ApiScoringEvent, Match } from '@/types/api'
import { ScoringEvent } from '@/types/types'
import { useParams } from "next/navigation";
import React from 'react'

const parseTimestampToSeconds = (timestamp: string) => {
  const [hours, minutes, secondsWithFraction] = timestamp.split(":");
  const seconds = Number(secondsWithFraction);

  return (
    Number(hours) * 60 * 60
    + Number(minutes) * 60
    + seconds
  );
};

const formatSecondsAsTimestamp = (seconds: number) => {
  const clampedSeconds = Math.max(0, Math.floor(seconds));
  const hours = String(Math.floor(clampedSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((clampedSeconds % 3600) / 60)).padStart(2, "0");
  const remainingSeconds = String(clampedSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${remainingSeconds}`;
};

const buildReplayWindow = (timestamp: string) => {
  const eventSeconds = parseTimestampToSeconds(timestamp);
  const replayStart = formatSecondsAsTimestamp(eventSeconds - 2);
  const replayEnd = formatSecondsAsTimestamp(eventSeconds + 2);

  return `${replayStart} - ${replayEnd}`;
};

const buildEventDescription = (event: ApiScoringEvent) => {
  const displayTeam = event.team.charAt(0).toUpperCase() + event.team.slice(1);

  return `${displayTeam} is credited with ${event.event_type.toLowerCase()} leading into ${event.position.toLowerCase()}.`;
};

// The backend returns storage-friendly scoring events. The review page needs a
// couple of extra presentation fields as well, so we derive them once here
// instead of scattering that transformation across the UI.
const mapScoringEventsForReview = (events: ApiScoringEvent[]): ScoringEvent[] => {
  const timestampUpperBound = Math.max(
    ...events.map((event) => parseTimestampToSeconds(event.timestamp)),
    1,
  );

  return events.map((event) => ({
    id: event.id,
    // Spread markers across the timeline using the event timestamp so the UI
    // has a stable relative position even before we have true video metadata.
    percent: 5 + (parseTimestampToSeconds(event.timestamp) / timestampUpperBound) * 90,
    event_type: event.event_type,
    description: buildEventDescription(event),
    team: event.team,
    points: event.points,
    position: event.position,
    confidence: event.confidence ?? 0,
    timestamp: event.timestamp,
    replay_window: buildReplayWindow(event.timestamp),
    review_status: event.review_status,
    review_note: event.review_note ?? "",
  }));
};

const fetchReviewWorkspaceData = async (matchId: number) => {
  const [matchResponse, scoringEventsResponse, scoreSummaryResponse] = await Promise.all([
    getMatch(matchId),
    getScoringEvents(matchId),
    getScoreSummary(matchId),
  ]);

  return {
    match: matchResponse.match,
    scoringEvents: mapScoringEventsForReview(scoringEventsResponse.scoring_events),
    scoreSummary: scoreSummaryResponse,
  };

};

const Page = () => {
  const params = useParams<{ matchId: string }>();
  const rawMatchId = typeof params.matchId === "string" ? params.matchId : undefined;
  const matchId = Number(rawMatchId);
  const isValidMatchId = Number.isInteger(matchId) && matchId > 0;
  const [match, setMatch] = React.useState<Match | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingReview, setIsSavingReview] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reviewError, setReviewError] = React.useState<string | null>(null);
  const [scoringEvents, setScoringEvents] = React.useState<ScoringEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = React.useState<number | null>(null);
  const [redScore, setRedScore] = React.useState(0);
  const [blueScore, setBlueScore] = React.useState(0);

  // This effect is the bridge between the route and the backend:
  // whenever the URL changes to a different /matches/[matchId] page, we
  // fetch that specific match and hydrate the review UI with its events.
  React.useEffect(() => {
    if (!isValidMatchId) {
      setMatch(null);
      setScoringEvents([]);
      setSelectedEventId(null);
      setError("The match ID in the URL is invalid.");
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const loadMatchReviewData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const reviewWorkspaceData = await fetchReviewWorkspaceData(matchId);

        if (!isActive) {
          return;
        }

        setMatch(reviewWorkspaceData.match);
        setScoringEvents(reviewWorkspaceData.scoringEvents);
        setSelectedEventId(reviewWorkspaceData.scoringEvents[0]?.id ?? null);
        setRedScore(reviewWorkspaceData.scoreSummary.confirmed_score_summary.red);
        setBlueScore(reviewWorkspaceData.scoreSummary.confirmed_score_summary.blue);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setMatch(null);
        setScoringEvents([]);
        setSelectedEventId(null);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load the match review data.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadMatchReviewData();

    return () => {
      isActive = false;
    };
  }, [isValidMatchId, matchId]);


  const selectedEvent =
    scoringEvents.find((event) => event.id === selectedEventId) ?? null;

  const handleReviewDecision = async (
    eventId: number,
    review_status: ScoringEvent["review_status"],
  ) => {
    const eventToPersist = scoringEvents.find((event) => event.id === eventId);

    if (!eventToPersist || isSavingReview) {
      return;
    }

    try {
      setIsSavingReview(true);
      setReviewError(null);

      await reviewScoringEvent(matchId, eventId, {
        review_status,
        review_note: eventToPersist.review_note || null,
      });
      
      const reviewWorkspaceData = await fetchReviewWorkspaceData(matchId);

      setMatch(reviewWorkspaceData.match);
      setScoringEvents(reviewWorkspaceData.scoringEvents);
      setSelectedEventId((currentSelectedEventId) =>
        reviewWorkspaceData.scoringEvents.some(
          (event) => event.id === currentSelectedEventId,
        )
          ? currentSelectedEventId
          : reviewWorkspaceData.scoringEvents[0]?.id ?? null,
      );
      setRedScore(reviewWorkspaceData.scoreSummary.confirmed_score_summary.red);
      setBlueScore(reviewWorkspaceData.scoreSummary.confirmed_score_summary.blue);
    } catch (error) {
      setReviewError(
        error instanceof Error
          ? error.message
          : "Failed to save the review decision.",
      );
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleReviewNoteChange = (eventId: number, review_note: string) => {
    setScoringEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, review_note } : event
      )
    );
  };

  const matchTitle =
    `${match?.red_competitor ?? "Red"} vs ${match?.blue_competitor ?? "Blue"} • ${match?.ruleset_id.toUpperCase() ?? "RULESET"}`;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#eeece5] bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:48px_48px] p-6">
        <div className="rounded-3xl bg-white/90 p-6 text-sm text-slate-600 shadow-sm ring-1 ring-black/5 backdrop-blur">
          Loading match review...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#eeece5] bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:48px_48px] p-6">
        <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <h1 className="text-xl font-semibold text-slate-900">Unable to load match review</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eeece5] bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:48px_48px] text-slate-900 flex flex-col gap-6 p-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Match Review</h1>
            <p className="text-sm text-slate-600">{matchTitle}</p>
          </div>
          <section className="grid min-w-[18rem] grid-cols-2 gap-3 rounded-3xl bg-white/90 p-3 shadow-sm ring-1 ring-black/5 backdrop-blur">
            <div className="rounded-2xl bg-rose-50 px-4 py-3 ring-1 ring-rose-100">
              <p className="text-xs font-medium uppercase tracking-wide text-rose-700">Red Score</p>
              <p className="mt-2 text-3xl font-semibold text-rose-900">{redScore}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Blue Score</p>
              <p className="mt-2 text-3xl font-semibold text-blue-900">{blueScore}</p>
            </div>
          </section>
        </header>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <VideoReviewPanel
            scoringEvents={scoringEvents}
            selectedEventId={selectedEventId}
            onSelectEvent={(id) => setSelectedEventId(id)}
            scoringEvent={selectedEvent}
          />
          <SelectedEventPanel 
            scoringEvent={selectedEvent}
            isSavingReview={isSavingReview}
            reviewError={reviewError}
            onAccept={() => {
              if (selectedEventId !== null) {
                void handleReviewDecision(selectedEventId, "accepted");
              }
            }}
            onReject={() => {
              if (selectedEventId !== null) {
                void handleReviewDecision(selectedEventId, "rejected");
              }
            }}
            onReset={() => {
              if (selectedEventId !== null) {
                void handleReviewDecision(selectedEventId, "pending");
              }
            }}
            onNoteChange={(note) => selectedEventId !== null && handleReviewNoteChange(selectedEventId, note)}
         />
        </div>
    </main>
  )
}

export default Page
