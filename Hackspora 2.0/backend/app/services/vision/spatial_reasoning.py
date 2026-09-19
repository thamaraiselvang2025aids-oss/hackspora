import time
from typing import List, Optional, Tuple, Dict
from app.schemas.vision import (
    DetectedObject, TargetMatchResult, PathGuidance,
    LaneClearance, ObservationCoverage, SectorCoverage
)
from app.services.vision.provider import BaseReasoningProvider

class ObservaSpatialReasoningEngine(BaseReasoningProvider):
    """
    OBSERVA Spatial Reasoning & Observation Coverage Engine.
    Computes lane clearance, target tracking, observation awareness, and priority narration.
    """
    
    TARGET_SYNONYMS: Dict[str, List[str]] = {
        "bottle": ["bottle", "water bottle", "flask", "drink", "tumbler", "sipper"],
        "chair": ["chair", "seat", "stool", "armchair"],
        "person": ["person", "human", "someone", "man", "woman", "friend"],
        "phone": ["cell phone", "phone", "mobile", "smartphone", "iphone", "android"],
        "laptop": ["laptop", "computer", "notebook", "macbook"],
        "bag": ["bag", "backpack", "handbag", "purse", "tote"],
        "table": ["table", "desk", "counter", "workbench"],
        "door": ["door", "exit", "doorway", "entry"],
        "cup": ["cup", "mug", "glass", "coffee cup"],
        "book": ["book", "textbook", "diary", "journal", "novel"]
    }

    def _match_target(self, query: str, objects: List[DetectedObject]) -> Tuple[bool, Optional[DetectedObject]]:
        q = query.lower().strip()
        # Find canonical target key
        canonical_target = None
        for key, syns in self.TARGET_SYNONYMS.items():
            if any(syn in q for syn in syns):
                canonical_target = key
                break
        
        target_token = canonical_target or q

        # Search detections
        for obj in objects:
            cname = obj.class_name.lower()
            if target_token in cname or cname in target_token:
                return True, obj
            # Check synonyms
            if canonical_target and any(syn in cname for syn in self.TARGET_SYNONYMS[canonical_target]):
                return True, obj
                
        return False, None

    def compute_lane_clearance(self, objects: List[DetectedObject]) -> List[LaneClearance]:
        lanes = {
            "LEFT": {"min_dist": 5.0, "has_obstacle": False, "score": 0.0},
            "CENTER": {"min_dist": 5.0, "has_obstacle": False, "score": 0.0},
            "RIGHT": {"min_dist": 5.0, "has_obstacle": False, "score": 0.0}
        }

        for obj in objects:
            # Map object horizontal zone to lane
            lane_key = "CENTER"
            if "LEFT" in obj.horizontal_zone:
                lane_key = "LEFT"
            elif "RIGHT" in obj.horizontal_zone:
                lane_key = "RIGHT"

            if obj.distance_meters < lanes[lane_key]["min_dist"]:
                lanes[lane_key]["min_dist"] = obj.distance_meters

            if obj.is_obstacle:
                lanes[lane_key]["has_obstacle"] = True
                # Score obstacle severity based on distance (closer = higher obstacle score)
                severity = max(0.0, 1.0 - (obj.distance_meters / 3.0))
                lanes[lane_key]["score"] = max(lanes[lane_key]["score"], severity)

        lane_results: List[LaneClearance] = []
        for lane_name in ["LEFT", "CENTER", "RIGHT"]:
            data = lanes[lane_name]
            score = round(data["score"], 2)
            dist = round(data["min_dist"], 1)
            has_obs = data["has_obstacle"]
            status = "CLEAR"
            if (has_obs and (score > 0.6 or dist <= 0.9)) or dist <= 0.5:
                status = "BLOCKED"
            elif has_obs or score > 0.25 or (dist <= 0.8):
                status = "CAUTION"

            lane_results.append(LaneClearance(
                lane=lane_name, # type: ignore
                obstacle_score=score,
                clearance_meters=dist,
                status=status # type: ignore
            ))
        return lane_results

    def compute_spatial_guidance(
        self,
        objects: List[DetectedObject],
        target_query: Optional[str],
        coverage_history: dict,
        camera_pan_angle: float = 0.0
    ) -> Tuple[List[DetectedObject], Optional[TargetMatchResult], PathGuidance, ObservationCoverage, str, int]:
        
        lanes = self.compute_lane_clearance(objects)
        left_lane = next(l for l in lanes if l.lane == "LEFT")
        center_lane = next(l for l in lanes if l.lane == "CENTER")
        right_lane = next(l for l in lanes if l.lane == "RIGHT")

        # 1. Evaluate Path Guidance
        recommended_dir = "FORWARD"
        instruction = "Path appears clear ahead. Continue with caution."
        urgency = "NORMAL"
        beep_freq = None
        priority_level = 5

        # Critical obstacle ahead
        if center_lane.status == "BLOCKED":
            urgency = "CRITICAL"
            beep_freq = 880 # High pitch warning beep
            priority_level = 1
            
            # If target object is on the left and left is clear, favor left
            target_on_left = any("LEFT" in obj.horizontal_zone for obj in objects if not obj.is_obstacle)
            target_on_right = any("RIGHT" in obj.horizontal_zone for obj in objects if not obj.is_obstacle)

            if target_on_left and left_lane.status == "CLEAR":
                recommended_dir = "SLIGHTLY LEFT"
                instruction = f"Obstacle ahead at ~{center_lane.clearance_meters}m. Move slightly left toward target."
            elif target_on_right and right_lane.status == "CLEAR":
                recommended_dir = "SLIGHTLY RIGHT"
                instruction = f"Obstacle ahead at ~{center_lane.clearance_meters}m. Move slightly right toward target."
            elif right_lane.status == "CLEAR":
                recommended_dir = "SLIGHTLY RIGHT"
                instruction = f"Obstacle ahead at ~{center_lane.clearance_meters}m. Move slightly right."
            elif left_lane.status == "CLEAR":
                recommended_dir = "SLIGHTLY LEFT"
                instruction = f"Obstacle ahead at ~{center_lane.clearance_meters}m. Move slightly left."
            else:
                recommended_dir = "STOP"
                instruction = f"Obstacles ahead in all lanes. Stop and scan carefully."
        elif center_lane.status == "CAUTION":
            urgency = "CAUTION"
            beep_freq = 440
            priority_level = 2
            
            target_on_left = any("LEFT" in obj.horizontal_zone for obj in objects if not obj.is_obstacle)
            if target_on_left and left_lane.status == "CLEAR":
                recommended_dir = "SLIGHTLY LEFT"
                instruction = "Potential obstacle ahead. Clearer route toward target is slightly left."
            elif right_lane.status == "CLEAR" and right_lane.clearance_meters > center_lane.clearance_meters:
                recommended_dir = "SLIGHTLY RIGHT"
                instruction = "Potential obstacle ahead. Clearer route appears slightly right."
            elif left_lane.status == "CLEAR":
                recommended_dir = "SLIGHTLY LEFT"
                instruction = "Potential obstacle ahead. Clearer route appears slightly left."
            else:
                recommended_dir = "FORWARD"
                instruction = "Proceed forward with caution."

        path_guidance = PathGuidance(
            recommended_direction=recommended_dir, # type: ignore
            instruction=instruction,
            urgency=urgency, # type: ignore
            beep_frequency_hz=beep_freq,
            lanes=lanes
        )

        # 2. Update Observation Coverage Grid
        now = time.time()
        # Coverage evolves based on camera pan angle or current scene viewing
        left_explored = coverage_history.get("LEFT", 0.8)
        center_explored = coverage_history.get("CENTER", 0.95)
        right_explored = coverage_history.get("RIGHT", 0.4)

        if camera_pan_angle < -0.3:
            left_explored = min(1.0, left_explored + 0.25)
        elif camera_pan_angle > 0.3:
            right_explored = min(1.0, right_explored + 0.25)
        else:
            center_explored = min(1.0, center_explored + 0.1)

        coverage_history["LEFT"] = left_explored
        coverage_history["CENTER"] = center_explored
        coverage_history["RIGHT"] = right_explored

        def get_state(ratio):
            if ratio >= 0.75:
                return "OBSERVED"
            elif ratio >= 0.35:
                return "UNCERTAIN"
            else:
                return "UNOBSERVED"

        sectors = [
            SectorCoverage(sector="LEFT", state=get_state(left_explored), exploration_ratio=round(left_explored, 2), last_observed_timestamp=now),
            SectorCoverage(sector="CENTER", state=get_state(center_explored), exploration_ratio=round(center_explored, 2), last_observed_timestamp=now),
            SectorCoverage(sector="RIGHT", state=get_state(right_explored), exploration_ratio=round(right_explored, 2), last_observed_timestamp=now)
        ]
        overall_pct = int(round((left_explored + center_explored + right_explored) / 3.0 * 100))

        unexplored_warning = None
        if right_explored < 0.5:
            unexplored_warning = "Right sector partially unobserved"
        elif left_explored < 0.5:
            unexplored_warning = "Left sector partially unobserved"

        observation_coverage = ObservationCoverage(
            overall_percentage=overall_pct,
            sectors=sectors,
            unexplored_warning=unexplored_warning
        )

        # 3. Target Search & Guidance
        target_result: Optional[TargetMatchResult] = None
        narration = instruction

        if target_query and target_query.strip():
            found, matched_obj = self._match_target(target_query, objects)
            if found and matched_obj:
                target_result = TargetMatchResult(
                    target_query=target_query,
                    found=True,
                    matched_object=matched_obj,
                    guidance_message=f"{matched_obj.class_name.capitalize()} found. It is {matched_obj.horizontal_zone.lower()}, approximately {matched_obj.distance_meters} meters away.",
                    coverage_state_for_target="CONFIRMED"
                )
                if priority_level > 2:
                    narration = f"{matched_obj.class_name.capitalize()} found. {matched_obj.horizontal_zone.lower()}, ~{matched_obj.distance_meters}m away."
                    priority_level = 3
            else:
                # Target not in view. Check observation coverage before claiming absent!
                q_lower = target_query.lower()
                if "right" in q_lower and right_explored < 0.6:
                    guidance_msg = "I haven't checked the right side yet. Turn slightly right."
                    cov_state = "UNOBSERVED_SECTOR"
                elif "left" in q_lower and left_explored < 0.6:
                    guidance_msg = "I haven't checked the left side yet. Turn slightly left."
                    cov_state = "UNOBSERVED_SECTOR"
                else:
                    guidance_msg = f"I haven't found the {target_query} yet. Turn slowly to scan your surroundings."
                    cov_state = "SEARCHING"

                target_result = TargetMatchResult(
                    target_query=target_query,
                    found=False,
                    matched_object=None,
                    guidance_message=guidance_msg,
                    coverage_state_for_target=cov_state
                )
                if priority_level > 3:
                    narration = guidance_msg
                    priority_level = 4

        return objects, target_result, path_guidance, observation_coverage, narration, priority_level

spatial_reasoning_engine = ObservaSpatialReasoningEngine()
