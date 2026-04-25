/**
 * Spectrum strip — glass rail, mirrored floor, spring bars (levels from phase + mic/TTS).
 */
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { NexusVoiceOrbPhase } from './nexus-voice-orb-types';

const BAR_COUNT = 20;

function barHeights(
  phase: NexusVoiceOrbPhase,
  micLevel: number,
  ttsLevel: number,
): number[] {
  const mic = Math.min(1, Math.max(0, micLevel));
  const tts = Math.min(1, Math.max(0, ttsLevel));

  let drive: number;
  switch (phase) {
    case 'speaking':
      drive = Math.max(tts, 0.16);
      break;
    case 'listening':
      drive = Math.max(mic, 0.14);
      break;
    case 'thinking':
      drive = 0.42;
      break;
    case 'idle':
    default:
      drive = 0.06;
      break;
  }

  const mid = (BAR_COUNT - 1) / 2;

  if (phase === 'idle') {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const dist = Math.abs(i - mid) / mid;
      const centerWeight = 1 - dist * 0.35;
      const flat = 0.05 + 0.04 * centerWeight;
      return Math.min(1, Math.max(0.04, flat));
    });
  }

  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const dist = Math.abs(i - mid) / mid;
    const centerWeight = 1 - dist * 0.38;
    const wobble =
      0.42 +
      0.58 * (0.5 + 0.5 * Math.sin(i * 0.88 + (phase === 'speaking' ? 1.35 : phase === 'listening' ? 0.4 : 0)));
    const raw = drive * centerWeight * wobble;
    return Math.min(1, Math.max(0.12, raw));
  });
}

const railByPhase: Record<NexusVoiceOrbPhase, string> = {
  idle:
    'border-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_64px_-12px_rgba(34,211,238,0.14)]',
  listening:
    'border-cyan-400/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_72px_-10px_rgba(34,211,238,0.32)]',
  speaking:
    'border-violet-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_76px_-8px_rgba(167,139,250,0.4)]',
  thinking:
    'border-amber-400/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_68px_-10px_rgba(251,191,36,0.26)]',
};

export function NexusVoiceOrbLevelStrip({
  phase,
  micLevel = 0,
  ttsLevel = 0,
  className,
}: {
  phase: NexusVoiceOrbPhase;
  micLevel?: number;
  ttsLevel?: number;
  className?: string;
}) {
  const heights = useMemo(
    () => barHeights(phase, micLevel, ttsLevel),
    [phase, micLevel, ttsLevel],
  );

  return (
    <div
      data-testid="nexus-voice-level-bars"
      className={cn('pointer-events-none w-full max-w-[min(94vw,400px)]', className)}
      aria-hidden
    >
      <p className="mb-2.5 text-center text-[9px] font-medium uppercase tracking-[0.35em] text-white/25">Spectrum</p>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border bg-gradient-to-b px-3 pb-2 pt-3 md:px-5 md:pb-2.5 md:pt-3.5',
          'from-white/[0.09] via-white/[0.03] to-transparent backdrop-blur-[3px]',
          railByPhase[phase],
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            background:
              'radial-gradient(ellipse 130% 90% at 50% 100%, rgba(34,211,238,0.16), transparent 58%)',
          }}
        />
        <div className="relative flex h-[4rem] items-end justify-center gap-1 sm:h-[4.5rem] md:h-[5rem] md:gap-1.5">
          {heights.map((h, i) => (
            <motion.div
              key={i}
              className={cn(
                'min-h-[6px] w-1.5 max-w-[9px] flex-1 rounded-full sm:w-2',
                phase === 'idle'
                  ? 'bg-white/[0.14] shadow-none'
                  : 'bg-gradient-to-t from-cyan-200/95 via-violet-400/92 to-fuchsia-400/88 shadow-[0_0_16px_rgba(34,211,238,0.5),0_0_32px_rgba(139,92,246,0.22)]',
              )}
              initial={false}
              animate={{
                height: `${Math.round(h * 100)}%`,
                opacity: phase === 'idle' ? 0.35 + h * 0.25 : 0.7 + h * 0.3,
              }}
              transition={{
                type: 'spring',
                stiffness: 480,
                damping: 30,
                mass: 0.3,
                delay: i * 0.007,
              }}
              style={{ maxHeight: '100%', transformOrigin: 'bottom' }}
            />
          ))}
        </div>
        {/* Soft floor glow under bars */}
        <div
          className="pointer-events-none -mt-0.5 h-5 w-full bg-gradient-to-b from-cyan-400/20 via-violet-500/10 to-transparent opacity-60 blur-lg"
          aria-hidden
        />
      </div>
    </div>
  );
}
