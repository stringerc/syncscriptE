import { memo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { CheckCircle2, AlertCircle, Zap, TrendingUp, Link2, Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { motion } from 'motion/react';

// ====================================================================
// INTEGRATIONS HUB - Integration Usage & Health Visualizations
// Research: Platform monitoring best practices (Moesif, DreamFactory)
// ====================================================================

// 1. Integration Usage Pie Chart
// Purpose: Shows which apps/sources provide most tasks/events
// Research: Understanding source distribution is key for platform analytics
interface IntegrationUsagePieProps {
  integrations: {
    name: string;
    percentage: number;
    count: number;
    color: string;
  }[];
}

export const IntegrationUsagePie = memo(function IntegrationUsagePie({ integrations }: IntegrationUsagePieProps) {
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <div className="text-xs text-gray-400 mb-2">Task/event sources by integration</div>
      </div>

      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={integrations}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={90}
            fill="#8884d8"
            dataKey="percentage"
          >
            {integrations.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e2128',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '11px'
            }}
            formatter={(value: any, name: any, props: any) => [
              `${value}% (${props.payload.count} tasks)`,
              props.payload.name
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="space-y-2">
        {integrations.map((integration, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: integration.color }}
              />
              <span className="text-xs text-white">{integration.name}</span>
            </div>
            <div className="text-xs text-gray-400">
              {integration.count} tasks ({integration.percentage}%)
            </div>
          </div>
        ))}
      </div>

      {/* Insight */}
      {integrations.some(i => i.percentage === 0) && (
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="text-xs text-amber-400">
            💡 {integrations.find(i => i.percentage === 0)?.name} isn't generating tasks. Check connection.
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
        📊 Research: Monitoring integration usage helps identify underutilized sources (Moesif analytics)
      </div>
    </div>
  );
});

// 2. Sync Success Rate Gauge
// Purpose: Visual health check - % of successful sync operations
// Research: Key API health metrics include error rates and uptime (DreamFactory)
interface SyncSuccessRateProps {
  successRate: number; // 0-100
  totalSyncs: number;
  failedSyncs: number;
  periodDays: number;
}

export const SyncSuccessRate = memo(function SyncSuccessRate({
  successRate,
  totalSyncs,
  failedSyncs,
  periodDays
}: SyncSuccessRateProps) {
  const getStatusColor = () => {
    if (successRate >= 99) return { bg: 'from-emerald-600 to-emerald-400', text: 'text-emerald-400', status: 'Excellent' };
    if (successRate >= 95) return { bg: 'from-blue-600 to-blue-400', text: 'text-blue-400', status: 'Good' };
    if (successRate >= 90) return { bg: 'from-amber-600 to-amber-400', text: 'text-amber-400', status: 'Fair' };
    return { bg: 'from-red-600 to-red-400', text: 'text-red-400', status: 'Poor' };
  };

  const status = getStatusColor();

  return (
    <div className="space-y-4">
      {/* Circular Gauge */}
      <div className="flex items-center justify-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#2a2d35"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="url(#successGradient)"
              strokeWidth="12"
              strokeDasharray={`${2 * Math.PI * 70}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 70 * (1 - successRate / 100)
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={
                  successRate >= 99 ? '#059669' :
                  successRate >= 95 ? '#2563eb' :
                  successRate >= 90 ? '#d97706' : '#dc2626'
                } />
                <stop offset="100%" stopColor={
                  successRate >= 99 ? '#10b981' :
                  successRate >= 95 ? '#3b82f6' :
                  successRate >= 90 ? '#f59e0b' : '#ef4444'
                } />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-bold ${status.text}`}>
              {successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400 mt-1">{status.status}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-400">Successful</span>
          </div>
          <div className="text-xl font-bold text-white">
            {totalSyncs - failedSyncs}
          </div>
        </div>
        <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">Failed</span>
          </div>
          <div className="text-xl font-bold text-white">
            {failedSyncs}
          </div>
        </div>
      </div>

      {/* Period Info */}
      <div className="text-center text-xs text-gray-500">
        Last {periodDays} days • {totalSyncs.toLocaleString()} total syncs
      </div>

      {/* Warning if low */}
      {successRate < 95 && (
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="text-xs text-red-400">
            ⚠️ Sync rate below 95%. Check integration credentials and API status.
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
        📊 Research: Error rates and uptime are key API health metrics (DreamFactory)
      </div>
    </div>
  );
});

// 3. Tasks Automated vs Manual
// Purpose: Shows automation benefit - how much work integrations save
// Research: Zapier shows "tasks run" to emphasize time saved
interface AutomatedVsManualProps {
  weeklyData: {
    week: string;
    automated: number;
    manual: number;
  }[];
}

export const AutomatedVsManual = memo(function AutomatedVsManual({ weeklyData }: AutomatedVsManualProps) {
  const totalAutomated = weeklyData.reduce((sum, w) => sum + w.automated, 0);
  const totalManual = weeklyData.reduce((sum, w) => sum + w.manual, 0);
  const automationRate = Math.round((totalAutomated / (totalAutomated + totalManual)) * 100);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-400 mb-1">Automation Rate</div>
          <div className="text-2xl font-bold text-teal-400">{automationRate}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Time Saved (est.)</div>
          <div className="text-2xl font-bold text-purple-400">
            {Math.round(totalAutomated * 2.5)}m
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div>
        <div className="text-xs text-gray-400 mb-2">Weekly task creation (last 8 weeks)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis
              dataKey="week"
              stroke="#6b7280"
              style={{ fontSize: '10px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '10px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e2128',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '11px'
              }}
              labelStyle={{ color: '#d1d5db' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              iconType="circle"
            />
            <Bar dataKey="automated" stackId="a" fill="#14b8a6" name="Automated" radius={[0, 0, 0, 0]} />
            <Bar dataKey="manual" stackId="a" fill="#6366f1" name="Manual" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      <div className={`p-3 rounded-lg border ${
        automationRate >= 60
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : automationRate >= 40
          ? 'bg-blue-500/10 border-blue-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
      }`}>
        <div className={`text-xs font-medium ${
          automationRate >= 60 ? 'text-emerald-400' :
          automationRate >= 40 ? 'text-blue-400' : 'text-amber-400'
        }`}>
          {automationRate >= 60
            ? `🎉 Excellent! Integrations handled ${totalAutomated} tasks, saving you ~${Math.round(totalAutomated * 2.5)} minutes`
            : automationRate >= 40
            ? `💪 Good progress! Consider adding more integrations to automate even more`
            : `💡 Opportunity: More integrations could save you significant time on task entry`
          }
        </div>
      </div>

      <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
        📊 Research: Showing "tasks automated" quantifies platform value (Zapier analytics)
      </div>
    </div>
  );
});

// 4. Integration Response Time / Latency
// Purpose: Monitor integration performance over time
// Optional: More technical, but useful for power users
interface IntegrationLatencyProps {
  integrationData: {
    name: string;
    avgLatency: number; // in ms
    trend: 'up' | 'down' | 'stable';
  }[];
}

export const IntegrationLatency = memo(function IntegrationLatency({ integrationData }: IntegrationLatencyProps) {
  const maxLatency = Math.max(...integrationData.map(i => i.avgLatency));

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-400 mb-2">Average response time by integration</div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-3">
        {integrationData.map((integration, index) => {
          const barWidth = (integration.avgLatency / maxLatency) * 100;
          const isHealthy = integration.avgLatency < 500;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Link2 className={`w-3 h-3 ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-xs text-white">{integration.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{integration.avgLatency}ms</span>
                  {integration.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400 rotate-0" />}
                  {integration.trend === 'down' && <TrendingUp className="w-3 h-3 text-emerald-400 rotate-180" />}
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isHealthy ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                    'bg-gradient-to-r from-amber-600 to-amber-400'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Health Status */}
      {integrationData.some(i => i.avgLatency > 1000) && (
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="text-xs text-amber-400">
            ⚠️ {integrationData.find(i => i.avgLatency > 1000)?.name} experiencing high latency ({integrationData.find(i => i.avgLatency > 1000)?.avgLatency}ms)
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
        📊 Healthy integrations: &lt;500ms • Acceptable: &lt;1000ms • Slow: &gt;1000ms
      </div>
    </div>
  );
});

// 5. New Integration Recommendations
// Purpose: AI-suggested integrations based on user behavior
interface IntegrationRecommendationProps {
  recommendations: {
    name: string;
    reason: string;
    estimatedBenefit: string;
    icon: string;
    confidence: number; // 0-100
  }[];
}

export const IntegrationRecommendations = memo(function IntegrationRecommendations({
  recommendations
}: IntegrationRecommendationProps) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-400 mb-2">Suggested integrations for you</div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <motion.div
            key={index}
            className="bg-[#252830] border border-gray-700 rounded-lg p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{rec.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm text-white font-medium">{rec.name}</h4>
                  <Badge variant="outline" className="text-[10px] border-teal-400 text-teal-400">
                    {rec.estimatedBenefit}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mb-2">{rec.reason}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-600 to-blue-600 rounded-full"
                      style={{ width: `${rec.confidence}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500">{rec.confidence}% match</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
        📊 Research: Teams with project trackers complete 15% more tasks on time (Worklytics)
      </div>
    </div>
  );
});
