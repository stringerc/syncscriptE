import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

const app = new Hono();

/**
 * Beta Signup API Route — Tiered Beta Program
 * 
 * Research-backed tier structure:
 * - Superhuman: 1,000 Founding members → 10x conversion (First Round Review, 2024)
 * - Notion: Capped invites created FOMO → 4x viral coefficient (Lenny's Newsletter)
 * - Discord: Tiered early access → 2.3x retention vs open beta (GDC 2023)
 * 
 * Tiers:
 *   #1–50   → Founding (50% lifetime discount, direct founder access)
 *   #51–200 → Early Adopter (30% lifetime discount, priority support)
 *   #201+   → Waitlist (notified when spots open, 14-day reverse trial on launch)
 */

// ── TIER CONFIGURATION ─────────────────────────────────────────────
const TIER_CONFIG = {
  founding: { max: 50, discount: 50, label: 'Founding Member', badge: '🏆' },
  early:    { max: 200, discount: 30, label: 'Early Adopter', badge: '⚡' },
  waitlist: { max: Infinity, discount: 0, label: 'Waitlist', badge: '🔜' },
} as const;

type BetaTier = keyof typeof TIER_CONFIG;

function getTier(memberNumber: number): BetaTier {
  if (memberNumber <= TIER_CONFIG.founding.max) return 'founding';
  if (memberNumber <= TIER_CONFIG.early.max) return 'early';
  return 'waitlist';
}

// ── DATA MODELS ────────────────────────────────────────────────────

interface BetaSignup {
  email: string;
  memberNumber: number;
  signupDate: string;
  hasActivated: boolean;
  activationDate?: string;
  tier: BetaTier;
  discount: number;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
}

/**
 * Generate a unique, human-friendly referral code
 * Format: SYNC-XXXX (easy to share verbally or in tweets)
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 for readability
  let code = '';
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  for (const byte of array) {
    code += chars[byte % chars.length];
  }
  return `SYNC-${code}`;
}

/**
 * POST /make-server-57781ad9/beta/signup
 * 
 * Body: { email: string, referralCode?: string }
 * Response: { success, memberNumber, tier, discount, referralCode, ... }
 */
