/**
 * EnergyPredictionCard Component
 * 
 * PRIORITY 2: Prediction Display
 * 
 * Shows ML-based energy predictions prominently on the Energy page.
 * Displays today's forecast, completion likelihood, and smart recommendations.
 */

import { TrendingUp, Brain, Target, AlertCircle, Sparkles, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { cn } from '../ui/utils';
import { useEnergyPrediction } from '../../hooks/useEnergyPrediction';
import { useEnergy } from '../../contexts/EnergyContext';
import { COLOR_LEVELS } from '../../utils/energy-system';

interface EnergyPredictionCardProps {
  className?: string;
}

export function EnergyPredictionCard({ className }: EnergyPredictionCardProps) {
  const { energy } = useEnergy();
  const prediction = useEnergyPrediction('Green'); // Use hook with default goal color

  // Safety check - if prediction is undefined, don't render
  if (!prediction) {
    return null;
  }

  // Calculate completion likelihood
  const currentProgress = (energy.totalEnergy / prediction.predictedEnergy) * 100;
  const isOnTrack = prediction.onTrackForGoal;

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  // Get confidence badge
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return { text: 'High Confidence', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (confidence >= 0.6) return { text: 'Medium Confidence', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
    return { text: 'Low Confidence', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
  };

  const confidenceBadge = getConfidenceBadge(prediction.confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-indigo-600/10',
        'border border-purple-500/30 rounded-xl p-6',
        'relative overflow-hidden',
        className
      )}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none" />
      
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                Today's Energy Forecast
                <Sparkles className="w-4 h-4 text-purple-400" />
              </h3>
              <p className="text-sm text-gray-400">AI-powered prediction</p>
            </div>
          </div>
          <Badge variant="outline" className={confidenceBadge.color}>
            {confidenceBadge.text}
          </Badge>
        </div>

        {/* Prediction Stats */}
        <div className="grid grid-cols-3 gap-4">
          {/* Predicted Energy */}
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Target</span>
            </div>
            <p className="text-2xl font-bold text-white">{prediction.predictedEnergy}</p>
            <p className="text-xs text-gray-500">energy points</p>
          </div>

          {/* Current Progress */}
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className={cn('w-4 h-4', isOnTrack ? 'text-green-400' : 'text-yellow-400')} />
              <span className="text-xs text-gray-400">Current</span>
            </div>
            <p className="text-2xl font-bold text-white">{energy.totalEnergy}</p>
            <p className="text-xs text-gray-500">{currentProgress.toFixed(0)}% of target</p>
          </div>

          {/* Predicted Color */}
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Expected</span>
            </div>
            <p className="text-xl font-bold" style={{ color: prediction.predictedColor }}>
              {prediction.predictedColorName}
            </p>
            <p className="text-xs text-gray-500">color level</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Progress to Target</span>
            <span className="text-white font-medium">{currentProgress.toFixed(0)}%</span>
          </div>
          <Progress 
            value={Math.min(currentProgress, 100)} 
            className="h-2"
            style={{
              background: 'rgba(75, 85, 99, 0.3)',
            }}
          />
        </div>

        {/* Recommendations */}
        {prediction.recommendations && prediction.recommendations.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-300 font-medium mb-1">AI Recommendation</p>
                <p className="text-sm text-gray-300">{prediction.recommendations[0]}</p>
              </div>
            </div>
          </div>
        )}

        {/* Warning if behind */}
        {currentProgress < 50 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-orange-300 font-medium mb-1">Behind Target</p>
                <p className="text-sm text-gray-300">
                  Complete {Math.ceil((prediction.predictedEnergy * 0.5 - energy.totalEnergy) / 5)} more tasks to get back on track
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}