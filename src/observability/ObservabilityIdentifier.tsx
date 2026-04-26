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
      // Tier 0 A: pull authoritative onboarding state from the server on
      // sign-in. Hydrates the local cache so UI shows the same checklist
      // state across devices / browsers. Lazy import keeps it off the cold
      // boot path; runs only when there's a real user (skipped on guest).
      user?.id
        ? import('../components/onboarding/checklist-tracking')
            .then((m) => {
              if (cancelled) return;
              return m.pullOnboardingProgressFromServer();
            })
            .catch(() => {})
        : Promise.resolve(),
    ]);
    return () => { cancelled = true; };
  }, [user?.id, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
