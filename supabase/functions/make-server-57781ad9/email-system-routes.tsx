// =====================================================================
// EMAIL SYSTEM API ROUTES
// Complete email automation system endpoints
// =====================================================================

import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import {
  createSubscriber,
  getSubscriber,
  updateSubscriber,
  unsubscribeUser,
  startDripCampaign,
  triggerGoalCompletionEmail,
  triggerReEngagementEmail,
  processScheduledEmails,
  trackEmailEvent,
  getRecentEmailsToUser,
  getCampaign,
  saveCampaign,
  updateUserSegments,
  BETA_WELCOME_SEQUENCE,
  EmailSubscriber,
  EmailEvent
} from './email-automation.tsx';

const app = new Hono();

// =====================================================================
// SUBSCRIBER MANAGEMENT
// =====================================================================

// Create subscriber (called when user signs up for beta)
app.post('/subscribe', async (c) => {
  try {
    const { email, name, segments } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    // Check if already exists
    let subscriber = await getSubscriber(email);
    
    if (subscriber) {
      // Reactivate if unsubscribed
      if (subscriber.status === 'unsubscribed') {
        subscriber.status = 'active';
        subscriber.subscribed_at = new Date().toISOString();
        await updateSubscriber(email, subscriber);
        
        return c.json({
          success: true,
          message: 'Resubscribed successfully',
          subscriber
        });
      }
      
      return c.json({
        success: true,
        message: 'Already subscribed',
        subscriber
      });
    }
    
    // Create new subscriber
    subscriber = await createSubscriber(email, name, segments || ['beta_user']);
    
    // Ensure beta welcome campaign exists
    const existingCampaign = await getCampaign(BETA_WELCOME_SEQUENCE.id);
    if (!existingCampaign) {
      await saveCampaign(BETA_WELCOME_SEQUENCE);
      console.log(`[Email API] Created beta welcome campaign`);
    }
    
    // Start beta welcome drip campaign
    await startDripCampaign(email, BETA_WELCOME_SEQUENCE.id);
    
    console.log(`[Email API] Created subscriber and started welcome sequence: ${email}`);
    
    return c.json({
      success: true,
      message: 'Subscribed successfully',
      subscriber,
      welcome_sequence_started: true
    });
    
  } catch (error) {
    console.error('[Email API] Error in /subscribe:', error);
    return c.json({ error: 'Failed to subscribe', details: String(error) }, 500);
  }
});

// Resend welcome email for existing subscriber
app.post('/resend-welcome', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    // Check if subscriber exists
    const subscriber = await getSubscriber(email);
    
    if (!subscriber) {
      return c.json({ error: 'Email not found. Please sign up first.' }, 404);
    }
    
    // Check if they're unsubscribed
    if (subscriber.status === 'unsubscribed') {
      return c.json({ error: 'You are unsubscribed. Please resubscribe first.' }, 400);
    }
    
    // Ensure beta welcome campaign exists
    const existingCampaign = await getCampaign(BETA_WELCOME_SEQUENCE.id);
    if (!existingCampaign) {
      await saveCampaign(BETA_WELCOME_SEQUENCE);
      console.log(`[Email API] Created beta welcome campaign`);
    }
    
    // Restart the welcome drip campaign
    await startDripCampaign(email, BETA_WELCOME_SEQUENCE.id);
    
    console.log(`[Email API] Resent welcome sequence to: ${email}`);
    
    return c.json({
      success: true,
      message: 'Welcome email resent! Check your inbox in a few moments.'
    });
    
  } catch (error) {
    console.error('[Email API] Error in /resend-welcome:', error);
    return c.json({ error: 'Failed to resend welcome email', details: String(error) }, 500);
  }
});

// Get subscriber info
app.get('/subscriber/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const subscriber = await getSubscriber(email);
    
    if (!subscriber) {
      return c.json({ error: 'Subscriber not found' }, 404);
    }
    
    return c.json({ subscriber });
    
  } catch (error) {
    console.error('[Email API] Error getting subscriber:', error);
    return c.json({ error: 'Failed to get subscriber', details: String(error) }, 500);
  }
});

