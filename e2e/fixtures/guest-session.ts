/**
 * Stable Playwright dev-guest session (see AuthContext DEV_GUEST_SESSION_STORAGE_KEY).
 * isFirstTime: false — avoids welcome modal + first-time sample churn in layout/visual tests.
 */
import type { BrowserContext } from '@playwright/test';

export const GUEST_USER_STABLE = {
  id: 'guest_e2e_quality',
  email: 'e2e-guest@syncscript.test',
  name: 'E2E Guest',
  onboardingCompleted: true,
  createdAt: new Date().toISOString(),
  isGuest: true,
  isFirstTime: false,
} as const;

export const GUEST_SESSION_STABLE = {
  token: 'e2e-playwright-mock-token',
  user: GUEST_USER_STABLE,
} as const;

export async function installDevGuestSession(context: BrowserContext) {
  await context.addInitScript((payload: typeof GUEST_SESSION_STABLE) => {
    window.localStorage.setItem('syncscript_dev_guest_session_v1', JSON.stringify(payload));
  }, GUEST_SESSION_STABLE);
}

/** Default CHAT panel closed; avoid ~42rem width steal from main flex math. */
export async function installChatAssistantClosed(context: BrowserContext) {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('ai-insights-open', 'false');
    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem('syncscript_settings') || '{}';
      const j = JSON.parse(raw) as Record<string, unknown>;
      j.chatHubAlwaysVisible = false;
      localStorage.setItem('syncscript_settings', JSON.stringify(j));
    } catch {
      /* ignore */
    }
  });
}

export async function installChatAssistantOpen(context: BrowserContext) {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('ai-insights-open', 'true');
    } catch {
      /* ignore */
    }
  });
}
