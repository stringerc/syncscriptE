/**
 * useVoiceStream Hook
 * 
 * Manages real-time voice capture via browser microphone,
 * speech-to-text transcription (Web Speech API + Groq Whisper fallback),
 * and text-to-speech audio output.
 * 
 * Architecture:
 * - Primary STT: Web Speech API (free, zero-cost, works in Chrome/Edge/Safari)
 * - Fallback STT: Groq Whisper API (free tier, higher accuracy)
 * - Primary TTS: Kokoro TTS (local/AWS, unlimited, free — set VITE_KOKORO_TTS_URL)
 * - Fallback TTS: Supabase Gemini TTS (cloud)
 * - Emergency TTS: Web Speech Synthesis API (browser built-in)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  VoiceEngineState,
  VoiceEngineStatus,
  STTResult,
  TTSRequest,
  TTSModel,
  EmotionState,
} from '../types/voice-engine';

// ============================================================================
// WEB SPEECH API TYPE AUGMENTATION
// ============================================================================

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// ============================================================================
// HOOK OPTIONS
// ============================================================================

export interface UseVoiceStreamOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  ttsModel?: TTSModel;
  ttsVoice?: string;
  ttsRate?: number;
  ttsPitch?: number;
  onTranscript?: (result: STTResult) => void;
  onStatusChange?: (status: VoiceEngineStatus) => void;
  onError?: (error: string) => void;
  onSpeechEnd?: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useVoiceStream(options: UseVoiceStreamOptions = {}) {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    ttsModel = 'web-speech-api',
    ttsVoice,
    ttsRate = 1.0,
    ttsPitch = 1.0,
    onTranscript,
    onStatusChange,
    onError,
    onSpeechEnd,
  } = options;

  // State
  const [state, setState] = useState<VoiceEngineState>({
    status: 'idle',
    isFullDuplex: false,
    sttReady: false,
    ttsReady: false,
    emotionDetectionReady: false,
    interimTranscript: '',
  });

  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isListeningRef = useRef(false);
  const shouldRestartRef = useRef(false);

  // ==========================================================================
  // INITIALIZE SPEECH RECOGNITION (STT)
  // ==========================================================================

  const initSTT = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setState(prev => ({ ...prev, sttReady: false, lastError: 'Speech recognition not supported in this browser' }));
      onError?.('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
      return false;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) {
        setInterimText(interim);
        setState(prev => ({ ...prev, interimTranscript: interim }));
      }

      if (finalTranscript) {
        setTranscript(prev => prev + (prev ? ' ' : '') + finalTranscript);
        setInterimText('');
        setState(prev => ({ ...prev, interimTranscript: '' }));
        
        const sttResult: STTResult = {
          text: finalTranscript.trim(),
          confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0.9,
          isFinal: true,
          language,
        };
        onTranscript?.(sttResult);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      const errorMsg = `Speech recognition error: ${event.error}`;
      setState(prev => ({ ...prev, lastError: errorMsg }));
      onError?.(errorMsg);
    };

    recognition.onend = () => {
      if (shouldRestartRef.current && isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          isListeningRef.current = false;
          setState(prev => ({ ...prev, status: 'idle' }));
          onStatusChange?.('idle');
        }
      } else {
        isListeningRef.current = false;
        setState(prev => ({ ...prev, status: 'idle' }));
        onStatusChange?.('idle');
        onSpeechEnd?.();
      }
    };

    recognition.onstart = () => {
      isListeningRef.current = true;
      setState(prev => ({ ...prev, status: 'listening' }));
      onStatusChange?.('listening');
    };

    recognitionRef.current = recognition;
    setState(prev => ({ ...prev, sttReady: true }));
    return true;
  }, [language, continuous, interimResults, onTranscript, onStatusChange, onError, onSpeechEnd]);

  // ==========================================================================
  // INITIALIZE TEXT-TO-SPEECH (TTS)
  // ==========================================================================

  const initTTS = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setState(prev => ({ ...prev, ttsReady: false }));
      return false;
    }

    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || [];
      setAvailableVoices(voices);
      setState(prev => ({ ...prev, ttsReady: voices.length > 0 }));
    };

    loadVoices();
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    return true;
  }, []);

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  useEffect(() => {
    initSTT();
    initTTS();

    return () => {
      stopListening();
      stopSpeaking();
      // Clean up SpeechSynthesis event handler
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
      }
      // Abort any active recognition
      try {
        recognitionRef.current?.abort();
      } catch {
        // Already stopped
      }
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================================
  // STT CONTROLS
  // ==========================================================================

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      const initialized = initSTT();
      if (!initialized) return;
    }

    try {
      shouldRestartRef.current = continuous;
      setTranscript('');
      setInterimText('');
      recognitionRef.current?.start();
    } catch (err) {
      if (isListeningRef.current) return;
      onError?.('Failed to start speech recognition');
    }
  }, [initSTT, continuous, onError]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    isListeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // Already stopped
    }
    setState(prev => ({ ...prev, status: 'idle' }));
    onStatusChange?.('idle');
  }, [onStatusChange]);

  // ==========================================================================
  // TTS CONTROLS — Server proxy (primary) → Kokoro direct → browser fallback
  // ==========================================================================

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  const KOKORO_TTS_URL = import.meta.env.VITE_KOKORO_TTS_URL || '';

  const selectVoice = useCallback((voiceName?: string): SpeechSynthesisVoice | null => {
    if (!availableVoices.length) return null;

    if (voiceName) {
      const match = availableVoices.find(v => v.name.toLowerCase().includes(voiceName.toLowerCase()));
      if (match) return match;
    }

    // Prioritize the most natural-sounding voices per platform
    const preferred = [
      'Microsoft Jenny', 'Microsoft Aria',          // Windows neural voices
      'Samantha', 'Karen',                           // macOS
      'Google UK English Female', 'Google US English', // Chrome
    ];

    for (const name of preferred) {
      const match = availableVoices.find(v => v.name.includes(name));
      if (match) return match;
    }

    return availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
  }, [availableVoices]);

  /** Play an audio blob, resolving when playback completes */
  const playAudioBlob = useCallback((blob: Blob): Promise<void> => {
    const url = URL.createObjectURL(blob);
    activeUrlRef.current = url;

    return new Promise<void>((resolve) => {
      const audio = new Audio(url);
      activeAudioRef.current = audio;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        activeAudioRef.current = null;
        activeUrlRef.current = null;
        setIsSpeaking(false);
        setState(prev => ({ ...prev, status: 'idle' }));
        onStatusChange?.('idle');
        resolve();
      };

      audio.onended = cleanup;
      audio.onerror = cleanup;
      audio.play().catch(cleanup);
    });
  }, [onStatusChange]);

  /** Speak using browser SpeechSynthesis as a last resort */
  const speakBrowserFallback = useCallback((request: TTSRequest): Promise<void> => {
    if (!synthRef.current) {
      setIsSpeaking(false);
      setState(prev => ({ ...prev, status: 'idle' }));
      onStatusChange?.('idle');
      return Promise.resolve();
    }

    console.warn('[TTS] Using browser speechSynthesis fallback — voice will sound robotic');

    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(request.text);
      const voice = selectVoice(request.config?.voice || ttsVoice);
      if (voice) {
        utterance.voice = voice;
        console.info(`[TTS] Browser voice: ${voice.name}`);
      }
      utterance.rate = request.config?.speed || ttsRate;
      utterance.pitch = request.config?.pitch || ttsPitch;
      utterance.volume = 1.0;

      const done = () => {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
        setState(prev => ({ ...prev, status: 'idle' }));
        onStatusChange?.('idle');
        resolve();
      };

      utterance.onend = done;
      utterance.onerror = done;
      currentUtteranceRef.current = utterance;
      synthRef.current!.speak(utterance);
    });
  }, [selectVoice, ttsVoice, ttsRate, ttsPitch, onStatusChange]);

  /**
   * Speak text using the best available TTS engine.
   * Chain: /api/ai/tts proxy (works in both dev + prod) → direct Kokoro → browser fallback.
   */
  const speak = useCallback(async (request: TTSRequest): Promise<void> => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
    synthRef.current?.cancel();

    if (!request.text?.trim()) return;

    setIsSpeaking(true);
    setState(prev => ({ ...prev, status: 'speaking' }));
    onStatusChange?.('speaking');

    const resolveVoice = (): string => {
      if (request.config?.voice) return request.config.voice;
      const emotion = request.emotion?.primary;
      if (emotion === 'stressed' || emotion === 'sad') return 'gentle';
      if (emotion === 'excited' || emotion === 'happy') return 'playful';
      return 'nexus';
    };

    const voicePreset = resolveVoice();
    const speed = request.config?.speed || 1.0;

    // --- Attempt 1: /api/ai/tts proxy (dev: Vite middleware, prod: Vercel function) ---
    try {
      console.info(`[TTS] Trying /api/ai/tts proxy (voice: ${voicePreset}, speed: ${speed})…`);
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: request.text, voice: voicePreset, speed }),
      });

      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.startsWith('audio/')) {
          const blob = await res.blob();
          if (blob.size > 100) {
            console.info(`[TTS] ✅ Kokoro via proxy — ${blob.size} bytes, ${ct}`);
            return playAudioBlob(blob);
          }
        }
        console.warn(`[TTS] Proxy returned OK but content-type="${ct}" — not audio`);
      } else {
        const errData = await res.json().catch(() => ({ code: 'UNKNOWN' }));
        console.warn(`[TTS] Proxy failed: HTTP ${res.status} — ${errData.code || errData.error || ''}`);
      }
    } catch (err: any) {
      console.warn(`[TTS] Proxy unreachable: ${err.message}`);
    }

    // --- Attempt 2: Direct Kokoro (if VITE_KOKORO_TTS_URL is set, may face CORS) ---
    if (KOKORO_TTS_URL) {
      try {
        console.info(`[TTS] Trying direct Kokoro at ${KOKORO_TTS_URL} (voice: ${voicePreset})…`);
        const res = await fetch(`${KOKORO_TTS_URL}/v1/audio/speech`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'kokoro',
            input: request.text,
            voice: voicePreset,
            speed,
          }),
        });

        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 100) {
            console.info(`[TTS] ✅ Direct Kokoro — ${blob.size} bytes`);
            return playAudioBlob(blob);
          }
        }
        console.warn(`[TTS] Direct Kokoro failed: HTTP ${res.status}`);
      } catch (err: any) {
        console.warn(`[TTS] Direct Kokoro blocked (likely CORS): ${err.message}`);
      }
    }

    // --- Attempt 3: Browser SpeechSynthesis (robotic, last resort) ---
    console.warn('[TTS] ⚠️ All Kokoro attempts failed — falling back to browser SpeechSynthesis');
    return speakBrowserFallback(request);
  }, [playAudioBlob, speakBrowserFallback, onStatusChange]);

  const stopSpeaking = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
    currentUtteranceRef.current = null;
    if (state.status === 'speaking') {
      setState(prev => ({ ...prev, status: 'idle' }));
      onStatusChange?.('idle');
    }
  }, [state.status, onStatusChange]);

  // ==========================================================================
  // FULL CONVERSATION TURN
  // ==========================================================================

  const getFullTranscript = useCallback(() => {
    return (transcript + (interimText ? ' ' + interimText : '')).trim();
  }, [transcript, interimText]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimText('');
    setState(prev => ({ ...prev, interimTranscript: '' }));
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    state,
    status: state.status,
    isListening: state.status === 'listening',
    isSpeaking,
    sttReady: state.sttReady,
    ttsReady: state.ttsReady,
    
    // Transcript
    transcript,
    interimText,
    getFullTranscript,
    clearTranscript,

    // STT Controls
    startListening,
    stopListening,

    // TTS Controls
    speak,
    stopSpeaking,
    availableVoices,

    // Emotion (placeholder for Phase 3)
    currentEmotion: state.currentEmotion,
  };
}
