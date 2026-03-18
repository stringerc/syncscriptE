/**
 * PERF-005: Guard noisy hot-path logs.
 *
 * - Never emits in production.
 * - Optional sampling for high-frequency call sites.
 */

const IS_DEV = Boolean(import.meta.env?.DEV);

export function hotPathLog(...args: unknown[]): void {
  if (!IS_DEV) return;
  console.log(...args);
}

export function hotPathWarn(...args: unknown[]): void {
  if (!IS_DEV) return;
  console.warn(...args);
}

export function hotPathError(...args: unknown[]): void {
  if (!IS_DEV) return;
  console.error(...args);
}

export function shouldSample(rate = 0.1): boolean {
  if (!IS_DEV) return false;
  if (rate <= 0) return false;
  if (rate >= 1) return true;
  return Math.random() < rate;
}
