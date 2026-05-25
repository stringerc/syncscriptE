/**
 * Nexus Gmail Reader — OAuth-based Gmail API integration for morning briefings.
 *
 * Uses a stored refresh token to access the user's Gmail inbox and extract
 * important/unread emails with upcoming deadlines or action items.
 *
 * Required Vercel env vars:
 *   GMAIL_CLIENT_ID       — Google Cloud OAuth client ID
 *   GMAIL_CLIENT_SECRET   — Google Cloud OAuth client secret
 *   GMAIL_REFRESH_TOKEN   — User's stored Gmail refresh token (stringer.c.a@gmail.com)
 *
 * If any credential is missing, all functions gracefully return empty results.
 */

export interface EmailInsight {
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  deadline_date: string | null;
  action_required: string | null;
  thread_id: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
  internalDate?: string;
}

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  resultSizeEstimate?: number;
}

// ── Configuration ──────────────────────────────────────────────────

function getGmailConfig() {
  return {
    clientId: (process.env.GMAIL_CLIENT_ID || '').trim(),
    clientSecret: (process.env.GMAIL_CLIENT_SECRET || '').trim(),
    refreshToken: (process.env.GMAIL_REFRESH_TOKEN || '').trim(),
  };
}

export function isGmailConfigured(): boolean {
  const config = getGmailConfig();
  return Boolean(config.clientId && config.clientSecret && config.refreshToken);
}

// ── OAuth Token Refresh ────────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  const config = getGmailConfig();
  if (!config.clientId || !config.clientSecret || !config.refreshToken) {
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      console.error('[GmailReader] Token refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('[GmailReader] Token refresh exception:', error);
    return null;
  }
}

// ── Gmail API Calls ────────────────────────────────────────────────

/**
 * Fetch unread or important messages from the last 24 hours.
 */
export async function fetchImportantEmails(
  maxResults = 15,
): Promise<GmailMessage[]> {
  const accessToken = await getAccessToken();
  if (!accessToken) return [];

  // Gmail search query: important OR unread, from the last day
  const after = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  const query = encodeURIComponent(`is:important OR is:unread after:${after}`);

  try {
    // List message IDs
    const listResp = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=${maxResults}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!listResp.ok) {
      console.error('[GmailReader] List messages failed:', listResp.status);
      return [];
    }

    const listData: GmailListResponse = await listResp.json();
    if (!listData.messages || listData.messages.length === 0) return [];

    // Fetch each message's metadata (not full body — just headers + snippet)
    const messages: GmailMessage[] = [];
    const fetchBatch = listData.messages.slice(0, maxResults);

    await Promise.all(
      fetchBatch.map(async (ref) => {
        try {
          const msgResp = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          if (msgResp.ok) {
            const msg: GmailMessage = await msgResp.json();
            messages.push(msg);
          }
        } catch (e) {
          console.warn(`[GmailReader] Failed to fetch message ${ref.id}:`, e);
        }
      }),
    );

    return messages;
  } catch (error) {
    console.error('[GmailReader] fetchImportantEmails exception:', error);
    return [];
  }
}

/**
 * Extract structured insights from raw Gmail messages for the briefing.
 */
export function extractEmailSummaries(messages: GmailMessage[]): Array<{
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  threadId: string;
}> {
  return messages.map((msg) => {
    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    return {
      sender: getHeader('From'),
      subject: getHeader('Subject'),
      snippet: msg.snippet || '',
      date: getHeader('Date') || (msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : ''),
      threadId: msg.threadId || msg.id,
    };
  });
}

/**
 * Full pipeline: fetch emails → extract summaries → format for LLM analysis.
 * Returns a formatted string block suitable for injection into a briefing prompt.
 */
export async function getEmailBriefingBlock(): Promise<{
  block: string;
  count: number;
  configured: boolean;
}> {
  if (!isGmailConfigured()) {
    return {
      block: 'Gmail integration not configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN in Vercel env to enable email analysis.',
      count: 0,
      configured: false,
    };
  }

  const messages = await fetchImportantEmails(15);
  if (messages.length === 0) {
    return {
      block: 'No important or unread emails in the last 24 hours.',
      count: 0,
      configured: true,
    };
  }

  const summaries = extractEmailSummaries(messages);
  const emailLines = summaries.map((e, i) => {
    return `${i + 1}. FROM: ${e.sender}\n   SUBJECT: ${e.subject}\n   SNIPPET: ${e.snippet}\n   DATE: ${e.date}`;
  });

  return {
    block: `IMPORTANT EMAILS (${summaries.length} from last 24h):\n${emailLines.join('\n\n')}`,
    count: summaries.length,
    configured: true,
  };
}
