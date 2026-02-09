/**
 * Team Energy Dashboard Component (Phase 6C)
 * 
 * Displays comprehensive team energy overview with:
 * - Real-time team energy aggregation
 * - Individual member energy levels
 * - Energy distribution visualization
 * - Burnout risk indicators
 * - Optimal scheduling suggestions
 * - Workload balance analysis
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Activity,
  Target,
  BarChart3,
  Calendar,
  Info,
  Sparkles,
  Flame,
  Crown,
} from 'lucide-react';
import { Team } from '../../types/team';
import { EnergyState, COLOR_LEVELS } from '../../utils/energy-system';
import {
  calculateTeamEnergyStats,
  getMemberEnergyInfo,
  analyzeTeamWorkloadBalance,
  suggestOptimalTeamEventTime,
  generateTeamEnergyTrends,
  predictTeamEnergyTrend,
  TeamEnergyStats,
  MemberEnergyInfo,
} from '../../utils/team-energy-integration';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { cn } from '../ui/utils';

interface TeamEnergyDashboardProps {
  team: Team;
  memberEnergyStates: Map<string, EnergyState>; // userId -> EnergyState
  teamEvents?: any[]; // Optional: for workload balance
  className?: string;
}

export function TeamEnergyDashboard({
  team,
  memberEnergyStates,
  teamEvents = [],
  className,
}: TeamEnergyDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate all stats
  const stats = useMemo(
    () => calculateTeamEnergyStats(team, memberEnergyStates),
    [team, memberEnergyStates]
  );

  const memberInfos = useMemo(
    () =>
      team.members.map((member) =>
        getMemberEnergyInfo(member, memberEnergyStates.get(member.userId))
      ),
    [team.members, memberEnergyStates]
  );

  const workloadBalance = useMemo(
    () => analyzeTeamWorkloadBalance(team, memberEnergyStates, teamEvents),
    [team, memberEnergyStates, teamEvents]
  );

  const schedulingSuggestions = useMemo(
    () => suggestOptimalTeamEventTime(team, memberEnergyStates),
    [team, memberEnergyStates]
  );

  const trends = useMemo(
    () => generateTeamEnergyTrends(team, memberEnergyStates, 7),
    [team, memberEnergyStates]
  );

  const predictions = useMemo(
    () => predictTeamEnergyTrend(team, memberEnergyStates, 3),
    [team, memberEnergyStates]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TeamEnergyStatCard
          icon={<Zap className="w-5 h-5" />}
          label="Team Energy"
          value={stats.totalEnergy.toLocaleString()}
          subValue={`Avg: ${Math.round(stats.averageEnergy)}`}
          color={stats.teamColorLevel.color}
          trend="up"
        />

        <TeamEnergyStatCard
          icon={<Users className="w-5 h-5" />}
          label="Active Members"
          value={stats.activeMembers.toString()}
          subValue={`of ${team.memberCount} total`}
          color="#3b82f6"
        />

        <TeamEnergyStatCard
          icon={<Target className="w-5 h-5" />}
          label="Team Level"
          value={stats.teamColorLevel.name}
          subValue={`${stats.teamColorLevel.colorName.toUpperCase()}`}
          color={stats.teamColorLevel.color}
          badge={
            <Badge
              style={{ backgroundColor: stats.teamColorLevel.color }}
              className="text-white border-0"
            >
              {stats.teamColorLevel.name}
            </Badge>
          }
        />

        <TeamEnergyStatCard
          icon={
            stats.burnoutRisk === 'high' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : stats.burnoutRisk === 'medium' ? (
              <Activity className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )
          }
          label="Burnout Risk"
          value={stats.burnoutRisk.toUpperCase()}
          color={
            stats.burnoutRisk === 'high'
              ? '#ef4444'
              : stats.burnoutRisk === 'medium'
              ? '#f59e0b'
              : '#22c55e'
          }
          alert={stats.burnoutRisk !== 'low'}
        />
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#1a1c24] border border-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <EnergyDistributionCard stats={stats} />
          <WorkloadBalanceCard balance={workloadBalance} />
          <OptimalHoursCard stats={stats} />
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          <MemberEnergyListCard members={memberInfos} />
        </TabsContent>

        {/* Scheduling Tab */}
        <TabsContent value="scheduling" className="space-y-4 mt-4">
          <SchedulingSuggestionsCard suggestions={schedulingSuggestions} />
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4 mt-4">
          <EnergyTrendsCard trends={trends} predictions={predictions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  trend?: 'up' | 'down';
  alert?: boolean;
  badge?: React.ReactNode;
}

function TeamEnergyStatCard({
  icon,
  label,
  value,
  subValue,
  color,
  trend,
  alert,
  badge,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1e2128] border border-gray-800 rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="p-2 rounded-lg"
          style={{
            backgroundColor: `${color}20`,
            color: color,
          }}
        >
          {icon}
        </div>
        {trend && (
          <div className="text-green-400">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
          </div>
        )}
        {alert && <AlertTriangle className="w-4 h-4 text-amber-400" />}
      </div>

      <div className="space-y-1">
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-2xl font-bold text-white flex items-center gap-2">
          {value}
          {badge}
        </div>
        {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
      </div>
    </motion.div>
  );
}

