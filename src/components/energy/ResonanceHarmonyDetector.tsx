/**
 * ResonanceHarmonyDetector Component
 * 
 * PRIORITY 2: Resonance Harmony Detection UI
 * 
 * Detects and displays when user's tasks/events align particularly well.
 * Shows patterns in high-resonance activities and suggests optimal timing.
 */

import { Waves, Sparkles, TrendingUp, Calendar, Clock, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';
import { useResonanceEnergyMultiplier } from '../../hooks/useResonanceEnergyMultiplier';

interface ResonanceHarmonyDetectorProps {
  className?: string;
}

export function ResonanceHarmonyDetector({ className }: ResonanceHarmonyDetectorProps) {
  const resonance = useResonanceEnergyMultiplier();

  // Safety check
  if (!resonance) {
    return null;
  }

  // Check if we have a harmony streak (using inHarmony from the actual hook)
  const hasHarmony = resonance.inHarmony;
  const isOnFire = resonance.status === 'flow';

  if (!hasHarmony) {
    return null; // Only show when there's harmony to celebrate
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20',
        'border-2 border-purple-500/40 rounded-xl p-4',
        'relative overflow-hidden',
        className
      )}
    >
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'linear',
        }}
      />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
              animate={isOnFire ? {
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              } : {}}
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
            >
              <Waves className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-white font-bold flex items-center gap-2">
                {isOnFire ? '🔥 Perfect Harmony!' : '✨ In Harmony'}
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </h3>
              <p className="text-sm text-purple-300">
                {resonance.streakDays > 0 ? `${resonance.streakDays}-day harmony streak` : 'Strong resonance detected'}
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className="bg-purple-500/20 text-purple-300 border-purple-500/30"
          >
            {(resonance.avgResonance * 100).toFixed(0)}% avg
          </Badge>
        </div>

        {/* Streak Visualization */}
        {resonance.streakDays > 0 && (
          <div className="flex gap-1">
            {[...Array(Math.min(resonance.streakDays, 10))].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="h-2 flex-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
              />
            ))}
            {resonance.streakDays > 10 && (
              <span className="text-xs text-purple-300 ml-2">+{resonance.streakDays - 10}</span>
            )}
          </div>
        )}

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-purple-300">Energy Multiplier</span>
            </div>
            <p className="text-lg font-bold text-white">
              {resonance.multiplier.toFixed(1)}x
            </p>
            <p className="text-xs text-gray-400">current bonus</p>
          </div>

          <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-pink-400" />
              <span className="text-xs text-pink-300">Streak Bonus</span>
            </div>
            <p className="text-lg font-bold text-white">+{resonance.streakBonus}</p>
            <p className="text-xs text-gray-400">energy points</p>
          </div>
        </div>

        {/* Harmony Message */}
        {resonance.harmonyMessage && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-300 font-medium mb-1">
                  Harmony Insight
                </p>
                <p className="text-sm text-gray-300">
                  {resonance.harmonyMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Insight */}
        {resonance.getResonanceInsight && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-purple-300 font-medium mb-1">
                  AI Recommendation
                </p>
                <p className="text-sm text-gray-300">
                  {resonance.getResonanceInsight()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Encouragement */}
        {isOnFire && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-orange-300">You're on fire!</p>
                <p className="text-xs text-gray-300">
                  Keep this momentum going to maximize your energy gains!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}