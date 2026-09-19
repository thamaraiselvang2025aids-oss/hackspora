import time
import math
from typing import List, Optional, Dict, Any, Tuple
from app.schemas.isl import (
    HolisticFrame, ISLRecognizeResponse,
    SpeechToAvatarResponse, AvatarBoneKeyframe
)
from app.services.isl.landmark_processor import landmark_processor
from collections import deque

class ISLGlossEngine:
    """
    Indian Sign Language (ISL) Gloss Engine.
    Handles temporal landmark pattern recognition and bidirectional Speech <-> ISL Avatar translation.
    Uses a Temporal Sequence State Machine over a landmark buffer to classify stroke trajectories.
    """
    
    VOCABULARY = [
        "HELLO", "WATER", "HELP", "THANK YOU", "WHERE", "DOCTOR", 
        "YES", "NO", "HUNGRY", "PLEASE", "NAME", "EMERGENCY"
    ]

    GLOSS_TO_NATURAL = {
        "HELLO": "Hello, nice to meet you.",
        "WATER": "I would like some water.",
        "HELP": "I need assistance, please help.",
        "THANK YOU": "Thank you very much.",
        "WHERE": "Where is it located?",
        "DOCTOR": "I need to see a doctor.",
        "YES": "Yes, I agree.",
        "NO": "No, thank you.",
        "HUNGRY": "I am hungry and need food.",
        "PLEASE": "Please help me.",
        "NAME": "What is your name?",
        "EMERGENCY": "This is an emergency."
    }

    TEXT_TO_GLOSS_RULES = {
        "water": "WATER", "drink": "WATER", "thirst": "WATER",
        "hello": "HELLO", "hi": "HELLO", "hey": "HELLO",
        "help": "HELP", "assist": "HELP",
        "thank": "THANK YOU", "thanks": "THANK YOU",
        "where": "WHERE", "doctor": "DOCTOR", "hospital": "DOCTOR",
        "yes": "YES", "correct": "YES", "no": "NO",
        "hungry": "HUNGRY", "food": "HUNGRY", "eat": "HUNGRY",
        "please": "PLEASE", "emergency": "EMERGENCY"
    }

    def __init__(self):
        # Buffer to hold spatial tracking of the active wrist (x, y, timestamp)
        self.stroke_buffer: deque = deque(maxlen=15)
        self.last_gloss_time = 0.0

    def _extract_temporal_features(self) -> Dict[str, float]:
        """
        Calculates velocity, total displacement, and dominant axis movement
        from the temporal stroke buffer.
        """
        if len(self.stroke_buffer) < 5:
            return {"dx": 0.0, "dy": 0.0, "velocity": 0.0, "duration": 0.0}

        start = self.stroke_buffer[0]
        end = self.stroke_buffer[-1]
        
        dx = end['x'] - start['x']
        dy = end['y'] - start['y']
        dt = end['t'] - start['t']
        
        distance = math.sqrt(dx**2 + dy**2)
        velocity = distance / dt if dt > 0 else 0
        
        return {
            "dx": dx,
            "dy": dy,
            "velocity": velocity,
            "duration": dt,
            "start_y": start['y'],
            "end_y": end['y']
        }

    def recognize_gesture_sequence(
        self,
        frames: List[HolisticFrame],
        is_signing_hint: bool = False,
        is_demo: bool = False,
        simulated_gloss: Optional[str] = None
    ) -> ISLRecognizeResponse:
        
        now = time.time()
        
        # Calculate motion energy
        motion_energy = 0.0
        if len(frames) >= 2:
            motion_energy = landmark_processor.compute_motion_energy(frames[-1], frames[-2])
        elif is_signing_hint:
            motion_energy = 0.65

        still_signing = motion_energy > 0.25 or is_signing_hint

        if simulated_gloss and simulated_gloss.upper() in self.VOCABULARY:
            gloss = simulated_gloss.upper()
            return ISLRecognizeResponse(
                detected_gloss=gloss,
                natural_transcript=self.GLOSS_TO_NATURAL.get(gloss, gloss),
                confidence=0.95,
                still_signing=still_signing,
                motion_energy=round(motion_energy, 2),
                supported_vocabulary=self.VOCABULARY
            )

        if is_demo:
            return ISLRecognizeResponse(
                detected_gloss="WATER",
                natural_transcript="I would like some water.",
                confidence=0.92,
                still_signing=still_signing,
                motion_energy=0.72,
                supported_vocabulary=self.VOCABULARY
            )

        # Update Temporal Buffer
        if frames and len(frames) > 0:
            latest = frames[-1]
            active_hand = latest.right_hand_landmarks or latest.left_hand_landmarks
            if active_hand and len(active_hand) >= 21:
                wrist = active_hand[0]
                self.stroke_buffer.append({'x': wrist.x, 'y': wrist.y, 't': now})
            else:
                # If hand drops out, clear stroke
                self.stroke_buffer.clear()

        # Temporal Sequence State Machine Execution
        recognized_gloss = None
        confidence = 0.0

        if not still_signing and len(self.stroke_buffer) >= 8 and (now - self.last_gloss_time > 1.5):
            features = self._extract_temporal_features()
            
            # Trajectory Analysis
            # WATER: Hand moves significantly upward towards mouth (negative dy)
            if features['dy'] < -0.15 and features['end_y'] < 0.45:
                recognized_gloss = "WATER"
                confidence = 0.91
            # HELLO: Hand moves side-to-side (high velocity, minimal Y delta)
            elif abs(features['dx']) > 0.1 and abs(features['dy']) < 0.1 and features['end_y'] < 0.6:
                recognized_gloss = "HELLO"
                confidence = 0.88
            # THANK YOU: Hand moves sharply away from body / down (positive dy)
            elif features['dy'] > 0.15 and features['start_y'] < 0.6:
                recognized_gloss = "THANK YOU"
                confidence = 0.93
            # HELP: Hand generally moves upward, but both hands required in real ISL
            elif features['dy'] < -0.05 and features['end_y'] > 0.5:
                recognized_gloss = "HELP"
                confidence = 0.85

            if recognized_gloss:
                self.last_gloss_time = now
                self.stroke_buffer.clear() # Reset after successful match

        return ISLRecognizeResponse(
            detected_gloss=recognized_gloss,
            natural_transcript=self.GLOSS_TO_NATURAL.get(recognized_gloss, "") if recognized_gloss else "",
            confidence=confidence,
            still_signing=still_signing,
            motion_energy=round(motion_energy, 2),
            supported_vocabulary=self.VOCABULARY
        )

    def convert_text_to_avatar_gloss(self, spoken_text: str) -> SpeechToAvatarResponse:
        words = spoken_text.lower().replace(".", " ").replace("!", " ").replace("?", " ").split()
        glosses: List[str] = []

        for w in words:
            for k, gloss in self.TEXT_TO_GLOSS_RULES.items():
                if k in w and gloss not in glosses:
                    glosses.append(gloss)

        if not glosses:
            glosses = ["HELLO"]

        # Generate smooth bone rotation keyframes for Three.js humanoid avatar
        keyframes = self._generate_avatar_keyframes(glosses)
        duration = len(glosses) * 1.8

        return SpeechToAvatarResponse(
            source_text=spoken_text,
            isl_gloss_sequence=glosses,
            animation_duration_seconds=round(duration, 1),
            animation_keyframes=keyframes
        )

    def _generate_avatar_keyframes(self, gloss_sequence: List[str]) -> List[AvatarBoneKeyframe]:
        keyframes: List[AvatarBoneKeyframe] = []
        t = 0.0

        for gloss in gloss_sequence:
            # Rest pose
            keyframes.append(AvatarBoneKeyframe(
                time=round(t, 2),
                bone_rotations={
                    "right_arm": [0.2, 0.0, -0.4],
                    "right_forearm": [0.4, 0.0, 0.0],
                    "left_arm": [0.2, 0.0, 0.4],
                    "left_forearm": [0.4, 0.0, 0.0],
                    "head": [0.0, 0.0, 0.0]
                }
            ))
            t += 0.3

            # Sign stroke pose
            if gloss == "WATER":
                # Right hand curls to mouth
                keyframes.append(AvatarBoneKeyframe(
                    time=round(t + 0.5, 2),
                    bone_rotations={
                        "right_arm": [1.1, 0.3, -0.2],
                        "right_forearm": [1.8, 0.4, 0.1],
                        "left_arm": [0.2, 0.0, 0.3],
                        "left_forearm": [0.3, 0.0, 0.0],
                        "head": [-0.1, 0.0, 0.0]
                    }
                ))
            elif gloss == "HELLO":
                # Right hand wave
                keyframes.append(AvatarBoneKeyframe(
                    time=round(t + 0.5, 2),
                    bone_rotations={
                        "right_arm": [1.4, 0.5, 0.6],
                        "right_forearm": [1.2, 0.2, 0.4],
                        "left_arm": [0.2, 0.0, 0.3],
                        "left_forearm": [0.3, 0.0, 0.0],
                        "head": [0.0, 0.1, 0.0]
                    }
                ))
            elif gloss == "HELP":
                # Both hands cup together
                keyframes.append(AvatarBoneKeyframe(
                    time=round(t + 0.5, 2),
                    bone_rotations={
                        "right_arm": [0.9, -0.3, -0.1],
                        "right_forearm": [1.4, 0.0, 0.0],
                        "left_arm": [0.9, 0.3, 0.1],
                        "left_forearm": [1.4, 0.0, 0.0],
                        "head": [0.1, 0.0, 0.0]
                    }
                ))
            else: # THANK YOU / DEFAULT
                # Hand touches chin and extends forward
                keyframes.append(AvatarBoneKeyframe(
                    time=round(t + 0.5, 2),
                    bone_rotations={
                        "right_arm": [0.8, 0.0, 0.0],
                        "right_forearm": [0.9, 0.0, 0.0],
                        "left_arm": [0.2, 0.0, 0.3],
                        "left_forearm": [0.3, 0.0, 0.0],
                        "head": [0.0, 0.0, 0.0]
                    }
                ))
            
            t += 1.2
            # Return to ready position
            keyframes.append(AvatarBoneKeyframe(
                time=round(t, 2),
                bone_rotations={
                    "right_arm": [0.3, 0.0, -0.2],
                    "right_forearm": [0.5, 0.0, 0.0],
                    "left_arm": [0.3, 0.0, 0.2],
                    "left_forearm": [0.5, 0.0, 0.0],
                    "head": [0.0, 0.0, 0.0]
                }
            ))
            t += 0.3

        return keyframes

isl_engine = ISLGlossEngine()
