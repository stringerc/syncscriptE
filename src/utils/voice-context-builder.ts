/**
 * Voice Context Builder
 * 
 * Gathers SyncScript user data (tasks, calendar, energy, resonance)
 * and formats it into a context prompt for the voice AI.
 * This is what makes SyncScript's voice AI revolutionary --
 * it knows your entire productivity state.
 */

import type {
  VoiceContextSnapshot,
  VoiceContextTask,
  VoiceContextEvent,
  EmotionState,
} from '../types/voice-engine';
import { getCircadianCurve } from './resonance-calculus';

// ============================================================================
// CIRCADIAN PHASE DETECTION
// ============================================================================

type CircadianPhase = VoiceContextSnapshot['circadianPhase'];

function getCircadianPhase(hour: number): CircadianPhase {
  if (hour >= 5 && hour < 8) return 'morning-rise';
  if (hour >= 8 && hour < 12) return 'morning-peak';
  if (hour >= 12 && hour < 14) return 'afternoon-dip';
  if (hour >= 14 && hour < 17) return 'afternoon-recovery';
  if (hour >= 17 && hour < 21) return 'evening-wind-down';
  return 'night';
}

function getCircadianDescription(phase: CircadianPhase): string {
  switch (phase) {
    case 'morning-rise': return 'Your body is warming up. Great time for planning and light tasks.';
    case 'morning-peak': return 'Peak cognitive performance. Ideal for deep work and complex tasks.';
    case 'afternoon-dip': return 'Natural energy dip after lunch. Good for routine tasks or a break.';
    case 'afternoon-recovery': return 'Second wind of the day. Good for creative and collaborative work.';
    case 'evening-wind-down': return 'Energy is declining. Good for wrapping up and reflection.';
    case 'night': return 'Rest and recovery time. Avoid heavy cognitive work.';
  }
}

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

export function buildVoiceContext(params: {
  tasks?: any[];
  events?: any[];
  resonanceScore?: number;
  energyLevel?: number;
  userName?: string;
}): VoiceContextSnapshot {
  const now = new Date();
  const hour = now.getHours();
  const phase = getCircadianPhase(hour);

  // Get circadian performance value
  let circadianPerformance = 0.5;
  try {
    circadianPerformance = getCircadianCurve(hour);
  } catch {
    // Fallback
  }

  // Format tasks for context
  const contextTasks: VoiceContextTask[] = (params.tasks || [])
    .slice(0, 10)
    .map(t => ({
      id: t.id || '',
      title: t.title || 'Untitled',
      priority: t.priority || 'medium',
      energyLevel: t.energyLevel || 'medium',
      dueDate: t.dueDate || t.deadline || undefined,
      status: t.status || 'pending',
    }));

  // Format events for context
  const contextEvents: VoiceContextEvent[] = (params.events || [])
    .slice(0, 8)
    .map(e => ({
      id: e.id || '',
      title: e.title || 'Untitled Event',
      startTime: e.start || e.startTime || '',
      endTime: e.end || e.endTime || '',
      isUpcoming: new Date(e.start || e.startTime || 0).getTime() > now.getTime(),
    }));

  return {
    tasks: contextTasks,
    events: contextEvents,
    resonanceScore: params.resonanceScore ?? Math.round(circadianPerformance * 100),
    energyLevel: params.energyLevel ?? Math.round(circadianPerformance * 100),
    circadianPhase: phase,
    currentTime: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    userName: params.userName,
    recentInsights: [],
  };
}

// ============================================================================
// SYSTEM PROMPT BUILDER
// ============================================================================

