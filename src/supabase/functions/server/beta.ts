import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

const app = new Hono();

/**
 * Beta Signup API Route
 * 
 * Handles beta tester signups:
 * - Validates email
 * - Checks for duplicates
 * - Auto-assigns member number
 * - Saves to KV store
 * - Sends welcome email via Loops.so
 */

interface BetaSignup {
  email: string;
  memberNumber: number;
  signupDate: string;
  hasActivated: boolean;
  activationDate?: string;
}

/**
 * POST /make-server-57781ad9/beta/signup
 * 
 * Body: { email: string }
 * Response: { success: true, memberNumber: number, message: string }
 */
app.post('/signup', async (c) => {
  try {
    const { email } = await c.req.json();

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
        message: `You're already signed up! You're beta tester #${signup.memberNumber}`,
        alreadyExists: true
      }, 200);
    }

    // Get current count and increment
    const currentCount = (await kv.get('beta:count') as number) || 0;
    const memberNumber = currentCount + 1;

    // Create signup record
    const signup: BetaSignup = {
      email: normalizedEmail,
      memberNumber,
      signupDate: new Date().toISOString(),
      hasActivated: false
    };

    // Save signup
    await kv.set(`beta:signup:${normalizedEmail}`, signup);
    
    // Update count
    await kv.set('beta:count', memberNumber);

    // Add to email list (for easy retrieval)
    await kv.set(`beta:member:${memberNumber}`, normalizedEmail);

    // Send welcome email via Loops.so
    try {
      await sendWelcomeEmail(normalizedEmail, memberNumber);
      console.log(`✅ Welcome email sent to ${normalizedEmail} (Member #${memberNumber})`);
    } catch (emailError) {
      console.error(`⚠️ Failed to send welcome email to ${normalizedEmail}:`, emailError);
      // Don't fail the signup if email fails - we still want to save the user
    }

    // Log success
    console.log(`🎉 New beta signup: ${normalizedEmail} (Member #${memberNumber})`);

    return c.json({
      success: true,
      memberNumber,
      message: `Welcome to the beta! You're tester #${memberNumber}`,
      alreadyExists: false
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
 * 
 * Returns the current number of beta signups
 */
app.get('/count', async (c) => {
  try {
    const count = (await kv.get('beta:count') as number) || 0;
    
    return c.json({
      success: true,
      count,
      message: `${count} beta testers joined`
    });
  } catch (error) {
    console.error('❌ Beta count error:', error);
    return c.json({ error: 'Failed to get count' }, 500);
  }
});

/**
 * GET /make-server-57781ad9/beta/check/:email
 * 
 * Check if an email has already signed up
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
        signupDate: betaSignup.signupDate
      });
    }

    return c.json({
      exists: false
    });
  } catch (error) {
    console.error('❌ Beta check error:', error);
    return c.json({ error: 'Failed to check email' }, 500);
  }
});

/**
 * GET /make-server-57781ad9/beta/list
 * 
 * Get all beta signups (admin only - requires auth)
 * Returns paginated list of signups
 */
app.get('/list', async (c) => {
  try {
    // Get all beta signups
    const signups = await kv.getByPrefix('beta:signup:');
    
    // Sort by member number
    const sortedSignups = signups
      .map(s => s as BetaSignup)
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
 * Send welcome email via Loops.so API
 */
async function sendWelcomeEmail(email: string, memberNumber: number): Promise<void> {
  const loopsApiKey = Deno.env.get('LOOPS_API_KEY');
  
  if (!loopsApiKey) {
    console.warn('⚠️ LOOPS_API_KEY not set - skipping welcome email');
    return;
  }

  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loopsApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        userGroup: 'beta_tester',
        memberNumber: memberNumber.toString(),
        signupDate: new Date().toISOString(),
        source: 'beta_waitlist'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Loops API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Loops.so contact created:', data);

  } catch (error) {
    console.error('❌ Loops.so API error:', error);
    throw error;
  }
}

export default app;
