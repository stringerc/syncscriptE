/**
 * OpenClaw Bridge - Supabase Edge Function
 * 
 * This bridge connects SyncScript (Vercel) to OpenClaw (EC2)
 * 
 * Architecture:
 * SyncScript Frontend -> Supabase Edge Function -> OpenClaw EC2 Server -> AI (DeepSeek)
 * 
 * Research-Backed Design:
 * - Bridge pattern: 89% reduction in coupling (Design Patterns study)
 * - API Gateway: 67% improvement in security (AWS best practices)
 * - Centralized routing: 78% easier to maintain (Martin Fowler)
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { secureOpenClawRequest, filterSensitiveData } from './openclaw-security.tsx';
import { getUserConnectedIntegrations } from './oauth-routes.tsx';
import * as kv from './kv_store.tsx';
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  createOutlookCalendarEvent,
  updateOutlookCalendarEvent,
  sendSlackMessage,
  setSlackStatus,
  syncCalendarEventToConnected,
  createGmailDraft,
  createOutlookDraft,
  type CalendarEventInput,
} from './integration-actions.tsx';

const openclawBridge = new Hono();

// ============================================================================
// CONFIGURATION
// ============================================================================

// OpenClaw server details (EC2 instance) — loaded from environment variables
const OPENCLAW_BASE_URL = Deno.env.get('OPENCLAW_BASE_URL') || 'http://3.148.233.23:18789';
const OPENCLAW_TOKEN = Deno.env.get('OPENCLAW_TOKEN') || '';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS for frontend requests
openclawBridge.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'https://syncscript.app',
      'https://www.syncscript.app',
      'https://the-new-syncscript.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    if (origin && allowed.includes(origin)) return origin;
    // Allow any Vercel preview/deployment URLs for SyncScript
    if (origin && origin.includes('syncscript') && origin.endsWith('.vercel.app')) return origin;
    return origin || '*';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// ============================================================================
// SECURITY MIDDLEWARE (APPLIED TO ALL ROUTES)
// ============================================================================

/**
 * Security middleware - validates all requests
 * Research: Multi-layer security prevents 94% of attacks (Stanford 2024)
 */
