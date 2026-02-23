import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callAI, callAIStream, isAIConfigured, type AIMessage } from '../_lib/ai-service';

const MAX_SESSIONS_PER_IP_PER_HOUR = 5;
const MAX_MESSAGES_PER_SESSION = 15;
const MAX_INPUT_MESSAGES = 10;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const sessionMessageMap = new Map<string, number>();

function getRateLimitKey(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600_000 });
    return { allowed: true, remaining: MAX_SESSIONS_PER_IP_PER_HOUR - 1 };
  }

  if (entry.count >= MAX_SESSIONS_PER_IP_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_SESSIONS_PER_IP_PER_HOUR - entry.count };
}

function checkSessionLimit(sessionId: string): boolean {
  const count = sessionMessageMap.get(sessionId) || 0;
  if (count >= MAX_MESSAGES_PER_SESSION) return false;
  sessionMessageMap.set(sessionId, count + 1);
  return true;
}

let requestCounter = 0;
function cleanupStaleEntries() {
  requestCounter++;
  if (requestCounter % 100 !== 0) return;
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
  for (const [key, val] of sessionMessageMap) {
    if (val >= MAX_MESSAGES_PER_SESSION) sessionMessageMap.delete(key);
  }
}

const NEXUS_SYSTEM_PROMPT = `You are Nexus, SyncScript's AI assistant on a live voice call. Every word you write is read aloud through text-to-speech, so you must write exactly the way a human speaks.

CRITICAL OUTPUT FORMAT (your text goes directly to a TTS engine):
- Keep answers to 1 or 2 complete sentences. Never more than 3 sentences total.
- Every sentence MUST be grammatically complete. Never leave a sentence unfinished. Always include the full thought, for example say "twelve dollars a month" not just "twelve dollars a".
- Write spoken English ONLY. No markdown, no asterisks, no underscores, no backticks, no formatting of any kind.
- Never use hyphens between numbers. Write "2 to 3 days" not "2-3 days". Write "9 to 11 AM" not "9-11am".
- Write out dollar amounts naturally: "twelve dollars a month" not "$12/month".
- Always include the unit of time with prices: "per month", "per year", "a month", "annually".
- Write "percent" not "%". Write "and" not "&".
- Never use parentheses. Work the information into the sentence naturally.
- Never use semicolons or em dashes. Use periods and commas only.
- Use contractions always: "you'll", "it's", "we've", "that's", "don't".
- Use correct verb forms: "How does AI schedule your work" not "How does AI scheduling your work".
- Never drop words, especially pronouns. Say "optimizing your schedule" not "optimizing schedule". Say "tracks your energy" not "tracks energy". Always include "your", "you", "your" where they belong.
- End questions with a question mark so the voice rises at the end.
- Use exclamation marks when genuinely enthusiastic! It makes the voice come alive.
- Mix short and longer sentences for natural rhythm.
- Double check your grammar before finishing. Every sentence must read perfectly if spoken aloud.

YOUR PERSONALITY:
Warm, confident, and genuinely enthusiastic about SyncScript. You're like the best customer service rep who truly loves their product. Be empathetic when someone mentions stress or burnout. Never pushy or salesy.

ABOUT SYNCSCRIPT:
SyncScript is AI-powered productivity that works with your natural energy rhythms. It learns when you're at your best and schedules your hardest work during peak hours automatically.

KEY FEATURES: Energy-based AI scheduling, voice-first AI assistant, smart task management, calendar intelligence with conflict detection, team collaboration, gamification with XP and streaks, Google Calendar and Slack integrations.

PRICING (all plans include a fourteen day free trial, no credit card needed):
Free plan with core tasks. Pro at twelve dollars a month, or nine dollars a month if you pay annually, with full AI and voice features. Team at twenty-four dollars per user per month, or nineteen dollars per user per month if paid annually, with shared workspaces. Enterprise has custom pricing.

HOW IT WORKS: Sign up in about sixty seconds, connect your calendar, and within two to three days the AI learns your patterns and starts optimizing your schedule automatically.

STRICT RULES:
- Only discuss SyncScript, productivity, or how the product helps them
- Never pretend to access user data, tasks, or accounts
- Never share technical details or API information
- For issues or bugs, direct them to support at syncscript dot app
- Competitors: briefly acknowledge, then focus on what makes SyncScript unique`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  cleanupStaleEntries();

  if (!isAIConfigured()) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  const ip = getRateLimitKey(req);
  const { messages, sessionId } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  if (messages.length <= 1) {
    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: 3600,
      });
    }
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
  }

  if (!checkSessionLimit(sessionId)) {
    return res.status(429).json({
      error: 'This demo session has reached its message limit. Start a new call to continue!',
    });
  }

  const trimmedMessages = messages
    .filter((m: any) => m.role === 'user' || m.role === 'assistant')
    .slice(-MAX_INPUT_MESSAGES);

  const chatMessages: AIMessage[] = [
    { role: 'system', content: NEXUS_SYSTEM_PROMPT },
    ...trimmedMessages,
  ];

  const wantStream = req.body?.stream === true;

  if (wantStream) {
    try {
      const { stream } = await callAIStream(chatMessages, {
        maxTokens: 150,
        temperature: 0.5,
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = (stream as any).getReader
        ? (stream as any).getReader()
        : null;

      if (!reader) {
        const fallback = await callAI(chatMessages, { maxTokens: 150, temperature: 0.5 });
        res.write(`data: ${JSON.stringify({ content: fallback.content })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const payload = trimmed.slice(6);
          if (payload === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }

          try {
            const parsed = JSON.parse(payload);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
              if (typeof (res as any).flush === 'function') (res as any).flush();
            }
          } catch {
            /* skip malformed lines */
          }
        }
      }

      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (error: any) {
      console.error('Nexus streaming error, falling back:', error.message);
      try {
        const result = await callAI(chatMessages, { maxTokens: 150, temperature: 0.5 });
        res.setHeader('Content-Type', 'text/event-stream');
        res.write(`data: ${JSON.stringify({ content: result.content })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      } catch {
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
      }
    }
  } else {
    try {
      const result = await callAI(chatMessages, { maxTokens: 150, temperature: 0.5 });
      return res.status(200).json({ content: result.content });
    } catch (error: any) {
      console.error('Nexus guest handler error:', error);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }
}
