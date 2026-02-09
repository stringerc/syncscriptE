/**
 * Client-side analytics tracking for scripts and templates
 * Stores data in localStorage for persistence
 */

export interface ScriptUsageEvent {
  scriptId: number;
  scriptName: string;
  action: 'view' | 'favorite' | 'import' | 'run' | 'unfavorite';
  timestamp: string;
  adaptationType?: 'none' | 'resonance';
}

export interface ScriptAnalytics {
  totalViews: number;
  totalImports: number;
  totalRuns: number;
  favoriteScripts: number[];
  usageHistory: ScriptUsageEvent[];
  popularScripts: { scriptId: number; views: number; imports: number }[];
  lastUpdated: string;
}

const STORAGE_KEY = 'syncscript_analytics';
const MAX_HISTORY = 1000; // Keep last 1000 events

export class ScriptAnalyticsTracker {
  
  /**
   * Track a script event
   */
  static trackEvent(event: Omit<ScriptUsageEvent, 'timestamp'>): void {
    const analytics = this.getAnalytics();
    
    const fullEvent: ScriptUsageEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // Add to history
    analytics.usageHistory.unshift(fullEvent);
    
    // Trim history if too long
    if (analytics.usageHistory.length > MAX_HISTORY) {
      analytics.usageHistory = analytics.usageHistory.slice(0, MAX_HISTORY);
    }

    // Update aggregates
    if (event.action === 'view') {
      analytics.totalViews++;
      this.updatePopularScript(analytics, event.scriptId, 'view');
    } else if (event.action === 'import') {
      analytics.totalImports++;
      this.updatePopularScript(analytics, event.scriptId, 'import');
    } else if (event.action === 'run') {
      analytics.totalRuns++;
    } else if (event.action === 'favorite') {
      if (!analytics.favoriteScripts.includes(event.scriptId)) {
        analytics.favoriteScripts.push(event.scriptId);
      }
    } else if (event.action === 'unfavorite') {
      analytics.favoriteScripts = analytics.favoriteScripts.filter(id => id !== event.scriptId);
    }

    analytics.lastUpdated = new Date().toISOString();
    this.saveAnalytics(analytics);
  }

  /**
   * Get current analytics
   */
  static getAnalytics(): ScriptAnalytics {
    if (typeof window === 'undefined') {
      return this.getDefaultAnalytics();
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse analytics', e);
      }
    }
    
    return this.getDefaultAnalytics();
  }

  /**
   * Get default analytics object
   */
  private static getDefaultAnalytics(): ScriptAnalytics {
    return {
      totalViews: 0,
      totalImports: 0,
      totalRuns: 0,
      favoriteScripts: [],
      usageHistory: [],
      popularScripts: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save analytics to localStorage
   */
  private static saveAnalytics(analytics: ScriptAnalytics): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(analytics));
    }
  }

  /**
   * Update popular scripts tracking
   */
  private static updatePopularScript(
    analytics: ScriptAnalytics,
    scriptId: number,
    type: 'view' | 'import'
  ): void {
    let scriptEntry = analytics.popularScripts.find(s => s.scriptId === scriptId);
    
    if (!scriptEntry) {
      scriptEntry = { scriptId, views: 0, imports: 0 };
      analytics.popularScripts.push(scriptEntry);
    }

    if (type === 'view') {
      scriptEntry.views++;
    } else if (type === 'import') {
      scriptEntry.imports++;
    }

    // Sort by combined score (views + imports * 5)
    analytics.popularScripts.sort((a, b) => {
      const scoreA = a.views + (a.imports * 5);
      const scoreB = b.views + (b.imports * 5);
      return scoreB - scoreA;
    });
  }

  /**
   * Get most viewed scripts
   */
  static getMostViewedScripts(limit: number = 5): { scriptId: number; views: number }[] {
    const analytics = this.getAnalytics();
    return analytics.popularScripts
      .map(s => ({ scriptId: s.scriptId, views: s.views }))
      .slice(0, limit);
  }

  /**
   * Get most imported scripts
   */
  static getMostImportedScripts(limit: number = 5): { scriptId: number; imports: number }[] {
    const analytics = this.getAnalytics();
    return analytics.popularScripts
      .sort((a, b) => b.imports - a.imports)
      .map(s => ({ scriptId: s.scriptId, imports: s.imports }))
      .slice(0, limit);
  }

  /**
   * Get recent activity
   */
  static getRecentActivity(limit: number = 10): ScriptUsageEvent[] {
    const analytics = this.getAnalytics();
    return analytics.usageHistory.slice(0, limit);
  }

  /**
   * Check if script is favorited
   */
  static isFavorite(scriptId: number): boolean {
    const analytics = this.getAnalytics();
    return analytics.favoriteScripts.includes(scriptId);
  }

  /**
   * Get total time saved estimate (mock calculation)
   */
  static getTotalTimeSaved(): { hours: number; minutes: number } {
    const analytics = this.getAnalytics();
    // Assume each import saves ~30 minutes on average
    const totalMinutes = analytics.totalImports * 30;
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60
    };
  }

  /**
   * Get usage trend (last 7 days)
   */
  static getUsageTrend(): { date: string; views: number; imports: number }[] {
    const analytics = this.getAnalytics();
    const trend: { [key: string]: { views: number; imports: number } } = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trend[dateStr] = { views: 0, imports: 0 };
    }

    // Aggregate events by day
    analytics.usageHistory.forEach(event => {
      const dateStr = event.timestamp.split('T')[0];
      if (trend[dateStr]) {
        if (event.action === 'view') {
          trend[dateStr].views++;
        } else if (event.action === 'import') {
          trend[dateStr].imports++;
        }
      }
    });

    return Object.entries(trend).map(([date, data]) => ({
      date,
      ...data
    }));
  }

  /**
   * Clear all analytics
   */
  static clearAnalytics(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Get adaptation usage stats
   */
  static getAdaptationStats(): { total: number; resonance: number; asIs: number } {
    const analytics = this.getAnalytics();
    const imports = analytics.usageHistory.filter(e => e.action === 'import');
    
    return {
      total: imports.length,
      resonance: imports.filter(e => e.adaptationType === 'resonance').length,
      asIs: imports.filter(e => e.adaptationType === 'none').length
    };
  }
}
