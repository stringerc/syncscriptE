import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { FloatingOrbs } from './FloatingOrbs';
const MARKETING_PATHS = new Set(['/', '/features', '/pricing', '/faq']);

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

  return (
    <>
      <FloatingOrbs />
      {isLanding && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.08),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(20,184,166,0.06),transparent_50%),radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent_55%)]" />
        </div>
      )}
    </>
  );
}
