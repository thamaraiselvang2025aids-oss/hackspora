# OBSERVA — Next-Generation Multimodal Accessibility Operating System

> *"See what matters. Know where it is. Know what you haven't seen."*

OBSERVA is a multimodal accessibility platform engineered for visually impaired, deaf/hard-of-hearing, and non-verbal users, integrated with a real-time Silent Emergency SOS & Escalation system.

---

## Key Features

1. **Spatial Computer Vision & Depth**: Continuous YOLO11 object detection with calibrated relative distance estimation (`~1.4 m`).
2. **Voice-Driven Object Search**: Natural voice query intent extraction (*"Find my water bottle"* -> directional steering).
3. **Local Obstacle Guidance**: 3-Lane visual clearance scoring (`LEFT | CENTER | RIGHT`) with obstacle avoidance audio beeps.
4. **3-Zone Observation / Coverage Model**: Prevents false-negative assertions on unexplored visual sectors.
5. **Environmental Acoustic Alerts**: Real-time sound monitoring for smoke alarms, sirens, horns, knocks, and doorbells with persistent screen flash and vibration feedback.
6. **Two-Way ISL Communication**: Live webcam person view with 21-joint hand landmark skeleton tracking, still-signing motion energy monitor, and Three.js 3D ISL Avatar.
7. **Silent Emergency SOS & Receiver Portal**: 1-tap SOS with 3-second abort countdown, GPS location tagging, 60s contact escalation ladder, and dedicated second-user acknowledgment screen ("I'M RESPONDING").
8. **System Status Drawer & Demo Mode**: Live hardware sensor telemetry plus an explicit **DEMO / LIVE** switch for deterministic judging scenes.

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Three.js (3D Avatar), Web Audio API, Web Speech API, Geolocation API.
- **Backend**: Python FastAPI, WebSockets, SQLAlchemy, SQLite, Pydantic, OpenCV, PyTorch, Ultralytics YOLO11, Transformers.

---

## Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### 1. Start Backend
```bash
# Navigate to backend and install requirements (if not already installed)
pip install -r backend/requirements.txt

# Start FastAPI server
python backend/run.py
```
Backend will be live at: `http://127.0.0.1:8000` (API Docs: `http://127.0.0.1:8000/docs`).

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at: `http://localhost:5173`.

### 3. Run Backend Automated Tests
```bash
python scripts/test_backend.py
```

---

## Monorepo Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # REST Routers (vision, audio, isl, emergency, contacts, status)
│   │   ├── core/         # Config, SQLite Database
│   │   ├── models/       # SQLAlchemy models (Emergency, Contacts, Activity Logs)
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # AI Perception Providers (Vision, Depth, Audio, ISL, Speech, Emergency)
│   │   └── websocket/    # Real-time WebSocket Hub
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/   # Layout, Header, System Status Drawer, 3D ISL Avatar
│   │   ├── features/     # Blind Mode, Deaf Mode, Communicate Mode, Emergency Views
│   │   ├── hooks/        # useCamera, useMicrophone, useEmergencyWs
│   │   ├── services/     # API Client, Speech Synth, Audio Beeps
│   │   └── types/        # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   ├── setup.bat
│   └── test_backend.py
├── ARCHITECTURE.md
├── DEMO_SCRIPT.md
├── KNOWN_LIMITATIONS.md
└── IMPLEMENTATION_PLAN.md
```
