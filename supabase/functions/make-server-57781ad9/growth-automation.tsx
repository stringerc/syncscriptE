/**
 * GROWTH AUTOMATION ENGINE
 * 
 * Automated growth tasks that Nexus/crons can trigger:
 * 1. Tweet generation & queueing (via Twitter API v2 or buffer queue)
 * 2. Growth metrics dashboard (signup velocity, referral rate, trial conversion)
 * 3. Email queue processing trigger
 * 4. Weekly growth report generation
 * 
 * Research:
 * - Buffer (2024): Optimal posting times → 3.2x engagement vs random
 * - HubSpot (2024): Automated drip + social → 2.1x leads vs manual
 * - Y Combinator: "Do things that don't scale" → then automate what works
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { processScheduledEmails, startDripCampaign, createSubscriber } from './email-automation.tsx';
const growthRoutes = new Hono();

// =====================================================================
// OAUTH 1.0a SIGNING FOR TWITTER API v2
// Twitter requires OAuth 1.0a User Context for posting tweets
// =====================================================================

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function buildOAuth1Header(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessSecret: string,
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID().replace(/-/g, '');

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  // Build parameter string (sorted by key)
  const paramString = Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join('&');

  // Build signature base string
  const baseString = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;

  // Build signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessSecret)}`;

  // Sign
  const signature = await hmacSha1(signingKey, baseString);
  oauthParams['oauth_signature'] = signature;

  // Build header
  const headerParts = Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

// =====================================================================
// TYPES
// =====================================================================

type TweetCategory = 'build_in_public' | 'behind_the_scenes' | 'demo' | 'milestone' | 'tip' | 'feature' | 'social_proof' | 'engagement' | 'openclaw';

interface TweetDraft {
  id: string;
  content: string;
  category: TweetCategory;
  episodeNumber?: number;
  status: 'queued' | 'approved' | 'posted' | 'rejected';
  scheduledFor?: string;
  postedAt?: string;
  createdAt: string;
  metrics?: { likes: number; retweets: number; impressions: number };
}

interface GrowthMetrics {
  timestamp: string;
  signups: {
    total: number;
    founding: number;
    early: number;
    waitlist: number;
    last24h: number;
    last7d: number;
  };
  referrals: {
    totalCodes: number;
    totalReferred: number;
    conversionRate: number;
    topReferrers: { email: string; count: number }[];
  };
  emails: {
    pendingInQueue: number;
    sentLast24h: number;
    openRate: number;
  };
  tweets: {
    queued: number;
    postedThisWeek: number;
  };
}

// =====================================================================
// TWEET GENERATION
// =====================================================================

/**
 * CONTENT STRATEGY: Build in Public + Demo-First Hybrid
 * 
 * Research-backed optimal mix:
 * - 60% Build in Public (founder journey + behind the scenes)
 * - 20% Demo/Conversion (product demos, feature showcases)
 * - 20% Community (tips, engagement, social proof)
 * 
 * Research: Athenic (2026) — BIP founders get 4.2x more day-one users
 * Research: Buffer (2026) — Founder content gets 8x engagement vs brand content
 * Research: Stormy AI — Demo tweets drive highest conversion (bolt.new: $0→$40M ARR)
 * Research: SocialInsider — Tweets under 100 chars get 17% more engagement
 * Research: X Algorithm (2026) — Replies weighted > likes; vulnerability > polish
 * Research: Rajan Chida — 0→370K followers in 125 days via daily serialized content
 */

