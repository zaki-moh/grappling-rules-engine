"""Scramble detector.

Does exactly one thing: find high-motion intervals (scrambles -- where the two
athletes are battling for control) and check whether motion settles before and
after each one. It assigns no points and reads no positions; it only proposes
`Candidate`s for downstream enrichment and ruleset scoring to interpret.

Pipeline: detect_scramble_windows -> analyze_window_stability -> build_scrambles
(chained by the public `detect_scrambles`).
"""

from dataclasses import dataclass

import cv2
import numpy as np

from app.candidates import Candidate, StabilityCheck
from app.video_io import SampledFrame, VideoMetadata

# How far before/after a high-motion window we look for the action to settle.
PRE_CONTEXT_SECONDS = 3.0
POST_CONTEXT_SECONDS = 3.0


@dataclass(frozen=True)
class CandidateWindow:
    """A raw high-motion window before any stability reasoning is applied."""

    start_index: int
    end_index: int
    peak_index: int
    start_seconds: float
    end_seconds: float
    peak_seconds: float
    motion_score: float


@dataclass(frozen=True)
class WindowStability:
    """The before/after stability checks for a single candidate window."""

    before: StabilityCheck | None
    after: StabilityCheck | None


def detect_scramble_windows(
    sampled_frames: list[SampledFrame],
    metadata: VideoMetadata,
    window_size: int = 5,
    motion_threshold: float = 15.0,
) -> list[CandidateWindow]:
    """Detect high-motion windows that may contain score-relevant actions."""

    if window_size < 2:
        raise ValueError("window_size must be at least 2")
    if motion_threshold < 0:
        raise ValueError("motion_threshold must be greater than or equal to 0")
    if len(sampled_frames) < window_size:
        return []

    candidate_windows: list[CandidateWindow] = []
    gray_frames: list[np.ndarray] = []

    for frame in sampled_frames:
        gray_image = cv2.cvtColor(frame.image, cv2.COLOR_BGR2GRAY)
        gray_frames.append(gray_image)

    for start_index in range(0, len(gray_frames) - window_size + 1):
        gray_window = gray_frames[start_index : start_index + window_size]

        motion_scores: list[float] = []
        for index in range(1, len(gray_window)):
            prev = gray_window[index - 1]
            curr = gray_window[index]
            frame_diff = cv2.absdiff(curr, prev)
            motion_score = float(np.mean(frame_diff))
            motion_scores.append(motion_score)

        if not motion_scores:
            continue

        window_motion_score = sum(motion_scores) / len(motion_scores)

        if window_motion_score > motion_threshold:
            start_seconds = sampled_frames[start_index].timestamp_seconds
            end_seconds = sampled_frames[start_index + window_size - 1].timestamp_seconds
            peak_motion_index = motion_scores.index(max(motion_scores))
            peak_frame_index = start_index + peak_motion_index + 1
            peak_seconds = sampled_frames[peak_frame_index].timestamp_seconds

            candidate_windows.append(
                CandidateWindow(
                    start_index=start_index,
                    end_index=start_index + window_size - 1,
                    peak_index=peak_frame_index,
                    start_seconds=start_seconds,
                    end_seconds=end_seconds,
                    peak_seconds=peak_seconds,
                    motion_score=window_motion_score,
                )
            )

    return candidate_windows


