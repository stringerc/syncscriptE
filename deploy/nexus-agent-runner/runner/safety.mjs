/**
 * Tier + per-action safety gate. Read-only by default (Tier A).
 * Tiers:
 *   A — read-only browsing (default)
 *   B — read + scoped writes (SyncScript tools, drafts)
 *   C — full writes; destructive web actions require user approval
 *   D — full autonomy on whitelisted sites only
 */

const DESTRUCTIVE_PHRASES = [
  'submit', 'pay', 'purchase', 'buy now', 'place order', 'check out',
  'delete', 'remove', 'unsubscribe', 'cancel subscription',
  'confirm', 'send money', 'transfer', 'withdraw',
  'sign up', 'create account', 'register',
];

export function isDestructiveAction(actionDescription) {
  const lc = String(actionDescription || '').toLowerCase();
  return DESTRUCTIVE_PHRASES.some((p) => lc.includes(p));
}

export function siteIsBlocked(url, blockedSites) {
  const host = safeHost(url);
  // Empty host = about:blank / file:// / data:URLs / pre-navigation state.
  // These are not "sites" and the next action will be evaluated against its
  // own destination URL — don't treat them as blocked.
  if (!host) return false;
  return (blockedSites || []).some((b) => matchPattern(host, b));
}

export function siteIsTrusted(url, trustedSites) {
  const host = safeHost(url);
  if (!host) return false;
  return (trustedSites || []).some((t) => matchPattern(host, t));
}

function safeHost(url) {
  try { return new URL(url).host.toLowerCase(); } catch { return ''; }
}

function matchPattern(host, pattern) {
  const p = String(pattern).toLowerCase();
  if (p.startsWith('*.')) {
    const suffix = p.slice(2);
    return host === suffix || host.endsWith('.' + suffix);
  }
  return host === p;
}

/**
 * Returns one of:
 *   { decision: 'allow' }
 *   { decision: 'block', reason }
 *   { decision: 'request_approval', reason }
 */
export function gate({ tier, action, currentUrl, trustedSites, blockedSites }) {
  // Step 1: blocked-site check. For `goto`, evaluate the *destination* URL —
  // the agent's current page is irrelevant for navigation. For all other
  // actions (click/type/scroll/extract_text), evaluate the current URL.
  const checkUrl = action?.kind === 'goto' && action.url ? action.url : currentUrl;
  if (checkUrl && siteIsBlocked(checkUrl, blockedSites)) {
    return { decision: 'block', reason: `site_blocked:${safeHost(checkUrl) || checkUrl}` };
  }

  // Browser-only actions (goto/click/type/etc.) — apply tier gate.
  // Tool calls (SyncScript) bypass site gate; their own RLS protects user data.

  // Tier A: only read-like browser actions.
  if (tier === 'A') {
    const allowed = ['goto', 'screenshot', 'scroll', 'extract_text', 'wait', 'press'];
    if (!allowed.includes(action.kind)) {
      return { decision: 'block', reason: `tier_A_disallows:${action.kind}` };
    }
    return { decision: 'allow' };
  }

  // Tiers B/C/D: classify destructive
  const dangerSurface = `${action.kind} ${action.text || ''} ${action.label || ''}`;
  const destructive = action.kind === 'click' && (action.label || action.text)
    ? isDestructiveAction(`${action.label || ''} ${action.text || ''}`)
    : action.kind === 'type'
      ? isDestructiveAction(action.text || '')
      : false;

  if (destructive) {
    if (tier === 'D' && currentUrl && siteIsTrusted(currentUrl, trustedSites)) {
      return { decision: 'allow' };
    }
    if (tier === 'C') {
      return { decision: 'request_approval', reason: `destructive:${dangerSurface.slice(0, 80)}` };
    }
    return { decision: 'block', reason: `tier_${tier}_blocks_destructive` };
  }

  return { decision: 'allow' };
}
