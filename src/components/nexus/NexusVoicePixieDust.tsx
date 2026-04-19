/**
 * Lightweight “fairy dust” burst when the Nexus orb docks (e.g. modal opens).
 * Uses one shared @keyframes + per-particle CSS variables — no per-frame JS, GPU-friendly.
 */
import { useEffect, useRef, type CSSProperties } from 'react';

const PARTICLE_COUNT = 22;

export function NexusVoicePixieDust({
  onComplete,
  reduceMotion,
}: {
  onComplete: () => void;
  reduceMotion: boolean;
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
        const t = i / PARTICLE_COUNT;
        const angleDeg = 195 + t * 115 + (Math.random() - 0.5) * 28;
        const rad = (angleDeg * Math.PI) / 180;
        const dist = 72 + Math.random() * 128;
        const tx = `${Math.cos(rad) * dist}px`;
        const ty = `${Math.sin(rad) * dist}px`;
        const size = 2 + Math.random() * 3.5;
        const delay = `${t * 0.12 + Math.random() * 0.06}s`;
        const hue = i % 4 === 0 ? 285 : i % 4 === 1 ? 195 : i % 4 === 2 ? 320 : 165;
        return (
          <span
            key={i}
            className="absolute rounded-full will-change-[transform,opacity]"
            style={
              {
                left: '50%',
                top: '40%',
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
