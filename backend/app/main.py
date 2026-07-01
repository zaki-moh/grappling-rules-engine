from dataclasses import asdict
from pathlib import Path
import shutil
from typing import Literal

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.core.analytics import build_analytics
from app.core.timeline import format_seconds_as_timestamp
from app.pipeline import analyze_match_video

RulesetType = Literal["system", "custom"]
MatchStatus = Literal["created", "processing", "analyzed", "failed"]
ReviewStatus = Literal["pending", "confirmed", "corrected", "rejected"]
CompetitorSide = Literal["red", "blue"]
Position = Literal[
    "standing",
    "closed_guard",
    "half_guard",
    "side_control",
    "mount",
    "back_control",
    "turtle",
    "scramble",
    "unknown",
]
EventType = Literal[
    "guard_pass",
    "sweep",
    "reversal",
    "submission_attempt",
    "escape",
    "back_take",
    "mount_transition",
    "scramble",
]


class Ruleset(BaseModel):
    """A reusable scoring rules definition such as IBJJF or ADCC."""

    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    type: RulesetType
    description: str | None = None


class MatchCreate(BaseModel):
    """Request body for creating a match analysis session."""

    ruleset_id: str | None = None
    red_competitor: str | None = None
    blue_competitor: str | None = None


class MatchUpdate(BaseModel):
    """Request body for updating match metadata."""

    ruleset_id: str | None = None
    red_competitor: str | None = None
    blue_competitor: str | None = None
    status: MatchStatus | None = None


class Match(BaseModel):
    """A single bout being analyzed."""

    id: int = Field(gt=0)
    ruleset_id: str | None = None
    red_competitor: str | None = None
    blue_competitor: str | None = None
    status: MatchStatus = "created"
    video_filename: str | None = None
    video_path: str | None = None
    video_content_type: str | None = None
    video_size_bytes: int | None = Field(default=None, ge=0)


class PositionSegment(BaseModel):
    """A contiguous stretch of the match in one position."""

    id: int = Field(gt=0)
    match_id: int = Field(gt=0)
    position: Position
    start_seconds: float = Field(ge=0)
    end_seconds: float = Field(ge=0)
    top_athlete: CompetitorSide | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    review_status: ReviewStatus = "pending"
    corrected_position: Position | None = None
    corrected_top_athlete: CompetitorSide | None = None
    review_note: str | None = None


class MatchEvent(BaseModel):
    """A descriptive (non-scoring) event located on the match timeline."""

    id: int = Field(gt=0)
    match_id: int = Field(gt=0)
    event_type: EventType
    timestamp_seconds: float = Field(ge=0)
    timestamp: str
    athlete: CompetitorSide | None = None
    from_position: Position | None = None
    to_position: Position | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    replay_start_seconds: float = Field(ge=0)
    replay_end_seconds: float = Field(ge=0)
    review_status: ReviewStatus = "pending"
    corrected_event_type: EventType | None = None
    corrected_athlete: CompetitorSide | None = None
    review_note: str | None = None


class SegmentReview(BaseModel):
    """Coach correction applied to a position segment."""

    review_status: ReviewStatus
    corrected_position: Position | None = None
    corrected_top_athlete: CompetitorSide | None = None
    review_note: str | None = None


class EventReview(BaseModel):
    """Coach correction applied to a match event."""

    review_status: ReviewStatus
    corrected_event_type: EventType | None = None
    corrected_athlete: CompetitorSide | None = None
    review_note: str | None = None


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    "Custom": Ruleset(
        id="Custom",
        name="Custom",
        type="custom",
        description="A gym-defined ruleset.",
    ),
}

MATCHES: list[Match] = []
POSITION_SEGMENTS_BY_MATCH: dict[int, list[PositionSegment]] = {}
EVENTS_BY_MATCH: dict[int, list[MatchEvent]] = {}
UPLOAD_ROOT = Path(__file__).resolve().parents[1] / "uploads"


def get_match_or_404(match_id: int) -> Match:
    match = next((stored for stored in MATCHES if stored.id == match_id), None)
    if match is None:
        raise HTTPException(status_code=404, detail="match not found")
    return match


