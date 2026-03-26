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
import { disableTtsProxyForSession, isTtsProxyDisabled } from '../utils/tts-proxy-session';

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
  heardText: string;
  isSpeaking: boolean;
  isListening: boolean;
  sttMode: 'browser' | 'fallback';
  micLevel: number;
  isProcessing: boolean;
  isVoiceLoading: boolean;
  voiceError: string | null;
}

interface NexusVoiceCallContextValue extends NexusVoiceCallState {
  startCall: () => Promise<void>;
  endCall: () => void;
  sendTextMessage: (text: string) => void;
}

export const NexusVoiceCallContext = createContext<NexusVoiceCallContextValue | null>(null);

export function useNexusVoiceCall(): NexusVoiceCallContextValue {
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

/**
 * Kokoro voice id sent to /api/ai/tts — same preset as the desktop companion
 * (`cortana` in nature-cortana-platform/desktop-shell). Custom-tuned on your
 * Kokoro server for natural delivery; prefer over generic `nexus` preset.
 */
const KOKORO_VOICE_PRESET = 'cortana';

const GREETING =
  "Hi, I'm Nexus, your SyncScript guide. Ready when you are. What would you like to explore first?";
const GOODBYE =
  "Thanks for chatting. I'd love to help again anytime. Have a wonderful day!";
const TIME_LIMIT_MSG =
  "We've reached the 5-minute demo limit. Thanks for trying Nexus! Sign up for a free trial to get unlimited access.";
const STATIC_GREETING_AUDIO_URL = '/audio/nexus-greeting.mp3';
/** Bundled MP3 matches GREETING + GREETING_PROFILE — instant first line after mic (no TTS round-trip). */
const ENABLE_STATIC_GREETING = true;
/** Pre-fetch Kokoro buffers for greeting/goodbye on provider mount (smooth first line when API is healthy). */
const PRELOAD_VOICE_CACHE_ON_MOUNT = true;

const END_CALL_PHRASES = [
  'end call', 'hang up', 'goodbye', 'bye', 'end voice chat',
  'stop call', 'end chat', 'stop talking', 'disconnect',
];

const GREETING_PROFILE = { voice: KOKORO_VOICE_PRESET, speed: 0.98 } as const;
const GOODBYE_PROFILE = { voice: KOKORO_VOICE_PRESET, speed: 0.97 } as const;
const FUTURE_WARM_PROFILE = { voice: KOKORO_VOICE_PRESET, speed: 0.97 } as const;
const FUTURE_BALANCED_PROFILE = { voice: KOKORO_VOICE_PRESET, speed: 0.99 } as const;
const FUTURE_GUIDE_PROFILE = { voice: KOKORO_VOICE_PRESET, speed: 1.0 } as const;
const FUTURE_WARM_TURNS = 2;
const TTS_REQUEST_TIMEOUT_MS = 18_000;
const TTS_MAX_RETRIES = 2;
const TTS_RETRY_BACKOFF_MS = 450;
const TTS_CIRCUIT_BREAKER_THRESHOLD = 3;
const TTS_CIRCUIT_BREAKER_MS = 30_000;

let ttsConsecutiveFailures = 0;
let ttsCircuitOpenUntil = 0;

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
  // Pronunciation lexicon for brand and product names.
  s = s.replace(/\bSyncScript's\b/gi, 'SyncScript');
  s = s.replace(/\bSyncScripts\b/gi, 'SyncScript');
  s = s.replace(/\bSync Script\b/gi, 'SyncScript');
  s = s.replace(/\bSyncScript\b/gi, 'SyncScript');
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

const ENERGETIC_CUE_RE =
  /\b(ready|great|perfect|welcome|absolutely|let's|lets|start|launch|plan|optimize|focus)\b/i;

const PROSODY_MAP: Record<SentenceKind, { voice: string; speed: number }> = {
  // Keep one consistent voice and gentler pacing for smoother, less abrupt delivery.
  exclamation: { voice: KOKORO_VOICE_PRESET, speed: 0.99 },
  question:    { voice: KOKORO_VOICE_PRESET, speed: 1.0 },
  statement:   { voice: KOKORO_VOICE_PRESET, speed: 0.98 },
};

function classifySentence(text: string): SentenceKind {
  const t = text.trim();
  if (t.endsWith('!')) return 'exclamation';
  if (t.endsWith('?')) return 'question';
  return 'statement';
}

function toProsodySegment(sentence: string): ProsodySegment {
  const base = sanitizeForTTS(sentence);
  const sanitized = /[.!?]$/.test(base) ? base : `${base}.`;
  const kind = classifySentence(sanitized);
  const { voice, speed } = PROSODY_MAP[kind];
  return { text: sanitized, kind, voice, speed };
}

function toProsodySegmentWithProfile(
  sentence: string,
  profile: { voice: string; speed: number },
): ProsodySegment {
  const seg = toProsodySegment(sentence);
  const energetic = ENERGETIC_CUE_RE.test(seg.text);
  // Keep futuristic confidence without sharp or aggressive emphasis.
  const normalizedText = energetic ? seg.text.replace(/!+/g, '.').replace(/\?{2,}/g, '?') : seg.text;
  const expressiveVoice = profile.voice;
  const expressiveSpeed = energetic ? Math.min(1.02, profile.speed + 0.005) : profile.speed;
  return {
    ...seg,
    text: normalizedText,
    voice: expressiveVoice,
    speed: Number((seg.speed * expressiveSpeed).toFixed(2)),
  };
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

function buildSpeechChunks(text: string): string[] {
  const sentences = splitToSentences(text);
  if (sentences.length <= 1) return sentences;

  const chunks: string[] = [];
  let buffer = '';

  const flush = () => {
    if (!buffer.trim()) return;
    chunks.push(buffer.trim());
    buffer = '';
  };

  for (let i = 0; i < sentences.length; i++) {
    const current = sentences[i].trim();
    const candidate = buffer
      ? `${buffer.replace(/[.!?]+$/, ',')} ${current}`
      : current;

    const wordCount = candidate.split(/\s+/).filter(Boolean).length;
    const tooLong = wordCount > 22 || candidate.length > 140;

    if (tooLong) {
      flush();
      buffer = current;
      continue;
    }

    buffer = candidate;
  }

  flush();
  return chunks.length ? chunks : sentences;
}

const GOLDEN_PHRASE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /i['’]?d be happy to help you get a feel for how i can assist you with syncscript/gi,
    replacement: "Great question. I can walk you through SyncScript, step by step.",
  },
  {
    pattern: /so what['’]?s on your mind,? do you have any questions about getting started\??/gi,
    replacement: 'What would you like to start with first?',
  },
  {
    pattern: /\bnot much, just here to help you learn more about syncscript[^.?!]*/gi,
    replacement: "I'm here to help you explore SyncScript and get value fast.",
  },
  {
    pattern: /\b(i['’]?m so glad you['’]?re checking in)\b/gi,
    replacement: "I'm really glad you're here",
  },
];

function applyGoldenPhrasePack(raw: string): string {
  let s = raw;
  for (const rule of GOLDEN_PHRASE_PATTERNS) {
    s = s.replace(rule.pattern, rule.replacement);
  }
  // Clean repeated filler joins that can make spoken delivery choppy.
  s = s.replace(/,\s*and\s+and\s+/gi, ', and ');
  s = s.replace(/\bso,\s+so\b/gi, 'so');
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
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

  /** True if any audio buffer actually started playing (for browser-TTS fallback). */
  didAudioPlay(): boolean {
    return this.firstPlayFired;
  }

  private static readonly OVERLAP_SECS = 0;

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

      await this.ctx.resume().catch(() => {});

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

      const effectiveDuration = Math.max(audio.duration - ProgressivePlayer.OVERLAP_SECS, audio.duration);
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

  let firstPlayFired = false;
  await ctx.resume().catch(() => {});
  for (let i = 0; i < buffers.length; i++) {
    if (signal.aborted) { ctx.close().catch(() => {}); return false; }
    try {
      const audio = await ctx.decodeAudioData(buffers[i].slice(0));
      const src = ctx.createBufferSource();
      src.buffer = audio;
      src.connect(ctx.destination);
      if (!firstPlayFired) {
        firstPlayFired = true;
        try { onFirstPlay?.(); } catch { /* silent */ }
      }
      await ctx.resume().catch(() => {});
      src.start(when);
      sources.push(src);
      const isLast = i === buffers.length - 1;
      const overlap = isLast ? 0 : 0;
      when += Math.max(audio.duration - overlap, audio.duration);
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

async function playStaticAudioAsset(
  url: string,
  signal: AbortSignal,
  onFirstPlay?: () => void,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const audio = new Audio(url);
    audio.preload = 'auto';

    const finish = (ok: boolean) => {
      audio.onplay = null;
      audio.onended = null;
      audio.onerror = null;
      signal.removeEventListener('abort', onAbort);
      try {
        audio.pause();
      } catch {
        // ignore
      }
      resolve(ok);
    };

    const onAbort = () => finish(false);
    signal.addEventListener('abort', onAbort, { once: true });

    audio.onplay = () => {
      try { onFirstPlay?.(); } catch { /* ignore */ }
    };
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);

    audio.play().catch(() => finish(false));
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

function isLikelyNonEnglishMishear(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const latin = (trimmed.match(/[A-Za-z]/g) || []).length;
  const cjk = (trimmed.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g) || []).length;
  const hangul = (trimmed.match(/[\uac00-\ud7af]/g) || []).length;
  const nonLatinCjk = cjk + hangul;

  return nonLatinCjk >= 2 && latin === 0;
}

function isLikelyLowQualityTranscript(text: string): boolean {
  const cleaned = text.trim();
  if (!cleaned) return true;

  // Reject very short single-token captures (common false triggers).
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 1 && cleaned.length <= 4) return true;

  // Reject transcript that contains no letters at all.
  const letterCount = (cleaned.match(/[A-Za-z]/g) || []).length;
  return letterCount === 0 && cleaned.length <= 8;
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
  try {
    // Force permission prompt/verification in the same user-gesture flow.
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => {
      try { track.stop(); } catch { /* ignore */ }
    });
  } catch {
    return { ok: false, reason: 'Microphone permission is required. Please allow mic access and try again.' };
  }
  return { ok: true };
}

function isTransientTTSStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function registerTTSFailure(): void {
  ttsConsecutiveFailures += 1;
  if (ttsConsecutiveFailures >= TTS_CIRCUIT_BREAKER_THRESHOLD) {
    ttsCircuitOpenUntil = Date.now() + TTS_CIRCUIT_BREAKER_MS;
  }
}

function registerTTSSuccess(): void {
  ttsConsecutiveFailures = 0;
  ttsCircuitOpenUntil = 0;
}

/** Kokoro may not know `cortana` on every deploy; try stock voices before failing. */
function ttsVoiceCandidates(primary: string): string[] {
  const rest = ['natural', 'nexus', 'professional'].filter((v) => v !== primary);
  return [primary, ...rest];
}

function isVoiceOrClientError(status: number): boolean {
  return status === 400 || status === 404 || status === 422;
}

const MAX_TTS_BROWSER_CHARS = 2800;

/** Last resort when Kokoro is down or all voices fail — user still hears something. */
function speakBrowserUtterance(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }
    const clean = sanitizeForTTS(text).slice(0, MAX_TTS_BROWSER_CHARS);
    if (!clean.trim()) {
      resolve();
      return;
    }
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 0.95;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      resolve();
    }
  });
}

