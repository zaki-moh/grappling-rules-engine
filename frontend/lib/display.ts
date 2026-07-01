import type {
  CompetitorSide,
  EventType,
  Position,
  ReviewStatus,
} from "@/types/types";

export const POSITIONS: Position[] = [
  "standing",
  "closed_guard",
  "half_guard",
  "side_control",
  "mount",
  "back_control",
  "turtle",
  "scramble",
  "unknown",
];

export const EVENT_TYPES: EventType[] = [
  "guard_pass",
  "sweep",
  "reversal",
  "submission_attempt",
  "escape",
  "back_take",
  "mount_transition",
  "scramble",
];

// Background color per position, used for the timeline bands + legend.
export const POSITION_COLOR: Record<Position, string> = {
  standing: "bg-slate-400",
  closed_guard: "bg-indigo-500",
  half_guard: "bg-violet-500",
  side_control: "bg-amber-500",
  mount: "bg-orange-600",
  back_control: "bg-rose-600",
  turtle: "bg-teal-500",
  scramble: "bg-fuchsia-500",
  unknown: "bg-slate-300",
};

export const REVIEW_STATUS_BADGE: Record<ReviewStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  corrected: "bg-sky-100 text-sky-800",
  rejected: "bg-rose-100 text-rose-800",
};

export const REVIEW_STATUS_DOT: Record<ReviewStatus, string> = {
  pending: "bg-slate-500",
  confirmed: "bg-emerald-500",
  corrected: "bg-sky-500",
  rejected: "bg-rose-500",
};

const titleCase = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const positionLabel = (position: Position | null): string =>
  position ? titleCase(position) : "—";

export const eventLabel = (eventType: EventType): string => titleCase(eventType);

export const athleteLabel = (athlete: CompetitorSide | null): string =>
  athlete ? athlete.charAt(0).toUpperCase() + athlete.slice(1) : "Unclear";

// Seconds -> "M:SS" clock (match footage is short).
export const formatClock = (seconds: number): string => {
  const clamped = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(clamped / 60);
  const remaining = String(clamped % 60).padStart(2, "0");
  return `${minutes}:${remaining}`;
};

export const buildEventDescription = (event: {
  event_type: EventType;
  athlete: CompetitorSide | null;
  from_position: Position | null;
  to_position: Position | null;
}): string => {
  const base =
    event.athlete !== null
      ? `${eventLabel(event.event_type)} by ${athleteLabel(event.athlete)}`
      : eventLabel(event.event_type);

  if (event.from_position && event.to_position && event.from_position !== event.to_position) {
    return `${base} · ${positionLabel(event.from_position)} → ${positionLabel(event.to_position)}`;
  }
  return base;
};
