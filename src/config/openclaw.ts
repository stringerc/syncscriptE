/**
 * OpenClaw Configuration
 * 
 * OpenClaw is a self-hosted AI assistant gateway that connects SyncScript
 * to powerful AI models (Claude, OpenAI, etc.) with skills, memory, and
 * tool use capabilities.
 * 
 * The gateway exposes an OpenAI-compatible Chat Completions HTTP API:
 *   POST /v1/chat/completions
 * 
 * Configuration priority:
 * 1. User settings (localStorage) — set via Settings page
 * 2. Environment variables (VITE_OPENCLAW_*)
 * 3. Defaults (localhost:18789)
 */

const STORAGE_KEY = 'syncscript_openclaw_config';

export interface OpenClawConfig {
  /** Gateway URL, e.g. "http://172.31.13.246:18789" or "https://my-openclaw.example.com" */
  gatewayUrl: string;
  /** Bearer token for gateway authentication */
  token: string;
  /** Agent ID to route requests to (default: "main") */
  agentId: string;
  /** Whether OpenClaw integration is enabled */
  enabled: boolean;
  /** Whether to use streaming (SSE) for responses */
  streaming: boolean;
  /** Session user key for persistent sessions (derived from user ID) */
  sessionUser?: string;
}

const DEFAULT_CONFIG: OpenClawConfig = {
  gatewayUrl: import.meta.env.VITE_OPENCLAW_GATEWAY_URL || 'http://localhost:18789',
  token: import.meta.env.VITE_OPENCLAW_TOKEN || '',
  agentId: import.meta.env.VITE_OPENCLAW_AGENT_ID || 'main',
  enabled: true,
  streaming: true,
};

/**
 * Load OpenClaw configuration from localStorage, falling back to env/defaults
 */
export function loadOpenClawConfig(): OpenClawConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('[OpenClaw] Failed to load config from localStorage:', e);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Save OpenClaw configuration to localStorage
 */
export function saveOpenClawConfig(config: Partial<OpenClawConfig>): OpenClawConfig {
  const current = loadOpenClawConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[OpenClaw] Failed to save config to localStorage:', e);
  }
  return updated;
}

/**
 * Clear stored OpenClaw configuration (revert to defaults)
 */
export function clearOpenClawConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}

/**
 * Validate that an OpenClaw configuration has the minimum required fields
 */
export function isConfigValid(config: OpenClawConfig): boolean {
  return !!(config.gatewayUrl && config.gatewayUrl.startsWith('http'));
}
