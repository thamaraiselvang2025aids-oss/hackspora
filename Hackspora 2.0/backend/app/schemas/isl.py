from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class LandmarkPoint(BaseModel):
    x: float
    y: float
    z: Optional[float] = 0.0
    visibility: Optional[float] = 1.0

class HolisticFrame(BaseModel):
    timestamp: float
    face_landmarks: Optional[List[LandmarkPoint]] = None
    pose_landmarks: Optional[List[LandmarkPoint]] = None
    left_hand_landmarks: Optional[List[LandmarkPoint]] = None
    right_hand_landmarks: Optional[List[LandmarkPoint]] = None

class ISLRecognizeRequest(BaseModel):
    frames: List[HolisticFrame]
    is_signing: bool = False
    is_demo_mode: bool = False
    simulated_gloss: Optional[str] = None

class ISLRecognizeResponse(BaseModel):
    detected_gloss: Optional[str] = None  # e.g., "WATER", "HELLO", "HELP", "THANK YOU"
    natural_transcript: str  # e.g., "I need water."
    confidence: float
    still_signing: bool
    motion_energy: float
    supported_vocabulary: List[str]

class SpeechToAvatarRequest(BaseModel):
    spoken_text: str

class AvatarBoneKeyframe(BaseModel):
    time: float
    bone_rotations: Dict[str, List[float]]  # bone_name -> [rotX, rotY, rotZ]

class SpeechToAvatarResponse(BaseModel):
    source_text: str
    isl_gloss_sequence: List[str]
    animation_duration_seconds: float
    animation_keyframes: List[AvatarBoneKeyframe]
