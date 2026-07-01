"""Position timeline -- the spine of the match analysis.

A timeline is a continuous, non-overlapping sequence of `DetectedPositionSegment`s
covering the whole video. Events and analytics are both derived from it, so this
is the primitive everything else hangs off.

V1 status: `build_position_timeline` is a STUB -- it produces a deterministic,
duration-scaled grappling sequence so the product is demoable end to end. The one
genuinely real signal is folded in: real high-motion intervals from the scramble
detector overwrite the stubbed positions where they fire. Swapping in a real pose
+ position classifier later means replacing only this function; events and
analytics downstream are real and unchanged.
"""

from dataclasses import dataclass
from typing import Literal

from app.core.candidates import Candidate
from app.core.video_io import SampledFrame, VideoMetadata

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
Athlete = Literal["red", "blue"]


@dataclass(frozen=True)
class DetectedPositionSegment:
    """A contiguous stretch of the match in one position."""

    position: Position
    start_seconds: float
    end_seconds: float
    top_athlete: Athlete | None = None
    confidence: float | None = None


def format_seconds_as_timestamp(seconds: float) -> str:
    """Format a timestamp in seconds as a string (HH:MM:SS[.mmm])."""

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


# Deterministic stub sequence as (start_ratio, end_ratio, position, top_athlete).
# Chosen so the real event-derivation rules produce a varied, realistic breakdown:
# guard_pass -> mount_transition -> escape -> scramble -> sweep -> back_take -> escape.
_STUB_SEQUENCE: list[tuple[float, float, Position, Athlete | None]] = [
    (0.00, 0.08, "standing", None),
    (0.08, 0.18, "closed_guard", "red"),
    (0.18, 0.30, "side_control", "red"),
    (0.30, 0.40, "mount", "red"),
    (0.40, 0.50, "closed_guard", "red"),
    (0.50, 0.58, "scramble", None),
    (0.58, 0.68, "closed_guard", "blue"),
    (0.68, 0.78, "side_control", "red"),
    (0.78, 0.88, "back_control", "red"),
    (0.88, 1.00, "standing", None),
]

_STUB_CONFIDENCE = 0.55


def build_position_timeline(
    sampled_frames: list[SampledFrame],
    metadata: VideoMetadata,
    scrambles: list[Candidate],
) -> list[DetectedPositionSegment]:
    """Build a position timeline covering the whole video.

    STUB position sequence, with real scramble intervals painted over the top.
    """

    duration = metadata.duration_seconds
    if duration <= 0:
        return []

    base_specs = [
        (round(start_ratio * duration, 3), round(end_ratio * duration, 3), position, top)
        for start_ratio, end_ratio, position, top in _STUB_SEQUENCE
    ]

    scramble_intervals = _merge_intervals(
        [
            (round(max(0.0, c.start_seconds), 3), round(min(duration, c.end_seconds), 3))
            for c in scrambles
            if c.end_seconds > c.start_seconds
        ]
    )

    return _paint_timeline(base_specs, scramble_intervals, duration)


def _merge_intervals(intervals: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """Merge overlapping/touching intervals into a sorted, disjoint list."""

    merged: list[tuple[float, float]] = []
    for start, end in sorted(intervals):
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged


def _paint_timeline(
    base_specs: list[tuple[float, float, Position, Athlete | None]],
    scramble_intervals: list[tuple[float, float]],
    duration: float,
) -> list[DetectedPositionSegment]:
    """Overlay scramble intervals onto the base positions, then merge runs.

    Splits the timeline at every base/scramble boundary; each elementary slice is
    a scramble if covered by a real scramble interval, otherwise the underlying
    stub position. Adjacent slices with the same position+athlete are merged.
    """

    boundaries = {0.0, duration}
    for start, end, _, _ in base_specs:
        boundaries.update((start, end))
    for start, end in scramble_intervals:
        boundaries.update((start, end))

    points = sorted(point for point in boundaries if 0.0 <= point <= duration)

    slices: list[DetectedPositionSegment] = []
    for slice_start, slice_end in zip(points, points[1:]):
        if slice_end - slice_start <= 1e-6:
            continue

        midpoint = (slice_start + slice_end) / 2

        if any(start <= midpoint < end for start, end in scramble_intervals):
            slices.append(
                DetectedPositionSegment("scramble", slice_start, slice_end, None, 0.6)
            )
            continue

        base = next(
            (spec for spec in base_specs if spec[0] <= midpoint < spec[1]),
            None,
        )
        if base is None:
            slices.append(
                DetectedPositionSegment("unknown", slice_start, slice_end, None, 0.3)
            )
            continue

        _, _, position, top_athlete = base
        slices.append(
            DetectedPositionSegment(
                position, slice_start, slice_end, top_athlete, _STUB_CONFIDENCE
            )
        )

    return _merge_runs(slices)


def _merge_runs(
    segments: list[DetectedPositionSegment],
) -> list[DetectedPositionSegment]:
    """Collapse adjacent segments that share position + top_athlete."""

    merged: list[DetectedPositionSegment] = []
    for segment in segments:
        previous = merged[-1] if merged else None
        if (
            previous is not None
            and previous.position == segment.position
            and previous.top_athlete == segment.top_athlete
        ):
            merged[-1] = DetectedPositionSegment(
                position=previous.position,
                start_seconds=previous.start_seconds,
                end_seconds=segment.end_seconds,
                top_athlete=previous.top_athlete,
                confidence=previous.confidence,
            )
        else:
            merged.append(segment)
    return merged
