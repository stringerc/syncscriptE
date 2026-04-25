/**
 * Nexus Voice — immersive stage: cinematic depth, HUD, spectrum + energy.
 */
import { motion } from 'motion/react';
import { Mic } from 'lucide-react';
import type { NexusVoiceOrbPhase } from './nexus-voice-orb-types';
import { NexusVoiceImmersiveHud } from './NexusVoiceImmersiveHud';
import { NexusVoiceOrbLevelStrip } from './NexusVoiceOrbLevelStrip';
import './nexus-voice-immersive.css';

const PHASE_COPY: Record<NexusVoiceOrbPhase, { label: string; sub: string; cue: string }> = {
  idle: {
    label: 'Ready',
    sub: 'Nexus is live — speak whenever you are.',
    cue: 'Tap End below to close',
  },
  listening: {
    label: 'Listening',
    sub: 'Start speaking',
    cue: 'Your mic is active',
  },
  speaking: {
    label: 'Nexus',
    sub: 'Speaking — interrupt anytime',
    cue: 'Voice output',
  },
  thinking: {
    label: 'Thinking',
    sub: 'Working on your request…',
    cue: 'Processing',
  },
};

export function NexusVoiceResonanceOrb({
  phase,
  ttsLevel = 0,
  micLevel = 0,
}: {
  phase: NexusVoiceOrbPhase;
  ttsLevel?: number;
  micLevel?: number;
}) {
  const copy = PHASE_COPY[phase];

  return (
    <div
      data-testid="nexus-voice-resonance-root"
      className="relative flex min-h-[min(54vh,560px)] w-full flex-col items-center justify-center overflow-hidden rounded-[1.35rem] px-3 py-10 sm:rounded-3xl"
    >
      {/* Cinematic void + dual aurora (CSS) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[1.35rem] sm:rounded-3xl"
        style={{
          background:
            'radial-gradient(ellipse 95% 80% at 50% 38%, rgba(15, 23, 42, 0.15) 0%, transparent 50%), #010206',
          boxShadow: 'inset 0 0 140px rgba(0,0,0,0.75)',
        }}
      />
      <div
        className={`nexus-voice-aurora-a pointer-events-none absolute -left-[20%] top-[8%] h-[55%] w-[90%] rounded-full blur-[80px] transition-opacity duration-700 ${
          phase === 'idle' ? 'opacity-[0.35]' : 'opacity-100'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.22), transparent 68%)',
        }}
      />
      <div
        className={`nexus-voice-aurora-b pointer-events-none absolute -right-[15%] bottom-[12%] h-[50%] w-[85%] rounded-full blur-[90px] transition-opacity duration-700 ${
          phase === 'idle' ? 'opacity-[0.28]' : 'opacity-100'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.2), transparent 70%)',
        }}
      />
      <div
        className="nexus-voice-grain absolute inset-0 rounded-[1.35rem] sm:rounded-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[1.35rem] opacity-[0.16] sm:rounded-3xl"
        style={{
          backgroundImage:
            'repeating-linear-gradient(180deg, transparent, transparent 1px, rgba(148,163,184,0.06) 1px, rgba(148,163,184,0.06) 2px)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[1.35rem] bg-gradient-to-b from-white/[0.03] via-transparent to-black/40 sm:rounded-3xl"
        aria-hidden
      />

      <div className="relative z-[1] flex w-full flex-col items-center">
        <NexusVoiceImmersiveHud phase={phase} ttsLevel={ttsLevel} micLevel={micLevel} />

        <NexusVoiceOrbLevelStrip
          className="mt-7"
          phase={phase}
          micLevel={micLevel}
          ttsLevel={ttsLevel}
        />

        <div className="mt-9 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.12] to-white/[0.03] shadow-[0_0_28px_-4px_rgba(34,211,238,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]">
              <Mic className="h-5 w-5 text-cyan-100/95" aria-hidden />
            </div>
            <div className="flex gap-2" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-gradient-to-br from-cyan-200 to-violet-300 shadow-[0_0_12px_rgba(34,211,238,0.45)]"
                  animate={{
                    opacity:
                      phase === 'idle'
                        ? 0.28
                        : phase === 'listening' || phase === 'speaking'
                          ? [0.4, 1, 0.4]
                          : 0.45,
                    scale:
                      phase === 'idle'
                        ? 1
                        : phase === 'listening' || phase === 'speaking'
                          ? [0.88, 1.12, 0.88]
                          : 1,
                  }}
                  transition={{
                    duration: 1.15,
                    repeat: phase === 'idle' ? 0 : Infinity,
                    delay: i * 0.11,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>
          <motion.div
            className="max-w-[22rem] px-2 text-center"
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.55em] text-cyan-100/80">{copy.label}</p>
            <p className="mt-3 text-lg font-light leading-snug tracking-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.45)] sm:text-xl">
              {copy.sub}
            </p>
            <p className="mt-2 text-[13px] font-normal tracking-wide text-white/40">{copy.cue}</p>
          </motion.div>
        </div>
      </div>

      {/* Energy strip — primary meter */}
      <div
        data-testid="nexus-voice-energy-strip"
        className="relative z-[2] mt-11 w-[min(92vw,360px)] max-w-[360px] px-1"
      >
        <p className="mb-2 text-center text-[9px] font-medium uppercase tracking-[0.35em] text-white/25">Signal</p>
        <div className="h-3.5 w-full overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.1] shadow-[inset_0_2px_4px_rgba(0,0,0,0.45)]">
          {phase === 'idle' ? (
            <div
              className="h-full w-0 max-w-full rounded-full bg-transparent"
              aria-hidden
            />
          ) : phase === 'thinking' ? (
            <motion.div
              className="nexus-voice-energy-shimmer h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-500 shadow-[0_0_28px_rgba(34,211,238,0.55),0_0_48px_rgba(167,139,250,0.22)]"
              animate={{ width: ['28%', '58%', '36%', '52%', '28%'] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ) : (
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-500 shadow-[0_0_26px_rgba(34,211,238,0.55),0_0_44px_rgba(167,139,250,0.28)]"
              animate={{
                width: `${Math.min(
                  100,
                  Math.round(
                    (phase === 'speaking'
                      ? Math.max(ttsLevel, 0.2)
                      : Math.max(micLevel, 0.16)) * 100,
                  ),
                )}%`,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ minWidth: '18%' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
