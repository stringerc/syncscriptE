/**
 * Folded into `api/phone/[endpoint].ts` as `phone/post-call-summary` to keep
 * the Hobby ≤12 function cap. Public path `/api/ai/nexus-post-call-summary`
 * stays valid via vercel.json rewrite.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthenticatedSupabaseUser, validateAuth } from '../_lib/auth';
import { callAI, isAIConfigured, type AIMessage } from '../_lib/ai-service';
import { recordNexusCallSummary } from '../_lib/nexus-audit';
import type { NexusToolTraceEntry } from '../_lib/nexus-tools';

export async function routePostCallSummary(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const isAuthed = await validateAuth(req, res);
  if (!isAuthed) return;

  const user = await getAuthenticatedSupabaseUser(req);
  if (!user) return res.status(401).json({ error: 'Session required' });
  if (!isAIConfigured()) return res.status(503).json({ error: 'AI not configured' });

  try {
    const body = (req.body || {}) as Record<string, unknown>;
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : undefined;
    const surface = body.surface === 'text' ? 'text' : 'voice';
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const toolTraces = Array.isArray(body.toolTraces) ? (body.toolTraces as NexusToolTraceEntry[]) : [];

    const condensed = (messages as Array<{ role?: string; content?: string }>)
      .slice(-24)
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content.slice(0, 2000) : '',
      }))
      .filter((m) => m.content.length > 0);

    const toolDigest = toolTraces.map((t) => ({ tool: t.tool, ok: t.ok, detail: t.detail }));

    const chatMessages: AIMessage[] = [
      {
        role: 'system',
        content:
          'Summarize this Nexus voice/text session in 2–4 short sentences for the user. Mention concrete actions taken (tasks, notes, calendar proposals) when present. No markdown.',
      },
      {
        role: 'user',
        content: JSON.stringify({ transcript: condensed, tools: toolDigest, surface }),
      },
    ];

    const result = await callAI(chatMessages, { maxTokens: 220, temperature: 0.35 });
    const summaryText = (result.content || '').trim() || 'Session ended.';

    await recordNexusCallSummary({
      userId: user.userId,
      sessionId,
      surface,
      summaryText,
      toolTrace: toolDigest,
      messageCount: condensed.length,
    });

    return res.status(200).json({ summary: summaryText, stored: true });
  } catch (e: unknown) {
    console.error('[phone.post-call-summary]', e);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
}
