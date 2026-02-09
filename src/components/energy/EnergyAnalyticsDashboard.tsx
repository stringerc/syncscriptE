/**
 * EnergyAnalyticsDashboard Component
 * 
 * PHASE 4 & 5: Complete Energy Analytics Dashboard
 * 
 * Comprehensive analytics view showing:
 * - 7-day energy trends
 * - Source breakdown
 * - Peak performance insights
 * - AI-powered recommendations
 * - Prediction display
 * - Adaptive difficulty status
 */

import React from 'react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { TrendingUp, TrendingDown, Zap, Target, Brain, Calendar, Award, Flame } from 'lucide-react';
import { useEnergy } from '../../hooks/useEnergy';
import { useEnergyPrediction, getPredictionStatus } from '../../hooks/useEnergyPrediction';
import { useResonanceEnergyMultiplier } from '../../hooks/useResonanceEnergyMultiplier';
import { useAdaptiveDifficulty, getPerformanceFeedback } from '../../hooks/useAdaptiveDifficulty';
import { motion } from 'motion/react';

interface EnergyAnalyticsDashboardProps {
  className?: string;
}

const ROYGBIV_COLORS = {
  Red: '#ef4444',
  Orange: '#f97316',
  Yellow: '#eab308',
  Green: '#22c55e',
  Blue: '#3b82f6',
  Indigo: '#6366f1',
  Violet: '#8b5cf6',
};

const SOURCE_COLORS = {
  tasks: '#14b8a6',
  goals: '#8b5cf6',
  milestones: '#f59e0b',
  achievements: '#eab308',
  health: '#22c55e',
};

