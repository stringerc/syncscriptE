import type { ReactNode } from 'react'

/**
 * Satellite moons around the primary Nexus orb — delegation as state, not extra voices.
 * - loading: orbiting micro-dots while the model / tools run
 * - items: named satellites after trace resolves; parent clears after a short beat
 */
import { useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import type { VoiceDelegationHint } from '@/types/voice-engine'

const R_DEFAULT = 128
const R_COMPACT = 86

function polarOffset(index: number, total: number, radiusPx: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return {
    x: Math.cos(angle) * radiusPx,
    y: Math.sin(angle) * radiusPx,
  }
}

export function NexusVoiceSatelliteOrbit({
  loading,
  satellites,
  children,
  compact = false,
}: {
  loading: boolean
  satellites: VoiceDelegationHint[]
  children: ReactNode
  /** Smaller footprint when Nexus orb docks (e.g. modal open). */
  compact?: boolean
}) {
  const reduce = useReducedMotion()
  const R = compact ? R_COMPACT : R_DEFAULT
  const positions = useMemo(() => {
    const n = satellites.length || 1
    return satellites.map((_, i) => polarOffset(i, n, R))
  }, [satellites, R])

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={
        compact
          ? { width: 'min(72vw, 220px)', height: 'min(38vw, 150px)' }
          : { width: 'min(92vw, 360px)', height: 'min(52vw, 260px)' }
      }
      data-testid="nexus-voice-satellite-orbit"
      data-nexus-orbit-compact={compact ? 'true' : undefined}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-[0.14]"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 52%, rgba(34,211,238,0.12) 54%, transparent 70%)',
        }}
        aria-hidden
      />

      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading-ring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <motion.div
              className="absolute h-[min(76vw,280px)] w-[min(76vw,280px)] rounded-full border border-cyan-400/15"
              animate={reduce ? {} : { rotate: 360 }}
              transition={reduce ? { duration: 0 } : { duration: 28, repeat: Infinity, ease: 'linear' }}
            />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * 2 * Math.PI - Math.PI / 2
              const x = Math.cos(angle) * R
              const y = Math.sin(angle) * R
              return (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-cyan-200/90 to-violet-400/80 shadow-[0_0_14px_rgba(34,211,238,0.55)]"
                  style={{ marginLeft: -5, marginTop: -5, x, y }}
                  animate={
                    reduce
                      ? { opacity: 0.45 }
                      : {
                          opacity: [0.35, 0.95, 0.35],
                          scale: [0.85, 1.08, 0.85],
                        }
                  }
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: i * 0.12,
                    ease: 'easeInOut',
                  }}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!loading &&
          satellites.map((s, i) => {
            const pos = positions[i] ?? { x: 0, y: 0 }
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.35 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 28, delay: i * 0.06 }}
                className="pointer-events-none absolute left-1/2 top-1/2 z-[5] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              >
                <motion.div
                  className="flex h-9 w-9 items-center justify-center rounded-full shadow-lg ring-2 ring-white/20"
                  style={{
                    background: `radial-gradient(circle at 30% 25%, ${s.color}cc, ${s.color}55 55%, #0f172a 100%)`,
                    boxShadow: `0 0 24px ${s.color}55`,
                  }}
                  animate={
                    reduce
                      ? {}
                      : {
                          boxShadow: [
                            `0 0 18px ${s.color}44`,
                            `0 0 32px ${s.color}77`,
                            `0 0 18px ${s.color}44`,
                          ],
                        }
                  }
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 500, damping: 24 }}
                    className="text-[11px] font-bold text-white/95 drop-shadow-md"
                    aria-hidden
                  >
                    ✓
                  </motion.span>
                </motion.div>
                <span className="mt-1 max-w-[4.5rem] text-center text-[9px] font-semibold uppercase tracking-wide text-white/70">
                  {s.label}
                </span>
              </motion.div>
            )
          })}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center">{children}</div>
    </div>
  )
}
