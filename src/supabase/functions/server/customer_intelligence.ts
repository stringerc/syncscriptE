/**
 * Customer Intelligence Backend
 * Generate and manage customer profiles with health scoring and churn prediction
 */

import type { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';

interface CustomerProfile {
  email: string;
  name?: string;
  healthScore: number;
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
  lifetimeValue: number;
  satisfactionScore: number;
  emotionalState: {
    primary: string;
    intensity: number;
    trend: 'improving' | 'stable' | 'declining';
    triggers: string[];
  };
  journeyStage: 'onboarding' | 'active' | 'power_user' | 'at_risk' | 'churned';
  interactions: Array<{
    id: string;
    type: string;
    timestamp: string;
    sentiment: string;
    resolved: boolean;
  }>;
  productUsage: {
    lastActive: string;
    daysActive: number;
    featuresUsed: string[];
    engagementLevel: 'high' | 'medium' | 'low';
  };
  lastUpdated: string;
}

/**
 * Get all customer profiles
 */
export async function getCustomerProfiles(c: Context) {
  try {
    const profiles = await kv.getByPrefix('customer_profile:');
    
    return c.json({
      success: true,
      profiles: profiles.map(p => p.value),
      count: profiles.length
    });
  } catch (error: any) {
    console.error('[Customer Intelligence] Error fetching profiles:', error);
    return c.json({ error: 'Failed to fetch customer profiles', details: error.message }, 500);
  }
}

/**
 * Get single customer profile
 */
export async function getCustomerProfile(c: Context) {
  try {
    const email = c.req.param('email');
    
    const profile = await kv.get<CustomerProfile>(`customer_profile:${email}`);
    
    if (!profile) {
      return c.json({ error: 'Customer profile not found' }, 404);
    }
    
    return c.json({
      success: true,
      profile
    });
  } catch (error: any) {
    console.error('[Customer Intelligence] Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch customer profile', details: error.message }, 500);
  }
}

/**
 * Create or update customer profile
 */
