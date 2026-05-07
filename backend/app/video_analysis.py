from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import cv2
import numpy as np


DetectedTeam = Literal["red", "blue"]
PRE_CONTEXT_SECONDS = 3.0
POST_CONTEXT_SECONDS = 3.0


@dataclass(frozen=True)
class VideoMetadata:
    """Basic video properties needed for frame sampling and replay timing."""

    fps: float
    frame_count: int
    duration_seconds: float
    width: int
    height: int


@dataclass(frozen=True)
class SampledFrame:
    """A video frame bundled with the time/frame position it came from."""

    frame_index: int
    timestamp_seconds: float
    image: np.ndarray


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


@dataclass(frozen=True)
class CandidateWindow:
    start_index: int
    end_index: int
    peak_index: int
    start_seconds: float
    end_seconds: float
    peak_seconds: float
    motion_score: float


@dataclass(frozen=True)
class StabilityCheck:
    is_stable: bool
    motion_score: float
    window_start_seconds: float
    window_end_seconds: float

@dataclass(frozen=True)
class WindowStability:
    before: StabilityCheck | None
    after: StabilityCheck | None


@dataclass(frozen=True)
class CandidateAction:
    action_type: str
    start_seconds: float
    end_seconds: float
    peak_seconds: float
    confidence: float | None = None
    position_before: str | None = None
    position_after: str | None = None
    top_team_before: DetectedTeam | None = None
    top_team_after: DetectedTeam | None = None
    stability_before: StabilityCheck | None = None
    stability_after: StabilityCheck | None = None
    team: DetectedTeam | None = None
   


def get_video_metadata(video_path: Path) -> VideoMetadata:
    """Open a video file with OpenCV and extract basic timing/size metadata."""

    if not video_path.exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    capture = cv2.VideoCapture(str(video_path))
    try:
        if not capture.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")

        fps = float(capture.get(cv2.CAP_PROP_FPS))
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))

        if fps <= 0:
            raise ValueError(f"Video has invalid FPS: {fps}")
        if frame_count <= 0:
            raise ValueError(f"Video has invalid frame count: {frame_count}")
        if width <= 0 or height <= 0:
            raise ValueError(f"Video has invalid dimensions: {width}x{height}")

        return VideoMetadata(
            fps=fps,
            frame_count=frame_count,
            duration_seconds=frame_count / fps,
            width=width,
            height=height,
        )
    finally:
        capture.release()


def sample_video_frames(
    video_path: Path,
    metadata: VideoMetadata,
    sample_every_seconds: float = 0.5,
) -> list[SampledFrame]:
    """Sample timestamped frames from a video at a fixed time interval."""

    if sample_every_seconds <= 0:
        raise ValueError("sample_every_seconds must be greater than 0")

    capture = cv2.VideoCapture(str(video_path))
    try:
        if not capture.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")

        frame_step = max(1, round(metadata.fps * sample_every_seconds))
        sampled_frames: list[SampledFrame] = []

        for frame_index in range(0, metadata.frame_count, frame_step):
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            success, image = capture.read()

            if not success:
                continue

            sampled_frames.append(
                SampledFrame(
                    frame_index=frame_index,
                    timestamp_seconds=frame_index / metadata.fps,
                    image=image,
                )
            )

        return sampled_frames
    finally:
        capture.release()


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


def save_debug_frames(
    frames: list[SampledFrame],
    output_dir: Path,
    max_frames: int = 10,
) -> list[Path]:
    """Save a small set of sampled frames to disk for CV debugging."""

    if max_frames <= 0:
        return []

    output_dir.mkdir(parents=True, exist_ok=True)

    saved_paths: list[Path] = []

    for frame in frames[:max_frames]:
        timestamp_milliseconds = round(frame.timestamp_seconds * 1000)
        output_path = (
            output_dir
            / f"frame_{frame.frame_index:06d}_{timestamp_milliseconds}ms.jpg"
        )

        did_write = cv2.imwrite(str(output_path), frame.image)
        if not did_write:
            raise ValueError(f"Could not write debug frame to: {output_path}")

        saved_paths.append(output_path)

    return saved_paths


