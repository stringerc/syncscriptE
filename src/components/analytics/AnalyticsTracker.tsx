import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../../utils/analytics';

/**
 * Analytics Tracker Component
 * 
 * Tracks page views and route changes for analytics
 * This component should be placed high in the component tree
 * to capture all route changes.
 */
export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    const pageTitle = document.title || 'SyncScript';
    const pagePath = location.pathname + location.search;
    
    analytics.trackPageView({
      pageTitle,
      pagePath
    });
    
    // Log for debugging (remove in production)
    console.log(`Analytics: Page view tracked - ${pageTitle} (${pagePath})`);
  }, [location]);

  // This component doesn't render anything
  return null;
}