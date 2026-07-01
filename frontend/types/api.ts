import type {
  CompetitorSide,
  EventType,
  Position,
  ReviewStatus,
} from "@/types/types";

export type RulesetType = "system" | "custom";
export type MatchStatus = "created" | "processing" | "analyzed" | "failed";

export type Ruleset = {
  id: string;
  name: string;
  type: RulesetType;
  description: string | null;
};

export type Match = {
  id: number;
  ruleset_id: string | null;
  red_competitor: string | null;
  blue_competitor: string | null;
  status: MatchStatus;
  video_filename: string | null;
  video_path: string | null;
  video_content_type: string | null;
  video_size_bytes: number | null;
};

export type MatchCreateRequest = {
  ruleset_id?: string | null;
  red_competitor?: string | null;
  blue_competitor?: string | null;
};

export type MatchUpdateRequest = {
  ruleset_id?: string;
  red_competitor?: string | null;
  blue_competitor?: string | null;
  status?: MatchStatus;
};

export type ApiPositionSegment = {
  id: number;
  match_id: number;
  position: Position;
  start_seconds: number;
  end_seconds: number;
  top_athlete: CompetitorSide | null;
  confidence: number | null;
  review_status: ReviewStatus;
  corrected_position: Position | null;
  corrected_top_athlete: CompetitorSide | null;
  review_note: string | null;
};

export type ApiMatchEvent = {
  id: number;
  match_id: number;
  event_type: EventType;
  timestamp_seconds: number;
  timestamp: string;
  athlete: CompetitorSide | null;
  from_position: Position | null;
  to_position: Position | null;
  confidence: number | null;
  replay_start_seconds: number;
  replay_end_seconds: number;
  review_status: ReviewStatus;
  corrected_event_type: EventType | null;
  corrected_athlete: CompetitorSide | null;
  review_note: string | null;
};

export type AthleteAnalytics = {
  guard_passes: number;
  sweeps: number;
  back_takes: number;
  submission_attempts: number;
  escapes: number;
  control_time_seconds: number;
};

export type Transition = {
  timestamp_seconds: number;
  from_position: Position;
  to_position: Position;
  top_athlete: CompetitorSide | null;
};

export type AnalyticsSummary = {
  red: AthleteAnalytics;
  blue: AthleteAnalytics;
  time_in_position: Record<string, number>;
  major_transitions: Transition[];
  estimated_points: { red: number; blue: number } | null;
};

export type SegmentReviewRequest = {
  review_status: ReviewStatus;
  corrected_position?: Position | null;
  corrected_top_athlete?: CompetitorSide | null;
  review_note?: string | null;
};

export type EventReviewRequest = {
  review_status: ReviewStatus;
  corrected_event_type?: EventType | null;
  corrected_athlete?: CompetitorSide | null;
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
  created_segments: number;
  created_events: number;
};

export type PositionTimelineResponse = {
  match_id: number;
  position_segments: ApiPositionSegment[];
};

export type EventsResponse = {
  match_id: number;
  events: ApiMatchEvent[];
};

export type AnalyticsResponse = {
  match_id: number;
  analytics: AnalyticsSummary;
};

export type ReviewSegmentResponse = {
  message: string;
  segment: ApiPositionSegment;
};

export type ReviewEventResponse = {
  message: string;
  event: ApiMatchEvent;
};

export type HealthCheckResponse = {
  status: string;
};