def detect_candidate_actions(
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


def detect_stabalized_effect(
    time_windows: list[CandidateWindow], 
    sampled_frames: list[SampledFrame]
    ) -> list[WindowStability]:

    window_stability_checks: list[WindowStability] = []

    for window in time_windows:
        target_start_seconds = window.start_seconds - 3.0
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
                window.start_seconds - 3.0,
            )   

            stability_threshold = min(7.5, window.motion_score * 0.5)

           
            before_stability_check = StabilityCheck(
                is_stable=avg_motion < stability_threshold,
                motion_score=avg_motion,
                window_start_seconds=target_start_seconds,
                window_end_seconds=window.start_seconds,
            )
            


        target_end_seconds = window.end_seconds + 3.0
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
                window.end_seconds + 3.0,
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
                after=after_stability_check
            )
        )

    return window_stability_checks



def build_candidate_actions(
    candidate_windows: list[CandidateWindow],
    window_stabilities: list[WindowStability],
) -> list[CandidateAction]:

    if len(candidate_windows) != len(window_stabilities):
        raise ValueError(
            "candidate_windows and window_stabilities must have the same length"
        )

    candidate_actions: list[CandidateAction] = []

    for i in range(len(candidate_windows)):     
        cur_window = candidate_windows[i]
        cur_window_stability = window_stabilities[i]

        if i == 0 and cur_window_stability.after and cur_window_stability.after.is_stable:
            candidate_actions.append( 
                    CandidateAction(
                        action_type="Unknown",
                        start_seconds=cur_window.start_seconds,
                        end_seconds=cur_window.end_seconds,
                        peak_seconds=cur_window.peak_seconds,
                        confidence=None,
                        position_before=None,
                        position_after=None,
                        top_team_before=None,
                        top_team_after=None,
                        stability_before=None,
                        stability_after=cur_window_stability.after,
                        team=None
                    )
                )
            continue
        
        if (i == len(candidate_windows) - 1) and cur_window_stability.before and cur_window_stability.before.is_stable:
            candidate_actions.append( 
                    CandidateAction(
                        action_type="Unknown",
                        start_seconds=cur_window.start_seconds,
                        end_seconds=cur_window.end_seconds,
                        peak_seconds=cur_window.peak_seconds,
                        confidence=None,
                        position_before=None,
                        position_after=None,
                        top_team_before=None,
                        top_team_after=None,
                        stability_before=cur_window_stability.before,
                        stability_after=None,
                        team=None
                    )
                )
            continue

        if cur_window_stability.before and cur_window_stability.after:
            if cur_window_stability.before.is_stable and cur_window_stability.after.is_stable:
                candidate_actions.append( 
                    CandidateAction(
                        action_type="Unknown",
                        start_seconds=cur_window.start_seconds,
                        end_seconds=cur_window.end_seconds,
                        peak_seconds=cur_window.peak_seconds,
                        confidence=None,
                        position_before=None,
                        position_after=None,
                        top_team_before=None,
                        top_team_after=None,
                        stability_before=cur_window_stability.before,
                        stability_after=cur_window_stability.after,
                        team=None
                    )
                )


    return candidate_actions
    



# def build_scoring_events_from_actions(
#     candidate_actions: list[CandidateAction],
#     metadata: VideoMetadata,
# ) -> list[ScoringEvents]:
#     """Placeholder for converting detected actions into scoring events."""  
#     pass


def analyze_match_video(video_path: Path) -> list[DetectedScoringEvent]:
    """Analyze uploaded match footage and return proposed scoring events.

    This is the CV boundary for the app. The first implementation validates
    that the uploaded source exists; the next iteration can replace the empty
    detector with frame extraction, pose tracking, and action classification
    without changing the FastAPI route shape.
    """

    if not video_path.exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    metadata = get_video_metadata(video_path)
    sampled_frames = sample_video_frames(video_path, metadata)
    save_debug_frames(
        frames=sampled_frames,
        output_dir=video_path.parent / "debug_frames",
    )
    candidate_actions = detect_candidate_actions(sampled_frames, metadata)
    scoring_events = build_scoring_events_from_actions(candidate_actions, metadata)
    return scoring_events
