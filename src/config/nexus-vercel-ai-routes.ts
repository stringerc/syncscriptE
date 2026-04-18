/**
 * Same-origin Vercel `api/*` routes for Nexus (App AI + voice).
 * Always use these instead of hard-coding `https://www.syncscript.app/...` so
 * local dev (`vite`), preview, and staging hit the same handlers as production.
 */
export const NEXUS_USER_CHAT_PATH = '/api/ai/nexus-user' as const;
export const NEXUS_GUEST_CHAT_PATH = '/api/ai/nexus-guest' as const;
export const NEXUS_POST_CALL_SUMMARY_PATH = '/api/ai/nexus-post-call-summary' as const;
