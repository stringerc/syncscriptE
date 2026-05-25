/**
 * Nexus Gmail Reader — Multi-tenant email integration for morning briefings.
 *
 * Supports two credential sources:
 * 1. Per-user KV store (nexus_email_creds:{userId}) — for multi-tenant cloud use
 * 2. Global env vars (GMAIL_CLIENT_ID, etc.) — fallback for single-user setups
 *
 * If credentials are missing from both sources, functions gracefully return empty results.
 */

import { kvGet } from '../phone/_helpers';

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

/** Load per-user email credentials from KV, falling back to env vars. */
export async function getEmailCredentials(userId: string): Promise<{
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  emailAddress: string;
} | null> {
  // Try KV first (multi-tenant)
  try {
    const kvCreds = await kvGet(`nexus_email_creds:${userId}`) as any;
    if (kvCreds?.appPassword && kvCreds?.emailAddress) {
      return {
        clientId: process.env.GMAIL_CLIENT_ID || '',
        clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
        refreshToken: kvCreds.appPassword,
        emailAddress: kvCreds.emailAddress,
      };
    }
  } catch {}

  // Fallback to env vars (single-user legacy mode)
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (clientId && clientSecret && refreshToken) {
    return { clientId, clientSecret, refreshToken, emailAddress: 'stringer.c.a@gmail.com' };
  }

  return null;
}

export async function isGmailConfigured(userId?: string): Promise<boolean> {
  if (userId) {
    const kvCreds = await getEmailCredentials(userId);
    return kvCreds !== null;
  }
  return Boolean(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN
  );
}

async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
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
    console.error('[GmailReader] Token refresh error:', error);
    return null;
  }
}

export async function fetchImportantEmails(
  userId?: string,
  maxResults = 10,
): Promise<any[]> {
  const creds = userId ? await getEmailCredentials(userId) : null;
  const clientId = creds?.clientId || process.env.GMAIL_CLIENT_ID;
  const clientSecret = creds?.clientSecret || process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = creds?.refreshToken || process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[GmailReader] Credentials not available, returning empty');
    return [];
  }

  const accessToken = await refreshAccessToken(clientId, clientSecret, refreshToken);
  if (!accessToken) return [];

  try {
    const query = 'is:unread newer_than:1d';
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) return [];
    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('[GmailReader] Fetch failed:', error);
    return [];
  }
}

export function extractEmailSummaries(messages: any[]): EmailInsight[] {
  return messages.map((msg: any) => ({
    sender: msg.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown',
    subject: msg.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '(no subject)',
    snippet: msg.snippet || '',
    date: msg.payload?.headers?.find((h: any) => h.name === 'Date')?.value || '',
    urgency: 'medium' as const,
    deadline_date: null,
    action_required: null,
    thread_id: msg.threadId || msg.id || '',
  }));
}

export function getEmailBriefingBlock(insights: EmailInsight[]): string {
  if (insights.length === 0) return '';
  return `EMAILS (${insights.length} unread):\n` +
    insights.map(e => `- From: ${e.sender} | Subject: ${e.subject}`).join('\n');
}
