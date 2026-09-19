from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float

class DetectedObject(BaseModel):
    id: str
    class_name: str
    confidence: float
    bbox: BoundingBox
    center_x: float
    center_y: float
    distance_meters: float
    distance_label: str  # "very close", "near", "medium distance", "far"
    horizontal_zone: Literal["LEFT", "SLIGHTLY LEFT", "CENTER", "SLIGHTLY RIGHT", "RIGHT"]
    is_obstacle: bool = False
    obstacle_priority: Optional[Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]] = None

class LaneClearance(BaseModel):
    lane: Literal["LEFT", "CENTER", "RIGHT"]
    obstacle_score: float  # 0.0 (clear) to 1.0 (blocked)
    clearance_meters: float
    status: Literal["CLEAR", "CAUTION", "BLOCKED"]

class PathGuidance(BaseModel):
    recommended_direction: Literal["FORWARD", "SLIGHTLY LEFT", "SLIGHTLY RIGHT", "STOP"]
    instruction: str
    urgency: Literal["NORMAL", "CAUTION", "WARNING", "CRITICAL"]
    beep_frequency_hz: Optional[int] = None
    lanes: List[LaneClearance]

class SectorCoverage(BaseModel):
    sector: Literal["LEFT", "CENTER", "RIGHT"]
    state: Literal["OBSERVED", "UNCERTAIN", "UNOBSERVED", "DEGRADED"]
    exploration_ratio: float  # 0.0 to 1.0
    last_observed_timestamp: Optional[float] = None

class ObservationCoverage(BaseModel):
    overall_percentage: int
    sectors: List[SectorCoverage]
    unexplored_warning: Optional[str] = None

class TargetMatchResult(BaseModel):
    target_query: str
    found: bool
    matched_object: Optional[DetectedObject] = None
    guidance_message: str
    coverage_state_for_target: Optional[str] = None

class VisionProcessRequest(BaseModel):
    image_base64: Optional[str] = None
    target_object_query: Optional[str] = None
    camera_pan_angle: Optional[float] = 0.0  # -1.0 (left) to 1.0 (right)
    is_demo_mode: bool = False
    demo_scenario: Optional[str] = None

class VisionProcessResponse(BaseModel):
    timestamp: float
    objects: List[DetectedObject]
    target_result: Optional[TargetMatchResult] = None
    path_guidance: PathGuidance
    observation_coverage: ObservationCoverage
    concise_narration: str
    priority_level: int  # 1 (Critical Danger) to 5 (Info)
