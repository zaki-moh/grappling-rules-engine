"""Scramble detector package.

Exposes the public entry point so callers can `from app.detectors.scramble
import detect_scrambles` without reaching into the module layout.
"""

from app.detectors.scramble.detector import detect_scrambles

__all__ = ["detect_scrambles"]
