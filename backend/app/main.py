from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

RulesetType = Literal["system", "custom"]
MatchStatus = Literal["created", "processing", "ready_for_review", "completed"]
ReviewStatus = Literal["pending", "accepted", "rejected"]
CompetitorSide = Literal["red", "blue"]


class Ruleset(BaseModel):
    """A reusable scoring rules definition such as IBJJF or ADCC."""

    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    type: RulesetType
    description: str | None = None


class MatchCreate(BaseModel):
    """Request body for creating a match analysis session."""

    ruleset_id: str = Field(min_length=1)
    red_competitor: str | None = None
    blue_competitor: str | None = None


class MatchUpdate(BaseModel):
    """Request body for updating match metadata."""

    ruleset_id: str | None = None
    red_competitor: str | None = None
    blue_competitor: str | None = None
    status: MatchStatus | None = None


class Match(BaseModel):
    """A single bout being analyzed under one ruleset."""

    id: int = Field(gt=0)
    ruleset_id: str = Field(min_length=1)
    red_competitor: str | None = None
    blue_competitor: str | None = None
    status: MatchStatus = "created"


class ScoringEventCreate(BaseModel):
    """Request body for creating a proposed scoring event."""

    match_id: int = Field(gt=0)
    event_type: str = Field(min_length=1)
    team: CompetitorSide
    points: int = Field(ge=0)
    timestamp: str = Field(pattern=r"^\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?$")
    position: str = Field(min_length=1)
    confidence: float | None = Field(default=None, ge=0, le=1)


class ScoringEvent(BaseModel):
    """A single machine-proposed scoring moment tied to a match."""

    id: int = Field(gt=0)
    match_id: int = Field(gt=0)
    event_type: str = Field(min_length=1)
    team: CompetitorSide
    points: int = Field(ge=0)
    timestamp: str = Field(pattern=r"^\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?$")
    position: str = Field(min_length=1)
    confidence: float | None = Field(default=None, ge=0, le=1)
    review_status: ReviewStatus = "pending"
    review_note: str | None = None


class ScoringEventReview(BaseModel):
    """Request body for reviewing a proposed scoring event."""

    review_status: ReviewStatus
    review_note: str | None = None


app = FastAPI()

RULESETS: dict[str, Ruleset] = {
    "ibjjf": Ruleset(
        id="ibjjf",
        name="IBJJF",
        type="system",
        description="International Brazilian Jiu-Jitsu Federation rules.",
    ),
    "adcc": Ruleset(
        id="adcc",
        name="ADCC",
        type="system",
        description="Abu Dhabi Combat Club submission grappling rules.",
    ),
}

MATCHES: list[Match] = []
SCORING_EVENTS_BY_MATCH: dict[int, list[ScoringEvent]] = {}

redScore = 0
blueScore = 0


def get_match_or_404(match_id: int) -> Match:
    match = next((stored_match for stored_match in MATCHES if stored_match.id == match_id), None)
    if match is None:
        raise HTTPException(status_code=404, detail="match not found")

    return match


def get_scoring_event_or_404(match_id: int, event_id: int) -> ScoringEvent:
    get_match_or_404(match_id)

    match_events = SCORING_EVENTS_BY_MATCH.get(match_id, [])

    event = next((stored_event for stored_event in match_events if stored_event.id == event_id), None)
    if event is None:
        raise HTTPException(status_code=404, detail="scoring event not found")

    return event


@app.get("/")
def read_root():
    return {"message": "Backend is running"}


@app.get("/rulesets")
def list_rulesets():
    return {"rulesets": [ruleset.model_dump() for ruleset in RULESETS.values()]}


@app.get("/rulesets/{ruleset_id}")
def get_ruleset(ruleset_id: str):
    ruleset = RULESETS.get(ruleset_id)

    if ruleset is None:
        raise HTTPException(status_code=404, detail="ruleset not found")

    return {"ruleset": ruleset.model_dump()}


@app.post("/matches")
def create_match(match: MatchCreate):
    if match.ruleset_id not in RULESETS:
        raise HTTPException(status_code=404, detail="ruleset not found")

    stored_match = Match(id=len(MATCHES) + 1, **match.model_dump())
    MATCHES.append(stored_match)

    return {"message": "Match created", "match": stored_match.model_dump()}


