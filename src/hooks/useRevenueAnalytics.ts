import { useCallback } from 'react';

interface RevenueEventData {
  userId: string;
  currentPlan?: string;
  usageCount?: number;
  revenueValue?: number;
  [key: string]: any;
}

interface RevenueMetrics {
  tasksCompleted: number;
  planType: 'lite' | 'pro' | 'enterprise';
  revenueGenerated: number;
  upgradeProbability: number;
}

export function useRevenueAnalytics() {
  const trackRevenueEvent = useCallback((event: string, data: RevenueEventData) => {
    // Track to console for local dev
    console.log('[REVENUE_ANALYTICS]', {
      timestamp: new Date().toISOString(),
      event,
      data,
      revenueEstimate: calculateRevenueValue(event, data)
    });

    // Send to analytics service (production)
    if (window.fetch) {
      fetch('/api/analytics/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          properties: {
            ...data,
            category: 'revenue',
            type: 'upgrade_prompt'
          }
        })
      }).catch(err => console.error('Analytics failed:', err));
    }
  }, []);

  const calculateRevenueValue = (event: string, data: RevenueEventData): number => {
    const revenueMap: Record<string, number> = {
      'task_limit_upgrade_clicked': 19.0,   // Pro plan monthly
      'task_limit_upgrade_prompt_shown': 0.5,  // Expected conversion value
      'enterprise_upgrade_clicked': 149.0,  // Enterprise monthly
      'referral_program_upgrade': 19.0      // Via referral program
    };

    return revenueMap[event] || 0;
  };

  const getUpgradeProbability = (usage: number, plan: string): number => {
    if (plan === 'enterprise') return 0;
    
    const probabilityMap: Record<number, number> = {
      80: 0.05,   // 5% at 80% usage
      90: 0.12,   // 12% at 90% usage  
      95: 0.18,   // 18% at 95% usage
      100: 0.25   // 25% at 100% usage
    };

    for (const threshold in probabilityMap) {
      if (usage >= parseInt(threshold)) {
        return probabilityMap[threshold];
      }
    }
    
    return 0.02; // 2% baseline
  };

  return {
    trackRevenueEvent,
    calculateRevenueValue,
    getUpgradeProbability,
    revenuePredictions: {
      liteToProConversionRate: 0.18,
      proToEnterpriseRate: 0.08,
      averageProRevenue: 19.0,
      averageEnterpriseRevenue: 149.0,
      monthlyProjectedRevenue: 3800 // Based on current user base
    }
  };
}