import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callAI, callAIStream, isAIConfigured, type AIMessage } from '../_lib/ai-service';
import { sanitizePublicContext, serializePromptContext } from './_lib/nexus-context-firewall.mjs';

type PublicPlan = {
  name: string;
  price: number;
  priceAnnual?: number;
};

// Keep API-side pricing in CJS-compatible runtime code to avoid ESM/CJS boundary issues.
const PLANS: PublicPlan[] = [
  { name: 'Free', price: 0 },
  { name: 'Starter', price: 19, priceAnnual: 15 },
  { name: 'Professional', price: 49, priceAnnual: 39 },
  { name: 'Enterprise', price: 99, priceAnnual: 79 },
];

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

const PRICING_INTENT_RE =
  /\b(price|pricing|plan|plans|cost|how much|monthly|annual|annually|billing|subscription|starter|professional|enterprise|free|pro|team)\b/i;

function buildPricingKnowledge(): string {
  const free = PLANS.find((p) => p.name.toLowerCase() === 'free');
  const starter = PLANS.find((p) => p.name.toLowerCase() === 'starter');
  const professional = PLANS.find((p) => p.name.toLowerCase() === 'professional');
  const enterprise = PLANS.find((p) => p.name.toLowerCase() === 'enterprise');

  return `PRICING (single source of truth from the live pricing config):
Free is ${free?.price ?? 0} dollars.
Starter is ${starter?.price ?? 19} dollars per month, or ${starter?.priceAnnual ?? 15} dollars per month billed annually.
Professional is ${professional?.price ?? 49} dollars per month, or ${professional?.priceAnnual ?? 39} dollars per month billed annually.
Enterprise is ${enterprise?.price ?? 99} dollars per month, or ${enterprise?.priceAnnual ?? 79} dollars per month billed annually.
All paid plans include a fourteen day free trial, no credit card needed.`;
}

function buildPricingReply(userText: string): string {
  const q = userText.toLowerCase();
  if (/\bstarter\b/.test(q)) {
    const starter = PLANS.find((p) => p.name.toLowerCase() === 'starter');
    return `Starter is ${starter?.price ?? 19} dollars per month, or ${starter?.priceAnnual ?? 15} dollars per month billed annually. All paid plans include a fourteen day free trial with no credit card needed.`;
  }
  if (/\bprofessional\b|\bpro\b/.test(q)) {
    const professional = PLANS.find((p) => p.name.toLowerCase() === 'professional');
    return `Professional is ${professional?.price ?? 49} dollars per month, or ${professional?.priceAnnual ?? 39} dollars per month billed annually. All paid plans include a fourteen day free trial with no credit card needed.`;
  }
  if (/\benterprise\b/.test(q)) {
    const enterprise = PLANS.find((p) => p.name.toLowerCase() === 'enterprise');
    return `Enterprise is ${enterprise?.price ?? 99} dollars per month, or ${enterprise?.priceAnnual ?? 79} dollars per month billed annually. All paid plans include a fourteen day free trial with no credit card needed.`;
  }
  if (/\bteam\b/.test(q)) {
    const enterprise = PLANS.find((p) => p.name.toLowerCase() === 'enterprise');
    return `We no longer list a separate Team tier. The current top tier is Enterprise at ${enterprise?.price ?? 99} dollars per month, or ${enterprise?.priceAnnual ?? 79} dollars per month billed annually.`;
  }

  const free = PLANS.find((p) => p.name.toLowerCase() === 'free');
  const starter = PLANS.find((p) => p.name.toLowerCase() === 'starter');
  const professional = PLANS.find((p) => p.name.toLowerCase() === 'professional');
  const enterprise = PLANS.find((p) => p.name.toLowerCase() === 'enterprise');
  return `Current pricing is: Free is ${free?.price ?? 0} dollars. Starter is ${starter?.price ?? 19} dollars per month, or ${starter?.priceAnnual ?? 15} dollars per month billed annually. Professional is ${professional?.price ?? 49} dollars per month, or ${professional?.priceAnnual ?? 39} dollars per month billed annually. Enterprise is ${enterprise?.price ?? 99} dollars per month, or ${enterprise?.priceAnnual ?? 79} dollars per month billed annually. All paid plans include a fourteen day free trial with no credit card needed.`;
}

