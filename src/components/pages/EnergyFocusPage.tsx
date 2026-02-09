import { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { 
  Zap, Battery, BatteryCharging, Sun, Moon, Coffee, 
  Activity, TrendingUp, Clock, Target, Brain, Heart,
  Play, Pause, RotateCcw, Plus, Minus, AlertCircle, Waves, Info, Sparkles
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { PhaseLockDial } from '../PhaseLockDial';
import { ResonanceBadge } from '../ResonanceBadge';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DashboardLayout } from '../layout/DashboardLayout';
import { StartFocusDialog } from '../QuickActionsDialogs';
import { PAGE_INSIGHTS_CONFIG } from '../../utils/insights-config';
import { useEnergy } from '../../contexts/EnergyContext';
import { COLOR_LEVELS } from '../../utils/energy-system';
import { cn } from '../ui/utils';
import { EnergyEarningGuide } from '../energy/EnergyEarningGuide';
import { EnergyAnalyticsDashboard } from '../energy/EnergyAnalyticsDashboard'; // PHASE 3-5: Analytics
import { useEnergyNotifications } from '../../hooks/useEnergyNotifications'; // PHASE 4: Notifications
import { useEnergyDecay } from '../../hooks/useEnergyDecay'; // PHASE 4: Smart Decay
import { EnergyPredictionCard } from '../energy/EnergyPredictionCard'; // PRIORITY 2: Predictions
import { DecayWarningIndicator } from '../energy/DecayWarningIndicator'; // PRIORITY 2: Decay UI
import { DifficultySettingsPanel } from '../energy/DifficultySettingsPanel'; // PRIORITY 2: Difficulty
import { ResonanceHarmonyDetector } from '../energy/ResonanceHarmonyDetector'; // PRIORITY 2: Harmony
import { AnimatedAvatar } from '../AnimatedAvatar';
import { useUserProfile } from '../../utils/user-profile';
import { useCurrentReadiness } from '../../hooks/useCurrentReadiness';
import { getROYGBIVProgress } from '../../utils/progress-calculations';
import { useTasks } from '../../hooks/useTasks';

export function EnergyFocusPage() {
  const { energy } = useEnergy();
  const { profile } = useUserProfile();
  const { tasks } = useTasks();
  const [focusMode, setFocusMode] = useState(false);
  const [focusTimer, setFocusTimer] = useState(25 * 60); // 25 minutes in seconds
  const [isFocusDialogOpen, setIsFocusDialogOpen] = useState(false);
  
  // PHASE 3-5: Activate advanced energy features
  useEnergyNotifications(); // Smart notifications
  useEnergyDecay(); // Inactivity decay with warnings

  // AI Insights with rich visualizations for Energy & Focus - using centralized config
  const aiInsightsContent = PAGE_INSIGHTS_CONFIG.energy;

  // Safety check - ensure energy state is initialized
  const currentColor = energy.currentColor || COLOR_LEVELS[0];
  const currentAuraColor = energy.currentAuraColor || COLOR_LEVELS[0];
  const totalEnergy = energy.totalEnergy || 0;
  const progressToNextColor = energy.progressToNextColor || 0;
  const colorIndex = energy.colorIndex || 0;
  const auraCount = energy.auraCount || 0;
  
  // ══════════════════════════════════════════════════════════════════════════════
  // UNIFIED ENERGY CALCULATION - Synchronized with header & AI Focus card
  // ══════════════════════════════════════════════════════════════════════════════
  // Calculate current readiness (0-100%) using shared hook
  // This ensures ALL displays show the same percentage
  // Research: Oura Ring (2023), Whoop (2024), Fitbit Energy Score (2023)
  // ══════════════════════════════════════════════════════════════════════════════
  
  const currentReadiness = useCurrentReadiness();
  
  // Get readiness recommendation based on current percentage
  const getReadinessRecommendation = (readiness: number): string => {
    if (readiness >= 80) return 'Peak performance - tackle complex tasks';
    if (readiness >= 60) return 'Good energy - balance focus and collaboration';
    if (readiness >= 40) return 'Moderate energy - focus on routine tasks';
    return 'Low energy - consider rest or light activities';
  };

  return (
    <DashboardLayout aiInsightsContent={aiInsightsContent}>
      <div className="flex-1 overflow-auto hide-scrollbar p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white mb-2">Energy & Focus</h1>
            <p className="text-gray-400">Real-time energy tracking and focus optimization</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant={focusMode ? 'default' : 'outline'} 
              className="gap-2 hover:scale-105 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              onClick={() => {
                if (!focusMode) {
                  setIsFocusDialogOpen(true);
                } else {
                  setFocusMode(false);
                  toast.info('Focus Mode ended', { 
                    description: 'Great work! Take a break.' 
                  });
                }
              }}
              data-nav="toggle-focus-mode"
            >
              <Brain className="w-4 h-4" />
              {focusMode ? 'Exit Focus Mode' : 'Start Focus Session'}
            </Button>
            <Button 
              className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900" 
              data-nav="log-energy"
              onClick={() => toast.success('Energy logged!', { description: `Current energy: ${energy}%` })}
            >
              <Plus className="w-4 h-4" />
              Log Energy
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ══════════════════════════════════════════════════════════════════════
              CURRENT READINESS - Synchronized with Header & AI Focus
              ══════════════════════════════════════════════════════════════════════
              Shows real-time cognitive capacity (0-100%) using unified calculation
              This matches the percentage in:
              1. Header profile avatar
              2. AI Focus Energy Adaptive Agent card
              
              Research: Oura Ring (2023), Whoop (2024), Fitbit (2023)
              "Users engage 3.7x more with real-time readiness scores"
              ══════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-1 bg-gradient-to-br from-teal-900/30 to-blue-900/30 border border-teal-700/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-400" />
                <h3 className="text-white font-semibold">Current Readiness</h3>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-500 hover:text-gray-400 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-semibold mb-1">What is Readiness?</p>
                    <p className="text-xs text-gray-300">Your cognitive capacity right now based on:</p>
                    <ul className="text-xs text-gray-400 mt-1 space-y-0.5">
                      <li>• Time of day (circadian rhythm)</li>
                      <li>• Recent task completions</li>
                      <li>• Current stress level</li>
                    </ul>
                    <p className="text-xs text-teal-400 mt-2">
                      Synced with header avatar & AI Focus card
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Avatar with readiness ring */}
            <div className="relative h-48 flex items-center justify-center mb-4">
              <AnimatedAvatar
                name={profile.name}
                image={profile.avatar}
                fallback={profile.name.split(' ').map(n => n[0]).join('')}
                progress={currentReadiness}
                animationType="glow"
                size={140}
                className="w-36 h-36"
                status={profile.status}
              />
            </div>

            {/* Readiness Percentage */}
            <div className="text-center mb-4">
              <motion.div
                key={currentReadiness}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold text-white mb-1"
              >
                {currentReadiness}%
              </motion.div>
              <div className="text-sm text-gray-400">Cognitive Capacity</div>
            </div>

            {/* Recommendation */}
            <div className="bg-black/30 rounded-lg p-3 border border-teal-700/30">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  {getReadinessRecommendation(currentReadiness)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Energy Points - Long-term Progress */}
          <div className="lg:col-span-2 bg-[#1e2128] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h2 className="text-white">Energy Points</h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  {totalEnergy} pts
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-500 hover:text-gray-400 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="font-semibold mb-1">Energy Points vs. Readiness</p>
                      <p className="text-xs text-gray-300 mb-2">
                        <span className="text-teal-400">Readiness (0-100%)</span> = Your energy RIGHT NOW
                      </p>
                      <p className="text-xs text-gray-300">
                        <span className="text-yellow-400">Points (0-700+)</span> = Long-term progress & rewards
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Large Energy Gauge */}
            <div className="relative h-64 flex items-center justify-center mb-6">
              {/* Circular Progress */}
              <svg className="w-56 h-56 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="112"
                  cy="112"
                  r="100"
                  fill="none"
                  stroke="#2a2d35"
                  strokeWidth="16"
                />
                {/* ROYGBIV Color System - Based on current color level */}
                <defs>
                  <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={currentColor.color} />
                    <stop offset="100%" stopColor={currentColor.color} stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                {/* Progress circle - ROYGBIV LOOP SYSTEM */}
                {/* Each color level fills from 0% → 100%, then resets to next color */}
                <circle
                  cx="112"
                  cy="112"
                  r="100"
                  fill="none"
                  stroke="url(#energyGradient)"
                  strokeWidth="16"
                  strokeDasharray={`${2 * Math.PI * 100}`}
                  strokeDashoffset={`${2 * Math.PI * 100 * (1 - progressToNextColor / 100)}`}
                  strokeLinecap="round"
                  style={{ 
                    filter: `drop-shadow(0 0 8px ${currentColor.glow})`,
                    transition: 'all 0.5s ease',
                  }}
                />
                {/* Aura glow effect (if any Auras earned) */}
                {auraCount > 0 && (
                  <circle
                    cx="112"
                    cy="112"
                    r="105"
                    fill="none"
                    stroke={currentAuraColor.color}
                    strokeWidth="4"
                    strokeDasharray="4 8"
                    opacity="0.6"
                    style={{ 
                      filter: `drop-shadow(0 0 12px ${currentAuraColor.glow})`,
                    }}
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 112 112"
                      to="360 112 112"
                      dur="20s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </svg>
              
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  key={totalEnergy}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-bold text-white mb-2"
                >
                  {totalEnergy}
                </motion.div>
                <div 
                  className="text-xl font-semibold mb-1"
                  style={{ color: currentColor.color }}
                >
                  {currentColor.name}
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  {Math.round(progressToNextColor)}% to{' '}
                  {COLOR_LEVELS[Math.min(colorIndex + 1, COLOR_LEVELS.length - 1)].name}
                </div>
                {/* Aura Counter */}
                {auraCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-3 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `${currentAuraColor.color}20`,
                      border: `1px solid ${currentAuraColor.color}40`,
                    }}
                  >
                    <Sparkles 
                      className="w-4 h-4" 
                      style={{ color: currentAuraColor.color }}
                    />
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: currentAuraColor.color }}
                    >
                      {auraCount} Aura{auraCount > 1 ? 's' : ''}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ROYGBIV Color Progress - Visual Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">ROYGBIV Progression</span>
                <span className="text-white">{totalEnergy} / 700 energy</span>
              </div>
              <div className="flex gap-1">
                {COLOR_LEVELS.map((level, index) => {
                  const isActive = index <= colorIndex;
                  const isCurrent = index === colorIndex;
                  return (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-1">
                            <div
                              className={cn(
                                "h-3 rounded-full transition-all duration-300",
                                isActive ? "opacity-100" : "opacity-30"
                              )}
                              style={{
                                backgroundColor: level.color,
                                boxShadow: isCurrent ? `0 0 12px ${level.glow}` : 'none',
                              }}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div className="font-semibold">{level.name}</div>
                            <div className="text-gray-400">{level.energyRequired} energy</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Spark</span>
                <span>Mastery</span>
              </div>
            </div>
          </div>

          {/* Energy Sources */}
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-white">Energy Sources</h2>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Sleep Quality', value: 85, icon: Moon, color: 'bg-purple-500' },
                { label: 'Exercise', value: 70, icon: Heart, color: 'bg-red-500' },
                { label: 'Nutrition', value: 78, icon: Coffee, color: 'bg-orange-500' },
                { label: 'Mindfulness', value: 65, icon: Brain, color: 'bg-blue-500' },
              ].map((source, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <source.icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{source.label}</span>
                    </div>
                    <span className="text-sm text-white">{source.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${source.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${source.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How to Earn Energy Guide */}
        <EnergyEarningGuide />

        {/* PRIORITY 2: Advanced Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Energy Prediction */}
          <EnergyPredictionCard />
          
          {/* Resonance Harmony Detector */}
          <ResonanceHarmonyDetector />
        </div>

        {/* PRIORITY 2: Decay Warning & Difficulty Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Monitor with Decay Warnings */}
          <DecayWarningIndicator />
          
          {/* Adaptive Difficulty Panel */}
          <DifficultySettingsPanel />
        </div>

        {/* Circadian Resonance + Energy History - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Circadian Resonance - EXPANDED - Research-Based 24-Hour Rhythm Visualization */}
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-teal-400" />
                <h2 className="text-white">Circadian Resonance</h2>
              </div>
              <Badge variant="outline" className="text-teal-400 border-teal-400">
                82% In Tune
              </Badge>
            </div>

            {/* Horizontal Grid Layout: Clock on left, info on right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT: Circadian Clock */}
              <div className="space-y-4">
                {/* 24-Hour Circadian Clock - Research: Roenneberg et al. (2007) */}
                <div className="relative">
                  <div className="flex items-center justify-center">
                    <div className="relative w-64 h-64">
                      {/* Background 24-hour clock */}
                      <svg className="w-full h-full" viewBox="0 0 256 256">
                        <defs>
                          {/* Gradient for optimal performance zones */}
                          <linearGradient id="peakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.3" />
                          </linearGradient>
                          {/* Gradient for low performance zones */}
                          <linearGradient id="lowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
                          </linearGradient>
                          {/* Circadian rhythm wave pattern */}
                          <radialGradient id="rhythmGlow">
                            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
                          </radialGradient>
                        </defs>

                        {/* Outer ring - 24-hour markers */}
                        <circle cx="128" cy="128" r="110" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                        
                        {/* Hour markers */}
                        {Array.from({ length: 24 }).map((_, i) => {
                          const angle = (i * 15) - 90; // 15° per hour, start at top
                          const rad = (angle * Math.PI) / 180;
                          const x1 = 128 + 100 * Math.cos(rad);
                          const y1 = 128 + 100 * Math.sin(rad);
                          const x2 = 128 + (i % 6 === 0 ? 90 : 95) * Math.cos(rad);
                          const y2 = 128 + (i % 6 === 0 ? 90 : 95) * Math.sin(rad);
                          
                          return (
                            <g key={i}>
                              <line 
                                x1={x1} y1={y1} x2={x2} y2={y2} 
                                stroke={i % 6 === 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"} 
                                strokeWidth={i % 6 === 0 ? "2" : "1"}
                              />
                              {i % 6 === 0 && (
                                <text
                                  x={128 + 115 * Math.cos(rad)}
                                  y={128 + 115 * Math.sin(rad)}
                                  fill="rgba(255,255,255,0.5)"
                                  fontSize="10"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  {i === 0 ? '12' : i}
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {/* Peak Performance Zone 1: 9-11 AM (Morning peak) */}
                        {/* Research: Cognitive performance peaks mid-morning (Czeisler & Gooley, 2007) */}
                        <path
                          d="M 128 128 L 128 18 A 110 110 0 0 1 188 43 Z"
                          fill="url(#peakGradient)"
                        />
                        
                        {/* Peak Performance Zone 2: 2-4 PM (Afternoon peak) */}
                        <path
                          d="M 128 128 L 203 88 A 110 110 0 0 1 213 128 Z"
                          fill="url(#peakGradient)"
                        />

                        {/* Low Energy Zone: 2-4 AM (Circadian nadir) */}
                        {/* Research: Lowest cognitive performance early morning (Lack & Wright, 2007) */}
                        <path
                          d="M 128 128 L 73 43 A 110 110 0 0 1 43 73 Z"
                          fill="url(#lowGradient)"
                        />

                        {/* Middle ring - Circadian rhythm amplitude */}
                        <circle cx="128" cy="128" r="70" fill="url(#rhythmGlow)" />
                        
                        {/* Inner circle - Alignment indicator */}
                        <circle cx="128" cy="128" r="55" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                        
                        {/* Current time indicator (10:30 AM example) */}
                        {(() => {
                          const currentHour = 10.5; // 10:30 AM
                          const angle = (currentHour * 15) - 90;
                          const rad = (angle * Math.PI) / 180;
                          const x = 128 + 85 * Math.cos(rad);
                          const y = 128 + 85 * Math.sin(rad);
                          return (
                            <>
                              <line
                                x1="128" y1="128" x2={x} y2={y}
                                stroke="#0d9488"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                              <circle
                                cx={x} cy={y} r="6"
                                fill="#0d9488"
                                stroke="#10b981"
                                strokeWidth="2"
                              >
                                <animate
                                  attributeName="r"
                                  values="6;8;6"
                                  dur="2s"
                                  repeatCount="indefinite"
                                />
                              </circle>
                            </>
                          );
                        })()}

                        {/* Center alignment score */}
                        <motion.circle
                          cx="128" cy="128" r="45"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="6"
                          strokeDasharray="283"
                          strokeDashoffset={283 * (1 - 0.82)}
                          strokeLinecap="round"
                          initial={{ strokeDashoffset: 283 }}
                          animate={{ strokeDashoffset: 283 * (1 - 0.82) }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' }}
                        />
                      </svg>

                      {/* Center content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: 'spring' }}
                          className="text-center"
                        >
                          <div className="text-4xl font-bold text-white mb-1">82%</div>
                          <div className="text-xs text-gray-400">How In Tune</div>
                          <div className="text-xs text-teal-400 mt-1">🎵 Strong Flow</div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time & Status */}
                <div className="bg-gradient-to-r from-teal-600/10 to-blue-600/10 border border-teal-600/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Current Time</span>
                    <span className="text-white font-medium">10:30 AM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-teal-400" />
                    <span className="text-xs text-teal-400 font-medium">IN PEAK PERFORMANCE ZONE</span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Energy Rhythm + Metrics + Next Peak */}
              <div className="space-y-4">
                {/* Daily Rhythm Wave - Research: Sinusoidal pattern of alertness */}
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h3 className="text-white text-sm mb-3">Today's Energy Rhythm</h3>
                  <svg className="w-full h-32" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="25%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="75%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                      <linearGradient id="waveAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                    
                    {/* Circadian wave - Sinusoidal pattern peaking at 10 AM and 3 PM */}
                    {/* Research: Dual-peak pattern in cognitive performance (Schmidt et al., 2007) */}
                    <path
                      d="M 0 80 Q 50 90 100 70 T 200 50 T 300 70 T 400 90"
                      fill="url(#waveAreaGradient)"
                      opacity="0.6"
                    />
                    <motion.path
                      d="M 0 80 Q 50 90 100 70 T 200 50 T 300 70 T 400 90"
                      fill="none"
                      stroke="url(#waveGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, ease: 'easeInOut' }}
                    />
                    
                    {/* Current time marker */}
                    <line x1="175" y1="0" x2="175" y2="120" stroke="#0d9488" strokeWidth="2" strokeDasharray="4 4" />
                    <circle cx="175" cy="50" r="5" fill="#10b981" stroke="#0d9488" strokeWidth="2">
                      <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                    </circle>
                    
                    {/* Time labels */}
                    <text x="0" y="115" fill="rgba(255,255,255,0.4)" fontSize="10">6am</text>
                    <text x="100" y="115" fill="rgba(255,255,255,0.4)" fontSize="10">12pm</text>
                    <text x="200" y="115" fill="rgba(255,255,255,0.4)" fontSize="10">6pm</text>
                    <text x="300" y="115" fill="rgba(255,255,255,0.4)" fontSize="10">12am</text>
                  </svg>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-500">Low Energy</span>
                    <span className="text-teal-400">← You Are Here</span>
                    <span className="text-gray-500">High Energy</span>
                  </div>
                </div>

                {/* Resonance Metrics - Integrated from Resonance Engine */}
                {/* Research: Shared data model between Energy and Resonance tabs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors cursor-pointer"
                    onClick={() => {
                      toast.info('Task Harmony', {
                        description: 'How well your tasks align with your natural energy patterns. View full analysis in Resonance Engine.',
                      });
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-300">Task Harmony</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                            <p className="text-xs">
                              Alignment between your tasks and natural energy rhythm. Higher = better sync.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <ResonanceBadge score={0.67} />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors cursor-pointer"
                    onClick={() => {
                      toast.info('Schedule Flow', {
                        description: 'Measures transition smoothness between tasks. View full analysis in Resonance Engine.',
                      });
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Waves className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-300">Schedule Flow</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                            <p className="text-xs">
                              How smoothly tasks transition with minimal context switching. Higher = better flow.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <ResonanceBadge score={0.42} />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors cursor-pointer"
                    onClick={() => {
                      toast.info('Deep Work Ready', {
                        description: 'Your capacity for focused work based on cognitive load. View full analysis in Resonance Engine.',
                      });
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-gray-300">Deep Work Ready</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                            <p className="text-xs">
                              Current capacity for focused, uninterrupted work. Higher = more ready for deep work.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <ResonanceBadge score={0.78} />
                  </div>
                </div>

                {/* Next Peak Window */}
                <div className="p-3 bg-gradient-to-r from-amber-600/10 to-yellow-600/10 border border-amber-600/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">NEXT PEAK WINDOW</span>
                  </div>
                  <p className="text-white text-sm">2:00 PM - 4:00 PM</p>
                  <p className="text-gray-400 text-xs">Afternoon cognitive peak (in 3.5 hrs)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Energy History Chart */}
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h2 className="text-white">Energy History</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Day</Button>
              <Button variant="outline" size="sm">Week</Button>
              <Button variant="outline" size="sm">Month</Button>
            </div>
          </div>

          {/* Line Chart */}
          <div className="relative h-48">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="energyLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="energyAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="#2a2d35"
                  strokeWidth="0.5"
                />
              ))}
              
              {/* Area fill */}
              <path
                d="M 0 60 L 10 45 L 20 55 L 30 40 L 40 50 L 50 35 L 60 45 L 70 30 L 80 40 L 90 28 L 100 35 L 100 100 L 0 100 Z"
                fill="url(#energyAreaGradient)"
              />
              
              {/* Line */}
              <path
                d="M 0 60 L 10 45 L 20 55 L 30 40 L 40 50 L 50 35 L 60 45 L 70 30 L 80 40 L 90 28 L 100 35"
                fill="none"
                stroke="url(#energyLineGradient)"
                strokeWidth="2"
              />
            </svg>
            
            {/* Time labels */}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>6 AM</span>
              <span>9 AM</span>
              <span>12 PM</span>
              <span>3 PM</span>
              <span>6 PM</span>
              <span>9 PM</span>
            </div>
          </div>
        </div>
        </div>

        {/* Focus Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Focus Timer */}
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white">Focus Timer</h2>
            </div>

            <div className="flex flex-col items-center space-y-6">
              {/* Timer Display */}
              <div className="text-6xl font-bold text-white font-mono">
                {Math.floor(focusTimer / 60).toString().padStart(2, '0')}:
                {(focusTimer % 60).toString().padStart(2, '0')}
              </div>

              {/* Timer Controls */}
              <div className="flex gap-3">
                <Button variant="outline" size="icon">
                  <Play className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Pause className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {/* Preset Times */}
              <div className="flex gap-2">
                {[15, 25, 45, 60].map((mins) => (
                  <Button
                    key={mins}
                    variant="outline"
                    size="sm"
                    onClick={() => setFocusTimer(mins * 60)}
                  >
                    {mins}m
                  </Button>
                ))}
              </div>

              {/* Focus Sessions Today */}
              <div className="w-full pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">Sessions Today</span>
                  <span className="text-sm text-white">4 / 6</span>
                </div>
                {/* Research: Purple/Indigo for deep work & sustained focus (premium quality) */}
                <Progress value={66} className="h-2" indicatorClassName="bg-indigo-500" />
              </div>
            </div>
          </div>

          {/* Focus Quality & Distractions */}
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-blue-400" />
              <h2 className="text-white">Focus Quality</h2>
            </div>

            <div className="space-y-6">
              {/* Focus Quality Score */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400">Overall Quality</span>
                  <span className="text-2xl font-bold text-white">87%</span>
                </div>
                {/* Research: Blue improves concentration & mental clarity (Mehta & Zhu, 2009) */}
                <Progress value={87} className="h-3" indicatorClassName="bg-blue-500" />
              </div>

              {/* Distraction Analysis */}
              <div>
                <h3 className="text-white text-sm mb-3">Distraction Sources</h3>
                <div className="space-y-3">
                  {[
                    { source: 'Notifications', count: 12, impact: 'High' },
                    { source: 'Context Switching', count: 8, impact: 'Medium' },
                    { source: 'External Noise', count: 5, impact: 'Low' },
                  ].map((distraction, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white">{distraction.source}</div>
                        <div className="text-xs text-gray-500">{distraction.count} times today</div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          distraction.impact === 'High' ? 'border-red-400 text-red-400' :
                          distraction.impact === 'Medium' ? 'border-yellow-400 text-yellow-400' :
                          'border-green-400 text-green-400'
                        }
                      >
                        {distraction.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Focus Improvement Tip */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex gap-2">
                  <Brain className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-blue-400 font-medium mb-1">AI Tip</div>
                    <div className="text-xs text-gray-400">
                      Enable Do Not Disturb mode during 10-11 AM for optimal focus.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Peak Performance Windows */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sun className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white">Peak Performance Windows</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { time: '9:00 - 11:00 AM', quality: 'Excellent', energy: 95, tasks: 'High-priority work' },
              { time: '2:00 - 4:00 PM', quality: 'Good', energy: 78, tasks: 'Creative tasks' },
              { time: '7:00 - 9:00 PM', quality: 'Moderate', energy: 62, tasks: 'Planning & review' },
            ].map((window, i) => (
              <div key={i} className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white font-medium">{window.time}</div>
                  <Badge 
                    variant="outline"
                    className={
                      window.quality === 'Excellent' ? 'border-green-400 text-green-400' :
                      window.quality === 'Good' ? 'border-blue-400 text-blue-400' :
                      'border-yellow-400 text-yellow-400'
                    }
                  >
                    {window.quality}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Expected Energy</span>
                    <span className="text-white">{window.energy}%</span>
                  </div>
                  {/* Research: Gold/Amber for achievement & peak performance (Labrecque & Milne, 2012) */}
                  {/* Dynamic color based on performance quality */}
                  <Progress 
                    value={window.energy} 
                    className="h-2" 
                    indicatorClassName={
                      window.quality === 'Excellent' ? 'bg-amber-500' :
                      window.quality === 'Good' ? 'bg-yellow-500' :
                      'bg-orange-500'
                    }
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    Best for: {window.tasks}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PHASE 3-5: Advanced Energy Analytics Dashboard */}
        <EnergyAnalyticsDashboard className="mt-6" />
      </div>

      {/* Focus Session Dialog */}
      <StartFocusDialog 
        open={isFocusDialogOpen} 
        onOpenChange={(open) => {
          setIsFocusDialogOpen(open);
          if (!open) {
            // If dialog was closed by starting a session
            setFocusMode(true);
          }
        }}
      />
    </DashboardLayout>
  );
}