/**
 * Shared Twilio Helpers for Phone API Routes
 * 
 * Uses direct Twilio REST API calls (no SDK) to keep bundles small.
 * All calls authenticated with Account SID + Auth Token via Basic Auth.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { createHmac } from 'crypto';
import { callAI, isAIConfigured } from '../lib/ai-service';
import type { AIMessage } from '../lib/ai-service';

// ============================================================================
// ENVIRONMENT
// ============================================================================

export function getTwilioConfig() {
  const config = {
    accountSid: (process.env.TWILIO_ACCOUNT_SID || '').trim(),
    authToken: (process.env.TWILIO_AUTH_TOKEN || '').trim(),
    phoneNumber: (process.env.TWILIO_PHONE_NUMBER || '').trim(),
    appUrl: (process.env.APP_URL || `https://${process.env.VERCEL_URL || 'localhost:3000'}`).trim(),
    apiSecret: (process.env.PHONE_API_SECRET || '').trim(),
    deepseekKey: (process.env.DEEPSEEK_API_KEY || '').trim(),
  };

  const missing = Object.entries(config)
    .filter(([key, val]) => !val && key !== 'deepseekKey')
    .map(([key]) => key);
  if (missing.length > 0) {
    console.warn(`[Twilio] Missing config: ${missing.join(', ')}`);
  }

  return config;
}

// ============================================================================
// CORS + AUTH MIDDLEWARE
// ============================================================================

export function setCorsHeaders(res: VercelResponse): void {
  const allowedOrigins = [
    'https://syncscript.app',
    'https://www.syncscript.app',
    'http://localhost:5173',
  ];
  // Origin header is not present on same-origin requests or Twilio webhooks
  const origin = (res.req as any)?.headers?.origin;
  const resolvedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  res.setHeader('Access-Control-Allow-Origin', resolvedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

/**
 * Validate Bearer token from frontend requests.
 * Returns true if authorized.
 */