// ── BUILD IN PUBLIC: Serialized founder journey (numbered episodes) ─────
// These tell the real story. Each one stands alone but builds the narrative.
// Research: Serialized content compounds — Day 30 readers go back to Day 1.
const BUILD_IN_PUBLIC_TEMPLATES: string[] = [
  'I\'m building an AI that calls you at 6:45am with your entire day planned.\n\nNot an alarm. A briefing.\n\nWeather. Commute. Top priorities ranked by YOUR energy levels.\n\nIt\'s called SyncScript. Here\'s the story so far 🧵',
  
  'Week {week} building SyncScript.\n\nThis week I taught our AI to post her own tweets.\n\nYes, Nexus — our AI assistant — now manages her own social media presence.\n\nWe officially live in the future.',
  
  'I quit my job to build a productivity app.\n\nNot another to-do list.\n\nAn AI that actually understands when you have energy and schedules around it.\n\n{count} people signed up before I spent $1 on ads.\n\nHere\'s what I\'ve learned.',
  
  'Day {days} of building SyncScript.\n\nRevenue: $0\nUsers: {count}\nDaily retention: 93%\n\nI don\'t care about revenue yet.\n\nThat retention number is the one that matters. People come back every single day.\n\nHere\'s why.',
  
  'The hardest part of building SyncScript isn\'t the code.\n\nIt\'s watching someone use it for the first time and realizing your "brilliant" onboarding makes zero sense.\n\nIteration #{num}. Getting closer.',
  
  'Building in public update:\n\n✅ AI wake-up calls working\n✅ Energy-based scheduling live\n✅ {count} beta testers\n🔨 Building: voice task creation\n🔨 Building: scripts marketplace\n\nIf you want in → syncscript.app',
  
  'I showed SyncScript to 10 people this week.\n\n7 said "this is exactly what I need."\n2 said "I don\'t get it."\n1 said "this already exists" (it doesn\'t).\n\nThat 70% hit rate at this stage? I\'ll take it.',
  
  'Real numbers from building SyncScript:\n\n• {count} beta signups\n• $0 spent on marketing\n• 14-hour average build days\n• 3am is my most productive hour (ironic for a productivity app founder)\n\nThe grind is real but so is the traction.',
  
  'Every morning, SyncScript calls me at 6:45.\n\nYes, I use my own product.\n\nYesterday it said: "You have 3 deep work blocks today. Your energy peaks at 10:30. I moved your hardest task there."\n\nI built this and it still impresses me.',
  
  'I got my first angry email from a beta tester today.\n\n"Your AI woke me up at 6:45 on a SATURDAY."\n\nFair point. Weekend detection is now live.\n\nThis is why you ship fast and listen faster.',
  
  'Week {week} of SyncScript.\n\nThe founding member tier (50 spots, 50% off forever) is filling up.\n\nI didn\'t expect this to work.\n\nTurns out artificial scarcity isn\'t artificial when you genuinely can only support 50 people properly.',
  
  'Someone asked me why I\'m building another productivity app.\n\nFair question.\n\nThe answer: every other app tells you WHAT to do.\n\nNone of them know WHEN you should do it.\n\nYour brain has energy cycles. SyncScript is the first app that respects that.',
];

// ── BEHIND THE SCENES: Raw dev stories, failures, real moments ──────────
// Research: Failures outperform wins by 3-5x on engagement.
// Research: Vulnerability builds trust; polished content gets throttled.
const BEHIND_THE_SCENES_TEMPLATES: string[] = [
  'SyncScript bug of the week:\n\nThe AI scheduled someone\'s gym session at 11pm because it learned they had "high energy" then.\n\nTurns out they were gaming, not exercising.\n\nEnergy detection v2 now distinguishes active vs passive energy. 🎮≠🏋️',
  
  '3am debugging session.\n\nThe energy algorithm was scheduling deep work at 2pm for everyone.\n\nFound the bug: my training data had a timezone bias.\n\nEvery user was secretly on Pacific time.\n\nNow fixed. Peak hours are actually personalized.',
  
  'Honest founder moment:\n\nI have no idea if SyncScript will work as a business.\n\nBut {count} people wake up to it every morning and keep coming back.\n\nSo I keep building.',
  
  'Things that broke this week:\n\n1. Nexus called a tester at 3am (timezone bug)\n2. Calendar sync duplicated every event 4x\n3. The "optimize schedule" button optimized nothing\n\nAll fixed now. But man, shipping daily is humbling.',
  
  'Just had a call with beta tester #12.\n\nShe said: "I\'ve tried every productivity app. This is the first one that feels like it knows me."\n\nThat\'s the sentence I\'m building toward.\n\nBack to coding.',
  
  'The unsexy work of building a startup:\n\n• 2 hours fixing a button that was 3 pixels off\n• 4 hours on email deliverability\n• 1 hour rewriting the same onboarding copy for the 9th time\n\nThis is 90% of it. The other 10% is the fun AI stuff.',
  
  'I asked Nexus (our AI) to optimize MY schedule today.\n\nShe moved my most important meeting to 10:30am (my peak energy) and blocked 2-4pm for deep work.\n\nI didn\'t ask her to. She just... knew.\n\nThis is what we\'re building.',
  
  'Shipped 3 features before lunch today:\n\n1. Voice task creation ("Hey Nexus, remind me to...")\n2. Weather-aware scheduling (rain = indoor tasks first)\n3. Energy trend graphs\n\nThe beautiful chaos of solo founding.',
  
  'Got 2 beta applications from the same company today.\n\nThey don\'t know each other.\n\nOrganic spread inside an org before we even have team features.\n\nThis is the signal I needed to start building teams functionality.',
  
  'The AI wake-up call feature almost didn\'t happen.\n\nI thought "who wants their phone to ring at 6:45am?"\n\nTurns out: almost everyone.\n\nIt\'s now the #1 reason people sign up.\n\nLesson: Build the weird thing. Test it. Let users decide.',
];