def analyze_window_stability(
    time_windows: list[CandidateWindow],
    sampled_frames: list[SampledFrame],
) -> list[WindowStability]:
    """Measure whether motion settled in the seconds before and after each window.

    A real scoring action tends to be a burst of motion bracketed by relative
    stillness (settle -> explode -> settle); continuous thrashing will not have
    stable borders.
    """

    window_stability_checks: list[WindowStability] = []

    for window in time_windows:
        target_start_seconds = window.start_seconds - PRE_CONTEXT_SECONDS
        cur_idx = window.start_index - 1
        prev_gray = cv2.cvtColor(sampled_frames[window.start_index].image, cv2.COLOR_BGR2GRAY)
        start_window_motion_scores: list[float] = []

        before_stability_check: StabilityCheck | None = None

        while cur_idx >= 0:
            cur_frame = sampled_frames[cur_idx]
            if cur_frame.timestamp_seconds < target_start_seconds:
                break

            cur_gray = cv2.cvtColor(cur_frame.image, cv2.COLOR_BGR2GRAY)
            frame_diff = cv2.absdiff(prev_gray, cur_gray)
            start_window_motion_scores.append(float(np.mean(frame_diff)))

            prev_gray = cur_gray
            cur_idx -= 1

        if start_window_motion_scores:
            avg_motion = sum(start_window_motion_scores) / len(start_window_motion_scores)
            target_start_seconds = max(
                sampled_frames[0].timestamp_seconds,
                window.start_seconds - PRE_CONTEXT_SECONDS,
            )

            stability_threshold = min(7.5, window.motion_score * 0.5)

            before_stability_check = StabilityCheck(
                is_stable=avg_motion < stability_threshold,
                motion_score=avg_motion,
                window_start_seconds=target_start_seconds,
                window_end_seconds=window.start_seconds,
            )

        target_end_seconds = window.end_seconds + POST_CONTEXT_SECONDS
        cur_idx = window.end_index + 1
        prev_gray = cv2.cvtColor(sampled_frames[window.end_index].image, cv2.COLOR_BGR2GRAY)
        end_window_motion_scores: list[float] = []

        after_stability_check: StabilityCheck | None = None

        while cur_idx < len(sampled_frames):
            cur_frame = sampled_frames[cur_idx]
            if cur_frame.timestamp_seconds > target_end_seconds:
                break

            cur_gray = cv2.cvtColor(cur_frame.image, cv2.COLOR_BGR2GRAY)
            frame_diff = cv2.absdiff(prev_gray, cur_gray)
            end_window_motion_scores.append(float(np.mean(frame_diff)))

            prev_gray = cur_gray
            cur_idx += 1

        if end_window_motion_scores:
            avg_motion = sum(end_window_motion_scores) / len(end_window_motion_scores)
            target_end_seconds = min(
                sampled_frames[-1].timestamp_seconds,
                window.end_seconds + POST_CONTEXT_SECONDS,
            )

            stability_threshold = min(7.5, window.motion_score * 0.5)

            after_stability_check = StabilityCheck(
                is_stable=avg_motion < stability_threshold,
                motion_score=avg_motion,
                window_start_seconds=window.end_seconds,
                window_end_seconds=target_end_seconds,
            )

        window_stability_checks.append(
            WindowStability(
                before=before_stability_check,
                after=after_stability_check,
            )
        )

    return window_stability_checks


def build_scrambles(
    candidate_windows: list[CandidateWindow],
    window_stabilities: list[WindowStability],
) -> list[Candidate]:
    """Promote stability-bracketed windows into scramble `Candidate`s.

    Interior windows require both sides to be stable; the first window is judged
    only on its trailing side and the last only on its leading side, since one
    side runs off the edge of the footage.

    NOTE: the single-window case is matched by the `i == 0` branch and so is
    judged on its `after` side only; windows whose relevant side is `None`
    (not enough frames to measure) are dropped. These edge cases are preserved
    from the original behavior and are flagged for a future detection pass.
    """

    if len(candidate_windows) != len(window_stabilities):
        raise ValueError(
            "candidate_windows and window_stabilities must have the same length"
        )

    scrambles: list[Candidate] = []

    for i in range(len(candidate_windows)):
        cur_window = candidate_windows[i]
        cur_window_stability = window_stabilities[i]

        if i == 0 and cur_window_stability.after and cur_window_stability.after.is_stable:
            scrambles.append(
                _to_candidate(
                    cur_window,
                    stability_before=None,
                    stability_after=cur_window_stability.after,
                )
            )
            continue

        if (i == len(candidate_windows) - 1) and cur_window_stability.before and cur_window_stability.before.is_stable:
            scrambles.append(
                _to_candidate(
                    cur_window,
                    stability_before=cur_window_stability.before,
                    stability_after=None,
                )
            )
            continue

        if cur_window_stability.before and cur_window_stability.after:
            if cur_window_stability.before.is_stable and cur_window_stability.after.is_stable:
                scrambles.append(
                    _to_candidate(
                        cur_window,
                        stability_before=cur_window_stability.before,
                        stability_after=cur_window_stability.after,
                    )
                )

    return scrambles


def _to_candidate(
    window: CandidateWindow,
    stability_before: StabilityCheck | None,
    stability_after: StabilityCheck | None,
) -> Candidate:
    """Wrap a stability-gated window as a source-tagged scramble candidate."""

    return Candidate(
        source="scramble",
        start_seconds=window.start_seconds,
        peak_seconds=window.peak_seconds,
        end_seconds=window.end_seconds,
        confidence=None,
        stability_before=stability_before,
        stability_after=stability_after,
    )


def detect_scrambles(
    sampled_frames: list[SampledFrame],
    metadata: VideoMetadata,
) -> list[Candidate]:
    """Run the full scramble detector over sampled frames."""

    windows = detect_scramble_windows(sampled_frames, metadata)
    stabilities = analyze_window_stability(windows, sampled_frames)
    return build_scrambles(windows, stabilities)