@app.get("/matches")
def get_matches():
    return {"matches": [match.model_dump() for match in MATCHES]}


@app.get("/matches/{match_id}")
def get_match(match_id: int):
    match = get_match_or_404(match_id)
    return {"match": match.model_dump()}



@app.patch("/matches/{match_id}")
def update_match(match_id: int, match_update: MatchUpdate):
    match = get_match_or_404(match_id)

    updates = match_update.model_dump(exclude_none=True)
    if "status" in updates:
        raise HTTPException(
            status_code=409,
            detail="status cannot be updated via this endpoint; use the workflow endpoints instead",
        )

    ruleset_id = updates.get("ruleset_id")
    if ruleset_id is not None and ruleset_id not in RULESETS:
        raise HTTPException(status_code=404, detail="ruleset not found")
    if ruleset_id is not None and ruleset_id != match.ruleset_id:
        has_scoring_events = len(SCORING_EVENTS_BY_MATCH.get(match_id, [])) > 0
        if match.status != "created" or has_scoring_events:
            raise HTTPException(
                status_code=409,
                detail="ruleset_id cannot be changed after analysis has started",
            )

    for field_name, field_value in updates.items():
        setattr(match, field_name, field_value)

    return {"message": "Match updated", "match": match.model_dump()}


@app.post("/scoring_events")
def create_scoring_event(scoring_event: ScoringEventCreate):
    match = get_match_or_404(scoring_event.match_id)

    if match.status not in {"processing", "ready_for_review"}:
        raise HTTPException(
            status_code=409,
            detail="scoring events can only be created after analysis has started",
        )

    stored_event = ScoringEvent(
        id=len(SCORING_EVENTS_BY_MATCH.get(scoring_event.match_id, [])) + 1,
        **scoring_event.model_dump(),
    )

    SCORING_EVENTS_BY_MATCH.setdefault(scoring_event.match_id, []).append(stored_event)

    return {"message": "Scoring event created", "event": stored_event.model_dump()}


@app.get("/matches/{match_id}/scoring_events")
def get_scoring_events(match_id: int):
    get_match_or_404(match_id)

    return {
        "match_id": match_id,
        "scoring_events": [
            scoring_event.model_dump()
            for scoring_event in SCORING_EVENTS_BY_MATCH.get(match_id, [])
        ],
    }


@app.patch("/matches/{match_id}/scoring_events/{event_id}/review")
def review_scoring_event(match_id: int, event_id: int, review: ScoringEventReview):
    event = get_scoring_event_or_404(match_id, event_id)

    event.review_status = review.review_status
    if review.review_note is not None:
        event.review_note = review.review_note

    return {"message": "Scoring event review status updated", "event": event.model_dump()}

@app.get("/matches/{match_id}/score_summary")
def get_match_score(match_id: int):
    get_match_or_404(match_id)

    scoring_events = SCORING_EVENTS_BY_MATCH.get(match_id, [])
    red_score_proposed = sum(event.points for event in scoring_events if event.team == "red" and event.review_status != "rejected")
    blue_score_proposed = sum(event.points for event in scoring_events if event.team == "blue" and event.review_status != "rejected")
    red_score_confirmed = sum(event.points for event in scoring_events if event.team == "red" and event.review_status == "accepted")
    blue_score_confirmed = sum(event.points for event in scoring_events if event.team == "blue" and event.review_status == "accepted")
    return {
        "match_id": match_id, 
        "proposed_score_summary": {
            "red": red_score_proposed,
            "blue": blue_score_proposed
        },
        "confirmed_score_summary": {
            "red": red_score_confirmed,
            "blue": blue_score_confirmed
        },  
        }

@app.post("/matches/{match_id}/analysis")
def start_match_analysis(match_id: int):
    match = get_match_or_404(match_id)

    if match.status != "created":
        raise HTTPException(status_code=409, detail="analysis has already been started for this match")

    match.status = "processing"

    return {"message": "Match analysis started", "match": match.model_dump()}
    

@app.get("/health")
def health_check():
    return {"status": "ok"}
