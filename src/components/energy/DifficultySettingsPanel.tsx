/**
 * DifficultySettingsPanel Component
 * 
 * PRIORITY 2: Difficulty Settings UI
 * 
 * Allows users to control adaptive difficulty settings.
 * Shows current difficulty tier and allows manual override.
 */

import { useState } from 'react';
import { Settings, TrendingUp, Target, Zap, Brain, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { cn } from '../ui/utils';
import { useAdaptiveDifficulty, DifficultyTier } from '../../hooks/useAdaptiveDifficulty';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface DifficultySettingsPanelProps {
  className?: string;
}

const TIER_INFO: Record<string, {
  name: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  easy: {
    name: 'Easy',
    description: 'Building foundations. Lower targets, more encouragement.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    icon: '🌱',
  },
  normal: {
    name: 'Normal',
    description: 'Finding your rhythm. Balanced targets.',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
    icon: '🌿',
  },
  hard: {
    name: 'Hard',
    description: 'Pushing forward. Higher targets, more challenge.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    icon: '🌳',
  },
  expert: {
    name: 'Expert',
    description: 'Peak performance. Maximum challenge and rewards.',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    icon: '🔥',
  },
};

export function DifficultySettingsPanel({ className }: DifficultySettingsPanelProps) {
  const difficulty = useAdaptiveDifficulty();
  const [isExpanded, setIsExpanded] = useState(false);

  // Safety check
  if (!difficulty || !difficulty.tier) {
    return null;
  }

  const tierInfo = TIER_INFO[difficulty.currentTier] || TIER_INFO.normal;

  // Calculate progress to next tier (based on performance)
  const performanceScore = difficulty.performance?.avgLevel || 0;
  const progressToNextTier = Math.min((performanceScore / 4) * 100, 100);

  return (
    <div className={cn('bg-gray-900/40 border border-gray-700/50 rounded-xl overflow-hidden', className)}>
      {/* Compact Header (always visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', tierInfo.bgColor)}>
            <span className="text-xl">{tierInfo.icon}</span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h4 className="text-white font-semibold">Adaptive Difficulty</h4>
              <Badge variant="outline" className={tierInfo.bgColor}>
                {tierInfo.name}
              </Badge>
            </div>
            <p className="text-sm text-gray-400">{tierInfo.description}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-700/50"
          >
            <div className="p-4 space-y-4">
              {/* Performance Metrics */}
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Your Performance
                </h5>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Performance Level */}
                  <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Performance Level</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                            <p className="text-xs">
                              Average color level reached over the last 7 days.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xl font-bold text-white">{performanceScore.toFixed(1)}</p>
                    <p className="text-xs text-gray-400 capitalize">{difficulty.performance?.performanceRating || 'good'}</p>
                  </div>

                  {/* Days Evaluated */}
                  <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Days Tracked</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                            <p className="text-xs">
                              Number of days with recorded activity.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xl font-bold text-white">{difficulty.performance?.daysEvaluated || 0}</p>
                    <p className="text-xs text-gray-400">of last 7 days</p>
                  </div>

                  {/* Current Tier Multiplier */}
                  <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Energy Multiplier</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                            <p className="text-xs">
                              Your difficulty tier affects energy thresholds.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xl font-bold text-white">{difficulty.tier.multiplier.toFixed(1)}x</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Target className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-gray-400">{difficulty.tier.name}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Status</span>
                    </div>
                    <p className="text-lg font-bold text-white capitalize">
                      {difficulty.performance?.performanceRating === 'excellent' && '🌟 Excellent'}
                      {difficulty.performance?.performanceRating === 'good' && '✨ Good'}
                      {difficulty.performance?.performanceRating === 'fair' && '👍 Fair'}
                      {difficulty.performance?.performanceRating === 'needs-improvement' && '📈 Growing'}
                    </p>
                    <p className="text-xs text-gray-400">Keep it up!</p>
                  </div>
                </div>
              </div>

              {/* Performance Rating Message */}
              <div className={cn('rounded-lg p-3 border', tierInfo.bgColor)}>
                <div className="flex items-start gap-2">
                  <Brain className={cn('w-4 h-4 mt-0.5 flex-shrink-0', tierInfo.color)} />
                  <div className="flex-1">
                    <p className={cn('text-sm font-medium mb-1', tierInfo.color)}>
                      Adaptive AI Insight
                    </p>
                    <p className="text-sm text-gray-300">
                      {difficulty.tier.description}. Your performance is being tracked to ensure the perfect challenge level.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tier Progression */}
              {difficulty.currentTier !== 'expert' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Progress to Next Tier</span>
                    <span className="text-white font-medium">{progressToNextTier.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressToNextTier} className="h-2" />
                  <p className="text-xs text-gray-500">
                    Keep completing tasks consistently to level up!
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-300">
                    Difficulty automatically adjusts based on your performance. Higher tiers unlock bonus energy multipliers and achievements.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}