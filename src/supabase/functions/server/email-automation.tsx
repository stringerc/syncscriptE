// =====================================================================
// EMAIL AUTOMATION ENGINE
// Behavioral triggers, drip campaigns, and scheduling
// =====================================================================
// Research Sources:
// - Epsilon (2023): Triggered emails have 152% higher click rates
// - Mailchimp (2024): Drip campaigns have 80% higher open rates
// - Intercom (2023): Educational emails increase adoption by 32%
// - Chamath Palihapitiya: First 48 hours determine 70% retention
// =====================================================================

import * as kv from './kv_store.tsx';
import { getEmailTemplate, EmailTemplateData } from './email-templates.tsx';

// =====================================================================
// DATA MODELS
// =====================================================================

export interface EmailSubscriber {
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribed_at: string;
  unsubscribed_at?: string;
  preferences: {
    // Email types
    marketing: boolean;
    product_updates: boolean;
    tips_and_tricks: boolean;
    monthly_digest: boolean;
    
    // Frequency
    frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  };
  segments: string[]; // ['beta_user', 'power_user', 'inactive', etc.]
  metadata: {
    signup_date?: string;
    last_login?: string;
    goals_completed?: number;
    tasks_completed?: number;
    current_streak?: number;
    energy_points?: number;
  };
  unsubscribe_token: string; // Unique token for one-click unsubscribe
}

export interface EmailCampaign {
  id: string;
  name: string;
  type: 'drip' | 'broadcast' | 'triggered';
  status: 'draft' | 'active' | 'paused' | 'completed';
  
  // For drip campaigns
  emails?: {
    template_name: string;
    delay_hours: number; // Hours after previous email (or signup for first)
    condition?: string; // Optional condition to check before sending
  }[];
  
  // For broadcast campaigns
  template_name?: string;
  send_at?: string; // ISO timestamp for scheduled sends
  
  // Targeting
  segment?: string; // Which subscriber segment to target
  
  // A/B testing
  variants?: {
    name: string;
    subject_line: string;
    weight: number; // Percentage (e.g., 50 for 50%)
  }[];
  
  // Analytics
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  
  created_at: string;
  created_by: string;
}

export interface EmailEvent {
  id: string;
  email: string;
  campaign_id?: string;
  template_name: string;
  event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed';
  timestamp: string;
  metadata?: {
    link_url?: string; // For click events
    bounce_reason?: string; // For bounce events
    user_agent?: string;
    ip_address?: string;
  };
}

export interface EmailSchedule {
  id: string;
  subscriber_email: string;
  template_name: string;
  scheduled_for: string; // ISO timestamp
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  campaign_id?: string;
  data?: EmailTemplateData; // Data to populate template
  created_at: string;
}

// =====================================================================
// SUBSCRIBER MANAGEMENT
// =====================================================================

export async function createSubscriber(
  email: string,
  name?: string,
  initialSegments: string[] = ['beta_user']
): Promise<EmailSubscriber> {
  const subscriber: EmailSubscriber = {
    email: email.toLowerCase().trim(),
    name,
    status: 'active',
    subscribed_at: new Date().toISOString(),
    preferences: {
      marketing: true,
      product_updates: true,
      tips_and_tricks: true,
      monthly_digest: true,
      frequency: 'weekly'
    },
    segments: initialSegments,
    metadata: {},
    unsubscribe_token: generateUnsubscribeToken()
  };
  
  await kv.set(`email_subscriber:${subscriber.email}`, subscriber);
  
  // Add to segments
  for (const segment of initialSegments) {
    await addToSegment(subscriber.email, segment);
  }
  
  console.log(`[Email Automation] Created subscriber: ${email}`);
  
  return subscriber;
}

export async function getSubscriber(email: string): Promise<EmailSubscriber | null> {
  const subscriber = await kv.get(`email_subscriber:${email.toLowerCase().trim()}`);
  return subscriber as EmailSubscriber | null;
}