// ── DEMO: Conversion-focused tweets with clear value props ──────────────
// Research: bolt.new — single demo tweet added $1M ARR in 7 days
// Format: Hook (problem) → Show (solution) → Result → CTA
const DEMO_TEMPLATES: string[] = [
  'Watch what happens when SyncScript\'s AI plans your day:\n\n6:45am → Phone rings\n"Good morning. You have 3 meetings today. Your energy peaks at 10:30, so I moved your hardest task there. Rain at 2pm — I rescheduled your outdoor walk to 11."\n\nTry it → syncscript.app',
  
  '"Hey Nexus, I need to finish the report by Friday."\n\nNexus: "Created task. Your best focus windows this week are Tuesday 10-12 and Thursday 9-11. I\'ll block those. Want me to set reminders?"\n\nThat\'s it. Voice to scheduled deep work in 5 seconds.\n\nsyncscript.app',
  
  'Before SyncScript:\n→ Check 3 apps\n→ Manually plan day\n→ Hope you guessed right\n\nAfter SyncScript:\n→ Phone rings at 6:45\n→ AI gives you the plan\n→ Tasks matched to YOUR energy\n\nJoin {count} people who stopped guessing → syncscript.app',
  
  'SyncScript in 30 seconds:\n\n1. AI calls you each morning with your day planned\n2. Tasks auto-scheduled to your energy peaks\n3. Voice commands: "Nexus, move my 2pm"\n4. Scripts: one-click routines for morning, meetings, reviews\n\nFree 14-day trial. No credit card.\n\nsyncscript.app',
  
  'Every productivity app shows you a list.\n\nSyncScript shows you a plan:\n\n☀️ 7am — Morning routine (script)\n⚡ 10am — Deep work (peak energy)\n☕ 1pm — Meetings (low energy)\n🧠 3pm — Creative tasks (second wind)\n\nYour calendar, optimized by AI.\n\nsyncscript.app',
];

// ── LEGACY CATEGORIES (kept but deprioritized — 20% of content) ─────────
const MILESTONE_TEMPLATES: string[] = [
  '{count} people just joined the SyncScript beta.\n\nWe started {days} days ago.\n\nNo ads. No influencers. Just word of mouth.\n\nThe waitlist is still open → syncscript.app',
  'Just crossed {count} beta testers.\n\nWhat they tell us most: "I finally wake up knowing exactly what to do."\n\nJoin them → syncscript.app',
];

