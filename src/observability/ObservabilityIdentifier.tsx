/**
 * Side-effect-only component: when the auth user changes, identify them in
 * Sentry + PostHog. Render this once near the App root inside <AuthProvider>.
 *
 * Both setters are no-ops when the SDKs aren't loaded — safe in dev / when
 * env vars are unset.
 */
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function ObservabilityIdentifier(): null {
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      import('./sentry').then((m) => {
        if (cancelled) return;
        return m.setSentryUser(user ? { id: user.id, email: user.email } : null);
      }).catch(() => {}),
      import('./analytics').then((m) => {
        if (cancelled) return;
        return m.identifyAnalyticsUser(user ? { id: user.id, email: user.email } : null);
      }).catch(() => {}),
    ]);
    return () => { cancelled = true; };
  }, [user?.id, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
