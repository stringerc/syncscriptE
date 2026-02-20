/**
 * Voice Resonance Engine Types
 * 
 * Type definitions for the SyncScript Voice AI system.
 * Supports browser-based voice conversations (free) and phone calls (premium).
 */

// ============================================================================
// VOICE SESSION
// ============================================================================

export interface VoiceSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  mode: 'browser' | 'phone';
  messages: VoiceMessage[];
  emotionTimeline: EmotionSnapshot[];
  contextSnapshot?: VoiceContextSnapshot;
}

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
  timestamp: number;
  duration?: number;
  emotion?: EmotionState;
  ttsModel?: TTSModel;
}

// ============================================================================
// SPEECH-TO-TEXT
// ============================================================================

export interface STTConfig {
  provider: 'web-speech-api' | 'groq-whisper' | 'deepgram';
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface STTResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  language?: string;
  duration?: number;
}

// ============================================================================
// TEXT-TO-SPEECH
// ============================================================================

export type TTSModel = 'kokoro' | 'orpheus' | 'sesame-csm' | 'web-speech-api';

export interface TTSConfig {
  model: TTSModel;
  voice?: string;
  speed?: number;
  pitch?: number;
  emotionTags?: string[];
}

export interface TTSRequest {
  text: string;
  config?: TTSConfig;
  emotion?: EmotionState;
  utteranceType?: 'acknowledgment' | 'response' | 'question' | 'long-form';
}

export interface TTSResult {
  audioBlob?: Blob;
  audioUrl?: string;
  duration: number;
  model: TTSModel;
}

// ============================================================================
// EMOTION DETECTION
// ============================================================================

export type EmotionLabel = 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'stressed' 
  | 'excited' 
  | 'confused' 
  | 'calm' 
  | 'tired';

export interface EmotionState {
  primary: EmotionLabel;
  confidence: number;
  valence: number;   // -1 (negative) to 1 (positive)
  arousal: number;   // 0 (low energy) to 1 (high energy)
  timestamp: number;
}

export interface EmotionSnapshot {
  emotion: EmotionState;
  timestamp: number;
  source: 'voice-analysis' | 'text-analysis' | 'context-inference';
}

// ============================================================================
// VOICE CONTEXT
// ============================================================================

export interface VoiceContextSnapshot {
  tasks: VoiceContextTask[];
  events: VoiceContextEvent[];
  resonanceScore: number;
  energyLevel: number;
  circadianPhase: 'morning-rise' | 'morning-peak' | 'afternoon-dip' | 'afternoon-recovery' | 'evening-wind-down' | 'night';
  currentTime: string;
  userName?: string;
  recentInsights?: string[];
}

export interface VoiceContextTask {
  id: string;
  title: string;
  priority: string;
  energyLevel: string;
  dueDate?: string;
  status: string;
}

export interface VoiceContextEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isUpcoming: boolean;
}

// ============================================================================
// VOICE MEMORY
// ============================================================================

export interface VoiceMemoryEntry {
  id: string;
  sessionId: string;
  timestamp: number;
  type: 'preference' | 'fact' | 'request' | 'insight' | 'emotion-pattern';
  content: string;
  importance: number; // 0-1
  tags?: string[];
  relatedEntries?: string[];
}

export interface VoiceMemoryStore {
  entries: VoiceMemoryEntry[];
  lastAccessed: number;
  totalSessions: number;
  userProfile: VoiceUserProfile;
}

export interface VoiceUserProfile {
  preferredVoice?: string;
  communicationStyle?: 'concise' | 'detailed' | 'casual' | 'formal';
  commonTopics?: string[];
  emotionPatterns?: Record<string, number>;
  peakConversationTimes?: number[];
}

// ============================================================================
// VOICE ENGINE STATE
// ============================================================================

export type VoiceEngineStatus = 
  | 'idle' 
  | 'listening' 
  | 'processing' 
  | 'speaking' 
  | 'error';

export interface VoiceEngineState {
  status: VoiceEngineStatus;
  isFullDuplex: boolean;
  currentSession?: VoiceSession;
  sttReady: boolean;
  ttsReady: boolean;
  emotionDetectionReady: boolean;
  lastError?: string;
  currentEmotion?: EmotionState;
  interimTranscript?: string;
}

// ============================================================================
// TTS ROUTER
// ============================================================================

export interface TTSRouterConfig {
  defaultModel: TTSModel;
  enableEmotionRouting: boolean;
  enableModelSwitching: boolean;
  models: {
    kokoro: { enabled: boolean; priority: number };
    orpheus: { enabled: boolean; priority: number };
    'sesame-csm': { enabled: boolean; priority: number };
    'web-speech-api': { enabled: boolean; priority: number };
  };
}

// ============================================================================
// PROACTIVE CHECK-INS
// ============================================================================

export interface ProactiveCheckIn {
  id: string;
  type: 'energy-low' | 'meeting-prep' | 'break-reminder' | 'goal-update' | 'schedule-change' | 'morning-briefing' | 'evening-recap';
  message: string;
  priority: 'low' | 'medium' | 'high';
  triggerCondition: string;
  scheduledFor?: number;
  dismissed?: boolean;
}

// ============================================================================
// PHONE INTEGRATION (Premium)
// ============================================================================

export interface PhoneCallConfig {
  phoneNumber: string;
  callType: 'outbound-briefing' | 'outbound-checkin' | 'inbound';
  maxDuration?: number;
  voiceId?: string;
  context?: VoiceContextSnapshot;
  userEmail?: string;
  userId?: string;
}

export interface PhoneCallStatus {
  callId: string;
  status: 'ringing' | 'connected' | 'ended' | 'failed';
  duration?: number;
  startedAt?: number;
  endedAt?: number;
}
