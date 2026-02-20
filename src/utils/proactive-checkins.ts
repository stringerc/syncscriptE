/**
 * Proactive Voice Check-In System
 * 
 * Monitors the user's context (calendar, tasks, energy, time) and generates
 * proactive check-in triggers. When a trigger fires, the voice engine can
 * initiate a conversation with the user via browser notification + voice.
 * 
 * Check-in types:
 * - Morning briefing: Summary of the day ahead
 * - Energy low: Suggests break when energy drops below threshold
 * - Meeting prep: Reminds before upcoming meetings
 * - Break reminder: After extended work periods
 * - Evening recap: Summarize accomplishments and plan tomorrow
 * - Schedule change: Alert when calendar changes detected
 * - Goal update: Weekly progress check on goals
 */

import type { ProactiveCheckIn, VoiceContextSnapshot } from '../types/voice-engine';

// ============================================================================
// CHECK-IN GENERATORS
// ============================================================================

function generateMorningBriefing(context: VoiceContextSnapshot): ProactiveCheckIn | null {
  const hour = new Date().getHours();
  if (hour < 6 || hour > 10) return null;

  const pendingTasks = context.tasks.filter(t => t.status !== 'completed');
  const upcomingEvents = context.events.filter(e => e.isUpcoming);
  const highPriority = pendingTasks.filter(t => t.priority === 'high' || t.priority === 'critical');

  return {
    id: `checkin-morning-${Date.now()}`,
    type: 'morning-briefing',
    message: `Good morning! You have ${pendingTasks.length} tasks and ${upcomingEvents.length} events today. ${
      highPriority.length > 0 
        ? `${highPriority.length} high-priority item${highPriority.length > 1 ? 's' : ''} need${highPriority.length === 1 ? 's' : ''} attention.`
        : 'No urgent items -- great day for deep work.'
    } Your energy is at ${context.energyLevel}%. Want a rundown?`,
    priority: highPriority.length > 0 ? 'high' : 'medium',
    triggerCondition: 'morning-hours',
  };
}

function generateEnergyLowAlert(context: VoiceContextSnapshot): ProactiveCheckIn | null {
  if (context.energyLevel > 40) return null;

  return {
    id: `checkin-energy-${Date.now()}`,
    type: 'energy-low',
    message: `Your energy has dropped to ${context.energyLevel}%. You've been working hard. A 10-minute break could boost your productivity by up to 30%. Want me to reschedule your next task?`,
    priority: 'high',
    triggerCondition: `energy-below-40: ${context.energyLevel}%`,
  };
}

function generateMeetingPrep(context: VoiceContextSnapshot): ProactiveCheckIn | null {
  const now = Date.now();
  const upcomingEvents = context.events.filter(e => {
    const startTime = new Date(e.startTime).getTime();
    const minutesUntil = (startTime - now) / (1000 * 60);
    return minutesUntil > 5 && minutesUntil <= 15;
  });

  if (upcomingEvents.length === 0) return null;
  const nextEvent = upcomingEvents[0];

  return {
    id: `checkin-meeting-${Date.now()}`,
    type: 'meeting-prep',
    message: `Heads up -- "${nextEvent.title}" starts in about 15 minutes. Want me to pull up relevant tasks or notes for this meeting?`,
    priority: 'medium',
    triggerCondition: `event-in-15min: ${nextEvent.title}`,
  };
}

function generateBreakReminder(context: VoiceContextSnapshot): ProactiveCheckIn | null {
  const completedTasks = context.tasks.filter(t => t.status === 'completed');
  if (completedTasks.length < 4) return null;
  if (context.energyLevel > 60) return null;

  return {
    id: `checkin-break-${Date.now()}`,
    type: 'break-reminder',
    message: `You've completed ${completedTasks.length} tasks today -- impressive! But your energy is at ${context.energyLevel}%. Research shows a short break now could prevent burnout and actually speed up your remaining work.`,
    priority: 'medium',
    triggerCondition: `high-completion-low-energy`,
  };
}

function generateEveningRecap(context: VoiceContextSnapshot): ProactiveCheckIn | null {
  const hour = new Date().getHours();
  if (hour < 17 || hour > 21) return null;

  const completedTasks = context.tasks.filter(t => t.status === 'completed');
  const pendingTasks = context.tasks.filter(t => t.status !== 'completed');

  return {
    id: `checkin-evening-${Date.now()}`,
    type: 'evening-recap',
    message: `Wrapping up the day! You completed ${completedTasks.length} task${completedTasks.length !== 1 ? 's' : ''}${
      pendingTasks.length > 0 ? ` with ${pendingTasks.length} rolling over to tomorrow` : ''
    }. Your resonance score was ${context.resonanceScore}%. Want to plan tomorrow?`,
    priority: 'low',
    triggerCondition: 'evening-hours',
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Evaluate all check-in triggers against the current context.
 * Returns check-ins sorted by priority.
 */
export function evaluateCheckIns(context: VoiceContextSnapshot): ProactiveCheckIn[] {
  const checkIns: ProactiveCheckIn[] = [];

  const generators = [
    generateMorningBriefing,
    generateEnergyLowAlert,
    generateMeetingPrep,
    generateBreakReminder,
    generateEveningRecap,
  ];

  for (const generator of generators) {
    const checkIn = generator(context);
    if (checkIn) {
      checkIns.push(checkIn);
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return checkIns.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Check if a notification should be shown (respects cooldown to avoid spam)
 */
const lastNotifiedMap = new Map<string, number>();
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

export function shouldNotify(checkIn: ProactiveCheckIn): boolean {
  const lastNotified = lastNotifiedMap.get(checkIn.type) || 0;
  if (Date.now() - lastNotified < COOLDOWN_MS) {
    return false;
  }
  return true;
}

export function markNotified(checkIn: ProactiveCheckIn): void {
  lastNotifiedMap.set(checkIn.type, Date.now());
}

/**
 * Request browser notification permission (needed for proactive check-ins)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Show a browser notification for a proactive check-in
 */
export function showCheckInNotification(checkIn: ProactiveCheckIn): void {
  if (Notification.permission !== 'granted') return;

  const iconMap: Record<ProactiveCheckIn['type'], string> = {
    'morning-briefing': '🌅',
    'energy-low': '🔋',
    'meeting-prep': '📅',
    'break-reminder': '☕',
    'evening-recap': '🌙',
    'goal-update': '🎯',
    'schedule-change': '🔄',
  };

  new Notification(`SyncScript Voice ${iconMap[checkIn.type] || '🔔'}`, {
    body: checkIn.message,
    icon: '/favicon.ico',
    tag: checkIn.id,
    requireInteraction: checkIn.priority === 'high',
  });
}
