/**
 * Phone Call Panel - Premium Feature
 *
 * Briefing persistence: saves to localStorage (instant UI) + Supabase KV (cron pickup).
 * The Vercel cron at /api/phone/scheduled-briefing reads KV every minute and fires calls.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Phone, PhoneCall, PhoneOff, Clock,
  Bell, BellOff, Shield, Sparkles, X, Check,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  initiateCall,
  getCallStatus,
  endCall,
  scheduleBriefing,
  fetchPendingCalendarEvents,
  isPhoneServiceConfigured,
} from '../utils/phone-service';
import type { PhoneCallStatus, VoiceContextSnapshot } from '../types/voice-engine';
import { useAuth } from '../contexts/AuthContext';

const LS_PHONE_KEY = 'syncscript_phone_number';
const LS_MORNING_KEY = 'syncscript_morning_briefing';
const LS_EVENING_KEY = 'syncscript_evening_briefing';

// ─── Supabase KV persistence (for cron pickup) ─────────────────────────────

async function saveBriefingToKV(
  userId: string,
  phone: string,
  type: 'morning' | 'evening',
  enabled: boolean,
) {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

  const time = type === 'morning' ? '08:00' : '18:00';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';

  try {
    await fetch(`${SUPABASE_URL}/functions/v1/make-server-57781ad9/kv/set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        key: `briefing_schedule:${userId}:${type}`,
        value: JSON.stringify({
          time,
          timezone: tz,
          days: ['mon', 'tue', 'wed', 'thu', 'fri'],
          enabled,
          phoneNumber: phone,
          userId,
          type,
        }),
      }),
    });
  } catch (err) {
    console.warn('[PhoneCallPanel] KV save failed:', err);
  }
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface PhoneCallPanelProps {
  voiceContext?: VoiceContextSnapshot;
  userEmail?: string;
  userId?: string;
  onClose?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PhoneCallPanel({ voiceContext, userEmail, userId: propUserId, onClose }: PhoneCallPanelProps) {
  const { user } = useAuth();
  const userId = propUserId || user?.id;

  // Load persisted state from localStorage
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem(LS_PHONE_KEY) || '');
  const [morningBriefing, setMorningBriefing] = useState(() => localStorage.getItem(LS_MORNING_KEY) === 'true');
  const [eveningBriefing, setEveningBriefing] = useState(() => localStorage.getItem(LS_EVENING_KEY) === 'true');

  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<PhoneCallStatus | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isConfigured = isPhoneServiceConfigured();

  // Persist phone number on change
  useEffect(() => {
    if (phoneNumber) localStorage.setItem(LS_PHONE_KEY, phoneNumber);
  }, [phoneNumber]);

  // ── Call Management ─────────────────────────────────────────────────────

  const handleCallMe = useCallback(async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    if (!isConfigured) {
      toast.error('Phone service not configured', {
        description: 'Add VITE_PHONE_API_URL and VITE_PHONE_API_KEY to your environment'
      });
      return;
    }

    setIsCallActive(true);
    const status = await initiateCall({
      phoneNumber: phoneNumber.trim(),
      callType: 'outbound-briefing',
      context: voiceContext,
      userEmail,
      userId,
    });

    setCallStatus(status);

    if (status.status === 'failed') {
      setIsCallActive(false);
      toast.error('Failed to initiate call');
      return;
    }

    toast.success('Calling you now...', { description: `Dialing ${phoneNumber}` });

    const syncCalendarEvents = async (callSid: string) => {
      const pendingEvents = await fetchPendingCalendarEvents(callSid);
      if (pendingEvents.length > 0) {
        pendingEvents.forEach(evt => {
          const startTime = new Date(`${evt.date}T00:00:00`);
          startTime.setHours(evt.startHour, evt.startMinute, 0, 0);
          const endTime = new Date(`${evt.date}T00:00:00`);
          endTime.setHours(evt.endHour, evt.endMinute, 0, 0);
          window.dispatchEvent(new CustomEvent('phone-calendar-event', {
            detail: { title: evt.title, startTime, endTime },
          }));
        });
        toast.success(
          `Added ${pendingEvents.length} event${pendingEvents.length > 1 ? 's' : ''} to your calendar`,
          { description: pendingEvents.map(e => e.title).join(', ') }
        );
      }
    };

    let eventPollCount = 0;

    pollIntervalRef.current = setInterval(async () => {
      if (status.callId) {
        const updated = await getCallStatus(status.callId);
        setCallStatus(updated);

        if (updated.status === 'connected' || updated.status === 'in-progress') {
          if (!durationIntervalRef.current) {
            durationIntervalRef.current = setInterval(() => {
              setCallDuration(prev => prev + 1);
            }, 1000);
          }
          eventPollCount++;
          if (eventPollCount % 5 === 0) syncCalendarEvents(status.callId);
        }

        if (updated.status === 'ended' || updated.status === 'failed' || updated.status === 'completed') {
          setIsCallActive(false);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
          toast.info('Call ended', { description: `Duration: ${formatDuration(callDuration)}` });
          syncCalendarEvents(status.callId);
        }
      }
    }, 2000);
  }, [phoneNumber, voiceContext, isConfigured, callDuration, userEmail, userId]);

  const handleEndCall = useCallback(async () => {
    if (callStatus?.callId) await endCall(callStatus.callId);
    setIsCallActive(false);
    setCallDuration(0);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
  }, [callStatus]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, []);

  // ── Briefing Scheduling ─────────────────────────────────────────────────

  const toggleBriefing = useCallback(async (type: 'morning' | 'evening') => {
    const current = type === 'morning' ? morningBriefing : eveningBriefing;
    const next = !current;

    if (next && !phoneNumber.trim()) {
      toast.error('Please enter a phone number first');
      return;
    }

    // Update UI immediately
    if (type === 'morning') {
      setMorningBriefing(next);
      localStorage.setItem(LS_MORNING_KEY, String(next));
    } else {
      setEveningBriefing(next);
      localStorage.setItem(LS_EVENING_KEY, String(next));
    }

    // Persist to Supabase KV so the cron job picks it up
    if (userId) {
      saveBriefingToKV(userId, phoneNumber.trim(), type, next);
    }

    // Also call the legacy API for immediate one-off scheduling
    if (next) {
      const scheduledTime = new Date();
      if (type === 'morning') {
        scheduledTime.setHours(8, 0, 0, 0);
        if (scheduledTime.getTime() < Date.now()) scheduledTime.setDate(scheduledTime.getDate() + 1);
      } else {
        scheduledTime.setHours(18, 0, 0, 0);
        if (scheduledTime.getTime() < Date.now()) scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      scheduleBriefing({
        phoneNumber: phoneNumber.trim(),
        scheduledTime,
        briefingType: type,
        context: voiceContext,
      });

      toast.success(`${type === 'morning' ? 'Morning' : 'Evening'} briefing enabled`, {
        description: `Will call daily at ${type === 'morning' ? '8:00 AM' : '6:00 PM'}`,
      });
    } else {
      toast.info(`${type === 'morning' ? 'Morning' : 'Evening'} briefing disabled`);
    }
  }, [phoneNumber, voiceContext, userId, morningBriefing, eveningBriefing]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Phone Calls</h3>
            <span className="text-[10px] text-slate-400">Premium Feature</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 px-1.5">
            ~$0.02/min
          </Badge>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={onClose} aria-label="Close phone panel">
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Not Configured Notice */}
        {!isConfigured && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-amber-300 font-medium">Phone service setup required</p>
                <p className="text-[10px] text-amber-400/70 mt-1">
                  To enable phone calls, configure Twilio credentials in your environment variables.
                  This requires a Twilio account (~$1/month for a phone number + $0.014/min per call).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phone Number Input */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Your Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            disabled={isCallActive}
          />
        </div>

        {/* Call Me Now Button */}
        {!isCallActive ? (
          <Button
            onClick={handleCallMe}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl gap-2 py-5"
            disabled={!phoneNumber.trim()}
          >
            <PhoneCall className="w-5 h-5" />
            Call Me Now
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-3 h-3 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div>
                  <span className="text-sm text-green-300 capitalize">{callStatus?.status || 'connecting'}</span>
                  {callDuration > 0 && (
                    <span className="text-xs text-green-400/60 ml-2 font-mono">{formatDuration(callDuration)}</span>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={handleEndCall}
              className="w-full bg-red-600/80 hover:bg-red-500 text-white rounded-xl gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </Button>
          </div>
        )}

        {/* Scheduled Briefings */}
        <div className="border-t border-white/5 pt-3">
          <h4 className="text-xs font-medium text-slate-300 mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Scheduled Briefings
          </h4>

          <div className="space-y-2">
            {/* Morning Briefing */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🌅</span>
                <div>
                  <p className="text-xs text-white">Morning Briefing</p>
                  <p className="text-[10px] text-slate-400">Daily schedule + priorities at 8:00 AM</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs ${morningBriefing ? 'text-green-400' : 'text-slate-400'}`}
                onClick={() => toggleBriefing('morning')}
              >
                {morningBriefing ? <Check className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
              </Button>
            </div>

            {/* Evening Recap */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🌙</span>
                <div>
                  <p className="text-xs text-white">Evening Recap</p>
                  <p className="text-[10px] text-slate-400">Day summary + tomorrow prep at 6:00 PM</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs ${eveningBriefing ? 'text-green-400' : 'text-slate-400'}`}
                onClick={() => toggleBriefing('evening')}
              >
                {eveningBriefing ? <Check className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
              </Button>
            </div>

            {/* Persistence indicator */}
            {(morningBriefing || eveningBriefing) && (
              <p className="text-[10px] text-emerald-400/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Saved — will call automatically even if you close this page
              </p>
            )}
          </div>
        </div>

        {/* Info footer */}
        <div className="text-[10px] text-slate-500 text-center pt-1">
          Powered by Twilio SIP + SyncScript Voice Engine
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default PhoneCallPanel;
