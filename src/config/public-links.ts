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
