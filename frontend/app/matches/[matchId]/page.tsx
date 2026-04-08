'use client'
import SelectedEventPanel from '@/components/SelectedEventPanel'
import VideoReviewPanel from '@/components/VideoReviewPanel'
import { ScoringEvent } from '@/types/types'
import { useParams } from "next/navigation";
import { useRouter } from 'next/router';
import React from 'react'

const Page = () => {
  const router = useRouter();

  const params = useParams();
  const matchId = params.matchId;

  const initialEvents: ScoringEvent[] = [
    {
      id: 1,
      percent: 20,
      event_type: "Guard Pass",
      description: "Blue clears the legs and establishes side control.",
      team: "blue",
      points: 3,
      position: "Side Control",
      confidence: 0.89,
      timestamp: "01:42.35",
      replay_window: "01:40 - 01:45",
      review_status: "pending",
      review_note: "",
    },
    {
      id: 2,
      percent: 50,
      event_type: "Sweep",
      description: "Red reverses from guard and comes on top.",
      team: "red",
      points: 2,
      position: "Top Half Guard",
      confidence: 0.82,
      timestamp: "03:18.10",
      replay_window: "03:15 - 03:20",
      review_status: "accepted",
      review_note: "Clean reversal and stable top position.",
    },
    {
      id: 3,
      percent: 80,
      event_type: "Back Control",
      description: "Blue secures back exposure and control.",
      team: "blue",
      points: 4,
      position: "Back Control",
      confidence: 0.91,
      timestamp: "05:47.62",
      replay_window: "05:45 - 05:50",
      review_status: "pending",
      review_note: "",
    },
  ];

  const [scoringEvents, setScoringEvents] = React.useState<ScoringEvent[]>(initialEvents);

  const acceptedEvents = scoringEvents.filter(
    (event) => event.review_status === "accepted"
  );

  const redScore = acceptedEvents
    .filter((event) => event.team === "red")
    .reduce((total, event) => total + event.points, 0);

  const blueScore = acceptedEvents
    .filter((event) => event.team === "blue")
    .reduce((total, event) => total + event.points, 0);

  const [selectedEventId, setSelectedEventId] = React.useState<number | null>(1);

  const selectedEvent =
    scoringEvents.find((event) => event.id === selectedEventId) ?? null;

  const handleReviewDecision = (eventId: number, review_status: ScoringEvent["review_status"]) => {
    setScoringEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, review_status } : event
      )
    );
  };

  const handleReviewNoteChange = (eventId: number, review_note: string) => {
    setScoringEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, review_note } : event
      )
    );
  };



  return (
    <main className="min-h-screen bg-[#f3f4f6] text-slate-900 flex flex-col gap-6 p-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Match Review</h1>
            <p className="text-sm text-slate-600">Red vs Blue • IBJJF</p>
          </div>
          <section className="grid min-w-[18rem] grid-cols-2 gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-black/5">
            <div className="rounded-2xl bg-rose-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-rose-700">Red Score</p>
              <p className="mt-2 text-3xl font-semibold text-rose-900">{redScore}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 px-4 py-3">
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
            onAccept={() => selectedEventId !== null && handleReviewDecision(selectedEventId, "accepted")}
            onReject={() => selectedEventId !== null && handleReviewDecision(selectedEventId, "rejected")}
            onReset={() => selectedEventId !== null && handleReviewDecision(selectedEventId, "pending")}
            onNoteChange={(note) => selectedEventId !== null && handleReviewNoteChange(selectedEventId, note)}
         />
        </div>
    </main>
  )
}

export default Page
