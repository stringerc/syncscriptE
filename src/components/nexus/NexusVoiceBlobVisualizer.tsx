/**
 * Organic morphing “voice blob” — same visual language as ChatGPT Voice / Sesame-style UIs:
 * soft metaball-like mass driven by CSS border-radius animation + layered gradients.
 * SyncScript twist: violet–cyan–fuchsia energy core (not a single gray sphere).
 *
 * When `ttsLevel` / `micLevel` are wired (from Web Audio), the mass **breathes with real audio**;
 * otherwise phase-based motion still reads clearly.
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { NexusVoiceOrbPhase } from './nexus-voice-orb-types';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return reduced;
}

interface NexusVoiceBlobVisualizerProps {
  phase: NexusVoiceOrbPhase;
  /** 0–1 Kokoro TTS envelope (from `useVoiceStream.ttsOutputLevel`). */
  ttsLevel?: number;
  /** 0–1 live mic level (from `useEmotionDetection.micInputLevel`). */
  micLevel?: number;
}

const BLOB_RADIUS_A = '58% 42% 68% 32% / 42% 58% 38% 62%';
const MID_RADIUS_A = '52% 48% 62% 38% / 48% 42% 58% 52%';

export function NexusVoiceBlobVisualizer({
  phase,
  ttsLevel = 0,
  micLevel = 0,
}: NexusVoiceBlobVisualizerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const active = phase === 'speaking' || phase === 'listening';
  const think = phase === 'thinking';

  const dur = reducedMotion ? 10 : think ? 5.5 : active ? 2.8 : 4.2;

  const audioScale = useMemo(() => {
    if (reducedMotion) {
      if (phase === 'speaking') return 1 + ttsLevel * 0.045;
      if (phase === 'listening') return 1 + micLevel * 0.04;
      return 1;
    }
    if (phase === 'speaking') return 1 + ttsLevel * 0.16;
    if (phase === 'listening') return 1 + micLevel * 0.12;
    return 1;
  }, [phase, ttsLevel, micLevel, reducedMotion]);

  const scalePulse = phase === 'speaking' ? [1, 1.25, 1.05, 1.28, 1] : phase === 'listening' ? [1, 1.08, 1] : [1, 1.02, 1];

  const coreAnimate = reducedMotion
    ? { borderRadius: BLOB_RADIUS_A, rotate: 0, scale: Math.max(1, audioScale * 0.99) }
    : {
        borderRadius: [
          '58% 42% 68% 32% / 42% 58% 38% 62%',
          '42% 58% 35% 65% / 55% 45% 62% 38%',
          '65% 35% 52% 48% / 38% 62% 48% 52%',
          '58% 42% 68% 32% / 42% 58% 38% 62%',
        ],
        rotate: [0, -5, 4, 0],
        scale: scalePulse.map((s) => s * audioScale),
      };

  const midAnimate = reducedMotion
    ? { borderRadius: MID_RADIUS_A, rotate: 0 }
    : {
        borderRadius: [
          '52% 48% 62% 38% / 48% 42% 58% 52%',
          '48% 52% 38% 62% / 55% 48% 52% 45%',
          '58% 42% 48% 52% / 42% 58% 48% 52%',
          '52% 48% 62% 38% / 48% 42% 58% 52%',
        ],
        rotate: [0, 4, -3, 0],
      };

  return (
    <div className="relative mx-auto flex aspect-square w-[min(88vw,360px)] max-w-[360px] items-center justify-center">
      {/* Soft outer bloom */}
      <motion.div
        className="absolute inset-[-18%] rounded-[58%_42%_65%_35%/45%_55%_38%_62%] opacity-50 blur-3xl"
        style={{
          background:
            phase === 'listening'
              ? 'radial-gradient(circle at 40% 35%, rgba(52,211,153,0.45), transparent 62%)'
              : phase === 'speaking'
                ? 'radial-gradient(circle at 50% 40%, rgba(99,102,241,0.5), rgba(6,182,212,0.25), transparent 65%)'
                : 'radial-gradient(circle at 45% 40%, rgba(139,92,246,0.4), transparent 60%)',
        }}
        animate={
          reducedMotion
            ? { opacity: active ? 0.48 : 0.32, scale: audioScale }
            : {
                scale: scalePulse.map((s) => s * audioScale),
                opacity: active ? [0.35, 0.6, 0.35] : [0.25, 0.4, 0.25],
              }
        }
        transition={
          reducedMotion
            ? { duration: 0.35 }
            : { duration: dur, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      {/* Mid layer — secondary lobe */}
      <motion.div
        className="absolute inset-[6%] opacity-90 mix-blend-screen"
        animate={midAnimate}
        transition={{
          duration: reducedMotion ? 0 : dur * 0.85,
          repeat: reducedMotion ? 0 : Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background:
            'conic-gradient(from 200deg at 50% 45%, rgba(34,211,238,0.55), rgba(167,139,250,0.65), rgba(236,72,153,0.45), rgba(34,211,238,0.55))',
          filter: 'blur(0.5px)',
        }}
      />

      {/* Core blob — primary mass (ChatGPT-style morph) */}
      <motion.div
        className="relative h-[78%] w-[78%] shadow-[0_0_60px_-8px_rgba(139,92,246,0.55),inset_0_0_40px_rgba(255,255,255,0.12)]"
        animate={coreAnimate}
        transition={{
          duration: reducedMotion ? 0 : dur * 0.75,
          repeat: reducedMotion ? 0 : Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 40% 35%, rgba(255,255,255,0.35), transparent 52%), radial-gradient(ellipse 90% 80% at 60% 65%, rgba(6,182,212,0.45), transparent 55%), linear-gradient(165deg, rgba(99,102,241,0.95), rgba(139,92,246,0.85), rgba(8,145,178,0.75))',
        }}
      />

      {/* Highlight glint */}
      <motion.div
        className="pointer-events-none absolute inset-[22%] rounded-[55%_45%_60%_40%/50%_55%_45%_50%] opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 55% 40% at 35% 30%, rgba(255,255,255,0.55), transparent 58%)',
        }}
        animate={{
          opacity:
            reducedMotion
              ? active ? 0.55 + ttsLevel * 0.2 : 0.4
              : active
                ? [0.45, 0.85, 0.45]
                : [0.35, 0.55, 0.35],
        }}
        transition={
          reducedMotion
            ? { duration: 0.25 }
            : { duration: dur * 0.5, repeat: Infinity, ease: 'easeInOut' }
        }
      />
    </div>
  );
}
