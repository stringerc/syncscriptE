/**
 * Client-side mirror of api/_lib/nexus-agent-intent.ts so the AppAIPage chat
 * mutation can decide *before* the round-trip whether to invoke /api/agent/start
 * (kicks off the runner) instead of /api/ai/nexus-user (regular chat).
 *
 * Keeping the patterns identical client + server lets us behave consistently
 * regardless of route.
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

export interface AgentIntentSignal {
  isAgentIntent: boolean;
  score: number;
  matched: string[];
}

export function detectAgentIntent(rawText: string): AgentIntentSignal {
  const text = (rawText || '').toLowerCase().trim();
  const matched: string[] = [];
  if (!text || text.length < 6) return { isAgentIntent: false, score: 0, matched };

  for (const re of STRICT_PATTERNS) {
    if (re.test(text)) {
      matched.push(`strict:${re.source.slice(0, 40)}`);
      return { isAgentIntent: true, score: 5, matched };
    }
  }

  let score = 0;
  let verbHit = '';
  for (const v of FUZZY_VERBS) { if (text.includes(v)) { verbHit = v; score += 1; break; } }
  let targetHit = '';
  for (const t of FUZZY_TARGETS) { if (text.includes(t)) { targetHit = t; score += 1; break; } }
  if (verbHit) matched.push(`verb:${verbHit}`);
  if (targetHit) matched.push(`target:${targetHit}`);

  return { isAgentIntent: score >= 2, score, matched };
}

export function userExplicitlyRequestsAgent(rawText: string): boolean {
  return /^\s*@(agent|browser|browse|nexus-agent)\b/i.test((rawText || '').trim());
}

/** Strip any leading `@agent` token before passing the goal to the agent runner. */
export function stripAgentPrefix(rawText: string): string {
  return (rawText || '').replace(/^\s*@(agent|browser|browse|nexus-agent)\s*:?\s*/i, '').trim();
}
