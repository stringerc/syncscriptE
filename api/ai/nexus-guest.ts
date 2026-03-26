import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callAI, callAIStream, isAIConfigured, type AIMessage } from '../_lib/ai-service';
import { sanitizePublicContext, serializePromptContext } from './_lib/nexus-context-firewall';
import { loadNexusBrain } from './_lib/nexus-brain/load-brain';
import { buildPricingKnowledge, buildPricingReply, PRICING_INTENT_RE } from './_lib/nexus-brain/pricing';
import { emitNexusTrace, newNexusRequestId, hashSessionKey } from './_lib/nexus-brain/telemetry';

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

function buildNexusSystemPrompt(publicContextBlock: string): string {
  const brain = loadNexusBrain();
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

CANONICAL PRODUCT FACTS (from nexus-brain; do not contradict):
${brain.productFactsText}

ABOUT SYNCSCRIPT (align with facts above):
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
  if (req.method === 'GET') {
    try {
      const b = loadNexusBrain();
      return res.status(200).json({
        ok: true,
        brainVersion: b.manifest.version,
        aiConfigured: isAIConfigured(),
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[nexus-guest] GET health failed:', msg);
      return res.status(500).json({ ok: false, error: msg });
    }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const requestId = newNexusRequestId();
  const t0 = Date.now();
  const brain = loadNexusBrain();
  res.setHeader('X-Nexus-Brain-Version', brain.manifest.version);
  res.setHeader('X-Nexus-Request-Id', requestId);

  cleanupStaleEntries();

  if (!isAIConfigured()) {
    emitNexusTrace({
      surface: 'guest',
      requestId,
      outcome: 'ai_unconfigured',
      pathway: 'llm',
      brainVersion: brain.manifest.version,
      latencyMs: Date.now() - t0,
      httpStatus: 500,
      errorCode: 'ai_unconfigured',
    });
    return res.status(500).json({ error: 'AI service not configured' });
  }

  const ip = getRateLimitKey(req);
  const { messages, sessionId, context } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    emitNexusTrace({
      surface: 'guest',
      requestId,
      outcome: 'validation_error',
      pathway: 'llm',
      brainVersion: brain.manifest.version,
      latencyMs: Date.now() - t0,
      httpStatus: 400,
      errorCode: 'missing_session',
    });
    return res.status(400).json({ error: 'sessionId is required' });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    emitNexusTrace({
      surface: 'guest',
      requestId,
      outcome: 'validation_error',
      pathway: 'llm',
      brainVersion: brain.manifest.version,
      latencyMs: Date.now() - t0,
      sessionKey: hashSessionKey(sessionId),
      httpStatus: 400,
      errorCode: 'missing_messages',
    });
    return res.status(400).json({ error: 'messages array is required' });
  }

  const publicContextResult = sanitizePublicContext(context);
  if (!publicContextResult.valid) {
    emitNexusTrace({
      surface: 'guest',
      requestId,
      outcome: 'validation_error',
      pathway: 'llm',
      brainVersion: brain.manifest.version,
      latencyMs: Date.now() - t0,
      sessionKey: hashSessionKey(sessionId),
      httpStatus: 400,
      errorCode: 'invalid_public_context',
    });
    return res.status(400).json({ error: publicContextResult.reason || 'Invalid public context payload' });
  }

  const publicContext = {
    surface: 'landing',
    page: 'landing',
    pricing: brain.publicPlans.map((plan) => ({
      name: plan.name,
      monthly: plan.price,
      annual: plan.priceAnnual ?? null,
      trialDays: brain.trialDays,
    })),
    ...publicContextResult.context,
  };

  if (messages.length <= 1) {
    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      emitNexusTrace({
        surface: 'guest',
        requestId,
        outcome: 'rate_limited',
        pathway: 'llm',
        brainVersion: brain.manifest.version,
        latencyMs: Date.now() - t0,
        sessionKey: hashSessionKey(sessionId),
        httpStatus: 429,
        errorCode: 'ip_rate_limit',
      });
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: 3600,
      });
    }
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
  }

  if (!checkSessionLimit(sessionId)) {
    emitNexusTrace({
      surface: 'guest',
      requestId,
      outcome: 'rate_limited',
      pathway: 'llm',
      brainVersion: brain.manifest.version,
      latencyMs: Date.now() - t0,
      sessionKey: hashSessionKey(sessionId),
      httpStatus: 429,
      errorCode: 'session_message_limit',
    });
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
      emitNexusTrace({
        surface: 'guest',
        requestId,
        outcome: 'ok',
        pathway: 'deterministic_pricing',
        brainVersion: brain.manifest.version,
        latencyMs: Date.now() - t0,
        sessionKey: hashSessionKey(sessionId),
        httpStatus: 200,
        responseChars: content.length,
      });
      return res.end();
    }
    emitNexusTrace({
      surface: 'guest',
      requestId,
      outcome: 'ok',
      pathway: 'deterministic_pricing',
      brainVersion: brain.manifest.version,
      latencyMs: Date.now() - t0,
      sessionKey: hashSessionKey(sessionId),
      httpStatus: 200,
      responseChars: content.length,
    });
    return res.status(200).json({ content });
  }

  const chatMessages: AIMessage[] = [
    { role: 'system', content: buildNexusSystemPrompt(serializePromptContext(publicContext)) },
    ...trimmedMessages,
  ];

  if (wantStream) {
    try {
      const { stream, provider, model } = await callAIStream(chatMessages, {
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
        emitNexusTrace({
          surface: 'guest',
          requestId,
          outcome: 'ok',
          pathway: 'stream_fallback',
          brainVersion: brain.manifest.version,
          latencyMs: Date.now() - t0,
          sessionKey: hashSessionKey(sessionId),
          provider: fallback.provider,
          model: fallback.model,
          httpStatus: 200,
          responseChars: fallback.content.length,
        });
        return res.end();
      }

      const decoder = new TextDecoder();
      let carry = '';
      let fullContent = '';
      let emittedStreamToken = false;

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
              emittedStreamToken = true;
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
        // Client already builds audio from token deltas; finalContent duplicates every sentence in TTS.
        if (fullContent.trim() && !emittedStreamToken) {
          res.write(`data: ${JSON.stringify({ finalContent: fullContent })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
      }
      emitNexusTrace({
        surface: 'guest',
        requestId,
        outcome: 'ok',
        pathway: 'stream',
        brainVersion: brain.manifest.version,
        latencyMs: Date.now() - t0,
        sessionKey: hashSessionKey(sessionId),
        provider,
        model,
        httpStatus: 200,
        responseChars: fullContent.length,
      });
    } catch (error: any) {
      console.error('Nexus streaming error, falling back:', error.message);
      try {
        const result = await callAI(chatMessages, { maxTokens: 150, temperature: 0.3 });
        res.setHeader('Content-Type', 'text/event-stream');
        res.write(`data: ${JSON.stringify({ content: result.content })}\n\n`);
        res.write(`data: ${JSON.stringify({ finalContent: result.content })}\n\n`);
        res.write('data: [DONE]\n\n');
        emitNexusTrace({
          surface: 'guest',
          requestId,
          outcome: 'ok',
          pathway: 'stream_fallback',
          brainVersion: brain.manifest.version,
          latencyMs: Date.now() - t0,
          sessionKey: hashSessionKey(sessionId),
          provider: result.provider,
          model: result.model,
          httpStatus: 200,
          responseChars: result.content.length,
        });
        return res.end();
      } catch {
        emitNexusTrace({
          surface: 'guest',
          requestId,
          outcome: 'error',
          pathway: 'stream',
          brainVersion: brain.manifest.version,
          latencyMs: Date.now() - t0,
          sessionKey: hashSessionKey(sessionId),
          httpStatus: 500,
          errorCode: 'stream_and_fallback_failed',
        });
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
      }
    }
  } else {
    try {
      const result = await callAI(chatMessages, { maxTokens: 150, temperature: 0.3 });
      emitNexusTrace({
        surface: 'guest',
        requestId,
        outcome: 'ok',
        pathway: 'llm',
        brainVersion: brain.manifest.version,
        latencyMs: Date.now() - t0,
        sessionKey: hashSessionKey(sessionId),
        provider: result.provider,
        model: result.model,
        httpStatus: 200,
        responseChars: result.content.length,
      });
      return res.status(200).json({ content: result.content });
    } catch (error: any) {
      console.error('Nexus guest handler error:', error);
      emitNexusTrace({
        surface: 'guest',
        requestId,
        outcome: 'error',
        pathway: 'llm',
        brainVersion: brain.manifest.version,
        latencyMs: Date.now() - t0,
        sessionKey: hashSessionKey(sessionId),
        httpStatus: 500,
        errorCode: 'llm_failed',
      });
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }
}