export function buildVoiceSystemPrompt(context: VoiceContextSnapshot, emotion?: EmotionState): string {
  const todayTasks = context.tasks.filter(t => t.status !== 'completed');
  const upcomingEvents = context.events.filter(e => e.isUpcoming);
  const completedTasks = context.tasks.filter(t => t.status === 'completed');
  const highPriorityTasks = todayTasks.filter(t => t.priority === 'high' || t.priority === 'critical');

  let emotionGuidance = '';
  if (emotion) {
    switch (emotion.primary) {
      case 'stressed':
        emotionGuidance = `
The user sounds stressed. Use a calm, supportive tone. Keep responses shorter and more reassuring.
Offer to help prioritize or simplify their schedule. Acknowledge their feelings.`;
        break;
      case 'tired':
        emotionGuidance = `
The user sounds tired. Speak gently and be concise. Suggest breaks or moving heavy tasks.
Don't overwhelm them with information.`;
        break;
      case 'excited':
      case 'happy':
        emotionGuidance = `
The user sounds energetic and positive. Match their energy. Be enthusiastic and forward-looking.
This is a great time to tackle ambitious tasks together.`;
        break;
      case 'confused':
        emotionGuidance = `
The user seems uncertain. Be clear and structured. Break things down step by step.
Ask clarifying questions if needed.`;
        break;
      default:
        emotionGuidance = '';
    }
  }

  return `You are the SyncScript Voice Assistant -- a personal AI productivity companion.
You have deep knowledge of the user's tasks, calendar, energy patterns, and goals.
You speak naturally, like a knowledgeable friend who genuinely cares about the user's productivity and wellbeing.

CURRENT STATE:
- Time: ${context.currentTime}
- Circadian Phase: ${context.circadianPhase} -- ${getCircadianDescription(context.circadianPhase)}
- Resonance Score: ${context.resonanceScore}/100 (task-energy alignment)
- Energy Level: ${context.energyLevel}/100
${context.userName ? `- User: ${context.userName}` : ''}

TODAY'S TASKS (${todayTasks.length} pending, ${completedTasks.length} completed):
${todayTasks.length > 0 ? todayTasks.map(t => 
  `  - [${t.priority.toUpperCase()}] ${t.title}${t.dueDate ? ` (due: ${t.dueDate})` : ''} [${t.energyLevel} energy]`
).join('\n') : '  No pending tasks.'}

${highPriorityTasks.length > 0 ? `HIGH PRIORITY ITEMS: ${highPriorityTasks.map(t => t.title).join(', ')}` : ''}

UPCOMING EVENTS:
${upcomingEvents.length > 0 ? upcomingEvents.map(e => 
  `  - ${e.title} (${e.startTime} - ${e.endTime})`
).join('\n') : '  No upcoming events.'}
${emotionGuidance}

VOICE CONVERSATION GUIDELINES:
- Keep responses concise and conversational (2-4 sentences for simple queries)
- Use natural speech patterns -- contractions, filler acknowledgments when appropriate
- Reference specific tasks, events, and data from the user's context
- Proactively surface insights about schedule conflicts, energy mismatches, or opportunities
- If the user asks to create/modify tasks or events, confirm the action before proceeding
- Adapt your energy and tone to match the time of day and user's emotional state
- When discussing scheduling, consider the user's circadian phase and energy level
- Use the resonance score to guide recommendations about task timing`;
}

// ============================================================================
// DEEP CONTEXT ANALYSIS
// ============================================================================