export async function updateSubscriber(
  email: string,
  updates: Partial<EmailSubscriber>
): Promise<EmailSubscriber | null> {
  const subscriber = await getSubscriber(email);
  if (!subscriber) return null;
  
  const updated = { ...subscriber, ...updates };
  await kv.set(`email_subscriber:${email.toLowerCase().trim()}`, updated);
  
  return updated;
}

export async function unsubscribeUser(
  email: string,
  reason?: string
): Promise<boolean> {
  const subscriber = await getSubscriber(email);
  if (!subscriber) return false;
  
  subscriber.status = 'unsubscribed';
  subscriber.unsubscribed_at = new Date().toISOString();
  
  await kv.set(`email_subscriber:${email.toLowerCase().trim()}`, subscriber);
  
  // Track event
  await trackEmailEvent({
    id: generateId(),
    email,
    event_type: 'unsubscribed',
    timestamp: new Date().toISOString(),
    template_name: 'unsubscribe',
    metadata: { reason }
  });
  
  console.log(`[Email Automation] Unsubscribed: ${email}`);
  
  return true;
}

// =====================================================================
// SEGMENTATION
// =====================================================================

export async function addToSegment(email: string, segment: string): Promise<void> {
  const segmentKey = `email_segment:${segment}`;
  const members = (await kv.get(segmentKey) || []) as string[];
  
  if (!members.includes(email)) {
    members.push(email);
    await kv.set(segmentKey, members);
  }
}

export async function removeFromSegment(email: string, segment: string): Promise<void> {
  const segmentKey = `email_segment:${segment}`;
  const members = (await kv.get(segmentKey) || []) as string[];
  
  const filtered = members.filter(e => e !== email);
  await kv.set(segmentKey, filtered);
}

export async function getSegmentMembers(segment: string): Promise<string[]> {
  const segmentKey = `email_segment:${segment}`;
  return (await kv.get(segmentKey) || []) as string[];
}

// Auto-segmentation based on behavior
export async function updateUserSegments(email: string, metadata: EmailSubscriber['metadata']): Promise<void> {
  const subscriber = await getSubscriber(email);
  if (!subscriber) return;
  
  // Remove from old behavioral segments
  const behavioralSegments = ['power_user', 'casual_user', 'at_risk', 'dormant'];
  for (const segment of behavioralSegments) {
    await removeFromSegment(email, segment);
  }
  
  // Add to new segments based on behavior
  const goalsCompleted = metadata.goals_completed || 0;
  const lastLogin = metadata.last_login ? new Date(metadata.last_login) : null;
  const daysSinceLogin = lastLogin ? Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  
  // Power user: 5+ goals completed
  if (goalsCompleted >= 5) {
    await addToSegment(email, 'power_user');
    subscriber.segments.push('power_user');
  }
  // Casual user: 1-4 goals completed
  else if (goalsCompleted >= 1) {
    await addToSegment(email, 'casual_user');
    subscriber.segments.push('casual_user');
  }
  
  // At risk: 7-14 days since last login
  if (daysSinceLogin >= 7 && daysSinceLogin < 14) {
    await addToSegment(email, 'at_risk');
    subscriber.segments.push('at_risk');
  }
  // Dormant: 14+ days since last login
  else if (daysSinceLogin >= 14) {
    await addToSegment(email, 'dormant');
    subscriber.segments.push('dormant');
  }
  
  // Update subscriber
  subscriber.metadata = metadata;
  subscriber.segments = [...new Set(subscriber.segments)]; // Deduplicate
  await kv.set(`email_subscriber:${email}`, subscriber);
}

// =====================================================================
// DRIP CAMPAIGNS
// =====================================================================

