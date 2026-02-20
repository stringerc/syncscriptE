/**
 * TTS Model Router
 * 
 * Intelligently routes text-to-speech requests to the optimal model
 * based on utterance type, emotion, and content characteristics.
 * 
 * Supported models (Phase 2):
 * - Web Speech API: Built-in browser TTS (free, zero latency setup)
 * - Kokoro: 82M param model, sub-100ms, perfect for fast acknowledgments
 * - Orpheus: Emotion-controlled TTS with ~100ms streaming, Apache 2.0
 * - Sesame CSM: Most natural conversational speech, indistinguishable from human
 * 
 * The router selects the optimal model per utterance based on:
 * 1. Utterance type (acknowledgment, emotional, long-form, question, etc.)
 * 2. Detected user emotion (to adapt AI tone)
 * 3. Model availability (falls back gracefully)
 * 4. Circadian phase (calmer voice at night, energetic in morning)
 */

import type { TTSModel, TTSRequest, EmotionState } from '../types/voice-engine';

// ============================================================================
// MODEL AVAILABILITY REGISTRY
// ============================================================================

interface ModelCapability {
  available: boolean;
  latencyMs: number;
  supportsEmotion: boolean;
  supportsStreaming: boolean;
  naturalness: number; // 0-100, from benchmarks
  bestFor: string[];
}

const MODEL_CAPABILITIES: Record<TTSModel, ModelCapability> = {
  'web-speech-api': {
    available: true, // Always available in supported browsers
    latencyMs: 50,
    supportsEmotion: false,
    supportsStreaming: true,
    naturalness: 60,
    bestFor: ['acknowledgment', 'short-response', 'fallback'],
  },
  'kokoro': {
    available: true, // Local Docker or AWS — set VITE_KOKORO_TTS_URL
    latencyMs: 2000,
    supportsEmotion: false,
    supportsStreaming: true,
    naturalness: 82,
    bestFor: ['acknowledgment', 'short-response', 'question', 'conversational'],
  },
  'orpheus': {
    available: false, // Requires GPU backend
    latencyMs: 100,
    supportsEmotion: true,
    supportsStreaming: true,
    naturalness: 88,
    bestFor: ['emotional', 'question', 'short-response'],
  },
  'sesame-csm': {
    available: false, // Requires GPU backend
    latencyMs: 200,
    supportsEmotion: true,
    supportsStreaming: true,
    naturalness: 95,
    bestFor: ['long-form', 'emotional', 'conversational'],
  },
};

// Track which enhanced models have been enabled at runtime
const enabledModels = new Set<TTSModel>(['web-speech-api']);

export function enableTTSModel(model: TTSModel): void {
  enabledModels.add(model);
  MODEL_CAPABILITIES[model].available = true;
}

export function disableTTSModel(model: TTSModel): void {
  if (model !== 'web-speech-api') {
    enabledModels.delete(model);
    MODEL_CAPABILITIES[model].available = false;
  }
}

export function getAvailableModels(): TTSModel[] {
  return Array.from(enabledModels);
}

export function getModelCapabilities(model: TTSModel): ModelCapability {
  return MODEL_CAPABILITIES[model];
}

// ============================================================================
// UTTERANCE CLASSIFICATION
// ============================================================================

export type UtteranceType = 'acknowledgment' | 'short-response' | 'question' | 'long-form' | 'emotional' | 'conversational';

export function classifyUtterance(text: string, emotion?: EmotionState): UtteranceType {
  const wordCount = text.split(/\s+/).length;

  // Acknowledgments: very short confirmations
  if (wordCount <= 5 && /^(ok|okay|sure|got it|done|alright|perfect|great|yes|no|mmhmm|right|understood)/i.test(text)) {
    return 'acknowledgment';
  }

  // Emotional content: strong emotion detected
  if (emotion && emotion.primary !== 'neutral' && emotion.confidence > 0.6) {
    return 'emotional';
  }

  // Questions
  if (text.endsWith('?') || /^(what|how|when|where|why|would you|could you|can you|should I)/i.test(text)) {
    return 'question';
  }

  // Long-form conversational responses (40+ words with natural flow indicators)
  if (wordCount > 40) {
    if (text.includes('.') && (text.match(/\./g) || []).length >= 2) {
      return 'long-form';
    }
    return 'conversational';
  }

  // Medium-length responses with conversational markers
  if (wordCount > 15 && /\b(you know|by the way|actually|honestly|look|listen|so|well)\b/i.test(text)) {
    return 'conversational';
  }

  return 'short-response';
}

// ============================================================================
// INTELLIGENT ROUTER
// ============================================================================

