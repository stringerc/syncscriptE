/**
 * Load repo-root `.env` into `process.env` (Playwright does not load it automatically).
 * Credentials for signed-in E2E: E2E_LOGIN_* or NEXUS_LIVE_TEST_* (from `bootstrap:nexus-verify-user`).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadDotEnv(): void {
  const p = join(process.cwd(), '.env');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

export function getNexusE2ECredentials(): { email: string; password: string } {
  loadDotEnv();
  return {
    email:
      process.env.E2E_LOGIN_EMAIL?.trim() ||
      process.env.NEXUS_LIVE_TEST_EMAIL?.trim() ||
      '',
    password:
      process.env.E2E_LOGIN_PASSWORD?.trim() ||
      process.env.NEXUS_LIVE_TEST_PASSWORD?.trim() ||
      '',
  };
}
