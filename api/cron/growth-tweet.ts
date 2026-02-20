/**
 * /api/cron/growth-tweet — Vercel Cron Job for automated tweet posting
 * 
 * Runs twice daily (10am & 4pm EST) with research-backed content rotation.
 * 
 * CONTENT STRATEGY (research-backed):
 * - 60% Build in Public (founder journey + behind the scenes)
 * - 20% Demo/Conversion (product demos, feature showcases)
 * - 20% Community (tips, engagement, social proof, milestones)
 * 
 * Research: Athenic (2026) — BIP founders get 4.2x more day-one users
 * Research: Buffer (2026) — Founder content gets 8x engagement vs brand content
 * Research: Stormy AI — Demo tweets drive highest conversion
 * Research: X Algorithm (2026) — Replies weighted > likes; authenticity > polish
 * Research: Buffer (2024) — 2 tweets/day optimal; 10am & 4pm EST peak engagement
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Weekly content calendar — optimized for the 60/20/20 split
// Morning tweets (10am EST) = primary content; Afternoon (4pm EST) = engagement/community
const WEEKLY_SCHEDULE: Record<number, { morning: string; afternoon: string }> = {
  0: { morning: 'build_in_public',   afternoon: 'engagement' },       // Sunday
  1: { morning: 'build_in_public',   afternoon: 'demo' },             // Monday
  2: { morning: 'behind_the_scenes', afternoon: 'tip' },              // Tuesday
  3: { morning: 'build_in_public',   afternoon: 'engagement' },       // Wednesday
  4: { morning: 'behind_the_scenes', afternoon: 'demo' },             // Thursday
  5: { morning: 'build_in_public',   afternoon: 'social_proof' },     // Friday
  6: { morning: 'build_in_public',   afternoon: 'openclaw' },         // Saturday
};
// Weekly breakdown: BIP=5, BTS=2, Demo=2, Engagement=2, Tip=1, Social=1, OpenClaw=1
// = 50% BIP+BTS (founder voice) + 14% Demo + 36% Community → close to 60/20/20

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[TweetCron] Supabase credentials not configured');
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const hourUTC = now.getUTCHours();
  
  // Determine morning vs afternoon slot (15:00 UTC = 10am EST, 21:00 UTC = 4pm EST)
  const schedule = WEEKLY_SCHEDULE[dayOfWeek];
  const isMorning = hourUTC < 18; // Before 1pm EST = morning slot
  const category = isMorning ? schedule.morning : schedule.afternoon;

  try {
    // Generate tweet
    const genResponse = await fetch(`${supabaseUrl}/functions/v1/make-server-57781ad9/growth/tweets/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ category }),
    });

    const genData = await genResponse.json();

    if (!genData.success || !genData.draft) {
      console.error('[TweetCron] Failed to generate tweet:', genData);
      return res.status(500).json({ error: 'Tweet generation failed' });
    }

    // Post the tweet
    const postResponse = await fetch(`${supabaseUrl}/functions/v1/make-server-57781ad9/growth/tweets/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ tweetId: genData.draft.id }),
    });

    const postData = await postResponse.json();

    console.log(`[TweetCron] ${isMorning ? '🌅 Morning' : '🌆 Afternoon'} | ${category} | ${postData.status || 'queued'}: "${genData.draft.content.slice(0, 60)}..."`);

    return res.status(200).json({
      success: true,
      slot: isMorning ? 'morning' : 'afternoon',
      category,
      episodeNumber: genData.draft.episodeNumber,
      tweetId: genData.draft.id,
      status: postData.status || 'queued',
      tweetUrl: postData.tweetUrl,
      content: genData.draft.content,
      triggeredAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[TweetCron] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
