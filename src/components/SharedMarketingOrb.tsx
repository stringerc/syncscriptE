import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router';

const HeroScene = lazy(() =>
  import('./landing/HeroScene').then((m) => ({ default: m.HeroScene })),
);

const ORB_CONFIG: Record<string, { offsetX: number; color1: string; color2: string; opacity: number }> = {
  '/':         { offsetX: 0,    color1: '#22d3ee', color2: '#2dd4bf', opacity: 2.3 },
  '/features': { offsetX: -1.8, color1: '#60a5fa', color2: '#67e8f9', opacity: 1.5 },
  '/pricing':  { offsetX: 0,    color1: '#34d399', color2: '#2dd4bf', opacity: 2.3 },
  '/faq':      { offsetX: 1.8,  color1: '#facc15', color2: '#fde047', opacity: 1.5 },
  '/contact':  { offsetX: 0,    color1: '#7c3aed', color2: '#06b6d4', opacity: 0.14 },
};

const MARKETING_PATHS = new Set(Object.keys(ORB_CONFIG));

export function SharedMarketingOrb() {
  const { pathname } = useLocation();

  if (!MARKETING_PATHS.has(pathname)) return null;

  const config = ORB_CONFIG[pathname] ?? ORB_CONFIG['/'];

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Suspense fallback={null}>
        <HeroScene
          offsetX={config.offsetX}
          disableScrollFade
          color1={config.color1}
          color2={config.color2}
          opacity={config.opacity}
        />
      </Suspense>
    </div>
  );
}
