/**
 * EX-045: Canonical demo/mock gate for Supabase edge runtime.
 * Production is strict unless ENABLE_DEMO_WORKSPACE is explicitly true.
 */
export function shouldAllowDemoData(): boolean {
  const explicitFlag = String(Deno.env.get('ENABLE_DEMO_WORKSPACE') || '').toLowerCase() === 'true';
  const environment = String(Deno.env.get('ENVIRONMENT') || '').toLowerCase();
  const isProduction = environment === 'production';

  return !isProduction || explicitFlag;
}

export function isStrictProductionMode(): boolean {
  return !shouldAllowDemoData();
}
