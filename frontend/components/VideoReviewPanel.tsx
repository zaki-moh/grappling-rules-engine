import EventMarker from "./EventMarker";
import { POSITION_COLOR, positionLabel } from "@/lib/display";
import type { DisplayEvent, DisplaySegment, SelectedItem } from "@/types/types";

type ReplayWindow = {
  start: number;
  end: number;
  label: string;
  timestamp: string;
} | null;

type VideoReviewPanelProps = {
  videoUrl: string | null;
  segments: DisplaySegment[];
  events: DisplayEvent[];
  selected: SelectedItem | null;
  replay: ReplayWindow;
  onSelectEvent: (id: number) => void;
  onSelectSegment: (id: number) => void;
};

// Positions that actually appear on this match, for a compact legend.
const usedPositions = (segments: DisplaySegment[]) =>
  Array.from(new Set(segments.map((segment) => segment.position)));

const VideoReviewPanel = ({
  videoUrl,
  segments,
  events,
  selected,
  replay,
  onSelectEvent,
  onSelectSegment,
}: VideoReviewPanelProps) => {
  const replayVideoUrl =
    videoUrl && replay ? `${videoUrl}#t=${replay.start},${replay.end}` : null;

  return (
    <div className="flex min-w-0 flex-[1.6] flex-col gap-4 rounded-3xl bg-white/90 p-4 shadow-xl ring-1 ring-black/10 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">Match Footage</p>
          <p className="text-xs text-slate-500">Position timeline and event replay</p>
        </div>
        <p className="rounded-full bg-slate-100 px-3 py-1 font-mono text-sm text-slate-600 ring-1 ring-slate-200">
          {replay?.timestamp ?? "--:--"}
        </p>
      </div>

      {/* Full match video */}
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950 shadow-sm ring-1 ring-black/10">
        {videoUrl ? (
          <video src={videoUrl} controls className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-slate-300">
            Match footage will appear here after a video is uploaded.
          </div>
        )}
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
          Full Match View
        </div>
      </div>

      {/* Focused replay of the selected item */}
      <div className="rounded-2xl bg-slate-950 p-3 text-white shadow-sm ring-1 ring-black/10">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">Focused Replay</p>
          <p className="font-mono text-xs text-slate-300">{replay?.label ?? "Select an item"}</p>
        </div>
        <div className="relative h-32 overflow-hidden rounded-xl">
          {replayVideoUrl ? (
            <video
              key={replayVideoUrl}
              src={replayVideoUrl}
              controls
              className="h-full w-full object-contain opacity-90"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-slate-300">
              Select an event or position segment to preview its replay window.
            </div>
          )}
        </div>
      </div>

      {/* Position timeline: event markers above, position bands below */}
      <div className="rounded-xl bg-[#eeece5] p-3 ring-1 ring-black/5">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>Position Timeline</span>
          <span>
            {segments.length} segments · {events.length} events
          </span>
        </div>

        {/* Event markers */}
        <div className="relative mb-1 h-4">
          {events.map((event) => (
            <EventMarker
              key={event.id}
              positionPercent={event.percent}
              review_status={event.review_status}
              isSelected={selected?.kind === "event" && selected.id === event.id}
              title={`${event.label} @ ${event.timestamp}`}
              onSelect={() => onSelectEvent(event.id)}
            />
          ))}
        </div>

        {/* Position bands */}
        <div className="relative h-8 overflow-hidden rounded-lg bg-slate-200">
          {segments.map((segment) => {
            const isSelected =
              selected?.kind === "segment" && selected.id === segment.id;
            return (
              <button
                key={segment.id}
                type="button"
                title={`${segment.label} · ${segment.timeRange}`}
                onClick={() => onSelectSegment(segment.id)}
                className={`absolute top-0 h-full ${POSITION_COLOR[segment.position]} transition ${
                  isSelected ? "z-10 ring-2 ring-slate-950" : "hover:brightness-110"
                }`}
                style={{ left: `${segment.startPercent}%`, width: `${segment.widthPercent}%` }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {usedPositions(segments).map((position) => (
            <span key={position} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className={`h-2.5 w-2.5 rounded-sm ${POSITION_COLOR[position]}`} />
              {positionLabel(position)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoReviewPanel;
