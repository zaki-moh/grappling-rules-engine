'use client'
import AnalyticsPanel from '@/components/AnalyticsPanel'
import SelectedItemPanel from '@/components/SelectedItemPanel'
import VideoReviewPanel from '@/components/VideoReviewPanel'
import {
  getAnalytics,
  getMatch,
  getMatchEvents,
  getMatchVideoUrl,
  getPositionTimeline,
  reviewEvent,
  reviewSegment,
} from '@/app/api'
import { buildEventDescription, eventLabel, formatClock, positionLabel } from '@/lib/display'
import type {
  AnalyticsSummary,
  ApiMatchEvent,
  ApiPositionSegment,
  EventReviewRequest,
  Match,
  SegmentReviewRequest,
} from '@/types/api'
import type { DisplayEvent, DisplaySegment, SelectedItem } from '@/types/types'
import { useParams } from 'next/navigation'
import React from 'react'

const timelineDuration = (
  segments: ApiPositionSegment[],
  events: ApiMatchEvent[],
): number => {
  const segmentEnd = segments.reduce((max, segment) => Math.max(max, segment.end_seconds), 0)
  const eventEnd = events.reduce((max, event) => Math.max(max, event.timestamp_seconds), 0)
  return Math.max(segmentEnd, eventEnd, 1)
}

const mapSegments = (
  segments: ApiPositionSegment[],
  duration: number,
): DisplaySegment[] =>
  segments.map((segment) => ({
    id: segment.id,
    position: segment.position,
    start_seconds: segment.start_seconds,
    end_seconds: segment.end_seconds,
    top_athlete: segment.top_athlete,
    confidence: segment.confidence ?? 0,
    review_status: segment.review_status,
    review_note: segment.review_note ?? '',
    startPercent: (segment.start_seconds / duration) * 100,
    widthPercent: Math.max(0.5, ((segment.end_seconds - segment.start_seconds) / duration) * 100),
    label: positionLabel(segment.position),
    timeRange: `${formatClock(segment.start_seconds)} - ${formatClock(segment.end_seconds)}`,
  }))

const mapEvents = (events: ApiMatchEvent[], duration: number): DisplayEvent[] =>
  events.map((event) => ({
    id: event.id,
    event_type: event.event_type,
    timestamp_seconds: event.timestamp_seconds,
    timestamp: event.timestamp,
    athlete: event.athlete,
    from_position: event.from_position,
    to_position: event.to_position,
    confidence: event.confidence ?? 0,
    replay_start_seconds: event.replay_start_seconds,
    replay_end_seconds: event.replay_end_seconds,
    review_status: event.review_status,
    review_note: event.review_note ?? '',
    percent: Math.min(100, Math.max(0, (event.timestamp_seconds / duration) * 100)),
    label: eventLabel(event.event_type),
    description: buildEventDescription(event),
    replay_window: `${formatClock(event.replay_start_seconds)} - ${formatClock(event.replay_end_seconds)}`,
  }))

type WorkspaceData = {
  match: Match
  segments: DisplaySegment[]
  events: DisplayEvent[]
  analytics: AnalyticsSummary
}

const fetchWorkspaceData = async (matchId: number): Promise<WorkspaceData> => {
  const [matchResponse, timelineResponse, eventsResponse, analyticsResponse] = await Promise.all([
    getMatch(matchId),
    getPositionTimeline(matchId),
    getMatchEvents(matchId),
    getAnalytics(matchId),
  ])

  const duration = timelineDuration(
    timelineResponse.position_segments,
    eventsResponse.events,
  )

  return {
    match: matchResponse.match,
    segments: mapSegments(timelineResponse.position_segments, duration),
    events: mapEvents(eventsResponse.events, duration),
    analytics: analyticsResponse.analytics,
  }
}

