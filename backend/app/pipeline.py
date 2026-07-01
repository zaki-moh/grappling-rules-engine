"""Analysis pipeline orchestrator.

This is the CV boundary for the app: `main.py` calls `analyze_match_video` and
gets back a position timeline + derived events. The orchestrator wires the
stages together -- shared video IO, the scramble detector, the (stubbed)
position-timeline builder, and the (real) event-derivation stage.

Analytics are NOT computed here; they are derived on read in the API so that
coach corrections are reflected without re-running analysis.
"""

from dataclasses import dataclass
from pathlib import Path

from app.core.events import (
    DetectedEvent,
    derive_events_from_timeline,
    detect_submission_attempts,
)
from app.core.timeline import DetectedPositionSegment, build_position_timeline
from app.core.video_io import (
    get_video_metadata,
    sample_video_frames,
    save_debug_frames,
)
from app.detectors.scramble import detect_scrambles


@dataclass(frozen=True)
class AnalysisResult:
    """The structured output of analyzing one match video."""

    segments: list[DetectedPositionSegment]
    events: list[DetectedEvent]


def analyze_match_video(video_path: Path) -> AnalysisResult:
    """Analyze uploaded match footage into a position timeline + events."""

    if not video_path.exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    metadata = get_video_metadata(video_path)
    sampled_frames = sample_video_frames(video_path, metadata)
    save_debug_frames(
        frames=sampled_frames,
        output_dir=video_path.parent / "debug_frames",
    )

    # Real motion signal -> folded into the (stubbed) position timeline.
    scrambles = detect_scrambles(sampled_frames, metadata)
    segments = build_position_timeline(sampled_frames, metadata, scrambles)

    # Real derivation: most events are position transitions; submission is a stub.
    events = derive_events_from_timeline(segments)
    events += detect_submission_attempts(segments, metadata)
    events.sort(key=lambda event: event.timestamp_seconds)

    return AnalysisResult(segments=segments, events=events)
