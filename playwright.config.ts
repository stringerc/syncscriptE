import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PREVIEW_PORT || 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

/** Only spin up Vite preview when targeting local preview (not production / staging URLs). */
const useLocalWebServer = (() => {
  try {
    const u = new URL(baseURL);
    const host = u.hostname;
    return host === '127.0.0.1' || host === 'localhost' || host === '::1';
  } catch {
    return false;
  }
})();

const webServer = useLocalWebServer
  ? {
      command: `npx vite preview --port ${port} --strictPort --host 127.0.0.1`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe' as const,
      stderr: 'pipe' as const,
    }
  : undefined;

export default defineConfig({
  testDir: './e2e',
  testIgnore: '**/*.diag.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 800 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(webServer ? { webServer } : {}),
});