export function EnergyAnalyticsDashboard({ className }: EnergyAnalyticsDashboardProps) {
  const { energy } = useEnergy();
  const prediction = useEnergyPrediction('Green');
  const resonance = useResonanceEnergyMultiplier();
  const difficulty = useAdaptiveDifficulty();
  
  // Prepare 7-day trend data
  const weeklyData = React.useMemo(() => {
    const history = energy.dailyHistory || [];
    const last7Days = history.slice(-7);
    
    return last7Days.map((day, index) => ({
      day: new Date(day.date || Date.now()).toLocaleDateString('en-US', { weekday: 'short' }),
      energy: day.totalEnergy || 0,
      color: getColorForEnergy(day.totalEnergy || 0),
    }));
  }, [energy.dailyHistory]);
  
  // Source breakdown data
  const sourceData = React.useMemo(() => {
    return Object.entries(energy.bySource).map(([source, amount]) => ({
      name: source.charAt(0).toUpperCase() + source.slice(1),
      value: amount,
      color: SOURCE_COLORS[source as keyof typeof SOURCE_COLORS] || '#6b7280',
    }));
  }, [energy.bySource]);
  
  // Find best day
  const bestDay = React.useMemo(() => {
    const history = energy.dailyHistory || [];
    if (history.length === 0) return null;
    
    return history.reduce((best, day) => {
      return (day.totalEnergy || 0) > (best.totalEnergy || 0) ? day : best;
    });
  }, [energy.dailyHistory]);
  
  // Prediction status
  const predictionStatus = getPredictionStatus(prediction);
  
  // Performance feedback
  const performanceFeedback = getPerformanceFeedback(
    difficulty.performance.performanceRating,
    difficulty.performance.avgLevel
  );
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Energy Analytics</h2>
        <p className="text-gray-400">Comprehensive insights into your energy patterns</p>
      </div>
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Energy */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Current Energy</p>
              <p className="text-3xl font-bold text-white mt-1">{energy.totalEnergy}</p>
            </div>
            <div className="text-4xl">⚡</div>
          </div>
        </Card>
        
        {/* Today's Prediction */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Predicted Today</p>
              <p className="text-3xl font-bold" style={{ color: prediction.predictedColor }}>
                {prediction.predictedEnergy}
              </p>
              <p className="text-xs text-gray-500 mt-1">{prediction.predictedColorName}</p>
            </div>
            <div className="text-2xl">{predictionStatus.icon}</div>
          </div>
        </Card>
        
        {/* Resonance Status */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Resonance</p>
              <p className="text-3xl font-bold text-white mt-1">{resonance.avgResonance}%</p>
              <Badge className="mt-2" variant={
                resonance.status === 'flow' ? 'default' : 
                resonance.status === 'high' ? 'secondary' : 'outline'
              }>
                {resonance.status.toUpperCase()}
              </Badge>
            </div>
            <div className="text-4xl">🎵</div>
          </div>
        </Card>
        
        {/* Difficulty Tier */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Difficulty</p>
              <p className="text-2xl font-bold text-white mt-1">{difficulty.tier.name}</p>
              <p className="text-xs text-gray-500 mt-1">×{difficulty.tier.multiplier}</p>
            </div>
            <div className="text-4xl">{performanceFeedback.icon}</div>
          </div>
        </Card>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Trend */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            7-Day Energy Trend
          </h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="energy" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        
        {/* Source Breakdown */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Energy Sources
          </h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      {/* Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Best Day */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Peak Performance
          </h3>
          
          {bestDay ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Best Day</p>
                <p className="text-lg font-semibold text-white">
                  {new Date(bestDay.date || Date.now()).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Energy Reached</p>
                <p className="text-2xl font-bold text-green-400">{bestDay.totalEnergy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Color Achieved</p>
                <Badge style={{ backgroundColor: getColorForEnergy(bestDay.totalEnergy || 0) }}>
                  {getColorNameForEnergy(bestDay.totalEnergy || 0)}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No data yet. Keep tracking!</p>
          )}
        </Card>
        
        {/* AI Insights */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            AI Insights
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="text-lg mt-1">🎯</div>
              <div>
                <p className="text-sm text-gray-300">{resonance.getResonanceInsight()}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="text-lg mt-1">💪</div>
              <div>
                <p className="text-sm text-gray-300">{performanceFeedback.message}</p>
              </div>
            </div>
            
            {resonance.inHarmony && (
              <div className="flex items-start gap-2">
                <div className="text-lg mt-1">🌊</div>
                <div>
                  <p className="text-sm text-green-300">You're in FLOW state! Peak productivity!</p>
                </div>
              </div>
            )}
          </div>
        </Card>
        
        {/* Recommendations */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Recommendations
          </h3>
          
          <div className="space-y-2">
            {prediction.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Remaining Potential</p>
            <div className="flex items-center gap-2">
              <Progress value={(prediction.remainingPotential / 200) * 100} className="flex-1" />
              <span className="text-sm font-semibold text-white">{prediction.remainingPotential}</span>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Prediction Details */}
      <Card className="p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Today's Prediction
            </h3>
            <p className="text-sm text-gray-300 mb-4">{predictionStatus.message}</p>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400">Confidence</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={prediction.confidence * 100} className="flex-1" />
                  <span className="text-sm text-white font-semibold">
                    {Math.round(prediction.confidence * 100)}%
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-400">Tasks Remaining</p>
                <p className="text-2xl font-bold text-white mt-1">{prediction.tasksRemaining}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-400">Hours Left</p>
                <p className="text-2xl font-bold text-white mt-1">{prediction.hoursRemaining}h</p>
              </div>
            </div>
          </div>
          
          <div className="text-6xl">{predictionStatus.icon}</div>
        </div>
      </Card>
    </div>
  );
}

// Helper functions
function getColorForEnergy(energy: number): string {
  if (energy >= 600) return ROYGBIV_COLORS.Violet;
  if (energy >= 500) return ROYGBIV_COLORS.Indigo;
  if (energy >= 400) return ROYGBIV_COLORS.Blue;
  if (energy >= 300) return ROYGBIV_COLORS.Green;
  if (energy >= 200) return ROYGBIV_COLORS.Yellow;
  if (energy >= 100) return ROYGBIV_COLORS.Orange;
  return ROYGBIV_COLORS.Red;
}

function getColorNameForEnergy(energy: number): string {
  if (energy >= 600) return 'Violet';
  if (energy >= 500) return 'Indigo';
  if (energy >= 400) return 'Blue';
  if (energy >= 300) return 'Green';
  if (energy >= 200) return 'Yellow';
  if (energy >= 100) return 'Orange';
  return 'Red';
}
