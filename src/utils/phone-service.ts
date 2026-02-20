/**
 * Phone Service - Premium Voice Calls
 * 
 * Integrates with Twilio for actual phone calls via Vercel serverless API.
 * Supports:
 * - Outbound calls: AI calls the user for briefings/check-ins
 * - Inbound calls: User dials a SyncScript number to talk to their AI
 * - Voicemail detection: Leaves a message if user doesn't answer
 * - Call transfers: Hand off to a real person if needed
 * 
 * Architecture:
 * - Frontend sends call request to /api/phone/* serverless endpoints
 * - Backend initiates Twilio call with TwiML conversation loop
 * - Twilio handles speech-to-text, backend runs AI, Twilio speaks response
 * - Continuous conversation loop until user says goodbye
 * 
 * Cost: ~$0.02/min (Twilio $0.014 + AI pipeline $0.005)
 * vs Bland AI: $0.09-0.12/min + $299/month
 */

import type { PhoneCallConfig, PhoneCallStatus, VoiceContextSnapshot } from '../types/voice-engine';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PHONE_API_BASE = import.meta.env.VITE_PHONE_API_URL || '/api/phone';
const PHONE_API_KEY = import.meta.env.VITE_PHONE_API_KEY || '';

export interface PhoneServiceConfig {
  apiUrl?: string;
  apiKey?: string;
}

let serviceConfig: PhoneServiceConfig = {
  apiUrl: PHONE_API_BASE,
  apiKey: PHONE_API_KEY,
};

export function configurePhoneService(config: PhoneServiceConfig): void {
  serviceConfig = { ...serviceConfig, ...config };
}

export function isPhoneServiceConfigured(): boolean {
  return !!(serviceConfig.apiUrl && serviceConfig.apiKey);
}

// ============================================================================
// CALL MANAGEMENT
// ============================================================================

/**
 * Initiate an outbound call to the user's phone
 */
export async function initiateCall(config: PhoneCallConfig): Promise<PhoneCallStatus> {
  if (!isPhoneServiceConfigured()) {
    return {
      callId: '',
      status: 'failed',
    };
  }

  try {
    const response = await fetch(`${serviceConfig.apiUrl}/calls?action=outbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceConfig.apiKey}`,
      },
      body: JSON.stringify({
        phoneNumber: config.phoneNumber,
        callType: config.callType,
        maxDuration: config.maxDuration || 300,
        voiceId: config.voiceId || 'default',
        context: config.context,
        userEmail: config.userEmail,
        userId: config.userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Call initiation failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      callId: data.callId || data.call_sid,
      status: 'ringing',
      startedAt: Date.now(),
    };
  } catch (error) {
    console.error('[PhoneService] Call initiation error:', error);
    return {
      callId: '',
      status: 'failed',
    };
  }
}

/**
 * Get the status of an active call
 */
export async function getCallStatus(callId: string): Promise<PhoneCallStatus> {
  if (!isPhoneServiceConfigured() || !callId) {
    return { callId, status: 'failed' };
  }

  try {
    const response = await fetch(`${serviceConfig.apiUrl}/calls?id=${encodeURIComponent(callId)}`, {
      headers: {
        'Authorization': `Bearer ${serviceConfig.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      callId,
      status: data.status,
      duration: data.duration,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
    };
  } catch {
    return { callId, status: 'failed' };
  }
}

/**
 * End an active call
 */
export async function endCall(callId: string): Promise<void> {
  if (!isPhoneServiceConfigured() || !callId) return;

  try {
    await fetch(`${serviceConfig.apiUrl}/calls?action=end&id=${encodeURIComponent(callId)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceConfig.apiKey}`,
      },
    });
  } catch (error) {
    console.error('[PhoneService] End call error:', error);
  }
}

// ============================================================================
// CALENDAR EVENTS FROM PHONE CALLS
// ============================================================================

/**
 * Fetch any calendar events created during a phone call.
 * The AI can create events when the user says things like "add court at 9 am".
 * Returns events and clears them from the server (one-time retrieval).
 */
export async function fetchPendingCalendarEvents(callId: string): Promise<Array<{
  title: string;
  date: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  createdAt: string;
}>> {
  if (!isPhoneServiceConfigured() || !callId) return [];

  try {
    const response = await fetch(
      `${serviceConfig.apiUrl}/calls?action=pending-events&id=${encodeURIComponent(callId)}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceConfig.apiKey}`,
        },
      },
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.events || [];
  } catch {
    return [];
  }
}

// ============================================================================
// SCHEDULE BRIEFING
// ============================================================================

/**
 * Schedule an AI phone briefing at a specific time
 */
export async function scheduleBriefing(params: {
  phoneNumber: string;
  scheduledTime: Date;
  briefingType: 'morning' | 'evening' | 'custom';
  context?: VoiceContextSnapshot;
}): Promise<{ scheduled: boolean; briefingId?: string }> {
  if (!isPhoneServiceConfigured()) {
    return { scheduled: false };
  }

  try {
    const response = await fetch(`${serviceConfig.apiUrl}/manage?resource=briefing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceConfig.apiKey}`,
      },
      body: JSON.stringify({
        phoneNumber: params.phoneNumber,
        scheduledTime: params.scheduledTime.toISOString(),
        briefingType: params.briefingType,
        context: params.context,
      }),
    });

    if (!response.ok) {
      throw new Error(`Scheduling failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      scheduled: true,
      briefingId: data.briefingId,
    };
  } catch {
    return { scheduled: false };
  }
}

/**
 * Cancel a scheduled briefing
 */
export async function cancelBriefing(briefingId: string): Promise<boolean> {
  if (!isPhoneServiceConfigured() || !briefingId) return false;

  try {
    const response = await fetch(
      `${serviceConfig.apiUrl}/manage?resource=briefing&id=${encodeURIComponent(briefingId)}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceConfig.apiKey}`,
        },
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// PHONE NUMBER MANAGEMENT
// ============================================================================

/**
 * Provision a new phone number for the user (inbound calls)
 */
export async function provisionPhoneNumber(params: {
  areaCode?: string;
  country?: string;
}): Promise<{ number?: string; monthlyRate?: number }> {
  if (!isPhoneServiceConfigured()) {
    return {};
  }

  try {
    const response = await fetch(`${serviceConfig.apiUrl}/manage?resource=number`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceConfig.apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Provisioning failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      number: data.phoneNumber,
      monthlyRate: data.monthlyRate || 1.0,
    };
  } catch {
    return {};
  }
}

// ============================================================================
// VOICEMAIL
// ============================================================================

/**
 * Configure voicemail settings
 */
export async function configureVoicemail(params: {
  enabled: boolean;
  greeting?: string;
  maxDuration?: number;
  transcribeMessages?: boolean;
}): Promise<boolean> {
  if (!isPhoneServiceConfigured()) return false;

  try {
    const response = await fetch(`${serviceConfig.apiUrl}/manage?resource=voicemail`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceConfig.apiKey}`,
      },
      body: JSON.stringify(params),
    });
    return response.ok;
  } catch {
    return false;
  }
}
