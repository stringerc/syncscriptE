/**
 * /api/cron/guest-cleanup — Vercel Cron Job to clean expired guest sessions
 * 
 * Runs daily at 4:00 AM UTC. Calls the Supabase Edge Function's guest cleanup endpoint.
 * 
 * Security: Validates CRON_SECRET to prevent unauthorized triggers.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('[GuestCleanup] SUPABASE_URL not configured');
    return res.status(500).json({ error: 'SUPABASE_URL not set' });
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/make-server-57781ad9/auth/guest/cleanup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[GuestCleanup] Cleanup failed:', data);
      return res.status(502).json({ error: 'Cleanup request failed', detail: data });
    }

    console.log('[GuestCleanup] Success:', data);
    return res.status(200).json({ success: true, ...data });
  } catch (error: any) {
    console.error('[GuestCleanup] Exception:', error);
    return res.status(500).json({ error: error.message });
  }
}
