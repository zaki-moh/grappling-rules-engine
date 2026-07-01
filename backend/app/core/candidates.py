"""Detector-agnostic candidate contract.

Every detector (scramble, and later slow-control, submissions, stalling, ...)
emits the same `Candidate` type: a time interval, a confidence, a `source` tag
identifying which detector produced it, and any supporting evidence. Downstream
stages (reconcile -> enrich -> ruleset scoring) consume `Candidate`s without
knowing or caring which detector created them.

This module deliberately has no dependencies beyond the standard library so any
detector can import it without creating import cycles.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class StabilityCheck:
    """Result of asking "was motion calm over this window?" for one side."""

    is_stable: bool
    motion_score: float
    window_start_seconds: float
    window_end_seconds: float


@dataclass(frozen=True)
class Candidate:
    """A proposed point of interest in a match, emitted by one detector.

    Carries only the interval and supporting evidence -- no positions, teams, or
    points. Those are assigned later by the enrichment and ruleset-scoring
    stages, which is what keeps detectors decoupled from scoring.
    """

    source: str
    start_seconds: float
    peak_seconds: float
    end_seconds: float
    confidence: float | None = None
    stability_before: StabilityCheck | None = None
    stability_after: StabilityCheck | None = None
