import { TrendingUp, TrendingDown, Target, Zap, Calendar, Activity } from 'lucide-react';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { SuccessLikelihood } from '../utils/goal-ai-analytics';

interface PredictiveAnalyticsDashboardProps {
  likelihood: SuccessLikelihood;
  goalTitle: string;
}

export function PredictiveAnalyticsDashboard({ likelihood, goalTitle }: PredictiveAnalyticsDashboardProps) {
  const { 
    probability, 
    projectedCompletionDate, 
    daysAhead, 
    requiredVelocity, 
    currentVelocity,
    velocityGap 
  } = likelihood;

  const isPacing = velocityGap >= 0;
  const isAhead = daysAhead > 0;

  return (
    <div className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-purple-400" />
        <h4 className="text-white">Predictive Analytics</h4>
      </div>

      {/* Success Probability */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Success Likelihood</span>
          <div className="flex items-center gap-2">
            {isPacing ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-orange-400" />
            )}
            <span className={`text-lg ${
              probability >= 80 ? 'text-green-400' :
              probability >= 60 ? 'text-yellow-400' :
              'text-orange-400'
            }`}>
              {probability}%
            </span>
          </div>
        </div>
        <Progress 
          value={probability} 
          className="h-3 bg-gray-800/50" 
          indicatorClassName={
            probability >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
            probability >= 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
            'bg-gradient-to-r from-orange-500 to-red-400'
          }
        />
        <p className="text-xs text-gray-400 mt-2">
          {probability >= 80 
            ? "On track to hit your deadline! Keep up the great work."
            : probability >= 60
            ? "You're slightly behind pace. Minor adjustments needed."
            : "Significant changes needed to hit deadline on time."}
        </p>
      </div>

      {/* Projected Completion */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-gray-400">Projected Date</span>
          </div>
          <div className="text-sm text-cyan-400">{projectedCompletionDate}</div>
        </div>

        <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs text-gray-400">Status</span>
          </div>
          <div className={`text-sm ${isAhead ? 'text-green-400' : 'text-orange-400'}`}>
            {isAhead 
              ? `${daysAhead} days ahead`
              : daysAhead === 0
              ? 'On schedule'
              : `${Math.abs(daysAhead)} days behind`}
          </div>
        </div>
      </div>

      {/* Velocity Tracking */}
      <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs text-gray-400">Progress Velocity</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Current Pace</div>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg ${isPacing ? 'text-green-400' : 'text-orange-400'}`}>
                {currentVelocity.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">pts/day</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Required Pace</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg text-blue-400">
                {requiredVelocity.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">pts/day</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Velocity Gap</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                velocityGap >= 0 
                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
              }`}
            >
              {velocityGap >= 0 ? '+' : ''}{velocityGap.toFixed(1)} pts/day
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300 leading-relaxed">
            {isPacing 
              ? `Your current pace is ${Math.abs(velocityGap).toFixed(1)} points/day faster than needed. Excellent progress!`
              : `To hit your deadline, increase your pace by ${Math.abs(velocityGap).toFixed(1)} points/day.`}
          </p>
        </div>
      </div>
    </div>
  );
}
