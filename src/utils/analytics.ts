// Analytics service for SyncScript
// Handles Google Analytics 4 and Plausible tracking

/**
 * Analytics Service for unified tracking
 * 
 * TO COMPLETE SETUP:
 * 1. Create GA4 property: https://analytics.google.com/
 *    - Get Measurement ID: G-XXXXXXXXXX
 *    - Replace in index.html
 * 2. Create Plausible account: https://plausible.io/
 *    - Add domain: syncscript.app
 *    - Replace script in index.html
 * 3. Set environment variables if needed
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    plausible: (...args: any[]) => void;
  }
}

export type AnalyticsEvent = {
  category: string;
  action: string;
  label?: string;
  value?: number;
  [key: string]: any;
};

export type PageViewEvent = {
  pageTitle: string;
  pagePath: string;
  pageLocation?: string;
};

class AnalyticsService {
  private isInitialized = false;
  private gaMeasurementId: string | null = null;
  private plausibleDomain: string = 'syncscript.app';
  
  constructor() {
    // Check if analytics are enabled (cookie consent)
    this.isInitialized = this.checkAnalyticsEnabled();
    
    // Extract GA Measurement ID from script tag if present
    this.gaMeasurementId = this.extractGaMeasurementId();
  }
  
  /**
   * Check if user has accepted cookies
   */
  private checkAnalyticsEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    
    const cookiesAccepted = localStorage.getItem('cookies_accepted');
    return cookiesAccepted === 'true';
  }
  
  /**
   * Extract GA Measurement ID from script tag
   */
  private extractGaMeasurementId(): string | null {
    if (typeof document === 'undefined') return null;
    
    const gaScript = document.querySelector('script[src*="gtag/js"]');
    if (!gaScript) return null;
    
    const src = gaScript.getAttribute('src') || '';
    const match = src.match(/id=([^&]+)/);
    return match ? match[1] : 'G-CPHSHY2JVK'; // Default to SyncScript ID
  }
  
  /**
   * Initialize analytics if enabled
   */
  initialize(): void {
    if (!this.isInitialized) {
      console.log('Analytics disabled - user has not accepted cookies');
      return;
    }
    
    console.log('Analytics service initialized');
  }
  
  /**
   * Track page view
   */
  trackPageView(event: PageViewEvent): void {
    if (!this.isInitialized) return;
    
    const { pageTitle, pagePath, pageLocation } = event;
    
    // GA4 page view
    if (window.gtag && this.gaMeasurementId) {
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: pageLocation || window.location.origin + pagePath,
        page_path: pagePath
      });
    }
    
    // Plausible page view
    if (window.plausible) {
      window.plausible('pageview', {
        u: window.location.origin + pagePath
      });
    }
    
    console.log(`Page view tracked: ${pageTitle} (${pagePath})`);
  }
  
  /**
   * Track custom event
   */
  trackEvent(event: AnalyticsEvent): void {
    if (!this.isInitialized) return;
    
    const { category, action, label, value, ...extraParams } = event;
    
    // GA4 event
    if (window.gtag && this.gaMeasurementId) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        ...extraParams
      });
    }
    
    // Plausible custom event
    if (window.plausible) {
      window.plausible(action, {
        props: {
          category,
          label,
          value,
          ...extraParams
        }
      });
    }
    
    console.log(`Event tracked: ${category} - ${action}`, { label, value });
  }
  
  /**
   * Track waitlist signup
   */
  trackWaitlistSignup(email: string, referralCode?: string): void {
    if (!this.isInitialized) return;
    
    // Hash email for privacy
    const emailHash = this.hashEmail(email);
    
    this.trackEvent({
      category: 'Conversion',
      action: 'waitlist_signup',
      label: 'Waitlist',
      value: 1,
      email_hash: emailHash,
      referral_code: referralCode || 'none'
    });
    
    // Additional conversion tracking for GA4
    if (window.gtag && this.gaMeasurementId) {
      window.gtag('event', 'conversion', {
        send_to: `${this.gaMeasurementId}/waitlist_signup`,
        value: 1.0,
        currency: 'USD',
        transaction_id: `waitlist_${Date.now()}_${emailHash}`
      });
    }
  }
  
  /**
   * Track referral share
   */
  trackReferralShare(method: 'twitter' | 'copy' | 'native_share' | 'other'): void {
    if (!this.isInitialized) return;
    
    this.trackEvent({
      category: 'Engagement',
      action: 'referral_share',
      label: method,
      value: 1
    });
  }
  
  /**
   * Track error
   */
  trackError(error: Error, context: string): void {
    if (!this.isInitialized) return;
    
    this.trackEvent({
      category: 'Error',
      action: 'exception',
      label: error.message,
      description: error.message,
      fatal: false,
      context
    });
  }
  
  /**
   * Track user engagement
   */
  trackEngagement(type: string, details?: any): void {
    if (!this.isInitialized) return;
    
    this.trackEvent({
      category: 'Engagement',
      action: `engagement_${type}`,
      ...details
    });
  }
  
  /**
   * Enable analytics (when user accepts cookies)
   */
  enable(): void {
    localStorage.setItem('cookies_accepted', 'true');
    this.isInitialized = true;
    
    // Reload page to initialize analytics scripts
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
  
  /**
   * Disable analytics (when user rejects cookies)
   */
  disable(): void {
    localStorage.setItem('cookies_accepted', 'false');
    this.isInitialized = false;
    
    // Disable GA4
    if (this.gaMeasurementId) {
      window[`ga-disable-${this.gaMeasurementId}`] = true;
    }
    
    // Remove Plausible script
    const plausibleScript = document.querySelector(`script[data-domain="${this.plausibleDomain}"]`);
    if (plausibleScript) {
      plausibleScript.remove();
    }
  }
  
  /**
   * Check if analytics are enabled
   */
  isEnabled(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Hash email for privacy (simple implementation)
   */
  private hashEmail(email: string): string {
    try {
      // Simple hash for privacy - in production use proper hashing
      const username = email.split('@')[0];
      return btoa(username).substring(0, 10).replace(/[^a-zA-Z0-9]/g, '');
    } catch {
      return 'anonymous';
    }
  }
  
  /**
   * Get analytics status for debugging
   */
  getStatus(): {
    enabled: boolean;
    ga4: boolean;
    plausible: boolean;
    measurementId: string | null;
  } {
    return {
      enabled: this.isInitialized,
      ga4: !!(window.gtag && this.gaMeasurementId),
      plausible: !!window.plausible,
      measurementId: this.gaMeasurementId
    };
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// Initialize on import
if (typeof window !== 'undefined') {
  analytics.initialize();
}

export default analytics;