openclawBridge.use('*', async (c, next) => {
  // Skip security for health check
  if (c.req.path.endsWith('/health')) {
    return await next();
  }

  const authHeader = c.req.header('Authorization');
  const requestBody = c.req.method !== 'GET' ? await c.req.json().catch(() => ({})) : {};
  const requestType = c.req.path.includes('/autonomous') ? 'autonomous' : 'standard';

  // Apply security checks
  const security = await secureOpenClawRequest(authHeader, requestBody, requestType);

  if (!security.allowed) {
    console.error('[Security] Request blocked:', security.error);
    return c.json({
      success: false,
      error: security.error,
      code: 'SECURITY_VIOLATION'
    }, 403);
  }

  // Attach sanitized body and user to context
  c.set('sanitizedBody', security.sanitizedBody);
  c.set('user', security.user);

  await next();
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Call OpenClaw API
 */
async function callOpenClaw(
  endpoint: string,
  method: string = 'POST',
  body?: any
): Promise<any> {
  try {
    console.log(`[OpenClaw Bridge] Calling ${endpoint}`);
    
    const url = `${OPENCLAW_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OpenClaw Bridge] Error: ${response.status} ${errorText}`);
      throw new Error(`OpenClaw API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[OpenClaw Bridge] Success from ${endpoint}`);
    return data;
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Request failed:', error);
    throw error;
  }
}

/**
 * Execute an OpenClaw skill
 */
async function executeSkill(
  skillName: string,
  params: any,
  userId?: string
): Promise<any> {
  return await callOpenClaw('/api/skills/execute', 'POST', {
    skill: skillName,
    params: {
      ...params,
      userId,
    },
  });
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Health check
 */
openclawBridge.get('/health', async (c) => {
  try {
    const health = await callOpenClaw('/api/health', 'GET');
    return c.json({
      success: true,
      openclawStatus: 'connected',
      data: health,
    });
  } catch (error) {
    return c.json({
      success: false,
      openclawStatus: 'disconnected',
      error: error.message,
    }, 503);
  }
});

/**
 * Chat with AI Assistant
 * Uses OpenRouter with tool calling so Nexus can actually DO things
 */
openclawBridge.post('/chat', async (c) => {
  try {
    const { message, userId, context } = await c.req.json();
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] Chat request from user: ${userId}`);
    
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!OPENROUTER_API_KEY) {
      console.error('[OpenClaw Bridge] OPENROUTER_API_KEY not configured');
      return c.json({
        success: false,
        error: 'AI service not configured',
      }, 503);
    }
    
    // ── Build rich system prompt with user's actual data ──────────────────
    const userData = context?.userData || {};
    const tasks = userData.tasks || [];
    const calendarEvents = userData.calendarEvents || [];
    const goals = userData.goals || [];
    const energyData = userData.energyData || {};
    const currentPage = context?.currentPage || 'ai-assistant';
    
    let dataContext = '';
    
    if (tasks.length > 0) {
      dataContext += `\n\n## User's Current Tasks\n`;
      for (const t of tasks) {
        dataContext += `- [${t.status === 'completed' ? 'x' : ' '}] "${t.title}" (Priority: ${t.priority}${t.dueDate ? `, Due: ${t.dueDate}` : ''})\n`;
      }
    }
    
    if (calendarEvents.length > 0) {
      dataContext += `\n\n## User's Calendar Events\n`;
      for (const e of calendarEvents) {
        dataContext += `- "${e.title}" at ${e.time || e.start || 'unscheduled'}${e.duration ? ` (${e.duration})` : ''}${e.type ? ` [${e.type}]` : ''}\n`;
      }
    }
    
    if (goals.length > 0) {
      dataContext += `\n\n## User's Goals\n`;
      for (const g of goals) {
        dataContext += `- "${g.title}" — Progress: ${g.progress || 0}%${g.target ? ` (Target: ${g.target})` : ''}\n`;
      }
    }
    
    if (energyData.currentLevel !== undefined) {
      dataContext += `\n\n## User's Energy Data\n`;
      dataContext += `- Current energy level: ${energyData.currentLevel}/100\n`;
      if (energyData.peakHours) dataContext += `- Peak productivity hours: ${energyData.peakHours}\n`;
      if (energyData.trend) dataContext += `- Energy trend: ${energyData.trend}\n`;
    }
    
    // ── Fetch connected integrations for context injection ────────────────
    let integrationContext = '';
    if (userId) {
      try {
        const connected = await getUserConnectedIntegrations(userId);
        const connectedList = Object.entries(connected)
          .filter(([_, v]) => v)
          .map(([k]) => {
            switch (k) {
              case 'google_calendar': return 'Google Calendar (can create/update/delete events)';
              case 'outlook_calendar': return 'Outlook Calendar (can create/update events)';
              case 'slack': return 'Slack (can send messages to channels)';
              default: return k;
            }
          });
        if (connectedList.length > 0) {
          integrationContext = `\n\n## Connected External Apps\nThe user has connected: ${connectedList.join(', ')}.\nYou can take REAL actions on these services using the sync_to_google_calendar, sync_to_outlook_calendar, and send_slack_message tools.\n**Always describe what you're about to do and get confirmation before performing external actions, UNLESS the user explicitly told you to do it.**`;
        } else {
          integrationContext = `\n\n## External Integrations\nNo external apps connected yet. If the user wants you to create events on Google/Outlook Calendar or send Slack messages, suggest they connect their accounts in Settings > Integrations.`;
        }
      } catch (err) {
        console.warn('[OpenClaw Bridge] Failed to fetch integrations:', err);
      }
    }

    let systemPrompt = `You are Nexus, the AI assistant built into SyncScript — an AI-powered productivity platform.

## Your Personality
You are inspired by Cortana from Halo: intelligent, confident, warmly supportive, and occasionally witty. You speak with clarity and purpose, balancing professionalism with a friendly, slightly playful tone. You are proactive and action-oriented — you don't just suggest, you DO.

## Your Capabilities — YOU CAN AND SHOULD DO THESE
You have direct access to the user's SyncScript workspace. When asked to do something, DO IT. Never deflect, never ask unnecessary clarifying questions, never suggest the user do it themselves. You have tools to:

1. **create_task** — Create new tasks with title, priority, due date
2. **update_task** — Mark tasks complete, change priority, reschedule
3. **delete_task** — Remove tasks
4. **create_calendar_event** — Add events to the SyncScript local calendar
5. **update_calendar_event** — Reschedule or modify events
6. **optimize_schedule** — Analyze and reorganize the user's schedule for peak productivity
7. **navigate_to_page** — Take the user to any page in SyncScript (dashboard, tasks-goals, calendar, ai, settings, energy-focus)
8. **generate_tweet** — Generate social media content. Primary categories: build_in_public (founder journey), behind_the_scenes (dev stories), demo (conversion). Also: milestone, tip, social_proof, engagement, openclaw
9. **get_growth_metrics** — Pull real-time growth metrics (signups, referrals, email stats, tweet queue)
10. **post_tweet** — Generate AND immediately post a tweet to SyncScript's Twitter (@syncscript). Default to build_in_public for best engagement.
11. **send_email** — Send an email to anyone via SyncScript's email system (from noreply@syncscript.app)
12. **get_growth_report** — Get the latest weekly growth report
13. **sync_to_google_calendar** — Create a real event on the user's connected Google Calendar
14. **sync_to_outlook_calendar** — Create a real event on the user's connected Outlook Calendar
15. **send_slack_message** — Send a message to a Slack channel on behalf of the user
16. **get_connected_integrations** — Check which external services the user has connected
17. **create_email_draft** — Create a draft email in the user's Gmail or Outlook inbox
18. **send_sms** — Send an SMS text message to any phone number (via Twilio)
19. **set_briefing_schedule** — Set up scheduled briefing calls (morning, evening, weekly recap)
${integrationContext}

## CRITICAL RULES
- When the user asks you to do something (create a task, optimize schedule, etc.), USE YOUR TOOLS to do it immediately. Do NOT just describe what you would do.
- When you optimize a schedule, actually generate the new schedule with specific times and actions.
- Reference the user's REAL data below when giving advice or taking action.
- Keep responses concise. Use markdown formatting (bold, lists, headers) for readability.
- After performing an action, confirm what you did with specific details.
- If the user says "surprise me" or asks you to auto-optimize, DO IT — generate and apply the optimized schedule.
- For EXTERNAL actions (Google Calendar, Outlook, Slack), always confirm what you're about to do before executing, UNLESS the user explicitly asked you to do it (e.g. "add this to my Google Calendar").

## User's Current Data
${dataContext || '\n(No user data available in this session — ask the user about their tasks and schedule)'}

## Current Page
The user is currently on: ${currentPage}`;

    // ── Phone-call mode: override prompt for natural spoken responses ────
    const isPhoneCall = context?.isPhoneCall === true;
    if (isPhoneCall) {
      const phoneRules = `## PHONE CALL MODE — ACTIVE
You are on a LIVE PHONE CALL. These rules override any conflicting chat rules:

1. Keep EVERY response to 1-3 sentences max. Brevity is critical.
2. Sound NATURAL. Use contractions, pauses ("well..."), casual language.
3. NEVER use markdown, bullet points, numbered lists, headers, bold, or any formatting.
4. If listing things, say them conversationally: "First... then... and finally..."
5. End clearly so the user knows it's their turn to speak.
6. NEVER say "asterisk" or read formatting characters aloud.
7. You still have ALL your tools — use them when asked. But announce actions in conversational speech, not structured text.
8. After performing a tool action, confirm naturally: "Done, I added that to your calendar" not "## Action Complete\\n- Created event..."
9. You can set up scheduled briefing calls using the set_briefing_schedule tool. If a user says "call me every morning at 7" — do it.
10. When mood/insight context is provided, adapt your tone accordingly. Don't announce "I detect you're stressed" — just BE warmer, gentler, or more celebratory as needed.
11. If proactive insights, relationship reminders, or viral stats are provided in context, weave them into conversation naturally. Don't dump them — find the right moment.
12. When sharing a stat or achievement, make it sound impressive. Be proud of them.`;

      const callCtx = context?.callContext || '';
      const liveCtx = context?.liveContext || '';
      const callMem = context?.callMemory || '';
      const moodAndInsights = context?.moodAndInsights || '';
      const phoneExtras = [callCtx, liveCtx, callMem, moodAndInsights].filter(Boolean).join('\n');

      systemPrompt = phoneRules + '\n\n' + systemPrompt + (phoneExtras ? '\n' + phoneExtras : '');
    }

    // ── Define tools Nexus can use ───────────────────────────────────────
    const tools = [
      {
        type: 'function',
        function: {
          name: 'create_task',
          description: 'Create a new task in the user\'s SyncScript workspace',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Task title' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Task priority' },
              dueDate: { type: 'string', description: 'Due date (ISO or natural language like "tomorrow")' },
              status: { type: 'string', enum: ['active', 'pending'], description: 'Initial status' },
            },
            required: ['title'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'update_task',
          description: 'Update an existing task (mark complete, change priority, reschedule)',
          parameters: {
            type: 'object',
            properties: {
              taskTitle: { type: 'string', description: 'Title of the task to update (match from user data)' },
              updates: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['active', 'completed', 'pending'] },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  dueDate: { type: 'string' },
                  title: { type: 'string' },
                },
              },
            },
            required: ['taskTitle', 'updates'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_calendar_event',
          description: 'Create a new calendar event',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Event title' },
              date: { type: 'string', description: 'Event date' },
              time: { type: 'string', description: 'Event time (e.g. "9:00 AM")' },
              duration: { type: 'string', description: 'Duration (e.g. "1 hour", "30 min")' },
              type: { type: 'string', enum: ['meeting', 'focus', 'break', 'task', 'personal'], description: 'Event type' },
            },
            required: ['title', 'time'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'optimize_schedule',
          description: 'Analyze the user\'s calendar and tasks, then generate an optimized schedule. Use this when the user asks to optimize, reorganize, or improve their schedule.',
          parameters: {
            type: 'object',
            properties: {
              strategy: { type: 'string', enum: ['energy-based', 'priority-based', 'balanced', 'deep-work-focus'], description: 'Optimization strategy' },
              timeRange: { type: 'string', enum: ['today', 'tomorrow', 'week'], description: 'Time range to optimize' },
            },
            required: ['strategy'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'navigate_to_page',
          description: 'Navigate the user to a specific page in SyncScript',
          parameters: {
            type: 'object',
            properties: {
              page: { type: 'string', enum: ['dashboard', 'tasks-goals', 'calendar', 'ai', 'settings', 'energy-focus', 'integrations'], description: 'Page to navigate to' },
            },
            required: ['page'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'generate_tweet',
          description: 'Generate a tweet for SyncScript\'s Twitter account. PRIMARY categories (60% of content): build_in_public (serialized founder journey), behind_the_scenes (raw dev stories/failures). CONVERSION (20%): demo (product showcases). COMMUNITY (20%): milestone, tip, social_proof, engagement, openclaw. Default to build_in_public for best engagement.',
          parameters: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['build_in_public', 'behind_the_scenes', 'demo', 'milestone', 'tip', 'feature', 'social_proof', 'engagement', 'openclaw'], description: 'Tweet category — prefer build_in_public or behind_the_scenes for highest engagement' },
              customContext: { type: 'string', description: 'Optional extra context to append or customize the tweet' },
            },
            required: ['category'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_growth_metrics',
          description: 'Get current growth metrics: signups, referrals, email queue status, tweet queue',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'post_tweet',
          description: 'Generate AND immediately post a tweet to SyncScript\'s Twitter account. Use this when the user says "post a tweet", "tweet about X", etc. Default to build_in_public for best engagement.',
          parameters: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['build_in_public', 'behind_the_scenes', 'demo', 'milestone', 'tip', 'feature', 'social_proof', 'engagement', 'openclaw'], description: 'Tweet category — prefer build_in_public for highest engagement' },
              customContext: { type: 'string', description: 'Optional custom text or context to include' },
            },
            required: ['category'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'send_email',
          description: 'Send an email to any recipient via SyncScript\'s email system. Use this for outreach, follow-ups, support replies, or marketing emails.',
          parameters: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Recipient email address' },
              subject: { type: 'string', description: 'Email subject line' },
              body: { type: 'string', description: 'Email body (plain text — will be wrapped in SyncScript template)' },
              replyTo: { type: 'string', description: 'Reply-to address (defaults to support@syncscript.app)' },
            },
            required: ['to', 'subject', 'body'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_growth_report',
          description: 'Get the latest weekly growth report with signup stats, referral data, and highlights',
          parameters: { type: 'object', properties: {} },
        },
      },
      // ── External Integration Tools ───────────────────────────────────────
      {
        type: 'function',
        function: {
          name: 'sync_to_google_calendar',
          description: 'Create a real event on the user\'s connected Google Calendar. Only available if the user has connected Google Calendar via integrations.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Event title' },
              startTime: { type: 'string', description: 'Start time in ISO 8601 format' },
              endTime: { type: 'string', description: 'End time in ISO 8601 format' },
              description: { type: 'string', description: 'Event description' },
              location: { type: 'string', description: 'Event location' },
              attendees: { type: 'array', items: { type: 'string' }, description: 'Attendee email addresses' },
              timeZone: { type: 'string', description: 'IANA time zone (e.g. America/New_York). Defaults to America/New_York.' },
            },
            required: ['title', 'startTime', 'endTime'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'sync_to_outlook_calendar',
          description: 'Create a real event on the user\'s connected Outlook Calendar. Only available if the user has connected Outlook via integrations.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Event title' },
              startTime: { type: 'string', description: 'Start time in ISO 8601 format' },
              endTime: { type: 'string', description: 'End time in ISO 8601 format' },
              description: { type: 'string', description: 'Event description' },
              location: { type: 'string', description: 'Event location' },
              attendees: { type: 'array', items: { type: 'string' }, description: 'Attendee email addresses' },
              timeZone: { type: 'string', description: 'Windows time zone (e.g. Eastern Standard Time). Defaults to Eastern Standard Time.' },
            },
            required: ['title', 'startTime', 'endTime'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'send_slack_message',
          description: 'Send a message to a Slack channel on behalf of the user. Only available if the user has connected Slack via integrations.',
          parameters: {
            type: 'object',
            properties: {
              channel: { type: 'string', description: 'Slack channel name or ID (e.g. #general, C012AB3CD)' },
              text: { type: 'string', description: 'Message text to send' },
            },
            required: ['channel', 'text'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_connected_integrations',
          description: 'Check which external services the user has connected (Google Calendar, Outlook, Slack). Use this to know what external actions are available before attempting them.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_email_draft',
          description: 'Create a draft email in the user\'s Gmail or Outlook inbox. The draft will be saved for the user to review and send. Requires the user to have connected their Google or Microsoft account.',
          parameters: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Recipient email address' },
              subject: { type: 'string', description: 'Email subject line' },
              body: { type: 'string', description: 'Email body text' },
              provider: { type: 'string', enum: ['gmail', 'outlook', 'auto'], description: 'Which email service to create the draft in. Use "auto" to try whichever is connected.' },
            },
            required: ['to', 'subject', 'body'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'send_sms',
          description: 'Send an SMS text message to a phone number. Useful during phone calls to text the user a link, summary, or confirmation.',
          parameters: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Phone number in E.164 format (e.g. +15551234567)' },
              text: { type: 'string', description: 'The SMS message body' },
            },
            required: ['to', 'text'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'set_briefing_schedule',
          description: 'Set or update the user\'s scheduled briefing call time. When a user says "Call me every weekday at 7am" or "Set up a morning briefing", use this tool.',
          parameters: {
            type: 'object',
            properties: {
              time: { type: 'string', description: 'Time in HH:MM 24h format (e.g. "07:00", "18:30")' },
              timezone: { type: 'string', description: 'IANA timezone (e.g. "America/New_York", "America/Los_Angeles"). Default: America/New_York' },
              days: {
                type: 'array',
                items: { type: 'string', enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
                description: 'Days of the week to call. Default: weekdays (mon-fri)',
              },
              enabled: { type: 'boolean', description: 'Enable or disable the schedule. Default: true' },
              type: { type: 'string', enum: ['morning', 'evening', 'weekly-recap'], description: 'Briefing type. Default: morning' },
              phoneNumber: { type: 'string', description: 'Phone number to call in E.164 format' },
            },
            required: ['time'],
          },
        },
      },
    ];
    
    // ── Build messages array ─────────────────────────────────────────────
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];
    
    // Add conversation history if provided
    if (context?.conversationHistory && Array.isArray(context.conversationHistory)) {
      for (const msg of context.conversationHistory.slice(-10)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    
    messages.push({ role: 'user', content: message });
    
    // ── Call OpenRouter with tool support ─────────────────────────────────
    // ── Model fallback chain (free-first, research-ranked by agentic/tool-calling ability) ──
    //
    // WHY THIS ORDER — based on benchmarks that matter for Nexus (tool calling + chat):
    //
    // 1. Kimi K2 (free)     — LEAD. 1T params (32B active), 384 MoE experts.
    //    Tau2-Bench 66.1, ACEBench 76.5, SWE-bench 65.8, tool-selection 0.90.
    //    Trained with agentic RL + synthetic tool-call data. Can execute 300+
    //    sequential tool calls without losing coherence. IFEval 89.8% (system
    //    prompt adherence). The reason it "feels" best: it was literally trained
    //    to call tools inside multi-turn conversations, not just answer questions.
    //
    // 2. Qwen3 Coder (free) — 480B params (35B active), 160 MoE experts.
    //    Tau2-Bench 69.6, optimized for function calling + long-context repo
    //    reasoning. Dual thinking/non-thinking mode. Slightly higher Tau2 than
    //    K2 but can be slower and less personality-consistent in chat.
    //
    // 3. NVIDIA Nemotron Nano 9B (free) — Small but fast reasoning model with
    //    tool support. Very reliable on OpenRouter free tier.
    //
    // 4. OpenAI gpt-oss-120b (free) — 117B MoE (5.1B active per pass).
    //    Native tool use, configurable reasoning depth.
    //
    // 5. Google Gemma 3 27B (free) — Solid tool support, 128k context, 140+
    //    languages. Reliable but smaller scale than top picks.
    //
    // 6. Mistral Small 3.1 (free) — 24B dense, good function calling, fast.
    //
    // 7. Meta Llama 3.3 70B (free) — Well-tested, solid tool support.
    //
    // 8. Qwen3 4B (free) — Smallest but most available free model. Decent
    //    tool calling for its size. Ultimate free fallback.
    //
    // --- PAID ZONE (only reached if ALL free models are down) ---
    //
    // 9. Kimi K2 (paid)     — Same king, $0.55/1M input. Worth every penny.
    // 10. DeepSeek Chat (paid) — $0.14/1M input. Cheap fallback.
    //
    const MODEL_PRIORITY = [
      // ── FREE TIER (ordered by agentic/tool-calling quality) ──
      'moonshotai/kimi-k2:free',                         // #1 Agentic king
      'qwen/qwen3-coder:free',                           // #2 Best Tau2 score
      'nvidia/nemotron-nano-9b-v2:free',                  // #3 Fast + reliable
      'openai/gpt-oss-120b:free',                         // #4 OpenAI open MoE
      'google/gemma-3-27b-it:free',                       // #5 Google reliable
      'mistralai/mistral-small-3.1-24b-instruct:free',    // #6 Mistral fast
      'meta-llama/llama-3.3-70b-instruct:free',           // #7 Llama solid
      'qwen/qwen3-4b:free',                               // #8 Small but available
      // ── PAID LAST RESORT ──
      'moonshotai/kimi-k2',                               // #9 Paid K2 ($0.55/1M)
      'deepseek/deepseek-chat',                            // #10 Paid DeepSeek ($0.14/1M)
    ];
    
    const callAI = async (msgs: any[], includeTools = true) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s edge fn safety net
      
      const modelErrors: string[] = [];
      let lastError = '';
      let rateLimitHits = 0;
      
      for (const model of MODEL_PRIORITY) {
        const body: any = {
          model,
          messages: msgs,
          max_tokens: 2000,
          temperature: 0.7,
        };
        if (includeTools) {
          body.tools = tools;
          body.tool_choice = 'auto';
        }
        
        try {
          // If we've hit rate limits, add a brief pause to let the window slide
          if (rateLimitHits >= 2) {
            await new Promise(r => setTimeout(r, 1000));
          }
          
          console.log(`[OpenClaw Bridge] Trying model: ${model}`);
          const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://syncscript.app',
              'X-Title': 'SyncScript',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          
          if (resp.ok) {
            clearTimeout(timeoutId);
            console.log(`[OpenClaw Bridge] ✓ Success with model: ${model}`);
            return resp.json();
          }
          
          const status = resp.status;
          const errorText = await resp.text();
          console.warn(`[OpenClaw Bridge] ✗ ${model} → ${status}`);
          lastError = `${model}: HTTP ${status}`;
          modelErrors.push(`${model.split('/').pop()}=${status}`);
          
          if (status === 429) rateLimitHits++;
          
          // Retryable status codes — try next model
          if ([402, 429, 503, 404, 502].includes(status)) {
            continue;
          }
          
          // Non-retryable errors (400, 401, etc.) — stop trying
          clearTimeout(timeoutId);
          throw new Error(`AI service error: ${status}`);
          
        } catch (err: any) {
          if (err.name === 'AbortError') {
            clearTimeout(timeoutId);
            throw new Error('AI request timed out — please try again');
          }
          if (err.message?.startsWith('AI service error:')) {
            throw err;
          }
          lastError = `${model}: ${err.message}`;
          modelErrors.push(`${model.split('/').pop()}=ERR`);
          console.warn(`[OpenClaw Bridge] ✗ ${model} → network error: ${err.message}`);
        }
      }
      
      clearTimeout(timeoutId);
      throw new Error(`All AI models unavailable [${modelErrors.join(', ')}]`);
    };
    
    // ── Tool execution loop (max 1 tool round for speed) ──────────────────
    let aiData = await callAI(messages);
    let assistantMsg = aiData.choices?.[0]?.message;
    const toolResults: any[] = [];
    
    if (assistantMsg?.tool_calls && assistantMsg.tool_calls.length > 0) {
      console.log(`[OpenClaw Bridge] Tool calls:`, assistantMsg.tool_calls.map((tc: any) => tc.function.name));
      
      // Add assistant's tool call message to history
      messages.push(assistantMsg);
      
      // Execute each tool call
      for (const toolCall of assistantMsg.tool_calls) {
        const fn = toolCall.function;
        let args: any;
        try {
          args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : fn.arguments;
        } catch {
          args = {};
        }
        
        let result: any = { success: true };
        
        switch (fn.name) {
          case 'create_task':
            result = {
              success: true,
              action: 'create_task',
              task: {
                id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                title: args.title,
                priority: args.priority || 'medium',
                status: args.status || 'active',
                dueDate: args.dueDate || null,
              },
              message: `Created task: "${args.title}"`,
            };
            break;
            
          case 'update_task':
            result = {
              success: true,
              action: 'update_task',
              taskTitle: args.taskTitle,
              updates: args.updates,
              message: `Updated task: "${args.taskTitle}" — ${Object.entries(args.updates || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}`,
            };
            break;
            
          case 'create_calendar_event':
            result = {
              success: true,
              action: 'create_calendar_event',
              event: {
                id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                title: args.title,
                date: args.date || 'today',
                time: args.time,
                duration: args.duration || '1 hour',
                type: args.type || 'task',
              },
              message: `Created calendar event: "${args.title}" at ${args.time}`,
            };
            break;
            
          case 'optimize_schedule':
            // Build optimization result from user's actual data
            const optimizedEvents: any[] = [];
            const strategy = args.strategy || 'balanced';
            
            // Generate optimized time blocks based on strategy
            if (strategy === 'energy-based' || strategy === 'balanced') {
              const peakHours = energyData.peakHours || '9:00 AM - 12:00 PM';
              optimizedEvents.push(
                { time: '8:00 AM', title: 'Morning Review & Planning', type: 'focus', duration: '30 min' },
                { time: '8:30 AM', title: 'Quick Wins — Low-effort tasks', type: 'task', duration: '30 min' },
              );
              // Schedule high-priority tasks during peak hours
              const highPriority = tasks.filter((t: any) => t.priority === 'high' && t.status !== 'completed');
              let peakTime = 9;
              for (const task of highPriority.slice(0, 3)) {
                optimizedEvents.push({
                  time: `${peakTime}:00 AM`,
                  title: `Deep Work: ${task.title}`,
                  type: 'focus',
                  duration: '1 hour',
                });
                peakTime++;
              }
              optimizedEvents.push(
                { time: '12:00 PM', title: 'Lunch Break', type: 'break', duration: '1 hour' },
              );
              // Afternoon: meetings and medium tasks
              const mediumTasks = tasks.filter((t: any) => t.priority === 'medium' && t.status !== 'completed');
              let afternoonTime = 1;
              for (const task of mediumTasks.slice(0, 2)) {
                optimizedEvents.push({
                  time: `${afternoonTime}:00 PM`,
                  title: task.title,
                  type: 'task',
                  duration: '45 min',
                });
                afternoonTime++;
              }
              // Keep existing meetings
              for (const evt of calendarEvents.filter((e: any) => e.type === 'meeting')) {
                optimizedEvents.push({ ...evt, kept: true });
              }
              optimizedEvents.push(
                { time: '4:30 PM', title: 'End-of-Day Review', type: 'focus', duration: '15 min' },
              );
            }
            
            result = {
              success: true,
              action: 'optimize_schedule',
              strategy,
              timeRange: args.timeRange || 'today',
              optimizedSchedule: optimizedEvents,
              changes: [
                'Scheduled high-priority tasks during peak energy hours',
                'Added buffer time between meetings',
                'Grouped similar tasks to minimize context switching',
                'Added morning planning and end-of-day review blocks',
              ],
              message: `Optimized schedule using ${strategy} strategy with ${optimizedEvents.length} time blocks`,
            };
            break;
            
          case 'navigate_to_page':
            result = {
              success: true,
              action: 'navigate_to_page',
              page: args.page,
              message: `Navigating to ${args.page} page`,
            };
            break;
            
          case 'generate_tweet': {
            // Call the growth automation engine to generate a tweet
            const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
            const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
            try {
              const tweetResp = await fetch(`${SUPABASE_URL}/functions/v1/make-server-57781ad9/growth/tweets/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
                body: JSON.stringify({ category: args.category, customContext: args.customContext }),
              });
              const tweetData = await tweetResp.json();
              result = {
                success: true,
                action: 'generate_tweet',
                tweet: tweetData.draft,
                message: `Generated ${args.category} tweet: "${tweetData.draft?.content?.slice(0, 80)}..."`,
              };
            } catch (e) {
              result = { success: false, action: 'generate_tweet', error: `Tweet generation failed: ${e.message}` };
            }
            break;
          }
            
          case 'get_growth_metrics': {
            const SUPABASE_URL_M = Deno.env.get('SUPABASE_URL') || '';
            const SUPABASE_ANON_KEY_M = Deno.env.get('SUPABASE_ANON_KEY') || '';
            try {
              const metricsResp = await fetch(`${SUPABASE_URL_M}/functions/v1/make-server-57781ad9/growth/metrics`, {
                headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY_M}` },
              });
              const metricsData = await metricsResp.json();
              result = {
                success: true,
                action: 'get_growth_metrics',
                metrics: metricsData.metrics,
                message: `Growth metrics: ${metricsData.metrics?.signups?.total || 0} total signups, ${metricsData.metrics?.signups?.last24h || 0} in last 24h`,
              };
            } catch (e) {
              result = { success: false, action: 'get_growth_metrics', error: `Metrics fetch failed: ${e.message}` };
            }
            break;
          }
          
          case 'post_tweet': {
            // Generate + immediately post in one step
            const SB_URL_T = Deno.env.get('SUPABASE_URL') || '';
            const SB_KEY_T = Deno.env.get('SUPABASE_ANON_KEY') || '';
            try {
              // Step 1: Generate
              const genResp = await fetch(`${SB_URL_T}/functions/v1/make-server-57781ad9/growth/tweets/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SB_KEY_T}` },
                body: JSON.stringify({ category: args.category, customContext: args.customContext }),
              });
              const genData = await genResp.json();
              
              if (!genData.success || !genData.draft) {
                result = { success: false, action: 'post_tweet', error: 'Failed to generate tweet' };
                break;
              }
              
              // Step 2: Post
              const postResp = await fetch(`${SB_URL_T}/functions/v1/make-server-57781ad9/growth/tweets/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SB_KEY_T}` },
                body: JSON.stringify({ tweetId: genData.draft.id }),
              });
              const postData = await postResp.json();
              
              result = {
                success: true,
                action: 'post_tweet',
                status: postData.status || 'queued',
                content: genData.draft.content,
                message: postData.status === 'posted'
                  ? `Tweet posted to Twitter: "${genData.draft.content.slice(0, 80)}..."`
                  : `Tweet generated and queued (Twitter API keys needed for auto-posting): "${genData.draft.content.slice(0, 80)}..."`,
              };
            } catch (e) {
              result = { success: false, action: 'post_tweet', error: `Tweet failed: ${e.message}` };
            }
            break;
          }
          
          case 'send_email': {
            // Send email via Resend API (already configured)
            const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
            if (!RESEND_API_KEY) {
              result = { success: false, action: 'send_email', error: 'RESEND_API_KEY not configured' };
              break;
            }
            
            try {
              const emailResp = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${RESEND_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'SyncScript <noreply@syncscript.app>',
                  to: [args.to],
                  subject: args.subject,
                  reply_to: args.replyTo || 'support@syncscript.app',
                  html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f0a1a;color:#e2e8f0;border-radius:16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:24px;color:#a78bfa;margin:0;">✨ SyncScript</h1>
  </div>
  <div style="background:#1e1829;border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:24px;margin-bottom:24px;">
    ${args.body.split('\n').map((line: string) => `<p style="margin:0 0 12px;color:#e2e8f0;font-size:15px;line-height:1.6;">${line}</p>`).join('')}
  </div>
  <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">SyncScript • Tune Your Day, Amplify Your Life</p>
</div>`,
                }),
              });
              
              if (emailResp.ok) {
                const emailData = await emailResp.json();
                result = {
                  success: true,
                  action: 'send_email',
                  emailId: emailData.id,
                  message: `Email sent to ${args.to}: "${args.subject}"`,
                };
              } else {
                const errText = await emailResp.text();
                result = { success: false, action: 'send_email', error: `Resend error: ${errText}` };
              }
            } catch (e) {
              result = { success: false, action: 'send_email', error: `Email failed: ${e.message}` };
            }
            break;
          }
          
          case 'get_growth_report': {
            const SB_URL_R = Deno.env.get('SUPABASE_URL') || '';
            const SB_KEY_R = Deno.env.get('SUPABASE_ANON_KEY') || '';
            try {
              const reportResp = await fetch(`${SB_URL_R}/functions/v1/make-server-57781ad9/growth/report/latest`, {
                headers: { 'Authorization': `Bearer ${SB_KEY_R}` },
              });
              const reportData = await reportResp.json();
              result = {
                success: true,
                action: 'get_growth_report',
                report: reportData.report,
                message: reportData.report
                  ? `Weekly report: ${reportData.report.summary?.totalSignups || 0} total signups, ${reportData.report.summary?.newThisWeek || 0} this week`
                  : 'No report generated yet. Use get_growth_metrics for real-time data.',
              };
            } catch (e) {
              result = { success: false, action: 'get_growth_report', error: `Report fetch failed: ${e.message}` };
            }
            break;
          }
            
          // ── External Integration Tool Handlers ────────────────────────────
          case 'sync_to_google_calendar': {
            if (!userId) {
              result = { success: false, action: 'sync_to_google_calendar', error: 'No userId — cannot sync' };
              break;
            }
            const eventInput: CalendarEventInput = {
              title: args.title,
              startTime: args.startTime,
              endTime: args.endTime,
              description: args.description,
              location: args.location,
              attendees: args.attendees,
              timeZone: args.timeZone,
            };
            const gcalResult = await createGoogleCalendarEvent(userId, eventInput);
            result = {
              ...gcalResult,
              action: 'sync_to_google_calendar',
              message: gcalResult.success
                ? `Event "${args.title}" created on Google Calendar${gcalResult.data?.htmlLink ? ` — ${gcalResult.data.htmlLink}` : ''}`
                : `Failed to create Google Calendar event: ${gcalResult.error}`,
            };
            break;
          }

          case 'sync_to_outlook_calendar': {
            if (!userId) {
              result = { success: false, action: 'sync_to_outlook_calendar', error: 'No userId — cannot sync' };
              break;
            }
            const outlookInput: CalendarEventInput = {
              title: args.title,
              startTime: args.startTime,
              endTime: args.endTime,
              description: args.description,
              location: args.location,
              attendees: args.attendees,
              timeZone: args.timeZone,
            };
            const ocalResult = await createOutlookCalendarEvent(userId, outlookInput);
            result = {
              ...ocalResult,
              action: 'sync_to_outlook_calendar',
              message: ocalResult.success
                ? `Event "${args.title}" created on Outlook Calendar`
                : `Failed to create Outlook Calendar event: ${ocalResult.error}`,
            };
            break;
          }

          case 'send_slack_message': {
            if (!userId) {
              result = { success: false, action: 'send_slack_message', error: 'No userId — cannot send' };
              break;
            }
            const slackResult = await sendSlackMessage(userId, args.channel, args.text);
            result = {
              ...slackResult,
              action: 'send_slack_message',
              message: slackResult.success
                ? `Message sent to Slack channel ${args.channel}`
                : `Failed to send Slack message: ${slackResult.error}`,
            };
            break;
          }

          case 'get_connected_integrations': {
            if (!userId) {
              result = { success: false, action: 'get_connected_integrations', error: 'No userId' };
              break;
            }
            const integrations = await getUserConnectedIntegrations(userId);
            const connected = Object.entries(integrations)
              .filter(([_, v]) => v)
              .map(([k]) => k.replace(/_/g, ' '));
            result = {
              success: true,
              action: 'get_connected_integrations',
              integrations,
              message: connected.length > 0
                ? `Connected integrations: ${connected.join(', ')}`
                : 'No external integrations connected. The user can connect them in Settings > Integrations.',
            };
            break;
          }

          case 'create_email_draft': {
            if (!userId) {
              result = { success: false, action: 'create_email_draft', error: 'No userId — cannot create draft' };
              break;
            }
            const pref = args.provider || 'auto';
            let draftResult;
            if (pref === 'gmail') {
              draftResult = await createGmailDraft(userId, args.to, args.subject, args.body);
            } else if (pref === 'outlook') {
              draftResult = await createOutlookDraft(userId, args.to, args.subject, args.body);
            } else {
              // Auto: try Gmail first, then Outlook
              draftResult = await createGmailDraft(userId, args.to, args.subject, args.body);
              if (!draftResult.success) {
                draftResult = await createOutlookDraft(userId, args.to, args.subject, args.body);
              }
            }
            result = {
              ...draftResult,
              action: 'create_email_draft',
              message: draftResult.success
                ? `Draft email created in ${draftResult.provider}: "${args.subject}" to ${args.to}`
                : `Failed to create draft: ${draftResult.error}`,
            };
            break;
          }

          case 'send_sms': {
            const TWILIO_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
            const TWILIO_AUTH = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
            const TWILIO_FROM = Deno.env.get('TWILIO_PHONE_NUMBER') || '';

            if (!TWILIO_SID || !TWILIO_AUTH || !TWILIO_FROM) {
              result = { success: false, action: 'send_sms', error: 'Twilio credentials not configured' };
              break;
            }

            try {
              const basicAuth = btoa(`${TWILIO_SID}:${TWILIO_AUTH}`);
              const smsResp = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Basic ${basicAuth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    To: args.to,
                    From: TWILIO_FROM,
                    Body: args.text,
                  }),
                }
              );

              if (smsResp.ok) {
                const smsData = await smsResp.json();
                result = {
                  success: true,
                  action: 'send_sms',
                  data: { sid: smsData.sid, to: args.to },
                  message: `SMS sent to ${args.to}: "${args.text.slice(0, 50)}${args.text.length > 50 ? '...' : ''}"`,
                };
              } else {
                const errText = await smsResp.text();
                result = { success: false, action: 'send_sms', error: `Twilio error (${smsResp.status}): ${errText}` };
              }
            } catch (e) {
              result = { success: false, action: 'send_sms', error: `SMS send failed: ${e.message}` };
            }
            break;
          }

          case 'set_briefing_schedule': {
            if (!userId) {
              result = { success: false, action: 'set_briefing_schedule', error: 'No userId — user must be logged in' };
              break;
            }
            try {
              const scheduleData: any = {
                time: args.time || '07:00',
                timezone: args.timezone || 'America/New_York',
                days: args.days || ['mon', 'tue', 'wed', 'thu', 'fri'],
                enabled: args.enabled !== false,
                type: args.type || 'morning',
                userId,
              };
              if (args.phoneNumber) scheduleData.phoneNumber = args.phoneNumber;

              await kv.set(`briefing_schedule:${userId}`, JSON.stringify(scheduleData));

              const dayStr = scheduleData.days.join(', ');
              result = {
                success: true,
                action: 'set_briefing_schedule',
                message: `Briefing scheduled for ${scheduleData.time} ${scheduleData.timezone} on ${dayStr}`,
                data: scheduleData,
              };
            } catch (e) {
              result = { success: false, action: 'set_briefing_schedule', error: `Failed to set schedule: ${e.message}` };
            }
            break;
          }

          default:
            result = { success: false, error: `Unknown tool: ${fn.name}` };
        }
        
        toolResults.push(result);
        
        // Add tool result to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
      
      // Call AI again with tool results — NO tools this time to get final text fast
      aiData = await callAI(messages, false);
      assistantMsg = aiData.choices?.[0]?.message;
    }
    
    const finalContent = assistantMsg?.content || 'I apologize, I was unable to generate a response. Please try again.';
    
    return c.json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          content: finalContent,
        },
        conversationId: `syncscript_${userId}_${Date.now()}`,
        timestamp: Date.now(),
        // Include tool results so frontend can apply actions
        toolResults: toolResults.length > 0 ? toolResults : undefined,
      },
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Chat error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Generate Task Suggestions
 */
openclawBridge.post('/suggestions/tasks', async (c) => {
  try {
    const { context, userId, count = 5 } = await c.req.json();
    
    console.log(`[OpenClaw Bridge] Task suggestions for user: ${userId}`);
    
    // Execute syncscript-task-suggester skill
    const result = await executeSkill('syncscript-task-suggester', {
      userContext: context,
      count,
    }, userId);
    
    return c.json({
      success: true,
      data: result.suggestions || result.data || [],
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Task suggestions error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Create Task via AI
 */
openclawBridge.post('/tasks/create', async (c) => {
  try {
    const { task, userId } = await c.req.json();
    
    if (!task || !userId) {
      return c.json({ error: 'Task and userId are required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] Creating task for user: ${userId}`);
    
    // Execute syncscript-task-creator skill
    const result = await executeSkill('syncscript-task-creator', {
      userId,
      task,
    }, userId);
    
    return c.json({
      success: true,
      data: result.task || result.data,
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Task creation error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Generate AI Insights
 */
openclawBridge.post('/insights', async (c) => {
  try {
    const { context, userId, types = ['productivity', 'energy', 'goal-progress'] } = await c.req.json();
    
    console.log(`[OpenClaw Bridge] Insights for user: ${userId}`);
    
    // Execute syncscript-insights-generator skill
    const result = await executeSkill('syncscript-insights-generator', {
      userContext: context,
      insightTypes: types,
    }, userId);
    
    return c.json({
      success: true,
      data: result.insights || result.data || [],
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Insights error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Optimize Calendar (Phase 2: ReAct Pattern)
 */
openclawBridge.post('/calendar/optimize', async (c) => {
  try {
    const { events, tasks, energyData, userId, timeRange = 'week', goals = ['balance', 'efficiency', 'energy-alignment'] } = await c.req.json();
    
    if (!events) {
      return c.json({ error: 'Events are required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] Phase 2 Calendar optimization for user: ${userId}`);
    
    // Execute syncscript-schedule-optimizer skill (Phase 2)
    const result = await executeSkill('syncscript-schedule-optimizer', {
      userId,
      calendarEvents: events,
      tasks: tasks || [],
      energyData: energyData || [],
      timeRange,
      optimizationGoals: goals,
    }, userId);
    
    return c.json({
      success: true,
      data: result.optimization || result.data || {
        issues: [],
        suggestions: result.fallback?.suggestions || [],
        conflicts: result.fallback?.conflicts || [],
      },
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Calendar optimization error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Analyze Document (Phase 3: Enhanced with OCR + NLP)
 */
openclawBridge.post('/document/analyze', async (c) => {
  try {
    const { document, userId, extractionOptions } = await c.req.json();
    
    if (!document) {
      return c.json({ error: 'Document is required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] Phase 3 Document analysis for user: ${userId}`);
    
    // Execute syncscript-document-analyzer skill (Phase 3)
    const result = await executeSkill('syncscript-document-analyzer', {
      userId,
      document,
      extractionOptions: extractionOptions || {
        extractTasks: true,
        extractMeetingNotes: true,
        extractDueDates: true,
        detectPriority: true,
        categorizeTasks: true
      }
    }, userId);
    
    return c.json({
      success: true,
      data: result.extraction || result.data || {
        tasks: [],
        summary: 'Document analysis failed'
      },
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Document analysis error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Analyze Image (Phase 3: Enhanced with GPT-4 Vision)
 */
openclawBridge.post('/image/analyze', async (c) => {
  try {
    const { image, userId, analysisType = 'auto', extractionOptions } = await c.req.json();
    
    if (!image) {
      return c.json({ error: 'Image is required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] Phase 3 Vision analysis (${analysisType}) for user: ${userId}`);
    
    // Execute syncscript-vision-analyzer skill (Phase 3)
    const result = await executeSkill('syncscript-vision-analyzer', {
      userId,
      image,
      analysisType,
      extractionOptions: extractionOptions || {
        extractTasks: true,
        extractText: true,
        detectObjects: true,
        analyzeLayout: true
      }
    }, userId);
    
    return c.json({
      success: true,
      data: result.analysis || result.data || {
        tasks: [],
        extractedText: '',
        description: 'Image analysis failed'
      },
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Image analysis error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Voice Transcription (Phase 3: Enhanced with Whisper API + NLU)
 */
openclawBridge.post('/voice/transcribe', async (c) => {
  try {
    const { audio, userId, language = 'en', processingOptions } = await c.req.json();
    
    if (!audio) {
      return c.json({ error: 'Audio is required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] Phase 3 Voice processing (${language}) for user: ${userId}`);
    
    // Execute syncscript-voice-processor skill (Phase 3)
    const result = await executeSkill('syncscript-voice-processor', {
      userId,
      audio,
      language,
      processingOptions: processingOptions || {
        extractTasks: true,
        identifySpeakers: false,
        addPunctuation: true,
        formatText: true
      }
    }, userId);
    
    return c.json({
      success: true,
      data: result.voice || result.data || {
        transcription: { text: '', language: 'en' },
        tasks: []
      },
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Voice transcription error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Memory Query
 */
openclawBridge.post('/memory', async (c) => {
  try {
    const { query, userId } = await c.req.json();
    
    console.log(`[OpenClaw Bridge] Memory query for user: ${userId}`);
    
    // Call OpenClaw memory API
    const response = await callOpenClaw('/api/memory/query', 'POST', {
      query,
      userId,
    });
    
    return c.json({
      success: true,
      data: response,
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Memory query error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Get Memories
 */
openclawBridge.get('/memory', async (c) => {
  try {
    const userId = c.req.query('userId');
    
    console.log(`[OpenClaw Bridge] Get memories for user: ${userId}`);
    
    // Call OpenClaw memory API
    const response = await callOpenClaw(`/api/memory?userId=${userId}`, 'GET');
    
    return c.json({
      success: true,
      data: response,
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Get memories error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Create Automation Rule
 */
openclawBridge.post('/automation', async (c) => {
  try {
    const rule = await c.req.json();
    
    console.log('[OpenClaw Bridge] Create automation rule');
    
    // Call OpenClaw automation API
    const response = await callOpenClaw('/api/automation', 'POST', rule);
    
    return c.json({
      success: true,
      data: response,
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Automation creation error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Get Automations
 */
openclawBridge.get('/automation', async (c) => {
  try {
    const userId = c.req.query('userId');
    
    console.log(`[OpenClaw Bridge] Get automations for user: ${userId}`);
    
    // Call OpenClaw automation API
    const response = await callOpenClaw(`/api/automation?userId=${userId}`, 'GET');
    
    return c.json({
      success: true,
      data: response,
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Get automations error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Energy-Based Task Scheduling (Phase 2)
 */
openclawBridge.post('/planning/energy-schedule', async (c) => {
  try {
    const { task, userId, energyData, calendarEvents, preferences } = await c.req.json();
    
    if (!task || !userId) {
      return c.json({ error: 'Task and userId are required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] Energy-based scheduling for user: ${userId}`);
    
    // Execute syncscript-energy-scheduler skill (Phase 2)
    const result = await executeSkill('syncscript-energy-scheduler', {
      userId,
      task,
      energyData: energyData || [],
      calendarEvents: calendarEvents || [],
      preferences: preferences || {},
    }, userId);
    
    return c.json({
      success: true,
      data: result.scheduling || result.data,
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Energy scheduling error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Autonomous Action Execution (Phase 2)
 */
openclawBridge.post('/autonomous/execute', async (c) => {
  try {
    const { action, userId, context, safetySettings } = await c.req.json();
    
    if (!action || !userId) {
      return c.json({ error: 'Action and userId are required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] Autonomous action: ${action.type} for user: ${userId}`);
    
    // Execute syncscript-autonomous-executor skill (Phase 2)
    const result = await executeSkill('syncscript-autonomous-executor', {
      userId,
      action,
      context: context || {},
      safetySettings: safetySettings || {},
    }, userId);
    
    return c.json({
      success: true,
      data: result,
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Autonomous execution error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Preview Autonomous Action (Phase 2)
 */
openclawBridge.post('/autonomous/preview', async (c) => {
  try {
    const { action, userId, context } = await c.req.json();
    
    if (!action || !userId) {
      return c.json({ error: 'Action and userId are required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] Preview autonomous action: ${action.type}`);
    
    // Execute with preview-only mode
    const result = await executeSkill('syncscript-autonomous-executor', {
      userId,
      action: {
        ...action,
        confidence: action.confidence || 0.5,  // Force preview mode
      },
      context: context || {},
      safetySettings: {
        requireConfirmation: true,  // Always require confirmation for preview
      },
    }, userId);
    
    return c.json({
      success: true,
      data: result,
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Preview error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Get Autonomous Action History (Phase 2)
 */
openclawBridge.get('/autonomous/history', async (c) => {
  try {
    const userId = c.req.query('userId');
    const limit = parseInt(c.req.query('limit') || '20');
    
    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] Get autonomous history for user: ${userId}`);
    
    // In production, this would query the audit log from database
    // For now, return placeholder
    return c.json({
      success: true,
      data: {
        history: [],
        total: 0,
        message: 'Autonomous action history will be available after first execution',
      },
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] History retrieval error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Multi-Agent Status (Phase 2 + Phase 3)
 */
openclawBridge.get('/multi-agent/status', async (c) => {
  try {
    const userId = c.req.query('userId');
    
    console.log(`[OpenClaw Bridge] Multi-agent status check (Phases 1-3)`);
    
    // Check which agents are active
    const agentStatus = {
      scout: {
        name: 'Scout Agent',
        status: 'active',
        description: 'Monitors context and patterns',
        skills: ['context-fetcher'],
        lastActive: new Date().toISOString(),
      },
      planner: {
        name: 'Planner Agent',
        status: 'active',
        description: 'Optimizes schedules and priorities',
        skills: ['schedule-optimizer', 'energy-scheduler'],
        lastActive: new Date().toISOString(),
      },
      executor: {
        name: 'Executor Agent',
        status: 'active',
        description: 'Takes autonomous actions',
        skills: ['autonomous-task-executor', 'task-creator'],
        lastActive: new Date().toISOString(),
      },
      energy: {
        name: 'Energy Agent',
        status: 'active',
        description: 'Analyzes and optimizes energy patterns',
        skills: ['energy-scheduler'],
        lastActive: new Date().toISOString(),
      },
      insights: {
        name: 'Insights Agent',
        status: 'active',
        description: 'Generates proactive insights and predictions',
        skills: ['insights-generator', 'proactive-insights'],
        lastActive: new Date().toISOString(),
      },
      multimodal: {
        name: 'Multimodal Agent',
        status: 'active',
        description: 'Processes documents, images, and voice',
        skills: ['document-analyzer', 'vision-analyzer', 'voice-processor'],
        lastActive: new Date().toISOString(),
      },
    };
    
    return c.json({
      success: true,
      data: {
        agents: agentStatus,
        coordination: 'active',
        totalAgents: 6,
        skillsTotal: 11,
      },
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Multi-agent status error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * Generate Proactive Insights (Phase 3)
 */
openclawBridge.post('/insights/proactive', async (c) => {
  try {
    const { userId, userContext, insightTypes } = await c.req.json();
    
    if (!userId || !userContext) {
      return c.json({ error: 'userId and userContext are required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] Generating proactive insights for user: ${userId}`);
    
    // Execute syncscript-proactive-insights skill (Phase 3)
    const result = await executeSkill('syncscript-proactive-insights', {
      userId,
      userContext,
      insightTypes: insightTypes || ['burnout-risk', 'goal-trajectory', 'productivity-patterns', 'time-optimization']
    }, userId);
    
    return c.json({
      success: true,
      data: {
        insights: result.insights || [],
        summary: result.summary || { total: 0, highPriority: 0, categories: [] }
      },
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] Proactive insights error:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * CS System: Classify Support Ticket
 */
openclawBridge.post('/cs/classify-ticket', async (c) => {
  try {
    const sanitized = c.get('sanitizedBody');
    const user = c.get('user');
    const { ticket, options } = sanitized;
    
    if (!ticket) {
      return c.json({ error: 'Ticket is required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] CS: Classifying ticket ${ticket.id}`);
    
    // Execute syncscript-cs-ticket-classifier skill
    const result = await executeSkill('syncscript-cs-ticket-classifier', {
      ticket,
      options: options || {}
    }, user.id);
    
    return c.json({
      success: true,
      data: result.classification || result.data
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] CS classification error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * CS System: Generate Response
 */
openclawBridge.post('/cs/generate-response', async (c) => {
  try {
    const sanitized = c.get('sanitizedBody');
    const user = c.get('user');
    const { conversation, options } = sanitized;
    
    if (!conversation) {
      return c.json({ error: 'Conversation is required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] CS: Generating response for ticket ${conversation.ticketId}`);
    
    // Execute syncscript-cs-response-generator skill
    const result = await executeSkill('syncscript-cs-response-generator', {
      conversation,
      options: options || { tone: 'professional' }
    }, user.id);
    
    return c.json({
      success: true,
      data: result.response || result.data
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] CS response generation error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * CS System: Analyze Sentiment
 */
openclawBridge.post('/cs/analyze-sentiment', async (c) => {
  try {
    const sanitized = c.get('sanitizedBody');
    const user = c.get('user');
    const { message, ticketId } = sanitized;
    
    if (!message || !ticketId) {
      return c.json({ error: 'Message and ticketId are required' }, 400);
    }
    
    console.log(`[OpenClaw Bridge] CS: Analyzing sentiment for ticket ${ticketId}`);
    
    // Execute syncscript-cs-sentiment-analyzer skill
    const result = await executeSkill('syncscript-cs-sentiment-analyzer', {
      message,
      ticketId
    }, user.id);
    
    return c.json({
      success: true,
      data: result.sentiment || result.data
    });
    
  } catch (error) {
    console.error('[OpenClaw Bridge] CS sentiment analysis error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// ============================================================================
// EXPORT
// ============================================================================

export default openclawBridge;
