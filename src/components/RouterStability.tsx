import { useEffect } from 'react';
import { useNavigate } from 'react-router';

/**
 * After back/forward cache restore, React Router state can desync from the visible URL.
 * Re-applying the current location forces the router tree to reconcile with the address bar.
 */
export function BfcacheRouterSync() {
  const navigate = useNavigate();

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      const { pathname, search, hash } = window.location;
      navigate(`${pathname}${search}${hash}`, { replace: true });
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [navigate]);

  return null;
}
