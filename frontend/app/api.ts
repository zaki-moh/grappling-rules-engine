import type {
  CreateMatchResponse,
  CreateScoringEventResponse,
  HealthCheckResponse,
  MatchCreateRequest,
  MatchResponse,
  MatchesResponse,
  ScoringEventReviewRequest,
  ReviewScoringEventResponse,
  RulesetResponse,
  RulesetsResponse,
  ScoringEventCreateRequest,
  ScoringEventsResponse,
  ScoreSummaryResponse,
  StartMatchAnalysisResponse,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

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


const startMatchAnalysis = async (matchId: number): Promise<StartMatchAnalysisResponse> => {
  const response = await fetch(buildUrl(`/matches/${matchId}/analysis`), {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to start match analysis");
  }
  return response.json();
};

const getScoringEvents = async (matchId: number): Promise<ScoringEventsResponse> => {
  const response = await fetch(buildUrl(`/matches/${matchId}/scoring_events`));
  if (!response.ok) {
    throw new Error("Failed to fetch scoring events");
  }


  return response.json();
};

const createScoringEvent = async (
  data: ScoringEventCreateRequest,
): Promise<CreateScoringEventResponse> => {
  const response = await fetch(buildUrl("/scoring_events"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create scoring event");
  }
  return response.json();
};

const reviewScoringEvent = async (
  matchId: number,
  eventId: number,
  data: ScoringEventReviewRequest,
): Promise<ReviewScoringEventResponse> => {
  const response = await fetch(
    buildUrl(`/matches/${matchId}/scoring_events/${eventId}/review`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) {
    throw new Error("Failed to review scoring event");
  }
  return response.json();
};

const getScoreSummary = async (matchId: number): Promise<ScoreSummaryResponse> => {
  const response = await fetch(buildUrl(`/matches/${matchId}/score_summary`));
  if (!response.ok) {
    throw new Error("Failed to fetch score summary");
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
  startMatchAnalysis,
  getScoringEvents,
  createScoringEvent,
  reviewScoringEvent,
  getScoreSummary, 
  healthCheck,
};