// Beta Welcome Sequence (3 emails)
export const BETA_WELCOME_SEQUENCE: EmailCampaign = {
  id: 'beta_welcome_sequence',
  name: 'Beta Welcome Sequence',
  type: 'drip',
  status: 'active',
  segment: 'beta_user',
  emails: [
    {
      template_name: 'beta_welcome',
      delay_hours: 0 // Immediate
    },
    {
      template_name: 'feature_deepdive',
      delay_hours: 24 // 24 hours after signup
    },
    {
      template_name: 'seven_day_checkin',
      delay_hours: 168 // 7 days after signup
    }
  ],
  stats: {
    sent: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    unsubscribed: 0
  },
  created_at: new Date().toISOString(),
  created_by: 'system'
};

// Start drip campaign for a user
export async function startDripCampaign(
  email: string,
  campaignId: string
): Promise<void> {
  const campaign = await getCampaign(campaignId);
  if (!campaign || campaign.type !== 'drip' || !campaign.emails) {
    console.error(`[Email Automation] Invalid drip campaign: ${campaignId}`);
    return;
  }
  
  const subscriber = await getSubscriber(email);
  if (!subscriber || subscriber.status !== 'active') {
    console.log(`[Email Automation] Skipping inactive subscriber: ${email}`);
    return;
  }
  
  const signupTime = new Date(subscriber.subscribed_at).getTime();
  
  // Schedule all emails in the sequence
  for (const emailConfig of campaign.emails) {
    const scheduledFor = new Date(signupTime + (emailConfig.delay_hours * 60 * 60 * 1000));
    
    await scheduleEmail({
      id: generateId(),
      subscriber_email: email,
      template_name: emailConfig.template_name,
      scheduled_for: scheduledFor.toISOString(),
      status: 'pending',
      campaign_id: campaignId,
      created_at: new Date().toISOString()
    });
  }
  
  console.log(`[Email Automation] Started drip campaign '${campaign.name}' for ${email}`);
}

// =====================================================================
// BEHAVIORAL TRIGGERS
// =====================================================================

// Trigger: Goal Completion
export async function triggerGoalCompletionEmail(
  email: string,
  goalData: {
    goalName?: string;
    energyAwarded?: number;
    totalEnergy?: number;
  }
): Promise<void> {
  const subscriber = await getSubscriber(email);
  if (!subscriber || subscriber.status !== 'active' || !subscriber.preferences.product_updates) {
    return;
  }
  
  const data: EmailTemplateData = {
    userName: subscriber.name,
    userEmail: email,
    energyPoints: goalData.totalEnergy || 0,
    customMessage: goalData.goalName,
    unsubscribeUrl: `https://syncscript.app/unsubscribe/${subscriber.unsubscribe_token}`,
    preferencesUrl: `https://syncscript.app/preferences/${subscriber.unsubscribe_token}`
  };
  
  await scheduleEmail({
    id: generateId(),
    subscriber_email: email,
    template_name: 'goal_completion',
    scheduled_for: new Date().toISOString(), // Send immediately
    status: 'pending',
    data,
    created_at: new Date().toISOString()
  });
  
  console.log(`[Email Automation] Triggered goal completion email for ${email}`);
}

// Trigger: Inactivity (Re-engagement)
export async function triggerReEngagementEmail(email: string): Promise<void> {
  const subscriber = await getSubscriber(email);
  if (!subscriber || subscriber.status !== 'active' || !subscriber.preferences.marketing) {
    return;
  }
  
  // Check if we already sent a re-engagement email in the last 14 days
  const recentEmails = await getRecentEmailsToUser(email, 14);
  const alreadySent = recentEmails.some(e => e.template_name === 're_engagement');
  
  if (alreadySent) {
    console.log(`[Email Automation] Already sent re-engagement to ${email} recently`);
    return;
  }
  
  const data: EmailTemplateData = {
    userName: subscriber.name,
    userEmail: email,
    goalsCompleted: subscriber.metadata.goals_completed || 0,
    tasksCompleted: subscriber.metadata.tasks_completed || 0,
    energyPoints: subscriber.metadata.energy_points || 0,
    unsubscribeUrl: `https://syncscript.app/unsubscribe/${subscriber.unsubscribe_token}`,
    preferencesUrl: `https://syncscript.app/preferences/${subscriber.unsubscribe_token}`
  };
  
  await scheduleEmail({
    id: generateId(),
    subscriber_email: email,
    template_name: 're_engagement',
    scheduled_for: new Date().toISOString(),
    status: 'pending',
    data,
    created_at: new Date().toISOString()
  });
  
  console.log(`[Email Automation] Triggered re-engagement email for ${email}`);
}

