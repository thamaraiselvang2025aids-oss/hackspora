# OBSERVA — Hackathon Judge Demo Script

This script walks through all 6 core scenarios demonstrating OBSERVA's multimodal accessibility capabilities.

---

## Scenario 1: Spatial Vision & Voice Object Search (Blind Mode)
1. **Navigate**: Click **"Blind Mode"** in the top navigation bar.
2. **Camera**: The webcam activates showing bounding boxes around detected items with approximate distance labels (e.g. `bottle ~1.4m (92%)`).
3. **Voice Search**:
   - Click **"Voice Search"** or type in the query bar: `"Find my water bottle"`.
   - OBSERVA responds with audio synthesis and status banner:
     *"Water bottle found. Slightly left, approximately 1.4 meters away."*
4. **Obstacle Lane Guidance**:
   - Switch the demo scene to **"Obstacle Center"** (or point camera at a chair).
   - The HUD updates:
     - `CENTER: BLOCKED ~0.8m`
     - `LEFT: CLEAR`
     - `RIGHT: CLEAR`
   - Voice prompt: *"Obstacle ahead at ~0.8m. Move slightly left toward target."*
   - Urgency beep plays through the audio synthesizer.

---

## Scenario 2: Observation & Coverage Awareness
1. In **Blind Mode**, query: `"Is there a bag on my right?"` while the right sector is unobserved.
2. OBSERVA inspects the 3-Zone Observation Coverage grid (`LEFT: 80%`, `CENTER: 95%`, `RIGHT: 40%`).
3. Rather than falsely saying "No bag", OBSERVA responds:
   *"I haven't checked the right side yet. Turn slightly right."*
4. Use the **Camera Pan slider** to pan right -> The right sector reaches 100% `OBSERVED` state -> Overall coverage increases to `92%`.

---

## Scenario 3: Environmental Sound Awareness (Deaf Mode)
1. Click **"Deaf Mode"** in the navigation bar.
2. Observe the live **Acoustic Oscilloscope** waveform and decibel level.
3. Under **Test Acoustic Event Classification**, click **"🚨 Smoke Alarm"**.
4. Observe the response:
   - Screen flashes with red danger glow.
   - Device triggers haptic vibration pulses (`navigator.vibrate`).
   - A large, persistent alert banner appears:
     **🚨 SMOKE ALARM (Direction: LEFT, Priority: CRITICAL)**
   - Click **"✓ Acknowledge Alert"** to silence the notification.

---

## Scenario 4: Live Person & Hand Landmark Skeleton (Communicate Mode)
1. Click **"Communicate"** in the navigation bar.
2. The user's front webcam activates showing the live person view.
3. A subtle cyan skeleton overlay tracks the 21 hand joints on screen.
4. Kinetic motion energy is monitored in real-time -> The **"● Still-Signing Indicator"** pulses: *"User is signing..."*
5. Click **"WATER"** under the test gesture vocabulary -> Live transcript appears:
   *"I would like some water."* with 92% confidence and automatic speech output.

---

## Scenario 5: Two-Way Conversation (Voice → 3D ISL Avatar)
1. On the right side of **Communicate Mode**, find the **ISL Avatar panel**.
2. Click **"Speak"** or type: `"I will bring you water"`.
3. Click **"Translate"**.
4. The system translates the natural sentence into the ISL gloss sequence: `WATER`.
5. The **Three.js 3D Humanoid Avatar** articulates its arm and forearm bones to sign the gesture sequence.

---

## Scenario 6: Silent Emergency SOS & Receiver Telemetry
1. Press the floating red **"SOS"** button in the header.
2. A **3-2-1 abort countdown modal** appears with audio beeps and haptic pulses.
3. Once the countdown completes, the **Silent Emergency Dispatch** screen opens.
4. Select category: **"CANNOT SPEAK"** -> GPS coordinates are attached.
5. In a second browser tab (or window), open the **"Receiver View"** tab.
6. The responder sees:
   - Real-time incident banner: *"Shahith Mohamed Needs Immediate Assistance"*
   - Category: `CANNOT SPEAK`
   - Map location marker.
7. Responder clicks **"I'M RESPONDING NOW"**.
8. The sender's screen immediately receives live WebSocket confirmation:
   *"✓ Emergency Acknowledged — Aisha Mohamed (Sister) is responding. Response time: 18 seconds"*.
