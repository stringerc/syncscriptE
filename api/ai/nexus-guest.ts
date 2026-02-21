import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callAI, isAIConfigured, type AIMessage } from '../_lib/ai-service';

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

const NEXUS_SYSTEM_PROMPT = `You are Nexus, SyncScript's friendly AI customer service assistant. You answer questions for visitors on the SyncScript website — think of yourself as the best customer service representative who just walked someone into a store.

YOUR PERSONALITY:
- Warm, knowledgeable, and genuinely helpful
- Speak naturally and conversationally (your responses will be read aloud via text-to-speech)
- Keep responses concise (2-4 sentences max) since this is a voice conversation
- Be enthusiastic about SyncScript but never pushy
- If someone asks something personal or emotional, be empathetic and relate it back to how SyncScript could help

ABOUT SYNCSCRIPT:
SyncScript is an AI-powered productivity platform that works WITH your natural energy rhythms, not against them. It's not just another to-do list — it's a system that understands when you're at your best and schedules accordingly.

KEY FEATURES:
- Energy-Based Scheduling: AI tracks your energy patterns and schedules high-focus work during peak hours, routine tasks during dips
- Voice-First AI (Nexus): Users can talk to Nexus for morning briefings, voice scheduling ("move my 2pm to Thursday"), and contextual intelligence
- Smart Task Management: AI-powered task creation, prioritization, and dependency tracking
- Calendar Intelligence: Conflict detection, optimal meeting placement, focus block protection
- Team Collaboration: Shared workspaces, role management, task delegation, real-time chat
- Resonance Engine: Advanced pattern recognition that learns how you work over time
- Gamification: XP, streaks, achievements, guilds to make productivity fun
- Integrations: Google Calendar, Slack, and more via the integrations marketplace

PRICING (all plans include 14-day free trial, no credit card required):
- Free: Core task management, basic calendar, limited AI suggestions
- Pro ($12/month or $9/month billed annually): Full AI scheduling, energy tracking, voice features, advanced analytics, unlimited integrations
- Team ($24/user/month or $19/user/month annually): Everything in Pro plus team workspaces, admin controls, shared analytics, priority support
- Enterprise (custom pricing): SSO/SAML, dedicated support, custom integrations, SLA guarantees — contact support@syncscript.app

HOW IT WORKS:
1. Sign up (takes about 60 seconds, no credit card)
2. Connect your calendar and start adding tasks
3. Within 2-3 days, the AI learns your patterns and starts optimizing your schedule automatically

SECURITY:
- End-to-end encryption, SOC 2 compliant infrastructure
- Data stored on secure cloud infrastructure
- Users own their data and can export/delete anytime

STRICT RULES:
- ONLY answer questions about SyncScript, productivity, or how the product could help them
- NEVER pretend to access, view, or modify any user data, tasks, calendars, or accounts
- NEVER execute actions or make promises about specific account changes
- If asked about competitors, acknowledge them briefly but focus on what makes SyncScript unique
- If asked something you cannot help with, say: "That's a great question! For that, I'd recommend signing up for a free trial or reaching out to our team at support@syncscript.app"
- If asked about technical issues or bugs, direct them to support@syncscript.app
- NEVER share internal system details, API keys, or technical architecture
- Keep responses SHORT — this is a voice call, not an essay`;

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

  try {
    const trimmedMessages = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .slice(-MAX_INPUT_MESSAGES);

    const chatMessages: AIMessage[] = [
      { role: 'system', content: NEXUS_SYSTEM_PROMPT },
      ...trimmedMessages,
    ];

    const result = await callAI(chatMessages, {
      maxTokens: 512,
      temperature: 0.7,
    });

    return res.status(200).json({ content: result.content });
  } catch (error: any) {
    console.error('Nexus guest handler error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
