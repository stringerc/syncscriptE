/**
 * Minimal voice hero: circle whose glow/scale follows **Nexus TTS output** (not your mic). Interim
 * speech text lives in the parent (VoiceConversationEngine).
 *
 * Note: `ttsOutputLevel` is only non-zero for Kokoro/Web Audio playback. Browser SpeechSynthesis
 * leaves it at 0 — we boost lows and use a speech-like pulse when the envelope is missing so the
 * orb still reads clearly (same idea as NexusVoiceBlobVisualizer).
 *
 * IMPORTANT: Do not put the inner fill gradient in a Tailwind arbitrary class — very long
 * `bg-[radial-gradient(...)]` values are easy to miss in production CSS, which made the fill
 * disappear on syncscript.app (only a bright center spec read as a “dot”).
 *
 * LAYOUT: The outer shell must NOT be `display:flex` with only `position:absolute` children —
 * that collapses the box to ~0×0 in browsers, so only a tiny gradient center shows (white “dot”).
 * Use explicit width/height (same `min()` square) on a `display:block` container.
 */
import { useMemo, useRef, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { NexusVoiceOrbPhase } from './nexus-voice-orb-types';
import { aetherInnerFill, aetherShellBackground } from './nexus-aether-palette';

/** Map 0–1 analyser RMS into a fuller visual range (small raw values were reading as a “dot”). */
function boostAudioLevel(raw: number): number {
  const x = Math.min(1, Math.max(0, raw));
  return Math.min(1, Math.sqrt(x) * 1.15 + x * 0.85);
}

/**
 * Kokoro’s analyser often reads 0 before the first buffer decodes, dips between chunks, or stays
 * low on some devices — treat anything below this as “weak” and blend synthetic motion + floor.
 */
const TTS_ENVELOPE_DEAD = 0.2;

/** Lift near-silent RMS while Nexus is speaking so the orb doesn’t go flat between real samples. */
const TTS_RMS_VISUAL_FLOOR = 0.07;

/** Rolling average of recent raw TTS samples — de-jitters RMS spikes without heavy per-frame React work. */
const TTS_SMOOTH_SAMPLES = 5;

/** Full-size luminous core — inline style only (reliable in prod; see file header). */
function innerBaseStyle(): CSSProperties {
  return {
    pointerEvents: 'none',
    position: 'absolute',
    inset: '5%',
    borderRadius: '50%',
    background: aetherInnerFill(),
  };
}

function orbShellStyle(
  ringStyle: Record<string, string | undefined>,
  compact: boolean,
): CSSProperties {
  return {
    ...ringStyle,
    position: 'relative',
    display: 'block',
    boxSizing: 'border-box',
    width: compact ? 'min(22vw, 96px)' : 'min(30vw, 150px)',
    height: compact ? 'min(22vw, 96px)' : 'min(30vw, 150px)',
    minWidth: compact ? 64 : 96,
    minHeight: compact ? 64 : 96,
    maxWidth: compact ? 96 : 150,
    maxHeight: compact ? 96 : 150,
    flexShrink: 0,
  };
}

export function NexusVoiceMinimalCircle({
  phase,
  micLevel: _micLevel = 0,
  ttsLevel = 0,
  sessionActive,
  onTapToStart,
  sttReady = true,
  compact = false,
}: {
  phase: NexusVoiceOrbPhase;
  /** Intentionally unused for motion — orb reacts to Nexus (TTS) output, not your mic. */
  micLevel?: number;
  ttsLevel?: number;
  sessionActive: boolean;
  onTapToStart?: () => void;
  sttReady?: boolean;
  /** Smaller orb shell when docked (e.g. immersive modal open). */
  compact?: boolean;
}) {
  const reduce = useReducedMotion();

  const ttsHistoryRef = useRef<number[]>([]);
  const smoothedTtsSample = useMemo(() => {
    if (!sessionActive || phase !== 'speaking') {
      ttsHistoryRef.current = [];
      return ttsLevel;
    }
    const next = [...ttsHistoryRef.current, ttsLevel].slice(-TTS_SMOOTH_SAMPLES);
    ttsHistoryRef.current = next;
    return next.reduce((a, b) => a + b, 0) / next.length;
  }, [sessionActive, phase, ttsLevel]);

  const rawTtsForVisual =
    sessionActive && phase === 'speaking'
      ? Math.max(smoothedTtsSample, TTS_RMS_VISUAL_FLOOR)
      : ttsLevel;

  const boostedTts = boostAudioLevel(rawTtsForVisual);

  /** Weak envelope: still use *instant* RMS so we fall back to gentle pulse when analyser is flat. */
  const syntheticSpeechPulse =
    sessionActive && phase === 'speaking' && ttsLevel < TTS_ENVELOPE_DEAD;

  /**
   * Visual energy: only **speaking** (Nexus) drives the big motion. While you talk (listening),
   * keep the orb calm — mic level is ignored so it doesn’t pulse with your voice.
   */
  const level = sessionActive
    ? phase === 'speaking'
      ? Math.max(boostedTts, 0.2)
      : phase === 'listening'
        ? 0.07
        : phase === 'thinking'
          ? 0.22
          : 0.09
    : 0;

  const scale = sessionActive ? 1 + level * 0.2 : 1;
  const glow = 36 + level * 140;
  /** Floor opacity so the core never reads as a pinprick when analyser data is flat. */
  const innerOpacity = Math.min(0.98, Math.max(0.52, 0.38 + level * 0.52));

  const commonClass =
    'relative shrink-0 rounded-full outline-none';

  const ringStyle = {
    border: '2px solid rgba(94,215,237,0.42)',
    background: aetherShellBackground(),
    boxShadow: sessionActive
      ? `0 0 ${glow}px rgba(94,215,237,${0.22 + level * 0.45}),
         0 0 ${Math.round(glow * 0.52)}px rgba(216,47,137,${0.14 + level * 0.34}),
         0 0 ${Math.round(glow * 0.36)}px rgba(244,196,112,${0.1 + level * 0.3}),
         inset 0 0 52px rgba(255,255,255,${0.05 + level * 0.12})`
      : 'inset 0 0 40px rgba(255,255,255,0.04), 0 0 28px rgba(59,63,156,0.38)',
  } as const;

  if (!sessionActive) {
    return (
      <motion.button
        type="button"
        data-testid="nexus-voice-minimal-root"
        className={`${commonClass} cursor-pointer transition-opacity disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-white/30`}
        style={orbShellStyle(ringStyle, compact)}
        disabled={!sttReady}
        onClick={() => sttReady && onTapToStart?.()}
        aria-label={sttReady ? 'Start voice session' : 'Voice not ready'}
        animate={
          reduce
            ? { scale: 1 }
            : {
                scale: [1, 1.01, 1],
                opacity: [0.92, 1, 0.92],
              }
        }
        transition={reduce ? { duration: 0 } : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span
          className="pointer-events-none absolute rounded-full"
          style={{
            inset: '14%',
            background: aetherInnerFill(),
            opacity: 0.28,
          }}
          aria-hidden
        />
      </motion.button>
    );
  }

  const thinkingBreath =
    sessionActive && phase === 'thinking' && !reduce && !syntheticSpeechPulse;

  const outerPulse =
    !reduce && syntheticSpeechPulse
      ? { scale: [1, 1.028, 0.995, 1.034, 1] as const }
      : thinkingBreath
        ? { scale: [1, 1.05, 1.02, 1.055, 1] as const }
        : { scale };

  const outerTransition =
    !reduce && syntheticSpeechPulse
      ? { duration: 1.45, repeat: Infinity, ease: 'easeInOut' as const }
      : thinkingBreath
        ? { duration: 2.1, repeat: Infinity, ease: 'easeInOut' as const }
        : {
            type: 'spring' as const,
            stiffness: 150,
            damping: 34,
            mass: 0.85,
          };

  return (
    <motion.div
      data-testid="nexus-voice-minimal-root"
      data-pause-when-hidden
      className={commonClass}
      style={orbShellStyle(ringStyle, compact)}
      animate={reduce ? { scale: 1 } : outerPulse}
      transition={reduce ? { duration: 0 } : outerTransition}
      role="img"
      aria-label="Voice level"
    >
      <style>{`
        @keyframes nexus-aether-sheen { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <div
        className="pointer-events-none absolute rounded-full opacity-[0.72]"
        style={{
          inset: '-10%',
          background: `conic-gradient(from 210deg, rgba(94,215,237,0.55), rgba(216,47,137,0.62), rgba(244,196,112,0.52), rgba(59,63,156,0.75), rgba(94,215,237,0.55))`,
          filter: 'blur(11px)',
          animation: reduce ? undefined : 'nexus-aether-sheen 22s linear infinite',
          mixBlendMode: 'screen',
        }}
        aria-hidden
      />
      {syntheticSpeechPulse ? (
        <motion.div
          style={innerBaseStyle()}
          aria-hidden
          animate={
            reduce
              ? { opacity: [0.52, 0.92, 0.55, 0.88, 0.52] }
              : {
                  opacity: [0.42, 0.92, 0.48, 0.88, 0.42],
                  scale: [0.9, 1.12, 0.93, 1.08, 0.9],
                }
          }
          transition={{ duration: 1.45, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <motion.div
          style={innerBaseStyle()}
          aria-hidden
          animate={{
            opacity: innerOpacity,
            scale: reduce ? 1 : 0.82 + level * 0.24,
          }}
          transition={{ type: 'spring', stiffness: 130, damping: 32, mass: 0.9 }}
        />
      )}
    </motion.div>
  );
}
