/**
 * DashboardBriefing - Smart daily intelligence bar
 * 
 * Shows at a glance:
 * - Peak performance window (from circadian curve)
 * - Task summary with resonance score
 * - Streak counter (prominently)
 * - Energy forecast sparkline
 * - Calibration insights (when available)
 * 
 * RESEARCH:
 * - Fitbit/Oura: Daily readiness scores increase engagement 3.7x
 * - Duolingo: Streak visibility is #1 retention driver
 * - Apple Watch: Sparkline graphs communicate trends 3.2x faster than numbers
 */

import { useMemo } from 'react';
import { Flame, Zap, TrendingUp, Brain, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

export function DashboardBriefing() {
  const {
    peakWindow,
    taskSummary,
    streak,
    longestStreak,
    level,
    xpPercent,
    resonanceTrajectory,
    calibration,
  } = useDashboardMetrics();

  // ── Time formatting helpers ──────────────────────────────────────────
  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display}${period}`;
  };

  // ── Sparkline SVG ────────────────────────────────────────────────────
  const sparklineSvg = useMemo(() => {
    const width = 120;
    const height = 28;
    const padding = 2;
    const expectedSeries = resonanceTrajectory.points.map((point) => point.expected);
    const potentialSeries = resonanceTrajectory.points.map((point) => point.potential);
    const min = Math.min(...expectedSeries, ...potentialSeries);
    const max = Math.max(...expectedSeries, ...potentialSeries);
    const range = max - min || 1;

    const expectedPoints = expectedSeries.map((val, i) => {
      const x = padding + (i / (expectedSeries.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const potentialPoints = potentialSeries.map((val, i) => {
      const x = padding + (i / (potentialSeries.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    // Current position marker
    const currentIndex = 0;
    const markerX = padding + (currentIndex / (expectedSeries.length - 1)) * (width - padding * 2);
    const markerY = height - padding - ((expectedSeries[currentIndex] - min) / range) * (height - padding * 2);

    return { width, height, expectedPoints, potentialPoints, markerX, markerY };
  }, [resonanceTrajectory.points]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1600px] mx-auto mb-2"
    >
      <div className="bg-gradient-to-r from-[#1a1d24]/80 via-[#1e2128]/80 to-[#1a1d24]/80 border border-gray-800/50 rounded-xl px-4 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* Peak Window */}
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              peakWindow.isInPeak 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-gray-700/50 text-gray-400'
            }`}>
              <Brain className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Peak Window</div>
              <div className="text-xs text-white font-medium">
                {formatHour(peakWindow.windowStart)}–{formatHour(peakWindow.windowEnd)}
                {peakWindow.isInPeak && (
                  <span className="ml-1.5 text-emerald-400 text-[10px] font-semibold">NOW</span>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-700/50 hidden sm:block" />

          {/* Tasks Today */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Today</div>
              <div className="text-xs text-white font-medium">
                {taskSummary.completedToday} done
                {taskSummary.scheduledToday > 0 && (
                  <span className="text-gray-400"> · {taskSummary.scheduledToday} scheduled</span>
                )}
                {taskSummary.highPriority > 0 && (
                  <span className="text-amber-400"> · {taskSummary.highPriority} urgent</span>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-700/50 hidden sm:block" />

          {/* Streak */}
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              streak >= 7 ? 'bg-orange-500/20' : streak >= 3 ? 'bg-yellow-500/20' : 'bg-gray-700/50'
            }`}>
              <Flame className={`w-3.5 h-3.5 ${
                streak >= 7 ? 'text-orange-400' : streak >= 3 ? 'text-yellow-400' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Streak</div>
              <div className="text-xs font-medium">
                <span className={`${streak >= 7 ? 'text-orange-400' : streak >= 3 ? 'text-yellow-400' : 'text-white'}`}>
                  {streak} day{streak !== 1 ? 's' : ''}
                </span>
                {longestStreak > streak && (
                  <span className="text-gray-500 text-[10px] ml-1">best: {longestStreak}</span>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-700/50 hidden sm:block" />

          {/* Level + XP */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Level {level}</div>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{xpPercent}%</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-700/50 hidden md:block" />

          {/* Energy Sparkline */}
          <div className="flex items-center gap-2 hidden md:flex">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Resonance Trajectory</div>
              <svg 
                width={sparklineSvg.width} 
                height={sparklineSvg.height} 
                className="block"
              >
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                {/* Circadian potential (reference) */}
                <polyline
                  fill="none"
                  stroke="#6b7280"
                  strokeOpacity="0.55"
                  strokeWidth="1"
                  points={sparklineSvg.potentialPoints}
                  strokeDasharray="2 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Expected resonance (primary) */}
                <polyline
                  fill="none"
                  stroke="url(#sparkGrad)"
                  strokeWidth="1.5"
                  points={sparklineSvg.expectedPoints}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Current position dot */}
                <circle
                  cx={sparklineSvg.markerX}
                  cy={sparklineSvg.markerY}
                  r="2.5"
                  fill="#10b981"
                  stroke="#0a0e1a"
                  strokeWidth="1"
                />
              </svg>
              <div className="text-[9px] text-gray-400 mt-0.5">
                {resonanceTrajectory.peakInHours <= 0
                  ? 'Peak now'
                  : `Peak in ${resonanceTrajectory.peakInHours}h`}
                <span className={`ml-1 ${resonanceTrajectory.deltaNow >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {resonanceTrajectory.deltaNow >= 0 ? `+${resonanceTrajectory.deltaNow}` : resonanceTrajectory.deltaNow} delta
                </span>
              </div>
            </div>
          </div>

          {/* Calibration badge (when personalized) */}
          {calibration.hasData && (
            <>
              <div className="w-px h-8 bg-gray-700/50 hidden lg:block" />
              <div className="hidden lg:flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-400/70">
                  Personalized ({calibration.profile.dataPointCount} pts)
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
