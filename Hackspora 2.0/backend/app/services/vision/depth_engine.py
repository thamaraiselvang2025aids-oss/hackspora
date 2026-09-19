from typing import List, Optional
import numpy as np
from app.schemas.vision import DetectedObject, BoundingBox

class DepthEngine:
    """
    Monocular Depth Estimation Engine.
    Combines optical geometry, bounding box scale heuristics, and relative vertical perspective
    to estimate calibrated approximate distances (~1.4m) with clear approximate labeling.
    """
    
    # Typical physical dimensions in meters for reference object classes
    PRIOR_HEIGHTS = {
        "person": 1.7,
        "chair": 0.85,
        "bottle": 0.25,
        "water bottle": 0.25,
        "cup": 0.12,
        "laptop": 0.22,
        "cell phone": 0.15,
        "table": 0.75,
        "door": 2.0,
        "bag": 0.4,
        "backpack": 0.45,
        "book": 0.25,
        "keyboard": 0.15,
        "tv": 0.7,
        "couch": 0.85,
        "dog": 0.5,
        "cat": 0.3
    }
    
    # Focal length calibration constant (standard 65 deg FOV webcam)
    FOCAL_LENGTH_PX = 580.0

    def calculate_relative_distance(self, bbox: BoundingBox, class_name: str, frame_height: int = 480) -> float:
        """
        Calculates approximate distance in meters using pinhole perspective and object priors.
        """
        bbox_height_ratio = max(0.01, bbox.y_max - bbox.y_min)
        bbox_height_px = bbox_height_ratio * frame_height
        
        prior_height_m = self.PRIOR_HEIGHTS.get(class_name.lower(), 0.5)
        
        # Distance = (Real Height * Focal Length) / Pixel Height
        raw_distance = (prior_height_m * self.FOCAL_LENGTH_PX) / max(10.0, bbox_height_px)
        
        # Ground plane vertical perspective heuristic (objects lower on screen are closer)
        bottom_y = bbox.y_max
        perspective_factor = 1.0 + (1.0 - bottom_y) * 0.4
        
        estimated_distance = raw_distance * perspective_factor
        # Bound sensibly between 0.3m and 10.0m
        return float(np.clip(round(estimated_distance, 1), 0.4, 8.0))

    def get_distance_label(self, distance_m: float) -> str:
        if distance_m <= 0.8:
            return "very close"
        elif distance_m <= 2.0:
            return "near"
        elif distance_m <= 4.0:
            return "medium distance"
        else:
            return "far"

    def assess_obstacle_risk(self, distance_m: float, zone: str, class_name: str) -> tuple[bool, Optional[str]]:
        """
        Evaluates whether a detected object represents a navigational obstacle based on distance and visual lane.
        """
        non_obstacle_classes = {"book", "cell phone", "keyboard", "mouse", "cup"}
        if class_name.lower() in non_obstacle_classes and distance_m > 0.8:
            return False, None
            
        if distance_m <= 0.9:
            return True, "CRITICAL"
        elif distance_m <= 1.5 and "CENTER" in zone:
            return True, "HIGH"
        elif distance_m <= 2.2 and "CENTER" in zone:
            return True, "MEDIUM"
        elif distance_m <= 1.5:
            return True, "LOW"
        return False, None

depth_engine = DepthEngine()
