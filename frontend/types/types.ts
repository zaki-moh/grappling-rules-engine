export type ReviewStatus = "pending" | "confirmed" | "corrected" | "rejected";

export type CompetitorSide = "red" | "blue";

export type Position =
  | "standing"
  | "closed_guard"
  | "half_guard"
  | "side_control"
  | "mount"
  | "back_control"
  | "turtle"
  | "scramble"
  | "unknown";

export type EventType =
  | "guard_pass"
  | "sweep"
  | "reversal"
  | "submission_attempt"
  | "escape"
  | "back_take"
  | "mount_transition"
  | "scramble";

// A position segment prepared for rendering as a band on the timeline.
export type DisplaySegment = {
  id: number;
  position: Position;
  start_seconds: number;
  end_seconds: number;
  top_athlete: CompetitorSide | null;
  confidence: number;
  review_status: ReviewStatus;
  review_note: string;
  // Derived for display:
  startPercent: number;
  widthPercent: number;
  label: string;
  timeRange: string;
};

// A match event prepared for rendering as a timeline marker + detail card.
export type DisplayEvent = {
  id: number;
  event_type: EventType;
  timestamp_seconds: number;
  timestamp: string;
  athlete: CompetitorSide | null;
  from_position: Position | null;
  to_position: Position | null;
  confidence: number;
  replay_start_seconds: number;
  replay_end_seconds: number;
  review_status: ReviewStatus;
  review_note: string;
  // Derived for display:
  percent: number;
  label: string;
  description: string;
  replay_window: string;
};

// Which item the review workspace currently has selected.
export type SelectedItem =
  | { kind: "event"; id: number }
  | { kind: "segment"; id: number };