function fetchTTSBuffer(seg: ProsodySegment, signal?: AbortSignal): Promise<ArrayBuffer | null> {
  if (isTtsProxyDisabled() || Date.now() < ttsCircuitOpenUntil) {
    return Promise.resolve(null);
  }
  return (async () => {
    const voices = ttsVoiceCandidates(seg.voice);
    for (const voice of voices) {
      for (let attempt = 0; attempt <= TTS_MAX_RETRIES; attempt += 1) {
        if (signal?.aborted) return null;
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), TTS_REQUEST_TIMEOUT_MS);
        const onAbort = () => timeoutController.abort();
        if (signal) {
          signal.addEventListener('abort', onAbort, { once: true });
        }
        try {
          const response = await fetch('/api/ai/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: seg.text, voice, speed: seg.speed }),
            signal: timeoutController.signal,
          });
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            if (buffer.byteLength > 0) {
              registerTTSSuccess();
              return buffer;
            }
            break;
          } else {
            const errData = (await response.json().catch(() => ({}))) as { code?: string };
            if (errData.code === 'NO_TTS_URL') {
              disableTtsProxyForSession();
              registerTTSFailure();
              return null;
            }
            if (isVoiceOrClientError(response.status)) {
              break;
            }
            if (!isTransientTTSStatus(response.status) || attempt >= TTS_MAX_RETRIES) {
              break;
            }
          }
        } catch {
          if (signal?.aborted) return null;
          if (attempt >= TTS_MAX_RETRIES) break;
        } finally {
          clearTimeout(timeoutId);
          if (signal) {
            signal.removeEventListener('abort', onAbort);
          }
        }
        await delay(TTS_RETRY_BACKOFF_MS * (attempt + 1));
      }
    }
    registerTTSFailure();
    return null;
  })();
}

