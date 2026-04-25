/**
 * High-density “Aether” particle dust while Nexus TTS is active — CSS keyframes, bounded DOM, no rAF.
 * Palette aligned with `nexus-aether-palette` / design reference `public/nexus/aether-orb-reference.png`.
 */
import { useReducedMotion } from 'motion/react';

const DUST_RGBA = [
  `rgba(244,196,112,0.92)`,
  `rgba(94,215,237,0.9)`,
  `rgba(216,47,137,0.88)`,
  `rgba(59,63,156,0.85)`,
] as const;

export function NexusVoiceSpeakingDust({ compact }: { compact: boolean }) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  const N = compact ? 22 : 46;
  const ringR = compact ? 56 : 86;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-visible"
      aria-hidden
    >
      <style>{`
        @keyframes nexus-sdust-spark {
          0%, 100% { opacity: 0.12; transform: scale(0.72); }
          50% { opacity: 0.95; transform: scale(1.22); }
        }
        @keyframes nexus-sdust-twinkle {
          0%, 100% { opacity: 0.35; transform: scale(0.85) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.35) rotate(180deg); }
        }
      `}</style>
      {Array.from({ length: N }, (_, i) => {
        const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
        const jitter = (i % 7) * 0.04 - 0.12;
        const r = ringR + (i % 5) * 3.5;
        /** Ellipse + rotation: denser “comet trail” toward upper-right (Aether reference). */
        const trailRot = -0.42;
        const cr = Math.cos(trailRot);
        const sr = Math.sin(trailRot);
        const ex = Math.cos(angle + jitter) * r * 1.2;
        const ey = Math.sin(angle + jitter) * r * 0.82;
        const x = ex * cr - ey * sr;
        const y = ex * sr + ey * cr;
        const fill = DUST_RGBA[i % DUST_RGBA.length];
        const size = 1.6 + (i % 4) * 0.55;
        const dur = 1.85 + (i % 6) * 0.14;
        const delay = i * 0.055;
        const twinkle = i % 5 === 0;
        const twinkleCore = `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, ${fill} 42%, transparent 72%)`;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              width: 0,
              height: 0,
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            <span
              className={`block will-change-transform ${twinkle ? '' : 'rounded-full'}`}
              style={{
                width: size,
                height: size,
                marginLeft: -size / 2,
                marginTop: -size / 2,
                background: twinkle ? twinkleCore : fill,
                boxShadow: twinkle
                  ? `0 0 ${size * 0.4}px ${fill}, 0 0 ${size * 2.4}px rgba(255,255,255,0.45)`
                  : `0 0 ${size * 3.2}px rgba(94,215,237,0.55)`,
                clipPath: twinkle ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : undefined,
                borderRadius: twinkle ? undefined : '9999px',
                animation: `${twinkle ? 'nexus-sdust-twinkle' : 'nexus-sdust-spark'} ${dur}s ease-in-out ${delay}s infinite`,
              }}
            />
          </span>
        );
      })}
    </div>
  );
}
