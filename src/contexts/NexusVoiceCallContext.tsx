import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useVoiceStream } from '../hooks/useVoiceStream';
import type { STTResult, TTSRequest } from '../types/voice-engine';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface NexusMessage {
  id: string;
  role: 'user' | 'nexus';
  text: string;
  timestamp: number;
}

export type NexusCallStatus = 'idle' | 'connecting' | 'active' | 'ending';

interface NexusVoiceCallState {
  isCallActive: boolean;
  callStatus: NexusCallStatus;
  messages: NexusMessage[];
  callDuration: number;
  sessionId: string | null;
  interimText: string;
  isSpeaking: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isVoiceLoading: boolean;
}

interface NexusVoiceCallContextValue extends NexusVoiceCallState {
  startCall: () => Promise<void>;
  endCall: () => void;
  sendTextMessage: (text: string) => void;
}

const NexusVoiceCallContext = createContext<NexusVoiceCallContextValue | null>(null);

export function useNexusVoiceCall() {
  const ctx = useContext(NexusVoiceCallContext);
  if (!ctx) throw new Error('useNexusVoiceCall must be used within NexusVoiceCallProvider');
  return ctx;
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const MAX_CALL_DURATION = 300;
const GOODBYE_LINGER_MS = 1800;
const NEXUS_GUEST_API = '/api/ai/nexus-guest';

// Direct Kokoro TTS URL (dev-only fast path; production must stay same-origin for CSP safety)
const DIRECT_TTS_URL = import.meta.env.VITE_KOKORO_TTS_URL as string | undefined;
const USE_DIRECT_TTS = Boolean(import.meta.env.DEV && DIRECT_TTS_URL);

let _warmedUp = false;
function prewarmEndpoints() {
  if (_warmedUp) return;
  _warmedUp = true;
  fetch(NEXUS_GUEST_API, { method: 'OPTIONS' }).catch(() => {});
  const ttsUrl = USE_DIRECT_TTS
    ? `${DIRECT_TTS_URL}/v1/audio/speech`
    : '/api/ai/tts';
  fetch(ttsUrl, { method: 'OPTIONS' }).catch(() => {});
}

const GREETING =
  "Hi! I'm Nexus, SyncScript's AI assistant. What would you like to know about how SyncScript can help you?";
const GOODBYE =
  'Thanks for chatting! Feel free to sign up for a free trial anytime. Have a great day!';
const TIME_LIMIT_MSG =
  "We've reached the 5-minute demo limit. Thanks for trying Nexus! Sign up for a free trial to get unlimited access.";

const END_CALL_PHRASES = [
  'end call', 'hang up', 'goodbye', 'bye', 'end voice chat',
  'stop call', 'end chat', 'stop talking', 'disconnect',
];

// ═══════════════════════════════════════════════════════════════════════════
// Written → Spoken English Sanitizer
// ═══════════════════════════════════════════════════════════════════════════

function sanitizeForTTS(raw: string): string {
  let s = raw;
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
  s = s.replace(/\*\*(.+?)\*\*/g, '$1');
  s = s.replace(/\*(.+?)\*/g, '$1');
  s = s.replace(/__(.+?)__/g, '$1');
  s = s.replace(/(?<!\w)_([^_]+?)_(?!\w)/g, '$1');
  s = s.replace(/~~(.+?)~~/g, '$1');
  s = s.replace(/`([^`]+?)`/g, '$1');
  s = s.replace(/\[([^\]]+?)\]\([^)]+?\)/g, '$1');
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/^[*•\-]\s+/gm, '');
  s = s.replace(/^\d+[.)]\s+/gm, '');
  s = s.replace(/^>\s+/gm, '');
  s = s.replace(/(\d+)\s*[-–—]\s*(\d+)/g, '$1 to $2');
  s = s.replace(/(\d+)-(minute|hour|day|week|month|year|step|star|point|page|item|person|seat)/gi, '$1 $2');
  s = s.replace(/\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*\/(\w+)/g, '$1 dollars per $2');
  s = s.replace(/\$(\d+(?:,\d{3})*(?:\.\d+)?)/g, '$1 dollars');
  s = s.replace(/\/month/gi, ' per month');
  s = s.replace(/\/year/gi, ' per year');
  s = s.replace(/\/user/gi, ' per user');
  s = s.replace(/\/day/gi, ' per day');
  s = s.replace(/\/hour/gi, ' per hour');
  s = s.replace(/\/week/gi, ' per week');
  s = s.replace(/(\d+)\s*%/g, '$1 percent');
  s = s.replace(/\s*&\s*/g, ' and ');
  s = s.replace(/\s*\+\s*/g, ' and ');
  s = s.replace(/#(\d+)/g, 'number $1');
  s = s.replace(/\be\.g\.\s*/gi, 'for example, ');
  s = s.replace(/\bi\.e\.\s*/gi, 'that is, ');
  s = s.replace(/\betc\.\s*/gi, 'and so on. ');
  s = s.replace(/\bvs\.?\s/gi, 'versus ');
  s = s.replace(/\bw\/o\b/gi, 'without');
  s = s.replace(/(?<!\w)w\/(?!\w)/gi, 'with');
  s = s.replace(/\bhr\b(?!e)/gi, 'hour');
  s = s.replace(/\bhrs\b/gi, 'hours');
  s = s.replace(/\bmin\b(?![\w])/gi, 'minute');
  s = s.replace(/\bmins\b/gi, 'minutes');
  s = s.replace(/\binfo\b/gi, 'information');
  s = s.replace(/\basap\b/gi, 'as soon as possible');
  s = s.replace(/\b24\/7\b/g, 'twenty-four seven');
  s = s.replace(/([A-Z]{2,})\/([A-Z]{2,})/g, '$1 or $2');
  s = s.replace(/\s*[—–]\s*/g, ', ');
  s = s.replace(/\s*--\s*/g, ', ');
  s = s.replace(/\.{2,}/g, '.');
  s = s.replace(/…/g, '.');
  s = s.replace(/;/g, '.');
  s = s.replace(/\(([^)]{1,80})\)/g, ', $1,');
  s = s.replace(/,\s*,/g, ',');
  s = s.replace(/,([.!?])/g, '$1');
  s = s.replace(/([.!?])\s*\./g, '$1');
  s = s.replace(/!\./g, '!');
  s = s.replace(/\?\./g, '?');
  s = s.replace(/\.\s*\./g, '.');
  s = s.replace(/\s+([.,!?])/g, '$1');
  s = s.replace(/([.,!?])\1+/g, '$1');
  s = s.replace(/\s{2,}/g, ' ');
  s = s.trim();
  return s;
}

function cleanForDisplay(raw: string): string {
  let s = raw;
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
  s = s.replace(/\*\*(.+?)\*\*/g, '$1');
  s = s.replace(/\*(.+?)\*/g, '$1');
  s = s.replace(/__(.+?)__/g, '$1');
  s = s.replace(/(?<!\w)_([^_]+?)_(?!\w)/g, '$1');
  s = s.replace(/~~(.+?)~~/g, '$1');
  s = s.replace(/`([^`]+?)`/g, '$1');
  return s;
}

// ═══════════════════════════════════════════════════════════════════════════
// Prosody Engine — per-sentence voice selection
// ═══════════════════════════════════════════════════════════════════════════

type SentenceKind = 'exclamation' | 'question' | 'statement';

interface ProsodySegment {
  text: string;
  kind: SentenceKind;
  voice: string;
  speed: number;
}

const PROSODY_MAP: Record<SentenceKind, { voice: string; speed: number }> = {
  exclamation: { voice: 'nexus_emphatic', speed: 0.97 },
  question:    { voice: 'nexus_query',    speed: 1.0 },
  statement:   { voice: 'nexus',          speed: 1.0 },
};

function classifySentence(text: string): SentenceKind {
  const t = text.trim();
  if (t.endsWith('!')) return 'exclamation';
  if (t.endsWith('?')) return 'question';
  return 'statement';
}

function toProsodySegment(sentence: string): ProsodySegment {
  const sanitized = sanitizeForTTS(sentence);
  const kind = classifySentence(sanitized);
  const { voice, speed } = PROSODY_MAP[kind];
  return { text: sanitized, kind, voice, speed };
}

function splitToSentences(text: string): string[] {
  const parts = text.match(/[^.!?]*[.!?]+[\s]*/g);
  if (!parts) return text.trim() ? [text.trim()] : [];
  const consumed = parts.join('');
  const remainder = text.slice(consumed.length).trim();
  const out = parts.map((s) => s.trim()).filter(Boolean);
  if (remainder) out.push(remainder);
  return out;
}

function extractCompleteSentences(buffer: string): { sentences: string[]; remainder: string } {
  const parts = buffer.match(/[^.!?]*[.!?]+[\s]*/g);
  if (!parts) return { sentences: [], remainder: buffer };
  const consumed = parts.join('');
  const remainder = buffer.slice(consumed.length);
  return { sentences: parts.map((s) => s.trim()).filter(Boolean), remainder };
}

// ═══════════════════════════════════════════════════════════════════════════
// Progressive Player
//
// Plays audio segments as they arrive — the first sentence starts playing
// the instant its TTS is ready, while later sentences are still being
// generated and fetched. Uses Web Audio API precise scheduling so that when
// segment N finishes, segment N+1 starts at the exact same sample with
// zero audible gap.
//
// Usage:
//   const player = new ProgressivePlayer(signal);
//   player.feed(fetchTTSBuffer(seg1));  // starts playing immediately
//   player.feed(fetchTTSBuffer(seg2));  // queued, plays after seg1
//   player.seal();                      // no more segments coming
//   await player.waitUntilDone();       // resolves when all audio finishes
// ═══════════════════════════════════════════════════════════════════════════

class ProgressivePlayer {
  private ctx: AudioContext;
  private nextStartTime: number;
  private chain: Promise<void> = Promise.resolve();
  private sealed = false;
  private aborted = false;
  private doneResolve: (() => void) | null = null;
  private feedCount = 0;
  private playedCount = 0;
  private sources: AudioBufferSourceNode[] = [];
  private firstPlayFired = false;

  onFirstPlay: (() => void) | null = null;

  private static readonly OVERLAP_SECS = 0.10;

  constructor(signal: AbortSignal) {
    this.ctx = new AudioContext();
    this.nextStartTime = this.ctx.currentTime + 0.03;

    signal.addEventListener('abort', () => {
      this.aborted = true;
      for (const s of this.sources) { try { s.stop(); } catch { /* ok */ } }
      this.sources = [];
      this.ctx.close().catch(() => {});
      this.doneResolve?.();
    }, { once: true });
  }

  feed(bufferPromise: Promise<ArrayBuffer | null>) {
    if (this.aborted || this.sealed) return;
    this.feedCount++;

    const decoded: Promise<AudioBuffer | null> = bufferPromise
      .then((raw) => {
        if (!raw || this.aborted) return null;
        return this.ctx.decodeAudioData(raw.slice(0)).catch(() => null);
      })
      .catch(() => null);

    this.chain = this.chain.then(async () => {
      if (this.aborted) { this.segmentDone(); return; }

      let audio: AudioBuffer | null = null;
      try { audio = await decoded; } catch { /* swallow */ }
      if (!audio || this.aborted) { this.segmentDone(); return; }

      if (!this.firstPlayFired) {
        this.firstPlayFired = true;
        try { this.onFirstPlay?.(); } catch { /* ok */ }
      }

      const now = this.ctx.currentTime;
      const startAt = Math.max(this.nextStartTime, now + 0.003);

      const src = this.ctx.createBufferSource();
      src.buffer = audio;
      src.connect(this.ctx.destination);
      src.start(startAt);
      this.sources.push(src);

      const effectiveDuration = Math.max(
        audio.duration - ProgressivePlayer.OVERLAP_SECS,
        audio.duration * 0.92,
      );
      this.nextStartTime = startAt + effectiveDuration;

      src.onended = () => {
        const idx = this.sources.indexOf(src);
        if (idx >= 0) this.sources.splice(idx, 1);
        this.segmentDone();
      };
    });
  }

  seal() { this.sealed = true; this.checkDone(); }

  private segmentDone() {
    this.playedCount++;
    this.checkDone();
  }

  private checkDone() {
    if (this.sealed && this.playedCount >= this.feedCount) {
      this.ctx.close().catch(() => {});
      this.doneResolve?.();
    }
  }

  waitUntilDone(): Promise<void> {
    if (this.aborted) return Promise.resolve();
    if (this.sealed && this.playedCount >= this.feedCount) {
      this.ctx.close().catch(() => {});
      return Promise.resolve();
    }
    return new Promise((resolve) => { this.doneResolve = resolve; });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Batch Gapless Playback (for preloaded greeting/goodbye with known buffers)
// ═══════════════════════════════════════════════════════════════════════════

async function playCachedBuffers(
  buffers: ArrayBuffer[],
  signal: AbortSignal,
  onFirstPlay?: () => void,
): Promise<boolean> {
  if (!buffers.length) return true;

  const ctx = new AudioContext();
  const sources: AudioBufferSourceNode[] = [];
  let when = ctx.currentTime + 0.02;

  for (let i = 0; i < buffers.length; i++) {
    if (signal.aborted) { ctx.close().catch(() => {}); return false; }
    try {
      const audio = await ctx.decodeAudioData(buffers[i].slice(0));
      const src = ctx.createBufferSource();
      src.buffer = audio;
      src.connect(ctx.destination);
      src.start(when);
      if (i === 0 && onFirstPlay) {
        const delayMs = Math.max(0, (when - ctx.currentTime) * 1000);
        setTimeout(() => {
          try { onFirstPlay(); } catch { /* noop */ }
        }, delayMs);
      }
      sources.push(src);
      const isLast = i === buffers.length - 1;
      const overlap = isLast ? 0 : 0.10;
      when += Math.max(audio.duration - overlap, audio.duration * 0.92);
    } catch { /* skip */ }
  }

  if (!sources.length) { ctx.close().catch(() => {}); return true; }

  return new Promise<boolean>((resolve) => {
    const totalMs = (when - ctx.currentTime) * 1000 + 80;
    const finish = (ok: boolean) => { ctx.close().catch(() => {}); resolve(ok); };
    const timer = setTimeout(() => finish(true), totalMs);

    sources[sources.length - 1].onended = () => {
      clearTimeout(timer);
      finish(true);
    };

    const onAbort = () => {
      clearTimeout(timer);
      sources.forEach((s) => { try { s.stop(); } catch { /* ok */ } });
      finish(false);
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Helpers
// ═══════════════════════════════════════════════════════════════════════════

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
function isEndCallIntent(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return END_CALL_PHRASES.some((p) => lower.includes(p));
}

function playChime(type: 'connect' | 'disconnect') {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'connect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
    osc.onended = () => ctx.close();
  } catch { /* silent */ }
}

async function checkMicPermission(): Promise<{ ok: boolean; reason?: string }> {
  if (typeof window === 'undefined') return { ok: false, reason: 'Not in browser' };
  const SpeechAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechAPI) return { ok: false, reason: 'Voice calling requires Chrome, Edge, or Safari.' };
  if (!navigator.mediaDevices?.getUserMedia) return { ok: false, reason: 'Microphone not supported.' };
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    if (status.state === 'denied') return { ok: false, reason: 'Microphone blocked. Allow access in browser settings.' };
  } catch { /* ok */ }
  return { ok: true };
}

function fetchTTSBuffer(seg: ProsodySegment, signal?: AbortSignal): Promise<ArrayBuffer | null> {
  // Try direct Kokoro URL first (skips Vercel serverless hop)
  if (USE_DIRECT_TTS) {
    return fetch(`${DIRECT_TTS_URL}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'kokoro', input: seg.text, voice: seg.voice, speed: seg.speed }),
      signal,
    })
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() =>
        // Fallback to Vercel proxy if direct call fails (CORS, tunnel down, etc.)
        fetch('/api/ai/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: seg.text, voice: seg.voice, speed: seg.speed }),
          signal,
        })
          .then((r) => (r.ok ? r.arrayBuffer() : null))
          .catch(() => null),
      );
  }
  return fetch('/api/ai/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: seg.text, voice: seg.voice, speed: seg.speed }),
    signal,
  })
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .catch(() => null);
}

// ═══════════════════════════════════════════════════════════════════════════
// Audio Cache — preloads greeting & goodbye on mount so they play instantly
// ═══════════════════════════════════════════════════════════════════════════

type AudioCacheEntry = { buffers: ArrayBuffer[]; ready: boolean };

function preloadPhrase(text: string): AudioCacheEntry {
  const entry: AudioCacheEntry = { buffers: [], ready: false };
  const sentences = splitToSentences(text);
  const segments = sentences.map((s) => toProsodySegment(s));

  Promise.all(segments.map((seg) => fetchTTSBuffer(seg)))
    .then((results) => {
      entry.buffers = results.filter(Boolean) as ArrayBuffer[];
      entry.ready = true;
    })
    .catch(() => { entry.ready = true; });

  return entry;
}

// ═══════════════════════════════════════════════════════════════════════════
// Provider
// ═══════════════════════════════════════════════════════════════════════════

export function NexusVoiceCallProvider({ children }: { children: ReactNode }) {
  const [callStatus, setCallStatus] = useState<NexusCallStatus>('idle');
  const [messages, setMessages] = useState<NexusMessage[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);

  // Pre-warm serverless functions on mount so they're ready when user clicks
  useEffect(() => { prewarmEndpoints(); }, []);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);
  const activeRef = useRef(false);
  const speakingRef = useRef(false);
  const messagesRef = useRef<NexusMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const lastProcessedRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const processUserMessageRef = useRef<(text: string) => void>(() => {});

  // Preload caches
  const greetingCacheRef = useRef<AudioCacheEntry | null>(null);
  const goodbyeCacheRef = useRef<AudioCacheEntry | null>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Preload greeting + goodbye TTS on mount (invisible network request)
  useEffect(() => {
    const t = setTimeout(() => {
      greetingCacheRef.current = preloadPhrase(GREETING);
      goodbyeCacheRef.current = preloadPhrase(GOODBYE);
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  // ── Transcript handler ─────────────────────────────────────────────────
  // Uses processUserMessageRef so the closure is never stale.

  const handleTranscript = useCallback((result: STTResult) => {
    if (!result.isFinal || !activeRef.current) return;
    if (speakingRef.current || processingRef.current) return;

    const text = result.text.trim();
    if (!text) return;

    const last = lastProcessedRef.current;
    if (text === last.text && Date.now() - last.time < 8000) return;

    processUserMessageRef.current(text);
  }, []);

  const voiceStream = useVoiceStream({
    continuous: true,
    interimResults: true,
    onTranscript: handleTranscript,
  });

  // ── Message helpers ────────────────────────────────────────────────────

  const addMessage = useCallback((role: 'user' | 'nexus', text: string) => {
    const msg: NexusMessage = { id: generateId(), role, text, timestamp: Date.now() };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const updateLastNexusMessage = useCallback((text: string) => {
    setMessages((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === 'nexus') {
          copy[i] = { ...copy[i], text };
          break;
        }
      }
      return copy;
    });
  }, []);

  // ── Speak a cached or live phrase ────────────────────────────────────────

  const speakPhrase = useCallback(
    async (
      text: string,
      cache?: AudioCacheEntry | null,
      opts?: { onFirstPlay?: () => void },
    ): Promise<void> => {
      speakingRef.current = true;
      setIsSpeakingLocal(true);
      voiceStream.stopListening();

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        if (cache?.ready && cache.buffers.length > 0) {
          await playCachedBuffers(cache.buffers, ac.signal, opts?.onFirstPlay);
        } else {
          const player = new ProgressivePlayer(ac.signal);
          if (opts?.onFirstPlay) player.onFirstPlay = opts.onFirstPlay;
          for (const s of splitToSentences(text)) {
            const seg = toProsodySegment(s);
            player.feed(fetchTTSBuffer(seg, ac.signal));
          }
          player.seal();
          await player.waitUntilDone();
        }
      } finally {
        speakingRef.current = false;
        setIsSpeakingLocal(false);
        if (abortRef.current === ac) abortRef.current = null;
      }
    },
    [voiceStream],
  );

  // ── Typewriter reveal — types text word-by-word at speech speed ──────────

  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTypewriter = useCallback(
    (fullDisplay: string, wordsPerSecond = 5) => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      const words = fullDisplay.split(/(\s+)/);
      let shown = 0;
      const tick = () => {
        shown += 2;
        const partial = words.slice(0, shown).join('');
        updateLastNexusMessage(partial);
        if (shown >= words.length) {
          if (typewriterRef.current) clearInterval(typewriterRef.current);
          typewriterRef.current = null;
          updateLastNexusMessage(fullDisplay);
        }
      };
      tick();
      typewriterRef.current = setInterval(tick, 1000 / wordsPerSecond);
    },
    [updateLastNexusMessage],
  );

  const stopTypewriter = useCallback((finalText: string) => {
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
    updateLastNexusMessage(finalText);
  }, [updateLastNexusMessage]);

  // ── Streaming AI + Progressive TTS ───────────────────────────────────────
  // Two paths optimised for each scenario:
  //   1. JSON response (production): detect instantly via content-type,
  //      fire all TTS immediately, typewriter-reveal text, audio starts
  //      playing the first sentence within ~1.5s.
  //   2. SSE streaming: tokens display live as they arrive, TTS fires per
  //      sentence boundary, audio starts mid-generation.

  const fetchAndSpeakStreaming = useCallback(
    async (userText: string, sid: string): Promise<string> => {
      const history = messagesRef.current.map((m) => ({
        role: m.role === 'nexus' ? 'assistant' : 'user',
        content: m.text,
      }));
      history.push({ role: 'user', content: userText });

      speakingRef.current = true;
      setIsSpeakingLocal(true);
      voiceStream.stopListening();

      const ac = new AbortController();
      abortRef.current = ac;
      const player = new ProgressivePlayer(ac.signal);

      let fullText = '';
      let textBuffer = '';
      let nexusMsgAdded = false;
      let processingCleared = false;
      let revealOpen = false;
      let revealMode: 'typewriter' | 'stream' = 'stream';
      let pendingDisplay = '';

      const showNexusText = (text: string) => {
        const display = cleanForDisplay(text);
        if (!nexusMsgAdded) {
          addMessage('nexus', display);
          nexusMsgAdded = true;
        } else {
          updateLastNexusMessage(display);
        }
      };

      const clearProcessingOnce = () => {
        if (!processingCleared) {
          setIsProcessing(false);
          processingCleared = true;
        }
      };

      const openRevealGate = () => {
        if (revealOpen) return;
        revealOpen = true;
        setIsVoiceLoading(false);
        clearProcessingOnce();

        if (revealMode === 'typewriter') {
          const display = pendingDisplay || cleanForDisplay(fullText);
          if (!nexusMsgAdded) {
            addMessage('nexus', '');
            nexusMsgAdded = true;
          }
          startTypewriter(display, 3);
        } else if (fullText) {
          showNexusText(fullText);
        }
      };

      const feedSentence = (sentence: string) => {
        const seg = toProsodySegment(sentence);
        player.feed(fetchTTSBuffer(seg, ac.signal));
      };

      player.onFirstPlay = () => {
        openRevealGate();
      };

      try {
        const res = await fetch(NEXUS_GUEST_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, sessionId: sid, stream: true }),
          signal: ac.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          fullText = data.content || "I'm sorry, could you ask again?";
          openRevealGate();
          showNexusText(fullText);
          for (const s of splitToSentences(fullText)) feedSentence(s);
          player.seal();
          await player.waitUntilDone();
          return fullText;
        }

        if (!res.body) {
          fullText = "I'm sorry, could you ask again?";
          openRevealGate();
          showNexusText(fullText);
          feedSentence(fullText);
          player.seal();
          await player.waitUntilDone();
          return fullText;
        }

        // Read the first chunk to sniff whether it's JSON or SSE.
        // Don't trust content-type — proxies can lie.
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const firstRead = await reader.read();

        if (firstRead.done) {
          fullText = "I'm sorry, could you ask again?";
          openRevealGate();
          showNexusText(fullText);
          feedSentence(fullText);
          player.seal();
          await player.waitUntilDone();
          return fullText;
        }

        const firstChunk = decoder.decode(firstRead.value, { stream: true });
        const trimmedFirst = firstChunk.trim();
        const looksLikeJSON = trimmedFirst.startsWith('{');

        // ─── Path A: JSON response ──────────────────────────────────────
        // Detected by first byte being '{'. Shows text immediately via
        // typewriter (fast visual feedback) while TTS fires in parallel.
        // Audio starts ~1.7s later, overlapping with the still-typing text.
        if (looksLikeJSON) {
          let rawBody = firstChunk;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            rawBody += decoder.decode(value, { stream: true });
          }

          try {
            const data = JSON.parse(rawBody.trim());
            fullText = data?.content || '';
          } catch { /* not valid JSON */ }

          if (!fullText) fullText = "I'm sorry, could you ask again?";
          revealMode = 'typewriter';
          pendingDisplay = cleanForDisplay(fullText);

          // Fire TTS in parallel — audio starts while text is still typing
          const sentences = splitToSentences(fullText);
          for (const s of sentences) feedSentence(s);
          player.seal();

          await player.waitUntilDone();
          if (!revealOpen) openRevealGate();
          stopTypewriter(pendingDisplay);
          return fullText;
        }

        // ─── Path B: SSE streaming ──────────────────────────────────────
        // First chunk already in hand — process it, then continue reading.
        let sseCarry = '';
        let sseFinalContent = '';
        const processSSEChunk = (chunk: string, isDone = false) => {
          sseCarry += chunk;
          const lines = sseCarry.split('\n');
          sseCarry = isDone ? '' : (lines.pop() ?? '');

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const payload = trimmed.slice(6);
            if (payload === '[DONE]') continue;

            try {
              const parsed = JSON.parse(payload);

              if (parsed.finalContent && typeof parsed.finalContent === 'string') {
                sseFinalContent = parsed.finalContent;
                continue;
              }

              if (parsed.content && !parsed.token) {
                fullText = parsed.content;
                textBuffer = '';
                if (revealOpen) showNexusText(fullText);
                for (const s of splitToSentences(fullText)) feedSentence(s);
                return true;
              }

              const token = parsed.token;
              if (!token) continue;

              fullText += token;
              textBuffer += token;
              if (revealOpen) showNexusText(fullText);

              const { sentences, remainder } = extractCompleteSentences(textBuffer);
              for (const sent of sentences) feedSentence(sent);
              textBuffer = remainder;
            } catch { /* skip malformed */ }
          }
          return false;
        };

        let gotFullContent = processSSEChunk(firstChunk);

        if (!gotFullContent) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!activeRef.current || ac.signal.aborted) { reader.cancel(); break; }
            const chunk = decoder.decode(value, { stream: true });
            if (processSSEChunk(chunk)) break;
          }
        }

        // Flush decoder + trailing partial line once the stream closes.
        const decoderTail = decoder.decode();
        processSSEChunk(decoderTail, true);

        // Reconcile with server-sent final content to recover from any token loss.
        if (sseFinalContent.trim() && sseFinalContent.trim() !== fullText.trim()) {
          fullText = sseFinalContent.trim();
          textBuffer = '';
        }

        // Safety: only speak the trailing buffer if it looks like a complete thought.
        // If the AI was cut off mid-sentence (no terminal punctuation), trim back
        // to the last complete sentence so TTS never speaks a fragment.
        const trailing = textBuffer.trim();
        if (trailing) {
          const endsComplete = /[.!?]$/.test(trailing);
          if (endsComplete) {
            feedSentence(trailing);
          } else {
            const lastPunct = trailing.search(/[.!?][^.!?]*$/);
            if (lastPunct >= 0) {
              feedSentence(trailing.slice(0, lastPunct + 1).trim());
              fullText = fullText.slice(0, fullText.length - trailing.length + lastPunct + 1).trim();
            }
          }
        }
        // Do not reveal text here preemptively; wait for first playable audio.
        // If no playable audio ever arrives, we reveal after waitUntilDone below.
        if (revealOpen && fullText) showNexusText(fullText);

        clearProcessingOnce();
        player.seal();
        await player.waitUntilDone();
        if (!revealOpen && fullText) openRevealGate();
      } catch (err: any) {
        if (err?.name === 'AbortError') { /* normal cancellation */ }
        else if (!fullText) {
          fullText = "I'm having a little trouble right now. You can reach us at support@syncscript.app!";
          openRevealGate();
          showNexusText(fullText);
          feedSentence(fullText);
          player.seal();
          await player.waitUntilDone();
        }
      } finally {
        speakingRef.current = false;
        setIsSpeakingLocal(false);
        setIsVoiceLoading(false);
        stopTypewriter(cleanForDisplay(fullText));
        if (abortRef.current === ac) abortRef.current = null;
      }

      return fullText;
    },
    [voiceStream, addMessage, updateLastNexusMessage, startTypewriter, stopTypewriter],
  );

  // ── End call ───────────────────────────────────────────────────────────
  // Declared before processUserMessage so the const is initialized when
  // processUserMessage's dependency array is evaluated during render.

  const endCallInternal = useCallback(async () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setCallStatus('ending');
    setIsProcessing(false);
    setIsVoiceLoading(false);
    processingRef.current = false;

    voiceStream.stopListening();
    voiceStream.stopSpeaking();
    abortRef.current?.abort();

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    addMessage('nexus', GOODBYE);
    await speakPhrase(GOODBYE, goodbyeCacheRef.current);

    playChime('disconnect');
    await new Promise((r) => setTimeout(r, GOODBYE_LINGER_MS));

    setCallStatus('idle');
    setMessages([]);
    setCallDuration(0);
    setSessionId(null);
    setIsVoiceLoading(false);

    // Re-preload for next call
    greetingCacheRef.current = preloadPhrase(GREETING);
    goodbyeCacheRef.current = preloadPhrase(GOODBYE);
  }, [voiceStream, addMessage, speakPhrase]);

  // ── Process user message ───────────────────────────────────────────────

  const processUserMessage = useCallback(
    async (text: string) => {
      if (processingRef.current || !activeRef.current) return;

      // Dedup: reject if same text was just processed
      const last = lastProcessedRef.current;
      if (text === last.text && Date.now() - last.time < 8000) return;

      lastProcessedRef.current = { text, time: Date.now() };

      if (isEndCallIntent(text)) { endCallInternal(); return; }

      processingRef.current = true;
      setIsProcessing(true);
      setIsVoiceLoading(true);

      voiceStream.stopSpeaking();
      voiceStream.stopListening();
      abortRef.current?.abort();
      voiceStream.clearTranscript();

      addMessage('user', text);

      try {
        const sid = sessionId || generateSessionId();
        if (!sessionId) setSessionId(sid);
        await fetchAndSpeakStreaming(text, sid);
      } catch (err) {
        console.error('[Nexus] processUserMessage error:', err);
      } finally {
        setIsProcessing(false);
        setIsVoiceLoading(false);
        processingRef.current = false;

        if (activeRef.current) {
          voiceStream.clearTranscript();
          voiceStream.startListening();
        }
      }
    },
    [voiceStream, sessionId, addMessage, fetchAndSpeakStreaming, endCallInternal],
  );

  // Keep the ref in sync so handleTranscript always calls the latest version
  useEffect(() => {
    processUserMessageRef.current = processUserMessage;
  }, [processUserMessage]);

  // ── Start call ─────────────────────────────────────────────────────────

  const startCall = useCallback(async () => {
    if (activeRef.current) return;
    const mic = await checkMicPermission();
    if (!mic.ok) { alert(mic.reason); return; }

    // Re-warm functions in case they went cold since page load
    _warmedUp = false;
    prewarmEndpoints();

    setCallStatus('connecting');
    const sid = generateSessionId();
    setSessionId(sid);
    setMessages([]);
    setCallDuration(0);
    setIsProcessing(false);
    setIsVoiceLoading(true);
    processingRef.current = false;

    playChime('connect');
    await new Promise((r) => setTimeout(r, 400));

    addMessage('nexus', GREETING);
    activeRef.current = true;
    setCallStatus('active');

    timerRef.current = setInterval(() => {
      setCallDuration((prev) => {
        const next = prev + 1;
        if (next >= MAX_CALL_DURATION) {
          setTimeout(() => {
            if (activeRef.current) {
              addMessage('nexus', TIME_LIMIT_MSG);
              speakPhrase(TIME_LIMIT_MSG, null).then(() => endCallInternal());
            }
          }, 0);
          if (timerRef.current) clearInterval(timerRef.current);
        }
        return next;
      });
    }, 1000);

    // Play greeting from preloaded cache — near-instant
    await speakPhrase(GREETING, greetingCacheRef.current, {
      onFirstPlay: () => setIsVoiceLoading(false),
    });
    setIsVoiceLoading(false);

    if (activeRef.current) {
      voiceStream.clearTranscript();
      voiceStream.startListening();
    }
  }, [voiceStream, addMessage, endCallInternal, speakPhrase]);

  // ── sendTextMessage ────────────────────────────────────────────────────

  const sendTextMessage = useCallback(
    (text: string) => {
      if (!activeRef.current || processingRef.current) return;
      processUserMessage(text);
    },
    [processUserMessage],
  );

  const endCall = useCallback(() => endCallInternal(), [endCallInternal]);

  // ── Cleanup ────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      activeRef.current = false;
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      voiceStream.stopListening();
      voiceStream.stopSpeaking();
    };
  }, []);

  // ── Context value ──────────────────────────────────────────────────────

  const value: NexusVoiceCallContextValue = {
    isCallActive: callStatus === 'active' || callStatus === 'connecting' || callStatus === 'ending',
    callStatus,
    messages,
    callDuration,
    sessionId,
    interimText: voiceStream.interimText,
    isSpeaking: voiceStream.isSpeaking || isSpeakingLocal,
    isListening: voiceStream.isListening,
    isProcessing,
    isVoiceLoading,
    startCall,
    endCall,
    sendTextMessage,
  };

  return (
    <NexusVoiceCallContext.Provider value={value}>
      {children}
    </NexusVoiceCallContext.Provider>
  );
}