def get_segment_or_404(match_id: int, segment_id: int) -> PositionSegment:
    get_match_or_404(match_id)
    segments = POSITION_SEGMENTS_BY_MATCH.get(match_id, [])
    segment = next((stored for stored in segments if stored.id == segment_id), None)
    if segment is None:
        raise HTTPException(status_code=404, detail="position segment not found")
    return segment


def get_event_or_404(match_id: int, event_id: int) -> MatchEvent:
    get_match_or_404(match_id)
    events = EVENTS_BY_MATCH.get(match_id, [])
    event = next((stored for stored in events if stored.id == event_id), None)
    if event is None:
        raise HTTPException(status_code=404, detail="match event not found")
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
    if match.ruleset_id is not None and match.ruleset_id not in RULESETS:
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


@app.post("/matches/{match_id}/video")
def upload_match_video(match_id: int, video: UploadFile = File(...)):
    match = get_match_or_404(match_id)

    if match.status != "created":
        raise HTTPException(
            status_code=409,
            detail="video can only be uploaded before analysis starts",
        )

    if video.content_type is None or not video.content_type.startswith("video/"):
        raise HTTPException(status_code=415, detail="uploaded file must be a video")

    filename = video.filename or "match-video"
    file_extension = Path(filename).suffix.lower() or ".mp4"
    match_upload_dir = UPLOAD_ROOT / "matches" / str(match_id)
    match_upload_dir.mkdir(parents=True, exist_ok=True)

    stored_video_path = match_upload_dir / f"source{file_extension}"
    with stored_video_path.open("wb") as stored_video:
        shutil.copyfileobj(video.file, stored_video)

    match.video_filename = filename
    match.video_path = str(stored_video_path)
    match.video_content_type = video.content_type
    match.video_size_bytes = stored_video_path.stat().st_size

    return {
        "message": "Match video uploaded",
        "match": match.model_dump(),
        "video": {
            "filename": match.video_filename,
            "content_type": match.video_content_type,
            "size_bytes": match.video_size_bytes,
        },
    }


@app.get("/matches/{match_id}/video")
def get_match_video(match_id: int):
    match = get_match_or_404(match_id)

    if match.video_path is None:
        raise HTTPException(status_code=404, detail="match video not found")

    video_path = Path(match.video_path)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="match video file not found")

    return FileResponse(
        path=video_path,
        media_type=match.video_content_type or "video/mp4",
        filename=match.video_filename,
        content_disposition_type="inline",
    )


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
        has_segments = len(POSITION_SEGMENTS_BY_MATCH.get(match_id, [])) > 0
        if match.status != "created" or has_segments:
            raise HTTPException(
                status_code=409,
                detail="ruleset_id cannot be changed after analysis has started",
            )

    for field_name, field_value in updates.items():
        setattr(match, field_name, field_value)

    return {"message": "Match updated", "match": match.model_dump()}


@app.post("/matches/{match_id}/analysis")
def start_match_analysis(match_id: int):
    match = get_match_or_404(match_id)

    if match.status != "created":
        raise HTTPException(
            status_code=409, detail="analysis has already been started for this match"
        )
    if match.video_path is None:
        raise HTTPException(
            status_code=409, detail="upload match video before starting analysis"
        )

    match.status = "processing"
    try:
        result = analyze_match_video(Path(match.video_path))
    except Exception as error:  # noqa: BLE001 - surface any analysis failure to the client
        match.status = "failed"
        raise HTTPException(status_code=500, detail=f"analysis failed: {error}")

    POSITION_SEGMENTS_BY_MATCH[match_id] = [
        PositionSegment(
            id=index + 1,
            match_id=match_id,
            position=segment.position,
            start_seconds=round(segment.start_seconds, 3),
            end_seconds=round(segment.end_seconds, 3),
            top_athlete=segment.top_athlete,
            confidence=segment.confidence,
        )
        for index, segment in enumerate(result.segments)
    ]

    EVENTS_BY_MATCH[match_id] = [
        MatchEvent(
            id=index + 1,
            match_id=match_id,
            event_type=event.event_type,
            timestamp_seconds=round(event.timestamp_seconds, 3),
            timestamp=format_seconds_as_timestamp(event.timestamp_seconds),
            athlete=event.athlete,
            from_position=event.from_position,
            to_position=event.to_position,
            confidence=event.confidence,
            replay_start_seconds=event.replay_start_seconds,
            replay_end_seconds=event.replay_end_seconds,
        )
        for index, event in enumerate(result.events)
    ]

    match.status = "analyzed"

    return {
        "message": "Match analysis completed",
        "match": match.model_dump(),
        "created_segments": len(result.segments),
        "created_events": len(result.events),
    }


