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
 * - Primary TTS: Kokoro via /api/ai/tts (chunked landing pipeline for `cortana`, then monolithic proxy + direct).
 * - Direct: GET /api/ai/tts exposes primary + optional `kokoroFallbackDirectOrigin` (e.g. Oracle backup).
 * - Cortana preset: **no** browser SpeechSynthesis — neural-only or error (avoids robotic fallback).
 * - Other presets: Web Speech API last resort.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { disableTtsProxyForSession, isTtsProxyDisabled } from '../utils/tts-proxy-session';
import { NEXUS_LANDING_KOKORO_VOICE_ID } from '../utils/nexus-tts-prosody';
import { playNexusLandingKokoroTTS } from '../utils/nexus-kokoro-landing-playback';
import { ensureKokoroOriginsLoaded, getKokoroDirectBases } from '../utils/nexus-kokoro-tts-fetch';
import { reportTtsRum } from '../utils/tts-rum-beacon';
import { stepVuEnvelope } from '../utils/audio-vu-envelope';
import { voiceLatencyMark, voiceLatencyMeasure } from '../utils/voice-latency-debug';
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

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TTS_PROXY_ATTEMPTS = 3;

/** Monolithic Kokoro via Vercel proxy with transient 502/503/504 retries (cold ONNX / tunnel blips). */
async function fetchTtsProxyAudio(text: string, voice: string, speed: number): Promise<Blob | null> {
  if (isTtsProxyDisabled()) return null;
  for (let attempt = 0; attempt < TTS_PROXY_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, speed }),
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.startsWith('audio/')) {
          const blob = await res.blob();
          if (blob.size > 100) return blob;
        }
        return null;
      }
      const errData = (await res.json().catch(() => ({}))) as { code?: string; error?: string };
      if (errData.code === 'NO_TTS_URL') {
        disableTtsProxyForSession();
        return null;
      }
      if (res.status === 503 || res.status === 502 || res.status === 504) {
        await delayMs(400 * (attempt + 1));
        continue;
      }
      break;
    } catch {
      if (attempt < TTS_PROXY_ATTEMPTS - 1) await delayMs(400 * (attempt + 1));
    }
  }
  return null;
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

  /** STT is wired once on mount; always invoke latest parent callbacks (avoid stale closures). */
  const onTranscriptRef = useRef(onTranscript);
  const onStatusChangeRef = useRef(onStatusChange);
  const onSpeechEndRef = useRef(onSpeechEnd);
  const onErrorRef = useRef(onError);
  onTranscriptRef.current = onTranscript;
  onStatusChangeRef.current = onStatusChange;
  onSpeechEndRef.current = onSpeechEnd;
  onErrorRef.current = onError;

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
      onErrorRef.current?.('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
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
        onTranscriptRef.current?.(sttResult);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      if (event.error === 'not-allowed') {
        shouldRestartRef.current = false;
        isListeningRef.current = false;
      }
      const errorMsg = `Speech recognition error: ${event.error}`;
      setState(prev => ({ ...prev, lastError: errorMsg }));
      onErrorRef.current?.(errorMsg);
    };

    recognition.onend = () => {
      if (shouldRestartRef.current && isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          isListeningRef.current = false;
          setState(prev => ({ ...prev, status: 'idle' }));
          onStatusChangeRef.current?.('idle');
        }
      } else {
        isListeningRef.current = false;
        setState(prev => ({ ...prev, status: 'idle' }));
        onStatusChangeRef.current?.('idle');
        onSpeechEndRef.current?.();
      }
    };

    recognition.onstart = () => {
      isListeningRef.current = true;
      setState(prev => ({ ...prev, status: 'listening' }));
      onStatusChangeRef.current?.('listening');
    };

    recognitionRef.current = recognition;
    setState(prev => ({ ...prev, sttReady: true }));
    return true;
  }, [language, continuous, interimResults]);

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
      onErrorRef.current?.('Failed to start speech recognition');
    }
  }, [initSTT, continuous]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    isListeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // Already stopped
    }
    setState(prev => ({ ...prev, status: 'idle' }));
    onStatusChangeRef.current?.('idle');
  }, []);

  // ==========================================================================
  // TTS CONTROLS — Server proxy (primary) → Kokoro direct → browser fallback
  // ==========================================================================

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  /** Kokoro blob playback — Web Audio analyser for immersive blob reactivity */
  const ttsAudioCtxRef = useRef<AudioContext | null>(null);
  const ttsSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const ttsAnalyserNodeRef = useRef<AnalyserNode | null>(null);
  const ttsRafRef = useRef<number | null>(null);
  /** VU peak follower state for `playAudioBlob` path (persists across RAF ticks; reset in cleanup). */
  const ttsVuEnvelopeRef = useRef(0);
  const [ttsOutputLevel, setTtsOutputLevel] = useState(0);
  /** Aborts chunked landing Kokoro playback when `speak`/`stopSpeaking` interrupts. */
  const landingKokoroAbortRef = useRef<AbortController | null>(null);

  const cleanupTtsAnalyzer = useCallback(() => {
    if (ttsRafRef.current != null) {
      cancelAnimationFrame(ttsRafRef.current);
      ttsRafRef.current = null;
    }
    try {
      ttsSourceNodeRef.current?.disconnect();
    } catch {
      /* already disconnected */
    }
    ttsSourceNodeRef.current = null;
    ttsAnalyserNodeRef.current = null;
    ttsVuEnvelopeRef.current = 0;
    setTtsOutputLevel(0);
  }, []);

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

  /** Play an audio blob, resolving when playback completes. Routes through AnalyserNode for `ttsOutputLevel`. */
  const playAudioBlob = useCallback(
    (blob: Blob): Promise<void> => {
      const url = URL.createObjectURL(blob);
      activeUrlRef.current = url;

      return new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        activeAudioRef.current = audio;

        let alive = true;

        const finish = () => {
          if (!alive) return;
          alive = false;
          cleanupTtsAnalyzer();
          if (activeUrlRef.current === url) {
            URL.revokeObjectURL(url);
            activeUrlRef.current = null;
          }
          if (activeAudioRef.current === audio) {
            activeAudioRef.current = null;
          }
          setIsSpeaking(false);
          setState(prev => ({ ...prev, status: 'idle' }));
          onStatusChangeRef.current?.('idle');
          resolve();
        };

        const tryWebAudio = (): boolean => {
          try {
            const AC =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AC) return false;

            let ctx = ttsAudioCtxRef.current;
            if (!ctx || ctx.state === 'closed') {
              ctx = new AC();
              ttsAudioCtxRef.current = ctx;
            }

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            /** Higher = less jitter in RMS (smoother orb; tiny tradeoff in peak “snap”). */
            analyser.smoothingTimeConstant = 0.93;

            const source = ctx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(ctx.destination);

            ttsSourceNodeRef.current = source;
            ttsAnalyserNodeRef.current = analyser;

            const data = new Uint8Array(analyser.fftSize);
            let lastSet = 0;

            const tick = () => {
              const node = ttsAnalyserNodeRef.current;
              if (!alive || !node) return;
              node.getByteTimeDomainData(data);
              let sum = 0;
              for (let i = 0; i < data.length; i++) {
                const v = (data[i] - 128) / 128;
                sum += v * v;
              }
              const rms = Math.sqrt(sum / data.length);
              const level = Math.min(1, rms * 6.2);
              ttsVuEnvelopeRef.current = stepVuEnvelope(level, ttsVuEnvelopeRef.current);

              const now = performance.now();
              if (now - lastSet > 52) {
                lastSet = now;
                setTtsOutputLevel(ttsVuEnvelopeRef.current);
              }

              ttsRafRef.current = requestAnimationFrame(tick);
            };

            ttsRafRef.current = requestAnimationFrame(tick);
            return true;
          } catch (err) {
            console.warn('[TTS] Web Audio routing failed, using built-in output', err);
            return false;
          }
        };

        const webOk = tryWebAudio();

        const startPlayback = async () => {
          if (webOk && ttsAudioCtxRef.current) {
            await ttsAudioCtxRef.current.resume().catch(() => {});
          }
          try {
            await audio.play();
          } catch {
            finish();
          }
        };

        audio.onended = finish;
        audio.onerror = () => finish();

        void startPlayback();
      });
    },
    [cleanupTtsAnalyzer],
  );

  /** Speak using browser SpeechSynthesis as a last resort */
  const speakBrowserFallback = useCallback((request: TTSRequest): Promise<void> => {
    if (!synthRef.current) {
      setIsSpeaking(false);
      setState(prev => ({ ...prev, status: 'idle' }));
      onStatusChangeRef.current?.('idle');
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
        onStatusChangeRef.current?.('idle');
        resolve();
      };

      utterance.onend = done;
      utterance.onerror = done;
      currentUtteranceRef.current = utterance;
      synthRef.current!.speak(utterance);
    });
  }, [selectVoice, ttsVoice, ttsRate, ttsPitch]);

  /**
   * Speak text using the best available TTS engine.
   * Chain: /api/ai/tts proxy (works in both dev + prod) → direct Kokoro → browser fallback.
   */
  const speak = useCallback(async (request: TTSRequest): Promise<void> => {
    cleanupTtsAnalyzer();
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
    synthRef.current?.cancel();
    landingKokoroAbortRef.current?.abort();
    landingKokoroAbortRef.current = null;

    if (!request.text?.trim()) return;

    voiceLatencyMark('tts_speak_enter');
    voiceLatencyMeasure('tts_precall_to_speak_enter', 'tts_precall', 'tts_speak_enter');

    const rumStart = typeof performance !== 'undefined' ? performance.now() : 0;

    setIsSpeaking(true);
    setState(prev => ({ ...prev, status: 'speaking' }));
    onStatusChangeRef.current?.('speaking');

    const resolveVoice = (): string => {
      if (request.config?.voice) return request.config.voice;
      const emotion = request.emotion?.primary;
      if (emotion === 'stressed' || emotion === 'sad') return 'gentle';
      if (emotion === 'excited' || emotion === 'happy') return 'playful';
      /** Match Nexus + desktop companion Kokoro preset (`cortana` custom voice). */
      return 'cortana';
    };

    const voicePreset = resolveVoice();
    const speed = request.config?.speed || 1.0;

    // --- Landing-identical Nexus: chunked prosody + voice fallbacks + trimmed Web Audio (+ cold replay) ---
    if (voicePreset === NEXUS_LANDING_KOKORO_VOICE_ID) {
      const runLanding = async (): Promise<boolean> => {
        const ac = new AbortController();
        landingKokoroAbortRef.current = ac;
        try {
          console.info('[TTS] Nexus landing pipeline (chunked prosody + cortana→natural→nexus→professional)…');
          return await playNexusLandingKokoroTTS(request.text, ac.signal, setTtsOutputLevel);
        } catch (err) {
          console.warn('[TTS] Landing Kokoro pipeline error — will retry or fall back', err);
          return false;
        } finally {
          landingKokoroAbortRef.current = null;
        }
      };

      let played = await runLanding();
      if (!played) {
        console.warn('[TTS] Landing pipeline produced no audio — cold replay after 450ms (ONNX warm-up)');
        await delayMs(450);
        played = await runLanding();
      }
      if (played) {
        reportTtsRum({
          outcome: 'ok',
          path: 'landing',
          voicePreset,
          durationMs: typeof performance !== 'undefined' ? performance.now() - rumStart : 0,
        });
        setIsSpeaking(false);
        setState(prev => ({ ...prev, status: 'idle' }));
        onStatusChangeRef.current?.('idle');
        return;
      }
      console.warn('[TTS] Landing Kokoro pipeline produced no audio — trying monolithic proxy');
    }

    // --- Monolithic /api/ai/tts proxy with transient retries (primary + server-side fallback Kokoro) ---
    console.info(`[TTS] Trying /api/ai/tts proxy (voice: ${voicePreset}, speed: ${speed})…`);
    const proxyBlob = await fetchTtsProxyAudio(request.text, voicePreset, speed);
    if (proxyBlob) {
      console.info(`[TTS] ✅ Kokoro via proxy — ${proxyBlob.size} bytes`);
      reportTtsRum({
        outcome: 'ok',
        path: 'proxy',
        voicePreset,
        durationMs: typeof performance !== 'undefined' ? performance.now() - rumStart : 0,
      });
      return playAudioBlob(proxyBlob);
    }

    // --- Direct Kokoro: primary + optional fallback origin from GET /api/ai/tts (Oracle / second tunnel) ---
    await ensureKokoroOriginsLoaded();
    const kokoroBases = getKokoroDirectBases();
    if (kokoroBases.length > 0) {
      for (let bi = 0; bi < kokoroBases.length; bi += 1) {
        const base = kokoroBases[bi];
        try {
          console.info(`[TTS] Trying direct Kokoro at ${base} (voice: ${voicePreset})…`);
          const res = await fetch(`${base}/v1/audio/speech`, {
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
              reportTtsRum({
                outcome: 'ok',
                path: bi === 0 ? 'direct_0' : 'direct_1',
                voicePreset,
                durationMs: typeof performance !== 'undefined' ? performance.now() - rumStart : 0,
              });
              return playAudioBlob(blob);
            }
          }
          console.warn(`[TTS] Direct Kokoro failed: HTTP ${res.status} (${base})`);
        } catch (err: unknown) {
          console.warn(`[TTS] Direct Kokoro error (${base}):`, err);
        }
      }
    }

    // --- Cortana / Nexus neural preset: never degrade to robotic browser SpeechSynthesis ---
    if (voicePreset === NEXUS_LANDING_KOKORO_VOICE_ID) {
      reportTtsRum({
        outcome: 'fail',
        path: 'fail',
        voicePreset,
        durationMs: typeof performance !== 'undefined' ? performance.now() - rumStart : 0,
        err: 'neural_unavailable',
      });
      setIsSpeaking(false);
      setState(prev => ({ ...prev, status: 'idle' }));
      onStatusChangeRef.current?.('idle');
      const msg =
        'Neural Cortana voice is unavailable (Kokoro unreachable). Check KOKORO_TTS_URL / tunnel — browser fallback is disabled for this preset.';
      console.error('[TTS]', msg);
      onErrorRef.current?.(msg);
      return;
    }

    console.warn('[TTS] ⚠️ All Kokoro attempts failed — browser SpeechSynthesis (non-Cortana preset)');
    reportTtsRum({
      outcome: 'ok',
      path: 'browser',
      voicePreset,
      durationMs: typeof performance !== 'undefined' ? performance.now() - rumStart : 0,
    });
    return speakBrowserFallback(request);
  }, [cleanupTtsAnalyzer, playAudioBlob, speakBrowserFallback]);

  const stopSpeaking = useCallback(() => {
    landingKokoroAbortRef.current?.abort();
    landingKokoroAbortRef.current = null;
    cleanupTtsAnalyzer();
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
      onStatusChangeRef.current?.('idle');
    }
  }, [cleanupTtsAnalyzer, state.status]);

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

  /** Clears live STT interim only — use after committing a final utterance so UI can show “thinking” without stale partial text. */
  const clearInterimTranscript = useCallback(() => {
    setInterimText('');
    setState(prev => ({ ...prev, interimTranscript: '' }));
  }, []);

  useEffect(() => {
    return () => {
      if (ttsAudioCtxRef.current && ttsAudioCtxRef.current.state !== 'closed') {
        ttsAudioCtxRef.current.close().catch(() => {});
      }
      ttsAudioCtxRef.current = null;
    };
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
    /** 0–1 RMS envelope while Kokoro blob audio is playing (Web Audio). 0 for browser SpeechSynthesis fallback. */
    ttsOutputLevel,
    sttReady: state.sttReady,
    ttsReady: state.ttsReady,
    
    // Transcript
    transcript,
    interimText,
    getFullTranscript,
    clearTranscript,
    clearInterimTranscript,

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
