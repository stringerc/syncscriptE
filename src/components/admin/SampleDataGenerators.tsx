/**
 * Sample Data Generators for Revolutionary CS System
 * Generate realistic customer profiles, triggers, and metrics for demo
 */

import type { CustomerProfile, EmotionalState } from './CustomerIntelligence';
import type { ProactiveTrigger } from './ProactiveSupportEngine';
import type { PerformanceMetrics } from './PerformanceAnalytics';

/**
 * Generate sample customer profiles with realistic data
 */
export function generateSampleCustomers(): CustomerProfile[] {
  const names = [
    { name: 'Sarah Chen', email: 'sarah@startup.com', stage: 'at_risk' as const },
    { name: 'John Miller', email: 'john@techco.com', stage: 'power_user' as const },
    { name: 'Emma Davis', email: 'emma@agency.com', stage: 'active' as const },
    { name: 'Michael Brown', email: 'michael@saas.io', stage: 'onboarding' as const },
    { name: 'Lisa Wang', email: 'lisa@enterprise.com', stage: 'power_user' as const },
  ];

  return names.map((person, index) => {
    const healthScore = person.stage === 'power_user' ? 85 + Math.random() * 10 :
                       person.stage === 'active' ? 65 + Math.random() * 15 :
                       person.stage === 'at_risk' ? 25 + Math.random() * 20 :
                       50 + Math.random() * 15;

    const emotionalStates: Record<string, EmotionalState> = {
      at_risk: {
        primary: 'frustrated',
        intensity: 0.7,
        trend: 'declining',
        triggers: ['technical_issue', 'performance']
      },
      power_user: {
        primary: 'excited',
        intensity: 0.8,
        trend: 'improving',
        triggers: []
      },
      active: {
        primary: 'satisfied',
        intensity: 0.5,
        trend: 'stable',
        triggers: []
      },
      onboarding: {
        primary: 'confused',
        intensity: 0.6,
        trend: 'improving',
        triggers: ['need_assistance']
      }
    };

    return {
      email: person.email,
      name: person.name,
      healthScore: Math.round(healthScore),
      churnRisk: person.stage === 'at_risk' ? 'critical' :
                person.stage === 'onboarding' ? 'medium' : 'low',
      lifetimeValue: Math.round(1000 + Math.random() * 5000),
      satisfactionScore: person.stage === 'power_user' ? 9 + Math.random() :
                        person.stage === 'at_risk' ? 4 + Math.random() * 2 :
                        6 + Math.random() * 2,
      emotionalState: emotionalStates[person.stage] || emotionalStates.active,
      journeyStage: person.stage,
      interactions: generateInteractions(5 + Math.floor(Math.random() * 10)),
      productUsage: {
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        daysActive: Math.floor(20 + Math.random() * 70),
        featuresUsed: ['automation', 'workflows', 'templates'].slice(0, Math.floor(1 + Math.random() * 3)),
        featuresNotUsed: ['advanced_triggers', 'api', 'integrations'],
        engagementLevel: person.stage === 'power_user' ? 'high' : 
                        person.stage === 'active' ? 'medium' : 'low',
        stuckPoints: person.stage === 'at_risk' ? ['advanced_setup', 'integration'] : []
      },
      milestones: generateMilestones(person.stage),
      preferences: {
        responseStyle: index % 3 === 0 ? 'formal' : index % 3 === 1 ? 'casual' : 'technical',
        communicationFrequency: 'medium',
        preferredChannel: 'email',
        timezone: 'America/Los_Angeles'
      },
      tags: person.stage === 'power_user' ? ['vip', 'advocate'] :
           person.stage === 'at_risk' ? ['needs_attention', 'high_priority'] : []
    };
  });
}

function generateInteractions(count: number) {
  const types = ['email', 'support', 'feature_request', 'bug_report', 'praise'] as const;
  const sentiments = ['positive', 'neutral', 'negative'] as const;
  
  return Array.from({ length: count }, (_, i) => ({
    id: `interaction_${i}`,
    type: types[Math.floor(Math.random() * types.length)],
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
    resolved: Math.random() > 0.3,
    responseTime: Math.floor(5 + Math.random() * 120),
    satisfaction: Math.floor(6 + Math.random() * 4)
  }));
}

function generateMilestones(stage: string) {
  const baseMilestones = [
    { type: 'signup' as const, date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), celebrated: true },
    { type: 'first_use' as const, date: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(), celebrated: true },
  ];

  if (stage === 'power_user') {
    baseMilestones.push(
      { type: 'feature_adoption' as const, date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), celebrated: true },
      { type: 'power_user' as const, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), celebrated: false }
    );
  }

  return baseMilestones;
}

/**
 * Generate sample proactive triggers
 */
