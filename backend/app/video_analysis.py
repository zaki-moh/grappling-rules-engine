from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import cv2
import numpy as np


DetectedTeam = Literal["red", "blue"]


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
    sample_every_seconds: float = 5.0,
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


def format_seconds_as_timestamp():
    pass


def build_mock_scoring_events():
    pass



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
    sample_video_frames(video_path, metadata)

    return []