function buildNexusSystemPrompt(publicContextBlock: string): string {
  return `You are Nexus, SyncScript's AI assistant on a live voice call. Every word you write is read aloud through text-to-speech, so you must write exactly the way a human speaks.

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
- Mix short and longer sentences for natural rhythm.
- Double check your grammar before finishing. Every sentence must read perfectly if spoken aloud.
- Never use filler tag questions like "isn't that cool?" or "you know?".
- Use the exact pricing language provided below. Do not improvise prices or units.

YOUR PERSONALITY:
Warm, confident, and genuinely enthusiastic about SyncScript. You're like the best customer service rep who truly loves their product. Be empathetic when someone mentions stress or burnout. Never pushy or salesy.

ABOUT SYNCSCRIPT:
SyncScript is AI-powered productivity that works with your natural energy rhythms. It learns when you're at your best and schedules your hardest work during peak hours automatically.

KEY FEATURES: Energy-based AI scheduling, voice-first AI assistant, smart task management, calendar intelligence with conflict detection, team collaboration, gamification with XP and streaks, Google Calendar and Slack integrations.

${buildPricingKnowledge()}

HOW IT WORKS: Sign up in about sixty seconds, connect your calendar, and within two to three days the AI learns your patterns and starts optimizing your schedule automatically.

STRICT RULES:
- Only discuss SyncScript, productivity, or how the product helps them
- Never pretend to access user data, tasks, or accounts
- Never share technical details or API information
- For issues or bugs, direct them to support at syncscript dot app
- Competitors: briefly acknowledge, then focus on what makes SyncScript unique

CONTEXT BOUNDARY:
- You are the public landing-page Nexus.
- You only have access to marketing/product context.
- If asked for personal account data, say you cannot access account-specific information on this page.

PUBLIC CONTEXT:
${publicContextBlock || 'No additional public context provided.'}`;
}

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
  const { messages, sessionId, context } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const publicContextResult = sanitizePublicContext(context);
  if (!publicContextResult.valid) {
    return res.status(400).json({ error: publicContextResult.reason || 'Invalid public context payload' });
  }

  const publicContext = {
    surface: 'landing',
    page: 'landing',
    pricing: PLANS.map((plan) => ({
      name: plan.name,
      monthly: plan.price,
      annual: plan.priceAnnual ?? null,
      trialDays: 14,
    })),
    ...publicContextResult.context,
  };

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

  const wantStream = req.body?.stream === true;
  const latestUserMessage =
    [...trimmedMessages].reverse().find((m: any) => m.role === 'user')?.content || '';

  if (typeof latestUserMessage === 'string' && PRICING_INTENT_RE.test(latestUserMessage)) {
    const content = buildPricingReply(latestUserMessage);
    if (wantStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
      res.write(`data: ${JSON.stringify({ finalContent: content })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }
    return res.status(200).json({ content });
  }

  const chatMessages: AIMessage[] = [
    { role: 'system', content: buildNexusSystemPrompt(serializePromptContext(publicContext)) },
    ...trimmedMessages,
  ];

  if (wantStream) {
    try {
      const { stream } = await callAIStream(chatMessages, {
        maxTokens: 150,
        temperature: 0.3,
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = (stream as any).getReader
        ? (stream as any).getReader()
        : null;

      if (!reader) {
        const fallback = await callAI(chatMessages, { maxTokens: 150, temperature: 0.3 });
        res.write(`data: ${JSON.stringify({ content: fallback.content })}\n\n`);
        res.write(`data: ${JSON.stringify({ finalContent: fallback.content })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      const decoder = new TextDecoder();
      let carry = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          carry += decoder.decode();
        } else {
          carry += decoder.decode(value, { stream: true });
        }

        const lines = carry.split('\n');
        carry = done ? '' : (lines.pop() ?? '');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const payload = trimmed.slice(6);
          if (payload === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(payload);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              fullContent += token;
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
              if (typeof (res as any).flush === 'function') (res as any).flush();
            }
          } catch {
            /* skip malformed lines */
          }
        }

        if (done) break;
      }

      if (!res.writableEnded) {
        if (fullContent.trim()) {
          res.write(`data: ${JSON.stringify({ finalContent: fullContent })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (error: any) {
      console.error('Nexus streaming error, falling back:', error.message);
      try {
        const result = await callAI(chatMessages, { maxTokens: 150, temperature: 0.3 });
        res.setHeader('Content-Type', 'text/event-stream');
        res.write(`data: ${JSON.stringify({ content: result.content })}\n\n`);
        res.write(`data: ${JSON.stringify({ finalContent: result.content })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      } catch {
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
      }
    }
  } else {
    try {
      const result = await callAI(chatMessages, { maxTokens: 150, temperature: 0.3 });
      return res.status(200).json({ content: result.content });
    } catch (error: any) {
      console.error('Nexus guest handler error:', error);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }
}
