import numpy as np
from typing import List, Optional
from app.schemas.isl import HolisticFrame, LandmarkPoint

class LandmarkProcessor:
    """
    Normalizes 21-hand landmarks per hand and pose points relative to wrist/shoulder origins.
    Calculates motion velocity / signing kinetic energy for Still-Signing detection.
    """
    
    def compute_motion_energy(self, current_frame: HolisticFrame, previous_frame: Optional[HolisticFrame]) -> float:
        if previous_frame is None:
            return 0.0

        total_delta = 0.0
        count = 0

        # Check right hand movement
        if current_frame.right_hand_landmarks and previous_frame.right_hand_landmarks:
            for p1, p2 in zip(current_frame.right_hand_landmarks, previous_frame.right_hand_landmarks):
                dx = p1.x - p2.x
                dy = p1.y - p2.y
                total_delta += np.sqrt(dx*dx + dy*dy)
                count += 1

        # Check left hand movement
        if current_frame.left_hand_landmarks and previous_frame.left_hand_landmarks:
            for p1, p2 in zip(current_frame.left_hand_landmarks, previous_frame.left_hand_landmarks):
                dx = p1.x - p2.x
                dy = p1.y - p2.y
                total_delta += np.sqrt(dx*dx + dy*dy)
                count += 1

        if count == 0:
            return 0.0

        avg_velocity = total_delta / count
        # Normalize into 0.0 - 1.0 energy metric
        return float(np.clip(avg_velocity * 25.0, 0.0, 1.0))

    def normalize_hand_landmarks(self, landmarks: List[LandmarkPoint]) -> List[List[float]]:
        """
        Translates landmarks to wrist origin (landmark 0) and scales by palm distance (landmark 0 to 9).
        """
        if not landmarks or len(landmarks) < 21:
            return []

        wrist = landmarks[0]
        middle_mcp = landmarks[9]
        palm_size = max(0.01, np.sqrt((middle_mcp.x - wrist.x)**2 + (middle_mcp.y - wrist.y)**2))

        normalized = []
        for lm in landmarks:
            norm_x = (lm.x - wrist.x) / palm_size
            norm_y = (lm.y - wrist.y) / palm_size
            norm_z = ((lm.z or 0.0) - (wrist.z or 0.0)) / palm_size
            normalized.append([norm_x, norm_y, norm_z])
        return normalized

landmark_processor = LandmarkProcessor()
