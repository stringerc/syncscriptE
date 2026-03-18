/**
 * EX-045: Canonical demo/mock gate for frontend runtime behavior.
 * Production defaults to strict mode unless explicitly enabled.
 */
export function isDemoWorkspaceEnabled(): boolean {
  const envFlag = String(import.meta.env.VITE_ENABLE_DEMO_WORKSPACE || '').toLowerCase() === 'true';
  return import.meta.env.DEV || envFlag;
}

export function shouldAllowDemoData(): boolean {
  return isDemoWorkspaceEnabled();
}

export function isStrictProductionMode(): boolean {
  return !shouldAllowDemoData();
}
