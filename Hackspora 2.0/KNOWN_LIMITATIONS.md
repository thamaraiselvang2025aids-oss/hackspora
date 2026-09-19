# OBSERVA — Known Limitations & Engineering Boundaries

This document provides transparent notes on the prototype's current technical boundaries and production upgrade paths.

---

## 1. Monocular Depth vs. Dedicated LiDAR / Time-of-Flight
- **Current State**: Monocular depth estimates are calculated using optical geometry, bounding box heights, and vertical perspective heuristics. Distances are labeled with approximate notation (`~1.4 m`, `near`, `medium distance`).
- **Production Path**: In production hardware (smart glasses or iOS/Android devices with LiDAR sensors), the `DepthProvider` abstraction connects directly to the hardware depth stream for millimeter-accurate point clouds.

---

## 2. ISL Vocabulary Scope
- **Current State**: The prototype recognizes and translates a core vocabulary of 12 essential Indian Sign Language glosses (*HELLO, WATER, HELP, THANK YOU, WHERE, DOCTOR, YES, NO, HUNGRY, PLEASE, NAME, EMERGENCY*).
- **Production Path**: Continuous temporal sequence models (Transformer / LSTM trained on ISL-CSL datasets) with finger-spelling recognition for arbitrary words.

---

## 3. Local Navigation Guidance vs. Indoor Slam Mapping
- **Current State**: The path guidance engine calculates local visual lane clearance across `LEFT | CENTER | RIGHT` sectors. It acts as an assistive collision-avoidance co-pilot rather than a turn-by-turn indoor GPS route planner.
- **Production Path**: Integration with Apple ARKit / Google ARCore Visual Inertial Odometry (VIO) and spatial anchors.

---

## 4. Acoustic Classification Under Heavy Noise
- **Current State**: Environmental sound classifier filters and scores decibel frequency bands with directionality.
- **Production Path**: On-device micro-YAMNet acoustic classifier model fine-tuned on ISO emergency sound benchmarks.
