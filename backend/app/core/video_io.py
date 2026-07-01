"""Shared video IO for the analysis pipeline.

Frame extraction is detector-agnostic infrastructure: it runs once per video
and every detector consumes the same sampled frames. Keeping it here (rather
than inside any single detector) means sampling is never duplicated and
detectors stay pure functions of `(frames, metadata)`.
"""

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np


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
