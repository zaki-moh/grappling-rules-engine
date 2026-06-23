"""Scoring / output layer.

This is the single place where the pipeline turns analyzed actions into
point-bearing `DetectedScoringEvent`s (the contract the API and review UI
consume). Ruleset differences (IBJJF vs ADCC vs Custom) belong here and only
here -- detectors never assign points.

For V1 the real action -> event conversion is not built yet, so the pipeline
bridges to `build_mock_scoring_events`, which produces deterministic placeholder
events from real video timing so the review UI stays functional end to end.
"""

from dataclasses import dataclass
from typing import Literal

from app.video_io import VideoMetadata

DetectedTeam = Literal["red", "blue"]


@dataclass(frozen=True)
class DetectedScoringEvent:
    """A CV-proposed scoring event produced from match footage."""

    event_type: str
    team: DetectedTeam
    points: int
    timestamp: str
    replay_start_seconds: float
    replay_end_seconds: float
    position: str
    confidence: float | None = None


def format_seconds_as_timestamp(seconds: float) -> str:
    """Format a timestamp in seconds as a string."""

    clamped_seconds = max(0, seconds)
    whole_seconds = int(clamped_seconds)
    milliseconds = round((clamped_seconds - whole_seconds) * 1000)

    if milliseconds == 1000:
        whole_seconds += 1
        milliseconds = 0

    hours = whole_seconds // 3600
    minutes = (whole_seconds % 3600) // 60
    remaining_seconds = whole_seconds % 60

    if milliseconds == 0:
        return f"{hours:02d}:{minutes:02d}:{remaining_seconds:02d}"

    return f"{hours:02d}:{minutes:02d}:{remaining_seconds:02d}.{milliseconds:03d}"


def build_replay_window(
    event_seconds: float,
    duration_seconds: float,
    replay_padding_seconds: float = 3.0,
) -> tuple[float, float]:
    """Build a replay window around an event while staying inside the video."""

    replay_start = max(0, event_seconds - replay_padding_seconds)
    replay_end = min(duration_seconds, event_seconds + replay_padding_seconds)

    return round(replay_start, 3), round(replay_end, 3)


def build_mock_scoring_events(metadata: VideoMetadata) -> list[DetectedScoringEvent]:
    """Return deterministic mock scoring events using real video timing."""

    if metadata.duration_seconds < 1:
        return []

    mock_event_specs = [
        {
            "event_time_ratio": 0.35,
            "event_type": "takedown",
            "team": "red",
            "points": 2,
            "position": "top control",
            "confidence": 0.62,
        },
        {
            "event_time_ratio": 0.68,
            "event_type": "guard pass",
            "team": "blue",
            "points": 3,
            "position": "side control",
            "confidence": 0.58,
        },
        {
            "event_time_ratio": 0.82,
            "event_type": "sweep",
            "team": "blue",
            "points": 3,
            "position": "side control",
            "confidence": 0.88,
        },
    ]

    mock_events: list[DetectedScoringEvent] = []

    for spec in mock_event_specs:
        event_seconds = metadata.duration_seconds * spec["event_time_ratio"]
        replay_start_seconds, replay_end_seconds = build_replay_window(
            event_seconds=event_seconds,
            duration_seconds=metadata.duration_seconds,
        )

        mock_events.append(
            DetectedScoringEvent(
                event_type=spec["event_type"],
                team=spec["team"],
                points=spec["points"],
                timestamp=format_seconds_as_timestamp(event_seconds),
                replay_start_seconds=replay_start_seconds,
                replay_end_seconds=replay_end_seconds,
                position=spec["position"],
                confidence=spec["confidence"],
            )
        )

    return mock_events
