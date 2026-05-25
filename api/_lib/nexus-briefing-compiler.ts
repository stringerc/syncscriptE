/**
 * Nexus Briefing Compiler — Generates structured briefing content for the
 * Nexus Daily Rhythm voice calls (7 AM / noon / 9 PM).
 *
 * Each compiler function produces a rich text block that the TwiML handler
 * speaks to the user, plus structured JSON for the DailyOpsModal to hydrate.
 *
 * Data flow:
 *   compileMorningBrief  → KV `nexus_rhythm_brief:morning:${userId}:${date}`
 *   compileNoonCheckIn   → KV `nexus_rhythm_brief:noon:${userId}:${date}`
 *   compileDebriefPrompt → KV `nexus_rhythm_brief:debrief:${userId}:${date}`
 */

import { callAI } from './ai-service.js';
import { kvGet, kvSet } from '../phone/_helpers.js';
import { getEmailBriefingBlock, isGmailConfigured } from './nexus-gmail-reader.js';

// ── Types ──────────────────────────────────────────────────────────

export interface MorningBriefResult {
  spokenText: string;
  memoryAnalysis: {
    completedItems: string[];
    pendingItems: string[];
    todayPriorities: string[];
  };
  emailInsights: {
    configured: boolean;
    count: number;
    highlights: string[];
  };
  generatedAt: string;
}

export interface NoonCheckInResult {
  spokenText: string;
  deferredQuestions: string[];
  progressNotes: string;
  offerDebriefCall: boolean;
  generatedAt: string;
}

export interface DebriefPromptResult {
  spokenIntro: string;
  questions: string[];
  generatedAt: string;
}

export interface VoiceDebriefData {
  wins: string[];
  reflection: string;
  tomorrow: string;
  capturedAt: string;
  capturedVia: 'nexus-voice';
}

// ── KV Key Helpers ─────────────────────────────────────────────────

function todayDateKey(): string {
  // EST timezone (UTC-5 / UTC-4 DST) — use America/New_York
  const now = new Date();
  const estStr = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  return estStr; // YYYY-MM-DD
}

export function rhythmBriefKey(cadence: string, userId: string): string {
  return `nexus_rhythm_brief:${cadence}:${userId}:${todayDateKey()}`;
}

export function rhythmDispatchedKey(cadence: string): string {
  return `nexus_rhythm_dispatched:${todayDateKey()}:${cadence}`;
}

export function deferredQuestionsKey(userId: string): string {
  return `nexus_deferred_questions:${userId}`;
}

export function voiceDebriefKey(userId: string): string {
  return `nexus_voice_debrief:${userId}:${todayDateKey()}`;
}

// ── Morning Brief Compiler ─────────────────────────────────────────