export async function updateCustomerProfile(c: Context) {
  try {
    const { email, interactions, productUsage, ...otherData } = await c.req.json();
    
    // Get existing profile or create new
    let profile = await kv.get<CustomerProfile>(`customer_profile:${email}`);
    
    if (!profile) {
      profile = {
        email,
        name: email.split('@')[0],
        healthScore: 50,
        churnRisk: 'medium',
        lifetimeValue: 0,
        satisfactionScore: 5,
        emotionalState: {
          primary: 'neutral',
          intensity: 0.5,
          trend: 'stable',
          triggers: []
        },
        journeyStage: 'onboarding',
        interactions: [],
        productUsage: {
          lastActive: new Date().toISOString(),
          daysActive: 0,
          featuresUsed: [],
          engagementLevel: 'low'
        },
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Update with new data
    if (interactions) {
      profile.interactions = [...profile.interactions, ...interactions].slice(-50); // Keep last 50
    }
    
    if (productUsage) {
      profile.productUsage = { ...profile.productUsage, ...productUsage };
    }
    
    // Recalculate health score
    profile.healthScore = calculateHealthScore(profile);
    profile.churnRisk = assessChurnRisk(profile.healthScore, profile);
    profile.emotionalState = analyzeEmotionalState(profile.interactions);
    profile.lastUpdated = new Date().toISOString();
    
    // Merge other data
    profile = { ...profile, ...otherData };
    
    // Save
    await kv.set(`customer_profile:${email}`, profile);
    
    return c.json({
      success: true,
      profile
    });
  } catch (error: any) {
    console.error('[Customer Intelligence] Error updating profile:', error);
    return c.json({ error: 'Failed to update customer profile', details: error.message }, 500);
  }
}

/**
 * Calculate customer health score (0-100)
 */
function calculateHealthScore(profile: CustomerProfile): number {
  let score = 50;
  
  // Product engagement (40 points)
  const { engagementLevel, daysActive, featuresUsed } = profile.productUsage;
  if (engagementLevel === 'high') score += 20;
  else if (engagementLevel === 'medium') score += 10;
  
  if (daysActive > 7) score += 10;
  if (featuresUsed.length > 3) score += 10;
  
  // Sentiment trend (30 points)
  const recent = profile.interactions.slice(-10);
  if (recent.length > 0) {
    const positivePercent = recent.filter(i => i.sentiment === 'positive').length / recent.length;
    const negativePercent = recent.filter(i => i.sentiment === 'negative').length / recent.length;
    
    score += positivePercent * 20;
    score -= negativePercent * 20;
    
    const resolvedPercent = recent.filter(i => i.resolved).length / recent.length;
    score += resolvedPercent * 10;
  }
  
  // Emotional state (20 points)
  if (['excited', 'satisfied'].includes(profile.emotionalState.primary)) score += 10;
  if (['angry', 'disappointed'].includes(profile.emotionalState.primary)) score -= 15;
  if (profile.emotionalState.trend === 'improving') score += 10;
  if (profile.emotionalState.trend === 'declining') score -= 10;
  
  // Journey stage (10 points)
  if (profile.journeyStage === 'power_user') score += 10;
  if (profile.journeyStage === 'at_risk') score -= 20;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Assess churn risk
 */
function assessChurnRisk(healthScore: number, profile: CustomerProfile): CustomerProfile['churnRisk'] {
  if (profile.emotionalState.primary === 'angry') return 'critical';
  if (profile.productUsage.engagementLevel === 'low' && healthScore < 40) return 'critical';
  if (healthScore < 30) return 'high';
  if (profile.emotionalState.trend === 'declining' && healthScore < 50) return 'high';
  if (healthScore < 60) return 'medium';
  return 'low';
}

/**
 * Analyze emotional state from interactions
 */
function analyzeEmotionalState(interactions: any[]) {
  const recent = interactions.slice(-5);
  
  // Count sentiments
  const positive = recent.filter(i => i.sentiment === 'positive').length;
  const negative = recent.filter(i => i.sentiment === 'negative').length;
  
  // Determine primary emotion
  let primary = 'neutral';
  if (positive > negative + 1) primary = 'satisfied';
  if (negative > positive + 1) primary = 'frustrated';
  if (positive > 3) primary = 'excited';
  if (negative > 3) primary = 'angry';
  
  // Calculate intensity
  const intensity = Math.max(positive, negative) / recent.length;
  
  // Determine trend
  const older = interactions.slice(-10, -5);
  const olderPositive = older.filter(i => i.sentiment === 'positive').length;
  const olderNegative = older.filter(i => i.sentiment === 'negative').length;
  
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (positive > olderPositive + 1) trend = 'improving';
  if (negative > olderNegative + 1) trend = 'declining';
  
  // Identify triggers
  const triggers: string[] = [];
  recent.forEach(interaction => {
    if (interaction.type === 'bug_report') triggers.push('technical_issue');
    if (interaction.sentiment === 'negative' && !interaction.resolved) triggers.push('unresolved_issue');
  });
  
  return {
    primary,
    intensity,
    trend,
    triggers: [...new Set(triggers)]
  };
}

/**
 * Get at-risk customers
 */
export async function getAtRiskCustomers(c: Context) {
  try {
    const profiles = await kv.getByPrefix('customer_profile:');
    
    const atRisk = profiles
      .map(p => p.value as CustomerProfile)
      .filter(p => p.churnRisk === 'high' || p.churnRisk === 'critical')
      .sort((a, b) => {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return riskOrder[a.churnRisk] - riskOrder[b.churnRisk];
      });
    
    return c.json({
      success: true,
      customers: atRisk,
      count: atRisk.length
    });
  } catch (error: any) {
    console.error('[Customer Intelligence] Error fetching at-risk customers:', error);
    return c.json({ error: 'Failed to fetch at-risk customers', details: error.message }, 500);
  }
}

/**
 * Get power users (for rewards/engagement)
 */
export async function getPowerUsers(c: Context) {
  try {
    const profiles = await kv.getByPrefix('customer_profile:');
    
    const powerUsers = profiles
      .map(p => p.value as CustomerProfile)
      .filter(p => p.journeyStage === 'power_user' && p.healthScore > 70)
      .sort((a, b) => b.healthScore - a.healthScore);
    
    return c.json({
      success: true,
      customers: powerUsers,
      count: powerUsers.length
    });
  } catch (error: any) {
    console.error('[Customer Intelligence] Error fetching power users:', error);
    return c.json({ error: 'Failed to fetch power users', details: error.message }, 500);
  }
}
