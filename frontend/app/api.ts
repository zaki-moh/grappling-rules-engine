import type {
  AnalyticsResponse,
  CreateMatchResponse,
  EventsResponse,
  EventReviewRequest,
  HealthCheckResponse,
  MatchCreateRequest,
  MatchResponse,
  MatchesResponse,
  PositionTimelineResponse,
  ReviewEventResponse,
  ReviewSegmentResponse,
  RulesetResponse,
  RulesetsResponse,
  SegmentReviewRequest,
  StartMatchAnalysisResponse,
  UploadMatchVideoResponse,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

const getMatchVideoUrl = (matchId: number) => buildUrl(`/matches/${matchId}/video`);

const getRulesets = async (): Promise<RulesetsResponse> => {
  const response = await fetch(buildUrl("/rulesets"));
  if (!response.ok) {
    throw new Error("Failed to fetch rulesets");
  }
  return response.json();
};

const getRuleset = async (rulesetId: string): Promise<RulesetResponse> => {
  const response = await fetch(buildUrl(`/rulesets/${rulesetId}`));
  if (!response.ok) {
    throw new Error("Failed to fetch ruleset");
  }
  return response.json();
};

const createMatch = async (data: MatchCreateRequest): Promise<CreateMatchResponse> => {
  const response = await fetch(buildUrl("/matches"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create match");
  }
  return response.json();
};

const getMatches = async (): Promise<MatchesResponse> => {
  const response = await fetch(buildUrl("/matches"));
  if (!response.ok) {
    throw new Error("Failed to fetch matches");
  }
  return response.json();
};

const getMatch = async (matchId: number): Promise<MatchResponse> => {
  const response = await fetch(buildUrl(`/matches/${matchId}`));
  if (!response.ok) {
    throw new Error("Failed to fetch match");
  }
  return response.json();
};

const uploadMatchVideo = async (
  matchId: number,
  videoFile: File,
): Promise<UploadMatchVideoResponse> => {
  const formData = new FormData();
  formData.append("video", videoFile);

  const response = await fetch(buildUrl(`/matches/${matchId}/video`), {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("Failed to upload match video");
  }
  return response.json();
};

const startMatchAnalysis = async (matchId: number): Promise<StartMatchAnalysisResponse> => {
  const response = await fetch(buildUrl(`/matches/${matchId}/analysis`), {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to start match analysis");
  }
  return response.json();
};

const getPositionTimeline = async (
  matchId: number,
): Promise<PositionTimelineResponse> => {
  const response = await fetch(buildUrl(`/matches/${matchId}/position_timeline`));
  if (!response.ok) {
    throw new Error("Failed to fetch position timeline");
  }
  return response.json();
};

const getMatchEvents = async (matchId: number): Promise<EventsResponse> => {
  const response = await fetch(buildUrl(`/matches/${matchId}/events`));
  if (!response.ok) {
    throw new Error("Failed to fetch match events");
  }
  return response.json();
};

const getAnalytics = async (matchId: number): Promise<AnalyticsResponse> => {
  const response = await fetch(buildUrl(`/matches/${matchId}/analytics`));
  if (!response.ok) {
    throw new Error("Failed to fetch analytics");
  }
  return response.json();
};

const reviewSegment = async (
  matchId: number,
  segmentId: number,
  data: SegmentReviewRequest,
): Promise<ReviewSegmentResponse> => {
  const response = await fetch(
    buildUrl(`/matches/${matchId}/segments/${segmentId}/review`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) {
    throw new Error("Failed to review position segment");
  }
  return response.json();
};

const reviewEvent = async (
  matchId: number,
  eventId: number,
  data: EventReviewRequest,
): Promise<ReviewEventResponse> => {
  const response = await fetch(
    buildUrl(`/matches/${matchId}/events/${eventId}/review`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) {
    throw new Error("Failed to review match event");
  }
  return response.json();
};

const healthCheck = async (): Promise<HealthCheckResponse> => {
  const response = await fetch(buildUrl("/health"));
  if (!response.ok) {
    throw new Error("Health check failed");
  }
  return response.json();
};

export {
  getRulesets,
  getRuleset,
  createMatch,
  getMatches,
  getMatch,
  getMatchVideoUrl,
  uploadMatchVideo,
  startMatchAnalysis,
  getPositionTimeline,
  getMatchEvents,
  getAnalytics,
  reviewSegment,
  reviewEvent,
  healthCheck,
};
