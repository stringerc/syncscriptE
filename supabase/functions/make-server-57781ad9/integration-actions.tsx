// External Integration Actions — write operations for connected third-party apps.
// Uses stored OAuth tokens (with auto-refresh) to perform real API calls.

import * as kv from "./kv_store.tsx";
import { getValidToken } from "./oauth-routes.tsx";

// ============================================================================
// TYPES
// ============================================================================

export interface CalendarEventInput {
  title: string;
  description?: string;
  startTime: string;   // ISO 8601
  endTime: string;     // ISO 8601
  location?: string;
  attendees?: string[]; // email addresses
  timeZone?: string;
}

export interface IntegrationActionResult {
  success: boolean;
  provider: string;
  action: string;
  data?: any;
  error?: string;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function logAction(
  userId: string,
  provider: string,
  action: string,
  payload: any,
  result: IntegrationActionResult
) {
  const timestamp = new Date().toISOString();
  const logKey = `integration_actions:${userId}:${timestamp}`;
  await kv.set(logKey, { provider, action, payload, result, timestamp });
}

// ============================================================================
// GOOGLE CALENDAR
// ============================================================================

export async function createGoogleCalendarEvent(
  userId: string,
  event: CalendarEventInput
): Promise<IntegrationActionResult> {
  const token = await getValidToken('google_calendar', userId);
  if (!token) {
    return { success: false, provider: 'google_calendar', action: 'create_event', error: 'No valid token — user needs to reconnect Google Calendar' };
  }

  const body = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    start: {
      dateTime: event.startTime,
      timeZone: event.timeZone || 'America/New_York',
    },
    end: {
      dateTime: event.endTime,
      timeZone: event.timeZone || 'America/New_York',
    },
    attendees: event.attendees?.map(email => ({ email })) || [],
  };

  try {
    const resp = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[INTEGRATION] Google Calendar create failed:', errText);
      const result: IntegrationActionResult = { success: false, provider: 'google_calendar', action: 'create_event', error: errText };
      await logAction(userId, 'google_calendar', 'create_event', event, result);
      return result;
    }

    const data = await resp.json();
    const result: IntegrationActionResult = {
      success: true,
      provider: 'google_calendar',
      action: 'create_event',
      data: { eventId: data.id, htmlLink: data.htmlLink, summary: data.summary },
    };
    await logAction(userId, 'google_calendar', 'create_event', event, result);
    return result;
  } catch (err) {
    const result: IntegrationActionResult = { success: false, provider: 'google_calendar', action: 'create_event', error: String(err) };
    await logAction(userId, 'google_calendar', 'create_event', event, result);
    return result;
  }
}

export async function updateGoogleCalendarEvent(
  userId: string,
  eventId: string,
  updates: Partial<CalendarEventInput>
): Promise<IntegrationActionResult> {
  const token = await getValidToken('google_calendar', userId);
  if (!token) {
    return { success: false, provider: 'google_calendar', action: 'update_event', error: 'No valid token' };
  }

  const body: any = {};
  if (updates.title) body.summary = updates.title;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.location !== undefined) body.location = updates.location;
  if (updates.startTime) body.start = { dateTime: updates.startTime, timeZone: updates.timeZone || 'America/New_York' };
  if (updates.endTime) body.end = { dateTime: updates.endTime, timeZone: updates.timeZone || 'America/New_York' };
  if (updates.attendees) body.attendees = updates.attendees.map(email => ({ email }));

  try {
    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      const result: IntegrationActionResult = { success: false, provider: 'google_calendar', action: 'update_event', error: errText };
      await logAction(userId, 'google_calendar', 'update_event', { eventId, updates }, result);
      return result;
    }

    const data = await resp.json();
    const result: IntegrationActionResult = { success: true, provider: 'google_calendar', action: 'update_event', data: { eventId: data.id, summary: data.summary } };
    await logAction(userId, 'google_calendar', 'update_event', { eventId, updates }, result);
    return result;
  } catch (err) {
    const result: IntegrationActionResult = { success: false, provider: 'google_calendar', action: 'update_event', error: String(err) };
    await logAction(userId, 'google_calendar', 'update_event', { eventId, updates }, result);
    return result;
  }
}

export async function deleteGoogleCalendarEvent(
  userId: string,
  eventId: string
): Promise<IntegrationActionResult> {
  const token = await getValidToken('google_calendar', userId);
  if (!token) {
    return { success: false, provider: 'google_calendar', action: 'delete_event', error: 'No valid token' };
  }

  try {
    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
    );

    const result: IntegrationActionResult = resp.ok || resp.status === 204
      ? { success: true, provider: 'google_calendar', action: 'delete_event', data: { eventId } }
      : { success: false, provider: 'google_calendar', action: 'delete_event', error: await resp.text() };
    await logAction(userId, 'google_calendar', 'delete_event', { eventId }, result);
    return result;
  } catch (err) {
    const result: IntegrationActionResult = { success: false, provider: 'google_calendar', action: 'delete_event', error: String(err) };
    await logAction(userId, 'google_calendar', 'delete_event', { eventId }, result);
    return result;
  }
}