// Update subscriber preferences
app.put('/subscriber/:email/preferences', async (c) => {
  try {
    const email = c.req.param('email');
    const { preferences } = await c.req.json();
    
    const subscriber = await getSubscriber(email);
    if (!subscriber) {
      return c.json({ error: 'Subscriber not found' }, 404);
    }
    
    subscriber.preferences = { ...subscriber.preferences, ...preferences };
    await updateSubscriber(email, subscriber);
    
    console.log(`[Email API] Updated preferences for ${email}`);
    
    return c.json({
      success: true,
      message: 'Preferences updated',
      subscriber
    });
    
  } catch (error) {
    console.error('[Email API] Error updating preferences:', error);
    return c.json({ error: 'Failed to update preferences', details: String(error) }, 500);
  }
});

// Update subscriber metadata (called when user completes goals, tasks, etc.)
app.put('/subscriber/:email/metadata', async (c) => {
  try {
    const email = c.req.param('email');
    const { metadata } = await c.req.json();
    
    const subscriber = await getSubscriber(email);
    if (!subscriber) {
      return c.json({ error: 'Subscriber not found' }, 404);
    }
    
    subscriber.metadata = { ...subscriber.metadata, ...metadata };
    await updateSubscriber(email, subscriber);
    
    // Auto-update segments based on behavior
    await updateUserSegments(email, subscriber.metadata);
    
    console.log(`[Email API] Updated metadata for ${email}`);
    
    return c.json({
      success: true,
      message: 'Metadata updated',
      subscriber
    });
    
  } catch (error) {
    console.error('[Email API] Error updating metadata:', error);
    return c.json({ error: 'Failed to update metadata', details: String(error) }, 500);
  }
});

// =====================================================================
// UNSUBSCRIBE
// =====================================================================

// Unsubscribe by token (one-click)
app.get('/unsubscribe/:token', async (c) => {
  try {
    const token = c.req.param('token');
    
    // Find subscriber by token
    const allSubscribers = await kv.getByPrefix('email_subscriber:');
    let foundEmail = null;
    
    for (const subscriber of allSubscribers as EmailSubscriber[]) {
      if (subscriber.unsubscribe_token === token) {
        foundEmail = subscriber.email;
        break;
      }
    }
    
    if (!foundEmail) {
      return c.json({ error: 'Invalid unsubscribe token' }, 404);
    }
    
    await unsubscribeUser(foundEmail);
    
    // Return HTML page
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - SyncScript</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1625 0%, #0f0a1a 100%);
            color: #e9d5ff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            max-width: 500px;
            padding: 40px;
            background: #1e1829;
            border-radius: 16px;
            border: 1px solid rgba(139, 92, 246, 0.2);
            text-align: center;
          }
          h1 { color: #a78bfa; margin: 0 0 16px 0; font-size: 32px; }
          p { color: #c4b5fd; line-height: 1.6; margin: 0 0 24px 0; }
          .emoji { font-size: 64px; margin-bottom: 24px; }
          a {
            color: #a78bfa;
            text-decoration: none;
            font-weight: 600;
          }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="emoji">👋</div>
          <h1>You've Been Unsubscribed</h1>
          <p>You won't receive any more emails from SyncScript.</p>
          <p>Changed your mind? <a href="https://syncscript.app/preferences/${token}">Update your preferences</a></p>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('[Email API] Error in unsubscribe:', error);
    return c.json({ error: 'Failed to unsubscribe', details: String(error) }, 500);
  }
});

// Unsubscribe by email (POST)
app.post('/unsubscribe', async (c) => {
  try {
    const { email, reason } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    const success = await unsubscribeUser(email, reason);
    
    if (!success) {
      return c.json({ error: 'Subscriber not found' }, 404);
    }
    
    return c.json({
      success: true,
      message: 'Unsubscribed successfully'
    });
    
  } catch (error) {
    console.error('[Email API] Error in unsubscribe:', error);
    return c.json({ error: 'Failed to unsubscribe', details: String(error) }, 500);
  }
});

// =====================================================================
// BEHAVIORAL TRIGGERS
// =====================================================================

// Trigger goal completion email
app.post('/trigger/goal-completion', async (c) => {
  try {
    const { email, goalName, energyAwarded, totalEnergy } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    await triggerGoalCompletionEmail(email, {
      goalName,
      energyAwarded,
      totalEnergy
    });
    
    return c.json({
      success: true,
      message: 'Goal completion email triggered'
    });
    
  } catch (error) {
    console.error('[Email API] Error triggering goal completion:', error);
    return c.json({ error: 'Failed to trigger email', details: String(error) }, 500);
  }
});

// Trigger re-engagement email
app.post('/trigger/re-engagement', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    await triggerReEngagementEmail(email);
    
    return c.json({
      success: true,
      message: 'Re-engagement email triggered'
    });
    
  } catch (error) {
    console.error('[Email API] Error triggering re-engagement:', error);
    return c.json({ error: 'Failed to trigger email', details: String(error) }, 500);
  }
});