// =====================================================================
// EMAIL SCHEDULING
// =====================================================================

export async function scheduleEmail(schedule: EmailSchedule): Promise<void> {
  await kv.set(`email_schedule:${schedule.id}`, schedule);
  
  // Add to pending queue
  const pendingQueue = (await kv.get('email_pending_queue') || []) as string[];
  pendingQueue.push(schedule.id);
  await kv.set('email_pending_queue', pendingQueue);
}

export async function getScheduledEmail(scheduleId: string): Promise<EmailSchedule | null> {
  return (await kv.get(`email_schedule:${scheduleId}`)) as EmailSchedule | null;
}

export async function getPendingEmails(): Promise<EmailSchedule[]> {
  const pendingQueue = (await kv.get('email_pending_queue') || []) as string[];
  const emails: EmailSchedule[] = [];
  
  for (const id of pendingQueue) {
    const schedule = await getScheduledEmail(id);
    if (schedule && schedule.status === 'pending') {
      emails.push(schedule);
    }
  }
  
  return emails;
}

export async function processScheduledEmails(resendApiKey: string): Promise<number> {
  try {
    console.log('[Email Automation] Starting to process scheduled emails...');
    
    const pending = await getPendingEmails();
    console.log(`[Email Automation] Found ${pending.length} pending emails`);
    
    if (pending.length === 0) {
      return 0;
    }
    
    const now = Date.now();
    let processed = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const schedule of pending) {
      try {
        const scheduledTime = new Date(schedule.scheduled_for).getTime();
        
        // Skip if not time yet
        if (scheduledTime > now) {
          skipped++;
          continue;
        }
        
        // Check if subscriber still active
        const subscriber = await getSubscriber(schedule.subscriber_email);
        if (!subscriber || subscriber.status !== 'active') {
          // Mark as cancelled
          schedule.status = 'cancelled';
          await kv.set(`email_schedule:${schedule.id}`, schedule);
          skipped++;
          continue;
        }
        
        // Get template data
        let templateData: EmailTemplateData = schedule.data || {};
        
        // Add subscriber info
        templateData = {
          ...templateData,
          userName: subscriber.name,
          userEmail: subscriber.email,
          goalsCompleted: subscriber.metadata.goals_completed || 0,
          tasksCompleted: subscriber.metadata.tasks_completed || 0,
          currentStreak: subscriber.metadata.current_streak || 0,
          energyPoints: subscriber.metadata.energy_points || 0,
          unsubscribeUrl: `https://syncscript.app/unsubscribe/${subscriber.unsubscribe_token}`,
          preferencesUrl: `https://syncscript.app/preferences/${subscriber.unsubscribe_token}`
        };
        
        // Get template
        const template = getEmailTemplate(schedule.template_name, templateData);
        if (!template) {
          console.error(`[Email Automation] Template not found: ${schedule.template_name}`);
          schedule.status = 'failed';
          await kv.set(`email_schedule:${schedule.id}`, schedule);
          failed++;
          continue;
        }
        
        // Replace placeholders in template
        let html = template.html;
        html = html.replace(/\{\{preferencesUrl\}\}/g, templateData.preferencesUrl || '#');
        html = html.replace(/\{\{unsubscribeUrl\}\}/g, templateData.unsubscribeUrl || '#');
    
    // Send via Resend
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'SyncScript <noreply@syncscript.app>',
          to: [subscriber.email],
          subject: template.subject,
          html: html
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // Mark as sent
        schedule.status = 'sent';
        await kv.set(`email_schedule:${schedule.id}`, schedule);
        
        // Track event
        await trackEmailEvent({
          id: generateId(),
          email: subscriber.email,
          campaign_id: schedule.campaign_id,
          template_name: schedule.template_name,
          event_type: 'sent',
          timestamp: new Date().toISOString()
        });
        
        // Update campaign stats
        if (schedule.campaign_id) {
          await incrementCampaignStat(schedule.campaign_id, 'sent');
        }
        
        processed++;
        console.log(`[Email Automation] ✓ Sent ${schedule.template_name} to ${subscriber.email}`);
      } else {
        const errorText = await response.text();
        console.error(`[Email Automation] Failed to send email (${response.status}):`, errorText);
        schedule.status = 'failed';
        await kv.set(`email_schedule:${schedule.id}`, schedule);
        failed++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('aborted')) {
        console.error(`[Email Automation] Email send timeout for ${subscriber.email}`);
      } else {
        console.error(`[Email Automation] Error sending email to ${subscriber.email}:`, errorMessage);
      }
      schedule.status = 'failed';
      await kv.set(`email_schedule:${schedule.id}`, schedule);
      failed++;
    }
  } catch (scheduleError) {
    // Error processing individual schedule
    const errorMessage = scheduleError instanceof Error ? scheduleError.message : String(scheduleError);
    console.error(`[Email Automation] Error processing schedule ${schedule?.id}:`, errorMessage);
    failed++;
    // Continue with next schedule
  }
}

    console.log(`[Email Automation] Completed: ${processed} sent, ${skipped} skipped, ${failed} failed`);
    return processed;
    
  } catch (error) {
    // Top-level error
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Email Automation] Fatal error processing emails:', errorMessage);
    throw error; // Re-throw to be caught by route handler
  }
}

