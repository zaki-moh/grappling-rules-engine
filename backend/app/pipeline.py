"""Analysis pipeline orchestrator.

This is the CV boundary for the app: `main.py` calls `analyze_match_video` and
gets back `DetectedScoringEvent`s. The orchestrator wires the stages together --
shared video IO, detectors, and (eventually) reconcile -> enrich -> ruleset
scoring.

V1 status: the scramble detector runs (so it is exercised and can be logged /
inspected), but its output is not yet converted into scoring events. The API is
kept functional by bridging to deterministic mock events. Wiring `scrambles`
through enrichment and ruleset scoring is the next step.
"""

from pathlib import Path

from app.scoring import DetectedScoringEvent, build_mock_scoring_events
from app.scramble_detection import detect_scrambles
from app.video_io import get_video_metadata, sample_video_frames, save_debug_frames


def analyze_match_video(video_path: Path) -> list[DetectedScoringEvent]:
    """Analyze uploaded match footage and return proposed scoring events."""

    if not video_path.exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    metadata = get_video_metadata(video_path)
    sampled_frames = sample_video_frames(video_path, metadata)
    save_debug_frames(
        frames=sampled_frames,
        output_dir=video_path.parent / "debug_frames",
    )

    # Detector runs and is exercised end to end, but is not yet wired to output.
    # TODO: enrichment + ruleset scoring will consume `scrambles` here.
    scrambles = detect_scrambles(sampled_frames, metadata)

    return build_mock_scoring_events(metadata)
