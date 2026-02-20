/**
 * useEmotionDetection Hook
 * 
 * Real-time emotion detection from voice and text input.
 * 
 * Phase 1: Text-based sentiment analysis (lightweight, free)
 * Phase 3: Voice prosody analysis via EchoWave SDK (advanced)
 * 
 * Detects: neutral, happy, sad, angry, stressed, excited, confused, calm, tired
 * Uses valence-arousal model for nuanced emotion representation.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { EmotionState, EmotionLabel, EmotionSnapshot } from '../types/voice-engine';

// ============================================================================
// SENTIMENT LEXICON (text-based detection)
// ============================================================================

const EMOTION_PATTERNS: Record<EmotionLabel, { words: string[]; valence: number; arousal: number }> = {
  happy: {
    words: ['happy', 'great', 'awesome', 'love', 'amazing', 'wonderful', 'fantastic', 'excited', 'perfect', 'excellent', 'yay', 'nice', 'good', 'brilliant'],
    valence: 0.8, arousal: 0.6,
  },
  excited: {
    words: ['excited', 'incredible', 'unbelievable', 'wow', 'insane', 'absolutely', 'pumped', 'thrilled', 'can\'t wait', 'let\'s go', 'fire', 'crushing it'],
    valence: 0.9, arousal: 0.9,
  },
  stressed: {
    words: ['stressed', 'overwhelmed', 'too much', 'behind', 'deadline', 'pressure', 'can\'t', 'impossible', 'drowning', 'swamped', 'anxious', 'worried', 'panic'],
    valence: -0.6, arousal: 0.7,
  },
  sad: {
    words: ['sad', 'disappointed', 'failed', 'lost', 'miss', 'regret', 'unfortunately', 'bad', 'terrible', 'awful', 'worst', 'hopeless'],
    valence: -0.7, arousal: 0.2,
  },
  angry: {
    words: ['angry', 'frustrated', 'annoyed', 'hate', 'stupid', 'ridiculous', 'unacceptable', 'furious', 'mad', 'pissed', 'damn'],
    valence: -0.8, arousal: 0.8,
  },
  confused: {
    words: ['confused', 'don\'t understand', 'what', 'huh', 'unclear', 'lost', 'not sure', 'maybe', 'how', 'why', 'doesn\'t make sense'],
    valence: -0.2, arousal: 0.4,
  },
  calm: {
    words: ['calm', 'relaxed', 'peaceful', 'fine', 'okay', 'chill', 'steady', 'balanced', 'zen', 'content'],
    valence: 0.3, arousal: 0.2,
  },
  tired: {
    words: ['tired', 'exhausted', 'sleepy', 'drained', 'burnt out', 'burnout', 'fatigue', 'low energy', 'need rest', 'wiped'],
    valence: -0.3, arousal: 0.1,
  },
  neutral: {
    words: [],
    valence: 0, arousal: 0.3,
  },
};

// ============================================================================
// HOOK
// ============================================================================

export function useEmotionDetection() {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>({
    primary: 'neutral',
    confidence: 0.5,
    valence: 0,
    arousal: 0.3,
    timestamp: Date.now(),
  });

  const [emotionHistory, setEmotionHistory] = useState<EmotionSnapshot[]>([]);
  const smoothingWindowRef = useRef<EmotionState[]>([]);

  // ==========================================================================
  // TEXT-BASED EMOTION DETECTION
  // ==========================================================================

  const analyzeTextEmotion = useCallback((text: string): EmotionState => {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    // Score each emotion
    const scores: Record<EmotionLabel, number> = {
      neutral: 0.1,
      happy: 0,
      sad: 0,
      angry: 0,
      stressed: 0,
      excited: 0,
      confused: 0,
      calm: 0,
      tired: 0,
    };

    for (const [emotion, config] of Object.entries(EMOTION_PATTERNS)) {
      for (const keyword of config.words) {
        if (keyword.includes(' ')) {
          // Multi-word pattern
          if (lowerText.includes(keyword)) {
            scores[emotion as EmotionLabel] += 2;
          }
        } else {
          // Single word
          if (words.includes(keyword)) {
            scores[emotion as EmotionLabel] += 1;
          }
        }
      }
    }

    // Question marks suggest confusion
    const questionMarks = (text.match(/\?/g) || []).length;
    if (questionMarks > 0) scores.confused += questionMarks * 0.5;

    // Exclamation marks suggest excitement or strong emotion
    const exclamationMarks = (text.match(/!/g) || []).length;
    if (exclamationMarks > 0) {
      scores.excited += exclamationMarks * 0.3;
      scores.happy += exclamationMarks * 0.2;
    }

    // ALL CAPS words suggest strong emotion
    const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase()).length;
    if (capsWords > 0) {
      scores.excited += capsWords * 0.5;
      scores.stressed += capsWords * 0.3;
    }

    // Find the highest scoring emotion
    let maxEmotion: EmotionLabel = 'neutral';
    let maxScore = 0;
    let totalScore = 0;

    for (const [emotion, score] of Object.entries(scores)) {
      totalScore += score;
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion as EmotionLabel;
      }
    }

    const confidence = totalScore > 0 ? Math.min(maxScore / totalScore, 0.95) : 0.5;
    const emotionConfig = EMOTION_PATTERNS[maxEmotion];

    return {
      primary: maxEmotion,
      confidence,
      valence: emotionConfig.valence,
      arousal: emotionConfig.arousal,
      timestamp: Date.now(),
    };
  }, []);

  // ==========================================================================
  // EMOTION SMOOTHING (prevents rapid flipping)
  // ==========================================================================

  const smoothEmotion = useCallback((newEmotion: EmotionState): EmotionState => {
    const window = smoothingWindowRef.current;
    window.push(newEmotion);
    
    // Keep last 3 readings
    if (window.length > 3) {
      window.shift();
    }

    // If only one reading, return it
    if (window.length === 1) return newEmotion;

    // Count occurrences of each emotion in the window
    const counts: Partial<Record<EmotionLabel, number>> = {};
    for (const e of window) {
      counts[e.primary] = (counts[e.primary] || 0) + 1;
    }

    // Find the most frequent emotion in the window
    let dominantEmotion = newEmotion.primary;
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion as EmotionLabel;
      }
    }

    // If the new reading matches the dominant, use it; otherwise keep the dominant
    if (newEmotion.primary === dominantEmotion) {
      return newEmotion;
    }

    // Return the dominant emotion with averaged values
    const dominantReadings = window.filter(e => e.primary === dominantEmotion);
    return {
      primary: dominantEmotion,
      confidence: dominantReadings.reduce((sum, e) => sum + e.confidence, 0) / dominantReadings.length,
      valence: dominantReadings.reduce((sum, e) => sum + e.valence, 0) / dominantReadings.length,
      arousal: dominantReadings.reduce((sum, e) => sum + e.arousal, 0) / dominantReadings.length,
      timestamp: Date.now(),
    };
  }, []);

  // ==========================================================================
  // VOICE PROSODY ANALYSIS (Phase 3)
  // Uses Web Audio API to analyze pitch, energy, and speaking rate
  // ==========================================================================

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startAudioAnalysis = useCallback(async (stream?: MediaStream): Promise<void> => {
    try {
      const mediaStream = stream || await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = mediaStream;
      const audioContext = new AudioContext();
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      analyzer.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyzer);

      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;
      sourceRef.current = source;
    } catch {
      // Audio analysis unavailable, fall back to text-only
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    sourceRef.current?.disconnect();
    audioContextRef.current?.close();
    // Stop all media tracks to release the microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    audioContextRef.current = null;
    analyzerRef.current = null;
    sourceRef.current = null;
  }, []);

  // Cleanup audio resources on unmount
  useEffect(() => {
    return () => {
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const analyzeVoiceProsody = useCallback((): { energy: number; pitch: number; variability: number } | null => {
    if (!analyzerRef.current) return null;

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Float32Array(bufferLength);

    analyzer.getByteTimeDomainData(dataArray);
    analyzer.getFloatFrequencyData(frequencyData);

    // Calculate energy (RMS of waveform)
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const energy = Math.sqrt(sumSquares / bufferLength);

    // Estimate pitch from frequency data (find dominant frequency)
    let maxMagnitude = -Infinity;
    let dominantBin = 0;
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    for (let i = 1; i < bufferLength; i++) {
      if (frequencyData[i] > maxMagnitude) {
        maxMagnitude = frequencyData[i];
        dominantBin = i;
      }
    }
    const pitch = (dominantBin * sampleRate) / (analyzer.fftSize);

    // Calculate spectral variability (indicator of expressiveness)
    let variabilitySum = 0;
    const mean = frequencyData.reduce((a, b) => a + b, 0) / bufferLength;
    for (let i = 0; i < bufferLength; i++) {
      variabilitySum += Math.pow(frequencyData[i] - mean, 2);
    }
    const variability = Math.sqrt(variabilitySum / bufferLength);

    return { energy, pitch, variability };
  }, []);

  const detectFromVoice = useCallback((): EmotionState => {
    const prosody = analyzeVoiceProsody();
    if (!prosody) {
      return currentEmotion; // No audio data, return current
    }

    const { energy, pitch, variability } = prosody;
    let primary: EmotionLabel = 'neutral';
    let valence = 0;
    let arousal = Math.min(energy * 5, 1);
    let confidence = 0.4;

    // High energy + high pitch = excited/happy
    if (energy > 0.15 && pitch > 300) {
      primary = 'excited';
      valence = 0.8;
      confidence = 0.6;
    }
    // High energy + low pitch = angry/stressed
    else if (energy > 0.15 && pitch < 200) {
      primary = 'stressed';
      valence = -0.5;
      confidence = 0.5;
    }
    // Low energy + low variability = tired/calm
    else if (energy < 0.05) {
      primary = energy < 0.02 ? 'tired' : 'calm';
      valence = energy < 0.02 ? -0.2 : 0.2;
      arousal = 0.2;
      confidence = 0.5;
    }
    // High variability = expressive (happy or confused)
    else if (variability > 30) {
      primary = pitch > 250 ? 'happy' : 'confused';
      valence = pitch > 250 ? 0.6 : -0.2;
      confidence = 0.45;
    }

    const emotion: EmotionState = {
      primary,
      confidence,
      valence,
      arousal,
      timestamp: Date.now(),
    };

    const smoothed = smoothEmotion(emotion);
    setCurrentEmotion(smoothed);
    setEmotionHistory(prev => [
      ...prev.slice(-49),
      { emotion: smoothed, timestamp: Date.now(), source: 'voice-analysis' },
    ]);

    return smoothed;
  }, [analyzeVoiceProsody, currentEmotion, smoothEmotion]);

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  const detectFromText = useCallback((text: string): EmotionState => {
    const rawEmotion = analyzeTextEmotion(text);

    // If audio analysis is available, blend text + voice emotions
    const voiceProsody = analyzeVoiceProsody();
    let blendedEmotion = rawEmotion;

    if (voiceProsody && voiceProsody.energy > 0.01) {
      const voiceEmotion = detectFromVoice();
      // Weight: 60% text, 40% voice
      blendedEmotion = {
        primary: rawEmotion.confidence > voiceEmotion.confidence ? rawEmotion.primary : voiceEmotion.primary,
        confidence: rawEmotion.confidence * 0.6 + voiceEmotion.confidence * 0.4,
        valence: rawEmotion.valence * 0.6 + voiceEmotion.valence * 0.4,
        arousal: rawEmotion.arousal * 0.6 + voiceEmotion.arousal * 0.4,
        timestamp: Date.now(),
      };
    }

    const smoothed = smoothEmotion(blendedEmotion);
    
    setCurrentEmotion(smoothed);
    setEmotionHistory(prev => [
      ...prev.slice(-49),
      { emotion: smoothed, timestamp: Date.now(), source: voiceProsody ? 'voice-analysis' : 'text-analysis' },
    ]);

    return smoothed;
  }, [analyzeTextEmotion, smoothEmotion, analyzeVoiceProsody, detectFromVoice]);

  const getEmotionColor = useCallback((emotion: EmotionLabel): string => {
    const colors: Record<EmotionLabel, string> = {
      neutral: '#94a3b8',
      happy: '#22c55e',
      excited: '#f59e0b',
      stressed: '#ef4444',
      sad: '#6366f1',
      angry: '#dc2626',
      confused: '#a855f7',
      calm: '#06b6d4',
      tired: '#64748b',
    };
    return colors[emotion];
  }, []);

  const getEmotionEmoji = useCallback((emotion: EmotionLabel): string => {
    const emojis: Record<EmotionLabel, string> = {
      neutral: '',
      happy: '',
      excited: '',
      stressed: '',
      sad: '',
      angry: '',
      confused: '',
      calm: '',
      tired: '',
    };
    return emojis[emotion];
  }, []);

  /**
   * Get a human-readable trend from the emotion history
   */
  const getEmotionTrend = useCallback((): string => {
    if (emotionHistory.length < 3) return 'neutral';
    const recent = emotionHistory.slice(-5);
    const avgValence = recent.reduce((sum, s) => sum + s.emotion.valence, 0) / recent.length;
    const avgArousal = recent.reduce((sum, s) => sum + s.emotion.arousal, 0) / recent.length;
    
    if (avgValence > 0.3 && avgArousal > 0.5) return 'improving';
    if (avgValence < -0.3 && avgArousal > 0.5) return 'escalating';
    if (avgValence < -0.3 && avgArousal < 0.3) return 'declining';
    return 'stable';
  }, [emotionHistory]);

  return {
    currentEmotion,
    emotionHistory,
    detectFromText,
    detectFromVoice,
    startAudioAnalysis,
    stopAudioAnalysis,
    getEmotionColor,
    getEmotionEmoji,
    getEmotionTrend,
  };
}
