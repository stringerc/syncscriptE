/**
 * Canonical public URLs for in-app links (settings, help, integrations).
 * Keep these centralized so marketing and app stay aligned.
 *
 * Nature Companion protocol registry: every supported `syncscript-companion://` action
 * should be documented here with builders. Handler: desktop-shell `processCompanionProtocolUrl`.
 */
export const SYNCSCRIPT_WEB_APP = 'https://www.syncscript.app';

/** Default OSS remote for this codebase (see git remote `origin`). */
export const SYNCSCRIPT_GITHUB_REPO = 'https://github.com/stringerc/quicksync';

/** Browse integrations playbooks and research from the repo. */
export const SYNCSCRIPT_INTEGRATIONS_TREE = `${SYNCSCRIPT_GITHUB_REPO}/tree/main/integrations`;

/** GitHub Releases (DMG / packaged desktop builds when published). */
export const SYNCSCRIPT_GITHUB_RELEASES = `${SYNCSCRIPT_GITHUB_REPO}/releases`;

/** Desktop presence shell (Electron): build instructions and runtime layout. */
export const SYNCSCRIPT_DESKTOP_COMPANION_TREE = `${SYNCSCRIPT_GITHUB_REPO}/tree/main/nature-cortana-platform`;

/** Policy matrix for companion protocol (allowlist, trust, audit). */
export const SYNCSCRIPT_COMPANION_PROTOCOL_POLICY_DOC =
  'https://github.com/stringerc/quicksync/blob/main/integrations/research/studies/2026-04-11-companion-protocol-policy.md';

// --- syncscript-companion:// scheme (Nature Companion must be installed) ---

const COMPANION = 'syncscript-companion:';

/** macOS/Windows custom URL scheme handled by Nature Companion (Electron). */
export const SYNCSCRIPT_COMPANION_PROTOCOL_FOCUS = `${COMPANION}//focus`;

/** Opens SyncScript in the system browser at this path (via Companion when installed; same base URL as the web app). */
export const SYNCSCRIPT_COMPANION_PROTOCOL_OPEN_WEB_SETTINGS =
  `${COMPANION}//openweb?path=%2Fsettings%3Ftab%3Dintegrations`;

/** Hide overlay window. */
export const SYNCSCRIPT_COMPANION_PROTOCOL_HIDE = `${COMPANION}//hide`;

/** Show overlay window. */
export const SYNCSCRIPT_COMPANION_PROTOCOL_SHOW = `${COMPANION}//show`;

/** Quit Nature Companion completely. */
export const SYNCSCRIPT_COMPANION_PROTOCOL_QUIT = `${COMPANION}//quit`;

/**
 * Build `syncscript-companion://openweb?path=...` — opens default system browser to SyncScript base URL + path.
 * Path must be relative (e.g. `/library`), encoded. Do not pass absolute URLs.
 */
export function buildCompanionOpenWebPath(path: string): string {
  const rel = path.startsWith('/') ? path : `/${path}`;
  return `${COMPANION}//openweb?path=${encodeURIComponent(rel)}`;
}

/**
 * Build `syncscript-companion://openchrome?path=...` — opens URL in Google Chrome (Companion main process).
 * Same path validation as openweb; requires installed Chrome (or override via Companion env).
 */
export function buildCompanionOpenChromePath(path: string): string {
  const rel = path.startsWith('/') ? path : `/${path}`;
  return `${COMPANION}//openchrome?path=${encodeURIComponent(rel)}`;
}

/**
 * Build `syncscript-companion://openagents?...` — agents/dashboard deep link (trust + audit in Companion).
 */
export function buildCompanionOpenAgents(params: {
  tab?: string;
  workspace?: string;
  agent?: string;
  surface?: string;
  contextType?: string;
}): string {
  const q = new URLSearchParams();
  if (params.tab) q.set('tab', params.tab);
  if (params.workspace) q.set('workspace', params.workspace);
  if (params.agent) q.set('agent', params.agent);
  if (params.surface) q.set('surface', params.surface);
  if (params.contextType) q.set('contextType', params.contextType);
  const qs = q.toString();
  return qs ? `${COMPANION}//openagents?${qs}` : `${COMPANION}//openagents`;
}

/** Published macOS arm64 POC release (ZIP when attached). */
export const SYNCSCRIPT_NATURE_COMPANION_RELEASE_POC =
  `${SYNCSCRIPT_GITHUB_REPO}/releases/tag/v0.1.0-nature-companion-mac-arm64`;
