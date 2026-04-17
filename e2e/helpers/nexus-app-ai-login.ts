/**
 * Shared login for signed-in Playwright specs (prod or local preview).
 */
import { expect, type Page } from '@playwright/test';

export async function acceptCookiesIfPresent(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: /Accept All Cookies/i });
  if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await btn.click();
  }
}

export type LoginResult = {
  /** Present when `waitForProfile` is true (default). */
  profileResponse?: import('@playwright/test').Response;
};

/**
 * Sign in with email/password. Optionally wait for Edge `GET .../user/profile` (CORS smoke).
 */
export async function loginToSyncScript(
  page: Page,
  email: string,
  password: string,
  options: { waitForProfile?: boolean } = {},
): Promise<LoginResult> {
  const waitForProfile = options.waitForProfile !== false;

  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await acceptCookiesIfPresent(page);

  let profileWait: Promise<import('@playwright/test').Response> | undefined;
  if (waitForProfile) {
    profileWait = page.waitForResponse(
      (r) =>
        r.url().includes('make-server-57781ad9/user/profile') &&
        r.request().method() === 'GET',
      { timeout: 90_000 },
    );
  }

  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /^Sign in$/ }).click();

  const profileResponse = profileWait ? await profileWait : undefined;
  await expect(page).not.toHaveURL(/\/login/, { timeout: 60_000 });
  return { profileResponse };
}
