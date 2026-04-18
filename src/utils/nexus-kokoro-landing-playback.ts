/**
 * Landing-equivalent Kokoro playback: chunked prosody + trimmed gaps + RMS level for UI.
 */
import { stepVuEnvelope } from './audio-vu-envelope';
import { buildNexusProsodySegmentsForSpeech } from './nexus-tts-prosody';
import { fetchKokoroBufferForNexusSegment } from './nexus-kokoro-tts-fetch';
import type { NexusProsodySegment } from './nexus-tts-prosody';

const KOKORO_INTER_CHUNK_TAIL_TRIM_SEC = 0.072;

class NexusLandingProgressivePlayer {
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
  private analyser: AnalyserNode;
  private rafId: number | null = null;
  private readonly data: Uint8Array;
  private lastEmit = 0;
  /** VU peak follower (fast attack / slow release) — same as `useVoiceStream` blob path. */
  private vuEnvelope = 0;

  constructor(
    signal: AbortSignal,
    private readonly setLevel: (n: number) => void,
  ) {
    this.ctx = new AudioContext();
    this.nextStartTime = this.ctx.currentTime + 0.03;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.93;
    this.analyser.connect(this.ctx.destination);
    this.data = new Uint8Array(this.analyser.fftSize);

    signal.addEventListener(
      'abort',
      () => {
        this.aborted = true;
        if (this.rafId != null) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
        this.vuEnvelope = 0;
        this.setLevel(0);
        for (const s of this.sources) {
          try {
            s.stop();
          } catch {
            /* ok */
          }
        }
        this.sources = [];
        this.ctx.close().catch(() => {});
        this.doneResolve?.();
      },
      { once: true },
    );
  }

  private tickRms = () => {
    if (this.aborted) return;
    this.analyser.getByteTimeDomainData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) {
      const v = (this.data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / this.data.length);
    const level = Math.min(1, rms * 6.2);
    this.vuEnvelope = stepVuEnvelope(level, this.vuEnvelope);
    const now = performance.now();
    if (now - this.lastEmit > 52) {
      this.lastEmit = now;
      this.setLevel(this.vuEnvelope);
    }
    this.rafId = requestAnimationFrame(this.tickRms);
  };

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
      if (this.aborted) {
        this.segmentDone();
        return;
      }

      let audio: AudioBuffer | null = null;
      try {
        audio = await decoded;
      } catch {
        /* swallow */
      }
      if (!audio || this.aborted) {
        this.segmentDone();
        return;
      }

      await this.ctx.resume().catch(() => {});

      if (!this.firstPlayFired) {
        this.firstPlayFired = true;
        this.lastEmit = 0;
        this.rafId = requestAnimationFrame(this.tickRms);
      }

      const now = this.ctx.currentTime;
      const startAt = Math.max(this.nextStartTime, now + 0.003);

      const src = this.ctx.createBufferSource();
      src.buffer = audio;
      src.connect(this.analyser);
      src.start(startAt);
      this.sources.push(src);

      const trim = Math.min(KOKORO_INTER_CHUNK_TAIL_TRIM_SEC, Math.max(0, audio.duration - 0.04));
      this.nextStartTime = startAt + Math.max(0.02, audio.duration - trim);

      src.onended = () => {
        const idx = this.sources.indexOf(src);
        if (idx >= 0) this.sources.splice(idx, 1);
        this.segmentDone();
      };
    });
  }

  seal() {
    this.sealed = true;
    this.checkDone();
  }

  private segmentDone() {
    this.playedCount++;
    this.checkDone();
  }

  private checkDone() {
      if (this.sealed && this.playedCount >= this.feedCount) {
        if (this.rafId != null) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
        this.vuEnvelope = 0;
        this.setLevel(0);
        this.ctx.close().catch(() => {});
        this.doneResolve?.();
    }
  }

  waitUntilDone(): Promise<void> {
    if (this.aborted) return Promise.resolve();
    if (this.sealed && this.playedCount >= this.feedCount) {
      if (this.rafId != null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.vuEnvelope = 0;
      this.setLevel(0);
      this.ctx.close().catch(() => {});
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.doneResolve = resolve;
    });
  }

  didAudioPlay(): boolean {
    return this.firstPlayFired;
  }
}

/**
 * Speak like landing Nexus: sanitize → chunk → per-sentence prosody → voice fallbacks → gapless trimmed playback.
 * Returns whether any audio actually played (false ⇒ caller should fall back to legacy TTS).
 */
export async function playNexusLandingKokoroTTS(
  fullText: string,
  signal: AbortSignal,
  setTtsOutputLevel: (n: number) => void,
): Promise<boolean> {
  const segments = buildNexusProsodySegmentsForSpeech(fullText);
  if (!segments.length) return false;

  const player = new NexusLandingProgressivePlayer(signal, setTtsOutputLevel);

  for (const seg of segments) {
    if (signal.aborted) break;
    player.feed(fetchKokoroBufferForNexusSegment(seg, signal));
  }
  player.seal();
  await player.waitUntilDone();
  return player.didAudioPlay();
}
