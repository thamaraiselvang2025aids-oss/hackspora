export type AppMode = 'dashboard' | 'blind' | 'deaf' | 'nonverbal' | 'emergency-receiver';

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export type HorizontalZone = 'LEFT' | 'SLIGHTLY LEFT' | 'CENTER' | 'SLIGHTLY RIGHT' | 'RIGHT';

export interface DetectedObject {
  id: string;
  class_name: string;
  confidence: number;
  bbox: BoundingBox;
  center_x: number;
  center_y: number;
  distance_meters: number;
  distance_label: string; // "very close", "near", "medium distance", "far"
  horizontal_zone: HorizontalZone;
  is_obstacle: boolean;
  obstacle_priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface LaneClearance {
  lane: 'LEFT' | 'CENTER' | 'RIGHT';
  obstacle_score: number;
  clearance_meters: number;
  status: 'CLEAR' | 'CAUTION' | 'BLOCKED';
}

export interface PathGuidance {
  recommended_direction: 'FORWARD' | 'SLIGHTLY LEFT' | 'SLIGHTLY RIGHT' | 'STOP';
  instruction: string;
  urgency: 'NORMAL' | 'CAUTION' | 'WARNING' | 'CRITICAL';
  beep_frequency_hz?: number;
  lanes: LaneClearance[];
}

export interface SectorCoverage {
  sector: 'LEFT' | 'CENTER' | 'RIGHT';
  state: 'OBSERVED' | 'UNCERTAIN' | 'UNOBSERVED' | 'DEGRADED';
  exploration_ratio: number;
  last_observed_timestamp?: number;
}

export interface ObservationCoverage {
  overall_percentage: number;
  sectors: SectorCoverage[];
  unexplored_warning?: string;
}

export interface TargetMatchResult {
  target_query: string;
  found: boolean;
  matched_object?: DetectedObject;
  guidance_message: string;
  coverage_state_for_target?: string;
}

export interface VisionProcessResponse {
  timestamp: number;
  objects: DetectedObject[];
  target_result?: TargetMatchResult;
  path_guidance: PathGuidance;
  observation_coverage: ObservationCoverage;
  concise_narration: string;
  priority_level: number;
}

export interface SoundEvent {
  id: string;
  label: string;
  confidence: number;
  direction: 'LEFT' | 'CENTER' | 'RIGHT' | 'OMNIDIRECTIONAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: number;
  is_emergency: boolean;
  action_prompt: string;
}

export interface AudioClassifyResponse {
  sound_events: SoundEvent[];
  active_alert?: SoundEvent;
  ambient_noise_level: number;
  vad_speaking: boolean;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface HolisticFrame {
  timestamp: number;
  face_landmarks?: LandmarkPoint[];
  pose_landmarks?: LandmarkPoint[];
  left_hand_landmarks?: LandmarkPoint[];
  right_hand_landmarks?: LandmarkPoint[];
}

export interface ISLRecognizeResponse {
  detected_gloss?: string;
  natural_transcript: string;
  confidence: number;
  still_signing: boolean;
  motion_energy: number;
  supported_vocabulary: string[];
}

export interface AvatarBoneKeyframe {
  time: number;
  bone_rotations: Record<string, [number, number, number]>;
}

export interface SpeechToAvatarResponse {
  source_text: string;
  isl_gloss_sequence: string[];
  animation_duration_seconds: number;
  animation_keyframes: AvatarBoneKeyframe[];
}

export interface TrustedContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
  enabled: boolean;
  created_at: string;
}

export interface Emergency {
  id: string;
  user_id: string;
  user_name: string;
  type: string;
  message?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED';
  acknowledged_by?: string;
  acknowledged_at?: string;
  response_time_seconds?: number;
  escalation_level: number;
  current_notified_contact?: string;
  next_escalation_in_seconds?: number;
}

export interface ActivityEvent {
  id: string;
  mode: string;
  event_type: string;
  description: string;
  created_at: string;
}