export function routeTTSModel(request: TTSRequest): TTSModel {
  const utteranceType = request.utteranceType || classifyUtterance(request.text, request.emotion);

  // Priority-based routing: try the best model first, fall back as needed
  const routingPreferences: Record<UtteranceType, TTSModel[]> = {
    'acknowledgment': ['kokoro', 'web-speech-api'],
    'short-response': ['kokoro', 'orpheus', 'web-speech-api'],
    'question': ['orpheus', 'kokoro', 'web-speech-api'],
    'emotional': ['orpheus', 'sesame-csm', 'web-speech-api'],
    'conversational': ['sesame-csm', 'orpheus', 'web-speech-api'],
    'long-form': ['sesame-csm', 'orpheus', 'web-speech-api'],
  };

  const preferences = routingPreferences[utteranceType] || ['web-speech-api'];
  
  for (const model of preferences) {
    if (MODEL_CAPABILITIES[model].available) {
      return model;
    }
  }

  return 'web-speech-api';
}

// ============================================================================
// TTS CONFIGURATION
// ============================================================================

export interface TTSConfigResult {
  model: TTSModel;
  speed: number;
  pitch: number;
  emotionTags: string[];
  utteranceType: UtteranceType;
  naturalness: number;
  estimatedLatencyMs: number;
}

/**
 * Get the ideal TTS configuration based on the request, emotion, and context.
 * Adapts voice parameters to match the user's emotional state and the time of day.
 */
export function getTTSConfig(request: TTSRequest, circadianPhase?: string): TTSConfigResult {
  const model = routeTTSModel(request);
  const capability = MODEL_CAPABILITIES[model];
  const utteranceType = request.utteranceType || classifyUtterance(request.text, request.emotion);
  let speed = request.config?.speed || 1.0;
  let pitch = request.config?.pitch || 1.0;
  const emotionTags: string[] = [];

  // Circadian adaptation: adjust voice energy to match time of day
  if (circadianPhase) {
    switch (circadianPhase) {
      case 'morning-rise':
        speed *= 0.95;
        emotionTags.push('<warm>', '<encouraging>');
        break;
      case 'morning-peak':
        speed *= 1.05;
        emotionTags.push('<energetic>', '<confident>');
        break;
      case 'afternoon-dip':
        speed *= 0.92;
        pitch *= 0.98;
        emotionTags.push('<gentle>', '<steady>');
        break;
      case 'afternoon-recovery':
        emotionTags.push('<focused>', '<clear>');
        break;
      case 'evening-wind-down':
        speed *= 0.90;
        pitch *= 0.97;
        emotionTags.push('<calm>', '<reflective>');
        break;
      case 'night':
        speed *= 0.85;
        pitch *= 0.95;
        emotionTags.push('<soft>', '<quiet>');
        break;
    }
  }

  // Emotion-adaptive parameters
  if (request.emotion) {
    switch (request.emotion.primary) {
      case 'excited':
      case 'happy':
        speed = Math.min(speed * 1.1, 1.4);
        pitch = Math.min(pitch * 1.05, 1.5);
        emotionTags.push('<excited>', '<happy>');
        break;
      case 'calm':
        speed *= 0.95;
        emotionTags.push('<calm>', '<gentle>');
        break;
      case 'stressed':
        speed *= 0.9;
        pitch *= 0.98;
        emotionTags.push('<supportive>', '<calm>', '<reassuring>');
        break;
      case 'tired':
        speed *= 0.85;
        emotionTags.push('<gentle>', '<soft>', '<understanding>');
        break;
      case 'sad':
        speed *= 0.88;
        emotionTags.push('<empathetic>', '<warm>', '<caring>');
        break;
      case 'angry':
        speed *= 0.92;
        emotionTags.push('<calm>', '<measured>', '<patient>');
        break;
      case 'confused':
        speed *= 0.90;
        emotionTags.push('<clear>', '<patient>', '<structured>');
        break;
    }
  }

  // Utterance-type adjustments
  switch (utteranceType) {
    case 'acknowledgment':
      speed = Math.min(speed * 1.15, 1.5);
      break;
    case 'long-form':
    case 'conversational':
      speed *= 0.95;
      break;
  }

  // Clamp values
  speed = Math.max(0.5, Math.min(speed, 1.8));
  pitch = Math.max(0.5, Math.min(pitch, 2.0));

  return {
    model,
    speed,
    pitch,
    emotionTags,
    utteranceType,
    naturalness: capability.naturalness,
    estimatedLatencyMs: capability.latencyMs,
  };
}
