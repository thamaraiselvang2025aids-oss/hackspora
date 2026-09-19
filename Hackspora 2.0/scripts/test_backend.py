import os
import sys
import unittest
import time

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.schemas.vision import DetectedObject, BoundingBox
from app.services.vision.depth_engine import depth_engine
from app.services.vision.spatial_reasoning import spatial_reasoning_engine
from app.services.isl.isl_gloss_engine import isl_engine
from app.services.speech.intent_extractor import intent_extractor
from app.services.audio.sound_classifier import sound_provider

class TestObservaCoreServices(unittest.TestCase):

    def test_horizontal_zone_and_depth(self):
        bbox = BoundingBox(x_min=0.35, y_min=0.4, x_max=0.55, y_max=0.85)
        dist = depth_engine.calculate_relative_distance(bbox, "bottle", frame_height=480)
        self.assertGreater(dist, 0.4)
        self.assertLess(dist, 4.0)
        label = depth_engine.get_distance_label(dist)
        self.assertIn(label, ["very close", "near", "medium distance", "far"])

    def test_target_matching_and_spatial_guidance(self):
        objects = [
            DetectedObject(
                id="1",
                class_name="bottle",
                confidence=0.95,
                bbox=BoundingBox(x_min=0.2, y_min=0.4, x_max=0.35, y_max=0.8),
                center_x=0.27,
                center_y=0.6,
                distance_meters=1.4,
                distance_label="near",
                horizontal_zone="LEFT",
                is_obstacle=False
            ),
            DetectedObject(
                id="2",
                class_name="chair",
                confidence=0.90,
                bbox=BoundingBox(x_min=0.4, y_min=0.3, x_max=0.6, y_max=0.9),
                center_x=0.5,
                center_y=0.6,
                distance_meters=0.8,
                distance_label="very close",
                horizontal_zone="CENTER",
                is_obstacle=True
            )
        ]

        cov_hist = {"LEFT": 0.8, "CENTER": 0.95, "RIGHT": 0.3}
        _, target_res, guidance, cov, narration, priority = spatial_reasoning_engine.compute_spatial_guidance(
            objects=objects,
            target_query="Find my water bottle",
            coverage_history=cov_hist,
            camera_pan_angle=0.0
        )

        self.assertIsNotNone(target_res)
        self.assertTrue(target_res.found)
        self.assertEqual(target_res.matched_object.class_name, "bottle")
        self.assertEqual(guidance.recommended_direction, "SLIGHTLY LEFT")
        self.assertIn("Obstacle ahead", guidance.instruction)
        self.assertEqual(cov.overall_percentage, 70)

    def test_observation_coverage_uncertainty(self):
        # Query target on unobserved right side
        objects = []
        cov_hist = {"LEFT": 0.8, "CENTER": 0.9, "RIGHT": 0.2}
        _, target_res, _, _, narration, _ = spatial_reasoning_engine.compute_spatial_guidance(
            objects=objects,
            target_query="Is there a bag on my right?",
            coverage_history=cov_hist
        )
        self.assertFalse(target_res.found)
        self.assertIn("haven't checked the right side yet", target_res.guidance_message)
        self.assertIn("Turn slightly right", target_res.guidance_message)

    def test_speech_intent_extractor(self):
        intent1 = intent_extractor.extract_intent("Find my water bottle")
        self.assertEqual(intent1["intent"], "SEARCH_OBJECT")
        self.assertEqual(intent1["target_object"], "water bottle")

        intent2 = intent_extractor.extract_intent("Where is my chair?")
        self.assertEqual(intent2["intent"], "SEARCH_OBJECT")
        self.assertEqual(intent2["target_object"], "chair")

    def test_isl_speech_to_avatar(self):
        res = isl_engine.convert_text_to_avatar_gloss("I will bring you water")
        self.assertIn("WATER", res.isl_gloss_sequence)
        self.assertGreater(len(res.animation_keyframes), 0)

    def test_sound_classifier(self):
        res = sound_provider.classify_audio(simulated_event="smoke_alarm")
        self.assertIsNotNone(res.active_alert)
        self.assertEqual(res.active_alert.label, "Smoke Alarm")
        self.assertEqual(res.active_alert.priority, "CRITICAL")
        self.assertTrue(res.active_alert.is_emergency)

if __name__ == "__main__":
    unittest.main()
