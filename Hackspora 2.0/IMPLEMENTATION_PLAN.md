# IMPLEMENTATION_PLAN - OBSERVA Multimodal Accessibility Platform

## 1. Current State
- Monorepo root directory initialized.
- Python 3.14 runtime with FastAPI, PyTorch, OpenCV, NumPy, SQLAlchemy, Pydantic, Uvicorn, and WebSockets available.
- Node.js v24 and npm 11 available for React + Vite + TypeScript frontend.

## 2. System Architecture
- **Perception Layer**: Pluggable providers (`VisionProvider`, `DepthProvider`, `SoundEventProvider`, `ISLProvider`, `SpeechProvider`).
- **Multimodal World State**: Spatial grid, relative depth (~1.4m), left/center/right visual lanes, 3-zone observation coverage, acoustic event classifier, MediaPipe hand/pose landmarks, motion/VAD activity.
- **Reasoning Engine**: Voice query target matching, local obstacle avoidance guidance, coverage uncertainty verification, ISL gloss translation, emergency escalation.
- **Frontend Modes**:
  1. *Blind Mode*: Live camera HUD, voice search, path clearance lanes, priority TTS queue, coverage indicator.
  2. *Deaf Mode*: Real-time acoustic listener, large persistent emergency banners (Smoke alarm, Siren, Doorbell, etc.), screen flash, and haptics.
  3. *Communicate Mode*: Live webcam person view, subtle cyan hand landmarks, still-speaking/signing indicator, live transcript, interactive Three.js 3D ISL avatar.
  4. *Emergency SOS & Receiver View*: 1-tap SOS, 3-second cancel countdown, categorized emergency dispatcher, device GPS map, multi-contact 60s escalation, and live second-user acknowledgment portal ("I'm Responding").
  5. *System Status Drawer & Demo Mode*: Sensor health monitors + switch between Live Sensors and deterministic judging test scenes.

## 3. Files to Create
### Backend
- `backend/requirements.txt`
- `backend/app/main.py`
- `backend/app/core/config.py`
- `backend/app/core/database.py`
- `backend/app/models/emergency.py`
- `backend/app/models/contact.py`
- `backend/app/models/event_log.py`
- `backend/app/schemas/vision.py`
- `backend/app/schemas/emergency.py`
- `backend/app/schemas/sound.py`
- `backend/app/schemas/isl.py`
- `backend/app/services/vision/provider.py`
- `backend/app/services/vision/yolo_engine.py`
- `backend/app/services/vision/depth_engine.py`
- `backend/app/services/vision/spatial_reasoning.py`
- `backend/app/services/audio/sound_classifier.py`
- `backend/app/services/audio/vad_engine.py`
- `backend/app/services/isl/landmark_processor.py`
- `backend/app/services/isl/isl_gloss_engine.py`
- `backend/app/services/speech/intent_extractor.py`
- `backend/app/services/emergency/emergency_manager.py`
- `backend/app/services/emergency/escalation_worker.py`
- `backend/app/websocket/manager.py`
- `backend/app/api/vision_router.py`
- `backend/app/api/audio_router.py`
- `backend/app/api/isl_router.py`
- `backend/app/api/emergency_router.py`
- `backend/app/api/contacts_router.py`
- `backend/app/api/status_router.py`

### Frontend
- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/tsconfig.json`
- `frontend/tailwind.config.js`
- `frontend/postcss.config.js`
- `frontend/index.html`
- `frontend/src/index.css`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/types/index.ts`
- `frontend/src/services/api.ts`
- `frontend/src/services/websocket.ts`
- `frontend/src/services/speech.ts`
- `frontend/src/services/audioPlayer.ts`
- `frontend/src/hooks/useCamera.ts`
- `frontend/src/hooks/useMicrophone.ts`
- `frontend/src/hooks/useObservationCoverage.ts`
- `frontend/src/components/layout/Header.tsx`
- `frontend/src/components/layout/SystemStatusDrawer.tsx`
- `frontend/src/components/avatar/IslAvatar3D.tsx`
- `frontend/src/features/dashboard/DashboardPage.tsx`
- `frontend/src/features/blind/BlindModePage.tsx`
- `frontend/src/features/deaf/DeafModePage.tsx`
- `frontend/src/features/nonverbal/CommunicateModePage.tsx`
- `frontend/src/features/emergency/SosCountdownModal.tsx`
- `frontend/src/features/emergency/EmergencyActiveView.tsx`
- `frontend/src/features/emergency/EmergencyReceiverPage.tsx`

### Documentation & Verification
- `README.md`
- `ARCHITECTURE.md`
- `DEMO_SCRIPT.md`
- `KNOWN_LIMITATIONS.md`
- `.env.example`
- `scripts/test_backend.py`

## 4. Files to Modify
- None (clean repository start).

## 5. Dependencies
- **Backend**: `fastapi`, `uvicorn`, `websockets`, `pydantic`, `sqlalchemy`, `opencv-python-headless`, `pillow`, `numpy`, `httpx`, `torch`, `transformers`.
- **Frontend**: `react`, `react-dom`, `lucide-react`, `framer-motion`, `three`, `@types/three`, `leaflet`, `@types/leaflet`, `tailwindcss`, `vite`, `typescript`.

## 6. AI Providers
- `VisionProvider`: Structured bounding box detection + left/center/right horizontal spatial mapper.
- `DepthProvider`: Calibrated relative depth estimator with approx notation (`~1.4 m`).
- `SoundEventProvider`: Acoustic classifier for sirens, alarms, horns, glass breaks, knocks, doorbells.
- `ISLProvider`: 21-landmark vector normalization + temporal gloss matching + 3D avatar bone keyframing.
- `SpeechProvider`: Natural query intent extraction + priority TTS queue.

## 7. Build Order
1. Backend core architecture, models, AI providers, WebSocket manager, and REST APIs.
2. Frontend build setup, design system (`#07111F`, `#14B8A6`, glassmorphism, accessible contrast), and App shell.
3. Blind Mode: Real camera feed, bounding box HUD, voice search, path clearance engine, and Observation Coverage widget.
4. Deaf Mode: Real-time audio listener, waveform canvas, flashing high-priority alert banners.
5. Communicate Mode: Person webcam view, MediaPipe hand landmark skeleton, live transcript, still-signing indicator, and Three.js 3D avatar.
6. Emergency System: SOS 3-2-1 countdown, categorized triggers, live GPS map, contact escalation worker, and Emergency Receiver screen with live response latency.
7. System Status Drawer and Explicit Demo Mode toggle.
8. Automated testing, smoke validation, and final documentation.

## 8. Testing Plan
- Automated backend unit tests for spatial reasoning, distance estimation, path scoring, observation coverage, and emergency escalation.
- Strict TypeScript frontend compilation (`npm run build`).
- End-to-end verification of all 6 user demo scenarios.

## 9. Known Limitations
- Monocular depth provides relative estimations rather than certified centimeter-grade LiDAR accuracy.
- ISL translation recognizes defined core vocabulary glosses rather than unrestricted natural sign language.
- Local path guidance is assistive visual lane clearance, not indoor GPS route mapping.