export function generateSampleTriggers(): ProactiveTrigger[] {
  return [
    {
      id: 'trigger_1',
      type: 'at_risk',
      priority: 'critical',
      customerEmail: 'sarah@startup.com',
      customerName: 'Sarah Chen',
      reason: 'No login for 5 days • Trial ends in 2 days • Last email negative sentiment',
      suggestedAction: 'Founder personal outreach + trial extension',
      template: `Sarah,

I'm [YOUR_NAME], founder of SyncScript.

I noticed you've been experiencing some challenges, and I wanted to reach out personally before your trial ends in 2 days.

I'd love to understand what's not working and see if we can make it right.

Would you be open to a quick 10-minute call? I can also extend your trial by 30 days so you have more time to explore.

Your success matters to us.

Best,
[YOUR_NAME]`,
      timing: 'immediate',
      automatable: false,
      estimatedImpact: 'high'
    },
    {
      id: 'trigger_2',
      type: 'celebration',
      priority: 'medium',
      customerEmail: 'john@techco.com',
      customerName: 'John Miller',
      reason: 'Created 50th workflow - Power User milestone! ⚡',
      suggestedAction: 'Send badge + exclusive beta access',
      template: `⚡ POWER USER UNLOCKED, John!

You just created your 50th workflow in SyncScript. That's incredible!

You're officially in the top 5% of all SyncScript users. 🏆

As recognition, we're giving you:
✨ Exclusive Power User badge
✨ Early access to all new features
✨ Direct line to our product team

Keep being awesome! 🚀`,
      timing: 'immediate',
      automatable: true,
      estimatedImpact: 'high'
    },
    {
      id: 'trigger_3',
      type: 'stuck',
      priority: 'high',
      customerEmail: 'emma@agency.com',
      customerName: 'Emma Davis',
      reason: 'Attempted "Advanced Triggers" 5x with 20% success rate',
      suggestedAction: 'Send video tutorial + offer quick call',
      template: `Hey Emma! 👋

I noticed you've been exploring Advanced Triggers and wanted to reach out personally.

Sometimes this feature can be tricky at first. Would a quick 2-minute video walkthrough be helpful?

Here's a guide I put together: [LINK]

Or I'm happy to jump on a 5-minute call and show you exactly how it works!

Let me know! 😊`,
      timing: 'immediate',
      automatable: true,
      estimatedImpact: 'high'
    },
    {
      id: 'trigger_4',
      type: 'milestone',
      priority: 'medium',
      customerEmail: 'michael@saas.io',
      customerName: 'Michael Brown',
      reason: 'Completed first workflow! 🎉',
      suggestedAction: 'Send celebration + pro tips',
      template: `🎉 Congratulations, Michael!

You just completed your first workflow in SyncScript! That's awesome.

You're already ahead of 80% of new users.

Ready to level up? Here are 3 power user tips:
1. Use templates to save time
2. Chain workflows together
3. Set up automated triggers

Keep crushing it! 💪`,
      timing: 'immediate',
      automatable: true,
      estimatedImpact: 'medium'
    },
    {
      id: 'trigger_5',
      type: 'feature_adoption',
      priority: 'low',
      customerEmail: 'lisa@enterprise.com',
      customerName: 'Lisa Wang',
      reason: 'High engagement, ready for advanced features',
      suggestedAction: 'Introduce API integration',
      template: `Hey Lisa! 👋

I noticed you've been using Basic Automation a lot - that's great!

Quick tip: Did you know about our API integration? Since you're already automating workflows, you'd probably love this.

It lets you:
• Connect with external tools
• Build custom integrations
• Automate across platforms

Want to see it in action? Here's a 90-second video: [VIDEO_LINK]`,
      timing: 'within_week',
      automatable: true,
      estimatedImpact: 'medium'
    }
  ];
}

/**
 * Generate sample performance metrics
 */
export function generateSampleMetrics(): PerformanceMetrics {
  return {
    csat: {
      score: 88,
      responses: 127,
      trend: 'up',
      breakdown: { 1: 2, 2: 5, 3: 15, 4: 45, 5: 60 }
    },
    nps: {
      score: 52,
      promoters: 75,
      passives: 35,
      detractors: 17,
      trend: 'up'
    },
    ces: {
      score: 1.8,
      responses: 98,
      trend: 'down' // down is good for CES
    },
    responseTime: {
      average: 8.5,
      median: 6,
      p90: 15,
      p95: 22,
      firstResponseGoal: 10,
      goalAchievementRate: 92
    },
    resolutionTime: {
      average: 18.5,
      median: 14,
      p90: 32,
      resolutionGoal: 24,
      goalAchievementRate: 87
    },
    qualityScore: {
      overall: 89,
      empathy: 92,
      completeness: 87,
      clarity: 91,
      accuracy: 86
    },
    volume: {
      total: 347,
      pending: 12,
      resolved: 335,
      avgPerDay: 24.8,
      peakHours: [
        { hour: 10, count: 45 },
        { hour: 14, count: 52 },
        { hour: 15, count: 48 }
      ]
    },
    team: {
      totalAgents: 3,
      avgEmailsPerAgent: 115.7,
      topPerformer: {
        name: 'You',
        emailsHandled: 167,
        avgQuality: 92,
        avgCSAT: 91
      }
    }
  };
}
