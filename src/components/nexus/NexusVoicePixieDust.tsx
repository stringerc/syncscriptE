/**
 * Lightweight “fairy dust” burst when the Nexus orb docks (e.g. modal opens).
 * Uses one shared @keyframes + per-particle CSS variables — no per-frame JS, GPU-friendly.
 * When `path` is set, particles spawn along / near the center→dock segment and drift with
 * angles biased along that vector (trail-in-motion feel).
 */
import { useEffect, useRef, type CSSProperties } from 'react';

const PARTICLE_COUNT = 24;

export type NexusPixiePath = {
  from: { x: number; y: number };
  to: { x: number; y: number };
};

function fallbackPath(): NexusPixiePath {
  if (typeof window === 'undefined') {
    return { from: { x: 0, y: 0 }, to: { x: -80, y: -80 } };
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  const from = { x: w * 0.5, y: h * 0.4 };
  const to = { x: w * 0.12, y: h * 0.14 };
  return { from, to };
}

export default function NexusVoicePixieDust({
  onComplete,
  reduceMotion,
  path,
}: {
  onComplete: () => void;
  reduceMotion: boolean;
  path: NexusPixiePath | null;
}) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (reduceMotion) {
      onCompleteRef.current();
      return;
    }
    const t = window.setTimeout(() => onCompleteRef.current(), 980);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  if (reduceMotion) return null;

  const seg = path ?? fallbackPath();
  const { from, to } = seg;
  const baseRad = Math.atan2(to.y - from.y, to.x - from.x);
  const spread = 0.65;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[18] overflow-hidden"
      aria-hidden
    >
      <style>{`
        @keyframes nexus-pixie-drift {
          from {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          to {
            transform: translate(var(--tx), var(--ty)) scale(0.15);
            opacity: 0;
          }
        }
      `}</style>
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const t = i / Math.max(1, PARTICLE_COUNT - 1);
        const along = t * 0.42;
        const spawnX = from.x + (to.x - from.x) * along + (Math.random() - 0.5) * 14;
        const spawnY = from.y + (to.y - from.y) * along + (Math.random() - 0.5) * 14;
        const ang =
          baseRad + (Math.random() - 0.5) * spread + (i % 5) * 0.06 - 0.12;
        const dist = 64 + Math.random() * 118;
        const tx = `${Math.cos(ang) * dist}px`;
        const ty = `${Math.sin(ang) * dist}px`;
        const size = 2 + Math.random() * 3.5;
        const delay = `${t * 0.11 + Math.random() * 0.05}s`;
        const hue = i % 4 === 0 ? 285 : i % 4 === 1 ? 195 : i % 4 === 2 ? 320 : 165;
        return (
          <span
            key={i}
            className="absolute rounded-full will-change-[transform,opacity]"
            style={
              {
                left: `${spawnX}px`,
                top: `${spawnY}px`,
                width: size,
                height: size,
                marginLeft: -size / 2,
                marginTop: -size / 2,
                '--tx': tx,
                '--ty': ty,
                background: `hsla(${hue}, 82%, 74%, 0.9)`,
                boxShadow: `0 0 ${size * 2.2}px hsla(${hue}, 88%, 62%, 0.5)`,
                animation: `nexus-pixie-drift 0.82s ease-out ${delay} forwards`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
