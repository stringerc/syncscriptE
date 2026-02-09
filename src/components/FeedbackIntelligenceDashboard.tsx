/**
 * FEEDBACK INTELLIGENCE DASHBOARD
 * AI-powered feedback analysis and insights viewer
 * 
 * Features:
 * - Real-time feedback stream
 * - Clustered insights with priority scoring
 * - Trend analysis and charts
 * - Actionable recommendations
 * - Export functionality
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Users,
  MessageSquare,
  BarChart3,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  Zap,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Eye,
  Play,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FeedbackCluster {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  count: number;
  priority_score: number;
  impact_score: number;
  urgency_score: number;
  frequency_score: number;
  recency_score: number;
  first_seen: string;
  last_seen: string;
  trend: 'rising' | 'stable' | 'declining';
  status: 'new' | 'investigating' | 'planned' | 'in_progress' | 'resolved' | 'wont_fix';
  assigned_to?: string;
}

interface FeedbackInsights {
  period: { start: string; end: string };
  total_feedback: number;
  by_category: Record<string, number>;
  by_sentiment: Record<string, number>;
  by_urgency: Record<string, number>;
  top_clusters: FeedbackCluster[];
  critical_issues: FeedbackCluster[];
  trending_up: FeedbackCluster[];
  trending_down: FeedbackCluster[];
  most_active_users: Array<{
    user_id: string;
    user_name: string;
    feedback_count: number;
    avg_sentiment: number;
  }>;
  top_features_mentioned: Array<{
    feature: string;
    count: number;
    sentiment: number;
  }>;
  recommended_actions: Array<{
    priority: number;
    action: string;
    reason: string;
    cluster_id?: string;
  }>;
}

export function FeedbackIntelligenceDashboard() {
  const [insights, setInsights] = useState<FeedbackInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [selectedCluster, setSelectedCluster] = useState<FeedbackCluster | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [period]);

  async function loadInsights() {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/feedback/insights?period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/feedback/analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
          })
        }
      );

      if (response.ok) {
        await loadInsights(); // Reload insights
      }
    } catch (error) {
      console.error('Failed to run analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  }

  async function exportInsights(format: 'json' | 'csv') {
    if (!insights) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/feedback/export?format=${format}&start_date=${insights.period.start}&end_date=${insights.period.end}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feedback-insights-${insights.period.start}.${format}`;
        a.click();
      }
    } catch (error) {
      console.error('Failed to export:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading feedback intelligence...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No feedback data available</p>
          <Button onClick={loadInsights} className="bg-cyan-500 hover:bg-cyan-600">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    bug: 'bg-red-500',
    feature_request: 'bg-blue-500',
    ux_issue: 'bg-yellow-500',
    praise: 'bg-green-500',
    question: 'bg-purple-500',
    complaint: 'bg-orange-500',
    other: 'bg-slate-500'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-cyan-400" />
              Feedback Intelligence
            </h1>
            <p className="text-slate-400">
              AI-powered insights from {insights.total_feedback} feedback items
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="flex gap-2 bg-slate-800 rounded-lg p-1">
              {['7d', '30d', '90d'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    period === p
                      ? 'bg-cyan-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>

            {/* Actions */}
            <Button
              onClick={runAnalysis}
              disabled={analyzing}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Re-analyze
                </>
              )}
            </Button>

            <Button
              onClick={() => exportInsights('csv')}
              className="bg-slate-700 hover:bg-slate-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<MessageSquare className="w-6 h-6" />}
            label="Total Feedback"
            value={insights.total_feedback.toString()}
            color="bg-cyan-500"
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            label="Critical Issues"
            value={insights.critical_issues.length.toString()}
            color="bg-red-500"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Trending Up"
            value={insights.trending_up.length.toString()}
            color="bg-orange-500"
          />
          <StatCard
            icon={<ThumbsUp className="w-6 h-6" />}
            label="Praise"
            value={(insights.by_category['praise'] || 0).toString()}
            color="bg-green-500"
          />
        </div>

        {/* Recommended Actions */}
        {insights.recommended_actions.length > 0 && (
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              Recommended Actions
            </h2>
            <div className="space-y-3">
              {insights.recommended_actions.slice(0, 5).map((action, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-4 bg-slate-800/50 rounded-lg p-4"
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      action.priority >= 80
                        ? 'bg-red-500'
                        : action.priority >= 60
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`}
                  >
                    <span className="text-white font-bold text-sm">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold mb-1">{action.action}</p>
                    <p className="text-slate-400 text-sm">{action.reason}</p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span>Priority: {action.priority}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Issues */}
        {insights.critical_issues.length > 0 && (
          <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              Critical Issues
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.critical_issues.map((cluster) => (
                <ClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  onClick={() => setSelectedCluster(cluster)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Top Clusters by Priority */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Top Issues by Priority
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {insights.top_clusters.slice(0, 10).map((cluster, idx) => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                rank={idx + 1}
                onClick={() => setSelectedCluster(cluster)}
              />
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* By Category */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Feedback by Category</h3>
            <div className="space-y-3">
              {Object.entries(insights.by_category).map(([category, count]) => (
                <div key={category} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${categoryColors[category]}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 capitalize">
                        {category.replace('_', ' ')}
                      </span>
                      <span className="text-white font-semibold">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${categoryColors[category]}`}
                        style={{
                          width: `${(count / insights.total_feedback) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Sentiment */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Sentiment Analysis</h3>
            <div className="space-y-3">
              {Object.entries(insights.by_sentiment).map(([sentiment, count]) => {
                const colors = {
                  positive: 'bg-green-500',
                  negative: 'bg-red-500',
                  neutral: 'bg-slate-500',
                  mixed: 'bg-yellow-500'
                };
                return (
                  <div key={sentiment} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[sentiment as keyof typeof colors]}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-300 capitalize">{sentiment}</span>
                        <span className="text-white font-semibold">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={colors[sentiment as keyof typeof colors]}
                          style={{
                            width: `${(count / insights.total_feedback) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Trending & Most Active */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trending Up */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              Trending Up
            </h3>
            <div className="space-y-2">
              {insights.trending_up.slice(0, 5).map((cluster) => (
                <div
                  key={cluster.id}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors"
                  onClick={() => setSelectedCluster(cluster)}
                >
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{cluster.title}</p>
                    <p className="text-slate-400 text-xs">
                      {cluster.count} reports
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Most Active Users */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Most Active Contributors
            </h3>
            <div className="space-y-2">
              {insights.most_active_users.map((user, idx) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{user.user_name}</p>
                      <p className="text-slate-400 text-xs">
                        {user.feedback_count} feedback items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {user.avg_sentiment > 0.2 ? (
                      <ThumbsUp className="w-4 h-4 text-green-400" />
                    ) : user.avg_sentiment < -0.2 ? (
                      <ThumbsDown className="w-4 h-4 text-red-400" />
                    ) : (
                      <span className="text-slate-500 text-xs">Neutral</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cluster Detail Modal */}
      {selectedCluster && (
        <ClusterDetailModal
          cluster={selectedCluster}
          onClose={() => setSelectedCluster(null)}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ClusterCard({ cluster, rank, onClick }: any) {
  const categoryColors: Record<string, string> = {
    bug: 'border-red-500/30 bg-red-900/10',
    feature_request: 'border-blue-500/30 bg-blue-900/10',
    ux_issue: 'border-yellow-500/30 bg-yellow-900/10',
    praise: 'border-green-500/30 bg-green-900/10',
    question: 'border-purple-500/30 bg-purple-900/10',
    complaint: 'border-orange-500/30 bg-orange-900/10',
    other: 'border-slate-500/30 bg-slate-900/10'
  };

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500',
    investigating: 'bg-yellow-500',
    planned: 'bg-purple-500',
    in_progress: 'bg-orange-500',
    resolved: 'bg-green-500',
    wont_fix: 'bg-slate-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all ${
        categoryColors[cluster.category] || 'border-slate-700 bg-slate-800/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {rank && (
              <span className="text-slate-400 font-bold text-lg">#{rank}</span>
            )}
            <h3 className="text-white font-semibold text-lg">{cluster.title}</h3>
          </div>
          <p className="text-slate-400 text-sm">{cluster.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span className="text-white font-semibold">{cluster.count}</span>
          <span className="text-slate-400 text-sm">reports</span>
        </div>

        {cluster.trend === 'rising' && (
          <div className="flex items-center gap-1 text-orange-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Rising</span>
          </div>
        )}

        {cluster.urgency_score >= 80 && (
          <div className="flex items-center gap-1 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Urgent</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs text-white ${
              statusColors[cluster.status]
            }`}
          >
            {cluster.status.replace('_', ' ')}
          </span>
          <span className="text-slate-500 text-xs capitalize">
            {cluster.category.replace('_', ' ')}
          </span>
        </div>

        <div className="text-right">
          <div className="text-white font-bold text-lg">{cluster.priority_score}</div>
          <div className="text-slate-400 text-xs">Priority</div>
        </div>
      </div>
    </motion.div>
  );
}

function ClusterDetailModal({ cluster, onClose }: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-white mb-4">{cluster.title}</h2>
        <p className="text-slate-300 mb-6">{cluster.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Reports</p>
            <p className="text-2xl font-bold text-white">{cluster.count}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Priority</p>
            <p className="text-2xl font-bold text-white">{cluster.priority_score}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Urgency</p>
            <p className="text-2xl font-bold text-white">{cluster.urgency_score}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Impact</p>
            <p className="text-2xl font-bold text-white">{cluster.impact_score}</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-slate-400 text-sm mb-2">Category</p>
            <span className="px-3 py-1 bg-slate-800 rounded-full text-white capitalize">
              {cluster.category.replace('_', ' ')}
            </span>
          </div>

          <div>
            <p className="text-slate-400 text-sm mb-2">Status</p>
            <span className="px-3 py-1 bg-blue-500 rounded-full text-white capitalize">
              {cluster.status.replace('_', ' ')}
            </span>
          </div>

          <div>
            <p className="text-slate-400 text-sm mb-2">Trend</p>
            <div className="flex items-center gap-2">
              {cluster.trend === 'rising' && (
                <div className="flex items-center gap-1 text-orange-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Rising</span>
                </div>
              )}
              {cluster.trend === 'declining' && (
                <div className="flex items-center gap-1 text-green-400">
                  <TrendingDown className="w-4 h-4" />
                  <span>Declining</span>
                </div>
              )}
              {cluster.trend === 'stable' && (
                <span className="text-slate-400">Stable</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-2">First Seen</p>
              <p className="text-white">{new Date(cluster.first_seen).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Last Seen</p>
              <p className="text-white">{new Date(cluster.last_seen).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <Button onClick={onClose} className="w-full bg-cyan-500 hover:bg-cyan-600">
          Close
        </Button>
      </motion.div>
    </motion.div>
  );
}
