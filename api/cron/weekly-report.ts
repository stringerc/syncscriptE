/**
 * /api/cron/weekly-report — Vercel Cron Job for weekly growth report
 * 
 * Runs every Monday at 9am EST.
 * Generates a comprehensive growth report and stores it for the dashboard.
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
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-57781ad9/growth/report/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    const data = await response.json();

    console.log(`[WeeklyReport] Generated: ${data.report?.summary?.totalSignups || 0} total signups, ${data.report?.summary?.newThisWeek || 0} this week`);

    return res.status(200).json({
      success: true,
      report: data.report,
      triggeredAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[WeeklyReport] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