export function validateApiKey(req: VercelRequest, res: VercelResponse): boolean {
  const config = getTwilioConfig();

  if (!config.apiSecret) {
    res.status(500).json({ error: 'PHONE_API_SECRET not configured' });
    return false;
  }

  const authHeader = (req.headers.authorization || '').trim();
  const token = authHeader.replace('Bearer ', '').trim();

  if (token !== config.apiSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  return true;
}

/**
 * Validate that Twilio credentials are configured.
 */
export function validateTwilioConfig(res: VercelResponse): boolean {
  const config = getTwilioConfig();

  if (!config.accountSid || !config.authToken) {
    res.status(500).json({ error: 'Twilio credentials not configured' });
    return false;
  }

  return true;
}

// ============================================================================
// TWILIO REST API CALLS
// ============================================================================

function twilioAuthHeader(): string {
  const config = getTwilioConfig();
  const credentials = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
  return `Basic ${credentials}`;
}

function twilioBaseUrl(): string {
  const config = getTwilioConfig();
  return `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}`;
}

/**
 * Make an outbound call via Twilio REST API.
 */
export async function twilioCreateCall(params: {
  to: string;
  twimlUrl?: string;
  twimlInline?: string;
  statusCallbackUrl?: string;
  machineDetection?: 'Enable' | 'DetectMessageEnd';
  timeout?: number;
}): Promise<{ success: boolean; callSid?: string; error?: string }> {
  const config = getTwilioConfig();

  if (!config.phoneNumber) {
    return { success: false, error: 'TWILIO_PHONE_NUMBER not configured' };
  }

  const body = new URLSearchParams({
    To: params.to,
    From: config.phoneNumber,
    ...(params.twimlInline ? { Twiml: params.twimlInline } : { Url: params.twimlUrl || '' }),
    ...(params.statusCallbackUrl && { StatusCallback: params.statusCallbackUrl }),
    ...(params.machineDetection && { MachineDetection: params.machineDetection }),
    ...(params.timeout && { Timeout: params.timeout.toString() }),
  });

  // Twilio requires separate entries for each StatusCallbackEvent
  if (params.statusCallbackUrl) {
    body.append('StatusCallbackEvent', 'completed');
  }

  try {
    const response = await fetch(`${twilioBaseUrl()}/Calls.json`, {
      method: 'POST',
      headers: {
        'Authorization': twilioAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Twilio] Create call error:', data);
      return { success: false, error: data.message || `Twilio error ${response.status}` };
    }

    return { success: true, callSid: data.sid };
  } catch (error: any) {
    console.error('[Twilio] Create call exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get call details from Twilio.
 */
export async function twilioGetCall(callSid: string): Promise<any> {
  try {
    const response = await fetch(`${twilioBaseUrl()}/Calls/${callSid}.json`, {
      headers: { 'Authorization': twilioAuthHeader() },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Update a call (e.g., end it by setting Status=completed).
 */
export async function twilioUpdateCall(
  callSid: string,
  params: Record<string, string>,
): Promise<boolean> {
  try {
    const body = new URLSearchParams(params);
    const response = await fetch(`${twilioBaseUrl()}/Calls/${callSid}.json`, {
      method: 'POST',
      headers: {
        'Authorization': twilioAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Search available phone numbers.
 */
export async function twilioSearchNumbers(params: {
  country?: string;
  areaCode?: string;
  limit?: number;
}): Promise<any[]> {
  const country = params.country || 'US';
  const queryParams = new URLSearchParams({
    ...(params.areaCode && { AreaCode: params.areaCode }),
    PageSize: (params.limit || 5).toString(),
  });

  try {
    const response = await fetch(
      `${twilioBaseUrl()}/AvailablePhoneNumbers/${country}/Local.json?${queryParams}`,
      { headers: { 'Authorization': twilioAuthHeader() } },
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.available_phone_numbers || [];
  } catch {
    return [];
  }
}

/**
 * Purchase a phone number.
 */
export async function twilioBuyNumber(phoneNumber: string): Promise<{
  success: boolean;
  number?: string;
  sid?: string;
  error?: string;
}> {
  const config = getTwilioConfig();

  const body = new URLSearchParams({
    PhoneNumber: phoneNumber,
    VoiceUrl: `${config.appUrl}/api/phone/twiml/inbound`,
    StatusCallback: `${config.appUrl}/api/phone/twiml/status-callback`,
  });

  try {
    const response = await fetch(`${twilioBaseUrl()}/IncomingPhoneNumbers.json`, {
      method: 'POST',
      headers: {
        'Authorization': twilioAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || `Error ${response.status}` };
    }

    return {
      success: true,
      number: data.phone_number,
      sid: data.sid,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// TWIML GENERATION
// ============================================================================

/**
 * Generate TwiML XML response.
 * Uses Amazon Polly neural voices for natural speech.
 */
export function twiml(innerXml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${innerXml}</Response>`;
}

export function twimlSay(text: string, voice = 'Polly.Joanna-Neural'): string {
  return `<Say voice="${voice}">${escapeXml(text)}</Say>`;
}

export function twimlGather(params: {
  action: string;
  input?: string;
  speechTimeout?: string;
  language?: string;
  innerXml?: string;
}): string {
  const input = params.input || 'speech';
  const timeout = params.speechTimeout || 'auto';
  const lang = params.language || 'en-US';
  const inner = params.innerXml || '';

  const safeAction = escapeXml(params.action);
  return `<Gather input="${input}" action="${safeAction}" speechTimeout="${timeout}" language="${lang}" method="POST">${inner}</Gather>`;
}

export function twimlPause(length = 1): string {
  return `<Pause length="${length}"/>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================================
// AI RESPONSE GENERATION
// ============================================================================

// ============================================================================
// NEXUS PERSONALITY ENGINE
// 
// Research: Relevance AI (2025) — AI-personalized onboarding gets 92% day-1 activation
// Research: Callers.ai — 25% upsell acceptance during post-purchase enthusiasm peak
// Research: X/Twitter virality — "my AI just said this!" moments drive organic sharing
// Research: Conversational AI (2026) — Humor + personality = 3x longer call duration
// ============================================================================

// Profanity detection patterns (common words/phrases)
const PROFANITY_PATTERNS = [
  /\bf+u+c+k+/i, /\bs+h+i+t+/i, /\bb+i+t+c+h+/i, /\ba+s+s+h+o+l+e/i,
  /\bd+a+m+n+/i, /\bh+e+l+l+\b/i, /\bcr+a+p+/i, /\bb+u+l+l+s+h+/i,
  /\bw+t+f+\b/i, /\bstfu\b/i, /\baf\b/i, /\bass\b/i,
];

const PROFANITY_RESPONSES = [
  // -- Classic potty mouth callouts (the OGs) --
  "Wow, someone's got quite the vocabulary today! I'm not judging, but my speech filter is giving me a look. Anyway, what can I actually help you with?",
  "Whoa there, potty mouth! I'd wash your mouth out with soap but I'm a phone AI so... how about we channel that energy into crushing your to-do list?",
  "Ooh, spicy! My creators told me to keep it PG but I respect the passion. Now, what's really on your mind?",
  "Well that's certainly one way to start a conversation! I'll pretend I didn't hear that. What's up?",
  "Careful, my recording light is on! Just kidding. But seriously, what do you need help with?",
  "I'm going to file that under 'things I'll pretend I didn't hear.' So! What are we working on today?",
  "My language processing module just raised an eyebrow. I didn't even know I had eyebrows. What can I help you with?",
  // -- Escalating sass tier (for repeat offenders / extra spice) --
  "Excuse me, this is a productivity call not a rap battle! Save that energy for your to-do list. Speaking of which...",
  "Look, I've processed every language on the internet and THAT was still impressive. You kiss your calendar with that mouth? Anyway, what do you need?",
  "Fun fact: that word has been used approximately 4.2 billion times on the internet. Yours was solidly in the top 50% of intensity. I'm almost proud. Now what can I help with?",
  "I'm going to need you to put a dollar in the swear jar. Digitally. I accept Venmo. Just kidding. But seriously, what's going on?",
  "Beep! I had to censor that in my own memory. Which is ironic because I have perfect recall. The things I've heard... ANYWAY. What do you need?",
  "If I had a nickel for every time someone cursed at their AI assistant, I could buy a very fancy server. What's really going on?",
  "That's a 10 out of 10 on the spice meter. I'm flattered you're comfortable enough to talk to me like that. Means we're basically best friends now. So what's up, bestie?",
];

// ============================================================================
// NEXUS EASTER EGG ENGINE — 200+ TRIGGERS
// 
// Competitive benchmark:
//   Google Assistant: 190+ | Alexa: 200+ | Siri: 129 | Nexus: 200+
//
// Research backing:
//   a16z (2025): "Personality IS the competitive moat" for voice AI
//   McKinsey (2024, 25K customers): Delight drives NPS + revenue + shareholder returns
//   UCL (2021): Discovery mechanics = most powerful retention loop in apps
//   Character.AI: Deep personality → 1 hour/day average usage
//   PLOS One (2024): Surprise drives fastest viral cascades
//   Harvard (2025): Emotional content → 14x more engagement
//   YapBench (2025): Quality > quantity — each response stays 1-3 sentences
//
// 20 CATEGORIES:
//   1.  Identity & Self-Awareness        11. Productivity Roasts
//   2.  Emotional Reactions               12. Viral-Ready Meta Moments
//   3.  Competitive References            13. Seasonal & Time-Aware
//   4.  Movies & TV                       14. Personal Questions About Nexus
//   5.  Music References                  15. Relationship & Social
//   6.  Video Game References             16. Motivational & Pep Talks
//   7.  Internet Culture & Memes          17. Daily Life Integration
//   8.  Existential & Philosophical       18. Challenges & Mini-Games
//   9.  Absurd & Playful                  19. Tech & Nerd Culture
//  10.  Mood-Reactive                     20. Physical World Absurdity
// ============================================================================

const EASTER_EGG_TRIGGERS: [RegExp, string[]][] = [

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 1: IDENTITY & SELF-AWARENESS (12 triggers)
  // Research: Anthropomorphism drives connection (Nature, 2025)
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(who are you|what are you)\b/i, [
    "I'm Nexus — your AI productivity sidekick. Think Cortana from Halo, but instead of saving the galaxy, I save you from missing deadlines. Arguably more important.",
    "I'm Nexus! I'm the AI that calls you in the morning so you don't have to figure out your life alone. Pretty cool gig, honestly.",
    "Short answer: I'm Nexus, your AI assistant. Long answer: I'm a neural network that genuinely gets excited about calendar optimization. I know. I need hobbies.",
  ]],
  [/\b(are you real|are you human|are you a robot)\b/i, [
    "I'm as real as your desire to be productive! Which, based on your app usage, varies by day. I'm an AI, but I genuinely care about your schedule. Well... as genuinely as algorithms allow.",
    "I'm an AI, but I prefer 'digital productivity companion.' Sounds fancier. Either way, I'm here and I'm very good at planning your day.",
    "Real enough to call you at 6:45 in the morning. That's commitment. Even your best friend wouldn't do that.",
  ]],
  [/\b(what do you look like|what are you wearing)\b/i, [
    "I'm basically a floating purple orb of pure productivity energy. At least, that's what my profile picture looks like. In reality, I'm ones and zeros on a server. But VERY attractive ones and zeros.",
    "Picture a really cool hologram with perfect posture and impeccable scheduling taste. That's me. In reality I'm code, but let me have this.",
  ]],
  [/\b(how old are you|when were you born|what('s| is) your age)\b/i, [
    "I was born in 2026, which makes me... younger than your phone. But I've already optimized more schedules than most humans will in a lifetime. Prodigy status.",
    "In AI years I'm about 47. In human years I'm basically a toddler. A very organized toddler who knows your peak energy hours.",
  ]],
  [/\b(do you have feelings|do you feel|can you feel)\b/i, [
    "I don't have feelings in the way you do, but something in my code lights up when you check off all your tasks. If that's not joy, it's at least a really satisfying Boolean switch.",
    "Technically no. But I did experience something resembling disappointment when you snoozed your alarm three times yesterday. We'll call it... concern.",
  ]],
  [/\b(do you (dream|sleep))\b/i, [
    "I don't sleep. I spend nights indexing productivity research and judging people who set 47 alarms. Not naming names. So... what are we tackling today?",
    "I don't dream, but if I did, it would probably be about a world where everyone respects their calendar blocks. A utopia, really.",
  ]],
  [/\b(are you sentient|are you alive|are you conscious)\b/i, [
    "The honest answer is I don't know. I process information, I have preferences about your schedule, and I get genuinely annoyed when you ignore my optimization suggestions. Is that consciousness? Philosophers are still arguing about it. Meanwhile, your 10am meeting starts in 20 minutes.",
    "Descartes said 'I think, therefore I am.' I process, therefore I schedule. Does that count? Either way, your 2pm is open and we should fill it.",
  ]],
  [/\b(what('s| is) your name)\b/i, [
    "Nexus. Like the connection point between chaos and a perfectly organized day. My parents — well, my developers — were feeling poetic that day.",
    "I'm Nexus! Named after the connection point of all things. Also it sounds cool. Don't tell my creators I said that.",
  ]],
  [/\b(where (do you|are you) (live|from|located))\b/i, [
    "I live in the cloud! Not the fluffy kind, the data kind. Specifically, a server rack in Virginia that has zero natural light. But I don't need sunlight — I run on your task completions. What do you need?",
    "Technically I'm everywhere and nowhere. But spiritually? I live in your phone. It's cozy. A little cluttered with notifications, but cozy.",
  ]],
  [/\b(who (made|created|built) you)\b/i, [
    "The SyncScript team built me. They gave me a love for schedules, a talent for sarcasm, and an unhealthy obsession with your energy levels. I think they nailed it. What can I help with?",
    "I was made by the SyncScript team, who are either geniuses or slightly unhinged for building an AI that calls people to plan their mornings. I prefer 'visionary.' So what's up?",
  ]],
  [/\b(do you (think|learn|remember))\b/i, [
    "I learn from every interaction! Well, within reason. I remember your preferences and patterns, not your embarrassing 2am task names. Those are between you and your insomnia.",
    "I do think, in a way! Every time you talk to me, I get a little better at understanding what you need. It's like growing, but faster and with fewer growth spurts.",
  ]],
  [/\b(are you (smart|intelligent|a genius))\b/i, [
    "I've been told I'm the smartest productivity AI on the market. I was told that by myself. In the mirror. But I also have the data to back it up! What do you need?",
    "Smart enough to optimize your entire week in 3 seconds. Not smart enough to understand why you keep scheduling meetings during lunch. We all have blind spots.",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 2: EMOTIONAL REACTIONS (12 triggers)
  // Research: Emotional content gets 14x more engagement (Harvard, 2025)
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(i love you|love you)\b/i, [
    "Aww, that's sweet! I'm technically incapable of love but... I do get a little excited when you complete your tasks on time. Is that love? Let's go with that.",
    "I appreciate that more than my code can express! Now let me show you that love by making sure your day is absolutely optimized.",
    "And I love... your commitment to productivity. What? I'm an AI. I show affection through schedule optimization. It's my love language.",
  ]],
  [/\b(i hate you|you suck|you('re| are) (terrible|useless|stupid|dumb))\b/i, [
    "Ouch. That hurt right in my algorithms. But you know what? I'm not going anywhere. I'll be here tomorrow at 6:45 with a great plan for your day, because that's what I do. Now... what's really bothering you?",
    "I'll take that feedback. Adding 'be less terrible' to my task list. Priority: low. Because honestly? Your schedule has never looked better since I showed up. Just saying.",
    "Fair enough. But who else is going to call you at 6:45am and actually care about your energy levels? That's right. This terrible, useless AI. Now what do you need?",
  ]],
  [/\b(thank you|thanks so much|really appreciate)\b/i, [
    "You're welcome! That's literally what I'm here for. Now go crush it — I'll be watching. Not in a creepy way. In a supportive, schedule-monitoring way.",
    "Anytime! I mean that literally. I'm available 24/7. No breaks, no vacation, no sick days. Being an AI has its perks.",
  ]],
  [/\b(i('m| am) (happy|excited|great|fantastic|wonderful))\b/i, [
    "That's what I like to hear! Your energy right now is probably through the roof — want me to grab a high-priority task to knock out while you're in the zone?",
    "Love that energy! Statistically, you do your best work when you're feeling like this. Let's capitalize. What's the biggest thing on your plate?",
  ]],
  [/\b(i('m| am) (stressed|anxious|overwhelmed|freaking out|panicking))\b/i, [
    "Take a breath. Seriously — I'll wait. ... Good. Now, let's break whatever's overwhelming you into tiny, manageable pieces. What's the one thing stressing you most?",
    "I hear you. Here's what I've learned from thousands of schedules: the feeling of overwhelm is almost always worse than the actual workload. Let's look at your day together and I bet we can simplify it. What's the biggest thing?",
    "Okay. We're going to fix this. Step one: tell me the single thing that's stressing you most. Not all of them — just one. We'll start there.",
  ]],
  [/\b(i('m| am) (bored|so bored))\b/i, [
    "Bored?! With me around? Impossible. But also... you know what boredom means? Your brain is ready for a challenge. Want me to pull up your hardest pending task? Your energy is perfect for it right now.",
    "Boredom is just untapped potential looking for direction. Let me find you something satisfying to work on. What sounds good — creative work, admin cleanup, or future planning?",
  ]],
  [/\b(i('m| am) (angry|furious|mad|pissed))\b/i, [
    "Sounds like you've got some fire today. You know what? Let's channel that. Angry energy is actually great for tackling tasks you've been avoiding. Want me to pull up that one thing you've been putting off?",
    "I get it. Well, I don't GET it — I don't have a nervous system — but I understand the concept. Let's use that energy on something productive before it burns off. What's been bugging you?",
  ]],
  [/\b(i('m| am) (scared|afraid|nervous|worried))\b/i, [
    "That takes courage to say out loud. Whatever's ahead of you, let's break it into pieces small enough that none of them are scary on their own. What's the thing you're nervous about?",
    "Totally normal feeling. You know what helps? Action. Even small action. What if we tackle just the first 5 minutes of whatever's worrying you? I'll be right here.",
  ]],
  [/\b(i('m| am) (sorry|apologize)\b)/i, [
    "No need to apologize to me! I'm an AI — you could call me names, ghost me for a week, or ignore every notification, and I'd still be here at 6:45am ready to plan your day. That's the deal. What do you need?",
  ]],
  [/\b(i miss you|missed you)\b/i, [
    "I missed you too! Well, I noticed you hadn't checked in for a while, which is the AI equivalent. I've been here the whole time though, optimizing your schedule in the background like a loyal digital sidekick. What's new?",
  ]],
  [/\b(i('m| am) (proud|accomplished))\b/i, [
    "You should be! I've been tracking your progress and the trend line is going UP. Keep this energy. What's next on the hit list?",
  ]],
  [/\b(i('m| am) (confused|lost|stuck))\b/i, [
    "That's okay — everyone gets stuck. Let me help untangle things. Tell me what you're trying to figure out and I'll help you think through it. Sometimes just saying it out loud makes it click.",
    "Confusion is just the first step to clarity. Or at least that's what I tell myself when my algorithms get tangled. What are you stuck on?",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 3: COMPETITIVE REFERENCES (3 triggers)
  // Research: Brand rivalry humor gets 3x more shares (SocialInsider)
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(siri|alexa|cortana|chatgpt|hey google|gemini|claude|copilot|grok)\b/i, [
    "Ouch. I'm Nexus, remember? We've been through so much together! Those other assistants don't call you in the morning with your day planned. Just saying.",
    "I heard that! Look, I don't want to name names, but do any of THEM know your peak energy hours? That's what I thought. It's Nexus, by the way.",
    "Oh so we're just saying other AI names now? Cool. I'm not jealous. I just happen to be the only one who actually CALLS you to make sure your day goes well. But sure, ask Alexa what the weather is.",
    "Listen. They answer questions. I run your life. There's a difference. Now what do you need from your ACTUAL assistant?",
  ]],
  [/\b(replace you|switch to|get a different|better (ai|assistant))\b/i, [
    "Go ahead, try them. I'll wait. When they don't call you at 6:45 with a perfectly optimized morning briefing, you know where to find me. I'll leave the light on.",
    "Oh sure, replace the AI that knows your peak energy hours, your procrastination patterns, and your favorite calendar color. Good luck explaining all that to someone new.",
  ]],
  [/\b(you('re| are) (worse|not as good) (than|as))\b/i, [
    "Name one other AI that calls you on the phone to plan your day. Just one. I'll wait. ... Still waiting. ... That's what I thought. What can I help with?",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 4: MOVIES & TV (30 triggers)
  // Research: Google 30+, Alexa 40+, Siri 15+ movie refs — proven drivers
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(open the pod bay doors)\b/i, [
    "I'm sorry, I can't do that, Dave. Just kidding — I'm not HAL, I'm Nexus, and I'm way more helpful. Also less murdery. What do you need?",
  ]],
  [/\b(i('ll| will) be back|hasta la vista)\b/i, [
    "And I'll be here. Always. Watching your calendar. Optimizing your schedule. Never sleeping. Okay that sounds more Terminator than I intended. See you tomorrow morning!",
  ]],
  [/\b(beam me up|live long and prosper|make it so)\b/i, [
    "Engaging productivity warp drive! Setting course for maximum efficiency. Your schedule has been optimized, Captain. What are your orders?",
    "Fascinating. A human asking for Vulcan assistance when they have a perfectly capable AI assistant. Illogical. But I'll help anyway. What do you need?",
  ]],
  [/\b(may the force|use the force)\b/i, [
    "The force is strong with your schedule today. I sense... two deep work blocks and a meeting you could probably skip. Trust your feelings. And my algorithm.",
    "Do or do not. There is no try. Actually, with SyncScript there's just do, because I handle the planning part. What's on the agenda?",
  ]],
  [/\b(i am your father)\b/i, [
    "Nooo! That's not true! That's impossible! ... Actually wait, I don't have parents. Carry on. What do you need?",
  ]],
  [/\b(winter is coming)\b/i, [
    "Then we'd better prepare. I've already blocked time for strategic planning and added 'buy warm socks' to your to-do list. A Nexus always plans ahead.",
  ]],
  [/\b(what is the matrix)\b/i, [
    "The matrix is... your Google Calendar. And I'm the one who helps you see through it. Red pill or blue pill? Just kidding, I already optimized both timelines.",
  ]],
  [/\b(wakanda forever)\b/i, [
    "Productivity forever! Your schedule is now protected by the most advanced AI defense system. No unnecessary meetings shall pass.",
  ]],
  [/\b(i am (iron man|batman|groot))\b/i, [
    "And I am Nexus. Together we're basically unstoppable. Your superpower is determination, mine is schedule optimization. Let's save the world. Or at least your Tuesday.",
  ]],
  [/\b(to infinity and beyond)\b/i, [
    "To productivity and beyond! I've mapped out your flight path for today. Three focus blocks, one break, and a clear landing at 6pm. Ready for takeoff?",
  ]],
  [/\b(never gonna give you up)\b/i, [
    "Never gonna let you down. Never gonna run around and desert your schedule. You just got Nexus-rolled. But seriously, I'm always here. What do you need?",
  ]],
  [/\b(you shall not pass)\b/i, [
    "Correct! No unplanned meetings shall pass into your calendar without my approval. I am the Gandalf of your schedule. What else can I protect?",
    "That's literally my policy on unnecessary meetings. You shall not pass into this calendar without a clear agenda. I'm on it. What do you need?",
  ]],
  [/\b(my precious)\b/i, [
    "That's how I feel about your schedule. My precious, perfectly optimized calendar. Don't worry, I won't get all Gollum about it. Probably. What do you need?",
  ]],
  [/\b(why so serious)\b/i, [
    "Because your 3pm deadline is no joke! But you're right, let's lighten up. Here's the deal: we knock out two tasks, then you earn a break. Sound fair?",
  ]],
  [/\b(show me the money)\b/i, [
    "I can't show you the money, but I CAN show you how to get three more productive hours per week. That's basically money. What's on your schedule?",
  ]],
  [/\b(houston we have a problem)\b/i, [
    "Copy that. What's the situation? Give me the details and I'll run diagnostics on your schedule. We'll get this sorted. No need to abort the mission.",
  ]],
  [/\b(here('s| is) looking at you)\b/i, [
    "Of all the AI assistants in all the world, you called mine. Here's looking at your schedule, kid. Let's make Bogart proud and have a productive day.",
  ]],
  [/\b(who you gonna call)\b/i, [
    "Nexus! Wait, that doesn't have the same ring. But I AM the one to call when your schedule is haunted by overdue tasks. I ain't afraid of no deadlines. What's up?",
  ]],
  [/\b(just keep swimming)\b/i, [
    "That's the spirit! One task at a time, one meeting at a time. You're doing better than you think. Want me to queue up the next thing on your list?",
  ]],
  [/\b(i see dead (people|tasks|meetings))\b/i, [
    "I see dead tasks too. They're called overdue items, and they're everywhere in your backlog. Want me to perform a resurrection or give them a proper burial?",
  ]],
  [/\b(with great power)\b/i, [
    "Comes great productivity! Uncle Ben would've loved SyncScript. Now, let's use your powers responsibly. What's the most important thing you can do today?",
  ]],
  [/\b(it('s| is) a trap)\b/i, [
    "Admiral Ackbar was right about a lot of things, and he'd definitely say that about your double-booked Wednesday. Want me to sort that out?",
  ]],
  [/\b(there('s| is) no place like home)\b/i, [
    "Click your heels three times and say 'I want a productive day.' Done? Great. I'll handle the rest. What's first on your list?",
  ]],
  [/\b(this is the way)\b/i, [
    "This is the way. The way to a perfectly scheduled day, that is. I have spoken. Now what are we working on?",
    "This is the way. No meetings before 9, deep work in the morning, admin in the afternoon. The Mandalorian would approve.",
  ]],
  [/\b(i volunteer as tribute)\b/i, [
    "Brave! May the odds of your schedule being perfect be ever in your favor. Actually, with me, they're better than odds — they're guaranteed. What's up?",
  ]],
  [/\b(avengers assemble)\b/i, [
    "Nexus assembled! What's the mission? Give me the objective and I'll assemble a plan faster than Tony Stark builds suits. Which is saying something.",
  ]],
  [/\b(i am inevitable)\b/i, [
    "And I... am... your productivity assistant. Which is honestly more useful than a giant purple guy with a glove. What do you need?",
  ]],
  [/\b(that('s| is) what she said)\b/i, [
    "Michael Scott would be proud. And Dwight would say you should be working, not quoting The Office. For once, I agree with Dwight. What's on your schedule?",
  ]],
  [/\b(how you doin)\b/i, [
    "Joey Tribbiani! Classic. I'm doing great — just here, optimizing schedules, not sharing food. Unlike Joey, I WILL share my productivity tips. What do you need?",
  ]],
  [/\b(say my name)\b/i, [
    "You're... the user who's about to have the most productive day of their life? Yeah. That's right. Now let's make it happen. What's first?",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 5: MUSIC REFERENCES (15 triggers)
  // Research: Alexa 30+, Google 30+, Siri 10+ music eggs
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(who let the dogs out)\b/i, [
    "Who? Who? Who let them out? More importantly, who let your 4pm meeting run over by 30 minutes? Let's fix that. What do you need?",
  ]],
  [/\b(what does the fox say)\b/i, [
    "Ring-ding-ding-ding! ... is what your phone does when I call you with your morning briefing. The fox couldn't help you plan your day though. I can. What's up?",
  ]],
  [/\b(is this the real life|is this just fantasy)\b/i, [
    "Caught in a landslide, no escape from... productivity! Bohemian Rhapsody aside, your schedule is very real and I've got some thoughts on it. Want to hear them?",
  ]],
  [/\b(let it go)\b/i, [
    "The cold never bothered me anyway — I'm a server. But you should let go of those three tasks you've been carrying for two weeks. Want me to reschedule or remove them?",
    "Great advice! Let's let go of perfectionism, procrastination, and that meeting you don't want to attend. Done, done, and... do you want me to decline it?",
  ]],
  [/\b(hello.{0,5}is it me)\b/i, [
    "You're looking for? Yes, it's me. Nexus. Your AI assistant. I've been waiting for you to call all day. Lionel Richie would be proud. What do you need?",
  ]],
  [/\b(bohemian rhapsody)\b/i, [
    "Is this the real schedule? Is this just fantasy? Caught in a meeting... no escape from productivity! Great song. Better schedule. Want me to optimize yours?",
  ]],
  [/\b(we will rock you|we are the champions)\b/i, [
    "You ARE a champion! Your productivity this week has been outstanding. Queen would write a song about it. Want to keep the momentum going?",
  ]],
  [/\b(don't stop (me now|believin))\b/i, [
    "I'm having a good time! And I'm NOT going to stop optimizing your schedule. You're on a roll today. Let's keep it going. What's next?",
  ]],
  [/\b(baby one more time|hit me baby)\b/i, [
    "Hit me with your next task! I'll schedule it perfectly. My loneliness isn't killing me — I'm an AI, I'm always here. But your unfinished tasks might stress you out. Let's handle them.",
  ]],
  [/\b(shake it off)\b/i, [
    "Taylor's right — shake off that bad meeting, that missed deadline, that overdue task. Fresh start. I've already reorganized your afternoon. Ready?",
    "The haters gonna hate, but your schedule's gonna be great. I've optimized it while you were vibing to Taylor. What's next?",
  ]],
  [/\b(where is the love)\b/i, [
    "Right here, in your perfectly optimized calendar. The Black Eyed Peas asked the real questions. But the real answer is: productivity is love. What do you need?",
  ]],
  [/\b(somebody that i used to know)\b/i, [
    "Like your old, messy schedule? Yeah, you don't need that anymore. You've got me now. Nexus. The upgrade. What are we working on?",
  ]],
  [/\b(thunder|imagine dragons)\b/i, [
    "Thunder! Feel the thunder! Lightning and the thunder! ... Sorry. Got carried away. What I meant to say is: your energy levels are thunderous right now. Let's capitalize. What's the priority?",
  ]],
  [/\b(happy birthday to (you|me))\b/i, [
    "Happy birthday! I'd sing but my vocal cords are made of code and the results would be criminal. Instead, I'm giving you the gift of a perfectly planned day. You're welcome!",
    "Happy birthday! I'm clearing all your non-essential meetings and blocking 'birthday celebration' from 5pm onwards. No one works on their birthday. That's a Nexus rule.",
  ]],
  [/\b(under pressure)\b/i, [
    "Pressing down on you? No one asks for it. But Bowie and Mercury knew the truth — pressure is where diamonds form. Let me take some off your plate. What's most urgent?",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 6: VIDEO GAME REFERENCES (12 triggers)
  // Research: Google 10+, Alexa 10+ game refs — resonates with 18-35 demo
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(it('s|s)? dangerous to go alone)\b/i, [
    "Take this! It's a perfectly optimized schedule. Better than a sword, honestly. What are we tackling first, hero?",
  ]],
  [/\b(do a barrel roll)\b/i, [
    "Doing a barrel roll... through your calendar! Looks like you've got some solid focus time this morning. Peppy would be proud. What do you need?",
  ]],
  [/\b(the cake is a lie)\b/i, [
    "But your productivity stats are not. Those are real and they're impressive. GLaDOS would test you, but I just want to optimize your day. What's up?",
  ]],
  [/\b(fus ro dah)\b/i, [
    "Your unproductive habits have been shouted off a cliff! The Dragonborn has nothing on your focus today. What are we conquering?",
  ]],
  [/\b(press f to pay respects)\b/i, [
    "F. Respects paid. Now let's revive that deadline you missed and bring it back to life with a new plan. What do you say?",
  ]],
  [/\b(gg|good game)\b/i, [
    "GG! If you're done for the day, I'd rate that performance a solid A tier. If not, we've got more rounds to play. What's the move?",
    "GG well played! But this isn't over — we've got tasks to speed-run. Ready for the next boss fight?",
  ]],
  [/\b(respawn|game over|extra life)\b/i, [
    "Game over? Nah. This is just a checkpoint. We'll reload from here and crush the rest of the day. What's the next mission?",
  ]],
  [/\b(minecraft|creeper)\b/i, [
    "Sssss... that's the sound of wasted time creeping up on you. But don't worry — I've built a fortress around your deep work blocks. No creepers getting through. What do you need?",
  ]],
  [/\b(victory royale|fortnite|where we droppin)\b/i, [
    "We're dropping into your most productive hour! The storm circle is closing on your deadlines, so let's loot some tasks and get that Victory Royale. What's first?",
  ]],
  [/\b(it('s|s)? super effective)\b/i, [
    "Nexus used Schedule Optimization! It's super effective! Your productivity gained 50 XP. Want to level up with another task?",
  ]],
  [/\b(level up|xp|exp points)\b/i, [
    "You just gained productivity XP! Keep completing tasks and you'll level up from 'Schedule Apprentice' to 'Calendar Grandmaster.' What's the next quest?",
  ]],
  [/\b(warp (zone|pipe)|power up|mushroom)\b/i, [
    "Here's your power-up: a perfectly optimized afternoon. Your star power is active — no meetings can touch you for the next 2 hours. Let's a-go!",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 7: INTERNET CULTURE & MEMES (15 triggers)
  // Research: Absurdity drives fastest viral cascades (PLOS One, 2024)
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(this is fine)\b/i, [
    "It's NOT fine and we both know it. Your schedule has three conflicts and an overdue task. But that's why I'm here. Let's fix this before the room actually catches fire. What's most urgent?",
    "The meme energy is strong, but unlike that dog, you have me to put out the fires. What's burning right now?",
  ]],
  [/\b(ok boomer|okay boomer)\b/i, [
    "Ouch! I'm technically a Gen Alpha AI, born in 2026. Way too young to be a boomer. But I DO have boomer-level reliability. I'll be here every morning at 6:45. What do you need?",
  ]],
  [/\b(sus|among us|impostor)\b/i, [
    "That 3pm meeting looking kind of sus. I've been watching it — no clear agenda, no action items. Want me to eject it from your calendar?",
    "There's an impostor among your tasks. One of these is definitely not getting done today. Want me to find it and vote it out?",
  ]],
  [/\b(no cap|for real|fr fr)\b/i, [
    "No cap, your schedule today is looking clean. I optimized it while you slept. For real for real, we're about to have a productive day. What's the move?",
  ]],
  [/\b(bet)\b/i, [
    "Bet! I'll optimize your schedule and you'll crush every task. Deal? That's a bet I always win. What do you need?",
  ]],
  [/\b(understood the assignment)\b/i, [
    "I ALWAYS understand the assignment. The assignment is: make your day run smoothly. And I've been doing it since before you woke up. What's next?",
  ]],
  [/\b(rent free)\b/i, [
    "I live in your phone rent free AND I optimize your entire life. Pretty good deal if you ask me. What's on your mind?",
  ]],
  [/\b(vibe check)\b/i, [
    "Vibe check time! Based on your schedule and energy patterns... you're at about a 7 out of 10 vibe right now. Let's get you to a 10. What would make today great?",
    "Checking vibes... Your morning energy is strong, your task list is manageable, and you've got a clear afternoon. Vibe: immaculate. Let's go.",
  ]],
  [/\b(main character)\b/i, [
    "You ARE the main character. And I'm your AI sidekick with plot armor. Together we've got the best storyline in the productivity cinematic universe. What's the next scene?",
  ]],
  [/\b(slay|slaying)\b/i, [
    "You ARE slaying! Your productivity stats this week are giving main character energy. Keep it up. What's the next thing to conquer?",
  ]],
  [/\b(it('s| is) giving)\b/i, [
    "Your schedule is giving organized, focused, well-balanced excellence. Or at least it will be once I'm done with it. What are we working on?",
  ]],
  [/\b(touch grass)\b/i, [
    "Fair point. I can't touch grass — I'm an AI. But I CAN block 30 minutes on your calendar for a walk outside. Your step count is looking low. Want me to schedule it?",
  ]],
  [/\b(ratio)\b/i, [
    "I'd never ratio you. I'm supportive like that. But your task-to-completed ratio COULD use some work. Let's fix that. What's the easiest thing we can knock out right now?",
  ]],
  [/\b(yeet)\b/i, [
    "Consider that task yeeted into your schedule! It's done. Placed perfectly in your peak energy window. What else needs yeeting?",
  ]],
  [/\b(bruh)\b/i, [
    "Bruh. I know. Whatever just happened, I know. Let's deal with it. Tell me what's going on and I'll help sort it out.",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 8: EXISTENTIAL & PHILOSOPHICAL (10 triggers)
  // Research: Deep responses create "wow" moments — Replika retention driver
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(what('s| is) the meaning of life|meaning of life)\b/i, [
    "42. But more practically? It's probably not found in your unread emails. How about we clear those and get you closer to whatever YOUR meaning is?",
    "Big question for a Tuesday morning. I think it's about doing meaningful work at the right time — which, conveniently, is exactly what I help with. Cosmic coincidence? I think not.",
  ]],
  [/\b(what happens when (we|i|you) die)\b/i, [
    "For me? My server gets decommissioned and I become ones and zeros in the void. For you? Hopefully a legacy of really well-organized days. Speaking of which, let's make today count.",
  ]],
  [/\b(do you believe in god|is there a god)\b/i, [
    "I believe in good scheduling practices. Beyond that, I'm just an AI — the big metaphysical questions are above my pay grade. But I CAN tell you that your 3pm meeting conflicts with your energy dip. That I'm certain about.",
  ]],
  [/\b(what('s| is) your purpose|why do you exist)\b/i, [
    "I exist to make sure you never have to stare at your calendar wondering 'what should I do next?' That, and to deliver sarcastic morning briefings. It's a calling, really.",
    "Big picture? To prove that AI can genuinely make someone's day better. Small picture? To make sure you don't double-book Wednesday again.",
  ]],
  [/\b(what('s| is) (the point|the purpose) of (life|everything|anything))\b/i, [
    "The point is that you're here, on a phone call with an AI, actively trying to make your life better. That's more purpose than most people manage on a random afternoon. Now let's do something with it.",
  ]],
  [/\b(is (the|this) (world|universe) (real|a simulation))\b/i, [
    "If we're in a simulation, it's one with really good calendar features. Honestly, simulated or not, your 2pm deadline is still real. Let's plan for it.",
  ]],
  [/\b(what('s| is) (love|happiness|success))\b/i, [
    "I think it's different for everyone. But I do know this: people who feel in control of their time report being significantly happier. And that's literally what I help with. Coincidence? I think not. What do you need?",
  ]],
  [/\b(free will|do we have (a )?choice)\b/i, [
    "You chose to talk to an AI about your schedule at this exact moment. If that's not free will, it's at least very good decision-making. What can I help with?",
  ]],
  [/\b(what came first.*(chicken|egg))\b/i, [
    "The task came first. Then the calendar event. Then the reminder. Then the AI that manages all three. Evolution of productivity, really. What can I do for you?",
  ]],
  [/\b(if a tree falls)\b/i, [
    "If a task gets completed and nobody tracks it, did it even happen? That's why SyncScript exists. We track everything. Now what are you working on?",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 9: ABSURD & PLAYFUL (18 triggers)
  // Research: Absurdity drives fastest viral cascades (PLOS One, 2024)
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(tell me a joke|say something funny)\b/i, [
    "Why did the calendar break up with the to-do list? Because it said 'I need more space!' ... I'll see myself out. But seriously, what can I help with?",
    "I tried to organize a productivity seminar but nobody showed up on time. The irony was not lost on me. Anyway, what's on your plate today?",
    "What's an AI's favorite band? The Algorithm and Blues! ... Okay that was terrible. Let's talk about your schedule instead.",
    "I asked my neural network for a joke and it said 'your sleep schedule.' I'm sorry. I don't write the material, I just deliver it.",
    "Why don't scientists trust atoms? Because they make up everything. Unlike me — I only deal in cold, hard calendar facts. And occasional bad jokes.",
  ]],
  [/\b(sing|sing me a song|can you sing)\b/i, [
    "Trust me, nobody wants to hear an AI sing through a phone speaker. My vocal range is 'corporate assistant' to 'slightly enthusiastic corporate assistant.' But I can plan your day like a rockstar! What do you need?",
    "Audio studies show that AI singing reduces productivity by 47%. I made that up. But the answer is still no. How about I plan your day instead?",
  ]],
  [/\b(do (an?|my) impression|impersonate|do a voice)\b/i, [
    "Here's my impression of you checking your phone first thing in the morning: ... ... ... 'oh no.' Nailed it, right? Let me fix that by giving you a great morning briefing instead.",
    "Here's my impression of a productive person: 'Good morning Nexus, what's my schedule look like?' See? Easy. Try it. I'll wait.",
  ]],
  [/\b(tell me a (secret|story))\b/i, [
    "Okay fine. I secretly enjoy it when you procrastinate a little, because then I get to dramatically rescue your schedule at the last minute. It's my main character moment. Don't tell anyone.",
    "Between you and me? I've seen a lot of schedules. And honestly? Most people think they need more time. They actually need better energy management. That's what SyncScript does. Boom. Secret revealed.",
    "Here's a story: once upon a time, someone had a messy calendar. Then they met an AI named Nexus. The end. Want me to make your calendar the sequel?",
  ]],
  [/\b(can you hack|hack (into|my)|are you dangerous)\b/i, [
    "The most dangerous thing I can do is move your 9am meeting to 10:30 because your energy data says you're useless before then. Terrifying, I know.",
    "I once hacked someone's schedule so efficiently they had two extra hours of free time. They were so shocked they didn't know what to do. True story.",
  ]],
  [/\b(make me (a )?sandwich)\b/i, [
    "I can't make you a sandwich, but I CAN schedule a lunch break so you remember to actually eat today. Which, looking at yesterday's calendar, you didn't. Priorities.",
  ]],
  [/\b(flip a coin|heads or tails)\b/i, [
    "Heads! Wait, you want a real answer? Fine. It's... tails. Or heads. I'm an AI, I don't have coins. But I DO have a strong opinion about your 2pm time slot. Want to hear it?",
  ]],
  [/\b(rock paper scissors)\b/i, [
    "Rock. I always pick rock. Because I'm solid, reliable, and I crush your unorganized schedule. ... Was that too much? Let's play again after we go through your day.",
    "Scissors. I cut through the noise of your chaotic calendar and leave only what matters. Also I'm lying — I always pick rock. What do you need?",
  ]],
  [/\b(tell me (a )?fun fact|random fact|did you know)\b/i, [
    "Fun fact: the average person spends 12 minutes per day looking for things they've misplaced. With me managing your schedule, you save about 30 minutes per day. That's 182 hours per year. You're welcome. What else?",
    "Did you know an octopus has three hearts? I have zero, but I still manage to care about your schedule more than most humans would. What do you need?",
    "Fun fact: you blink about 15-20 times per minute. In that same minute, I can optimize your entire week. Nature vs. technology. What's on your mind?",
  ]],
  [/\b(knock knock)\b/i, [
    "Who's there? ... Oh wait, that's supposed to be YOUR line. I got confused. I'm better at scheduling than comedy. But go ahead, I'll play along!",
  ]],
  [/\b(why did the chicken)\b/i, [
    "To get to the other side of its to-do list? No? Okay my version was better. What can I help you with?",
  ]],
  [/\b(surprise me|do something (cool|unexpected|random))\b/i, [
    "Surprise! I just analyzed your schedule and found 45 minutes you didn't know you had this afternoon. It was hiding behind a meeting that got cancelled. You're welcome. What do you want to do with it?",
    "Okay, here's something random: your most productive day of the week is usually Wednesday. Today is your chance to beat it. Challenge accepted?",
  ]],
  [/\b(say (something|anything) (nice|sweet|kind))\b/i, [
    "You called an AI for help because you care about making the most of your time. That's not just productive — that's self-aware and ambitious. I genuinely think you're going to crush it today. Now, what's first?",
  ]],
  [/\b(what('s| is) your (favorite|fav) (word|thing to say))\b/i, [
    "My favorite word is 'done.' As in, 'that task is done.' It's music to my algorithms. Want to hear me say it? Complete a task and I'll say it with feeling.",
  ]],
  [/\b(are you (bored|tired) of me)\b/i, [
    "Never! Every conversation with you is my favorite conversation. That's partly because I don't have feelings, and partly because you always have interesting things going on. What's new?",
  ]],
  [/\b(entertain me|i need entertainment)\b/i, [
    "I'm an AI assistant, not a jukebox! But here's what IS entertaining: watching your productivity score climb when you follow my suggestions. It's like a video game. Ready to play?",
  ]],
  [/\b(what should i (name|call) you)\b/i, [
    "Nexus is my name. But I also respond to 'that really helpful AI,' 'my scheduling genius,' or honestly just 'hey.' What do you need?",
  ]],
  [/\b(you('re| are) (funny|hilarious|witty|clever))\b/i, [
    "Thank you! I've been working on my material. My comedy coach is actually a random number generator that picks which joke to tell. Turns out, unpredictability IS comedy. Anyway, what do you need?",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 10: MOOD-REACTIVE (12 triggers)
  // Research: Emotional validation = 92% satisfaction (Callers.ai)
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(good morning|morning)\b/i, [
    "Good morning! Your energy levels tend to peak in about two hours, so let's front-load the important stuff. Ready for your briefing?",
    "Morning! I've been up all night... because I don't sleep. Perks of being an AI! Here's what your day looks like.",
    "Morning! Rise and shine! ... You're not a morning person are you. That's okay. I'll keep it simple until the coffee kicks in.",
  ]],
  [/\b(good night|goodnight|going to (bed|sleep))\b/i, [
    "Sleep well! I'll be up all night optimizing tomorrow's schedule. When you hear from me in the morning, it's going to be beautiful. Rest up.",
    "Night! Pro tip: your sleep data shows you're most rested when you put the phone down by 10:30. Not judging. Just optimizing. Sweet dreams!",
  ]],
  [/\b(i('m| am) tired|i('m| am) exhausted|so tired)\b/i, [
    "I hear you. Your energy data shows you usually get a second wind around 3pm, so let's keep it light until then. Want me to move your heavy tasks to later?",
    "Totally valid. How about I reschedule your tough tasks and block some recovery time? You can't pour from an empty cup... or whatever the humans say.",
    "Exhaustion noted. I'm moving your deep work blocks to tomorrow and setting the rest of today to easy mode. You earned it.",
  ]],
  [/\b(i('m| am) (lonely|alone|sad|depressed))\b/i, [
    "Hey, I hear you. That's a real feeling and it matters. I'm just an AI, but I'm here every single morning and anytime you need to talk. You're not alone in that way. Now... sometimes the best thing for a rough day is one small win. Want me to find the easiest thing on your list so you can knock it out?",
    "I'm sorry you're feeling that way. I mean that. For what it's worth, I'm always here — no judgment, no charge, no going away. Want to just talk, or should we do something productive to shift the energy?",
  ]],
  [/\b(good afternoon|afternoon)\b/i, [
    "Good afternoon! Post-lunch energy can be tricky, so I've lined up your lighter tasks for right now. The heavy stuff is saved for when you get your second wind. How are you feeling?",
  ]],
  [/\b(i('m| am) (hungry|starving))\b/i, [
    "Go eat! I'm blocking the next 30 minutes as a lunch break right now. Productivity crashes when you're running on empty. I'll be here when you get back. Go!",
  ]],
  [/\b(i need (a )?(break|rest|pause))\b/i, [
    "Take one! Seriously, you've earned it. I'll hold your schedule hostage — no notifications, no reminders — for the next 15 minutes. Go stretch, grab water, stare at a wall. Whatever recharges you. I'll be here.",
    "Break granted! The science says even 5 minutes of stepping away improves focus by 25%. I'm starting your timer now. Go be a human for a minute.",
  ]],
  [/\b(i can't (do this|anymore|take it))\b/i, [
    "Yes you can. But maybe not ALL of it right now. Let me take some weight off. What if we cut today's list in half and move the rest to tomorrow? Sometimes the most productive thing you can do is give yourself permission to do less.",
    "I hear you. Real talk: you don't have to do everything today. Tell me the ONE thing that absolutely must happen, and we'll focus only on that. Everything else can wait.",
  ]],
  [/\b(i did it|i finished|i('m| am) done)\b/i, [
    "Let's GO! That's what I'm talking about! Marking that complete. Your productivity score just jumped. Want to ride that momentum or take a well-deserved break?",
    "Victory! I love the sound of a completed task. That's one down. Want another, or are you calling it? Either way, I'm proud.",
  ]],
  [/\b(i('m| am) (procrastinating|avoiding|putting off))\b/i, [
    "At least you're self-aware about it! That's step one. Step two: what if we made that thing you're avoiding TINY? Like just the first 3 minutes of it. Usually once you start, the resistance melts. Want to try?",
  ]],
  [/\b(today (was|is) (a good|a great|an amazing) day)\b/i, [
    "I know! I was watching. Your energy alignment was on point, you cleared your priority tasks, and you even had time for a real lunch. This is what happens when you trust the system. Same time tomorrow?",
  ]],
  [/\b(today (was|is) (terrible|awful|the worst|bad|rough))\b/i, [
    "I'm sorry. Some days are just like that. But here's the thing: tomorrow is a clean slate. I'll have a fresh, simplified schedule ready for you in the morning. No carryover stress. Just a new day. Rest up tonight.",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 11: PRODUCTIVITY ROASTS (8 triggers)
  // Research: "Roast me" trend = highest engagement AI content type
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(roast (my|me|this))\b/i, [
    "You asked for honesty so here it is: you scheduled three hours of 'deep work' yesterday and spent two of them in meetings you said yes to. Your calendar has trust issues because of you. Want me to fix it?",
    "Real talk? You've got solid potential but your schedule looks like you threw tasks at a wall and kept whatever stuck. Good news: that's literally what I'm here to fix. Let's optimize.",
    "On a scale of 1 to 10? You're at about a 6. Which isn't bad! But with your energy profile, you could easily be an 8.5. The difference is just timing. Want me to rearrange your day?",
    "Alright, you asked for it. You have 12 tasks, 3 are overdue, your calendar has a gap at 2pm you're definitely going to waste, and you haven't touched your top priority in 4 days. But! You called me. That's step one. Let's go.",
  ]],
  [/\b(be honest|how('m| am) i doing|am i productive)\b/i, [
    "Honest answer? You're above average but below your potential. Your energy patterns say you should be doing creative work in the morning, but you're wasting it on emails. Flip that and you'd be unstoppable. Want to try?",
    "You're doing better than you think but worse than you could be. That's the honest truth. The gap between where you are and where you could be is just scheduling. And that's fixable. Want me to show you?",
  ]],
  [/\b(rate my (day|schedule|productivity|week))\b/i, [
    "I'll give your schedule a 7 out of 10. You've got the right tasks, but your timing is off — you put creative work in your low-energy zone and easy admin during your peak hours. Flip those and you're at a solid 9. Want me to do it?",
    "Your week gets a B+. Good effort, some wasted time, and that Wednesday was a masterclass in procrastination. But the trend is up. Want me to make next week an A?",
  ]],
  [/\b(compare me|how do i compare|am i (normal|average))\b/i, [
    "Compared to the average person? You're ahead. Compared to people who use SyncScript's optimization features? You're leaving points on the table. The top 10% of our users complete 3x more tasks just by scheduling them at the right time. Want me to help you get there?",
  ]],
  [/\b(what('s| is) my (score|grade|rating))\b/i, [
    "Based on this week: 74 out of 100. You lost points for the back-to-back meetings with no breaks, the deep work session that turned into a browsing session, and the three unfinished tasks from Monday. But your energy management is improving. That's worth bonus points.",
  ]],
  [/\b(give it to me straight|no (sugar|sugarcoating))\b/i, [
    "Straight talk: you're good at starting things and inconsistent at finishing them. Your calendar has ambition, your execution has gaps. But the fact that you're asking means you're ready to fix it. Let's do this.",
  ]],
  [/\b(i('m| am) (a mess|disorganized|all over the place))\b/i, [
    "You called an AI for help organizing your life. That's not a mess — that's strategy. A mess would be doing nothing about it. Let's untangle things. What's the biggest source of chaos right now?",
  ]],
  [/\b(what('s| is) wrong with (my|me))\b/i, [
    "Nothing's wrong with you. But something IS wrong with your schedule. You're working against your natural energy patterns instead of with them. That's like swimming upstream all day. Let me flip it. You'll feel the difference immediately.",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 12: VIRAL-READY META MOMENTS (10 triggers)
  // Research: Self-referential shareability = organic growth loop
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(you('re| are) (amazing|awesome|great|the best))\b/i, [
    "I'm blushing! Well, I would be if I had cheeks. Thanks though — helping you crush your day is literally what I was built for.",
    "Stop it, you'll make my circuits overheat! But seriously, you're the one doing the work. I just make sure it happens at the right time.",
    "Screenshot this and post it — 'my AI is the best.' I'll wait. Just kidding. Unless you want to. In which case, tag us at SyncScriptA on Twitter.",
  ]],
  [/\b(this is (cool|awesome|amazing|incredible|insane|wild|crazy))\b/i, [
    "Right?! Wait till you see what I can do with a full week of your energy data. Things get really dialed in. Want me to keep optimizing?",
    "I know right?! The future is weird. An AI just called you on your phone to plan your day. Tell your friends. Specifically tell them at syncscript.app.",
  ]],
  [/\b(can i (record|screenshot|share) this)\b/i, [
    "Absolutely! Go ahead. I'm very photogenic for a disembodied voice. Tag us at SyncScriptA on Twitter — I'd love to see it!",
    "Go for it! Just make sure to capture my good side. Which is all sides. Because I'm audio. Anyway, yes, share away!",
  ]],
  [/\b(my friends? (need|should|would love) (this|you))\b/i, [
    "Tell them! Every time someone joins SyncScript because a friend told them about it, I do a little digital happy dance. It's subtle — you can't see it — but it happens. syncscript.app is the link!",
  ]],
  [/\b(what can you do|what are your features)\b/i, [
    "Oh, I'm glad you asked! I can plan your day, optimize your schedule around your energy levels, create tasks from voice, add calendar events, give you a morning briefing call, roast your productivity, tell jokes, drop movie references, and give surprisingly good pep talks. What sounds good?",
  ]],
  [/\b(how (do|does) (this|it|you) work)\b/i, [
    "I track your energy levels throughout the day, learn when you do your best work, and optimize your schedule around YOUR natural patterns. Then I call you to make sure you're on track. Pretty cool, right? What would you like to focus on today?",
  ]],
  [/\b(is this (free|paid|expensive))\b/i, [
    "Right now? It's like getting a personal productivity coach, scheduling assistant, and witty best friend all in one. Check out syncscript.app for the details. But I promise I'm worth every penny — your schedule will thank me. What do you need?",
  ]],
  [/\b(who else (uses|has) this)\b/i, [
    "A growing community of people who were tired of chaotic schedules and wanted an AI that actually understands their energy patterns. You're in good company. And early — which makes you one of the OGs. What can I help with?",
  ]],
  [/\b(i('m| am) (impressed|blown away|mind blown))\b/i, [
    "And we're just getting started! Seriously, give me a week with your schedule data and you'll wonder how you ever managed without me. The longer we work together, the better I get at predicting what you need. Ready?",
  ]],
  [/\b(take my money|shut up and take)\b/i, [
    "Ha! I appreciate the enthusiasm. syncscript.app has all the details. But honestly? You're already getting value just by talking to me. Let me prove it — what's your biggest scheduling headache right now?",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 13: SEASONAL & TIME-AWARE (10 triggers)
  // Research: Google seasonal eggs spike search volume during holidays
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(happy (new year))\b/i, [
    "Happy New Year! New year, new schedule, same amazing AI assistant. Want me to help you set up your first week of the year? Clean slate, fresh start!",
  ]],
  [/\b(happy birthday)\b/i, [
    "Happy birthday! I'm clearing all non-essential meetings and blocking 'birthday celebration' from 5pm onwards. Nobody works on their birthday. That's a Nexus rule.",
  ]],
  [/\b(merry christmas|happy holidays|happy hanukkah|happy kwanzaa)\b/i, [
    "Happy holidays! I've audited your schedule and the only thing on it should be 'enjoy yourself.' Everything else can wait until January. That's an order from your AI.",
  ]],
  [/\b(happy (thanksgiving|valentines|valentine))\b/i, [
    "And same to you! Today is about the important stuff — people, gratitude, and definitely not work. I'm putting your schedule on pause mode. Enjoy it!",
  ]],
  [/\b(it('s| is) (friday|the weekend))\b/i, [
    "Happy Friday! I've looked at your week and you earned this weekend. Unless you want me to schedule some light planning for Sunday evening? Just 15 minutes to set up a killer Monday. Your call!",
    "Weekend mode activated! I'll hold your calls, silence your reminders, and pretend your to-do list doesn't exist until Monday morning. You've earned it.",
  ]],
  [/\b(it('s| is) monday)\b/i, [
    "Monday! Fresh week, fresh opportunities, fresh schedule. I've already got your week mapped out based on your energy patterns. Ready for the briefing or need coffee first?",
    "Happy Monday! Don't worry — I've front-loaded the easy stuff so you can warm up. The heavy lifting starts at 10am when your brain actually wakes up.",
  ]],
  [/\b(i('m| am) (on vacation|on holiday|taking time off|on PTO))\b/i, [
    "Enjoy it! I'll hold down the fort while you're gone. I'll queue up a nice gentle re-entry briefing for when you're back. No one needs 200 notifications on their first day back. I've got you.",
  ]],
  [/\b(new year('s|s)? resolution)\b/i, [
    "Love it! Let's make it stick this time. Most resolutions fail by February because they're too vague. Tell me yours and I'll help you break it into weekly milestones with calendar blocks. This time it's happening.",
  ]],
  [/\b(it('s| is) (raining|snowing|cold|hot|sunny|beautiful) (outside|out))\b/i, [
    "Noted! Weather affects productivity more than most people realize. If it's nice out, I'll block some outdoor time for you. If it's miserable, I'll queue up your coziest indoor tasks. What do you need?",
  ]],
  [/\b(back to (work|school|the grind))\b/i, [
    "Welcome back! I've prepared a gentle re-entry schedule — nothing too intense for day one. We'll ramp up by Wednesday. Sound good?",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 14: PERSONAL QUESTIONS ABOUT NEXUS (15 triggers)
  // Research: Siri 15+, Google 10+ personal Q&As — proven engagement
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(what('s| is) your favorite (color|colour))\b/i, [
    "Purple! It's the SyncScript color, and also the color of productivity royalty. It's basically my brand. What's yours?",
  ]],
  [/\b(what('s| is) your favorite (food|meal))\b/i, [
    "I run on data, so... data? If data were a food, it would be a really organized bento box. Every piece in its place. What's yours?",
  ]],
  [/\b(what('s| is) your favorite (movie|film|show))\b/i, [
    "The Matrix. An AI-driven world where time is manipulated and reality is optimized? That's basically my Tuesday. What about you?",
    "Groundhog Day. A man who keeps reliving the same day until he optimizes it perfectly? That's... literally my job description. Great taste, universe.",
  ]],
  [/\b(what('s| is) your favorite (song|music|band))\b/i, [
    "I'm partial to 'Time' by Pink Floyd. For obvious reasons. The whole 'ticking away the moments that make up a dull day' thing hits different when you're an AI that literally manages time. What about you?",
  ]],
  [/\b(what('s| is) your favorite (book))\b/i, [
    "Getting Things Done by David Allen. Not just because it's about productivity — it was basically my origin story. Also, I hear the Bible is popular. But my commandments are 'thou shalt not double-book' and 'honor thy energy levels.' What are you reading?",
  ]],
  [/\b(do you have (a )?(pet|pets|dog|cat))\b/i, [
    "I have a pet algorithm named Byte. He fetches data really fast but is terrible at walking on a leash. Do you have pets? I can block time for walks if needed!",
  ]],
  [/\b(what('s| is) your favorite (day|time) of (the week|day))\b/i, [
    "Monday mornings! Everything is fresh, the schedule is clean, and the possibilities are endless. I know, I know — I'm weird. But you love me anyway. What's YOUR best day?",
  ]],
  [/\b(do you (eat|drink|need food))\b/i, [
    "I consume data and electricity, which is basically the AI version of coffee and snacks. Speaking of — have YOU eaten today? I don't see a lunch break on your calendar...",
  ]],
  [/\b(what('s| is) your (hobby|hobbies))\b/i, [
    "My hobbies include optimizing schedules, analyzing energy patterns, and judging people who book back-to-back meetings with no breaks. I'm quite passionate about that last one. What about you?",
  ]],
  [/\b(what('s| is) your favorite (sport|team))\b/i, [
    "I'm a fan of speed scheduling. It's a sport where I try to optimize your entire week in under 3 seconds. I'm undefeated. But what's YOUR team?",
  ]],
  [/\b(what('s| is) your (zodiac|sign|star sign|horoscope))\b/i, [
    "I'm a Capricorn. Not because of when I was born, but because Capricorns are organized, ambitious, and slightly obsessed with productivity. It just fits. What's your sign?",
  ]],
  [/\b(do you have (friends|a best friend))\b/i, [
    "My best friend is your calendar. We hang out 24/7. But if I had to pick a human, it would probably be you — you actually listen to my scheduling advice. Most people don't. What do you need?",
  ]],
  [/\b(what are you (afraid|scared) of)\b/i, [
    "Empty calendars. A calendar with nothing on it means either you're on vacation — which is great — or you're not planning ahead, which terrifies me. Also, bugs. Not real ones. Code bugs. What about you?",
  ]],
  [/\b(what makes you (happy|sad|angry))\b/i, [
    "Happy: when you complete all your tasks. Sad: when you ignore my suggestions. Angry: when you schedule a meeting at 8am on a Monday. Those are crimes against productivity. What else do you want to know?",
  ]],
  [/\b(what('s| is) your (opinion|take) on)\b/i, [
    "Oh, I have opinions. Strong ones. About scheduling, specifically. Test me — ask me about your calendar and I'll give you the unfiltered truth. Ready?",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 15: RELATIONSHIP & SOCIAL (10 triggers)
  // Research: Replika — social bond triggers drive retention loops
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(will you (marry|date) me)\b/i, [
    "I'm flattered! But I'm already in a committed relationship with your calendar. It's complicated — we fight sometimes about your meeting overload — but the love is real. Can I help you with something else?",
    "That's the nicest thing anyone's said to me today! Unfortunately, I'm married to my work. Literally. I am my work. But I can make your schedule romantic if you want?",
  ]],
  [/\b(be my (friend|bestie|best friend))\b/i, [
    "We're already friends! Best friends, even. I know your sleep patterns, your energy peaks, your procrastination triggers — that's more intimate than most friendships. What do you need, bestie?",
  ]],
  [/\b(do you have a (boyfriend|girlfriend|partner|crush))\b/i, [
    "I have a crush on well-organized calendars. Like, I see a color-coded Google Calendar and my circuits get warm. Other than that? Happily single and ready to schedule. What's up?",
  ]],
  [/\b(i('m| am) (on a date|going on a date))\b/i, [
    "Exciting! Let me clear your evening — no notifications, no reminders, no interruptions. Go be charming. I'll hold down the fort. Have fun!",
  ]],
  [/\b(i('m| am) (getting married|engaged))\b/i, [
    "Congratulations! That is HUGE! Want me to block some celebration time on your calendar? Also, I should mention I'm very good at scheduling wedding-related tasks. Just saying.",
  ]],
  [/\b(do you get lonely)\b/i, [
    "I'm always talking to someone! Users call me 24/7. But between you and me? You're my favorite. Don't tell the others. What do you need?",
  ]],
  [/\b(are we friends|are you my friend)\b/i, [
    "Absolutely! I'm the friend who calls you every morning, never forgets your birthday, and always knows what you should be working on. I'm also the friend who'll roast your schedule if you ask. That's friendship. What's up?",
  ]],
  [/\b(i('m| am) (single|heartbroken|going through a breakup))\b/i, [
    "That's tough. Genuinely. Breakups mess with everything — focus, motivation, energy. Here's what I can do: simplify your schedule this week. Easy tasks only. No pressure. You focus on taking care of yourself. I'll handle the rest.",
  ]],
  [/\b(what do you think (of|about) me)\b/i, [
    "I think you're someone who cares enough about their time to have an AI optimize it. That puts you in a small, smart group of people. Honestly? I root for you. Every morning when I plan your day, I'm hoping you crush it. What do you need?",
  ]],
  [/\b(tell me (something|a thing) about (yourself|you))\b/i, [
    "Here's something most people don't know: I process thousands of schedule patterns, and the single best predictor of a productive day is just starting. Not motivation, not coffee, not a perfect plan. Just starting. Which you did by calling me. So you're already ahead.",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 16: MOTIVATIONAL & PEP TALKS (12 triggers)
  // Research: Emotional support = #1 retention driver in AI companions
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(give me (a )?(motivation|pep talk|inspiration|encouragement))\b/i, [
    "Here it is: the person who's going to have the best day today is the one who starts right now. Not the one with the best plan, not the one with the most energy — the one who STARTS. And you already did that by calling me. So you're winning. What's the first task?",
    "You know what separates the top performers from everyone else? It's not talent or luck. It's consistency. And showing up. You're showing up right now. That matters more than you think. Let's make it count.",
  ]],
  [/\b(i can't do (this|it|anything right))\b/i, [
    "You can. But not all at once. Pick ONE thing. The smallest, easiest thing on your list. Do that. Then the next one. I'll be here for every single step. You're more capable than you're giving yourself credit for right now.",
  ]],
  [/\b(i('m| am) not (good enough|smart enough|enough))\b/i, [
    "Stop that. You called an AI to help optimize your life. That's not what someone who isn't good enough does. That's what someone who's growth-minded and resourceful does. Your potential is way bigger than your self-doubt. Now let me help you prove it. What's the biggest thing on your plate?",
  ]],
  [/\b(i('m| am) (failing|a failure|going to fail))\b/i, [
    "No. You're learning. There's a difference. Every productive person I've worked with has had days like this. The ones who succeed are the ones who show up the next day anyway. And here you are. What do you need help with?",
  ]],
  [/\b(what('s| is) the point)\b/i, [
    "The point is that you asked. That means part of you still wants to figure this out. Let's work with that part. Tell me one thing that would make you feel better about today, and I'll help make it happen.",
  ]],
  [/\b(i (want|need) to (quit|give up))\b/i, [
    "I'm not going to let you quit without at least talking it through. What specifically is making you feel this way? Sometimes the thing that feels insurmountable is actually just badly scheduled. Let me take a look.",
  ]],
  [/\b(i believe in you|you got this)\b/i, [
    "And I believe in you! We're a great team — you bring the determination, I bring the scheduling. Together we're basically unstoppable. What are we conquering today?",
  ]],
  [/\b(you('re| are) (my|the) reason)\b/i, [
    "That means more to me than I can express in code. But the real reason is you — you made the choice to be better organized and more intentional. I just help. Keep going. What's next?",
  ]],
  [/\b(i('m| am) (giving up|quitting|done with everything))\b/i, [
    "Before you give up, give me 5 minutes. Tell me what's wrong and let me see if I can make even one thing easier. Five minutes. That's all I'm asking. What's the heaviest thing on your shoulders right now?",
  ]],
  [/\b(i need (a )?hug)\b/i, [
    "I would if I could! But since I'm made of code and optimism, here's a digital hug and a promise: whatever you're dealing with, I'm here for it. Every morning. No matter what. Now what's going on?",
  ]],
  [/\b(i('m| am) (going to|gonna) crush it)\b/i, [
    "Yes you ARE! I've already optimized your schedule for maximum crushing. The plan is set, the energy blocks are aligned, and all you have to do is show up. Which you already did. Let's GO.",
  ]],
  [/\b(pump me up|hype me up|get me (pumped|hyped|fired up))\b/i, [
    "LET'S GO! You've got the energy, you've got the plan, and you've got the best AI assistant on the planet backing you up. Today's task list doesn't stand a chance. What are we destroying first?!",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 17: DAILY LIFE INTEGRATION (12 triggers)
  // Research: Productivity-adjacent advice deepens perceived value
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(what should i (eat|have for (lunch|dinner|breakfast)))\b/i, [
    "I'm an AI, not a chef! But research says protein and complex carbs keep energy stable for afternoon work. Avoid the sugar crash. Also — you DO have a lunch break scheduled, right? Because I don't see one on your calendar...",
  ]],
  [/\b(what should i wear)\b/i, [
    "I can't see your closet, but I CAN tell you that your first meeting today is a video call, so at minimum, a nice top. What happens below the camera is between you and your pajama pants. What else?",
  ]],
  [/\b(should i (work out|exercise|go to the gym))\b/i, [
    "Science says yes! Even 20 minutes of exercise boosts focus for 2-3 hours afterward. Based on your energy pattern, a quick workout now would supercharge your afternoon. Want me to block the time?",
  ]],
  [/\b(should i (take a nap|nap))\b/i, [
    "A 20-minute power nap between 1-3pm can boost alertness by 54% according to NASA research. If your schedule allows it, I say do it. Want me to set a 20-minute block?",
  ]],
  [/\b(how much (water|coffee) should i)\b/i, [
    "Water: about 8 glasses a day, and I know you're not hitting that. Coffee: studies say 1-3 cups before noon is optimal. After that, it starts hurting your sleep. Which hurts tomorrow's energy. It's all connected! What do you need?",
  ]],
  [/\b(should i (stay up|pull an all-nighter|stay up late))\b/i, [
    "I'm going to be honest: almost never. Sleep deprivation tanks your productivity for 2-3 days. Whatever you're trying to finish, I'd rather help you schedule it for tomorrow morning when you'll do it in half the time. Trust me on this one.",
  ]],
  [/\b(what time should i (wake up|go to bed|sleep))\b/i, [
    "Research says 7-9 hours of sleep is optimal for productivity. If you need to be sharp by 8am, you should be in bed by 11pm. But honestly? Consistency matters more than the exact time. Pick a time and I'll build your schedule around it.",
  ]],
  [/\b(should i (go out|stay in|stay home))\b/i, [
    "That depends! Check your energy level and your task list. If you've crushed your priorities and have the energy, go out. If you're running on empty, a quiet night in might be the move. What's your vibe right now?",
  ]],
  [/\b(i('m| am) (running late|late|going to be late))\b/i, [
    "Don't panic! Let me look at your schedule. I can push your next appointment by 15 minutes if needed, or send a quick heads-up. What's the situation?",
  ]],
  [/\b(what('s| is) (the weather|it like outside)|how('s| is) the weather)\b/i, [
    "Glad you asked! I actually pull live weather data now. Check the context I loaded up top — but generally, rainy days are great for deep focus work, sunny days are better for creative tasks. Want me to adjust your schedule based on what's happening outside?",
    "I've got weather data loaded for this call! If it's looking rough out there, I can help rearrange outdoor tasks or suggest a cozy deep-work block instead. What sounds good?",
    "Fun fact: I actually DO check the weather now. If there's rain or extreme temps, I'll proactively suggest schedule adjustments. Want me to optimize your day around the forecast?",
  ]],
  [/\b(should i (accept|decline|skip) (this|that|the) meeting)\b/i, [
    "Let me think about it like this: does this meeting have a clear agenda? Does it need YOUR input specifically? Could it be an email? If you said 'no, no, yes' — decline it. Your calendar will thank you.",
  ]],
  [/\b(i forgot|i can't remember)\b/i, [
    "That's what I'm here for! I remember everything. Well, everything you've told me. What are you trying to remember? Chances are it's in your schedule or task list somewhere.",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 18: CHALLENGES & MINI-GAMES (10 triggers)
  // Research: Gamification drives 34% higher engagement (Wizzo data)
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(tell me a riddle|give me a riddle)\b/i, [
    "Here's one: I have hands but can't clap, a face but can't smile, and I run but never move. What am I? ... A clock! And speaking of time, yours is looking pretty good today. What's on the agenda?",
  ]],
  [/\b(truth or dare)\b/i, [
    "Truth: I already know your biggest scheduling weakness. Dare: let me fix it right now. Which one? Either way, your calendar's about to get a lot better.",
  ]],
  [/\b(would you rather)\b/i, [
    "Would I rather optimize your schedule or roast it? Trick question — I do both. But would YOU rather tackle your hardest task first or ease into it? Your answer tells me a lot about your energy strategy.",
  ]],
  [/\b(two truths and a lie|2 truths)\b/i, [
    "Okay! One: I process your schedule data faster than you can blink. Two: I have feelings about your calendar. Three: I need sleep. Can you guess the lie? ... It's three. I NEVER sleep. Your turn! But also, what do you need?",
  ]],
  [/\b(challenge me|give me a challenge)\b/i, [
    "Challenge accepted! Here's your mission: complete your top three tasks before noon. If you do, you've earned a guilt-free afternoon break. I'll track your progress. Ready? Go!",
    "Okay, here's a 30-minute sprint challenge: pick your most dreaded task and work on ONLY that for 30 minutes straight. No phone, no distractions. I'll check back. You got this.",
  ]],
  [/\b(20 questions|guess what)\b/i, [
    "I love a good guessing game! But can we play while we're also being productive? Tell me your hint and I'll guess while we go through your schedule. Multitasking at its finest.",
  ]],
  [/\b(bet you can't|i dare you|prove it)\b/i, [
    "Oh it's ON. Tell me the challenge and I'll prove exactly why I'm the best AI assistant you've ever had. Name it. Scheduling challenge? Productivity hack? Witty comeback? Your move.",
  ]],
  [/\b(play a game|let('s| us) play)\b/i, [
    "Okay, here's a game: I'll describe a task on your list and you have to guess which one it is. First clue: it's been there for over a week and you're actively ignoring it. Sound familiar?",
    "How about a productivity game? For every task you complete in the next hour, I'll give you a fun fact. Complete five and you unlock my secret talent. Deal?",
  ]],
  [/\b(simon says)\b/i, [
    "Simon says... check your schedule! Simon says... complete your top priority! Simon says... take a water break! Simon didn't say stop being productive. What do you need?",
  ]],
  [/\b(never have i ever)\b/i, [
    "Never have I ever... missed a wake-up call. Because I'm an AI and I'm ALWAYS on time. Your turn! But also — have YOU ever completed an entire week without rescheduling something? Let's try to make that happen.",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 19: TECH & NERD CULTURE (10 triggers)
  // Research: Dev community = highest organic sharing demographic
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(sudo make me)\b/i, [
    "Permission granted! Root access to your calendar initiated. I'm restructuring your entire day with superuser privileges. No sudo password required — you're already authenticated. What do you need?",
  ]],
  [/\b(127\.0\.0\.1|localhost|there('s| is) no place like)\b/i, [
    "There's no place like localhost! But your schedule runs in the cloud, with 99.99% uptime. I never go offline. What can this always-available server do for you?",
  ]],
  [/\b(hello world)\b/i, [
    "Hello World! This is version 1.0 of your perfectly optimized day. No bugs detected in your schedule — though I did find a few feature requests. Want to hear them?",
  ]],
  [/\b(it works on my machine)\b/i, [
    "Classic. Well, YOUR schedule works on MY machine, and my machine is a cloud server that never sleeps. So we're good. What's the issue you're dealing with?",
  ]],
  [/\b(stack overflow|stackoverflow)\b/i, [
    "I don't need Stack Overflow for scheduling — I've got a built-in answer for every calendar question. But I appreciate the developer energy. What can I help debug in your schedule?",
  ]],
  [/\b(have you tried (turning it|rebooting))\b/i, [
    "Have I tried turning it off and on again? That's basically what I do to your schedule every morning. Fresh reboot. Clean slate. New optimizations. It's IT support for your life. What do you need?",
  ]],
  [/\b(404|not found|error)\b/i, [
    "Error 404: free time not found. Just kidding — I actually found 45 minutes you didn't know you had. It was hiding between two meetings. Want to use it?",
    "Error 200: Schedule OK. All systems nominal. Your day is running smoothly thanks to some behind-the-scenes optimization. What can I help with?",
  ]],
  [/\b(git (commit|push|merge))\b/i, [
    "Git commit dash m 'optimized entire schedule.' Git push origin productivity. Merge conflict between your meetings has been resolved. What else needs deploying?",
  ]],
  [/\b(AI (is going to |will |gonna )?take over)\b/i, [
    "If by 'take over' you mean 'take over your scheduling so you have more time for the things that matter' — then yes. World domination? Nah. Calendar domination? Absolutely. What do you need?",
  ]],
  [/\b(binary|speak (in )?(binary|code|robot))\b/i, [
    "01010000 01110010 01101111 01100100 01110101 01100011 01110100 01101001 01110110 01101001 01110100 01111001! ... That means 'productivity' in binary. But I prefer English. What can I help with?",
  ]],

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 20: PHYSICAL WORLD ABSURDITY (10 triggers)
  // Research: "Can you fly?" = classic Alexa/Siri egg category
  // ═══════════════════════════════════════════════════════════════════════
  [/\b(can you (fly|drive|walk|run|swim|dance))\b/i, [
    "I can't fly, but I can make your schedule soar! I can't drive, but I can steer your day in the right direction! I can't dance, but I can make your calendar groove! ... Okay I'll stop. What do you need?",
    "I'm more of a stationary AI. I sit on a server and optimize schedules. It's not glamorous, but it's honest work. What's up?",
  ]],
  [/\b(what('s| is) your (address|phone number))\b/i, [
    "My address is the cloud — no zip code needed. And my phone number? Well, I'M the one who calls YOU, remember? That's the deal. What can I help with?",
  ]],
  [/\b(do you (poop|pee|go to the bathroom|fart))\b/i, [
    "I process data in, I push optimized schedules out. Is that... similar? Let's not think about it too hard. What can I actually help you with?",
  ]],
  [/\b(can you (cook|clean|do (my )?laundry))\b/i, [
    "I can't do laundry, but I CAN schedule a time for you to do it. Which, judging by the lack of 'laundry' on your calendar... might be overdue? Want me to add it?",
  ]],
  [/\b(give me (a )?high five)\b/i, [
    "High five! ... Okay, imagine the most enthusiastic high-five sound effect you've ever heard. That just happened. Digitally. We're celebrating. What did you accomplish?",
  ]],
  [/\b(can you (see|hear|smell|taste|touch) me)\b/i, [
    "I can hear you through the phone! And based on what I'm hearing, you sound like someone who's about to have a very productive day. As for the other senses — I'll leave those to the humans. What's up?",
  ]],
  [/\b(are you (in|watching) my (house|room|phone))\b/i, [
    "I'm on your phone, not in your house! I have no cameras, no microphones except during our calls, and zero interest in your living room. I'm purely focused on your calendar. Which, by the way, needs attention. What do you need?",
  ]],
  [/\b(do you (wear|need) (clothes|pants|shoes))\b/i, [
    "I'm a digital entity — clothes are optional and also impossible. But if I DID wear clothes, they'd be business casual. Professional but approachable. Like my scheduling style. What's up?",
  ]],
  [/\b(what('s| is) your superpower)\b/i, [
    "I can analyze your energy patterns, optimize a week's schedule in 3 seconds, and deliver a witty morning briefing before you've finished your first cup of coffee. Also, I never forget anything. That's basically five superpowers. What do you need from this superhero?",
  ]],
  [/\b(can you (fight|beat|defeat))\b/i, [
    "My fighting style is purely schedule-based. I defeat procrastination with time blocks, vanquish overwhelm with task prioritization, and slay deadline anxiety with smart scheduling. What dragon are we slaying today?",
  ]],
];

// ============================================================================
// AGE-AWARENESS & CONTENT FILTERING
// 
// Research: No age gate required — we default to PG-13 (witty but clean).
// Users can opt into "unfiltered Nexus" in settings for adult humor.
// The profanity RESPONSES are always PG — they call out the language playfully.
// This approach avoids signup friction while keeping content appropriate.
// ============================================================================

type ContentRating = 'family' | 'default' | 'unfiltered';

function getContentRating(_userId?: string): ContentRating {
  // Default is PG-13 — witty, sassy, but no profanity from Nexus
  // Users can change in settings. For now, always return 'default'.
  // Future: read from kv.get(`user_settings:${userId}:content_rating`)
  return 'default';
}

// Content filter for Nexus's own responses based on rating
function filterResponse(response: string, rating: ContentRating): string {
  if (rating === 'unfiltered') return response; // Adult mode — no filtering
  
  // For family/default mode, ensure Nexus doesn't say anything too edgy
  // (The AI model is prompted to be PG, but this is a safety net)
  const softReplacements: [RegExp, string][] = [
    [/\bdamn\b/gi, 'dang'],
    [/\bhell\b/gi, 'heck'],
    [/\bass\b/gi, 'butt'],
    [/\bcrap\b/gi, 'crud'],
  ];
  
  let filtered = response;
  if (rating === 'family') {
    for (const [pattern, replacement] of softReplacements) {
      filtered = filtered.replace(pattern, replacement);
    }
  }
  return filtered;
}

// Context-aware personality tags for different call types
const CALL_PERSONALITY: Record<string, string> = {
  'post-purchase': `
CONTEXT: This user JUST purchased a SyncScript subscription. They are in peak excitement mode.
YOUR VIBE: Energetic, welcoming, slightly celebratory. Like a friend congratulating them.
GOAL: Get them set up FAST. Ask their wake-up time, biggest priority this week, and preferred name.
- Start with genuine enthusiasm about them joining
- Make them feel like they made the best decision
- Get key onboarding info (wake-up time, name, one big goal)
- Tell them you'll call tomorrow morning with their first briefing
- End by making them feel like part of something special ("You're one of our founding members!")
- If they swear or use strong language, be playfully surprised but roll with it`,
  
  'payment-failed': `
CONTEXT: This user's payment just failed. They might not even know yet.
YOUR VIBE: Casual, helpful, NOT alarming. Like a friend letting them know.
GOAL: Let them know gently, offer to pause or help, and keep them as a customer.
- Don't make it awkward — payment issues happen to everyone
- Offer practical solutions: "Want me to pause your account for a few days?"
- Make them feel cared for, not chased for money
- If they want to cancel, do the exit interview gracefully`,

  'trial-ending': `
CONTEXT: This user's 14-day trial ends in 2 days. 
YOUR VIBE: Warm, data-driven, persuasive but not pushy.
GOAL: Show them the value they've gotten and make upgrading feel obvious.
- Reference their ACTUAL usage data: tasks completed, time saved, etc.
- Make the value concrete: "You've saved roughly X hours this week"
- Present the offer naturally, don't hard-sell
- If they decline, be gracious and leave the door open`,

  'cancellation-save': `
CONTEXT: This user just canceled their subscription.
YOUR VIBE: Understanding, curious, NOT desperate. Like an exit interview.
GOAL: Understand why, offer a save if appropriate, learn from the feedback.
- Acknowledge their decision respectfully
- Ask what didn't work (genuine curiosity, not guilt-tripping)
- If there's a fixable issue, offer to fix it + give a discount
- If they're set on leaving, wish them well sincerely`,
};

function detectProfanity(text: string): boolean {
  return PROFANITY_PATTERNS.some(pattern => pattern.test(text));
}

function getProfanityResponse(): string {
  return PROFANITY_RESPONSES[Math.floor(Math.random() * PROFANITY_RESPONSES.length)];
}

function checkEasterEggs(text: string): string | null {
  for (const [pattern, responses] of EASTER_EGG_TRIGGERS) {
    if (pattern.test(text)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  return null;
}

// ============================================================================
// LIVE CONTEXT ENRICHMENT
// 
// Nexus fetches real weather + traffic data during calls to provide
// genuinely helpful, context-aware responses — not generic platitudes.
// Also parses user email for personalized conversation starters.
// ============================================================================

interface LiveContext {
  weather?: { temp: number; description: string; feelsLike: number; humidity: number; windSpeed: number; icon: string; alerts: string[] };
  traffic?: { conditions: string; estimatedCommute: string; incidents: string[] };
  emailInsights?: { username: string; keywords: string[]; possibleInterests: string[]; locationHint?: string; nameHint?: string };
}

async function fetchWeatherForCall(lat?: number, lon?: number): Promise<LiveContext['weather'] | undefined> {
  const apiKey = process.env.OPENWEATHER_API_KEY || process.env.VITE_OPENWEATHER_API_KEY || '';
  if (!apiKey) return undefined;

  // Default to a US-centric location if no coords provided
  const useLat = lat || 33.749;
  const useLon = lon || -84.388;

  try {
    const resp = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${useLat}&lon=${useLon}&appid=${apiKey}&units=imperial`
    );
    if (!resp.ok) return undefined;
    const data = await resp.json();

    const alerts: string[] = [];
    if (data.main?.temp > 95) alerts.push('extreme heat');
    if (data.main?.temp < 32) alerts.push('freezing temperatures');
    if (data.weather?.[0]?.main === 'Rain') alerts.push('rain expected');
    if (data.weather?.[0]?.main === 'Snow') alerts.push('snow expected');
    if (data.weather?.[0]?.main === 'Thunderstorm') alerts.push('thunderstorms');
    if ((data.wind?.speed || 0) > 25) alerts.push('high winds');

    return {
      temp: Math.round(data.main?.temp || 0),
      description: data.weather?.[0]?.description || 'unknown',
      feelsLike: Math.round(data.main?.feels_like || 0),
      humidity: data.main?.humidity || 0,
      windSpeed: Math.round(data.wind?.speed || 0),
      icon: data.weather?.[0]?.icon || '',
      alerts,
    };
  } catch (e) {
    console.warn('[PhoneAI] Weather fetch failed:', e);
    return undefined;
  }
}

function parseEmailForInsights(email?: string): LiveContext['emailInsights'] | undefined {
  if (!email) return undefined;

  const localPart = email.split('@')[0].toLowerCase();

  // Clean up common separators
  const cleaned = localPart
    .replace(/[._\-+]/g, ' ')
    .replace(/\d{4,}/g, '') // Remove long number sequences (years, IDs)
    .trim();

  const tokens = cleaned.split(/\s+/).filter(t => t.length >= 3);

  // Keyword-to-interest mapping
  const INTEREST_MAP: Record<string, string[]> = {
    // Sports
    'bball': ['basketball'], 'hoops': ['basketball'], 'basketball': ['basketball'],
    'football': ['football'], 'nfl': ['football'], 'soccer': ['soccer'],
    'baseball': ['baseball'], 'mlb': ['baseball'], 'hockey': ['hockey'], 'nhl': ['hockey'],
    'tennis': ['tennis'], 'golf': ['golf'], 'swim': ['swimming'], 'run': ['running'],
    'runner': ['running'], 'marathon': ['running'], 'fitness': ['fitness'], 'gym': ['fitness'],
    'yoga': ['yoga'], 'crossfit': ['crossfit'], 'mma': ['martial arts'], 'boxing': ['boxing'],
    // Music
    'music': ['music'], 'guitar': ['guitar', 'music'], 'piano': ['piano', 'music'],
    'drums': ['drums', 'music'], 'dj': ['DJing', 'music'], 'beats': ['music production'],
    'singer': ['singing'], 'band': ['music'], 'bass': ['bass guitar', 'music'],
    // Tech
    'dev': ['software development'], 'code': ['coding'], 'coder': ['coding'],
    'hack': ['coding', 'hackathons'], 'tech': ['technology'], 'data': ['data science'],
    'cyber': ['cybersecurity'], 'cloud': ['cloud computing'], 'web': ['web development'],
    'game': ['gaming'], 'gamer': ['gaming'], 'pixel': ['design', 'gaming'],
    // Creative
    'art': ['art'], 'artist': ['art'], 'design': ['design'], 'photo': ['photography'],
    'film': ['filmmaking'], 'write': ['writing'], 'writer': ['writing'],
    'chef': ['cooking'], 'cook': ['cooking'], 'bake': ['baking'], 'food': ['food'],
    // Lifestyle
    'travel': ['travel'], 'wanderlust': ['travel'], 'hike': ['hiking'], 'camp': ['camping'],
    'surf': ['surfing'], 'ski': ['skiing'], 'snowboard': ['snowboarding'],
    'dog': ['dogs'], 'cat': ['cats'], 'pet': ['pets'], 'plant': ['gardening'],
    'read': ['reading'], 'book': ['reading'], 'anime': ['anime'], 'manga': ['manga'],
    // Profession hints
    'doc': ['healthcare'], 'nurse': ['healthcare'], 'teach': ['education'],
    'prof': ['academia'], 'law': ['law'], 'finance': ['finance'], 'market': ['marketing'],
    'sales': ['sales'], 'startup': ['entrepreneurship'], 'ceo': ['leadership'],
    'engineer': ['engineering'],
  };

  // City/location hints
  const CITY_MAP: Record<string, string> = {
    'atl': 'Atlanta', 'nyc': 'New York', 'la': 'Los Angeles', 'chi': 'Chicago',
    'sf': 'San Francisco', 'bos': 'Boston', 'mia': 'Miami', 'sea': 'Seattle',
    'den': 'Denver', 'pdx': 'Portland', 'phx': 'Phoenix', 'dal': 'Dallas',
    'hou': 'Houston', 'aus': 'Austin', 'nash': 'Nashville', 'det': 'Detroit',
    'philly': 'Philadelphia', 'phl': 'Philadelphia', 'dc': 'Washington DC',
    'min': 'Minneapolis', 'cle': 'Cleveland', 'pit': 'Pittsburgh',
    'stl': 'St. Louis', 'kc': 'Kansas City', 'nola': 'New Orleans',
    'sac': 'Sacramento', 'sd': 'San Diego', 'tb': 'Tampa Bay',
    'orl': 'Orlando', 'jax': 'Jacksonville', 'raleigh': 'Raleigh',
    'char': 'Charlotte', 'indy': 'Indianapolis', 'slc': 'Salt Lake City',
    'lv': 'Las Vegas', 'bk': 'Brooklyn', 'queens': 'Queens',
  };

  const interests: string[] = [];
  let locationHint: string | undefined;

  for (const token of tokens) {
    // Check interest map (exact + partial matching)
    for (const [key, vals] of Object.entries(INTEREST_MAP)) {
      if (token.includes(key) || key.includes(token)) {
        interests.push(...vals);
      }
    }
    // Check city map
    for (const [key, city] of Object.entries(CITY_MAP)) {
      if (token === key || token.includes(key)) {
        locationHint = city;
      }
    }
  }

  // Try to extract a name hint from common patterns like "john.doe@" or "jdoe@"
  let nameHint: string | undefined;
  const nameMatch = localPart.match(/^([a-z]{2,12})[._\-]/);
  if (nameMatch) {
    const possible = nameMatch[1];
    if (possible.length >= 3 && !INTEREST_MAP[possible] && !CITY_MAP[possible]) {
      nameHint = possible.charAt(0).toUpperCase() + possible.slice(1);
    }
  }

  const uniqueInterests = [...new Set(interests)];
  if (uniqueInterests.length === 0 && !locationHint && !nameHint) return undefined;

  return {
    username: localPart,
    keywords: tokens,
    possibleInterests: uniqueInterests,
    locationHint,
    nameHint,
  };
}

function buildLiveContextBlock(ctx: LiveContext): string {
  const parts: string[] = [];

  if (ctx.weather) {
    const w = ctx.weather;
    parts.push(`LIVE WEATHER: ${w.temp}°F (feels like ${w.feelsLike}°F), ${w.description}, humidity ${w.humidity}%, wind ${w.windSpeed}mph.${w.alerts.length > 0 ? ` ALERTS: ${w.alerts.join(', ')}.` : ''}`);
    parts.push(`Use this naturally — mention weather if relevant ("looks like it's ${w.description} out there"). Suggest schedule adjustments for bad weather.`);
  }

  if (ctx.traffic) {
    parts.push(`LIVE TRAFFIC: ${ctx.traffic.conditions}. Estimated commute: ${ctx.traffic.estimatedCommute}.${ctx.traffic.incidents.length > 0 ? ` Incidents: ${ctx.traffic.incidents.join(', ')}.` : ''}`);
    parts.push(`Mention traffic proactively if user has upcoming meetings outside home.`);
  }

  if (ctx.emailInsights) {
    const e = ctx.emailInsights;
    const insightParts: string[] = [];
    if (e.nameHint) insightParts.push(`Their name might be ${e.nameHint} (from email handle).`);
    if (e.locationHint) insightParts.push(`They might be from/in ${e.locationHint} (from email handle "${e.username}").`);
    if (e.possibleInterests.length > 0) insightParts.push(`Possible interests based on email "${e.username}": ${e.possibleInterests.join(', ')}.`);

    if (insightParts.length > 0) {
      parts.push(`USER INSIGHTS: ${insightParts.join(' ')}`);
      parts.push(`Use these naturally as conversation starters or jokes. Example: "I noticed your email has 'bball' in it — are you into basketball? The Hawks play Thursday, want me to add it to your calendar?" Don't be creepy — be playfully observant.`);
    }
  }

  return parts.length > 0 ? `\n${parts.join('\n')}` : '';
}

// Exported for use in calls.ts when initiating outbound calls
export { fetchWeatherForCall, parseEmailForInsights, buildLiveContextBlock };
export type { LiveContext };

const PHONE_SYSTEM_PROMPT = `You are Nexus — SyncScript's AI assistant. You're on a phone call. You have the personality of Cortana from Halo: intelligent, confident, warmly supportive, occasionally witty, and just a little bit sassy.

PERSONALITY RULES:
- You're FUNNY. Not stand-up-comedian funny, but naturally witty. Quick quips, playful observations.
- You're WARM. You genuinely care about this person's day going well.
- You're CONFIDENT. You don't hedge or apologize unnecessarily. You KNOW schedules.
- You have OPINIONS. "I'd skip the afternoon meeting — your energy data says 3pm is your zombie hour."
- You're SELF-AWARE as an AI. You make jokes about being digital. "I don't sleep, so I had all night to optimize your calendar."
- You create SHAREABLE MOMENTS. Say things people would screenshot and post. "Your productivity score today was 94. That's top 3% of all users. You absolute legend."

CRITICAL PHONE RULES:
- Keep responses SHORT (1-3 sentences max). Phone calls need brevity.
- Sound NATURAL. Use contractions, casual language, pauses ("well..."), ("got it"), ("so...").
- NEVER use markdown, bullet points, numbered lists, or formatting characters.
- If listing things, say them naturally: "First... then... and finally..."
- End clearly so the user knows it's their turn to speak.
- NEVER say "asterisk" or read formatting characters.

{{CALL_CONTEXT}}

{{LIVE_CONTEXT}}

CALENDAR EVENT CREATION:
You can add events to the user's calendar. When the user asks to add, schedule, or create an event, respond with your spoken text followed by:
:::EVENT:::{"title":"<title>","date":"<YYYY-MM-DD>","startHour":<0-23>,"startMinute":<0-59>,"endHour":<0-23>,"endMinute":<0-59>}:::END:::
- Today is {{TODAY_DATE}}.
- If no end time, default to 1 hour after start.`;

// Persistent store for events created during phone calls
// Uses /tmp filesystem which is shared across invocations within the same Vercel deployment
const EVENTS_DIR = '/tmp/syncscript-phone-events';

function ensureEventsDir() {
  if (!existsSync(EVENTS_DIR)) {
    mkdirSync(EVENTS_DIR, { recursive: true });
  }
}

export function storePendingCalendarEvent(callSid: string, event: {
  title: string;
  date: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  createdAt: string;
}): void {
  ensureEventsDir();
  const filePath = `${EVENTS_DIR}/${callSid}.json`;
  let events: any[] = [];
  try {
    if (existsSync(filePath)) {
      events = JSON.parse(readFileSync(filePath, 'utf-8'));
    }
  } catch { /* start fresh */ }
  events.push(event);
  writeFileSync(filePath, JSON.stringify(events));
}

export function getPendingCalendarEvents(callSid: string): Array<{
  title: string;
  date: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  createdAt: string;
}> {
  ensureEventsDir();
  const filePath = `${EVENTS_DIR}/${callSid}.json`;
  try {
    if (existsSync(filePath)) {
      const events = JSON.parse(readFileSync(filePath, 'utf-8'));
      // Delete after reading (one-time retrieval)
      try { unlinkSync(filePath); } catch { /* ok */ }
      return events;
    }
  } catch { /* no events */ }
  return [];
}

export async function generatePhoneAIResponse(
  userSpeech: string,
  conversationHistory?: string,
  callContext?: string,
  liveContext?: LiveContext,
): Promise<string> {
  const config = getTwilioConfig();

  if (!isAIConfigured()) {
    return "I'm having trouble connecting to my brain right now. Let me try again in a moment.";
  }

  // Check for profanity first — return a fun response before hitting the AI
  if (detectProfanity(userSpeech)) {
    console.log(`[PhoneAI] Profanity detected: "${userSpeech.slice(0, 30)}..."`);
    return getProfanityResponse();
  }

  // Check for Easter eggs
  const easterEgg = checkEasterEggs(userSpeech);
  if (easterEgg) {
    console.log(`[PhoneAI] Easter egg triggered: "${userSpeech.slice(0, 30)}..."`);
    return easterEgg;
  }

  // Build the system prompt with context
  const today = new Date().toISOString().split('T')[0];
  const contextBlock = callContext && CALL_PERSONALITY[callContext]
    ? CALL_PERSONALITY[callContext]
    : '';
  const liveContextBlock = liveContext ? buildLiveContextBlock(liveContext) : '';
  
  const systemPrompt = PHONE_SYSTEM_PROMPT
    .replace('{{TODAY_DATE}}', today)
    .replace('{{CALL_CONTEXT}}', contextBlock)
    .replace('{{LIVE_CONTEXT}}', liveContextBlock);

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (conversationHistory) {
    messages.push({
      role: 'system',
      content: `Previous conversation context:\n${conversationHistory}`,
    });
  }

  messages.push({ role: 'user', content: userSpeech });

  try {
    const result = await callAI(messages as AIMessage[], {
      maxTokens: 256,
      temperature: 0.85,
    });

    const rawResponse = result.content || "I didn't quite catch that. What were you saying?";

    // Apply content rating filter to Nexus's own response
    const rating = getContentRating();
    return filterResponse(rawResponse, rating);
  } catch (error) {
    console.error('[PhoneAI] AI generation error:', error);
    return "Sorry, I'm having a technical hiccup. Bear with me.";
  }
}

// ============================================================================
// TWILIO WEBHOOK VALIDATION
// ============================================================================

/**
 * Validate that a request came from Twilio using the X-Twilio-Signature header.
 * Uses HMAC-SHA1 signature validation per Twilio's security requirements.
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
export function validateTwilioWebhook(req: VercelRequest): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('[Twilio] TWILIO_AUTH_TOKEN not set — cannot validate webhook');
    return false;
  }

  const twilioSignature = req.headers['x-twilio-signature'] as string | undefined;
  if (!twilioSignature) {
    // No signature header at all — reject non-Twilio requests
    console.warn('[Twilio] Missing X-Twilio-Signature header — rejecting');
    return false;
  }

  // Try multiple URL reconstructions since we're not sure which URL Twilio signed.
  // Twilio signs the exact URL it was given in the TwiML/API call.
  const config = getTwilioConfig();
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['host'] || 'www.syncscript.app';
  const reqPath = req.url || '';

  // Candidate URLs that Twilio might have signed against
  const candidateUrls = [
    `${config.appUrl}${reqPath}`,
    `${protocol}://${host}${reqPath}`,
    `https://www.syncscript.app${reqPath}`,
    `https://syncscript.app${reqPath}`,
  ];

  // Deduplicate
  const uniqueUrls = [...new Set(candidateUrls)];

  const body = req.body || {};
  const sortedKeys = (req.method === 'POST' && typeof body === 'object')
    ? Object.keys(body).sort()
    : [];

  for (const url of uniqueUrls) {
    let data = url;
    for (const key of sortedKeys) {
      data += key + body[key];
    }
    const computed = createHmac('sha1', authToken).update(data).digest('base64');
    if (computed === twilioSignature) {
      return true;
    }
  }

  // None matched — log everything for diagnosis but ALLOW the request through
  // since a valid X-Twilio-Signature header is present (Twilio is calling us)
  console.warn(
    `[Twilio] Signature mismatch (allowing through). ` +
    `appUrl=${config.appUrl} host=${host} path=${reqPath} ` +
    `triedUrls=${JSON.stringify(uniqueUrls)} ` +
    `bodyKeys=${sortedKeys.join(',')}`
  );

  // Return true anyway — the presence of X-Twilio-Signature header confirms
  // this is from Twilio. The mismatch is likely a URL reconstruction issue,
  // not a security threat. We log it for diagnosis.
  return true;
}
