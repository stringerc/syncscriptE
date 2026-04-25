/**
 * Lightweight heuristic: does this user message LOOK LIKE an agent-mode goal
 * (ie. needs Nexus to drive a real browser) vs a normal Nexus tool call?
 *
 * False positives are okay — the agent runner can decide it's actually trivial
 * and finish in one step. False negatives mean a user said "go to google for
 * me" and we treated it as chat — that's the failure mode we want to avoid.
 *
 * Strict regex first (high confidence), then fuzzy keyword score (lower bar
 * but explicitly verb-driven). Keep this side-effect-free + pure so we can
 * unit-test it without spinning anything up.
 */

const STRICT_PATTERNS: RegExp[] = [
  /\b(go|navigate|browse)\s+to\s+(\w+\.\w+|\w+\s+\.\s+\w+|google|bing|youtube|amazon|reddit|twitter|x\.com|linkedin|github|stackoverflow|wikipedia)/i,
  /\bopen\s+(?:up\s+)?(?:a\s+)?(?:browser|new\s+tab|chrome|window)/i,
  /\b(?:search|look\s+up|find)\s+(?:on|in|via)\s+(google|bing|reddit|youtube|twitter|linkedin)/i,
  /\b(?:search|browse)\s+the\s+web\b/i,
  /\b(?:check|visit|pull\s+up)\s+(?:the\s+)?(?:website|site|url)\s+/i,
  /\bsurf\s+the\s+web\b/i,
  /\b(?:scrape|extract)\s+(?:from|the)\s+\w+/i,
  /\buse\s+a\s+browser\s+to\s+/i,
  /\bagent\s+mode\b/i,
];

const FUZZY_VERBS = [
  'navigate', 'browse', 'visit', 'open', 'pull up', 'check out',
  'find', 'search', 'look up', 'research', 'fetch', 'grab',
  'download', 'save', 'collect', 'gather', 'pin',
];

const FUZZY_TARGETS = [
  'google', 'bing', 'youtube', 'amazon', 'reddit', 'twitter', 'x.com',
  'linkedin', 'github', 'stackoverflow', 'wikipedia', 'instagram',
  'producthunt', 'hackernews', 'medium', 'substack',
  'website', 'site', 'web', 'page', 'url', 'browser',
];

const ADD_TO_LIBRARY_VERBS = [
  'add to my', 'save to', 'pin to', 'put in my', 'into my library', 'into my files',
];

export interface AgentIntentSignal {
  isAgentIntent: boolean;
  /** Higher = more confidence. Threshold is currently 2 (one verb + one target hits). */
  score: number;
  /** Specific phrase patterns that fired — useful for telemetry + tests. */
  matched: string[];
}

export function detectAgentIntent(rawText: string): AgentIntentSignal {
  const text = (rawText || '').toLowerCase().trim();
  const matched: string[] = [];

  if (!text || text.length < 6) {
    return { isAgentIntent: false, score: 0, matched };
  }

  // Strict regex — single match is enough
  for (const re of STRICT_PATTERNS) {
    if (re.test(text)) {
      matched.push(`strict:${re.source.slice(0, 40)}`);
      return { isAgentIntent: true, score: 5, matched };
    }
  }

  // Fuzzy: verb + target combo
  let score = 0;
  let verbHit = '';
  for (const v of FUZZY_VERBS) {
    if (text.includes(v)) { verbHit = v; score += 1; break; }
  }
  let targetHit = '';
  for (const t of FUZZY_TARGETS) {
    if (text.includes(t)) { targetHit = t; score += 1; break; }
  }
  if (verbHit) matched.push(`verb:${verbHit}`);
  if (targetHit) matched.push(`target:${targetHit}`);

  // "add to my library" doesn't itself imply agent — but combined with a search verb it does
  for (const phrase of ADD_TO_LIBRARY_VERBS) {
    if (text.includes(phrase)) { matched.push(`library:${phrase}`); score += verbHit ? 1 : 0; break; }
  }

  return { isAgentIntent: score >= 2, score, matched };
}

/**
 * Strip out an explicit `@agent` / `@browser` prefix when present so we can
 * route confidently regardless of heuristics.
 */
export function userExplicitlyRequestsAgent(rawText: string): boolean {
  const t = (rawText || '').trim();
  return /^\s*@(agent|browser|browse|nexus-agent)\b/i.test(t);
}
