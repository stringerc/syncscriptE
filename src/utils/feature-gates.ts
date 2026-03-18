const GAMING_PRIMARY_NAV_KEY = 'syncscript:feature:gaming-primary-nav';
const WORKSTREAM_FLOW_CANVAS_KEY = 'syncscript:feature:workstream-flow-canvas';

export function isGamingPrimaryNavEnabled(): boolean {
  const envEnabled = String(import.meta.env.VITE_ENABLE_GAMING_PRIMARY_NAV || '').toLowerCase() === 'true';
  if (envEnabled) return true;
  try {
    return localStorage.getItem(GAMING_PRIMARY_NAV_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setGamingPrimaryNavEnabled(enabled: boolean) {
  try {
    localStorage.setItem(GAMING_PRIMARY_NAV_KEY, enabled ? 'true' : 'false');
  } catch {
    // non-blocking
  }
}

export function isWorkstreamFlowCanvasEnabled(): boolean {
  const envEnabled = String(import.meta.env.VITE_ENABLE_WORKSTREAM_FLOW_CANVAS || '').toLowerCase();
  if (envEnabled === 'false') return false;
  // Default to enabled everywhere unless env explicitly disables it.
  // Ignore persisted local overrides to avoid stale clients getting stuck
  // on the legacy tree workstream after rollout.
  return true;
}

export function setWorkstreamFlowCanvasEnabled(enabled: boolean) {
  try {
    localStorage.setItem(WORKSTREAM_FLOW_CANVAS_KEY, enabled ? 'true' : 'false');
  } catch {
    // non-blocking
  }
}
