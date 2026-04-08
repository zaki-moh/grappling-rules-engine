export type ReviewStatus = "pending" | "accepted" | "rejected";

export type CompetitorSide = "Red" | "Blue";

export type ScoringEvent = {
  id: number;
  percent: number;
  eventType: string;
  description: string;
  competitor: CompetitorSide;
  points: number;
  position: string;
  confidence: number;
  timestamp: string;
  replayWindow: string;
  reviewStatus: ReviewStatus;
  reviewNote: string;
};

