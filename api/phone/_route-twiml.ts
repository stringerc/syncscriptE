/**
 * TwiML logic — mounted at /api/phone/twiml via [endpoint].ts.
 *
 * Routes by ?handler= query param:
 *   ?handler=conversation      → Initial greeting when call connects
 *   ?handler=respond           → AI conversation loop (speech→AI→speech)
 *   ?handler=status-callback   → Call lifecycle events
 *   ?handler=inbound           → Handle incoming calls
 *
 * NO Bearer auth — called by Twilio's servers directly.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTwilioConfig,
  generatePhoneAIResponse,
  generatePhoneAIResponseWithTools,
  storePendingCalendarEvent,
  validateTwilioWebhook,
  resolvePhoneCallUserBinding,
  fetchWeatherForCall,
  parseEmailForInsights,
  loadCallMemory,
  saveCallMemory,
  detectMoodFromSpeech,
  getMoodPromptOverride,
  updateUserProfile,
  generateProactiveInsights,
  getRelationshipReminders,
  generateViralStats,
  buildPhoneSessionGroundingBlock,
  twiml,
  twimlSay,
  twimlGather,
  twimlPause,
} from './_helpers';
import type { LiveContext, CallMemory, MoodState } from './_helpers';

function getGreeting(callType: string): string {
  switch (callType) {
    case 'morning-briefing':
      return "Good morning! I'm your SyncScript AI. Let me give you a quick rundown of your day. What would you like to start with?";
    case 'evening-review':
      return "Hey there! Time for your evening wrap-up. I can go over what you accomplished today and help you plan for tomorrow. What's on your mind?";
    case 'check-in':
      return "Hey! Just checking in on you. How are things going? Need help with anything?";
    case 'urgent':
      return "Hi, this is your SyncScript AI calling about something important. What do you need help with?";
    case 'outbound-briefing':
      return "Hey! This is your SyncScript AI calling with a quick briefing. What would you like to go over?";
    default:
      return "Hey! This is your SyncScript AI assistant. I'm here to help with your tasks, goals, or anything you need. What's up?";
  }
}

function resolveVoice(v?: string): string {
  if (!v || v === 'default' || v === 'undefined') return 'Polly.Joanna-Neural';
  return v;
}

function handleConversation(req: VercelRequest, res: VercelResponse) {
  const config = getTwilioConfig();
  const callType = (req.query.type as string) || 'general';
  const voiceId = resolveVoice(req.query.voice as string);
  const convUserId = (req.query.userId as string) || '';
  const convEmail = (req.query.email as string) || '';

  const greeting = getGreeting(callType);
  const respondUrl =
    `${config.appUrl}/api/phone/twiml?handler=respond&voice=${encodeURIComponent(voiceId)}` +
    (convEmail ? `&email=${encodeURIComponent(convEmail)}` : '') +
    (convUserId ? `&userId=${encodeURIComponent(convUserId)}` : '');

  const xml = twiml(
    twimlSay(greeting, voiceId) +
    twimlGather({
      action: respondUrl,
      input: 'speech',
      speechTimeout: 'auto',
      language: 'en-US',
      innerXml: twimlPause(2),
    }) +
    twimlSay("I didn't hear anything. No worries, you can always reach me through the app. Talk soon!", voiceId)
  );

  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(xml);
}

const conversations = new Map<string, string[]>();
const callLiveContextCache = new Map<string, LiveContext>();
const callMemoryCache = new Map<string, CallMemory | null>();
const callUserIdMap = new Map<string, string>();
const callMoodCache = new Map<string, { mood: MoodState; negativeTurns: number }>();
const callEnrichedContextCache = new Map<string, string>();
const MAX_TURNS = 20;
const MAX_HISTORY = 2000;

async function handleRespond(req: VercelRequest, res: VercelResponse) {
  const config = getTwilioConfig();
  const voiceId = resolveVoice(req.query.voice as string);
  const body = req.body || {};

  const speechResult = body.SpeechResult || '';
  const confidence = parseFloat(body.Confidence || '0');
  const callSid = body.CallSid || 'unknown';
  const callerFrom = String(body.From || '');
  const callContext = (req.query.context as string) || undefined;
  const userEmail = (req.query.email as string) || undefined;
  const queryUserId = (req.query.userId as string) || undefined;

  const binding = await resolvePhoneCallUserBinding(queryUserId, callerFrom, callSid);
  const userId = binding.userId;
  if (userId) {
    callUserIdMap.set(callSid, userId);
  }

  const respondUrl =
    `${config.appUrl}/api/phone/twiml?handler=respond&voice=${encodeURIComponent(voiceId)}` +
    (callContext ? `&context=${encodeURIComponent(callContext)}` : '') +
    (userEmail ? `&email=${encodeURIComponent(userEmail)}` : '') +
    (binding.userIdForTwiml ? `&userId=${encodeURIComponent(binding.userIdForTwiml)}` : '');

  console.log(
    `[PhoneAI] CallSid=${callSid} Speech="${speechResult}" Confidence=${confidence} From=${callerFrom || 'n/a'} boundUser=${userId ? `${userId.slice(0, 8)}…` : 'none'}`,
  );

  if (!speechResult || confidence < 0.3) {
    const xml = twiml(
      twimlSay("Sorry, I didn't quite catch that. Could you say that again?", voiceId) +
      twimlGather({
        action: respondUrl,
        input: 'speech',
        speechTimeout: 'auto',
        language: 'en-US',
        innerXml: twimlPause(2),
      }) +
      twimlSay("Looks like we lost connection. Feel free to call back anytime. Bye!", voiceId)
    );
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(xml);
  }

  const lower = speechResult.toLowerCase().trim();
  const endPhrases = ['goodbye', 'bye', 'hang up', 'end call', "that's all", "i'm done", 'thanks bye'];
  if (endPhrases.some((p) => lower.includes(p))) {
    const uid = callUserIdMap.get(callSid) || userId;
    const hist = conversations.get(callSid);
    if (uid && hist && hist.length > 0) {
      saveCallMemory(uid, hist).catch(() => {});
      updateUserProfile(uid, hist.join('\n')).catch(() => {});
    }
    conversations.delete(callSid);
    callLiveContextCache.delete(callSid);
    callMemoryCache.delete(callSid);
    callUserIdMap.delete(callSid);
    callMoodCache.delete(callSid);
    callEnrichedContextCache.delete(callSid);

    const xml = twiml(
      twimlSay("Great talking with you! Remember, I'm always here in the app if you need anything. Have an awesome day!", voiceId) +
      '<Hangup/>'
    );
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(xml);
  }

  let history = conversations.get(callSid) || [];
  if (history.length >= MAX_TURNS * 2) history = history.slice(-MAX_TURNS);
  const historyStr = history.join('\n').slice(-MAX_HISTORY);

  let liveCtx = callLiveContextCache.get(callSid);
  if (!liveCtx) {
    const [weather, emailInsights] = await Promise.all([
      fetchWeatherForCall(),
      Promise.resolve(parseEmailForInsights(userEmail)),
    ]);
    liveCtx = {};
    if (weather) liveCtx.weather = weather;
    if (emailInsights) liveCtx.emailInsights = emailInsights;
    callLiveContextCache.set(callSid, liveCtx);
    console.log(`[PhoneAI] Live context loaded for ${callSid}: weather=${!!weather}, email=${!!emailInsights}`);
  }

  if (userId && !callMemoryCache.has(callSid)) {
    const mem = await loadCallMemory(userId);
    callMemoryCache.set(callSid, mem);
    if (mem) console.log(`[PhoneAI] Loaded cross-call memory for ${callSid} from ${mem.lastCallDate}`);
  }

  const detectedMood = detectMoodFromSpeech(speechResult, history);
  let moodState = callMoodCache.get(callSid) || { mood: 'neutral' as MoodState, negativeTurns: 0 };
  moodState.mood = detectedMood;
  if (['stressed', 'sad', 'frustrated'].includes(detectedMood)) {
    moodState.negativeTurns += 1;
  } else {
    moodState.negativeTurns = 0;
  }
  callMoodCache.set(callSid, moodState);
  const moodOverride = getMoodPromptOverride(moodState.mood, moodState.negativeTurns);

  if (userId && !callEnrichedContextCache.has(callSid)) {
    try {
      const [insights, relationships, viralStats] = await Promise.all([
        generateProactiveInsights(userId),
        getRelationshipReminders(userId),
        generateViralStats(userId),
      ]);
      const enrichedParts: string[] = [];
      if (insights.length > 0) {
        enrichedParts.push('PROACTIVE INSIGHTS (weave in naturally):');
        for (const ins of insights.slice(0, 3)) {
          enrichedParts.push(`- [${ins.type.toUpperCase()}] ${ins.text}`);
        }
      }
      if (relationships.length > 0) {
        enrichedParts.push('RELATIONSHIP REMINDERS:');
        for (const r of relationships.slice(0, 2)) {
          enrichedParts.push(`- ${r.name} (${r.relationship}) — ${r.daysSinceContact} days, context: "${r.lastContext}"`);
        }
      }
      if (viralStats.length > 0) {
        const vs = viralStats[0];
        enrichedParts.push(
          `ROLLING STAT (may include prior days — not "today" unless grounding says so): ${vs.stat} — "${vs.wittyComment}"`,
        );
      }
      const enrichedContext = enrichedParts.join('\n');
      callEnrichedContextCache.set(callSid, enrichedContext);
    } catch (e) {
      console.warn('[PhoneAI] Enriched context build failed:', e);
      callEnrichedContextCache.set(callSid, '');
    }
  }

  const briefingCtx = (req.query.briefingCtx as string) || '';
  const enrichedCtx = callEnrichedContextCache.get(callSid) || '';
  let groundingBlock = '';
  if (userId) {
    groundingBlock = await buildPhoneSessionGroundingBlock(userId);
  }
  const extraContext = [groundingBlock, moodOverride, enrichedCtx, briefingCtx].filter(Boolean).join('\n');

  let spokenResponse: string;

  if (userId) {
    const callMem = callMemoryCache.get(callSid) || null;
    const enrichedLiveCtx: LiveContext = {
      ...liveCtx,
      ...(extraContext ? { moodAndInsights: extraContext } : {}),
    };
    const bridgeResult = await generatePhoneAIResponseWithTools(
      speechResult, userId, historyStr || undefined, callContext, enrichedLiveCtx, callMem, callSid,
    );
    spokenResponse = bridgeResult.spoken;

    if (bridgeResult.toolResults) {
      for (const tr of bridgeResult.toolResults) {
        if (tr.action === 'create_calendar_event' && tr.event) {
          storePendingCalendarEvent(callSid, {
            title: tr.event.title,
            date: tr.event.date || new Date().toISOString().split('T')[0],
            startHour: tr.event.startHour ?? 9,
            startMinute: tr.event.startMinute ?? 0,
            endHour: tr.event.endHour ?? 10,
            endMinute: tr.event.endMinute ?? 0,
            createdAt: new Date().toISOString(),
          });
          console.log(`[PhoneAI] Tool created calendar event: "${tr.event.title}"`);
        }
      }
    }
  } else {
    const aiResponse = await generatePhoneAIResponse(speechResult, historyStr || undefined, callContext, liveCtx);
    spokenResponse = aiResponse;

    const eventMatch = aiResponse.match(/:::EVENT:::(.*?):::END:::/s);
    if (eventMatch) {
      spokenResponse = aiResponse.split(':::EVENT:::')[0].trim();
      try {
        const eventData = JSON.parse(eventMatch[1]);
        storePendingCalendarEvent(callSid, { ...eventData, createdAt: new Date().toISOString() });
      } catch (e) {
        console.error(`[PhoneAI] Failed to parse event JSON:`, e);
      }
    }
  }

  history.push(`User: ${speechResult}`);
  history.push(`AI: ${spokenResponse}`);
  conversations.set(callSid, history);

  console.log(`[PhoneAI] CallSid=${callSid} Response="${spokenResponse.slice(0, 100)}..."`);

  const xml = twiml(
    twimlSay(spokenResponse, voiceId) +
    twimlGather({
      action: respondUrl,
      input: 'speech',
      speechTimeout: 'auto',
      language: 'en-US',
      innerXml: twimlPause(3),
    }) +
    twimlSay("Are you still there? ... I'll let you go for now. Talk to you soon!", voiceId)
  );

  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(xml);
}

async function handleStatusCallback(req: VercelRequest, res: VercelResponse) {
  const body = req.body || {};
  const callSid = body.CallSid || '';
  console.log(`[PhoneCallback] CallSid=${callSid} Status=${body.CallStatus} Duration=${body.CallDuration}s`);

  if (body.CallStatus === 'completed') {
    console.log(`[PhoneCallback] Call completed: ${body.Direction} ${body.From} → ${body.To}, duration ${body.CallDuration}s`);

    const uid = callUserIdMap.get(callSid);
    const history = conversations.get(callSid);
    if (uid && history && history.length > 0) {
      saveCallMemory(uid, history).catch((e) =>
        console.error(`[PhoneCallback] Failed to save call memory:`, e)
      );
      updateUserProfile(uid, history.join('\n')).catch((e) =>
        console.error(`[PhoneCallback] Failed to update user profile:`, e)
      );
    }

    conversations.delete(callSid);
    callLiveContextCache.delete(callSid);
    callMemoryCache.delete(callSid);
    callUserIdMap.delete(callSid);
    callMoodCache.delete(callSid);
    callEnrichedContextCache.delete(callSid);
  }

  return res.status(200).send('OK');
}

function handleInbound(req: VercelRequest, res: VercelResponse) {
  const config = getTwilioConfig();
  const voiceId = 'Polly.Joanna-Neural';
  const respondUrl = `${config.appUrl}/api/phone/twiml?handler=respond&voice=${encodeURIComponent(voiceId)}`;

  const xml = twiml(
    twimlSay("Welcome to SyncScript AI! I'm your personal productivity assistant. What can I help you with?", voiceId) +
    twimlGather({
      action: respondUrl,
      input: 'speech',
      speechTimeout: 'auto',
      language: 'en-US',
      innerXml: twimlPause(2),
    }) +
    twimlSay("I didn't hear anything. Call back anytime. Goodbye!", voiceId)
  );

  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(xml);
}

export async function routePhoneTwiml(req: VercelRequest, res: VercelResponse) {
  try {
    if (process.env.NODE_ENV === 'production' && !validateTwilioWebhook(req)) {
      console.error('[TwiML] Rejected request — invalid Twilio signature');
      return res.status(403).json({ error: 'Invalid Twilio signature' });
    }

    const handlerType = (req.query.handler as string) || 'conversation';

    switch (handlerType) {
      case 'conversation':
        return handleConversation(req, res);
      case 'respond':
        return await handleRespond(req, res);
      case 'status-callback':
        return await handleStatusCallback(req, res);
      case 'inbound':
        return handleInbound(req, res);
      default:
        return res.status(400).json({ error: `Unknown handler: ${handlerType}` });
    }
  } catch (error) {
    console.error('[TwiML] Unhandled error in handler:', error);
    const fallbackXml = twiml(
      twimlSay("Sorry, I hit a technical snag. Try calling back in a moment — I'll be ready!", 'Polly.Joanna-Neural')
    );
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(fallbackXml);
  }
}
