import type { ReviewStatus, ScoringEvent } from "@/types/types";

export type RulesetType = "system" | "custom";
export type MatchStatus = "created" | "processing" | "ready_for_review" | "completed";

export type Ruleset = {
  id: string;
  name: string;
  type: RulesetType;
  description: string | null;
};

export type Match = {
  id: number;
  ruleset_id: string;
  red_competitor: string | null;
  blue_competitor: string | null;
  status: MatchStatus;
};

export type MatchCreateRequest = {
  ruleset_id: string;
  red_competitor?: string | null;
  blue_competitor?: string | null;
};

export type MatchUpdateRequest = {
  ruleset_id?: string;
  red_competitor?: string | null;
  blue_competitor?: string | null;
  status?: MatchStatus;
};

export type ScoringEventCreateRequest = {
  match_id: number;
  event_type: string;
  team: "red" | "blue";
  points: number;
  timestamp: string;
  position: string;
  confidence?: number | null;
};

export type ScoringEventReviewRequest = {
  review_status: ReviewStatus;
  review_note?: string | null;
};

export type RulesetsResponse = {
  rulesets: Ruleset[];
};

export type RulesetResponse = {
  ruleset: Ruleset;
};

export type MatchesResponse = {
  matches: Match[];
};

export type MatchResponse = {
  match: Match;
};

export type CreateMatchResponse = {
  message: string;
  match: Match;
};

export type StartMatchAnalysisResponse = {
  message: string;
  match: Match;
};

export type ScoringEventsResponse = {
  match_id: number;
  scoring_events: ScoringEvent[];
};

export type CreateScoringEventResponse = {
  message: string;
  event: ScoringEvent;
};

export type ReviewScoringEventResponse = {
  message: string;
  event: ScoringEvent;
};

export type ScoreSummaryResponse = {
  match_id: number;
  proposed_score_summary: {
    red: number;
    blue: number;
  };
  confirmed_score_summary: {
    red: number;
    blue: number;
  };
};

export type HealthCheckResponse = {
  status: string;
};
