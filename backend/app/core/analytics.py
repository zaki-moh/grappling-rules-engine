"""Analytics aggregation -- the coach-facing summary.

Everything here is derived from the (effective) position timeline and events:
control time and time-in-position come from segment durations, counts come from
events, and an optional confidence-gated point estimate comes from scoring-worthy
events. This logic is REAL and survives the swap to a true classifier.

`build_analytics` takes *effective* values -- i.e. with coach corrections already
applied and rejected events removed -- so the summary recomputes correctly after
a review edit. It reads attributes only (`position`, `start_seconds`,
`end_seconds`, `top_athlete` on segments; `event_type`, `athlete`, `confidence`
on events), so both the core dataclasses and the API models can be passed in.
"""

from dataclasses import dataclass, field
from typing import Literal, Protocol

Athlete = Literal["red", "blue"]

CONTROL_POSITIONS: frozenset[str] = frozenset(
    {"side_control", "mount", "back_control", "turtle"}
)

# Confidence floor for an event to contribute to the optional point estimate.
CONFIDENCE_GATE = 0.7

# Rough IBJJF-style values for the gated point estimate (descriptive, not authoritative).
EVENT_POINTS: dict[str, int] = {
    "guard_pass": 3,
    "sweep": 2,
    "reversal": 2,
    "mount_transition": 4,
    "back_take": 4,
    "submission_attempt": 0,
    "escape": 0,
    "scramble": 0,
}

# Which event types increment which per-athlete counters.
_COUNT_FIELDS: dict[str, str] = {
    "guard_pass": "guard_passes",
    "sweep": "sweeps",
    "reversal": "sweeps",
    "back_take": "back_takes",
    "submission_attempt": "submission_attempts",
    "escape": "escapes",
}


class _SegmentLike(Protocol):
    position: str
    start_seconds: float
    end_seconds: float
    top_athlete: Athlete | None


class _EventLike(Protocol):
    event_type: str
    athlete: Athlete | None
    confidence: float | None


@dataclass
class AthleteAnalytics:
    guard_passes: int = 0
    sweeps: int = 0
    back_takes: int = 0
    submission_attempts: int = 0
    escapes: int = 0
    control_time_seconds: float = 0.0


@dataclass(frozen=True)
class Transition:
    timestamp_seconds: float
    from_position: str
    to_position: str
    top_athlete: Athlete | None


@dataclass
class AnalyticsSummary:
    red: AthleteAnalytics = field(default_factory=AthleteAnalytics)
    blue: AthleteAnalytics = field(default_factory=AthleteAnalytics)
    time_in_position: dict[str, float] = field(default_factory=dict)
    major_transitions: list[Transition] = field(default_factory=list)
    estimated_points: dict[str, int] | None = None


def build_analytics(
    segments: list[_SegmentLike],
    events: list[_EventLike],
) -> AnalyticsSummary:
    """Aggregate the timeline + events into a coach-facing summary."""

    summary = AnalyticsSummary()
    per_athlete = {"red": summary.red, "blue": summary.blue}

    # Control time + time-in-position from segment durations.
    for segment in segments:
        duration = max(0.0, segment.end_seconds - segment.start_seconds)
        summary.time_in_position[segment.position] = round(
            summary.time_in_position.get(segment.position, 0.0) + duration, 3
        )
        if segment.position in CONTROL_POSITIONS and segment.top_athlete in per_athlete:
            athlete = per_athlete[segment.top_athlete]
            athlete.control_time_seconds = round(
                athlete.control_time_seconds + duration, 3
            )

    # Major transitions = every position change along the timeline.
    for previous, current in zip(segments, segments[1:]):
        if previous.position != current.position:
            summary.major_transitions.append(
                Transition(
                    timestamp_seconds=round(current.start_seconds, 3),
                    from_position=previous.position,
                    to_position=current.position,
                    top_athlete=current.top_athlete,
                )
            )

    # Per-athlete event counts + optional gated point estimate.
    gated_points = {"red": 0, "blue": 0}
    any_gated = False
    for event in events:
        if event.athlete in per_athlete:
            count_field = _COUNT_FIELDS.get(event.event_type)
            if count_field is not None:
                athlete = per_athlete[event.athlete]
                setattr(athlete, count_field, getattr(athlete, count_field) + 1)

            confidence = event.confidence if event.confidence is not None else 0.0
            points = EVENT_POINTS.get(event.event_type, 0)
            if points > 0 and confidence >= CONFIDENCE_GATE:
                gated_points[event.athlete] += points
                any_gated = True

    summary.estimated_points = gated_points if any_gated else None
    return summary
