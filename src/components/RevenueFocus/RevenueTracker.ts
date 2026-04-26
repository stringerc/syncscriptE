/**
 * Revenue Tracking Module
 * 
 * Enhanced revenue analytics for tracking upsell performance
 * Implements event tracking for A/B testing and optimization
 */

interface RevenueEvent {
  type: 'plan_selected' | 'upsell_shown' | 'upsell_converted' | 'pricing_toggled';
  planId: string;
  billingCycle: 'monthly' | 'annual';
  value: number;
  userType?: string;
  timestamp: number;
  source: string;
}

interface RevenueSession {
  events: RevenueEvent[];
  sessionId: string;
  startTime: number;
  lastEventTime: number;
}

export class RevenueTracker {
  private static instance: RevenueTracker;
  private session: RevenueSession | null = null;
  private readonly STORAGE_KEY = 'syncscript_revenue_events';

  static getInstance(): RevenueTracker {
    if (!RevenueTracker.instance) {
      RevenueTracker.instance = new RevenueTracker();
    }
    return RevenueTracker.instance;
  }

  constructor() {
    this.initSession();
  }

  private initSession(): void {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();
    
    this.session = {
      events: [],
      sessionId,
      startTime,
      lastEventTime: startTime
    };

    // Load existing events from storage
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed: RevenueSession = JSON.parse(saved);
        this.session.events = parsed.events || [];
      } catch (e) {
        console.warn('Failed to load revenue tracking data:', e);
      }
    }
  }

  private generateSessionId(): string {
    return `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveSession(): void {
    if (this.session) {
      this.session.lastEventTime = Date.now();
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.session));
      } catch (e) {
        console.warn('Failed to save revenue tracking data:', e);
      }
    }
  }

  trackEvent(event: Omit<RevenueEvent, 'timestamp'>): void {
    const fullEvent: RevenueEvent = {
      ...event,
      timestamp: Date.now()
    };

    if (this.session) {
      this.session.events.push(fullEvent);
      this.saveSession();
    }

    // Console logging for development
    if (import.meta.env.DEV) {
      console.log('🎯 Revenue Track:', fullEvent);
    }
  }

  trackUpsellView(planId: string, userType?: string): void {
    this.trackEvent({
      type: 'upsell_shown',
      planId,
      billingCycle: 'annual',
      value: 0,
      userType,
      source: 'annual_upsell_component'
    });
  }

  trackPlanSelection(planId: string, billingCycle: 'monthly' | 'annual', value: number, userType?: string): void {
    this.trackEvent({
      type: 'plan_selected',
      planId,
      billingCycle,
      value,
      userType,
      source: 'annual_upsell_component'
    });
  }

  trackConversion(planId: string, value: number, userType?: string): void {
    this.trackEvent({
      type: 'upsell_converted',
      planId,
      billingCycle: 'annual',
      value,
      userType,
      source: 'annual_upsell_component'
    });
  }

  trackBillingToggle(billingCycle: 'monthly' | 'annual'): void {
    this.trackEvent({
      type: 'pricing_toggled',
      planId: 'toggle',
      billingCycle,
      value: 0,
      source: 'billing_toggle'
    });
  }

  getAnalytics(): {
    totalConversions: number;
    totalRevenue: number;
    monthlyVsAnnual: { monthly: number; annual: number };
    conversionRateByUserType: Record<string, { shown: number; converted: number; rate: number }>;
  } {
    if (!this.session) {
      return {
        totalConversions: 0,
        totalRevenue: 0,
        monthlyVsAnnual: { monthly: 0, annual: 0 },
        conversionRateByUserType: {}
      };
    }

    const events = this.session.events;
    
    // Track conversions
    const conversions = events.filter(e => e.type === 'upsell_converted');
    const totalConversions = conversions.length;
    const totalRevenue = conversions.reduce((sum, e) => sum + e.value, 0);
    
    // Monthly vs annual selections
    const planSelections = events.filter(e => e.type === 'plan_selected');
    const monthlyVsAnnual = {
      monthly: planSelections.filter(e => e.billingCycle === 'monthly').length,
      annual: planSelections.filter(e => e.billingCycle === 'annual').length
    };

    // Conversion by user type
    const shownByUserType: Record<string, number> = {};
    const convertedByUserType: Record<string, number> = {};

    events.forEach(event => {
      if (!event.userType) return;
      
      if (event.type === 'upsell_shown') {
        shownByUserType[event.userType] = (shownByUserType[event.userType] || 0) + 1;
      }
      if (event.type === 'upsell_converted') {
        convertedByUserType[event.userType] = (convertedByUserType[event.userType] || 0) + 1;
      }
    });

    const conversionRateByUserType: Record<string, { shown: number; converted: number; rate: number }> = {};
    Object.keys(shownByUserType).forEach(userType => {
      const shown = shownByUserType[userType] || 0;
      const converted = convertedByUserType[userType] || 0;
      conversionRateByUserType[userType] = {
        shown,
        converted,
        rate: shown > 0 ? (converted / shown) * 100 : 0
      };
    });

    return {
      totalConversions,
      totalRevenue,
      monthlyVsAnnual,
      conversionRateByUserType
    };
  }

  cleanupOldEvents(): void {
    if (!this.session) return;
    
    // Keep only events from last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.session.events = this.session.events.filter(e => e.timestamp > thirtyDaysAgo);
    this.saveSession();
  }

  exportAnalytics(): string {
    if (!this.session) return '';
    
    const analytics = this.getAnalytics();
    return JSON.stringify(analytics, null, 2);
  }
}

// Global export for development
(window as any).RevenueTracker = RevenueTracker;