// ═══════════════════════════════════════════════════════════════════════════
// Audio Cache — preloads greeting & goodbye on mount so they play instantly
// ═══════════════════════════════════════════════════════════════════════════

type AudioCacheEntry = { buffers: ArrayBuffer[]; ready: boolean; readyPromise: Promise<void> };

function preloadPhrase(
  text: string,
  options?: { voice?: string; speed?: number },
): AudioCacheEntry {
  const entry: AudioCacheEntry = {
    buffers: [],
    ready: false,
    readyPromise: Promise.resolve(),
  };
  const sentences = buildSpeechChunks(text);
  const segments = sentences.map((s) => {
    if (options?.voice || options?.speed) {
      return {
        text: sanitizeForTTS(s),
        kind: classifySentence(sanitizeForTTS(s)),
        voice: options?.voice || KOKORO_VOICE_PRESET,
        speed: options?.speed ?? 1.0,
      } as ProsodySegment;
    }
    return toProsodySegment(s);
  });

  entry.readyPromise = Promise.all(segments.map((seg) => fetchTTSBuffer(seg)))
    .then((results) => {
      entry.buffers = results.filter(Boolean) as ArrayBuffer[];
      entry.ready = true;
    })
    .catch(() => { entry.ready = true; });

  return entry;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
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
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [heardText, setHeardText] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);
  const activeRef = useRef(false);
  const speakingRef = useRef(false);
  const messagesRef = useRef<NexusMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const lastProcessedRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const processUserMessageRef = useRef<(text: string) => void>(() => {});
  const heardTextClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endCallInProgressRef = useRef(false);
  const assistantTurnsRef = useRef(0);

  // Preload caches
  const greetingCacheRef = useRef<AudioCacheEntry | null>(null);
  const goodbyeCacheRef = useRef<AudioCacheEntry | null>(null);
  const warmVoiceCaches = useCallback(() => {
    if (ENABLE_STATIC_GREETING) {
      const warm = new Audio(STATIC_GREETING_AUDIO_URL);
      warm.preload = 'auto';
      warm.load();
      void fetch(STATIC_GREETING_AUDIO_URL, { cache: 'force-cache' }).catch(() => {});
    }
    greetingCacheRef.current = preloadPhrase(GREETING, GREETING_PROFILE);
    goodbyeCacheRef.current = preloadPhrase(GOODBYE, GOODBYE_PROFILE);
  }, []);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Preload greeting + goodbye once at provider mount, regardless of route.
  // This keeps greeting fast even after navigation or restarting a call.
  useEffect(() => {
    if (!PRELOAD_VOICE_CACHE_ON_MOUNT) return;
    warmVoiceCaches();
  }, [warmVoiceCaches]);

  // ── Transcript handler ─────────────────────────────────────────────────
  // Uses processUserMessageRef so the closure is never stale.

  const handleTranscript = useCallback((result: STTResult) => {
    if (!result.isFinal || !activeRef.current) return;
    if (speakingRef.current || processingRef.current) return;

    const text = result.text.trim();
    if (!text) return;
    if (isLikelyNonEnglishMishear(text)) {
      setVoiceError('I may have misheard you. Please repeat in English, slightly closer to your microphone.');
      return;
    }
    if (isLikelyLowQualityTranscript(text)) {
      setVoiceError('I caught only a partial phrase. Please try that again clearly.');
      return;
    }
    setVoiceError(null);
    setHeardText(text);
    if (heardTextClearTimerRef.current) {
      clearTimeout(heardTextClearTimerRef.current);
    }
    heardTextClearTimerRef.current = setTimeout(() => {
      setHeardText('');
      heardTextClearTimerRef.current = null;
    }, 5000);

    const last = lastProcessedRef.current;
    if (text === last.text && Date.now() - last.time < 8000) return;

    processUserMessageRef.current(text);
  }, []);

  const voiceStream = useVoiceStream({
    continuous: true,
    interimResults: true,
    onTranscript: handleTranscript,
    onStatusChange: (status) => {
      if (status === 'listening') {
        setIsVoiceLoading(false);
        setVoiceError(null);
      }
    },
    onError: (error) => {
      if (!activeRef.current) return;
      const normalized = error?.includes('no speech')
        ? 'Mic is active but no speech is being detected. Check your selected microphone and browser mic permissions.'
        : error;
      setVoiceError(normalized || 'Microphone issue detected. Please check your audio input and try again.');
    },
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
      opts?: { onFirstAudioStart?: () => void },
    ): Promise<void> => {
      speakingRef.current = true;
      setIsSpeakingLocal(true);
      voiceStream.stopListening();

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        if (cache?.ready && cache.buffers.length > 0) {
          await playCachedBuffers(cache.buffers, ac.signal, opts?.onFirstAudioStart);
        } else {
          const player = new ProgressivePlayer(ac.signal);
          player.onFirstPlay = () => {
            try { opts?.onFirstAudioStart?.(); } catch { /* silent */ }
          };
          for (const s of buildSpeechChunks(text)) {
            const seg = toProsodySegmentWithProfile(s, FUTURE_WARM_PROFILE);
            player.feed(fetchTTSBuffer(seg, ac.signal));
          }
          player.seal();
          await player.waitUntilDone();
          if (!player.didAudioPlay() && text.trim()) {
            await speakBrowserUtterance(text);
          }
        }
      } finally {
        speakingRef.current = false;
        setIsSpeakingLocal(false);
        if (abortRef.current === ac) abortRef.current = null;
      }
    },
    [voiceStream],
  );

  const speakStaticGreeting = useCallback(
    async (opts?: { onFirstAudioStart?: () => void }): Promise<boolean> => {
      speakingRef.current = true;
      setIsSpeakingLocal(true);
      voiceStream.stopListening();

      const ac = new AbortController();
      abortRef.current = ac;
      try {
        return await playStaticAudioAsset(STATIC_GREETING_AUDIO_URL, ac.signal, opts?.onFirstAudioStart);
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
      let canRevealText = false;
      let processingCleared = false;
      let ttsFetchChain: Promise<unknown> = Promise.resolve();

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

      const ensureNexusBubble = () => {
        if (!nexusMsgAdded) {
          addMessage('nexus', '');
          nexusMsgAdded = true;
        }
      };

      const feedSentence = (sentence: string) => {
        const styleProfile =
          assistantTurnsRef.current < FUTURE_WARM_TURNS ? FUTURE_GUIDE_PROFILE : FUTURE_BALANCED_PROFILE;
        const seg = toProsodySegmentWithProfile(sentence, styleProfile);
        // Queue TTS fetches to avoid burst-parallel requests that can trigger 504s upstream.
        const queued = ttsFetchChain.then(() => fetchTTSBuffer(seg, ac.signal));
        ttsFetchChain = queued.then(() => undefined, () => undefined);
        player.feed(queued);
      };

      const ensureSpokenOrBrowser = async () => {
        if (fullText.trim() && !player.didAudioPlay()) {
          await speakBrowserUtterance(fullText);
        }
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
          fullText = applyGoldenPhrasePack(data.content || "I'm sorry, could you ask again?");
          ensureNexusBubble();
          showNexusText(fullText);
          clearProcessingOnce();
          for (const s of splitToSentences(fullText)) feedSentence(s);
          player.seal();
          await player.waitUntilDone();
          await ensureSpokenOrBrowser();
          return fullText;
        }

        if (!res.body) {
          fullText = applyGoldenPhrasePack("I'm sorry, could you ask again?");
          ensureNexusBubble();
          showNexusText(fullText);
          clearProcessingOnce();
          feedSentence(fullText);
          player.seal();
          await player.waitUntilDone();
          await ensureSpokenOrBrowser();
          return fullText;
        }

        // Read the first chunk to sniff whether it's JSON or SSE.
        // Don't trust content-type — proxies can lie.
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const firstRead = await reader.read();

        if (firstRead.done) {
          fullText = applyGoldenPhrasePack("I'm sorry, could you ask again?");
          ensureNexusBubble();
          showNexusText(fullText);
          clearProcessingOnce();
          feedSentence(fullText);
          player.seal();
          await player.waitUntilDone();
          await ensureSpokenOrBrowser();
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
          fullText = applyGoldenPhrasePack(fullText);

          const display = cleanForDisplay(fullText);
          ensureNexusBubble();

          // Keep the bubble visible, but only reveal text once audio starts.
          player.onFirstPlay = () => {
            canRevealText = true;
            clearProcessingOnce();
            startTypewriter(display, 3);
          };

          // Fire TTS in parallel — audio starts while text is still typing
          const sentences = buildSpeechChunks(fullText);
          for (const s of sentences) feedSentence(s);
          player.seal();

          await player.waitUntilDone();
          await ensureSpokenOrBrowser();
          if (!canRevealText) {
            showNexusText(display);
            clearProcessingOnce();
          }
          stopTypewriter(display);
          return fullText;
        }

        // ─── Path B: SSE streaming ──────────────────────────────────────
        // First chunk already in hand — process it, then continue reading.
        ensureNexusBubble();
        player.onFirstPlay = () => {
          canRevealText = true;
          clearProcessingOnce();
          if (fullText.trim()) showNexusText(fullText);
        };

        const processSSEChunk = (chunk: string) => {
          const lines = chunk.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const payload = trimmed.slice(6);
            if (payload === '[DONE]') continue;

            try {
              const parsed = JSON.parse(payload);

              const bulk =
                parsed.content ?? parsed.finalContent;
              if (bulk && !parsed.token) {
                fullText = typeof bulk === 'string' ? bulk : String(bulk);
                textBuffer = '';
                if (canRevealText) showNexusText(fullText);
                for (const s of splitToSentences(fullText)) feedSentence(s);
                return true;
              }

              const token = parsed.token;
              if (!token) continue;

              fullText += token;
              textBuffer += token;
              if (canRevealText) showNexusText(fullText);

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

        if (textBuffer.trim()) feedSentence(textBuffer.trim());
        fullText = applyGoldenPhrasePack(fullText);
        if (fullText && canRevealText) showNexusText(fullText);
        player.seal();
        await player.waitUntilDone();
        await ensureSpokenOrBrowser();
        if (fullText && !canRevealText) showNexusText(fullText);
        clearProcessingOnce();
      } catch (err: any) {
        if (err?.name === 'AbortError') { /* normal cancellation */ }
        else if (!fullText) {
          fullText = applyGoldenPhrasePack("I'm having a little trouble right now. You can reach us at support@syncscript.app!");
          showNexusText(fullText);
          clearProcessingOnce();
          feedSentence(fullText);
          player.seal();
          await player.waitUntilDone();
          await ensureSpokenOrBrowser();
        }
      } finally {
        speakingRef.current = false;
        setIsSpeakingLocal(false);
        stopTypewriter(cleanForDisplay(fullText));
        if (abortRef.current === ac) abortRef.current = null;
      }

      return fullText;
    },
    [voiceStream, addMessage, updateLastNexusMessage, startTypewriter, stopTypewriter],
  );

  // ── End call ───────────────────────────────────────────────────────────

  const endCallInternal = useCallback(async (options?: { playGoodbye?: boolean }) => {
    if ((!activeRef.current && callStatus === 'idle') || endCallInProgressRef.current) return;
    endCallInProgressRef.current = true;

    const playGoodbye = options?.playGoodbye ?? false;
    try {
      activeRef.current = false;
      processingRef.current = false;
      setIsProcessing(false);
      setIsVoiceLoading(false);
      setVoiceError(null);
      setHeardText('');
      if (heardTextClearTimerRef.current) {
        clearTimeout(heardTextClearTimerRef.current);
        heardTextClearTimerRef.current = null;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop capture/audio immediately so end-call click can return quickly.
      voiceStream.stopListening();
      voiceStream.stopSpeaking();
      abortRef.current?.abort();

      // Fast UI exit: collapse the call shell right away.
      setCallStatus('idle');
      setMessages([]);
      setCallDuration(0);
      setSessionId(null);

      if (playGoodbye) {
        try {
          await speakPhrase(GOODBYE, goodbyeCacheRef.current);
          playChime('disconnect');
          await new Promise((r) => setTimeout(r, GOODBYE_LINGER_MS));
        } catch {
          // Ignore farewell failures during teardown.
        }
      } else {
        playChime('disconnect');
      }

      // Re-preload for next call to keep restart starts fast.
      warmVoiceCaches();
    } finally {
      endCallInProgressRef.current = false;
    }
  }, [voiceStream, speakPhrase, callStatus, warmVoiceCaches]);

  // ── Process user message ───────────────────────────────────────────────

  const processUserMessage = useCallback(
    async (text: string) => {
      if (processingRef.current || !activeRef.current) return;

      // Dedup: reject if same text was just processed
      const last = lastProcessedRef.current;
      if (text === last.text && Date.now() - last.time < 8000) return;

      lastProcessedRef.current = { text, time: Date.now() };

      if (isEndCallIntent(text)) { endCallInternal({ playGoodbye: false }); return; }

      processingRef.current = true;
      setIsProcessing(true);

      voiceStream.stopSpeaking();
      voiceStream.stopListening();
      abortRef.current?.abort();
      voiceStream.clearTranscript();

      addMessage('user', text);
      setHeardText('');
      if (heardTextClearTimerRef.current) {
        clearTimeout(heardTextClearTimerRef.current);
        heardTextClearTimerRef.current = null;
      }

      try {
        const sid = sessionId || generateSessionId();
        if (!sessionId) setSessionId(sid);
        await fetchAndSpeakStreaming(text, sid);
        assistantTurnsRef.current += 1;
      } catch (err) {
        console.error('[Nexus] processUserMessage error:', err);
      } finally {
        setIsProcessing(false);
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
    endCallInProgressRef.current = false;
    // Warm caches lazily to avoid background TTS request storms when voice isn't used.
    if (!greetingCacheRef.current || !goodbyeCacheRef.current) {
      warmVoiceCaches();
    }
    setCallStatus('connecting');
    setIsVoiceLoading(true);
    setVoiceError(null);

    const mic = await checkMicPermission();
    if (!mic.ok) {
      setCallStatus('idle');
      setIsVoiceLoading(false);
      alert(mic.reason);
      return;
    }
    const sid = generateSessionId();
    setSessionId(sid);
    setMessages([]);
    setCallDuration(0);
    setIsProcessing(false);
    setHeardText('');
    assistantTurnsRef.current = 0;
    processingRef.current = false;

    playChime('connect');

    const greetingCache = greetingCacheRef.current;
    if (!ENABLE_STATIC_GREETING && greetingCache && !greetingCache.ready) {
      // Wait for Kokoro preload (mount + click) so the first line plays from cache, not a cold TTS fetch.
      await Promise.race([greetingCache.readyPromise, wait(12_000)]);
    }

    const greetingDisplay = cleanForDisplay(GREETING);
    addMessage('nexus', greetingDisplay);
    activeRef.current = true;
    setCallStatus('active');

    timerRef.current = setInterval(() => {
      setCallDuration((prev) => {
        const next = prev + 1;
        if (next >= MAX_CALL_DURATION) {
          setTimeout(() => {
            if (activeRef.current) {
              addMessage('nexus', TIME_LIMIT_MSG);
              speakPhrase(TIME_LIMIT_MSG, null).then(() => endCallInternal({ playGoodbye: false }));
            }
          }, 0);
          if (timerRef.current) clearInterval(timerRef.current);
        }
        return next;
      });
    }, 1000);

    // Prefer a deterministic handoff:
    // play greeting fully, then begin one stable listening session.
    const staticPlayed = ENABLE_STATIC_GREETING
      ? await speakStaticGreeting({
          onFirstAudioStart: () => {
            setIsVoiceLoading(false);
          },
        })
      : false;
    if (!staticPlayed && activeRef.current) {
      await speakPhrase(GREETING, greetingCacheRef.current, {
        onFirstAudioStart: () => {
          setIsVoiceLoading(false);
        },
      });
    }

    if (activeRef.current) {
      setIsVoiceLoading(false);
      voiceStream.clearTranscript();
      voiceStream.startListening();
    }
  }, [voiceStream, addMessage, endCallInternal, speakPhrase, speakStaticGreeting, startTypewriter, stopTypewriter]);

  // ── sendTextMessage ────────────────────────────────────────────────────

  const sendTextMessage = useCallback(
    (text: string) => {
      if (!activeRef.current || processingRef.current) return;
      processUserMessage(text);
    },
    [processUserMessage],
  );

  const endCall = useCallback(() => {
    void endCallInternal({ playGoodbye: false });
  }, [endCallInternal]);

  // ── Cleanup ────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      activeRef.current = false;
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      if (heardTextClearTimerRef.current) clearTimeout(heardTextClearTimerRef.current);
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
    heardText,
    isSpeaking: voiceStream.isSpeaking || isSpeakingLocal,
    isListening: voiceStream.isListening,
    sttMode: voiceStream.sttMode || 'browser',
    micLevel: voiceStream.audioLevel,
    isProcessing,
    isVoiceLoading,
    voiceError,
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