export async function compileMorningBrief(userId: string): Promise<MorningBriefResult> {
  const t0 = Date.now();

  // 1. Fetch email insights (parallel with other data)
  const isConfigured = await isGmailConfigured(userId);
  let emails: any[] = [];
  if (isConfigured) {
    const { fetchImportantEmails, extractEmailSummaries } = await import('./nexus-gmail-reader.js');
    const rawEmails = await fetchImportantEmails(userId);
    emails = extractEmailSummaries(rawEmails);
  }

  const [cachedHarmony, userProfile] = await Promise.all([
    kvGet(`harmony_brief:${userId}`),
    kvGet(`user_profile:${userId}`),
  ]);

  const userName = userProfile?.name || 'Boss';

  const emailResult = {
    configured: isConfigured,
    count: emails.length,
    block: emails.length > 0 
      ? `EMAILS (${emails.length} unread):\n${emails.map((e: any) => `- From: ${e.sender} | Subject: ${e.subject}`).join('\n')}`
      : 'No critical emails.'
  };

  // 2. Build the LLM prompt with all context
  const calendarContext = cachedHarmony?.text
    ? `EXISTING HARMONY BRIEFING (calendar/schedule data):\n${cachedHarmony.text}`
    : 'No calendar data available today.';

  const emailContext = emailResult.block;

  const prompt = `You are Nexus, an elite AI executive assistant with the tactical clarity and warmth of a trusted mission ops partner. You are compiling the 7:00 AM MORNING BRIEFING for ${userName}.

${calendarContext}

${emailContext}

INSTRUCTIONS:
1. Start with a warm, natural greeting — like a trusted chief of staff would ("Good morning, ${userName}. Here's what matters today.")
2. MEMORY STATUS: Summarize what's been accomplished recently and what's still pending. Be specific about items, not vague.
3. EMAIL TRIAGE: For each important email, state the sender, what it's about, whether it needs a response, and if there's a deadline. Go through them one by one conversationally — don't just list them.
4. TODAY'S PLAN: Recommend the top 3 priorities for today based on everything you see.
5. Ask if there's anything they want you to follow up on at the noon check-in.
6. Keep the entire brief under 90 seconds when spoken aloud (~225 words).
7. Tone: warm but efficient. You're Cortana-tier — not robotic, not overly casual.

Return ONLY valid JSON:
{
  "spokenText": "The full spoken briefing text",
  "completedItems": ["recent completed items"],
  "pendingItems": ["items still pending"],
  "todayPriorities": ["top 3 priorities"],
  "emailHighlights": ["one-line summary per important email"]
}`;

  try {
    const aiResult = await callAI([
      { role: 'system', content: 'You are an elite executive briefing system. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 1024, temperature: 0.3 });

    let parsed: any;
    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    const result: MorningBriefResult = {
      spokenText: parsed?.spokenText || aiResult.content,
      memoryAnalysis: {
        completedItems: parsed?.completedItems || [],
        pendingItems: parsed?.pendingItems || [],
        todayPriorities: parsed?.todayPriorities || [],
      },
      emailInsights: {
        configured: emailResult.configured,
        count: emailResult.count,
        highlights: parsed?.emailHighlights || [],
      },
      generatedAt: new Date().toISOString(),
    };

    // Cache for TwiML handler to pick up
    await kvSet(rhythmBriefKey('morning', userId), result);
    console.log(`[BriefingCompiler] Morning brief compiled in ${Date.now() - t0}ms, ${emailResult.count} emails`);

    return result;
  } catch (error) {
    console.error('[BriefingCompiler] Morning brief compilation failed:', error);
    const fallback: MorningBriefResult = {
      spokenText: `Good morning, ${userName}. I had a bit of trouble compiling your full briefing today, but I'm here and ready to help. What would you like to go over?`,
      memoryAnalysis: { completedItems: [], pendingItems: [], todayPriorities: [] },
      emailInsights: { configured: emailResult.configured, count: 0, highlights: [] },
      generatedAt: new Date().toISOString(),
    };
    await kvSet(rhythmBriefKey('morning', userId), fallback);
    return fallback;
  }
}

// ── Noon Check-In Compiler ─────────────────────────────────────────

export async function compileNoonCheckIn(userId: string): Promise<NoonCheckInResult> {
  const t0 = Date.now();

  const [morningBrief, deferredRaw, userProfile] = await Promise.all([
    kvGet(rhythmBriefKey('morning', userId)),
    kvGet(deferredQuestionsKey(userId)),
    kvGet(`user_profile:${userId}`),
  ]);

  const userName = userProfile?.name || 'Boss';
  const deferred: string[] = Array.isArray(deferredRaw) ? deferredRaw : [];

  const morningContext = morningBrief?.spokenText
    ? `MORNING BRIEF THAT WAS DELIVERED:\n${morningBrief.spokenText}`
    : 'No morning brief was delivered today.';

  const deferredContext = deferred.length > 0
    ? `DEFERRED QUESTIONS FROM MORNING CALL:\n${deferred.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : 'No deferred questions from this morning.';

  const prompt = `You are Nexus, compiling the 12:00 PM NOON CHECK-IN for ${userName}.

${morningContext}

${deferredContext}

INSTRUCTIONS:
1. Start casually: "Hey ${userName}, checking in at noon."
2. If there are deferred questions, ask them now — one at a time, conversationally.
3. Briefly check on progress against the morning priorities.
4. Ask if they want you to call at 9 PM tonight for the debrief.
5. Keep it under 45 seconds spoken (~110 words).
6. Tone: casual but purposeful — like a quick sync with a trusted teammate.

Return ONLY valid JSON:
{
  "spokenText": "Full spoken check-in text",
  "progressNotes": "Brief progress assessment",
  "offerDebriefCall": true
}`;

  try {
    const aiResult = await callAI([
      { role: 'system', content: 'You are an elite executive briefing system. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 512, temperature: 0.35 });

    let parsed: any;
    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    const result: NoonCheckInResult = {
      spokenText: parsed?.spokenText || aiResult.content,
      deferredQuestions: deferred,
      progressNotes: parsed?.progressNotes || '',
      offerDebriefCall: parsed?.offerDebriefCall !== false,
      generatedAt: new Date().toISOString(),
    };

    await kvSet(rhythmBriefKey('noon', userId), result);
    console.log(`[BriefingCompiler] Noon check-in compiled in ${Date.now() - t0}ms`);

    return result;
  } catch (error) {
    console.error('[BriefingCompiler] Noon check-in compilation failed:', error);
    const fallback: NoonCheckInResult = {
      spokenText: `Hey ${userName}, quick noon check-in. How's the day going so far? Anything you need help with? And should I call you at 9 tonight for the debrief?`,
      deferredQuestions: deferred,
      progressNotes: '',
      offerDebriefCall: true,
      generatedAt: new Date().toISOString(),
    };
    await kvSet(rhythmBriefKey('noon', userId), fallback);
    return fallback;
  }
}

// ── Debrief Prompt Compiler ────────────────────────────────────────

export async function compileDebriefPrompt(userId: string): Promise<DebriefPromptResult> {
  const t0 = Date.now();
  const userName = (await kvGet(`user_profile:${userId}`))?.name || 'Boss';

  // Fetch morning brief and noon check-in for context-aware debrief
  const dayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const morningBrief = await kvGet(rhythmBriefKey('morning', userId)) as MorningBriefResult | null;
  const noonCheckIn = await kvGet(rhythmBriefKey('noon', userId)) as NoonCheckInResult | null;

  const morningContext = morningBrief?.spokenText
    ? `Morning briefing summary: ${morningBrief.spokenText.slice(0, 300)}`
    : 'No morning briefing was compiled today.';
  const noonContext = noonCheckIn?.spokenText
    ? `Noon check-in summary: ${noonCheckIn.spokenText.slice(0, 300)}`
    : 'No noon check-in was compiled today.';

  const prompt = `You are Nexus, an AI daily debrief companion for ${userName}. It's 9 PM — time for the nightly debrief.

Context from earlier today:
${morningContext}
${noonContext}

Generate a personalized debrief opening and 3 reflective questions. Rules:
1. Reference what was planned this morning if available — ask about progress on those priorities.
2. If there were deferred questions from the noon check-in, incorporate them.
3. The spoken intro should be warm but purposeful — close out the day, not start a new one.
4. Questions should cover: wins, reflections, and tomorrow's intention.
5. Keep the intro under 60 seconds when spoken (~150 words).
6. Tone: warm, grounding, end-of-day energy. Not high-energy like the morning.

Return ONLY valid JSON:
{
  "spokenIntro": "Personalized opening that references today's specific context",
  "questions": ["Question 1 about wins", "Question 2 about reflections", "Question 3 about tomorrow"]
}`;

  try {
    const aiResult = await callAI([
      { role: 'system', content: 'You are an elite daily debrief system. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 768, temperature: 0.4 });

    let parsed: any;
    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    const result: DebriefPromptResult = {
      spokenIntro: parsed?.spokenIntro || `Good evening, ${userName}. Time for your nightly debrief — let's close out the day clean.`,
      questions: Array.isArray(parsed?.questions) && parsed.questions.length === 3
        ? parsed.questions
        : [
            'What did you accomplish today? What are your wins?',
            'How did the day go overall? Any reflections — what worked, what didn\'t, how are you feeling?',
            'What do you want to accomplish tomorrow? What\'s the one thing that would make tomorrow a win?',
          ],
      generatedAt: new Date().toISOString(),
    };

    await kvSet(rhythmBriefKey('debrief', userId), result);
    console.log(`[BriefingCompiler] Debrief prompt compiled in ${Date.now() - t0}ms for ${userId}`);
    return result;
  } catch (error) {
    console.error('[BriefingCompiler] Debrief prompt compilation failed:', error);
    const fallback: DebriefPromptResult = {
      spokenIntro: `Good evening, ${userName}. Time for your nightly debrief — let's close out the day clean. I'm going to ask you three things, and everything you tell me will show up in your debrief modal when you're ready to review it.`,
      questions: [
        'What did you accomplish today? What are your wins?',
        'How did the day go overall? Any reflections?',
        'What do you want to accomplish tomorrow?',
      ],
      generatedAt: new Date().toISOString(),
    };
    await kvSet(rhythmBriefKey('debrief', userId), fallback);
    return fallback;
  }
}

// ── Debrief Persistence ────────────────────────────────────────────

/**
 * Store voice-captured debrief data so DailyOpsModal can hydrate it.
 */
export async function persistVoiceDebrief(
  userId: string,
  data: Omit<VoiceDebriefData, 'capturedAt' | 'capturedVia'>,
): Promise<void> {
  const record: VoiceDebriefData = {
    ...data,
    capturedAt: new Date().toISOString(),
    capturedVia: 'nexus-voice',
  };
  await kvSet(voiceDebriefKey(userId), record);
  console.log(`[BriefingCompiler] Voice debrief persisted for ${userId}`);
}

/**
 * Retrieve voice-captured debrief for DailyOpsModal hydration.
 */
export async function getVoiceDebrief(userId: string): Promise<VoiceDebriefData | null> {
  return kvGet(voiceDebriefKey(userId));
}

// ── Deferred Questions ─────────────────────────────────────────────

/**
 * Store a question the user deferred from the morning call to noon.
 */
export async function deferQuestion(userId: string, question: string): Promise<void> {
  const existing = (await kvGet(deferredQuestionsKey(userId))) || [];
  const list: string[] = Array.isArray(existing) ? existing : [];
  list.push(question);
  await kvSet(deferredQuestionsKey(userId), list);
  console.log(`[BriefingCompiler] Deferred question stored for ${userId}: "${question}"`);
}

/**
 * Clear deferred questions after the noon call processes them.
 */
export async function clearDeferredQuestions(userId: string): Promise<void> {
  await kvSet(deferredQuestionsKey(userId), []);
}
