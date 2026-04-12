/**
 * Canonical public URLs for in-app links (settings, help, integrations).
 * Keep these centralized so marketing and app stay aligned.
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

/** macOS/Windows custom URL scheme handled by Nature Companion (Electron). Requires the desktop app installed. */
export const SYNCSCRIPT_COMPANION_PROTOCOL_FOCUS = 'syncscript-companion://focus';

/** Opens SyncScript in the system browser at this path (via Companion when installed; same base URL as the web app). */
export const SYNCSCRIPT_COMPANION_PROTOCOL_OPEN_WEB_SETTINGS =
  'syncscript-companion://openweb?path=%2Fsettings%3Ftab%3Dintegrations';

/** Published macOS arm64 POC release (ZIP when attached). */
export const SYNCSCRIPT_NATURE_COMPANION_RELEASE_POC =
  `${SYNCSCRIPT_GITHUB_REPO}/releases/tag/v0.1.0-nature-companion-mac-arm64`;
