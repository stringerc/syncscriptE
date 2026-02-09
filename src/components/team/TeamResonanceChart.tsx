/**
 * TeamResonanceChart Component (Phase 6D)
 * 
 * Visual representation of team resonance over time showing resonance waves
 * for the team and individual members.
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Team } from '../../types/team';
import { ResonanceWave } from '../../utils/team-resonance-integration';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Waves, TrendingUp } from 'lucide-react';

interface TeamResonanceChartProps {
  waves: ResonanceWave[];
  team: Team;
  className?: string;
}

export function TeamResonanceChart({ waves, team, className }: TeamResonanceChartProps) {
  // Transform data for chart
  const chartData = useMemo(() => {
    return waves.map((wave) => {
      const dataPoint: any = {
        date: wave.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        team: wave.teamResonance,
      };

      // Add individual member data
      wave.memberResonances.forEach((mr) => {
        const member = team.members.find((m) => m.userId === mr.userId);
        if (member) {
          dataPoint[member.name] = mr.resonance;
        }
      });

      return dataPoint;
    });
  }, [waves, team]);

  // Colors for members
  const memberColors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#10b981', // green
    '#f59e0b', // amber
    '#06b6d4', // cyan
    '#f97316', // orange
    '#6366f1', // indigo
  ];

  const activeMembers = team.members.filter((m) => m.status === 'active');

  // Calculate trend
  const firstResonance = waves[0]?.teamResonance || 0;
  const lastResonance = waves[waves.length - 1]?.teamResonance || 0;
  const trend = lastResonance - firstResonance;
  const trendPercentage = firstResonance > 0 ? ((trend / firstResonance) * 100).toFixed(1) : '0';

  return (
    <div className={className}>
      <Card className="bg-[#1e2128] border-gray-800 p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Waves className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Resonance Waves</h3>
              <p className="text-xs text-gray-400">Last 7 days of team resonance</p>
            </div>
          </div>

          {/* Trend Badge */}
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Badge
                className={
                  trend > 0
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : trend < 0
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }
              >
                {trend > 0 ? '+' : ''}
                {trendPercentage}%
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mt-1">7-day trend</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="teamGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />

              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />

              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickLine={false}
                domain={[0, 100]}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e2128',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                labelStyle={{ color: '#fff', marginBottom: '8px', fontWeight: '600' }}
                itemStyle={{ color: '#9ca3af', fontSize: '12px' }}
              />

              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                iconType="line"
              />

              {/* Team resonance area */}
              <Area
                type="monotone"
                dataKey="team"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#teamGradient)"
                name="Team Average"
              />

              {/* Individual member lines */}
              {activeMembers.slice(0, 8).map((member, idx) => (
                <Line
                  key={member.userId}
                  type="monotone"
                  dataKey={member.name}
                  stroke={memberColors[idx % memberColors.length]}
                  strokeWidth={2}
                  dot={false}
                  name={member.name}
                  strokeOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend note */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-400">
            <strong className="text-white">Team Average</strong> (bold blue line) represents
            overall team resonance. Individual lines show each member's resonance over time.
          </p>
        </div>
      </Card>
    </div>
  );
}
