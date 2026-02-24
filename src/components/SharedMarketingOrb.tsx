import { lazy, Suspense, useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import type { OrbKeyframe } from './landing/HeroScene';
import { FloatingOrbs } from './FloatingOrbs';

const HeroScene = lazy(() =>
  import('./landing/HeroScene').then((m) => ({ default: m.HeroScene })),
);

const MARKETING_PATHS = new Set(['/', '/features', '/pricing', '/faq']);

const STATIC_ROUTE_KEYFRAMES: Record<string, OrbKeyframe[]> = {
  '/': [
    { at: 0, expand: 0.9, spread: 0, noiseAmp: 0.65, speed: 0.75, tiltX: 0.32, rotSpeed: 0.7, brightness: 0.6, color1: '#10b981', color2: '#34d399', opacity: 0.5, posX: 0.45, posY: 0, scale: 0.92 },
    { at: 1, expand: 0.9, spread: 0, noiseAmp: 0.65, speed: 0.75, tiltX: 0.32, rotSpeed: 0.7, brightness: 0.6, color1: '#10b981', color2: '#34d399', opacity: 0.5, posX: 0.45, posY: 0, scale: 0.92 },
  ],
  '/features': [
    { at: 0, expand: 1.0, spread: 0, noiseAmp: 0.75, speed: 0.7, tiltX: 0.45, rotSpeed: 0.8, brightness: 0.85, color1: '#3b82f6', color2: '#06b6d4', opacity: 0.6, posX: -0.5, posY: 0, scale: 0.95 },
    { at: 1, expand: 1.0, spread: 0, noiseAmp: 0.75, speed: 0.7, tiltX: 0.45, rotSpeed: 0.8, brightness: 0.85, color1: '#3b82f6', color2: '#06b6d4', opacity: 0.6, posX: -0.5, posY: 0, scale: 0.95 },
  ],
  '/pricing': [
    { at: 0, expand: 1.05, spread: 0, noiseAmp: 0.7, speed: 0.65, tiltX: 0.4, rotSpeed: 0.75, brightness: 0.8, color1: '#059669', color2: '#0d9488', opacity: 0.58, posX: 0.25, posY: 0, scale: 0.95 },
    { at: 1, expand: 1.05, spread: 0, noiseAmp: 0.7, speed: 0.65, tiltX: 0.4, rotSpeed: 0.75, brightness: 0.8, color1: '#059669', color2: '#0d9488', opacity: 0.58, posX: 0.25, posY: 0, scale: 0.95 },
  ],
  '/faq': [
    { at: 0, expand: 0.95, spread: 0, noiseAmp: 0.6, speed: 0.55, tiltX: 0.38, rotSpeed: 0.65, brightness: 0.75, color1: '#f59e0b', color2: '#fbbf24', opacity: 0.55, posX: 0.35, posY: 0.05, scale: 0.93 },
    { at: 1, expand: 0.95, spread: 0, noiseAmp: 0.6, speed: 0.55, tiltX: 0.38, rotSpeed: 0.65, brightness: 0.75, color1: '#f59e0b', color2: '#fbbf24', opacity: 0.55, posX: 0.35, posY: 0.05, scale: 0.93 },
  ],
};

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

  const keyframes = STATIC_ROUTE_KEYFRAMES[pathname] ?? STATIC_ROUTE_KEYFRAMES['/'];

  return (
    <>
      <FloatingOrbs />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Suspense fallback={null}>
          <HeroScene
            disableScrollFade
            scrollReactive={false}
            interactive={false}
            keyframes={keyframes}
          />
        </Suspense>
      </div>
      {isLanding && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.08),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(20,184,166,0.06),transparent_50%),radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent_55%)]" />
        </div>
      )}
    </>
  );
}
