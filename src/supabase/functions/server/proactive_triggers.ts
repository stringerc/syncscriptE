/**
 * Proactive Support Triggers Backend
 * Detect at-risk customers, silent struggles, celebrations, and feature adoption opportunities
 */

import type { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';

interface ProactiveTrigger {
  id: string;
  type: 'at_risk' | 'silent_user' | 'stuck' | 'celebration' | 'milestone' | 'feature_adoption';
  priority: 'critical' | 'high' | 'medium' | 'low';
  customerEmail: string;
  customerName: string;
  reason: string;
  suggestedAction: string;
  template: string;
  timing: 'immediate' | 'within_24h' | 'within_week';
  automatable: boolean;
  estimatedImpact: 'high' | 'medium' | 'low';
  createdAt: string;
  actioned: boolean;
}

/**
 * Get all active triggers
 */
export async function getProactiveTriggers(c: Context) {
  try {
    const triggers = await kv.getByPrefix('proactive_trigger:');
    
    // Filter out actioned triggers older than 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const activeTriggers = triggers
      .map(t => t.value as ProactiveTrigger)
      .filter(t => !t.actioned || new Date(t.createdAt).getTime() > sevenDaysAgo)
      .sort((a, b) => {
        // Sort by priority then timing
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const timingOrder = { immediate: 0, within_24h: 1, within_week: 2 };
        
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return timingOrder[a.timing] - timingOrder[b.timing];
      });
    
    return c.json({
      success: true,
      triggers: activeTriggers,
      count: activeTriggers.length,
      breakdown: {
        critical: activeTriggers.filter(t => t.priority === 'critical').length,
        high: activeTriggers.filter(t => t.priority === 'high').length,
        medium: activeTriggers.filter(t => t.priority === 'medium').length,
        low: activeTriggers.filter(t => t.priority === 'low').length,
      }
    });
  } catch (error: any) {
    console.error('[Proactive Triggers] Error fetching triggers:', error);
    return c.json({ error: 'Failed to fetch proactive triggers', details: error.message }, 500);
  }
}

/**
 * Create new trigger
 */
export async function createProactiveTrigger(c: Context) {
  try {
    const triggerData = await c.req.json();
    
    const trigger: ProactiveTrigger = {
      id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      actioned: false,
      ...triggerData
    };
    
    await kv.set(`proactive_trigger:${trigger.id}`, trigger);
    
    console.log(`[Proactive Triggers] Created trigger: ${trigger.type} for ${trigger.customerEmail} (${trigger.priority})`);
    
    return c.json({
      success: true,
      trigger
    });
  } catch (error: any) {
    console.error('[Proactive Triggers] Error creating trigger:', error);
    return c.json({ error: 'Failed to create proactive trigger', details: error.message }, 500);
  }
}

/**
 * Mark trigger as actioned
 */
export async function actionTrigger(c: Context) {
  try {
    const { triggerId } = await c.req.json();
    
    const trigger = await kv.get<ProactiveTrigger>(`proactive_trigger:${triggerId}`);
    
    if (!trigger) {
      return c.json({ error: 'Trigger not found' }, 404);
    }
    
    trigger.actioned = true;
    await kv.set(`proactive_trigger:${triggerId}`, trigger);
    
    return c.json({
      success: true,
      trigger
    });
  } catch (error: any) {
    console.error('[Proactive Triggers] Error actioning trigger:', error);
    return c.json({ error: 'Failed to action trigger', details: error.message }, 500);
  }
}

/**
 * Detect silent struggles (users stuck but not asking for help)
 */
export async function detectSilentStruggles(c: Context) {
  try {
    // Get customer profiles
    const profiles = await kv.getByPrefix('customer_profile:');
    const triggers: ProactiveTrigger[] = [];
    
    profiles.forEach(({ value: profile }) => {
      // Pattern: Multiple failed attempts at same action
      if (profile.productUsage.stuckPoints && profile.productUsage.stuckPoints.length > 0) {
        triggers.push({
          id: `silent_${profile.email}_${Date.now()}`,
          type: 'stuck',
          priority: 'high',
          customerEmail: profile.email,
          customerName: profile.name || profile.email.split('@')[0],
          reason: `Stuck on: ${profile.productUsage.stuckPoints.join(', ')}`,
          suggestedAction: 'Send targeted help guide or offer personal onboarding call',
          template: `Hey ${profile.name || profile.email.split('@')[0]}! 👋\n\nI noticed you've been exploring some advanced features and wanted to reach out personally.\n\nWould a quick 2-minute video walkthrough be helpful? Or I'm happy to jump on a 5-minute call!\n\nLet me know! 😊`,
          timing: 'immediate',
          automatable: true,
          estimatedImpact: 'high',
          createdAt: new Date().toISOString(),
          actioned: false
        });
      }
      
      // Pattern: Low engagement despite being active
      if (profile.productUsage.daysActive > 7 && profile.productUsage.engagementLevel === 'low') {
        triggers.push({
          id: `silent_${profile.email}_engagement_${Date.now()}`,
          type: 'silent_user',
          priority: 'medium',
          customerEmail: profile.email,
          customerName: profile.name || profile.email.split('@')[0],
          reason: `Active for ${profile.productUsage.daysActive} days but low engagement`,
          suggestedAction: 'Send personalized tips email',
          template: `Hi ${profile.name || profile.email.split('@')[0]},\n\nHow's it going with SyncScript? I wanted to check in and see if there's anything I can help with.\n\nHere are a few quick wins you might enjoy:\n• [TIP_1]\n• [TIP_2]\n• [TIP_3]\n\nFeel free to reply if you have any questions!`,
          timing: 'within_24h',
          automatable: true,
          estimatedImpact: 'medium',
          createdAt: new Date().toISOString(),
          actioned: false
        });
      }
    });
    
    // Save new triggers
    for (const trigger of triggers) {
      await kv.set(`proactive_trigger:${trigger.id}`, trigger);
    }
    
    return c.json({
      success: true,
      triggers,
      count: triggers.length
    });
  } catch (error: any) {
    console.error('[Proactive Triggers] Error detecting silent struggles:', error);
    return c.json({ error: 'Failed to detect silent struggles', details: error.message }, 500);
  }
}

/**
 * Detect at-risk customers (churn prediction)
 */
export async function detectAtRiskCustomers(c: Context) {
  try {
    const profiles = await kv.getByPrefix('customer_profile:');
    const triggers: ProactiveTrigger[] = [];
    
    profiles.forEach(({ value: profile }) => {
      if (profile.churnRisk === 'critical' || profile.churnRisk === 'high') {
        const priority = profile.churnRisk === 'critical' ? 'critical' : 'high';
        
        triggers.push({
          id: `risk_${profile.email}_${Date.now()}`,
          type: 'at_risk',
          priority,
          customerEmail: profile.email,
          customerName: profile.name || profile.email.split('@')[0],
          reason: `${profile.churnRisk} churn risk • Health score: ${profile.healthScore}`,
          suggestedAction: priority === 'critical' ? 'Founder personal outreach' : 'Personal check-in',
          template: priority === 'critical'
            ? `${profile.name || profile.email.split('@')[0]},\n\nI'm [YOUR_NAME], founder of SyncScript.\n\nI noticed you've been experiencing some challenges, and I wanted to reach out personally.\n\nI'd love to understand what's not working and see if we can make it right.\n\nWould you be open to a quick 10-minute call this week?\n\nYour success matters to us.\n\nBest,\n[YOUR_NAME]`
            : `Hey ${profile.name || profile.email.split('@')[0]}!\n\nHaven't seen you around in a while - hope everything is going well!\n\nQuick question: How's your experience with SyncScript been so far? Running into any challenges?\n\nI'm here to help if you need anything.\n\nLooking forward to hearing from you!`,
          timing: 'immediate',
          automatable: false,
          estimatedImpact: 'high',
          createdAt: new Date().toISOString(),
          actioned: false
        });
      }
    });
    
    // Save triggers
    for (const trigger of triggers) {
      await kv.set(`proactive_trigger:${trigger.id}`, trigger);
    }
    
    return c.json({
      success: true,
      triggers,
      count: triggers.length
    });
  } catch (error: any) {
    console.error('[Proactive Triggers] Error detecting at-risk customers:', error);
    return c.json({ error: 'Failed to detect at-risk customers', details: error.message }, 500);
  }
}

/**
 * Detect celebration moments (milestones, wins)
 */
export async function detectCelebrations(c: Context) {
  try {
    const profiles = await kv.getByPrefix('customer_profile:');
    const triggers: ProactiveTrigger[] = [];
    
    profiles.forEach(({ value: profile }) => {
      // Power user milestone
      if (profile.journeyStage === 'power_user' && profile.healthScore > 80) {
        triggers.push({
          id: `celebrate_${profile.email}_poweruser_${Date.now()}`,
          type: 'celebration',
          priority: 'medium',
          customerEmail: profile.email,
          customerName: profile.name || profile.email.split('@')[0],
          reason: 'Power User milestone reached! 🎉',
          suggestedAction: 'Send badge + exclusive perks',
          template: `⚡ POWER USER UNLOCKED, ${profile.name || profile.email.split('@')[0]}!\n\nYou're officially in the top 5% of all SyncScript users. 🏆\n\nAs recognition, we're giving you:\n✨ Exclusive Power User badge\n✨ Early access to new features\n✨ Direct line to our product team\n\nKeep being awesome! 🚀`,
          timing: 'immediate',
          automatable: true,
          estimatedImpact: 'high',
          createdAt: new Date().toISOString(),
          actioned: false
        });
      }
      
      // High satisfaction score
      if (profile.satisfactionScore >= 9 && !profile.celebratedHighSatisfaction) {
        triggers.push({
          id: `celebrate_${profile.email}_satisfaction_${Date.now()}`,
          type: 'milestone',
          priority: 'low',
          customerEmail: profile.email,
          customerName: profile.name || profile.email.split('@')[0],
          reason: 'High satisfaction score (9+)',
          suggestedAction: 'Request testimonial or referral',
          template: `Hi ${profile.name || profile.email.split('@')[0]},\n\nI'm so glad you're loving SyncScript! 🎉\n\nWould you be willing to share your experience? We'd love to feature your story on our website.\n\nAlso, if you know anyone who might benefit from SyncScript, we have a referral program with great perks!\n\nThank you for being awesome!`,
          timing: 'within_week',
          automatable: true,
          estimatedImpact: 'medium',
          createdAt: new Date().toISOString(),
          actioned: false
        });
      }
    });
    
    // Save triggers
    for (const trigger of triggers) {
      await kv.set(`proactive_trigger:${trigger.id}`, trigger);
    }
    
    return c.json({
      success: true,
      triggers,
      count: triggers.length
    });
  } catch (error: any) {
    console.error('[Proactive Triggers] Error detecting celebrations:', error);
    return c.json({ error: 'Failed to detect celebrations', details: error.message }, 500);
  }
}

/**
 * Run all detection algorithms (cron job handler)
 */
export async function runAllDetections(c: Context) {
  try {
    console.log('[Proactive Triggers] Running all detection algorithms...');
    
    // Run all detections in parallel
    const [silentRes, atRiskRes, celebrationRes] = await Promise.all([
      detectSilentStruggles(c),
      detectAtRiskCustomers(c),
      detectCelebrations(c)
    ]);
    
    return c.json({
      success: true,
      message: 'All detections completed',
      results: {
        silentStruggles: await silentRes.json(),
        atRisk: await atRiskRes.json(),
        celebrations: await celebrationRes.json()
      }
    });
  } catch (error: any) {
    console.error('[Proactive Triggers] Error running detections:', error);
    return c.json({ error: 'Failed to run detections', details: error.message }, 500);
  }
}
