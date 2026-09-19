from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
import numpy as np
from app.schemas.vision import DetectedObject, PathGuidance, ObservationCoverage, TargetMatchResult

class VisionProvider(ABC):
    @abstractmethod
    def detect_objects(self, image_bytes: Optional[bytes], is_demo: bool = False, demo_scenario: Optional[str] = None) -> List[DetectedObject]:
        """Detect objects in the image frame returning normalized bounding boxes and classifications."""
        pass

    @abstractmethod
    def estimate_depth(self, detections: List[DetectedObject], image_bytes: Optional[bytes] = None) -> List[DetectedObject]:
        """Enrich detections with approximate relative distance."""
        pass

class BaseReasoningProvider(ABC):
    @abstractmethod
    def compute_spatial_guidance(
        self,
        objects: List[DetectedObject],
        target_query: Optional[str],
        coverage_history: dict,
        camera_pan_angle: float
    ) -> Tuple[List[DetectedObject], Optional[TargetMatchResult], PathGuidance, ObservationCoverage, str, int]:
        """Synthesize world state into spatial guidance, obstacle clearance, coverage, and concise narration."""
        pass
