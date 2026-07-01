"""Event derivation -- events fall out of the position timeline.

Most grappling events ARE position transitions: a guard pass is guard -> side
control, a back take is anything -> back control, an escape is a disadvantaged
position -> guard/standing. So `derive_events_from_timeline` reads consecutive
segments and emits the corresponding event. This logic is REAL and carries over
unchanged once a true position classifier replaces the stubbed timeline.

The exceptions that are not pure position transitions:
- scramble: emitted when the timeline enters a scramble segment (the segment
  itself comes from the real motion detector via the timeline builder).
- submission attempt: has no positional signal, so `detect_submission_attempts`
  is a deterministic STUB until a real detector exists.
"""

from dataclasses import dataclass
from typing import Literal

from app.core.timeline import (
    Athlete,
    DetectedPositionSegment,
    Position,
    build_replay_window,
)
from app.core.video_io import VideoMetadata

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

GUARD_POSITIONS: frozenset[Position] = frozenset({"closed_guard", "half_guard"})
CONTROL_POSITIONS: frozenset[Position] = frozenset(
    {"side_control", "mount", "back_control", "turtle"}
)

_DERIVED_CONFIDENCE = 0.8
_SUBMISSION_CONFIDENCE = 0.5


@dataclass(frozen=True)
class DetectedEvent:
    """A descriptive (non-scoring) event located on the match timeline."""

    event_type: EventType
    timestamp_seconds: float
    athlete: Athlete | None
    from_position: Position | None
    to_position: Position | None
    confidence: float | None
    replay_start_seconds: float
    replay_end_seconds: float


def _other(athlete: Athlete | None) -> Athlete | None:
    """The opposing athlete, or None if unknown."""

    if athlete == "red":
        return "blue"
    if athlete == "blue":
        return "red"
    return None


def derive_events_from_timeline(
    segments: list[DetectedPositionSegment],
) -> list[DetectedEvent]:
    """Emit one event (at most) per consecutive position transition.

    Rules are checked in priority order so each transition yields a single,
    unambiguous event.
    """

    if not segments:
        return []

    duration = segments[-1].end_seconds
    events: list[DetectedEvent] = []

    for previous, current in zip(segments, segments[1:]):
        event = _classify_transition(previous, current, duration)
        if event is not None:
            events.append(event)

    return events


def _classify_transition(
    previous: DetectedPositionSegment,
    current: DetectedPositionSegment,
    duration: float,
) -> DetectedEvent | None:
    """Map a single A -> B position transition to an event, if any."""

    at_seconds = current.start_seconds
    top_changed = (
        previous.top_athlete is not None
        and current.top_athlete is not None
        and previous.top_athlete != current.top_athlete
    )

    # 1. Scramble: entering a scramble segment.
    if current.position == "scramble" and previous.position != "scramble":
        return _event("scramble", at_seconds, None, previous, current, duration)

    # 2. Back take: anything -> back control.
    if current.position == "back_control" and previous.position != "back_control":
        return _event("back_take", at_seconds, current.top_athlete, previous, current, duration)

    # 3. Mount transition: side control -> mount (same top athlete advancing).
    if current.position == "mount" and previous.position in CONTROL_POSITIONS:
        return _event("mount_transition", at_seconds, current.top_athlete, previous, current, duration)

    # 4. Guard pass: passer goes from inside the guard to a control position.
    if (
        previous.position in GUARD_POSITIONS
        and current.position in CONTROL_POSITIONS
        and not top_changed
    ):
        return _event("guard_pass", at_seconds, current.top_athlete, previous, current, duration)

    # 5. Sweep / reversal: the top athlete flips. From guard it's a sweep; from a
    #    control position (escaping from underneath) it's a reversal.
    if top_changed and previous.position in GUARD_POSITIONS:
        return _event("sweep", at_seconds, current.top_athlete, previous, current, duration)
    if top_changed and previous.position in CONTROL_POSITIONS:
        return _event("reversal", at_seconds, current.top_athlete, previous, current, duration)

    # 6. Escape: a disadvantaged position recovered to guard/standing by the
    #    athlete who was on the bottom.
    if previous.position in CONTROL_POSITIONS and current.position in (
        GUARD_POSITIONS | {"standing"}
    ):
        escaper = _other(previous.top_athlete)
        return _event("escape", at_seconds, escaper, previous, current, duration)

    return None


def _event(
    event_type: EventType,
    at_seconds: float,
    athlete: Athlete | None,
    previous: DetectedPositionSegment,
    current: DetectedPositionSegment,
    duration: float,
) -> DetectedEvent:
    replay_start, replay_end = build_replay_window(at_seconds, duration)
    return DetectedEvent(
        event_type=event_type,
        timestamp_seconds=round(at_seconds, 3),
        athlete=athlete,
        from_position=previous.position,
        to_position=current.position,
        confidence=_DERIVED_CONFIDENCE,
        replay_start_seconds=replay_start,
        replay_end_seconds=replay_end,
    )


def detect_submission_attempts(
    segments: list[DetectedPositionSegment],
    metadata: VideoMetadata,
) -> list[DetectedEvent]:
    """STUB: surface a placeholder submission attempt during a control segment.

    Submission attempts have no positional signal, so until a real detector
    exists we deterministically flag one mid-way through the longest control
    segment (if any), at low confidence so it does not contribute points.
    """

    control_segments = [
        segment for segment in segments if segment.position in CONTROL_POSITIONS
    ]
    if not control_segments:
        return []

    target = max(control_segments, key=lambda s: s.end_seconds - s.start_seconds)
    at_seconds = round((target.start_seconds + target.end_seconds) / 2, 3)
    replay_start, replay_end = build_replay_window(at_seconds, metadata.duration_seconds)

    return [
        DetectedEvent(
            event_type="submission_attempt",
            timestamp_seconds=at_seconds,
            athlete=target.top_athlete,
            from_position=target.position,
            to_position=target.position,
            confidence=_SUBMISSION_CONFIDENCE,
            replay_start_seconds=replay_start,
            replay_end_seconds=replay_end,
        )
    ]