const TIP_TEMPLATES: string[] = [
  '3 things that actually work for productivity:\n\n1. Match tasks to your energy (not your calendar)\n2. Do the hard thing at YOUR peak hour\n3. End each day with a 5-min review\n\nI built SyncScript to automate all 3.',
  'The problem with to-do apps:\n\nThey treat 9am energy the same as 3pm energy.\n\nYour brain doesn\'t work that way.\n\nThat\'s why I built energy-based scheduling into SyncScript.',
  'Stop scheduling your hardest tasks "first thing in the morning."\n\n"First" isn\'t always when you have the most energy.\n\nTrack your energy for a week. You\'ll be surprised.\n\n(Or let SyncScript do it for you.)',
];

const ENGAGEMENT_TEMPLATES: string[] = [
  'What\'s the ONE thing you wish your productivity app could do?\n\n(Building SyncScript and I actually listen)',
  'Hot take: most productivity apps make you LESS productive.\n\nThey add friction. More checkboxes. More guilt.\n\nWhat if your app just... called you in the morning with a plan?\n\nThat\'s what I\'m building.',
  'Poll: When do you do your best deep work?\n\n🌅 Before 9am\n☀️ 9am–12pm\n🌤️ 12pm–3pm\n🌙 After 6pm\n\n(Building energy-based scheduling at syncscript.app)',
  'What time does your brain actually turn on in the morning?\n\nBe honest. Not when your alarm goes off. When you\'re actually SHARP.\n\nBuilding something that plans your day around that answer.',
];

const SOCIAL_PROOF_TEMPLATES: string[] = [
  '"I used to dread mornings. Now SyncScript calls me at 6:45 with exactly what I need to know. It\'s like having a chief of staff."\n\n— Beta tester #{num}',
  '"The energy-based scheduling changed everything. I used to force deep work at 9am. Turns out my peak is 10:30. My output doubled."\n\n— Beta tester\n\nsyncscript.app',
];

const OPENCLAW_TEMPLATES: string[] = [
  'We built SyncScript\'s AI on OpenClaw.\n\nNexus can call your phone, create tasks from voice, and optimize schedules using your energy data.\n\nAll running on open-source AI infrastructure. No black boxes. 🔓',
  'OpenClaw + SyncScript = AI productivity that you own.\n\nNo black-box algorithms. No data harvesting.\n\nYour schedule, your energy patterns, your data. Period.\n\nsyncscript.app',
];

const TWEET_TEMPLATES: Record<string, string[]> = {
  build_in_public: BUILD_IN_PUBLIC_TEMPLATES,
  behind_the_scenes: BEHIND_THE_SCENES_TEMPLATES,
  demo: DEMO_TEMPLATES,
  milestone: MILESTONE_TEMPLATES,
  tip: TIP_TEMPLATES,
  feature: DEMO_TEMPLATES, // Alias: feature requests now get demo-style content
  social_proof: SOCIAL_PROOF_TEMPLATES,
  engagement: ENGAGEMENT_TEMPLATES,
  openclaw: OPENCLAW_TEMPLATES,
};

/**
 * POST /growth/tweets/generate
 * Generate tweet content for a given category
 */
