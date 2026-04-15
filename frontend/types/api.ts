import type { CompetitorSide, ReviewStatus } from "@/types/types";

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
  video_filename: string | null;
  video_path: string | null;
  video_content_type: string | null;
  video_size_bytes: number | null;
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
  team: CompetitorSide;
  points: number;
  timestamp: string;
  replay_start_seconds: number;
  replay_end_seconds: number;
  position: string;
  confidence?: number | null;
};

export type ScoringEventReviewRequest = {
  review_status: ReviewStatus;
  review_note?: string | null;
};

export type ApiScoringEvent = {
  id: number;
  match_id: number;
  event_type: string;
  team: CompetitorSide;
  points: number;
  timestamp: string;
  replay_start_seconds: number;
  replay_end_seconds: number;
  position: string;
  confidence: number | null;
  review_status: ReviewStatus;
  review_note: string | null;
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

export type UploadMatchVideoResponse = {
  message: string;
  match: Match;
  video: {
    filename: string | null;
    content_type: string | null;
    size_bytes: number | null;
  };
};

export type StartMatchAnalysisResponse = {
  message: string;
  match: Match;
  created_scoring_events: number;
};

export type ScoringEventsResponse = {
  match_id: number;
  scoring_events: ApiScoringEvent[];
};

export type CreateScoringEventResponse = {
  message: string;
  event: ApiScoringEvent;
};

export type ReviewScoringEventResponse = {
  message: string;
  event: ApiScoringEvent;
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