// ============================================================================
// OUTLOOK CALENDAR (Microsoft Graph API)
// ============================================================================

export async function createOutlookCalendarEvent(
  userId: string,
  event: CalendarEventInput
): Promise<IntegrationActionResult> {
  const token = await getValidToken('outlook_calendar', userId);
  if (!token) {
    return { success: false, provider: 'outlook_calendar', action: 'create_event', error: 'No valid token — user needs to reconnect Outlook' };
  }

  const body = {
    subject: event.title,
    body: { contentType: 'Text', content: event.description || '' },
    start: { dateTime: event.startTime, timeZone: event.timeZone || 'Eastern Standard Time' },
    end: { dateTime: event.endTime, timeZone: event.timeZone || 'Eastern Standard Time' },
    location: { displayName: event.location || '' },
    attendees: event.attendees?.map(email => ({
      emailAddress: { address: email },
      type: 'required',
    })) || [],
  };

  try {
    const resp = await fetch(
      'https://graph.microsoft.com/v1.0/me/calendar/events',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[INTEGRATION] Outlook Calendar create failed:', errText);
      const result: IntegrationActionResult = { success: false, provider: 'outlook_calendar', action: 'create_event', error: errText };
      await logAction(userId, 'outlook_calendar', 'create_event', event, result);
      return result;
    }

    const data = await resp.json();
    const result: IntegrationActionResult = {
      success: true,
      provider: 'outlook_calendar',
      action: 'create_event',
      data: { eventId: data.id, webLink: data.webLink, subject: data.subject },
    };
    await logAction(userId, 'outlook_calendar', 'create_event', event, result);
    return result;
  } catch (err) {
    const result: IntegrationActionResult = { success: false, provider: 'outlook_calendar', action: 'create_event', error: String(err) };
    await logAction(userId, 'outlook_calendar', 'create_event', event, result);
    return result;
  }
}