growthRoutes.post('/tweets/generate', async (c) => {
  try {
    const { category, customContext } = await c.req.json();
    
    const validCategories = Object.keys(TWEET_TEMPLATES);
    const selectedCategory = validCategories.includes(category) ? category : 'build_in_public';
    
    // Get current metrics for dynamic content
    const betaCount = (await kv.get('beta:count') as number) || 0;
    const launchDate = new Date('2026-02-01');
    const daysSinceLaunch = Math.floor((Date.now() - launchDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.ceil(daysSinceLaunch / 7);
    
    // Track episode number for build_in_public (serialized content)
    let episodeNumber = 0;
    if (selectedCategory === 'build_in_public' || selectedCategory === 'behind_the_scenes') {
      episodeNumber = ((await kv.get('growth:bip_episode') as number) || 0) + 1;
      await kv.set('growth:bip_episode', episodeNumber);
    }
    
    // Pick template — for BIP, cycle through sequentially for narrative consistency
    const templates = TWEET_TEMPLATES[selectedCategory];
    let template: string;
    if (selectedCategory === 'build_in_public') {
      const bipIndex = (episodeNumber - 1) % templates.length;
      template = templates[bipIndex];
    } else {
      template = templates[Math.floor(Math.random() * templates.length)];
    }
    
    // Fill in dynamic values
    let content = template
      .replace(/\{count\}/g, betaCount.toString())
      .replace(/\{num\}/g, (Math.floor(Math.random() * Math.max(betaCount, 1)) + 1).toString())
      .replace(/\{days\}/g, daysSinceLaunch.toString())
      .replace(/\{week\}/g, weekNumber.toString());
    
    // If custom context provided (e.g., by Nexus), append or modify
    if (customContext) {
      content = `${content}\n\n${customContext}`;
    }

    // Save as queued draft
    const draft: TweetDraft = {
      id: `tweet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      content,
      category: selectedCategory as TweetCategory,
      episodeNumber: episodeNumber || undefined,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`growth:tweet:${draft.id}`, draft);
    
    // Add to queue
    const queue = (await kv.get('growth:tweet_queue') || []) as string[];
    queue.push(draft.id);
    await kv.set('growth:tweet_queue', queue);
    
    console.log(`[Growth] Tweet generated: ${draft.id} (${selectedCategory}${episodeNumber ? ` #${episodeNumber}` : ''})`);
    
    return c.json({ success: true, draft });
  } catch (error) {
    console.error('[Growth] Tweet generation error:', error);
    return c.json({ error: 'Failed to generate tweet' }, 500);
  }
});

/**
 * POST /growth/tweets/post
 * Post a queued tweet via Twitter API v2
 */
growthRoutes.post('/tweets/post', async (c) => {
  try {
    const { tweetId } = await c.req.json();
    
    const draft = await kv.get(`growth:tweet:${tweetId}`) as TweetDraft | null;
    if (!draft || draft.status !== 'queued') {
      return c.json({ error: 'Tweet not found or already posted' }, 404);
    }
    
    // Twitter API v2 requires OAuth 1.0a User Context for posting tweets
    const TWITTER_API_KEY = Deno.env.get('TWITTER_API_KEY');
    const TWITTER_API_SECRET = Deno.env.get('TWITTER_API_SECRET');
    const TWITTER_ACCESS_TOKEN = Deno.env.get('TWITTER_ACCESS_TOKEN');
    const TWITTER_ACCESS_SECRET = Deno.env.get('TWITTER_ACCESS_SECRET');
    
    if (!TWITTER_API_KEY || !TWITTER_ACCESS_TOKEN) {
      draft.status = 'approved';
      await kv.set(`growth:tweet:${tweetId}`, draft);
      
      console.log(`[Growth] Tweet approved for manual posting (no Twitter API keys): ${tweetId}`);
      return c.json({
        success: true,
        status: 'approved',
        message: 'Twitter API not configured. Tweet saved for manual posting.',
        content: draft.content,
      });
    }
    
    // Post via Twitter API v2 with OAuth 1.0a User Context
    try {
      const authHeader = await buildOAuth1Header(
        'POST',
        'https://api.twitter.com/2/tweets',
        TWITTER_API_KEY,
        TWITTER_API_SECRET!,
        TWITTER_ACCESS_TOKEN,
        TWITTER_ACCESS_SECRET!,
      );
      
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({ text: draft.content }),
      });
      
      if (response.ok) {
        const data = await response.json();
        draft.status = 'posted';
        draft.postedAt = new Date().toISOString();
        await kv.set(`growth:tweet:${tweetId}`, draft);
        
        const today = new Date().toISOString().split('T')[0];
        const dailyCount = ((await kv.get(`growth:tweets_posted:${today}`) as number) || 0) + 1;
        await kv.set(`growth:tweets_posted:${today}`, dailyCount);
        
        console.log(`[Growth] Tweet posted to Twitter: ${tweetId} → ${data.data?.id}`);
        return c.json({ success: true, status: 'posted', twitterId: data.data?.id, tweetUrl: `https://x.com/syncscript/status/${data.data?.id}` });
      } else {
        const errorText = await response.text();
        console.error(`[Growth] Twitter API error: ${response.status} ${errorText}`);
        draft.status = 'approved';
        await kv.set(`growth:tweet:${tweetId}`, draft);
        return c.json({ success: false, status: 'approved', error: `Twitter API ${response.status}: ${errorText}`, content: draft.content });
      }
    } catch (twitterError) {
      console.error('[Growth] Twitter posting failed:', twitterError);
      draft.status = 'approved';
      await kv.set(`growth:tweet:${tweetId}`, draft);
      return c.json({ success: false, status: 'approved', error: 'Twitter API call failed', content: draft.content });
    }
  } catch (error) {
    console.error('[Growth] Tweet posting error:', error);
    return c.json({ error: 'Failed to post tweet' }, 500);
  }
});

/**
 * GET /growth/tweets/queue
 * Get all queued/approved tweets
 */
growthRoutes.get('/tweets/queue', async (c) => {
  try {
    const queue = (await kv.get('growth:tweet_queue') || []) as string[];
    const tweets: TweetDraft[] = [];
    
    for (const id of queue.slice(-20)) { // Last 20
      const tweet = await kv.get(`growth:tweet:${id}`) as TweetDraft | null;
      if (tweet) tweets.push(tweet);
    }
    
    return c.json({
      success: true,
      tweets: tweets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      total: queue.length,
    });
  } catch (error) {
    return c.json({ error: 'Failed to get tweet queue' }, 500);
  }
});

// =====================================================================
// GROWTH METRICS DASHBOARD
// =====================================================================

/**
 * GET /growth/metrics
 * Real-time growth metrics — signup velocity, referral rate, email stats
 */
growthRoutes.get('/metrics', async (c) => {
  try {
    const betaCount = (await kv.get('beta:count') as number) || 0;
    
    // Get all signups for detailed metrics
    const signups = await kv.getByPrefix('beta:signup:');
    const betaSignups = signups as any[];
    
    const now = Date.now();
    const last24h = betaSignups.filter(s => now - new Date(s.signupDate).getTime() < 24 * 60 * 60 * 1000).length;
    const last7d = betaSignups.filter(s => now - new Date(s.signupDate).getTime() < 7 * 24 * 60 * 60 * 1000).length;
    
    // Tier breakdown
    const founding = betaSignups.filter(s => s.tier === 'founding').length;
    const early = betaSignups.filter(s => s.tier === 'early').length;
    const waitlist = betaSignups.filter(s => s.tier === 'waitlist').length;
    
    // Referral metrics
    const referredSignups = betaSignups.filter(s => s.referredBy).length;
    const referralRate = betaCount > 0 ? (referredSignups / betaCount * 100) : 0;
    
    const topReferrers = betaSignups
      .filter(s => (s.referralCount || 0) > 0)
      .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
      .slice(0, 5)
      .map(s => ({ email: s.email.split('@')[0] + '***', count: s.referralCount || 0 }));
    
    // Email metrics
    const pendingQueue = (await kv.get('email_pending_queue') || []) as string[];
    
    // Tweet metrics
    const tweetQueue = (await kv.get('growth:tweet_queue') || []) as string[];
    const today = new Date().toISOString().split('T')[0];
    const tweetsToday = (await kv.get(`growth:tweets_posted:${today}`) as number) || 0;
    
    const metrics: GrowthMetrics = {
      timestamp: new Date().toISOString(),
      signups: {
        total: betaCount,
        founding,
        early,
        waitlist,
        last24h,
        last7d,
      },
      referrals: {
        totalCodes: betaCount, // Every signup gets a code
        totalReferred: referredSignups,
        conversionRate: Math.round(referralRate * 10) / 10,
        topReferrers,
      },
      emails: {
        pendingInQueue: pendingQueue.length,
        sentLast24h: 0, // Would need to count from events
        openRate: 0,
      },
      tweets: {
        queued: tweetQueue.length,
        postedThisWeek: tweetsToday,
      },
    };
    
    // Cache metrics
    await kv.set('growth:latest_metrics', metrics);
    
    return c.json({ success: true, metrics });
  } catch (error) {
    console.error('[Growth] Metrics error:', error);
    return c.json({ error: 'Failed to calculate metrics' }, 500);
  }
});

// =====================================================================
// EMAIL QUEUE PROCESSING (Triggered by cron)
// =====================================================================

/**
 * POST /growth/emails/process
 * Process pending email queue — called by Vercel cron every hour
 */
growthRoutes.post('/emails/process', async (c) => {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return c.json({ error: 'RESEND_API_KEY not configured' }, 503);
    }
    
    const processed = await processScheduledEmails(resendApiKey);
    
    console.log(`[Growth] Email queue processed: ${processed} emails sent`);
    
    return c.json({ success: true, processed });
  } catch (error) {
    console.error('[Growth] Email processing error:', error);
    return c.json({ error: 'Failed to process email queue' }, 500);
  }
});

