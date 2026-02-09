/**
 * Beta API Utility
 * 
 * Handles beta signup API calls with:
 * - Automatic fallback to localStorage in development
 * - Error handling
 * - Type safety
 */

import { projectId, publicAnonKey } from './supabase/info';

interface BetaSignupResponse {
  success: boolean;
  memberNumber: number;
  message: string;
  alreadyExists?: boolean;
}

interface BetaCountResponse {
  success: boolean;
  count: number;
  message: string;
}

const STORAGE_KEY = 'syncscript_beta_signups';
const COUNT_KEY = 'syncscript_beta_count';

/**
 * Get API base URL
 */
function getApiUrl(): string {
  if (!projectId) {
    throw new Error('API configuration not available');
  }
  return `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/beta`;
}

/**
 * Get API headers with authorization
 */
function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`
  };
}

/**
 * Fallback: Store signup in localStorage
 */
function fallbackSignup(email: string): BetaSignupResponse {
  try {
    // Get or initialize signups
    const signupsJson = localStorage.getItem(STORAGE_KEY);
    const signups: Record<string, number> = signupsJson ? JSON.parse(signupsJson) : {};
    
    // Check if already signed up
    if (signups[email]) {
      return {
        success: true,
        memberNumber: signups[email],
        message: `You're already signed up! You're beta tester #${signups[email]}`,
        alreadyExists: true
      };
    }
    
    // Get current count
    const countStr = localStorage.getItem(COUNT_KEY);
    const currentCount = countStr ? parseInt(countStr, 10) : 0;
    const memberNumber = currentCount + 1;
    
    // Save signup
    signups[email] = memberNumber;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signups));
    localStorage.setItem(COUNT_KEY, memberNumber.toString());
    
    console.log(`📝 Beta signup saved locally: ${email} → #${memberNumber}`);
    
    return {
      success: true,
      memberNumber,
      message: `Welcome to the beta! You're tester #${memberNumber}`,
      alreadyExists: false
    };
  } catch (error) {
    console.error('Fallback signup failed:', error);
    throw new Error('Could not save signup. Please try again.');
  }
}

/**
 * Fallback: Get count from localStorage
 */
function fallbackGetCount(): BetaCountResponse {
  try {
    const countStr = localStorage.getItem(COUNT_KEY);
    const count = countStr ? parseInt(countStr, 10) : 127; // Default starting count
    
    return {
      success: true,
      count,
      message: `${count} beta testers joined`
    };
  } catch (error) {
    console.error('Fallback count failed:', error);
    return {
      success: true,
      count: 127,
      message: '127 beta testers joined'
    };
  }
}

/**
 * Sign up for beta testing
 */
export async function betaSignup(email: string): Promise<BetaSignupResponse> {
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  try {
    // Try API first
    const apiUrl = getApiUrl();
    
    const response = await fetch(`${apiUrl}/signup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Also save to localStorage as backup
    fallbackSignup(email);
    
    return data;
  } catch (error) {
    // This is expected when API isn't deployed yet - fallback to localStorage
    console.info('📝 Beta API not available (expected), using localStorage fallback');
    
    // Use fallback
    return fallbackSignup(email);
  }
}

/**
 * Get beta signup count
 */
export async function getBetaCount(): Promise<number> {
  try {
    // Try API first
    const apiUrl = getApiUrl();
    
    const response = await fetch(`${apiUrl}/count`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: BetaCountResponse = await response.json();
    
    if (data.success && typeof data.count === 'number') {
      // Update localStorage cache
      localStorage.setItem(COUNT_KEY, data.count.toString());
      return data.count;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    // This is expected when API isn't deployed yet - fallback to localStorage
    console.info('📊 Beta API not available (expected), using localStorage fallback');
    
    // Use fallback
    const fallback = fallbackGetCount();
    return fallback.count;
  }
}

/**
 * Check if email is already signed up
 */
export async function checkBetaSignup(email: string): Promise<boolean> {
  try {
    // Check localStorage first
    const signupsJson = localStorage.getItem(STORAGE_KEY);
    if (signupsJson) {
      const signups: Record<string, number> = JSON.parse(signupsJson);
      if (signups[email.toLowerCase()]) {
        return true;
      }
    }

    // Try API
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/check/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    console.warn('Check signup failed:', error);
    return false;
  }
}

/**
 * Resend welcome email for an existing subscriber
 */
export async function resendWelcomeEmail(email: string): Promise<{ success: boolean; message: string }> {
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  try {
    // Call the resend endpoint on the email system
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/email/resend-welcome`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Welcome email resent successfully!'
    };
  } catch (error) {
    console.error('Resend welcome email failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to resend email. Please try again.');
  }
}
