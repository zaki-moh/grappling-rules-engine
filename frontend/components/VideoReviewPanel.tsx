import Image from "next/image";
import ScoringEventMarker from "./ScoringEventMarker";
import { ScoringEvent } from "@/types/types";

type VideoReviewPanelProps = {
  scoringEvent: ScoringEvent | null;
  scoringEvents: Array<ScoringEvent>;
  selectedEventId: number | null;
  onSelectEvent: (id: number) => void;
}

const VideoReviewPanel = ({ scoringEvent, scoringEvents, selectedEventId, onSelectEvent }: VideoReviewPanelProps) => {
  return (
    <div className="flex min-w-0 flex-[1.6] flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">

        {/* match header */}
        <div>
          <p className="text-sm font-medium text-slate-700">Match Footage</p>
          <p className="text-xs text-slate-500">Selected event replay and full video view</p>
        </div>
        <p className="font-mono text-sm text-slate-500">{scoringEvent?.timestamp}</p>
      </div>
      
      {/* Video */}
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
        <Image
          src="/stock.jpg"
          alt="Grappling match video placeholder"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
        <div className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white">
          Full Match View
        </div>
      </div>

      {/* Focused replay*/}
      <div className="rounded-2xl bg-slate-950 p-3 text-white">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">Focused Replay</p>
          <p className="font-mono text-xs text-slate-300">{scoringEvent?.replayWindow}</p>
        </div>
        <div className="relative h-32 overflow-hidden rounded-xl">
          <Image
            src="/stock.jpg"
            alt="Focused scoring event replay placeholder"
            fill
            className="object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      </div>

      {/* Scoring timeline */}
      <div className="rounded-xl bg-slate-100 p-3">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>Scoring Timeline</span>
          <span>{scoringEvents.length} events</span>
        </div>
        <div className="relative h-2 rounded-full bg-slate-200">
          {scoringEvents.map((event) => (
            <ScoringEventMarker
              key={event.id}
              positionPercent={event.percent}
              reviewStatus={event.reviewStatus}
              isSelected={selectedEventId === event.id}
              onSelect={() => onSelectEvent(event.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default VideoReviewPanel
