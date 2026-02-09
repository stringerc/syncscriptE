/**
 * Customer Service Performance Analytics
 * World-class metrics and insights for continuous improvement
 * 
 * Research-backed metrics:
 * - CSAT (Customer Satisfaction Score): Industry benchmark 86% (Zendesk)
 * - NPS (Net Promoter Score): World-class is 50+ (Bain & Company)
 * - CES (Customer Effort Score): Lower is better, target <2 (Gartner)
 * - First Response Time: 90th percentile <10min (HubSpot)
 * - Resolution Time: Target <24hrs (Forrester)
 * - Quality Score: Multi-factor analysis of response quality
 */

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  TrendingUp, TrendingDown, Clock, Target, Heart, Zap,
  ThumbsUp, ThumbsDown, Award, AlertCircle, BarChart3,
  Users, MessageCircle, CheckCircle, Star
} from 'lucide-react';

export interface PerformanceMetrics {
  // Satisfaction Metrics
  csat: {
    score: number; // 0-100
    responses: number;
    trend: 'up' | 'down' | 'stable';
    breakdown: { 1: number; 2: number; 3: number; 4: number; 5: number };
  };
  nps: {
    score: number; // -100 to 100
    promoters: number;
    passives: number;
    detractors: number;
    trend: 'up' | 'down' | 'stable';
  };
  ces: {
    score: number; // 1-7 (lower is better)
    responses: number;
    trend: 'up' | 'down' | 'stable';
  };
  
  // Speed Metrics
  responseTime: {
    average: number; // minutes
    median: number;
    p90: number; // 90th percentile
    p95: number;
    firstResponseGoal: number;
    goalAchievementRate: number; // percentage
  };
  resolutionTime: {
    average: number; // hours
    median: number;
    p90: number;
    resolutionGoal: number;
    goalAchievementRate: number;
  };
  
  // Quality Metrics
  qualityScore: {
    overall: number; // 0-100
    empathy: number;
    completeness: number;
    clarity: number;
    accuracy: number;
  };
  
  // Volume Metrics
  volume: {
    total: number;
    pending: number;
    resolved: number;
    avgPerDay: number;
    peakHours: Array<{ hour: number; count: number }>;
  };
  
  // Team Performance
  team: {
    totalAgents: number;
    avgEmailsPerAgent: number;
    topPerformer: {
      name: string;
      emailsHandled: number;
      avgQuality: number;
      avgCSAT: number;
    };
  };
}

/**
 * Calculate CSAT (Customer Satisfaction Score)
 * Research: Scores 4-5 are "satisfied", benchmark is 86% (Zendesk 2024)
 */
