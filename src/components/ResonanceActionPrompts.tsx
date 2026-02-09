import { motion } from 'motion/react';
import { ArrowRight, Clock, Zap, AlertCircle, TrendingUp, X } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

interface ActionPrompt {
  type: 'move' | 'pair' | 'split' | 'hold';
  message: string;
  reason: string;
  boost: number;
  action: () => void;
}

interface ResonanceActionPromptProps {
  prompt: ActionPrompt;
  onDismiss?: () => void;
}

export function ResonanceActionPrompt({ prompt, onDismiss }: ResonanceActionPromptProps) {
  const getIcon = () => {
    switch (prompt.type) {
      case 'move': return Clock;
      case 'pair': return TrendingUp;
      case 'split': return AlertCircle;
      case 'hold': return Zap;
    }
  };

  const getColor = () => {
    if (prompt.boost > 0.3) return 'from-green-600 to-emerald-600';
    if (prompt.boost > 0) return 'from-teal-600 to-cyan-600';
    if (prompt.boost > -0.3) return 'from-amber-600 to-orange-600';
    return 'from-rose-600 to-red-600';
  };

  const Icon = getIcon();

  return (
    <motion.div
      className={`bg-gradient-to-r ${getColor()} p-[1px] rounded-xl`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-[#1a1c20] rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className={`mt-1 p-2 bg-gradient-to-br ${getColor()} rounded-lg`}>
            <Icon className="w-4 h-4 text-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-white text-sm font-medium">{prompt.message}</h4>
              {prompt.boost !== 0 && (
                <span className={`text-xs font-mono ${prompt.boost > 0 ? 'text-green-400' : 'text-rose-400'}`}>
                  {prompt.boost > 0 ? '+' : ''}{prompt.boost.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs mb-3">{prompt.reason}</p>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  prompt.action();
                  toast.success('Task optimized!', { description: prompt.reason });
                  onDismiss?.();
                }}
                className="text-xs h-7 bg-gradient-to-r from-teal-600 to-blue-600"
              >
                Apply
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="text-xs h-7"
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Example prompts generator
export function generateActionPrompts(taskId: string): ActionPrompt[] {
  return [
    {
      type: 'move',
      message: 'Shift to a stronger window',
      reason: 'Move 45 min later for +0.18 boost: better timing, lower drag',
      boost: 0.18,
      action: () => console.log('Moving task', taskId)
    },
    {
      type: 'pair',
      message: 'Pair with "Deep Work" for a lift',
      reason: 'Stack after Deep Work for +0.12; these two reinforce',
      boost: 0.12,
      action: () => console.log('Pairing task', taskId)
    },
    {
      type: 'split',
      message: 'Unstack—these two clash',
      reason: 'Separated from Email Block (−0.20 conflict)',
      boost: -0.20,
      action: () => console.log('Splitting task', taskId)
    },
    {
      type: 'hold',
      message: 'Hold—timing is weak',
      reason: 'Try in 90 minutes when phase aligns better',
      boost: 0,
      action: () => console.log('Holding task', taskId)
    }
  ];
}

// Compact notification version
interface CompactPromptProps {
  message: string;
  boost: number;
  onApply: () => void;
}

export function CompactResonancePrompt({ message, boost, onApply }: CompactPromptProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg border border-teal-600/30">
      <Zap className="w-4 h-4 text-teal-400" />
      <p className="text-xs text-gray-300 flex-1">{message}</p>
      {boost > 0 && (
        <span className="text-xs font-mono text-green-400">+{boost.toFixed(2)}</span>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={onApply}
        className="h-6 px-2 text-xs text-teal-400 hover:text-teal-300"
      >
        Try
      </Button>
    </div>
  );
}

// Status badges for tasks
export function ResonanceStatusBadge({ status }: { status: 'in-tune' | 'off-beat' | 'heavy' | 'good-pair' | 'clash' }) {
  const config = {
    'in-tune': { label: '🎵 In Tune', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    'off-beat': { label: '⚠️ Off-Beat', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    'heavy': { label: '⚡ Heavy', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    'good-pair': { label: '✨ Good Pair', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
    'clash': { label: '❌ Clash', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
  };

  const { label, color } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
}