// =====================================================================
// EMAIL PROCESSING (Cron job endpoint)
// =====================================================================

// Process scheduled emails (call this from a cron job every 5 minutes)
app.post('/process-queue', async (c) => {
  try {
    console.log('[Email API] Processing queue started...');
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.warn('[Email API] RESEND_API_KEY not configured - email processing disabled');
      return c.json({ 
        success: true, 
        processed: 0, 
        message: 'Email processing disabled - RESEND_API_KEY not configured',
        warning: 'Configure RESEND_API_KEY to enable email sending'
      }, 200); // Return 200 instead of 400 to prevent client errors
    }
    
    // Add timeout protection (50s to allow batch processing of up to 50 emails)
    const processWithTimeout = async () => {
      const timeoutPromise = new Promise<number>((_, reject) => 
        setTimeout(() => reject(new Error('Processing timeout after 50 seconds')), 50000)
      );
      
      const processPromise = processScheduledEmails(resendApiKey);
      
      return Promise.race([processPromise, timeoutPromise]);
    };
    
    const processed = await processWithTimeout();
    
    if (typeof processed === 'number' && processed > 0) {
      console.log(`[Email API] Successfully processed ${processed} scheduled emails`);
    } else {
      console.log('[Email API] No emails due for processing');
    }
    
    return c.json({
      success: true,
      processed,
      message: `Processed ${processed} emails`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // Enhanced error logging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Email API] Error processing queue:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });
    
    // Return a graceful error response
    return c.json({ 
      success: false,
      error: 'Failed to process queue', 
      details: errorMessage,
      processed: 0,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// =====================================================================
// ANALYTICS & TRACKING
// =====================================================================

// Track email opened (via tracking pixel)
app.get('/track/open/:eventId', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    
    // Decode event info from ID
    const [email, campaignId, templateName] = Buffer.from(eventId, 'base64').toString().split('|');
    
    // Track event
    await trackEmailEvent({
      id: eventId,
      email,
      campaign_id: campaignId,
      template_name: templateName,
      event_type: 'opened',
      timestamp: new Date().toISOString(),
      metadata: {
        user_agent: c.req.header('user-agent'),
        ip_address: c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
      }
    });
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    return c.body(pixel, 200, {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    
  } catch (error) {
    console.error('[Email API] Error tracking open:', error);
    // Still return pixel to avoid broken images
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    return c.body(pixel, 200, { 'Content-Type': 'image/gif' });
  }
});

// Track email clicked
app.get('/track/click/:eventId', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const targetUrl = c.req.query('url');
    
    // Decode event info
    const [email, campaignId, templateName] = Buffer.from(eventId, 'base64').toString().split('|');
    
    // Track event
    await trackEmailEvent({
      id: `${eventId}_click_${Date.now()}`,
      email,
      campaign_id: campaignId,
      template_name: templateName,
      event_type: 'clicked',
      timestamp: new Date().toISOString(),
      metadata: {
        link_url: targetUrl,
        user_agent: c.req.header('user-agent'),
        ip_address: c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
      }
    });
    
    // Redirect to target URL
    return c.redirect(targetUrl || 'https://syncscript.app');
    
  } catch (error) {
    console.error('[Email API] Error tracking click:', error);
    return c.redirect('https://syncscript.app');
  }
});

// Get subscriber email history
app.get('/subscriber/:email/history', async (c) => {
  try {
    const email = c.req.param('email');
    const days = parseInt(c.req.query('days') || '30', 10);
    
    const events = await getRecentEmailsToUser(email, days);
    
    return c.json({
      success: true,
      events,
      total: events.length
    });
    
  } catch (error) {
    console.error('[Email API] Error getting history:', error);
    return c.json({ error: 'Failed to get history', details: String(error) }, 500);
  }
});

// Get campaign analytics
app.get('/campaign/:campaignId/analytics', async (c) => {
  try {
    const campaignId = c.req.param('campaignId');
    const campaign = await getCampaign(campaignId);
    
    if (!campaign) {
      return c.json({ error: 'Campaign not found' }, 404);
    }
    
    // Calculate rates
    const openRate = campaign.stats.sent > 0 
      ? (campaign.stats.opened / campaign.stats.sent) * 100 
      : 0;
    
    const clickRate = campaign.stats.sent > 0 
      ? (campaign.stats.clicked / campaign.stats.sent) * 100 
      : 0;
    
    const bounceRate = campaign.stats.sent > 0 
      ? (campaign.stats.bounced / campaign.stats.sent) * 100 
      : 0;
    
    const unsubscribeRate = campaign.stats.sent > 0 
      ? (campaign.stats.unsubscribed / campaign.stats.sent) * 100 
      : 0;
    
    return c.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status
      },
      stats: campaign.stats,
      rates: {
        openRate: Math.round(openRate * 10) / 10,
        clickRate: Math.round(clickRate * 10) / 10,
        bounceRate: Math.round(bounceRate * 10) / 10,
        unsubscribeRate: Math.round(unsubscribeRate * 10) / 10
      },
      benchmarks: {
        // SaaS industry benchmarks (Mailchimp 2024)
        openRate: 21.5,
        clickRate: 2.3,
        bounceRate: 0.7,
        unsubscribeRate: 0.1
      }
    });
    
  } catch (error) {
    console.error('[Email API] Error getting campaign analytics:', error);
    return c.json({ error: 'Failed to get analytics', details: String(error) }, 500);
  }
});

// =====================================================================
// TESTING & ADMIN
// =====================================================================

// Get all subscribers (admin only - add auth in production)
app.get('/admin/subscribers', async (c) => {
  try {
    const allSubscribers = await kv.getByPrefix('email_subscriber:') as EmailSubscriber[];
    
    const stats = {
      total: allSubscribers.length,
      active: allSubscribers.filter(s => s.status === 'active').length,
      unsubscribed: allSubscribers.filter(s => s.status === 'unsubscribed').length,
      bounced: allSubscribers.filter(s => s.status === 'bounced').length,
      by_segment: {} as Record<string, number>
    };
    
    // Count by segment
    for (const sub of allSubscribers) {
      for (const segment of sub.segments) {
        stats.by_segment[segment] = (stats.by_segment[segment] || 0) + 1;
      }
    }
    
    return c.json({
      success: true,
      subscribers: allSubscribers,
      stats
    });
    
  } catch (error) {
    console.error('[Email API] Error getting subscribers:', error);
    return c.json({ error: 'Failed to get subscribers', details: String(error) }, 500);
  }
});

export default app;