export async function updateOutlookCalendarEvent(
  userId: string,
  eventId: string,
  updates: Partial<CalendarEventInput>
): Promise<IntegrationActionResult> {
  const token = await getValidToken('outlook_calendar', userId);
  if (!token) {
    return { success: false, provider: 'outlook_calendar', action: 'update_event', error: 'No valid token' };
  }

  const body: any = {};
  if (updates.title) body.subject = updates.title;
  if (updates.description !== undefined) body.body = { contentType: 'Text', content: updates.description };
  if (updates.startTime) body.start = { dateTime: updates.startTime, timeZone: updates.timeZone || 'Eastern Standard Time' };
  if (updates.endTime) body.end = { dateTime: updates.endTime, timeZone: updates.timeZone || 'Eastern Standard Time' };
  if (updates.location !== undefined) body.location = { displayName: updates.location };
  if (updates.attendees) body.attendees = updates.attendees.map(email => ({ emailAddress: { address: email }, type: 'required' }));

  try {
    const resp = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendar/events/${eventId}`,
      {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      const result: IntegrationActionResult = { success: false, provider: 'outlook_calendar', action: 'update_event', error: errText };
      await logAction(userId, 'outlook_calendar', 'update_event', { eventId, updates }, result);
      return result;
    }

    const data = await resp.json();
    const result: IntegrationActionResult = { success: true, provider: 'outlook_calendar', action: 'update_event', data: { eventId: data.id, subject: data.subject } };
    await logAction(userId, 'outlook_calendar', 'update_event', { eventId, updates }, result);
    return result;
  } catch (err) {
    const result: IntegrationActionResult = { success: false, provider: 'outlook_calendar', action: 'update_event', error: String(err) };
    await logAction(userId, 'outlook_calendar', 'update_event', { eventId, updates }, result);
    return result;
  }
}

// ============================================================================
// SLACK
// ============================================================================

export async function sendSlackMessage(
  userId: string,
  channel: string,
  text: string
): Promise<IntegrationActionResult> {
  const token = await getValidToken('slack', userId);
  if (!token) {
    return { success: false, provider: 'slack', action: 'send_message', error: 'No valid token — user needs to reconnect Slack' };
  }

  try {
    const resp = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel, text }),
    });

    const data = await resp.json();
    if (!data.ok) {
      const result: IntegrationActionResult = { success: false, provider: 'slack', action: 'send_message', error: data.error || 'Unknown Slack error' };
      await logAction(userId, 'slack', 'send_message', { channel, text }, result);
      return result;
    }

    const result: IntegrationActionResult = {
      success: true,
      provider: 'slack',
      action: 'send_message',
      data: { channel: data.channel, ts: data.ts, messageText: text },
    };
    await logAction(userId, 'slack', 'send_message', { channel, text }, result);
    return result;
  } catch (err) {
    const result: IntegrationActionResult = { success: false, provider: 'slack', action: 'send_message', error: String(err) };
    await logAction(userId, 'slack', 'send_message', { channel, text }, result);
    return result;
  }
}

export async function setSlackStatus(
  userId: string,
  statusText: string,
  statusEmoji: string = ''
): Promise<IntegrationActionResult> {
  const token = await getValidToken('slack', userId);
  if (!token) {
    return { success: false, provider: 'slack', action: 'set_status', error: 'No valid token' };
  }

  try {
    const resp = await fetch('https://slack.com/api/users.profile.set', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile: {
          status_text: statusText,
          status_emoji: statusEmoji,
          status_expiration: 0,
        },
      }),
    });

    const data = await resp.json();
    if (!data.ok) {
      const result: IntegrationActionResult = { success: false, provider: 'slack', action: 'set_status', error: data.error || 'Unknown Slack error' };
      await logAction(userId, 'slack', 'set_status', { statusText, statusEmoji }, result);
      return result;
    }

    const result: IntegrationActionResult = { success: true, provider: 'slack', action: 'set_status', data: { statusText, statusEmoji } };
    await logAction(userId, 'slack', 'set_status', { statusText, statusEmoji }, result);
    return result;
  } catch (err) {
    const result: IntegrationActionResult = { success: false, provider: 'slack', action: 'set_status', error: String(err) };
    await logAction(userId, 'slack', 'set_status', { statusText, statusEmoji }, result);
    return result;
  }
}

// ============================================================================
// GMAIL DRAFT CREATION
// ============================================================================

export async function createGmailDraft(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<IntegrationActionResult> {
  const token = await getValidToken('google_calendar', userId);
  if (!token) {
    return { success: false, provider: 'gmail', action: 'create_draft', error: 'No valid Google token — user needs to reconnect Google (with Gmail scope)' };
  }

  // Gmail API expects RFC 2822 encoded as base64url
  const rawMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n');
  const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  try {
    const resp = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/drafts',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: { raw: encoded },
        }),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[INTEGRATION] Gmail draft creation failed:', errText);
      const result: IntegrationActionResult = { success: false, provider: 'gmail', action: 'create_draft', error: errText };
      await logAction(userId, 'gmail', 'create_draft', { to, subject }, result);
      return result;
    }

    const data = await resp.json();
    const result: IntegrationActionResult = {
      success: true,
      provider: 'gmail',
      action: 'create_draft',
      data: { draftId: data.id, messageId: data.message?.id, to, subject },
    };
    await logAction(userId, 'gmail', 'create_draft', { to, subject }, result);
    return result;
  } catch (err) {
    const result: IntegrationActionResult = { success: false, provider: 'gmail', action: 'create_draft', error: String(err) };
    await logAction(userId, 'gmail', 'create_draft', { to, subject }, result);
    return result;
  }
}

// ============================================================================
// OUTLOOK DRAFT CREATION (Microsoft Graph)
// ============================================================================

export async function createOutlookDraft(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<IntegrationActionResult> {
  const token = await getValidToken('outlook_calendar', userId);
  if (!token) {
    return { success: false, provider: 'outlook', action: 'create_draft', error: 'No valid Outlook token — user needs to reconnect Microsoft (with Mail scope)' };
  }

  const msgBody = {
    subject,
    body: { contentType: 'Text', content: body },
    toRecipients: [{ emailAddress: { address: to } }],
    isDraft: true,
  };

  try {
    const resp = await fetch(
      'https://graph.microsoft.com/v1.0/me/messages',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(msgBody),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[INTEGRATION] Outlook draft creation failed:', errText);
      const result: IntegrationActionResult = { success: false, provider: 'outlook', action: 'create_draft', error: errText };
      await logAction(userId, 'outlook', 'create_draft', { to, subject }, result);
      return result;
    }

    const data = await resp.json();
    const result: IntegrationActionResult = {
      success: true,
      provider: 'outlook',
      action: 'create_draft',
      data: { messageId: data.id, webLink: data.webLink, to, subject },
    };
    await logAction(userId, 'outlook', 'create_draft', { to, subject }, result);
    return result;
  } catch (err) {
    const result: IntegrationActionResult = { success: false, provider: 'outlook', action: 'create_draft', error: String(err) };
    await logAction(userId, 'outlook', 'create_draft', { to, subject }, result);
    return result;
  }
}

// ============================================================================
// HELPER: Sync a calendar event to whichever calendar the user has connected
// ============================================================================

export async function syncCalendarEventToConnected(
  userId: string,
  event: CalendarEventInput
): Promise<IntegrationActionResult[]> {
  const results: IntegrationActionResult[] = [];

  const googleToken = await getValidToken('google_calendar', userId);
  if (googleToken) {
    results.push(await createGoogleCalendarEvent(userId, event));
  }

  const outlookToken = await getValidToken('outlook_calendar', userId);
  if (outlookToken) {
    results.push(await createOutlookCalendarEvent(userId, event));
  }

  return results;
}
