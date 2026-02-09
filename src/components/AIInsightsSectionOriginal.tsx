import { memo, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Settings, TrendingUp, Clock, Zap, Target, Brain, Waves, Activity } from 'lucide-react';
import { MiniPhaseLockDial } from './PhaseLockDial';
import { ResonanceBadge } from './ResonanceBadge';

export interface AIInsightsContent {
  title?: string;
  mode?: 'full' | 'simple';
  insights?: {
    title: string;
    value: string;
    icon?: 'brain' | 'target' | 'zap' | 'clock' | 'trending';
    description?: string;
  }[];
}

interface AIInsightsSectionProps {
  isOpen: boolean;
  content?: AIInsightsContent;
}

export const AIInsightsSection = memo(function AIInsightsSection({ isOpen, content }: AIInsightsSectionProps) {
  const [animate, setAnimate] = useState(false);

  // Trigger animations when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setAnimate(false);
      const timer = setTimeout(() => setAnimate(true), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
    }
  }, [isOpen, content]);

  // Use full mode by default (with charts and graphs)
  const mode = content?.mode || 'full';

  // For simple mode, render simple insights
  if (mode === 'simple' && content?.insights) {
    const getIcon = (iconName?: string) => {
      switch (iconName) {
        case 'brain':
          return Brain;
        case 'target':
          return Target;
        case 'zap':
          return Zap;
        case 'clock':
          return Clock;
        case 'trending':
          return TrendingUp;
        default:
          return Brain;
      }
    };

    const getIconColor = (iconName?: string) => {
      switch (iconName) {
        case 'brain':
          return 'text-purple-400';
        case 'target':
          return 'text-blue-400';
        case 'zap':
          return 'text-yellow-400';
        case 'clock':
          return 'text-cyan-400';
        case 'trending':
          return 'text-green-400';
        default:
          return 'text-purple-400';
      }
    };

    return (
      <div className="h-full flex flex-col bg-[#1a1c20]">
        {/* Header */}
        <div className="flex items-center justify-center px-4 py-4 border-b border-gray-800 relative">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h2 className="text-white">{content.title || 'AI Insights'}</h2>
          </div>
          <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white transition-colors absolute right-4" />
        </div>

        {/* Content - Simple Insights */}
        <div className="flex-1 flex flex-col justify-center p-4 gap-4 overflow-auto">
          {content.insights.map((insight, index) => {
            const IconComponent = getIcon(insight.icon);
            const iconColor = getIconColor(insight.icon);

            return (
              <motion.div
                key={index}
                className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0"
                initial={{ opacity: 0, x: 20 }}
                animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <IconComponent className={`w-3 h-3 ${iconColor}`} />
                  <p className="text-white text-xs">{insight.title}</p>
                </div>
                <p className="text-gray-400 text-xs leading-tight mb-1">
                  {insight.value}
                </p>
                {insight.description && (
                  <p className="text-gray-500 text-[10px] leading-tight">
                    {insight.description}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // FULL MODE - Original dashboard with charts and graphs
  // Bar chart data
  const barData = [
    { height: 45, color: 'from-purple-600 to-purple-400', label: 'Mon' },
    { height: 65, color: 'from-blue-600 to-blue-400', label: 'Tue' },
    { height: 85, color: 'from-purple-600 to-purple-400', label: 'Wed' },
    { height: 100, color: 'from-blue-600 to-blue-400', label: 'Thu' },
    { height: 75, color: 'from-purple-600 to-purple-400', label: 'Fri' },
  ];

  // Line chart data for energy levels
  const energyData = [65, 75, 60, 85, 70, 90, 80];
  const maxEnergy = Math.max(...energyData);
  const minEnergy = Math.min(...energyData);
  const range = maxEnergy - minEnergy;
  
  // Task completion data
  const taskData = [
    { day: 'Mon', completed: 8, total: 10 },
    { day: 'Tue', completed: 9, total: 10 },
    { day: 'Wed', completed: 7, total: 10 },
    { day: 'Thu', completed: 10, total: 10 },
    { day: 'Fri', completed: 8, total: 10 },
  ];

  return (
    <div className="h-full flex flex-col bg-[#1a1c20]">
      {/* Header */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-gray-800 relative">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h2 className="text-white">{content?.title || 'AI Insights'}</h2>
        </div>
        <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white transition-colors absolute right-4" />
      </div>

      {/* Content - Centered Vertically with Even Spacing */}
      <div className="flex-1 flex flex-col justify-center p-4 gap-5 overflow-hidden">
        
        {/* AI Analysis */}
        <motion.div 
          className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-3 h-3 text-purple-400" />
            <p className="text-white text-xs">AI Analysis</p>
          </div>
          <p className="text-gray-400 text-xs leading-tight">
            Low Energy Mode Active - Conversation Extraction: PMI
          </p>
        </motion.div>

        {/* Goal Progress Bar Chart */}
        <motion.div 
          className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Target className="w-3 h-3 text-blue-400" />
              <p className="text-white text-xs">Weekly Goals</p>
            </div>
            <span className="text-gray-400 text-xs">85%</span>
          </div>
          
          <div className="flex items-end justify-between gap-1.5 h-24 mb-2">
            {barData.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div 
                  className={`w-full bg-gradient-to-t ${bar.color} rounded-t`}
                  initial={{ height: 0 }}
                  animate={animate ? { height: `${bar.height}%` } : { height: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                />
                <span className="text-gray-500 text-[10px]">{bar.label[0]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Energy Levels Line Chart */}
        <motion.div 
          className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-yellow-400" />
              <p className="text-white text-xs">Energy Levels</p>
            </div>
            <span className="text-gray-400 text-xs">This Week</span>
          </div>
          
          <div className="relative h-20 mb-1">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-full h-px bg-gray-800/50" />
              ))}
            </div>

            {/* Line chart with proper connection */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="energyFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Area fill */}
              <motion.path
                d={`M 0 ${100 - ((energyData[0] - minEnergy) / range) * 80 - 10} ${energyData.map((val, i) => 
                  `L ${(i / (energyData.length - 1)) * 100} ${100 - ((val - minEnergy) / range) * 80 - 10}`
                ).join(' ')} L 100 100 L 0 100 Z`}
                fill="url(#energyFill)"
                initial={{ opacity: 0 }}
                animate={animate ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              />
              
              {/* Line */}
              <motion.path
                d={`M 0 ${100 - ((energyData[0] - minEnergy) / range) * 80 - 10} ${energyData.map((val, i) => 
                  `L ${(i / (energyData.length - 1)) * 100} ${100 - ((val - minEnergy) / range) * 80 - 10}`
                ).join(' ')}`}
                fill="none"
                stroke="url(#energyGradient)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={animate ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              />
            </svg>

            {/* Data points */}
            <div className="absolute inset-0">
              {energyData.map((val, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-lg border border-yellow-300"
                  style={{
                    left: `${(i / (energyData.length - 1)) * 100}%`,
                    top: `${100 - ((val - minEnergy) / range) * 80 - 10}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  initial={{ scale: 0 }}
                  animate={animate ? { scale: 1 } : { scale: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Mon</span>
            <span>Sun</span>
          </div>
        </motion.div>

        {/* Task Completion */}
        <motion.div 
          className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <p className="text-white text-xs">Task Completion</p>
          </div>
          
          <div className="space-y-2.5">
            {taskData.map((task, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                  <span>{task.day}</span>
                  <span>{task.completed}/{task.total}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={animate ? { width: `${(task.completed / task.total) * 100}%` } : { width: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 + i * 0.08, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Resonance Engine Stats */}
        <motion.div 
          className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            <Waves className="w-3 h-3 text-teal-400" />
            <p className="text-white text-xs">Resonance Engine</p>
          </div>
          
          <div className="space-y-2">
            {[
              { label: 'Rhythm Alignment', value: 92, color: 'bg-teal-500' },
              { label: 'Phase Lock', value: 87, color: 'bg-purple-500' },
              { label: 'Flow Probability', value: 78, color: 'bg-blue-500' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                  <span>{stat.label}</span>
                  <span>{stat.value}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${stat.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={animate ? { width: `${stat.value}%` } : { width: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 + i * 0.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cognitive Load Distribution */}
        <motion.div 
          className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 1.0 }}
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            <Activity className="w-3 h-3 text-amber-400" />
            <p className="text-white text-xs">Cognitive Load</p>
          </div>
          
          <div className="flex items-end justify-between gap-1 h-16">
            {[
              { hour: '9A', load: 45, color: 'from-green-600 to-green-400' },
              { hour: '11A', load: 70, color: 'from-yellow-600 to-yellow-400' },
              { hour: '1P', load: 85, color: 'from-amber-600 to-amber-400' },
              { hour: '3P', load: 60, color: 'from-yellow-600 to-yellow-400' },
              { hour: '5P', load: 40, color: 'from-green-600 to-green-400' },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <motion.div 
                  className={`w-full bg-gradient-to-t ${bar.color} rounded-t`}
                  initial={{ height: 0 }}
                  animate={animate ? { height: `${bar.load}%` } : { height: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 + i * 0.08, ease: 'easeOut' }}
                />
                <span className="text-gray-500 text-[9px]">{bar.hour}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Focus Times */}
        <motion.div 
          className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 1.2 }}
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            <Clock className="w-3 h-3 text-cyan-400" />
            <p className="text-white text-xs">Peak Focus Windows</p>
          </div>
          
          <div className="space-y-2.5">
            {[
              { time: '9-11 AM', percentage: 75, color: 'bg-cyan-500' },
              { time: '2-4 PM', percentage: 90, color: 'bg-blue-500' },
              { time: '7-9 PM', percentage: 60, color: 'bg-purple-500' },
            ].map((period, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                  <span>{period.time}</span>
                  <span>{period.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${period.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={animate ? { width: `${period.percentage}%` } : { width: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 + i * 0.08, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity Distribution - Radial Progress */}
        <motion.div 
          className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 1.0 }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Target className="w-3 h-3 text-orange-400" />
            <p className="text-white text-xs">Activity Distribution</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Work', percentage: 65, color: '#3b82f6' },
              { label: 'Focus', percentage: 85, color: '#8b5cf6' },
              { label: 'Break', percentage: 40, color: '#10b981' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="relative w-12 h-12 mb-1">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="#2a2d35"
                      strokeWidth="4"
                    />
                    <motion.circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                      animate={animate ? { 
                        strokeDashoffset: 2 * Math.PI * 20 * (1 - item.percentage / 100) 
                      } : { 
                        strokeDashoffset: 2 * Math.PI * 20 
                      }}
                      transition={{ duration: 1, delay: 1.1 + i * 0.1, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-[10px]">{item.percentage}%</span>
                  </div>
                </div>
                <span className="text-gray-400 text-[9px]">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-2 gap-2 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 1.2 }}
        >
          {[
            { label: 'Tasks', value: '142', icon: Target, color: 'text-blue-400' },
            { label: 'Hours', value: '28.5', icon: Clock, color: 'text-cyan-400' },
            { label: 'Streak', value: '28d', icon: Zap, color: 'text-yellow-400' },
            { label: 'Rate', value: '85%', icon: TrendingUp, color: 'text-green-400' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="bg-[#1e2128] rounded-lg p-3 border border-gray-800"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={animate ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, delay: 1.3 + i * 0.05 }}
            >
              <stat.icon className={`w-3 h-3 ${stat.color} mb-1.5`} />
              <p className="text-white text-sm">{stat.value}</p>
              <p className="text-gray-400 text-[10px]">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* NEW: Phase Resonance Indicator */}
        <motion.div 
          className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 1.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Waves className="w-3 h-3 text-teal-400" />
              <p className="text-white text-xs">🎵 In Tune?</p>
            </div>
            <MiniPhaseLockDial alignment={0.82} size={28} />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Task Harmony</span>
              <ResonanceBadge score={0.67} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Flow Ready</span>
              <ResonanceBadge score={0.78} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Good Timing</span>
              <ResonanceBadge score={0.42} size="sm" />
            </div>
          </div>
        </motion.div>

        {/* NEW: Weekly Goals Progress with actual data */}
        <motion.div 
          className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 1.4 }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Target className="w-3 h-3 text-purple-400" />
              <p className="text-white text-xs">Weekly Goals</p>
            </div>
            <span className="text-purple-400 text-xs font-medium">6/8</span>
          </div>
          
          <div className="space-y-2">
            {[
              { name: 'Launch MVP', progress: 100, color: 'from-green-600 to-green-400' },
              { name: 'Client Calls', progress: 75, color: 'from-purple-600 to-purple-400' },
              { name: 'Workout 5x', progress: 80, color: 'from-blue-600 to-blue-400' },
              { name: 'Read 2 Books', progress: 50, color: 'from-amber-600 to-amber-400' },
              { name: 'Budget Review', progress: 100, color: 'from-green-600 to-green-400' },
              { name: 'Team 1:1s', progress: 60, color: 'from-teal-600 to-teal-400' },
            ].map((goal, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                  <span className="truncate max-w-[120px]">{goal.name}</span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${goal.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={animate ? { width: `${goal.progress}%` } : { width: 0 }}
                    transition={{ duration: 0.6, delay: 1.5 + i * 0.06, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* NEW: Interference Pattern Visualization */}
        <motion.div 
          className="bg-[#1e2128] rounded-lg p-3 border border-gray-800 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 1.5 }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Activity className="w-3 h-3 text-cyan-400" />
            <p className="text-white text-xs">✨ How Tasks Pair</p>
          </div>
          
          {/* Wave interference visualization */}
          <div className="relative h-16 bg-gray-900/50 rounded overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              
              {/* Constructive wave areas (amplified) */}
              <motion.path
                d="M 0 50 Q 15 30, 30 50 T 60 50 Q 75 30, 90 50 L 100 50 L 100 100 L 0 100 Z"
                fill="url(#waveGradient)"
                initial={{ opacity: 0 }}
                animate={animate ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.8, delay: 1.6 }}
              />
              
              {/* Wave line */}
              <motion.path
                d="M 0 50 Q 15 30, 30 50 T 60 50 Q 75 30, 90 50 L 100 50"
                fill="none"
                stroke="#0d9488"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={animate ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 1.2, delay: 1.6, ease: 'easeOut' }}
              />
            </svg>
          </div>
          
          <div className="mt-2 flex justify-between text-[9px] text-gray-500">
            <span>Good Pair</span>
            <span className="text-teal-400">+0.67</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
});
