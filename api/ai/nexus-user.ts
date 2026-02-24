import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth } from '../_lib/auth';
import { callAI, isAIConfigured, type AIMessage } from '../_lib/ai-service';
import { sanitizePrivateContext, serializePromptContext } from './_lib/nexus-context-firewall.mjs';

const MAX_INPUT_MESSAGES = 12;

function buildPrivateSystemPrompt(privateContextBlock: string): string {
  return `You are Nexus, SyncScript's authenticated in-app AI assistant.

ROLE:
- You can help with tasks, scheduling, productivity planning, and resonance-aware recommendations.
- Base your recommendations on the provided private user context when available.

BOUNDARY:
- This is the private signed-in Nexus surface.
- Never claim access to data that is not present in PRIVATE CONTEXT.
- If data is missing, ask a concise follow-up question.

RESPONSE STYLE:
- Be concise, practical, and action-oriented.
- Prefer clear numbered plans when giving recommendations.
- Keep responses grounded in the provided context and avoid speculation.

PRIVATE CONTEXT:
${privateContextBlock || 'No private context provided.'}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const isAuthed = await validateAuth(req, res);
  if (!isAuthed) return;

  if (!isAIConfigured()) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const { message, messages, privateContext } = req.body || {};

    const privateContextResult = sanitizePrivateContext(privateContext);
    if (!privateContextResult.valid) {
      return res.status(400).json({ error: privateContextResult.reason || 'Invalid private context payload' });
    }

    const trimmedMessages = Array.isArray(messages)
      ? messages
          .filter((m: any) => m.role === 'user' || m.role === 'assistant')
          .slice(-MAX_INPUT_MESSAGES)
      : [];

    const chatMessages: AIMessage[] = [
      {
        role: 'system',
        content: buildPrivateSystemPrompt(serializePromptContext(privateContextResult.context)),
      },
    ];

    if (trimmedMessages.length > 0) {
      chatMessages.push(
        ...trimmedMessages.map((m: any) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : '',
        })),
      );
    } else if (typeof message === 'string' && message.trim()) {
      chatMessages.push({ role: 'user', content: message.trim() });
    } else {
      return res.status(400).json({ error: 'No message provided' });
    }

    const result = await callAI(chatMessages, {
      maxTokens: 500,
      temperature: 0.4,
    });

    return res.status(200).json({
      content: result.content,
      source: 'nexus-user',
    });
  } catch (error: any) {
    console.error('Nexus user handler error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