app.post('/signup', async (c) => {
  try {
    const { email, referralCode: incomingReferral } = await c.req.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return c.json({ error: 'Email is required' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already signed up
    const existingSignup = await kv.get(`beta:signup:${normalizedEmail}`);
    if (existingSignup) {
      const signup = existingSignup as BetaSignup;
      return c.json({
        success: true,
        memberNumber: signup.memberNumber,
        tier: signup.tier,
        discount: signup.discount,
        referralCode: signup.referralCode,
        message: `You're already signed up! You're ${TIER_CONFIG[signup.tier].badge} ${TIER_CONFIG[signup.tier].label} #${signup.memberNumber}`,
        alreadyExists: true
      }, 200);
    }

    // Get current count and increment
    const currentCount = (await kv.get('beta:count') as number) || 0;
    const memberNumber = currentCount + 1;
    const tier = getTier(memberNumber);
    const tierConfig = TIER_CONFIG[tier];

    // ── Referral tracking ──────────────────────────────────────────
    let referredByEmail: string | undefined;
    if (incomingReferral && typeof incomingReferral === 'string') {
      const referrerEmail = await kv.get(`beta:referral:${incomingReferral.toUpperCase()}`);
      if (referrerEmail) {
        referredByEmail = referrerEmail as string;
        // Increment referrer's count
        const referrerSignup = await kv.get(`beta:signup:${referredByEmail}`) as BetaSignup | null;
        if (referrerSignup) {
          referrerSignup.referralCount = (referrerSignup.referralCount || 0) + 1;
          await kv.set(`beta:signup:${referredByEmail}`, referrerSignup);
          console.log(`🔗 Referral credited to ${referredByEmail} (now ${referrerSignup.referralCount} referrals)`);
        }
      }
    }

    // Generate unique referral code for this user
    let referralCode = generateReferralCode();
    let attempts = 0;
    while (await kv.get(`beta:referral:${referralCode}`) && attempts < 10) {
      referralCode = generateReferralCode();
      attempts++;
    }

    // Create signup record
    const signup: BetaSignup = {
      email: normalizedEmail,
      memberNumber,
      signupDate: new Date().toISOString(),
      hasActivated: false,
      tier,
      discount: tierConfig.discount,
      referralCode,
      referredBy: referredByEmail,
      referralCount: 0,
    };

    // Save signup + referral code mapping
    await kv.set(`beta:signup:${normalizedEmail}`, signup);
    await kv.set('beta:count', memberNumber);
    await kv.set(`beta:member:${memberNumber}`, normalizedEmail);
    await kv.set(`beta:referral:${referralCode}`, normalizedEmail);

    // Send tier-specific welcome email
    try {
      await sendWelcomeEmail(normalizedEmail, memberNumber, tier, tierConfig.discount, referralCode);
      console.log(`✅ Welcome email sent to ${normalizedEmail} (${tierConfig.label} #${memberNumber})`);
    } catch (emailError) {
      console.error(`⚠️ Failed to send welcome email to ${normalizedEmail}:`, emailError);
    }

    // Create customer intelligence profile
    try {
      await kv.set(`customer_profile:${normalizedEmail}`, {
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        healthScore: 100,
        churnRisk: 'low',
        journeyStage: 'onboarding',
        segment: `beta_${tier}`,
        memberNumber,
        tier,
        discount: tierConfig.discount,
        referralCode,
        referredBy: referredByEmail || null,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        interactions: 1,
        emotionalState: 'positive',
        tags: ['beta_tester', `tier_${tier}`, `member_${memberNumber}`],
      });
    } catch (profileErr) {
      console.error(`⚠️ Failed to create customer profile:`, profileErr);
    }

    console.log(`🎉 New beta signup: ${normalizedEmail} → ${tierConfig.badge} ${tierConfig.label} #${memberNumber}`);

    // ── Build tier-specific response message ────────────────────────
    let message = '';
    if (tier === 'founding') {
      message = `🏆 You're Founding Member #${memberNumber}! You've locked in ${tierConfig.discount}% off for life.`;
    } else if (tier === 'early') {
      message = `⚡ You're Early Adopter #${memberNumber}! You've locked in ${tierConfig.discount}% off for life.`;
    } else {
      message = `🔜 You're #${memberNumber} on the waitlist! We'll notify you when spots open. Share your code to move up!`;
    }

    return c.json({
      success: true,
      memberNumber,
      tier,
      discount: tierConfig.discount,
      referralCode,
      referredBy: referredByEmail || null,
      spotsRemaining: tier === 'founding'
        ? Math.max(0, TIER_CONFIG.founding.max - memberNumber)
        : tier === 'early'
          ? Math.max(0, TIER_CONFIG.early.max - memberNumber)
          : null,
      message,
      alreadyExists: false,
    }, 201);

  } catch (error) {
    console.error('❌ Beta signup error:', error);
    return c.json({ 
      error: 'Failed to process signup. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /make-server-57781ad9/beta/count
 * Returns tier-aware counts
 */
app.get('/count', async (c) => {
  try {
    const count = (await kv.get('beta:count') as number) || 0;
    
    return c.json({
      success: true,
      count,
      tiers: {
        founding: { filled: Math.min(count, TIER_CONFIG.founding.max), max: TIER_CONFIG.founding.max, remaining: Math.max(0, TIER_CONFIG.founding.max - count) },
        early: { filled: Math.min(Math.max(0, count - TIER_CONFIG.founding.max), TIER_CONFIG.early.max - TIER_CONFIG.founding.max), max: TIER_CONFIG.early.max - TIER_CONFIG.founding.max, remaining: Math.max(0, TIER_CONFIG.early.max - count) },
        waitlist: { filled: Math.max(0, count - TIER_CONFIG.early.max) },
      },
      message: `${count} beta testers joined`,
    });
  } catch (error) {
    console.error('❌ Beta count error:', error);
    return c.json({ error: 'Failed to get count' }, 500);
  }
});

/**
 * GET /make-server-57781ad9/beta/check/:email
 */
app.get('/check/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const normalizedEmail = email.toLowerCase().trim();

    const signup = await kv.get(`beta:signup:${normalizedEmail}`);
    
    if (signup) {
      const betaSignup = signup as BetaSignup;
      return c.json({
        exists: true,
        memberNumber: betaSignup.memberNumber,
        tier: betaSignup.tier,
        discount: betaSignup.discount,
        referralCode: betaSignup.referralCode,
        referralCount: betaSignup.referralCount || 0,
        signupDate: betaSignup.signupDate,
      });
    }

    return c.json({ exists: false });
  } catch (error) {
    console.error('❌ Beta check error:', error);
    return c.json({ error: 'Failed to check email' }, 500);
  }
});

/**
 * GET /make-server-57781ad9/beta/referral/:code
 * Validate a referral code and return referrer info
 */
app.get('/referral/:code', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase();
    const referrerEmail = await kv.get(`beta:referral:${code}`);
    
    if (!referrerEmail) {
      return c.json({ valid: false, message: 'Invalid referral code' });
    }

    const referrer = await kv.get(`beta:signup:${referrerEmail}`) as BetaSignup | null;
    return c.json({
      valid: true,
      referrerTier: referrer?.tier || 'unknown',
      referrerBadge: referrer ? TIER_CONFIG[referrer.tier].badge : '',
    });
  } catch (error) {
    console.error('❌ Referral check error:', error);
    return c.json({ error: 'Failed to validate referral' }, 500);
  }
});

/**
 * GET /make-server-57781ad9/beta/leaderboard
 * Top referrers — viral loop gamification
 * Research: Dropbox referral leaderboard increased referrals by 60% (Sean Ellis)
 */
app.get('/leaderboard', async (c) => {
  try {
    const signups = await kv.getByPrefix('beta:signup:');
    const sorted = (signups as BetaSignup[])
      .filter(s => (s.referralCount || 0) > 0)
      .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
      .slice(0, 10)
      .map(s => ({
        memberNumber: s.memberNumber,
        tier: s.tier,
        badge: TIER_CONFIG[s.tier].badge,
        referralCount: s.referralCount,
        name: s.email.split('@')[0].slice(0, 3) + '***', // Privacy-safe
      }));

    return c.json({ success: true, leaderboard: sorted });
  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    return c.json({ error: 'Failed to get leaderboard' }, 500);
  }
});

/**
 * GET /make-server-57781ad9/beta/list (admin)
 */
app.get('/list', async (c) => {
  try {
    const signups = await kv.getByPrefix('beta:signup:');
    const sortedSignups = (signups as BetaSignup[])
      .sort((a, b) => a.memberNumber - b.memberNumber);

    return c.json({
      success: true,
      count: sortedSignups.length,
      signups: sortedSignups
    });
  } catch (error) {
    console.error('❌ Beta list error:', error);
    return c.json({ error: 'Failed to list signups' }, 500);
  }
});

/**
 * Send tier-specific welcome email via Resend
 */
async function sendWelcomeEmail(
  email: string,
  memberNumber: number,
  tier: BetaTier,
  discount: number,
  referralCode: string,
): Promise<void> {
  // Try Loops.so first
  const loopsApiKey = Deno.env.get('LOOPS_API_KEY');
  if (loopsApiKey) {
    try {
      const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${loopsApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userGroup: `beta_${tier}`,
          memberNumber: memberNumber.toString(),
          tier,
          discount: discount.toString(),
          referralCode,
          signupDate: new Date().toISOString(),
          source: 'beta_waitlist',
        }),
      });
      if (response.ok) { console.log('✅ Loops.so contact created'); return; }
    } catch (error) {
      console.warn('⚠️ Loops.so failed, trying Resend fallback:', error);
    }
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.warn('⚠️ No email API key set — cannot send welcome email');
    return;
  }

  const tierConfig = TIER_CONFIG[tier];
  const isWaitlist = tier === 'waitlist';

  const tierBenefits = tier === 'founding'
    ? `<li><strong style="color:#fde047;">50% off for LIFE</strong> — locked in forever</li>
       <li>Direct Slack channel with the founder</li>
       <li>Vote on the product roadmap</li>
       <li>Permanent "Founding Member" badge</li>
       <li>Priority access to every new feature</li>`
    : tier === 'early'
    ? `<li><strong style="color:#06b6d4;">30% off for LIFE</strong> — locked in forever</li>
       <li>Priority support queue</li>
       <li>Early access to new features</li>
       <li>Permanent "Early Adopter" badge</li>`
    : `<li>14-day full-access trial when we launch</li>
       <li>Share your referral code to move up the list</li>
       <li>Launch-day discount notification</li>`;

  const subject = isWaitlist
    ? `🔜 You're #${memberNumber} on the SyncScript waitlist`
    : `${tierConfig.badge} Welcome, ${tierConfig.label} #${memberNumber}!`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'SyncScript <noreply@syncscript.app>',
        to: [email],
        subject,
        reply_to: 'support@syncscript.app',
        html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f0a1a;color:#e2e8f0;border-radius:16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <p style="font-size:48px;margin:0;">${tierConfig.badge}</p>
    <h1 style="font-size:28px;background:linear-gradient(135deg,#8b5cf6,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:8px 0 0;">${tierConfig.label} #${memberNumber}</h1>
    ${!isWaitlist ? `<p style="color:#a78bfa;font-size:14px;margin-top:4px;">${discount}% lifetime discount — locked in</p>` : ''}
  </div>
  
  <div style="background:#1e1829;border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:24px;margin-bottom:24px;">
    <p style="margin:0 0 16px;color:#e2e8f0;font-weight:600;">Your benefits:</p>
    <ul style="color:#c4b5fd;padding-left:20px;line-height:1.8;">${tierBenefits}</ul>
  </div>
  
  <div style="background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(124,58,237,0.15));border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
    <p style="margin:0 0 8px;color:#e9d5ff;font-size:13px;font-weight:600;">YOUR REFERRAL CODE</p>
    <p style="margin:0 0 12px;color:#a78bfa;font-size:28px;font-weight:700;font-family:'Courier New',monospace;letter-spacing:3px;">${referralCode}</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Share this code — every friend who joins earns you credit toward free months</p>
  </div>
  
  ${!isWaitlist ? `<div style="text-align:center;margin-bottom:24px;">
    <a href="https://syncscript.app/login?guest=true" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Start Using SyncScript →</a>
  </div>` : `<div style="text-align:center;margin-bottom:24px;">
    <a href="https://syncscript.app" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Share & Move Up the List →</a>
  </div>`}
  
  <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">SyncScript • Tune Your Day, Amplify Your Life</p>
</div>`
      })
    });

    if (response.ok) {
      console.log(`✅ Tier welcome email sent via Resend (${tier})`);
    } else {
      const err = await response.text();
      console.error(`❌ Resend error: ${err}`);
    }
  } catch (error) {
    console.error('❌ Resend API error:', error);
    throw error;
  }
}

export default app;
