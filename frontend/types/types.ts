export type ReviewStatus = "pending" | "accepted" | "rejected";

export type CompetitorSide = "red" | "blue";

export type ScoringEvent = {
  id: number;
  percent: number;
  event_type: string;
  description: string;
  team: CompetitorSide;
  points: number;
  position: string;
  confidence: number;
  timestamp: string;
  replay_window: string;
  review_status: ReviewStatus;
  review_note: string;
};
