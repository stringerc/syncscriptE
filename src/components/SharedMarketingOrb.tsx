import { lazy, Suspense, useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import type { OrbKeyframe } from './landing/HeroScene';
import { FloatingOrbs } from './FloatingOrbs';

const HeroScene = lazy(() =>
  import('./landing/HeroScene').then((m) => ({ default: m.HeroScene })),
);

// ═══════════════════════════════════════════════════════════════════════════
// Scroll-driven keyframes — the orb tells a story as you scroll
// ═══════════════════════════════════════════════════════════════════════════

const LANDING_KEYFRAMES: OrbKeyframe[] = [
  // Baseline: keep most sections visually stable for smoother scroll performance.
  { at: 0.00, expand: 1.0, spread: 0, noiseAmp: 0.95, speed: 0.9, tiltX: 0.47, rotSpeed: 0.95, brightness: 1.0, color1: '#0e7490', color2: '#0f766e', opacity: 1.35, posX: 0, posY: 0, scale: 1.0 },
  { at: 0.20, expand: 1.0, spread: 0, noiseAmp: 0.95, speed: 0.9, tiltX: 0.47, rotSpeed: 0.95, brightness: 1.0, color1: '#0e7490', color2: '#0f766e', opacity: 1.35, posX: 0, posY: 0, scale: 1.0 },

  // Nexus section: focused morph window.
  { at: 0.22, expand: 0.45, spread: 0, noiseAmp: 0.6, speed: 0.7, tiltX: 0.3, rotSpeed: 0.6, brightness: 0.5, color1: '#10b981', color2: '#34d399', opacity: 0.5, posX: 0.5, posY: 0, scale: 0.9 },
  { at: 0.28, expand: 0.45, spread: 0, noiseAmp: 0.6, speed: 0.7, tiltX: 0.3, rotSpeed: 0.6, brightness: 0.5, color1: '#10b981', color2: '#34d399', opacity: 0.5, posX: 0.5, posY: 0, scale: 0.9 },

  // Return to stable baseline through the middle sections.
  { at: 0.32, expand: 1.0, spread: 0, noiseAmp: 0.95, speed: 0.9, tiltX: 0.47, rotSpeed: 0.95, brightness: 1.0, color1: '#0e7490', color2: '#0f766e', opacity: 1.35, posX: 0, posY: 0, scale: 1.0 },
  { at: 0.92, expand: 1.0, spread: 0, noiseAmp: 0.95, speed: 0.9, tiltX: 0.47, rotSpeed: 0.95, brightness: 1.0, color1: '#0e7490', color2: '#0f766e', opacity: 1.35, posX: 0, posY: 0, scale: 1.0 },

  // Final CTA section: second focused morph window.
  { at: 0.95, expand: 0.5, spread: 0, noiseAmp: 2.0, speed: 2.5, tiltX: 0.2, rotSpeed: 2.0, brightness: 0.5, color1: '#fbbf24', color2: '#ffffff', opacity: 0.5, posX: 0, posY: 0, scale: 0.9 },
  { at: 0.98, expand: 0.5, spread: 0, noiseAmp: 2.0, speed: 2.5, tiltX: 0.2, rotSpeed: 2.0, brightness: 0.5, color1: '#fbbf24', color2: '#ffffff', opacity: 0.5, posX: 0, posY: 0, scale: 0.9 },
  { at: 1.00, expand: 1.0, spread: 0, noiseAmp: 0.95, speed: 0.9, tiltX: 0.47, rotSpeed: 0.95, brightness: 1.0, color1: '#0e7490', color2: '#0f766e', opacity: 1.35, posX: 0, posY: 0, scale: 1.0 },
];

const FEATURES_KEYFRAMES: OrbKeyframe[] = [
  { at: 0.0,  expand: 1.0,  spread: 0,    noiseAmp: 1.0, speed: 0.8, tiltX: 0.5,  rotSpeed: 0.8, brightness: 1.0, color1: '#60a5fa', color2: '#67e8f9', opacity: 1.5, posX: -1.0, posY: 0,    scale: 1.0  },
  { at: 0.2,  expand: 1.0,  spread: 0.05, noiseAmp: 1.3, speed: 1.2, tiltX: 0.6,  rotSpeed: 1.2, brightness: 1.2, color1: '#3b82f6', color2: '#06b6d4', opacity: 1.5, posX: -0.5, posY: -0.2, scale: 1.0  },
  { at: 0.5,  expand: 1.0,  spread: 0.1,  noiseAmp: 1.5, speed: 1.5, tiltX: 0.8,  rotSpeed: 1.5, brightness: 1.4, color1: '#8b5cf6', color2: '#60a5fa', opacity: 1.5, posX: 0.3,  posY: 0,    scale: 1.0  },
  { at: 0.8,  expand: 1.0,  spread: 0,    noiseAmp: 0.7, speed: 0.5, tiltX: 0.4,  rotSpeed: 0.4, brightness: 1.0, color1: '#06b6d4', color2: '#22d3ee', opacity: 1.3, posX: -0.8, posY: 0.2,  scale: 1.0  },
  { at: 1.0,  expand: 0.6,  spread: 0,    noiseAmp: 1.5, speed: 2.0, tiltX: 0.3,  rotSpeed: 1.5, brightness: 0.5,  color1: '#67e8f9', color2: '#ffffff', opacity: 0.5,  posX: 0,    posY: 0,    scale: 0.9  },
];

const PRICING_KEYFRAMES: OrbKeyframe[] = [
  { at: 0.0,  expand: 1.2,  spread: 0,    noiseAmp: 0.7, speed: 0.6, tiltX: 0.45, rotSpeed: 0.6, brightness: 1.0, color1: '#059669', color2: '#0d9488', opacity: 1.5, posX: 0,    posY: 0,    scale: 1.0  },
  { at: 0.3,  expand: 1.2,  spread: 0,    noiseAmp: 0.8, speed: 0.7, tiltX: 0.55, rotSpeed: 0.7, brightness: 1.2, color1: '#10b981', color2: '#14b8a6', opacity: 1.5, posX: 0.3,  posY: -0.1, scale: 1.0  },
  { at: 0.6,  expand: 1.2,  spread: 0.05, noiseAmp: 1.0, speed: 1.0, tiltX: 0.5,  rotSpeed: 1.0, brightness: 1.3, color1: '#059669', color2: '#0ea5e9', opacity: 1.5, posX: -0.2, posY: 0,    scale: 1.0  },
  { at: 1.0,  expand: 0.5,  spread: 0,    noiseAmp: 1.5, speed: 2.0, tiltX: 0.3,  rotSpeed: 1.5, brightness: 0.5,  color1: '#10b981', color2: '#ffffff', opacity: 0.5,  posX: 0,    posY: 0,    scale: 0.9  },
];

const FAQ_KEYFRAMES: OrbKeyframe[] = [
  { at: 0.0,  expand: 0.95, spread: 0,    noiseAmp: 0.6, speed: 0.4, tiltX: 0.4,  rotSpeed: 0.4, brightness: 1.0, color1: '#facc15', color2: '#fde047', opacity: 1.5, posX: 0.8,  posY: 0,    scale: 1.0  },
  { at: 0.3,  expand: 0.95, spread: 0,    noiseAmp: 0.8, speed: 0.5, tiltX: 0.5,  rotSpeed: 0.5, brightness: 1.1, color1: '#f59e0b', color2: '#fbbf24', opacity: 1.5, posX: 0.4,  posY: -0.1, scale: 1.0  },
  { at: 0.7,  expand: 0.95, spread: 0,    noiseAmp: 0.7, speed: 0.4, tiltX: 0.45, rotSpeed: 0.4, brightness: 1.0, color1: '#fbbf24', color2: '#fde047', opacity: 1.4, posX: 0.6,  posY: 0.1,  scale: 1.0  },
  { at: 1.0,  expand: 0.6,  spread: 0,    noiseAmp: 1.2, speed: 1.5, tiltX: 0.3,  rotSpeed: 1.2, brightness: 0.5,  color1: '#fde047', color2: '#ffffff', opacity: 0.5,  posX: 0,    posY: 0,    scale: 0.9  },
];

const PAGE_KEYFRAMES: Record<string, OrbKeyframe[]> = {
  '/':         LANDING_KEYFRAMES,
  '/features': FEATURES_KEYFRAMES,
  '/pricing':  PRICING_KEYFRAMES,
  '/faq':      FAQ_KEYFRAMES,
};

const MARKETING_PATHS = new Set(Object.keys(PAGE_KEYFRAMES));

export function SharedMarketingOrb() {
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);
  const isLanding = pathname === '/';

  useEffect(() => {
    if (!MARKETING_PATHS.has(pathname)) return;

    const schedule = typeof requestIdleCallback === 'function'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 1200);

    const id = schedule(() => setReady(true));

    return () => {
      if (typeof cancelIdleCallback === 'function' && typeof id === 'number') {
        cancelIdleCallback(id);
      }
    };
  }, [pathname]);

  if (!MARKETING_PATHS.has(pathname) || !ready) return null;

  const keyframes = PAGE_KEYFRAMES[pathname] ?? LANDING_KEYFRAMES;

  return (
    <>
      {isLanding ? (
        // Lightweight fallback ambience for landing:
        // keeps depth/brand glow without continuous canvas animation cost.
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.08),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(20,184,166,0.06),transparent_50%),radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent_55%)]" />
        </div>
      ) : (
        <FloatingOrbs />
      )}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Suspense fallback={null}>
          <HeroScene
            disableScrollFade
            keyframes={keyframes}
          />
        </Suspense>
      </div>
    </>
  );
}