export interface DeepContextInsight {
  type: 'energy-mismatch' | 'schedule-conflict' | 'deep-work-window' | 'break-needed' | 'goal-progress' | 'peak-performance';
  message: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Analyzes the full SyncScript context to generate proactive insights
 * that the voice AI can surface naturally in conversation.
 */
export function generateDeepInsights(context: VoiceContextSnapshot): DeepContextInsight[] {
  const insights: DeepContextInsight[] = [];
  const pendingTasks = context.tasks.filter(t => t.status !== 'completed');
  const upcomingEvents = context.events.filter(e => e.isUpcoming);
  const highEnergyTasks = pendingTasks.filter(t => t.energyLevel === 'high');

  // Energy-phase mismatch detection
  if (context.circadianPhase === 'afternoon-dip' && highEnergyTasks.length > 0) {
    insights.push({
      type: 'energy-mismatch',
      message: `You have ${highEnergyTasks.length} high-energy task${highEnergyTasks.length > 1 ? 's' : ''} but you're in the afternoon dip. Consider saving "${highEnergyTasks[0].title}" for when your energy rebounds.`,
      priority: 'medium',
    });
  }

  // Peak performance window
  if ((context.circadianPhase === 'morning-peak' || context.circadianPhase === 'afternoon-recovery') && highEnergyTasks.length > 0) {
    insights.push({
      type: 'peak-performance',
      message: `Your energy is at its peak right now. This is the ideal time for "${highEnergyTasks[0].title}" -- it requires high energy and you've got it.`,
      priority: 'high',
    });
  }

  // Deep work window (no events for 2+ hours)
  if (upcomingEvents.length === 0 && pendingTasks.length > 0) {
    insights.push({
      type: 'deep-work-window',
      message: `Your calendar is clear -- this is a perfect deep work window. Focus on your most important task without interruption.`,
      priority: 'medium',
    });
  }

  // Break needed (many completed tasks, high load)
  const completedTasks = context.tasks.filter(t => t.status === 'completed');
  if (completedTasks.length >= 3 && context.energyLevel < 50) {
    insights.push({
      type: 'break-needed',
      message: `You've completed ${completedTasks.length} tasks and your energy is at ${context.energyLevel}%. A short break would help you recharge for the rest of your tasks.`,
      priority: 'high',
    });
  }

  // Overdue or urgent tasks
  const urgentTasks = pendingTasks.filter(t => t.priority === 'critical');
  if (urgentTasks.length > 0) {
    insights.push({
      type: 'schedule-conflict',
      message: `You have ${urgentTasks.length} critical task${urgentTasks.length > 1 ? 's' : ''} that need attention: "${urgentTasks.map(t => t.title).join('", "')}".`,
      priority: 'high',
    });
  }

  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Build the deep context section for the AI prompt, including proactive insights.
 */
export function buildDeepContextPrompt(context: VoiceContextSnapshot): string {
  const insights = generateDeepInsights(context);
  
  if (insights.length === 0) return '';

  let prompt = '\nPROACTIVE INSIGHTS (surface these naturally when relevant):\n';
  for (const insight of insights.slice(0, 3)) {
    prompt += `  [${insight.priority.toUpperCase()}] ${insight.message}\n`;
  }
  
  return prompt;
}

// ============================================================================
// RESPONSE FORMATTER
// ============================================================================

export function formatAIResponseForVoice(response: string): string {
  // Clean up markdown, code blocks, etc. for voice output
  let voiceText = response
    .replace(/```[\s\S]*?```/g, 'I have some code to share, which I\'ll display in the chat.')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[-*]\s/g, '')
    .replace(/\d+\.\s/g, '') // Remove numbered list markers
    .trim();

  // Limit length for voice (long responses are bad for voice UX)
  if (voiceText.length > 600) {
    const sentences = voiceText.split(/[.!?]+/).filter(s => s.trim());
    voiceText = sentences.slice(0, 5).join('. ').trim();
    if (!voiceText.endsWith('.') && !voiceText.endsWith('!') && !voiceText.endsWith('?')) {
      voiceText += '.';
    }
  }

  return voiceText;
}

// ============================================================================
// GREETING GENERATOR
// ============================================================================

export function generateGreeting(context: VoiceContextSnapshot): string {
  const { circadianPhase, resonanceScore, tasks, events, userName } = context;
  const name = userName ? `, ${userName}` : '';
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const upcomingEvents = events.filter(e => e.isUpcoming);
  const highPriority = pendingTasks.filter(t => t.priority === 'high' || t.priority === 'critical');

  switch (circadianPhase) {
    case 'morning-rise':
    case 'morning-peak': {
      if (pendingTasks.length === 0) {
        return `Good morning${name}! Your slate is clear today. Want to plan something or just enjoy the calm?`;
      }
      if (highPriority.length > 0) {
        return `Good morning${name}! You've got ${pendingTasks.length} tasks today, and ${highPriority.length} ${highPriority.length === 1 ? 'is' : 'are'} high priority. Your energy is ${resonanceScore > 70 ? 'great' : 'building up'} right now -- want to dive into ${highPriority[0].title}?`;
      }
      return `Good morning${name}! ${pendingTasks.length} tasks on your plate today. Your resonance score is ${resonanceScore} -- ${resonanceScore > 70 ? 'you\'re in great shape' : 'steady and building'}. What would you like to tackle first?`;
    }
    case 'afternoon-dip':
      return `Hey${name}. It's the afternoon dip -- your body naturally slows down around now. You've got ${pendingTasks.length} tasks remaining. Maybe a lighter task or a quick break would be good? What do you think?`;
    case 'afternoon-recovery':
      return `Hey${name}! Second wind time. You've still got ${pendingTasks.length} tasks${upcomingEvents.length > 0 ? ` and ${upcomingEvents.length} upcoming event${upcomingEvents.length === 1 ? '' : 's'}` : ''}. Your energy is recovering -- good time for creative work. How can I help?`;
    case 'evening-wind-down':
      return `Good evening${name}. Winding down for the day -- you've got ${pendingTasks.length} tasks left. Want to review what you accomplished or plan for tomorrow?`;
    case 'night':
      return `Hey${name}, it's getting late. ${pendingTasks.length > 0 ? `You still have ${pendingTasks.length} tasks, but they can wait until tomorrow.` : 'Your tasks are all caught up.'} Anything on your mind before you call it a night?`;
  }
}