@app.get("/matches/{match_id}/position_timeline")
def get_position_timeline(match_id: int):
    get_match_or_404(match_id)
    return {
        "match_id": match_id,
        "position_segments": [
            segment.model_dump()
            for segment in POSITION_SEGMENTS_BY_MATCH.get(match_id, [])
        ],
    }


@app.get("/matches/{match_id}/events")
def get_match_events(match_id: int):
    get_match_or_404(match_id)
    return {
        "match_id": match_id,
        "events": [event.model_dump() for event in EVENTS_BY_MATCH.get(match_id, [])],
    }


@app.get("/matches/{match_id}/analytics")
def get_match_analytics(match_id: int):
    get_match_or_404(match_id)

    segments = [
        _effective_segment(segment)
        for segment in POSITION_SEGMENTS_BY_MATCH.get(match_id, [])
    ]
    events = [
        _effective_event(event)
        for event in EVENTS_BY_MATCH.get(match_id, [])
        if event.review_status != "rejected"
    ]

    summary = build_analytics(segments, events)
    return {"match_id": match_id, "analytics": asdict(summary)}


@app.patch("/matches/{match_id}/segments/{segment_id}/review")
def review_position_segment(match_id: int, segment_id: int, review: SegmentReview):
    segment = get_segment_or_404(match_id, segment_id)

    segment.review_status = review.review_status
    if review.corrected_position is not None:
        segment.corrected_position = review.corrected_position
    if review.corrected_top_athlete is not None:
        segment.corrected_top_athlete = review.corrected_top_athlete
    if review.review_note is not None:
        segment.review_note = review.review_note

    return {"message": "Position segment review updated", "segment": segment.model_dump()}


@app.patch("/matches/{match_id}/events/{event_id}/review")
def review_match_event(match_id: int, event_id: int, review: EventReview):
    event = get_event_or_404(match_id, event_id)

    event.review_status = review.review_status
    if review.corrected_event_type is not None:
        event.corrected_event_type = review.corrected_event_type
    if review.corrected_athlete is not None:
        event.corrected_athlete = review.corrected_athlete
    if review.review_note is not None:
        event.review_note = review.review_note

    return {"message": "Match event review updated", "event": event.model_dump()}


@app.get("/health")
def health_check():
    return {"status": "ok"}


class _EffectiveSegment(BaseModel):
    position: Position
    start_seconds: float
    end_seconds: float
    top_athlete: CompetitorSide | None = None


class _EffectiveEvent(BaseModel):
    event_type: EventType
    athlete: CompetitorSide | None = None
    confidence: float | None = None


def _effective_segment(segment: PositionSegment) -> _EffectiveSegment:
    """Apply a coach correction (if any) before analytics aggregation."""

    if segment.review_status == "corrected":
        position = segment.corrected_position or segment.position
        top_athlete = (
            segment.corrected_top_athlete
            if segment.corrected_top_athlete is not None
            else segment.top_athlete
        )
    else:
        position = segment.position
        top_athlete = segment.top_athlete

    return _EffectiveSegment(
        position=position,
        start_seconds=segment.start_seconds,
        end_seconds=segment.end_seconds,
        top_athlete=top_athlete,
    )


def _effective_event(event: MatchEvent) -> _EffectiveEvent:
    """Apply a coach correction (if any) before analytics aggregation."""

    if event.review_status == "corrected":
        event_type = event.corrected_event_type or event.event_type
        athlete = (
            event.corrected_athlete
            if event.corrected_athlete is not None
            else event.athlete
        )
    else:
        event_type = event.event_type
        athlete = event.athlete

    return _EffectiveEvent(
        event_type=event_type, athlete=athlete, confidence=event.confidence
    )