// Energy Distribution Card
function EnergyDistributionCard({ stats }: { stats: TeamEnergyStats }) {
  const total = Object.values(stats.energyDistribution).reduce((a, b) => a + b, 0);

  return (
    <Card className="bg-[#1e2128] border-gray-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Energy Distribution</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of members at each energy level</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-3">
        {COLOR_LEVELS.map((level, idx) => {
          const count = stats.energyDistribution[level.colorName];
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={level.colorName} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: level.color }}
                  />
                  {level.name}
                </span>
                <span className="text-white font-medium">
                  {count} {count === 1 ? 'member' : 'members'}
                </span>
              </div>
              <Progress
                value={percentage}
                className="h-2"
                style={
                  {
                    '--progress-background': level.color,
                  } as React.CSSProperties
                }
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Workload Balance Card
function WorkloadBalanceCard({ balance }: { balance: any }) {
  return (
    <Card className="bg-[#1e2128] border-gray-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Workload Balance</h3>
        <Badge
          variant={balance.isBalanced ? 'default' : 'destructive'}
          className={cn(
            balance.isBalanced ? 'bg-green-500/20 text-green-400' : ''
          )}
        >
          {balance.isBalanced ? 'Balanced' : 'Imbalanced'}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Balance Score</span>
          <span className="text-lg font-bold text-white">
            {100 - balance.imbalanceScore}/100
          </span>
        </div>

        <Progress
          value={100 - balance.imbalanceScore}
          className="h-2"
          style={
            {
              '--progress-background':
                balance.imbalanceScore < 30 ? '#22c55e' : '#f59e0b',
            } as React.CSSProperties
          }
        />

        {balance.recommendations.length > 0 && (
          <div className="mt-4 space-y-2">
            {balance.recommendations.map((rec: string, idx: number) => (
              <div
                key={idx}
                className="text-xs text-gray-400 flex items-start gap-2"
              >
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// Optimal Hours Card
function OptimalHoursCard({ stats }: { stats: TeamEnergyStats }) {
  return (
    <Card className="bg-[#1e2128] border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Optimal Work Hours</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {stats.optimalWorkHours.map((hour) => (
          <Badge
            key={hour}
            variant="outline"
            className="bg-blue-500/10 border-blue-500/30 text-blue-400"
          >
            {hour}
          </Badge>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Best times for team collaboration based on energy patterns
      </p>
    </Card>
  );
}

// Member Energy List Card
function MemberEnergyListCard({ members }: { members: MemberEnergyInfo[] }) {
  const sorted = [...members].sort((a, b) => b.currentEnergy - a.currentEnergy);

  return (
    <Card className="bg-[#1e2128] border-gray-800 p-4">
      <h3 className="text-sm font-semibold text-white mb-4">Member Energy Levels</h3>

      <div className="space-y-3">
        {sorted.map((member, idx) => (
          <div
            key={member.userId}
            className="flex items-center justify-between p-3 bg-[#1a1c24] rounded-lg border border-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="text-gray-500 text-xs font-mono w-6">
                #{idx + 1}
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {member.userName}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    style={{ backgroundColor: member.colorLevel.color }}
                    className="text-white border-0 text-xs"
                  >
                    {member.colorLevel.name}
                  </Badge>
                  {!member.isActive && (
                    <span className="text-xs text-gray-500">Inactive</span>
                  )}
                  {member.burnoutRisk === 'high' && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Risk
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-white">
                {member.currentEnergy}
              </div>
              <div className="text-xs text-gray-500">energy</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Scheduling Suggestions Card
function SchedulingSuggestionsCard({ suggestions }: { suggestions: any[] }) {
  if (suggestions.length === 0) {
    return (
      <Card className="bg-[#1e2128] border-gray-800 p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No scheduling suggestions available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.slice(0, 3).map((suggestion, idx) => (
        <Card key={idx} className="bg-[#1e2128] border-gray-800 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <div className="text-sm font-medium text-white">
                {new Date(suggestion.suggestedTime).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {' at '}
                {new Date(suggestion.suggestedTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                suggestion.confidence > 80
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              )}
            >
              {suggestion.confidence}% confidence
            </Badge>
          </div>

          <p className="text-xs text-gray-400 mb-3">{suggestion.reason}</p>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-white font-medium">
                {suggestion.expectedTeamEnergy}
              </span>
              <span className="text-gray-500">expected</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge
                style={{ backgroundColor: suggestion.expectedColorLevel.color }}
                className="text-white border-0 text-xs py-0 px-1"
              >
                {suggestion.expectedColorLevel.name}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Energy Trends Card
function EnergyTrendsCard({
  trends,
  predictions,
}: {
  trends: any[];
  predictions: any[];
}) {
  return (
    <Card className="bg-[#1e2128] border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">Energy Trends</h3>
      </div>

      <div className="space-y-2">
        {/* Historical */}
        <div className="text-xs text-gray-400 mb-2">Past 7 Days</div>
        {trends.slice(-7).map((trend) => (
          <div
            key={trend.date}
            className="flex items-center justify-between p-2 bg-[#1a1c24] rounded border border-gray-800"
          >
            <span className="text-xs text-gray-400">
              {new Date(trend.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <div className="flex items-center gap-2">
              <Badge
                style={{ backgroundColor: trend.colorLevel.color }}
                className="text-white border-0 text-xs"
              >
                {trend.colorLevel.name}
              </Badge>
              <span className="text-sm font-medium text-white">
                {trend.averageEnergy}
              </span>
            </div>
          </div>
        ))}

        {/* Predictions */}
        <div className="text-xs text-gray-400 mt-4 mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Next 3 Days (Predicted)
        </div>
        {predictions.map((pred) => (
          <div
            key={pred.date}
            className="flex items-center justify-between p-2 bg-purple-500/5 rounded border border-purple-500/20"
          >
            <span className="text-xs text-gray-400">
              {new Date(pred.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <div className="flex items-center gap-2">
              <Badge
                style={{ backgroundColor: pred.colorLevel.color }}
                className="text-white border-0 text-xs"
              >
                {pred.colorLevel.name}
              </Badge>
              <span className="text-sm font-medium text-white">
                ~{pred.averageEnergy}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
