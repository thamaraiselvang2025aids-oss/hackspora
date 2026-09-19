import base64
import time
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.event_log import ActivityEvent
from app.schemas.vision import VisionProcessRequest, VisionProcessResponse
from app.services.vision.yolo_engine import yolo_provider
from app.services.vision.spatial_reasoning import spatial_reasoning_engine

router = APIRouter(prefix="/vision", tags=["Vision & Spatial Perception"])

# In-memory coverage tracking store
user_coverage_cache = {}

@router.post("/process-frame", response_model=VisionProcessResponse)
async def process_vision_frame(payload: VisionProcessRequest, db: Session = Depends(get_db)):
    image_bytes = None
    if payload.image_base64:
        try:
            # Handle potential header
            raw = payload.image_base64
            if "," in raw:
                raw = raw.split(",")[1]
            image_bytes = base64.b64decode(raw)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {e}")

    # 1. Detect objects & estimate distance
    detections = yolo_provider.detect_objects(
        image_bytes=image_bytes,
        is_demo=payload.is_demo_mode,
        demo_scenario=payload.demo_scenario
    )

    # 2. Compute spatial reasoning, obstacle pathing, observation coverage & concise priority narration
    coverage_history = user_coverage_cache.setdefault("default-user", {"LEFT": 0.8, "CENTER": 0.95, "RIGHT": 0.4})
    
    (
        objects,
        target_res,
        guidance,
        coverage,
        narration,
        priority
    ) = spatial_reasoning_engine.compute_spatial_guidance(
        objects=detections,
        target_query=payload.target_object_query,
        coverage_history=coverage_history,
        camera_pan_angle=payload.camera_pan_angle or 0.0
    )

    # Log target discovery if found
    if target_res and target_res.found and target_res.matched_object:
        event = ActivityEvent(
            user_id="default-user",
            mode="BLIND",
            event_type="OBJECT_FOUND",
            description=f"{target_res.matched_object.class_name.capitalize()} found at ~{target_res.matched_object.distance_meters}m {target_res.matched_object.horizontal_zone.lower()}"
        )
        db.add(event)
        db.commit()

    return VisionProcessResponse(
        timestamp=time.time(),
        objects=objects,
        target_result=target_res,
        path_guidance=guidance,
        observation_coverage=coverage,
        concise_narration=narration,
        priority_level=priority
    )

@router.post("/reset-coverage")
async def reset_coverage_grid():
    user_coverage_cache["default-user"] = {"LEFT": 0.3, "CENTER": 0.4, "RIGHT": 0.2}
    return {"status": "success", "message": "Observation coverage grid reset"}