export function calculateCSAT(ratings: number[]): PerformanceMetrics['csat'] {
  if (ratings.length === 0) {
    return {
      score: 0,
      responses: 0,
      trend: 'stable',
      breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(rating => {
    if (rating >= 1 && rating <= 5) {
      breakdown[rating as keyof typeof breakdown]++;
    }
  });

  const satisfied = (breakdown[4] + breakdown[5]);
  const score = (satisfied / ratings.length) * 100;

  // Calculate trend (compare last 10 vs previous 10)
  const recent = ratings.slice(-10);
  const previous = ratings.slice(-20, -10);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const previousAvg = previous.length > 0 ? previous.reduce((a, b) => a + b, 0) / previous.length : recentAvg;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (recentAvg > previousAvg + 0.3) trend = 'up';
  if (recentAvg < previousAvg - 0.3) trend = 'down';

  return {
    score: Math.round(score),
    responses: ratings.length,
    trend,
    breakdown
  };
}

/**
 * Calculate NPS (Net Promoter Score)
 * Research: World-class NPS is 50+, good is 30+ (Bain & Company)
 */
export function calculateNPS(scores: number[]): PerformanceMetrics['nps'] {
  if (scores.length === 0) {
    return { score: 0, promoters: 0, passives: 0, detractors: 0, trend: 'stable' };
  }

  const promoters = scores.filter(s => s >= 9).length;
  const passives = scores.filter(s => s >= 7 && s < 9).length;
  const detractors = scores.filter(s => s < 7).length;
  
  const score = Math.round(((promoters - detractors) / scores.length) * 100);

  // Trend calculation
  const recent = scores.slice(-10);
  const previous = scores.slice(-20, -10);
  const recentScore = recent.length > 0 ? ((recent.filter(s => s >= 9).length - recent.filter(s => s < 7).length) / recent.length) * 100 : 0;
  const previousScore = previous.length > 0 ? ((previous.filter(s => s >= 9).length - previous.filter(s => s < 7).length) / previous.length) * 100 : recentScore;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (recentScore > previousScore + 10) trend = 'up';
  if (recentScore < previousScore - 10) trend = 'down';

  return { score, promoters, passives, detractors, trend };
}

/**
 * Calculate CES (Customer Effort Score)
 * Research: Lower is better, excellent is <2, poor is >4 (Gartner)
 */
export function calculateCES(scores: number[]): PerformanceMetrics['ces'] {
  if (scores.length === 0) {
    return { score: 0, responses: 0, trend: 'stable' };
  }

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Trend
  const recent = scores.slice(-10);
  const previous = scores.slice(-20, -10);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const previousAvg = previous.length > 0 ? previous.reduce((a, b) => a + b, 0) / previous.length : recentAvg;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (recentAvg > previousAvg + 0.5) trend = 'up'; // Up is bad for CES!
  if (recentAvg < previousAvg - 0.5) trend = 'down'; // Down is good!

  return {
    score: parseFloat(avgScore.toFixed(2)),
    responses: scores.length,
    trend
  };
}

/**
 * Performance Dashboard Component
 */
export function PerformanceDashboard({ metrics }: { metrics: PerformanceMetrics }) {
  const csatColor = metrics.csat.score >= 85 ? 'text-green-400' : 
                   metrics.csat.score >= 70 ? 'text-yellow-400' : 'text-red-400';
  
  const npsColor = metrics.nps.score >= 50 ? 'text-green-400' :
                  metrics.nps.score >= 30 ? 'text-yellow-400' : 
                  metrics.nps.score >= 0 ? 'text-orange-400' : 'text-red-400';
  
  const cesColor = metrics.ces.score <= 2 ? 'text-green-400' :
                  metrics.ces.score <= 3 ? 'text-yellow-400' : 'text-red-400';

  const TrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <span className="text-gray-400">→</span>;
  };

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {/* CSAT */}
        <Card className="p-6 bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-semibold text-white">CSAT</h3>
            </div>
            {TrendIcon(metrics.csat.trend)}
          </div>
          <p className={`text-4xl font-bold ${csatColor} mb-2`}>{metrics.csat.score}%</p>
          <p className="text-xs text-gray-400">{metrics.csat.responses} responses</p>
          <div className="mt-4 pt-4 border-t border-green-500/20">
            <p className="text-xs text-gray-400 mb-2">Rating Distribution</p>
            <div className="flex gap-1">
              {Object.entries(metrics.csat.breakdown).map(([rating, count]) => {
                const percentage = (count / metrics.csat.responses) * 100;
                return (
                  <div key={rating} className="flex-1">
                    <div 
                      className={`h-2 rounded ${parseInt(rating) >= 4 ? 'bg-green-500' : 'bg-gray-600'}`}
                      style={{ height: `${Math.max(8, percentage)}px` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* NPS */}
        <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">NPS</h3>
            </div>
            {TrendIcon(metrics.nps.trend)}
          </div>
          <p className={`text-4xl font-bold ${npsColor} mb-2`}>{metrics.nps.score}</p>
          <p className="text-xs text-gray-400">
            {metrics.nps.score >= 50 ? 'World-class! 🏆' : 
             metrics.nps.score >= 30 ? 'Good performance 👍' :
             metrics.nps.score >= 0 ? 'Room for improvement' : 'Needs attention ⚠️'}
          </p>
          <div className="mt-4 pt-4 border-t border-blue-500/20 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-green-400 font-bold">{metrics.nps.promoters}</p>
              <p className="text-gray-400">Promoters</p>
            </div>
            <div>
              <p className="text-yellow-400 font-bold">{metrics.nps.passives}</p>
              <p className="text-gray-400">Passives</p>
            </div>
            <div>
              <p className="text-red-400 font-bold">{metrics.nps.detractors}</p>
              <p className="text-gray-400">Detractors</p>
            </div>
          </div>
        </Card>

        {/* CES */}
        <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">CES</h3>
            </div>
            {/* For CES, down trend is good */}
            {metrics.ces.trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-green-400" />
            ) : metrics.ces.trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-red-400" />
            ) : (
              <span className="text-gray-400">→</span>
            )}
          </div>
          <p className={`text-4xl font-bold ${cesColor} mb-2`}>{metrics.ces.score}</p>
          <p className="text-xs text-gray-400">{metrics.ces.responses} responses</p>
          <div className="mt-4 pt-4 border-t border-purple-500/20">
            <p className="text-xs text-gray-400">
              {metrics.ces.score <= 2 ? '🎉 Effortless experience!' :
               metrics.ces.score <= 3 ? 'Good, but room to improve' :
               '⚠️ Customers working too hard'}
            </p>
          </div>
        </Card>
      </div>

      {/* Speed Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">Response Time</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{metrics.responseTime.average.toFixed(0)}m</p>
              <p className="text-xs text-gray-400">Average</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.responseTime.p90.toFixed(0)}m</p>
              <p className="text-xs text-gray-400">90th Percentile</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Goal Achievement</span>
              <span className={`text-xs font-bold ${
                metrics.responseTime.goalAchievementRate >= 90 ? 'text-green-400' :
                metrics.responseTime.goalAchievementRate >= 75 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {metrics.responseTime.goalAchievementRate.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  metrics.responseTime.goalAchievementRate >= 90 ? 'bg-green-500' :
                  metrics.responseTime.goalAchievementRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metrics.responseTime.goalAchievementRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Goal: {'<'}{metrics.responseTime.firstResponseGoal}m
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Resolution Time</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{metrics.resolutionTime.average.toFixed(1)}h</p>
              <p className="text-xs text-gray-400">Average</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.resolutionTime.p90.toFixed(1)}h</p>
              <p className="text-xs text-gray-400">90th Percentile</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Goal Achievement</span>
              <span className={`text-xs font-bold ${
                metrics.resolutionTime.goalAchievementRate >= 90 ? 'text-green-400' :
                metrics.resolutionTime.goalAchievementRate >= 75 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {metrics.resolutionTime.goalAchievementRate.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  metrics.resolutionTime.goalAchievementRate >= 90 ? 'bg-green-500' :
                  metrics.resolutionTime.goalAchievementRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metrics.resolutionTime.goalAchievementRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Goal: {'<'}{metrics.resolutionTime.resolutionGoal}h
            </p>
          </div>
        </Card>
      </div>

      {/* Quality Score */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">Response Quality Score</h3>
          <Badge className={`ml-auto ${
            metrics.qualityScore.overall >= 85 ? 'bg-green-500' :
            metrics.qualityScore.overall >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          } text-white`}>
            {metrics.qualityScore.overall}/100
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-pink-400">{metrics.qualityScore.empathy}</p>
            <p className="text-xs text-gray-400 mt-1">Empathy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{metrics.qualityScore.completeness}</p>
            <p className="text-xs text-gray-400 mt-1">Completeness</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{metrics.qualityScore.clarity}</p>
            <p className="text-xs text-gray-400 mt-1">Clarity</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{metrics.qualityScore.accuracy}</p>
            <p className="text-xs text-gray-400 mt-1">Accuracy</p>
          </div>
        </div>
      </Card>

      {/* Volume & Team */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Email Volume</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{metrics.volume.total}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{metrics.volume.pending}</p>
              <p className="text-xs text-gray-400">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{metrics.volume.resolved}</p>
              <p className="text-xs text-gray-400">Resolved</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400">Average per day: <span className="text-white font-medium">{metrics.volume.avgPerDay.toFixed(1)}</span></p>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Top Performer</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">{metrics.team.topPerformer.name}</p>
              <div className="flex gap-3 text-xs text-gray-400 mt-1">
                <span>{metrics.team.topPerformer.emailsHandled} emails</span>
                <span>•</span>
                <span>{metrics.team.topPerformer.avgQuality}/100 quality</span>
                <span>•</span>
                <span>{metrics.team.topPerformer.avgCSAT}% CSAT</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Benchmark Comparison */}
      <Card className="p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          Industry Benchmark Comparison
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <p className="text-gray-400 mb-1">CSAT</p>
            <p className={`text-lg font-bold ${csatColor}`}>{metrics.csat.score}%</p>
            <p className="text-gray-500">vs 86% avg</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Response Time</p>
            <p className="text-lg font-bold text-white">{metrics.responseTime.average.toFixed(0)}m</p>
            <p className="text-gray-500">vs 10m goal</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Quality</p>
            <p className="text-lg font-bold text-white">{metrics.qualityScore.overall}</p>
            <p className="text-gray-500">vs 75 avg</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
