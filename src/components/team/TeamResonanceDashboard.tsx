/**
 * TeamResonanceDashboard Component (Phase 6D)
 * 
 * Comprehensive dashboard showing team resonance metrics, member alignment,
 * discord warnings, and AI-powered insights for team dynamics.
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Waves,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Heart,
  Target,
  Zap,
  RefreshCw,
  Activity,
  BarChart3,
  Clock,
} from 'lucide-react';
import { Team } from '../../types/team';
import { useTeamResonance } from '../../hooks/useTeamResonance';
import { ResonanceLevel, AlignmentLevel } from '../../utils/team-resonance-integration';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '../ui/utils';
import { TeamResonanceChart } from './TeamResonanceChart';

interface TeamResonanceDashboardProps {
  team: Team;
  className?: string;
}

export function TeamResonanceDashboard({ team, className }: TeamResonanceDashboardProps) {
  const {
    teamResonance,
    isLoading,
    calculateResonance,
    insights,
    recommendations,
    resonanceWaves,
    refresh,
  } = useTeamResonance(team.id);

  // Calculate on mount and when team changes
  useEffect(() => {
    calculateResonance(team);
  }, [team.id, calculateResonance]);

  if (isLoading && !teamResonance) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-gray-400">Calculating team resonance...</p>
        </div>
      </div>
    );
  }

  if (!teamResonance) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">No resonance data available</p>
      </div>
    );
  }

  const resonanceColor = getResonanceColor(teamResonance.resonanceLevel);
  const highPriorityInsights = insights.filter((i) => i.priority === 'high');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Overall Score */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', resonanceColor.bg)}>
              <Waves className={cn('w-6 h-6', resonanceColor.text)} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Team Resonance: {teamResonance.overallResonance.toFixed(0)}
              </h2>
              <Badge className={cn('text-xs', resonanceColor.badge)}>
                {getResonanceLevelLabel(teamResonance.resonanceLevel)}
              </Badge>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Measuring team harmony, alignment, and engagement
          </p>
        </div>

        <Button onClick={refresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat
          icon={Heart}
          label="Cohesion"
          value={teamResonance.harmony.cohesion}
          color="text-red-400"
        />
        <QuickStat
          icon={Target}
          label="Alignment"
          value={teamResonance.averageAlignment}
          color="text-blue-400"
        />
        <QuickStat
          icon={Zap}
          label="Engagement"
          value={teamResonance.harmony.engagement}
          color="text-amber-400"
        />
        <QuickStat
          icon={Activity}
          label="Momentum"
          value={50 + teamResonance.harmony.momentum / 2}
          color="text-green-400"
          showTrend
          trend={teamResonance.harmony.momentum > 0 ? 'up' : teamResonance.harmony.momentum < 0 ? 'down' : 'stable'}
        />
      </div>

      {/* Discord Warnings */}
      {teamResonance.discordWarnings.length > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-400 mb-2">
                {teamResonance.discordWarnings.length} Discord Warning{teamResonance.discordWarnings.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-2">
                {teamResonance.discordWarnings.map((warning) => (
                  <div key={warning.id} className="text-sm">
                    <p className="text-white font-medium">{warning.message}</p>
                    <p className="text-gray-400 text-xs mt-1">{warning.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#1e2128] border border-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="waves">Resonance Waves</TabsTrigger>
          <TabsTrigger value="insights">
            AI Insights
            {highPriorityInsights.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">{highPriorityInsights.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <HarmonyMetrics harmony={teamResonance.harmony} />
          
          <Card className="bg-[#1e2128] border-gray-800 p-4">
            <h3 className="font-semibold text-white mb-3">Recommendations</h3>
            {recommendations.length > 0 ? (
              <ul className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No recommendations at this time - keep up the great work!</p>
            )}
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4 mt-6">
          <MemberAlignmentList members={teamResonance.memberAlignments} />
        </TabsContent>

        {/* Waves Tab */}
        <TabsContent value="waves" className="space-y-4 mt-6">
          <TeamResonanceChart waves={resonanceWaves} team={team} />
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4 mt-6">
          <InsightsList insights={insights} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Quick Stat Component
function QuickStat({
  icon: Icon,
  label,
  value,
  color,
  showTrend,
  trend,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  showTrend?: boolean;
  trend?: 'up' | 'down' | 'stable';
}) {
  return (
    <Card className="bg-[#1e2128] border-gray-800 p-4">
      <div className="flex items-start justify-between mb-2">
        <Icon className={cn('w-5 h-5', color)} />
        {showTrend && trend && (
          <div>
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white">{value.toFixed(0)}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
      <Progress value={value} className="h-1.5 mt-2" />
    </Card>
  );
}

// Harmony Metrics Component
function HarmonyMetrics({ harmony }: { harmony: any }) {
  return (
    <Card className="bg-[#1e2128] border-gray-800 p-4">
      <h3 className="font-semibold text-white mb-4">Harmony Metrics</h3>
      <div className="space-y-4">
        <MetricRow
          label="Team Cohesion"
          value={harmony.cohesion}
          description="How aligned team members are"
        />
        <MetricRow
          label="Consistency"
          value={harmony.consistency}
          description="Stability of team performance"
        />
        <MetricRow
          label="Engagement"
          value={harmony.engagement}
          description="Overall team engagement level"
        />
        <MetricRow
          label="Momentum"
          value={50 + harmony.momentum / 2}
          description="Team trending direction"
          showTrend
          trend={harmony.momentum > 0 ? 'up' : harmony.momentum < 0 ? 'down' : 'stable'}
        />
      </div>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  description,
  showTrend,
  trend,
}: {
  label: string;
  value: number;
  description: string;
  showTrend?: boolean;
  trend?: 'up' | 'down' | 'stable';
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium">{label}</span>
          {showTrend && trend && (
            <div>
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
              {trend === 'stable' && <Minus className="w-3 h-3 text-gray-400" />}
            </div>
          )}
        </div>
        <span className="text-sm text-white font-bold">{value.toFixed(0)}</span>
      </div>
      <Progress value={value} className="h-2 mb-1" />
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );
}

// Member Alignment List
function MemberAlignmentList({ members }: { members: any[] }) {
  return (
    <div className="space-y-3">
      {members.map((member) => {
        const alignmentColor = getAlignmentColor(member.alignmentLevel);
        
        return (
          <Card key={member.userId} className="bg-[#1e2128] border-gray-800 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {member.userName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{member.userName}</span>
                    {member.inSync && (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <Badge className={cn('text-xs mt-1', alignmentColor.badge)}>
                    {getAlignmentLevelLabel(member.alignmentLevel)}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {member.personalResonance.toFixed(0)}
                </div>
                <div className="text-xs text-gray-400">Personal</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-gray-400 text-xs mb-1">Alignment</div>
                <div className="text-white font-medium">{member.teamAlignment.toFixed(0)}%</div>
                <Progress value={member.teamAlignment} className="h-1.5 mt-1" />
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Contribution</div>
                <div className="text-white font-medium">{member.contributionScore.toFixed(0)}%</div>
                <Progress value={member.contributionScore} className="h-1.5 mt-1" />
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Engagement</div>
                <div className="text-white font-medium">{member.engagementScore.toFixed(0)}%</div>
                <Progress value={member.engagementScore} className="h-1.5 mt-1" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Insights List
function InsightsList({ insights }: { insights: any[] }) {
  if (insights.length === 0) {
    return (
      <Card className="bg-[#1e2128] border-gray-800 p-8 text-center">
        <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
        <p className="text-gray-400">No insights or recommendations at this time.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight) => {
        const priorityColor = getPriorityColor(insight.priority);
        
        return (
          <Card key={insight.id} className="bg-[#1e2128] border-gray-800 p-4">
            <div className="flex items-start gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', priorityColor.bg)}>
                <Sparkles className={cn('w-5 h-5', priorityColor.text)} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{insight.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn('text-xs', priorityColor.badge)}>
                        {insight.priority} priority
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-gray-800 border-gray-700 text-gray-300">
                        {insight.category}
                      </Badge>
                    </div>
                  </div>
                  {insight.aiGenerated && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                            AI {insight.confidence}%
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>AI-generated with {insight.confidence}% confidence</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                <p className="text-sm text-gray-300 mb-3">{insight.description}</p>
                
                {insight.impact && (
                  <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-400 mb-1">Impact:</p>
                    <p className="text-sm text-white">{insight.impact}</p>
                  </div>
                )}

                {insight.recommendations && insight.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Recommendations:</p>
                    <ul className="space-y-1">
                      {insight.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Helper functions
function getResonanceColor(level: ResonanceLevel) {
  switch (level) {
    case 'peak-harmony':
      return {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        badge: 'bg-green-500/20 text-green-400 border-green-500/30',
      };
    case 'harmony':
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      };
    case 'neutral':
      return {
        bg: 'bg-gray-500/20',
        text: 'text-gray-400',
        badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      };
    case 'discord':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        badge: 'bg-red-500/20 text-red-400 border-red-500/30',
      };
  }
}

function getAlignmentColor(level: AlignmentLevel) {
  switch (level) {
    case 'highly-aligned':
      return { badge: 'bg-green-500/20 text-green-400 border-green-500/30' };
    case 'aligned':
      return { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    case 'partially-aligned':
      return { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    case 'misaligned':
      return { badge: 'bg-red-500/20 text-red-400 border-red-500/30' };
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        badge: 'bg-red-500/20 text-red-400 border-red-500/30',
      };
    case 'medium':
      return {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      };
    case 'low':
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      };
    default:
      return {
        bg: 'bg-gray-500/20',
        text: 'text-gray-400',
        badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      };
  }
}

function getResonanceLevelLabel(level: ResonanceLevel): string {
  switch (level) {
    case 'peak-harmony':
      return 'Peak Harmony';
    case 'harmony':
      return 'Harmony';
    case 'neutral':
      return 'Neutral';
    case 'discord':
      return 'Discord';
  }
}

function getAlignmentLevelLabel(level: AlignmentLevel): string {
  switch (level) {
    case 'highly-aligned':
      return 'Highly Aligned';
    case 'aligned':
      return 'Aligned';
    case 'partially-aligned':
      return 'Partially Aligned';
    case 'misaligned':
      return 'Misaligned';
  }
}