const Page = () => {
  const params = useParams<{ matchId: string }>()
  const rawMatchId = typeof params.matchId === 'string' ? params.matchId : undefined
  const matchId = Number(rawMatchId)
  const isValidMatchId = Number.isInteger(matchId) && matchId > 0

  const [match, setMatch] = React.useState<Match | null>(null)
  const [segments, setSegments] = React.useState<DisplaySegment[]>([])
  const [events, setEvents] = React.useState<DisplayEvent[]>([])
  const [analytics, setAnalytics] = React.useState<AnalyticsSummary | null>(null)
  const [selected, setSelected] = React.useState<SelectedItem | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [reviewError, setReviewError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!isValidMatchId) {
      setError('The match ID in the URL is invalid.')
      setIsLoading(false)
      return
    }

    let isActive = true

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchWorkspaceData(matchId)
        if (!isActive) return

        setMatch(data.match)
        setSegments(data.segments)
        setEvents(data.events)
        setAnalytics(data.analytics)
        setSelected(
          data.events[0]
            ? { kind: 'event', id: data.events[0].id }
            : data.segments[0]
              ? { kind: 'segment', id: data.segments[0].id }
              : null,
        )
      } catch (loadError) {
        if (!isActive) return
        setMatch(null)
        setSegments([])
        setEvents([])
        setAnalytics(null)
        setError(
          loadError instanceof Error ? loadError.message : 'Failed to load the match report.',
        )
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    load()
    return () => {
      isActive = false
    }
  }, [isValidMatchId, matchId])

  const refreshAfterReview = async () => {
    const data = await fetchWorkspaceData(matchId)
    setMatch(data.match)
    setSegments(data.segments)
    setEvents(data.events)
    setAnalytics(data.analytics)
  }

  const selectedEvent =
    selected?.kind === 'event'
      ? events.find((event) => event.id === selected.id) ?? null
      : null
  const selectedSegment =
    selected?.kind === 'segment'
      ? segments.find((segment) => segment.id === selected.id) ?? null
      : null

  const handleEventReview = async (payload: EventReviewRequest) => {
    if (!selectedEvent || isSaving) return
    try {
      setIsSaving(true)
      setReviewError(null)
      await reviewEvent(matchId, selectedEvent.id, payload)
      await refreshAfterReview()
    } catch (saveError) {
      setReviewError(
        saveError instanceof Error ? saveError.message : 'Failed to save the review.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleSegmentReview = async (payload: SegmentReviewRequest) => {
    if (!selectedSegment || isSaving) return
    try {
      setIsSaving(true)
      setReviewError(null)
      await reviewSegment(matchId, selectedSegment.id, payload)
      await refreshAfterReview()
    } catch (saveError) {
      setReviewError(
        saveError instanceof Error ? saveError.message : 'Failed to save the review.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const redName = match?.red_competitor ?? 'Red'
  const blueName = match?.blue_competitor ?? 'Blue'
  const matchTitle = `${redName} vs ${blueName}${match?.ruleset_id ? ` • ${match.ruleset_id.toUpperCase()}` : ''}`
  const videoUrl = match?.video_path ? getMatchVideoUrl(match.id) : null

  const replay = selectedEvent
    ? {
        start: selectedEvent.replay_start_seconds,
        end: selectedEvent.replay_end_seconds,
        label: selectedEvent.replay_window,
        timestamp: selectedEvent.timestamp,
      }
    : selectedSegment
      ? {
          start: selectedSegment.start_seconds,
          end: selectedSegment.end_seconds,
          label: selectedSegment.timeRange,
          timestamp: formatClock(selectedSegment.start_seconds),
        }
      : null

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#eeece5] bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:48px_48px] p-6">
        <div className="rounded-3xl bg-white/90 p-6 text-sm text-slate-600 shadow-sm ring-1 ring-black/5 backdrop-blur">
          Loading match report...
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#eeece5] bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:48px_48px] p-6">
        <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <h1 className="text-xl font-semibold text-slate-900">Unable to load match report</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#eeece5] bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:48px_48px] text-slate-900 flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Match Breakdown</h1>
        <p className="text-sm text-slate-600">{matchTitle}</p>
      </header>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <VideoReviewPanel
          videoUrl={videoUrl}
          segments={segments}
          events={events}
          selected={selected}
          replay={replay}
          onSelectEvent={(id) => setSelected({ kind: 'event', id })}
          onSelectSegment={(id) => setSelected({ kind: 'segment', id })}
        />
        <div className="flex w-full flex-col gap-6 xl:max-w-md">
          <SelectedItemPanel
            selectedEvent={selectedEvent}
            selectedSegment={selectedSegment}
            isSaving={isSaving}
            error={reviewError}
            onEventReview={handleEventReview}
            onSegmentReview={handleSegmentReview}
          />
          <AnalyticsPanel analytics={analytics} redName={redName} blueName={blueName} />
        </div>
      </div>
    </main>
  )
}

export default Page
