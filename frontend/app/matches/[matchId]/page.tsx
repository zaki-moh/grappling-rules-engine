'use client'
import SelectedEventPanel from '@/components/SelectedEventPanel'
import VideoReviewPanel from '@/components/VideoReviewPanel'
import { ScoringEvent } from '@/types/types'
import React from 'react'

const Page = () => {
  
  const scoringEvents: ScoringEvent[] = [
    {
      id: 1,
      percent: 20,
      eventType: "Guard Pass",
      description: "Blue clears the legs and establishes side control.",
      competitor: "Blue",
      points: 3,
      position: "Side Control",
      confidence: 0.89,
      timestamp: "01:42.35",
      replayWindow: "01:40 - 01:45",
      reviewStatus: "pending",
    },
    {
      id: 2,
      percent: 50,
      eventType: "Sweep",
      description: "Red reverses from guard and comes on top.",
      competitor: "Red",
      points: 2,
      position: "Top Half Guard",
      confidence: 0.82,
      timestamp: "03:18.10",
      replayWindow: "03:15 - 03:20",
      reviewStatus: "accepted",
    },
    {
      id: 3,
      percent: 80,
      eventType: "Back Control",
      description: "Blue secures back exposure and control.",
      competitor: "Blue",
      points: 4,
      position: "Back Control",
      confidence: 0.91,
      timestamp: "05:47.62",
      replayWindow: "05:45 - 05:50",
      reviewStatus: "rejected",
    },
  ];

  const [selectedEventId, setSelectedEventId] = React.useState<number | null>(1);

  const selectedEvent =
    scoringEvents.find((event) => event.id === selectedEventId) ?? null;



  return (
    <main className="min-h-screen bg-[#f3f4f6] text-slate-900 flex flex-col gap-6 p-6">
        <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Match Review</h1>
            <p className="text-sm text-slate-600">Red vs Blue • IBJJF</p>
        </header>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <VideoReviewPanel
            scoringEvents={scoringEvents}
            selectedEventId={selectedEventId}
            onSelectEvent={(id) => setSelectedEventId(id)}
            scoringEvent={selectedEvent}
          />
          <SelectedEventPanel scoringEvent={selectedEvent} />
        </div>
    </main>
  )
}

export default Page
