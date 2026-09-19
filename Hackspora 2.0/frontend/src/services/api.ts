import {
  VisionProcessResponse,
  AudioClassifyResponse,
  ISLRecognizeResponse,
  SpeechToAvatarResponse,
  Emergency,
  TrustedContact,
  ActivityEvent,
  HolisticFrame
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://observa-backend.onrender.com/api' : `http://${window.location.hostname}:8000/api`);

export const api = {
  // Vision
  async processVisionFrame(
    imageBase64: string | null,
    targetQuery?: string,
    isDemo: boolean = false,
    demoScenario?: string,
    panAngle: number = 0
  ): Promise<VisionProcessResponse> {
    const res = await fetch(`${API_BASE}/vision/process-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: imageBase64,
        target_object_query: targetQuery || null,
        is_demo_mode: isDemo,
        demo_scenario: demoScenario || null,
        camera_pan_angle: panAngle
      })
    });
    if (!res.ok) throw new Error(`Vision API error: ${res.statusText}`);
    return res.json();
  },

  async resetCoverage(): Promise<void> {
    await fetch(`${API_BASE}/vision/reset-coverage`, { method: 'POST' });
  },

  // Audio / Deaf
  async classifyAudio(
    audioBase64?: string,
    ambientDb: number = 45,
    isDemo: boolean = false,
    simulatedEvent?: string
  ): Promise<AudioClassifyResponse> {
    const res = await fetch(`${API_BASE}/audio/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_base64: audioBase64 || null,
        ambient_db: ambientDb,
        is_demo_mode: isDemo,
        simulated_event: simulatedEvent || null
      })
    });
    if (!res.ok) throw new Error(`Audio API error: ${res.statusText}`);
    return res.json();
  },

  // ISL / Communicate
  async recognizeISLGesture(
    frames: HolisticFrame[],
    isSigning: boolean = false,
    isDemo: boolean = false,
    simulatedGloss?: string
  ): Promise<ISLRecognizeResponse> {
    const res = await fetch(`${API_BASE}/isl/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frames,
        is_signing: isSigning,
        is_demo_mode: isDemo,
        simulated_gloss: simulatedGloss || null
      })
    });
    if (!res.ok) throw new Error(`ISL API error: ${res.statusText}`);
    return res.json();
  },

  async speechToAvatar(spokenText: string): Promise<SpeechToAvatarResponse> {
    const res = await fetch(`${API_BASE}/isl/speech-to-avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spoken_text: spokenText })
    });
    if (!res.ok) throw new Error(`Avatar API error: ${res.statusText}`);
    return res.json();
  },

  async getISLVocabulary(): Promise<{ vocabulary: string[]; natural_gloss_map: Record<string, string> }> {
    const res = await fetch(`${API_BASE}/isl/vocabulary`);
    if (!res.ok) throw new Error(`Vocabulary API error`);
    return res.json();
  },

  // Emergency SOS
  async triggerEmergency(type: string, message?: string, lat?: number, lng?: number): Promise<Emergency> {
    const res = await fetch(`${API_BASE}/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        message: message || null,
        latitude: lat || null,
        longitude: lng || null
      })
    });
    if (!res.ok) throw new Error(`Emergency API error: ${res.statusText}`);
    return res.json();
  },

  async getActiveEmergency(): Promise<Emergency | null> {
    const res = await fetch(`${API_BASE}/emergency/active`);
    if (!res.ok) return null;
    return res.json();
  },

  async getEmergencyHistory(): Promise<Emergency[]> {
    const res = await fetch(`${API_BASE}/emergency/history`);
    if (!res.ok) return [];
    return res.json();
  },

  async acknowledgeEmergency(id: string, responderName: string = "Aisha Mohamed (Sister)"): Promise<Emergency> {
    const res = await fetch(`${API_BASE}/emergency/${id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responder_name: responderName })
    });
    if (!res.ok) throw new Error(`Emergency acknowledge error: ${res.statusText}`);
    return res.json();
  },

  async resolveEmergency(id: string): Promise<Emergency> {
    const res = await fetch(`${API_BASE}/emergency/${id}/resolve`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`Emergency resolve error: ${res.statusText}`);
    return res.json();
  },

  // Contacts
  async getContacts(): Promise<TrustedContact[]> {
    const res = await fetch(`${API_BASE}/contacts`);
    if (!res.ok) return [];
    return res.json();
  },

  async createContact(contact: Partial<TrustedContact>): Promise<TrustedContact> {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact)
    });
    if (!res.ok) throw new Error(`Contact error`);
    return res.json();
  },

  // Status & Telemetry
  async getSystemHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/status/system-health`);
    if (!res.ok) throw new Error('Health check error');
    return res.json();
  },

  async getRecentActivity(): Promise<ActivityEvent[]> {
    const res = await fetch(`${API_BASE}/status/recent-activity`);
    if (!res.ok) return [];
    return res.json();
  }
};
