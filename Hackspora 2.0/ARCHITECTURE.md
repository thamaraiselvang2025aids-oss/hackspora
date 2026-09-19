# OBSERVA System Architecture

OBSERVA is a multimodal accessibility operating system combining spatial computer vision, distance estimation, observation coverage awareness, acoustic hazard alerts, two-way Indian Sign Language (ISL) communication, and a silent emergency escalation system.

---

## 1. High-Level Architecture Diagram

```
                                  +-----------------------+
                                  |     USER SENSORS      |
                                  | Camera / Mic / GPS    |
                                  +-----------+-----------+
                                              |
                                              v
+-----------------------------------------------------------------------------------------+
|                                    PERCEPTION LAYER                                     |
|  +--------------------+  +----------------------+  +------------------+  +-----------+  |
|  | VisionProvider     |  | DepthProvider        |  | SoundProvider    |  | ISLProvider| |
|  | YOLO11-nano/OpenCV |  | Monocular Depth Est. |  | Audio Classifier |  | MediaPipe | |
|  +--------------------+  +----------------------+  +------------------+  +-----------+  |
+---------------------------------------------+-------------------------------------------+
                                              |
                                              v
+-----------------------------------------------------------------------------------------+
|                                MULTIMODAL WORLD STATE                                   |
|  * Spatial grid (Left/Center/Right)                * Environmental Sound Alerts         |
|  * Distance estimates (~1.4m, Near/Medium/Far)     * 3-Zone Observation Coverage Model  |
|  * Detected Obstacles & Clear Path Guidance        * Real-time Hand/Pose Landmarks      |
|  * Target Object tracking                          * Voice/Signing Activity (VAD/Motion)|
+---------------------------------------------+-------------------------------------------+
                                              |
                                              v
+-----------------------------------------------------------------------------------------+
|                              OBSERVA REASONING ENGINE                                   |
|  * Spatial Reasoning & Intent Extraction           * ISL Gloss <-> Natural Language     |
|  * Obstacle Clearance & Navigational Guidance      * Coverage Verification ("Not checked")
|  * Audio Queue & Interruptible Priority TTS        * Emergency Escalation Engine        |
+---------------------------------------------+-------------------------------------------+
                                              |
                                              v
+-----------------------------------------------------------------------------------------+
|                                FRONTEND MODES & UI                                      |
|  +---------------+  +---------------+  +------------------------+  +-----------------+  |
|  |  BLIND MODE   |  |   DEAF MODE   |  |    COMMUNICATE MODE    |  |  EMERGENCY SOS  |  |
|  | Vision, Path, |  | Sound Alerts, |  | Webcam Person, Hand    |  | 3-2-1 Cancel,   |  |
|  | Voice Search  |  | Haptics/Flash |  | Landmarks, 3D Avatar   |  | Map, Escalation |  |
|  +---------------+  +---------------+  +------------------------+  +-----------------+  |
|  +-----------------------------------------------------------------------------------+  |
|  | RECEIVER SCREEN: Real-time map, Live acknowledgement ("I'm Responding", latency)  |  |
|  | SYSTEM STATUS DRAWER: Live sensor/API telemetry & Explicit DEMO/LIVE switch       |  |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Core Modules & Provider Abstractions

### A. Vision & Spatial Guidance (`app/services/vision`)
- **`VisionProvider` Contract**: Abstract interface returning `{ class_name, confidence, bbox, center_x, center_y, distance_m, horizontal_zone }`.
- **`yolo_engine.py`**: YOLO11-nano / YOLOv8 integration for continuous object detection and horizontal classification:
  - `x < 0.25`: `LEFT`
  - `0.25 <= x < 0.42`: `SLIGHTLY LEFT`
  - `0.42 <= x <= 0.58`: `CENTER`
  - `0.58 < x <= 0.75`: `SLIGHTLY RIGHT`
  - `x > 0.75`: `RIGHT`
- **`depth_engine.py`**: Perspective geometry and pinhole focal calculation combining optical priors and vertical ground-plane perspective into calibrated approximate metrics (`~1.4 m`).
- **`spatial_reasoning.py`**: Lane clearance scoring across `LEFT | CENTER | RIGHT`, generating steering instructions (*"Obstacle ahead at ~0.8m. Move slightly right."*).

### B. 3-Zone Observation / Coverage Model
Prevents false-negative assertions on unexplored regions. When asked *"Is there a bag on my right?"*, if the right visual sector exploration ratio is `<0.6`, OBSERVA responds *"I haven't checked the right side yet. Turn slightly right."* rather than claiming the object does not exist.

### C. Environmental Acoustic Awareness (`app/services/audio`)
- **`SoundEventProvider`**: Analyzes acoustic signals for critical events:
  - Smoke Alarm (`CRITICAL`, Persistent Flash & Siren)
  - Siren (`HIGH`, Approaching vehicle warning)
  - Horn (`HIGH`, Roadway caution)
  - Doorbell & Knock (`MEDIUM`, Entrance alert)
  - Glass Break (`CRITICAL`, Impact alert)

### D. Two-Way ISL & 3D Avatar (`app/services/isl`)
- **`landmark_processor.py`**: Normalizes 21-joint hand coordinate vectors relative to wrist/palm origins and calculates kinetic motion energy for the *Still-Signing* indicator.
- **`isl_gloss_engine.py`**: Bidirectional translation between natural speech and ISL gloss sequences (*HELLO, WATER, HELP, THANK YOU, WHERE, DOCTOR, YES, NO, HUNGRY, PLEASE*).
- **`IslAvatar3D.tsx`**: Three.js humanoid rig with articulated shoulder, elbow, forearm, and hand bones animating in response to partner voice.

### E. Emergency SOS & Escalation System (`app/services/emergency`)
- **1-Tap SOS**: 3-second abort countdown with spatial beeps and haptics.
- **Categorized Distress**: *CANNOT SPEAK, MEDICAL, DANGER, FIRE, ACCIDENT, FOLLOWING, UNSAFE, OTHER*.
- **60s Contact Escalation Worker**: Background task automatically notifying the next prioritized contact if unacknowledged within 60s.
- **WebSocket Broadcast & Receiver Portal**: Real-time GPS location sync and "I'M RESPONDING" telemetry returning acknowledgment latency to the sender.
