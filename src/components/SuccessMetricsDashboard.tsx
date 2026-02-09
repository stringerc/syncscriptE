import { TrendingUp, TrendingDown, Star, AlertTriangle, CheckSquare, Target, Activity, Smile, Meh, Frown } from 'lucide-react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface SuccessMetricsDashboardProps {
  goals: any[];
}

export function SuccessMetricsDashboard({ goals }: SuccessMetricsDashboardProps) {
  // Calculate metrics
  const totalGoals = goals.length;
  const onTrackGoals = goals.filter(g => g.status === 'on-track').length;
  const aheadGoals = goals.filter(g => g.status === 'ahead').length;
  const atRiskGoals = goals.filter(g => g.status === 'at-risk').length;

  const averageConfidence = goals.reduce((sum, g) => sum + (g.confidenceScore || 0), 0) / totalGoals;
  const averageProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0) / totalGoals;

  // Count risks by severity
  const allRisks = goals.flatMap(g => g.risks || []);
  const activeRisks = allRisks.filter(r => r.status === 'active');
  const criticalRisks = activeRisks.filter(r => r.severity === 'critical').length;
  const highRisks = activeRisks.filter(r => r.severity === 'high').length;
  const mediumRisks = activeRisks.filter(r => r.severity === 'medium').length;

  // Get recent check-ins
  const allCheckIns = goals.flatMap(g => (g.checkIns || []).map((ci: any) => ({ ...ci, goalTitle: g.title })));
  const recentCheckIns = allCheckIns.slice(0, 3);

  // Calculate completion rate
  const completedKeyResults = goals.flatMap(g => g.keyResults || []).filter((kr: any) => kr.progress >= 100).length;
  const totalKeyResults = goals.flatMap(g => g.keyResults || []).length;
  const keyResultCompletionRate = totalKeyResults > 0 ? (completedKeyResults / totalKeyResults) * 100 : 0;

  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Activity className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white">Success Metrics</h3>
      </div>

      {/* Goal Health Overview */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Goal Health</span>
          <span className="text-xs text-gray-500">{totalGoals} total</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
            <div className="text-lg text-green-400">{aheadGoals}</div>
            <div className="text-xs text-green-400/70">Ahead</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
            <div className="text-lg text-blue-400">{onTrackGoals}</div>
            <div className="text-xs text-blue-400/70">On Track</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
            <div className="text-lg text-yellow-400">{atRiskGoals}</div>
            <div className="text-xs text-yellow-400/70">At Risk</div>
          </div>
        </div>
        <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-800">
          {aheadGoals > 0 && (
            <div 
              className="bg-green-400" 
              style={{ width: `${(aheadGoals / totalGoals) * 100}%` }}
            />
          )}
          {onTrackGoals > 0 && (
            <div 
              className="bg-blue-400" 
              style={{ width: `${(onTrackGoals / totalGoals) * 100}%` }}
            />
          )}
          {atRiskGoals > 0 && (
            <div 
              className="bg-yellow-400" 
              style={{ width: `${(atRiskGoals / totalGoals) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Average Confidence */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Avg Confidence</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">{averageConfidence.toFixed(1)}/10</span>
          </div>
        </div>
        <Progress 
          value={averageConfidence * 10} 
          className="h-2 bg-gray-800" 
          indicatorClassName={
            averageConfidence >= 8 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
            averageConfidence >= 6 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
            'bg-gradient-to-r from-orange-500 to-red-400'
          }
        />
      </div>

      {/* Overall Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Overall Progress</span>
          <span className="text-sm text-purple-400">{Math.round(averageProgress)}%</span>
        </div>
        <Progress 
          value={averageProgress} 
          className="h-2 bg-gray-800" 
          indicatorClassName="bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-400"
        />
      </div>

      {/* Active Risks */}
      {activeRisks.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Active Risks</span>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs">
              {activeRisks.length}
            </Badge>
          </div>
          <div className="space-y-1.5">
            {criticalRisks > 0 && (
              <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400">Critical</span>
                </div>
                <span className="text-xs text-red-400">{criticalRisks}</span>
              </div>
            )}
            {highRisks > 0 && (
              <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-orange-400">High</span>
                </div>
                <span className="text-xs text-orange-400">{highRisks}</span>
              </div>
            )}
            {mediumRisks > 0 && (
              <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400">Medium</span>
                </div>
                <span className="text-xs text-yellow-400">{mediumRisks}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Results Completion */}
      {totalKeyResults > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Key Results</span>
            <span className="text-xs text-gray-500">{completedKeyResults}/{totalKeyResults}</span>
          </div>
          <Progress 
            value={keyResultCompletionRate} 
            className="h-2 bg-gray-800" 
            indicatorClassName="bg-gradient-to-r from-teal-500 to-cyan-400"
          />
          <div className="text-xs text-teal-400 mt-1">{Math.round(keyResultCompletionRate)}% complete</div>
        </div>
      )}

      {/* Recent Check-ins */}
      {recentCheckIns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Recent Check-ins</span>
            <CheckSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="space-y-2">
            {recentCheckIns.map((checkIn: any, idx: number) => (
              <div key={idx} className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-2">
                <div className="flex items-start gap-2 mb-1">
                  {checkIn.mood === 'positive' ? (
                    <Smile className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                  ) : checkIn.mood === 'neutral' ? (
                    <Meh className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  ) : (
                    <Frown className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 truncate">{checkIn.goalTitle}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{checkIn.date}</span>
                      <Badge variant="outline" className="text-xs bg-gray-800 border-gray-700 h-4 px-1">
                        {checkIn.progress}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No metrics state */}
      {totalGoals === 0 && (
        <div className="text-center py-6">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No goals yet</p>
          <p className="text-xs text-gray-500 mt-1">Metrics will appear once you create goals</p>
        </div>
      )}
    </div>
  );
}