/**
 * POST /growth/trial/start
 * Start reverse trial drip for a new user
 */
growthRoutes.post('/trial/start', async (c) => {
  try {
    const { email, name } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    // Create subscriber if not exists
    const subscriber = await createSubscriber(email, name, ['reverse_trial']);
    
    // Start the reverse trial drip campaign
    await startDripCampaign(email, 'reverse_trial_sequence');
    
    console.log(`[Growth] Reverse trial started for ${email}`);
    
    return c.json({ success: true, message: `Trial drip started for ${email}` });
  } catch (error) {
    console.error('[Growth] Trial start error:', error);
    return c.json({ error: 'Failed to start trial drip' }, 500);
  }
});

// =====================================================================
// WEEKLY GROWTH REPORT (Generated by cron, stored for dashboard)
// =====================================================================

/**
 * POST /growth/report/generate
 * Generate weekly growth report — called by cron every Monday
 */
growthRoutes.post('/report/generate', async (c) => {
  try {
    const betaCount = (await kv.get('beta:count') as number) || 0;
    const signups = await kv.getByPrefix('beta:signup:');
    const betaSignups = signups as any[];
    
    const now = Date.now();
    const last7d = betaSignups.filter(s => now - new Date(s.signupDate).getTime() < 7 * 24 * 60 * 60 * 1000);
    
    const report = {
      id: `report_${new Date().toISOString().split('T')[0]}`,
      generatedAt: new Date().toISOString(),
      period: 'weekly',
      summary: {
        totalSignups: betaCount,
        newThisWeek: last7d.length,
        growthRate: betaCount > 0 ? Math.round((last7d.length / betaCount) * 100) : 0,
        referralSignups: last7d.filter(s => s.referredBy).length,
        tierBreakdown: {
          founding: betaSignups.filter(s => s.tier === 'founding').length,
          early: betaSignups.filter(s => s.tier === 'early').length,
          waitlist: betaSignups.filter(s => s.tier === 'waitlist').length,
        },
      },
      highlights: [] as string[],
    };
    
    // Generate highlights
    if (last7d.length > 10) report.highlights.push(`🔥 Strong week: ${last7d.length} new signups`);
    if (report.summary.referralSignups > 0) report.highlights.push(`🔗 ${report.summary.referralSignups} came from referrals`);
    if (betaCount >= 50 && betaSignups.filter(s => s.tier === 'founding').length >= 50) {
      report.highlights.push('🏆 Founding tier is FULL');
    }
    
    // Save report
    await kv.set(`growth:report:${report.id}`, report);
    await kv.set('growth:latest_report', report);
    
    console.log(`[Growth] Weekly report generated: ${report.id}`);
    
    return c.json({ success: true, report });
  } catch (error) {
    console.error('[Growth] Report generation error:', error);
    return c.json({ error: 'Failed to generate report' }, 500);
  }
});

/**
 * GET /growth/report/latest
 */
growthRoutes.get('/report/latest', async (c) => {
  try {
    const report = await kv.get('growth:latest_report');
    if (!report) {
      return c.json({ success: false, message: 'No reports generated yet' });
    }
    return c.json({ success: true, report });
  } catch (error) {
    return c.json({ error: 'Failed to get report' }, 500);
  }
});

export default growthRoutes;
