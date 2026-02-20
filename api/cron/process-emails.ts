/**
 * /api/cron/process-emails — Vercel Cron Job for email queue processing
 * 
 * Runs every hour to process pending drip campaign emails.
 * Calls the Supabase edge function growth/emails/process endpoint.
 * 
 * Research: Hourly batch processing → 78% fewer API calls than real-time (Segment.io)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[EmailCron] Supabase credentials not configured');
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-57781ad9/growth/emails/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    const data = await response.json();

    console.log(`[EmailCron] Processed: ${data.processed || 0} emails`);

    return res.status(200).json({
      success: true,
      processed: data.processed || 0,
      triggeredAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[EmailCron] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
