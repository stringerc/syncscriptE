/**
 * Immersive voice HUD — concentric neon rings + luminous core.
 * Layered bloom + specular rim for depth (award-caliber read at a glance).
 */
import { motion, useReducedMotion } from 'motion/react';
import type { NexusVoiceOrbPhase } from './nexus-voice-orb-types';

function phaseAccent(phase: NexusVoiceOrbPhase): {
  ring: string;
  ringSoft: string;
  core: string;
  glow: string;
  bloom: string;
} {
  switch (phase) {
    case 'listening':
      return {
        ring: 'rgba(45, 212, 191, 0.62)',
        ringSoft: 'rgba(34, 211, 238, 0.38)',
        core: 'radial-gradient(circle at 38% 28%, #ffffff 0%, #ecfeff 38%, #67e8f9 72%, #22d3ee 100%)',
        glow: 'rgba(34, 211, 238, 0.5)',
        bloom: 'rgba(45, 212, 191, 0.35)',
      };
    case 'speaking':
      return {
        ring: 'rgba(167, 139, 250, 0.68)',
        ringSoft: 'rgba(129, 140, 248, 0.42)',
        core: 'radial-gradient(circle at 40% 30%, #ffffff 0%, #f5f3ff 40%, #c4b5fd 78%, #a78bfa 100%)',
        glow: 'rgba(167, 139, 250, 0.52)',
        bloom: 'rgba(139, 92, 246, 0.38)',
      };
    case 'thinking':
      return {
        ring: 'rgba(251, 191, 36, 0.58)',
        ringSoft: 'rgba(245, 158, 11, 0.38)',
        core: 'radial-gradient(circle at 36% 32%, #ffffff 0%, #fffbeb 42%, #fde68a 76%, #fbbf24 100%)',
        glow: 'rgba(251, 191, 36, 0.42)',
        bloom: 'rgba(245, 158, 11, 0.32)',
      };
    default:
      return {
        ring: 'rgba(34, 211, 238, 0.45)',
        ringSoft: 'rgba(167, 139, 250, 0.32)',
        core: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #f8fafc 48%, #e2e8f0 88%, #cbd5e1 100%)',
        glow: 'rgba(34, 211, 238, 0.34)',
        bloom: 'rgba(99, 102, 241, 0.28)',
      };
  }
}

export function NexusVoiceImmersiveHud({
  phase,
  ttsLevel = 0,
  micLevel = 0,
}: {
  phase: NexusVoiceOrbPhase;
  ttsLevel?: number;
  micLevel?: number;
}) {
  const reduce = useReducedMotion();
  const accent = phaseAccent(phase);
  const ringDurMul = reduce ? 2.75 : 1;

  /** Idle = single blank ring (reference: minimal voice orb before signal). */
  if (phase === 'idle') {
    return (
      <div className="pointer-events-none relative flex aspect-square w-[min(92vw,420px)] max-w-[420px] items-center justify-center">
        <div
          className="absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 50% 48%, rgba(148, 163, 184, 0.12), transparent 62%)',
            opacity: reduce ? 0.35 : 0.55,
          }}
        />
        <motion.div
          className="relative z-[2] aspect-square w-[min(52vw,240px)] max-w-[240px] rounded-full bg-transparent"
          style={{
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: 'rgba(255,255,255,0.22)',
            boxShadow:
              'inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 0 1px rgba(15,23,42,0.4), 0 0 48px -12px rgba(34,211,238,0.12)',
          }}
          animate={
            reduce
              ? { opacity: 1 }
              : {
                  opacity: [0.92, 1, 0.92],
                  scale: [1, 1.006, 1],
                }
          }
          transition={
            reduce
              ? {}
              : { duration: 4.2, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      </div>
    );
  }

  const energy =
    phase === 'speaking'
      ? Math.max(ttsLevel, 0.12)
      : phase === 'listening'
        ? Math.max(micLevel, 0.1)
        : phase === 'thinking'
          ? 0.45
          : 0.2;

  const coreScale = 1 + energy * (phase === 'speaking' ? 0.1 : phase === 'listening' ? 0.08 : 0.045);

  const rings = [
    { inset: '0%', dash: false as const, cw: true, dur: 48 },
    { inset: '7%', dash: true as const, cw: false, dur: 36 },
    { inset: '14%', dash: false as const, cw: true, dur: 52 },
    { inset: '21%', dash: true as const, cw: false, dur: 40 },
  ];

  return (
    <div className="pointer-events-none relative flex aspect-square w-[min(92vw,420px)] max-w-[420px] items-center justify-center">
      {/* Wide atmospheric bloom — reads as “stage light” */}
      <div
        className="absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${accent.bloom}, transparent 62%)`,
          opacity: reduce ? 0.55 : 0.72,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-[0.14]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.045) 2px, rgba(255,255,255,0.045) 3px)',
        }}
      />

      {rings.map((r, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full will-change-transform"
          initial={false}
          style={{
            inset: r.inset,
            borderWidth: i === 0 ? 2 : 1,
            borderStyle: r.dash ? 'dashed' : 'solid',
            borderColor: i % 2 === 0 ? accent.ring : accent.ringSoft,
            boxShadow: `0 0 ${14 + i * 5}px ${accent.glow}, inset 0 0 ${2 + i}px rgba(255,255,255,${0.04 + i * 0.02})`,
          }}
          animate={{ rotate: r.cw ? 360 : -360 }}
          transition={{
            duration: r.dur * ringDurMul,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Luminous core + specular rim */}
      <motion.div
        className="relative z-[2] flex h-[48%] w-[48%] items-center justify-center rounded-full"
        style={{
          background: accent.core,
          boxShadow: `
            0 0 ${48 + energy * 42}px ${accent.glow},
            0 0 ${88 + energy * 20}px ${accent.bloom},
            inset 0 1px 0 rgba(255,255,255,0.55),
            inset 0 -8px 24px rgba(15,23,42,0.15),
            inset 0 0 0 1px rgba(255,255,255,0.25)
          `,
        }}
        animate={reduce ? { opacity: [0.9, 1, 0.9] } : { scale: coreScale }}
        transition={
          reduce
            ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
            : { type: 'spring', stiffness: 260, damping: 22 }
        }
      >
        <span className="select-none bg-gradient-to-b from-slate-950 via-slate-800 to-slate-950 bg-clip-text text-center font-semibold tracking-[0.48em] text-transparent [font-size:clamp(0.58rem,2.5vmin,0.78rem)] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
          NEXUS
        </span>
      </motion.div>
    </div>
  );
}
