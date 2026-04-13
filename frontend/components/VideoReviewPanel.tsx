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
    <div className="flex min-w-0 flex-[1.6] flex-col gap-4 rounded-3xl bg-white/90 p-4 shadow-xl ring-1 ring-black/10 backdrop-blur">
      <div className="flex items-center justify-between">

        {/* match header */}
        <div>
          <p className="text-sm font-semibold text-slate-950">Match Footage</p>
          <p className="text-xs text-slate-500">Selected event replay and full video view</p>
        </div>
        <p className="rounded-full bg-slate-100 px-3 py-1 font-mono text-sm text-slate-600 ring-1 ring-slate-200">{scoringEvent?.timestamp}</p>
      </div>
      
      {/* Video */}
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950 shadow-sm ring-1 ring-black/10">
        <Image
          src="/stock.jpg"
          alt="Grappling match video placeholder"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent" />
        <div className="absolute inset-x-0 top-0 flex h-1.5">
          <div className="flex-1 bg-rose-500/90" />
          <div className="flex-1 bg-blue-500/90" />
        </div>
        <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
          Full Match View
        </div>
      </div>

      {/* Focused replay*/}
      <div className="rounded-2xl bg-slate-950 p-3 text-white shadow-sm ring-1 ring-black/10">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">Focused Replay</p>
          <p className="font-mono text-xs text-slate-300">{scoringEvent?.replay_window}</p>
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
      <div className="rounded-xl bg-[#eeece5] p-3 ring-1 ring-black/5">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>Scoring Timeline</span>
          <span>{scoringEvents.length} events</span>
        </div>
        <div className="relative h-2 rounded-full bg-slate-300/80">
          {scoringEvents.map((event) => (
            <ScoringEventMarker
              key={event.id}
              positionPercent={event.percent}
              review_status={event.review_status}
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
