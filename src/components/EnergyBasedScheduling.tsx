/**
 * Energy-Based Scheduling Suggestions
 * 
 * PHASE 4: Time Optimization Features
 * Suggests optimal scheduling times based on task type and energy levels
 * Deep work during peak hours, meetings during medium, admin during low
 */

import { Zap, Brain, Users, FileText, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface SchedulingSuggestion {
  taskType: 'deep-work' | 'meeting' | 'admin' | 'creative';
  suggestedTime: string;
  energyLevel: 'peak' | 'high' | 'medium' | 'low';
  reasoning: string;
}

interface EnergyBasedSchedulingProps {
  taskType?: 'deep-work' | 'meeting' | 'admin' | 'creative';
  onSelectTime?: (time: string) => void;
}

export function EnergyBasedScheduling({ taskType, onSelectTime }: EnergyBasedSchedulingProps) {
  const suggestions = getSchedulingSuggestions(taskType);

  const taskTypeConfig = {
    'deep-work': {
      icon: Brain,
      label: 'Deep Work',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    meeting: {
      icon: Users,
      label: 'Meeting',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    admin: {
      icon: FileText,
      label: 'Admin',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
    },
    creative: {
      icon: Zap,
      label: 'Creative',
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/20',
    },
  };

  const energyConfig = {
    peak: { color: 'text-green-400', label: 'Peak Energy', icon: '⚡⚡⚡' },
    high: { color: 'text-teal-400', label: 'High Energy', icon: '⚡⚡' },
    medium: { color: 'text-yellow-400', label: 'Medium Energy', icon: '⚡' },
    low: { color: 'text-orange-400', label: 'Low Energy', icon: '💤' },
  };

  if (!taskType || suggestions.length === 0) {
    return (
      <div className="bg-[#1e2128] border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-400 mb-3">
          <TrendingUp className="w-5 h-5" />
          <span className="font-medium">Energy-Based Scheduling</span>
        </div>
        <p className="text-sm text-gray-500">
          Select a task type to see optimal scheduling suggestions based on your energy levels
        </p>
      </div>
    );
  }

  const config = taskTypeConfig[taskType];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1e2128] border border-gray-800 rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <span className="font-medium text-gray-300">{config.label} - Best Times</span>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const energyInfo = energyConfig[suggestion.energyLevel];
          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectTime?.(suggestion.suggestedTime)}
              className={`w-full text-left ${config.bgColor} border border-gray-700 rounded-lg p-3 hover:border-teal-500/50 transition-colors group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-300">{suggestion.suggestedTime}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{energyInfo.icon}</span>
                  <span className={`text-xs ${energyInfo.color}`}>{energyInfo.label}</span>
                </div>
              </div>
              <p className="text-sm text-gray-400">{suggestion.reasoning}</p>
              <div className="mt-2 text-xs text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to schedule at this time →
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          💡 Tip: Schedule demanding tasks during peak energy hours for better focus and productivity
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Generate scheduling suggestions based on task type
 */
function getSchedulingSuggestions(taskType?: string): SchedulingSuggestion[] {
  if (!taskType) return [];

  const suggestions: Record<string, SchedulingSuggestion[]> = {
    'deep-work': [
      {
        taskType: 'deep-work',
        suggestedTime: '9:00 AM - 11:00 AM',
        energyLevel: 'peak',
        reasoning: 'Peak morning energy - ideal for complex problem-solving and focused work',
      },
      {
        taskType: 'deep-work',
        suggestedTime: '3:00 PM - 5:00 PM',
        energyLevel: 'high',
        reasoning: 'Afternoon recovery period - good for sustained concentration',
      },
    ],
    meeting: [
      {
        taskType: 'meeting',
        suggestedTime: '11:00 AM - 12:00 PM',
        energyLevel: 'high',
        reasoning: 'High energy, before lunch - good for collaborative discussions',
      },
      {
        taskType: 'meeting',
        suggestedTime: '2:00 PM - 3:00 PM',
        energyLevel: 'medium',
        reasoning: 'Post-lunch recovery - suitable for routine meetings',
      },
      {
        taskType: 'meeting',
        suggestedTime: '4:00 PM - 5:00 PM',
        energyLevel: 'medium',
        reasoning: 'Late afternoon - good for status updates and planning',
      },
    ],
    admin: [
      {
        taskType: 'admin',
        suggestedTime: '12:00 PM - 1:00 PM',
        energyLevel: 'medium',
        reasoning: 'Pre-lunch or lunch time - suitable for routine administrative tasks',
      },
      {
        taskType: 'admin',
        suggestedTime: '5:00 PM - 6:00 PM',
        energyLevel: 'low',
        reasoning: 'End of day - perfect for email cleanup and administrative wrap-up',
      },
    ],
    creative: [
      {
        taskType: 'creative',
        suggestedTime: '9:00 AM - 10:00 AM',
        energyLevel: 'peak',
        reasoning: 'Fresh morning mind - excellent for brainstorming and ideation',
      },
      {
        taskType: 'creative',
        suggestedTime: '7:00 AM - 8:00 AM',
        energyLevel: 'medium',
        reasoning: 'Early morning calm - great for creative thinking without interruptions',
      },
      {
        taskType: 'creative',
        suggestedTime: '3:00 PM - 4:00 PM',
        energyLevel: 'high',
        reasoning: 'Afternoon peak - good energy for creative problem-solving',
      },
    ],
  };

  return suggestions[taskType] || [];
}