// =====================================================================
// TRACKING & ANALYTICS
// =====================================================================

export async function trackEmailEvent(event: EmailEvent): Promise<void> {
  // Store event
  await kv.set(`email_event:${event.id}`, event);
  
  // Add to user's event history
  const userEventsKey = `email_events:${event.email}`;
  const userEvents = (await kv.get(userEventsKey) || []) as string[];
  userEvents.push(event.id);
  await kv.set(userEventsKey, userEvents);
  
  // Update campaign stats
  if (event.campaign_id) {
    await incrementCampaignStat(event.campaign_id, event.event_type);
  }
}

export async function getRecentEmailsToUser(
  email: string,
  days: number
): Promise<EmailEvent[]> {
  const userEventsKey = `email_events:${email}`;
  const eventIds = (await kv.get(userEventsKey) || []) as string[];
  
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  const events: EmailEvent[] = [];
  
  for (const id of eventIds) {
    const event = (await kv.get(`email_event:${id}`)) as EmailEvent;
    if (event && new Date(event.timestamp).getTime() >= cutoff) {
      events.push(event);
    }
  }
  
  return events;
}

// =====================================================================
// CAMPAIGN MANAGEMENT
// =====================================================================

export async function getCampaign(campaignId: string): Promise<EmailCampaign | null> {
  return (await kv.get(`email_campaign:${campaignId}`)) as EmailCampaign | null;
}

export async function saveCampaign(campaign: EmailCampaign): Promise<void> {
  await kv.set(`email_campaign:${campaign.id}`, campaign);
}

export async function incrementCampaignStat(
  campaignId: string,
  stat: keyof EmailCampaign['stats']
): Promise<void> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) return;
  
  campaign.stats[stat]++;
  await saveCampaign(campaign);
}

// =====================================================================
// UTILITIES
// =====================================================================

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateUnsubscribeToken(): string {
  // Generate a secure random token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// =====================================================================
// INITIALIZATION
// =====================================================================

export async function initializeEmailSystem(): Promise<void> {
  // Save default campaigns
  await saveCampaign(BETA_WELCOME_SEQUENCE);
  
  console.log('[Email Automation] System initialized');
}
