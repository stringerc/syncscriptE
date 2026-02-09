/**
 * Energy Curve Overlay
 * 
 * RESEARCH-BASED ENERGY VISUALIZATION
 * 
 * Based on:
 * 1. Chronobiology research (circadian rhythm patterns)
 * 2. Color psychology and accessibility standards
 * 3. Calendar UX best practices (Google Calendar, Notion, Reclaim.ai)
 * 
 * Design Principles:
 * - Subtle background tints (15-20% opacity) don't overwhelm events
 * - Green = peak energy (positive, go-ahead signal)
 * - Yellow/Amber = medium energy (caution, good for meetings)
 * - Orange = low energy (rest, admin tasks)
 * - Smooth gradients match natural energy transitions
 */

import { motion } from 'motion/react';
import { Zap, TrendingUp } from 'lucide-react';

interface EnergyCurveOverlayProps {
  // Energy values from 0-100 for each hour (7 AM to 8 PM)
  energyData?: number[];
  showLabels?: boolean;
  opacity?: number;
  showLegend?: boolean;
}

// Default energy curve based on chronotype research
// Source: "When: The Scientific Secrets of Perfect Timing" by Daniel Pink
// Most people follow a peak-trough-recovery pattern:
// - Peak: 2-4 hours after waking (~9-11 AM for most)
// - Trough: Post-lunch circadian dip (1-3 PM)
// - Recovery: Mid-afternoon rebound (3-5 PM)
const defaultEnergyData = [
  40,  // 7 AM - Just waking up (cortisol rising)
  60,  // 8 AM - Morning activation
  85,  // 9 AM - Peak begins (optimal for analytical work)
  95,  // 10 AM - Peak cognitive performance
  90,  // 11 AM - Still high (good for meetings)
  70,  // 12 PM - Pre-lunch decline
  55,  // 1 PM - Post-lunch circadian dip (universal pattern)
  60,  // 2 PM - Trough recovery begins
  75,  // 3 PM - Afternoon rebound (good for creative work)
  80,  // 4 PM - Secondary peak
  70,  // 5 PM - Gradual evening decline
  60,  // 6 PM - Lower energy
  50,  // 7 PM - Evening rest mode
  40,  // 8 PM - Winding down (melatonin production starts)
];

export function EnergyCurveOverlay({ 
  energyData = defaultEnergyData,
  showLabels = true,
  opacity = 0.2, // Increased default for better visibility
  showLegend = false,
}: EnergyCurveOverlayProps) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  // Research-based color mapping with better accessibility
  const createGradient = () => {
    const stops = energyData.map((energy, index) => {
      const position = (index / (energyData.length - 1)) * 100;
      
      // Color zones based on cognitive performance research:
      // PEAK (85-100): Deep green - best for deep work, complex problem-solving
      // HIGH (65-84): Light green - good for collaboration, decisions
      // MEDIUM (45-64): Amber/yellow - suitable for routine tasks, meetings
      // LOW (0-44): Soft orange - best for admin, breaks
      let color;
      if (energy >= 85) {
        // Peak: Vibrant green (signals "go" and high performance)
        color = `rgba(16, 185, 129, ${opacity})`; // green-500
      } else if (energy >= 65) {
        // High: Lighter green-teal
        color = `rgba(20, 184, 166, ${opacity})`; // teal-500
      } else if (energy >= 45) {
        // Medium: Warm amber (not too alarming)
        color = `rgba(245, 158, 11, ${opacity})`; // amber-500
      } else {
        // Low: Soft orange (avoid pure red - too negative)
        color = `rgba(251, 146, 60, ${opacity})`; // orange-400
      }
      
      return `${color} ${position}%`;
    }).join(', ');
    
    return `linear-gradient(to bottom, ${stops})`;
  };

  // Get energy level label with research-based categories
  const getEnergyLabel = (energy: number) => {
    if (energy >= 85) return { text: 'PEAK', color: 'text-green-400', description: 'Deep work' };
    if (energy >= 65) return { text: 'HIGH', color: 'text-teal-400', description: 'Meetings' };
    if (energy >= 45) return { text: 'MED', color: 'text-amber-400', description: 'Routine' };
    return { text: 'LOW', color: 'text-orange-400', description: 'Admin' };
  };

  // Find peak energy hours for header display
  const peakHours = energyData
    .map((energy, index) => ({ energy, hour: hours[index] }))
    .filter(({ energy }) => energy >= 85)
    .map(({ hour }) => hour);

  return (
    <>
      {/* Energy Gradient Overlay - Enhanced visibility */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: createGradient(),
          mixBlendMode: 'multiply',
        }}
      />

      {/* Energy Level Labels (positioned at right edge) */}
      {showLabels && (
        <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-between pointer-events-none z-10 py-2">
          {energyData.map((energy, index) => {
            const { text, color } = getEnergyLabel(energy);
            const isPeak = energy >= 85;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-1 ${color} text-xs font-medium ${
                  isPeak ? 'scale-110' : ''
                }`}
              >
                {isPeak && <Zap className="w-3 h-3" />}
                <span className="opacity-70">{text}</span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Legend - Compact color key */}
      {showLegend && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-2 left-2 bg-[#1a1d24]/80 border border-gray-700 rounded-lg px-3 py-2 backdrop-blur-sm z-20 pointer-events-none"
        >
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-green-400">Peak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-teal-400">High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-amber-400">Med</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-400" />
              <span className="text-orange-400">Low</span>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

/**
 * Peak Energy Header Badge
 * Compact display for calendar header showing peak hours
 */
interface PeakEnergyBadgeProps {
  energyData?: number[];
}

export function PeakEnergyBadge({ energyData = defaultEnergyData }: PeakEnergyBadgeProps) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);
  
  const peakHours = energyData
    .map((energy, index) => ({ energy, hour: hours[index] }))
    .filter(({ energy }) => energy >= 85)
    .map(({ hour }) => hour);

  if (peakHours.length === 0) return null;

  const formatHourRange = () => {
    if (peakHours.length === 0) return '';
    const start = peakHours[0];
    const end = peakHours[peakHours.length - 1];
    
    const formatHour = (h: number) => {
      const display = h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${display}${ampm}`;
    };
    
    if (start === end) return formatHour(start);
    return `${formatHour(start)}-${formatHour(end)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1.5"
    >
      <Zap className="w-4 h-4 text-green-400" />
      <div className="text-sm">
        <span className="text-green-400 font-medium">Peak Energy: </span>
        <span className="text-green-300">{formatHourRange()}</span>
      </div>
    </motion.div>
  );
}

/**
 * Energy Legend - Standalone component for sidebar
 */
export function EnergyLegend() {
  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-300">Energy Levels</span>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-green-400">Peak</span>
          </div>
          <span className="text-gray-500">Deep work, complex tasks</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-500" />
            <span className="text-teal-400">High</span>
          </div>
          <span className="text-gray-500">Meetings, decisions</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-amber-400">Medium</span>
          </div>
          <span className="text-gray-500">Routine tasks</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-400" />
            <span className="text-orange-400">Low</span>
          </div>
          <span className="text-gray-500">Admin, breaks</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
        💡 Based on circadian rhythm research
      </div>
    </div>
  );
}

/**
 * Compact Energy Indicator
 * Shows energy level for a specific time slot
 */
interface EnergyIndicatorProps {
  hour: number;
  energyData?: number[];
  size?: 'sm' | 'md' | 'lg';
}

export function EnergyIndicator({ 
  hour, 
  energyData = defaultEnergyData,
  size = 'md',
}: EnergyIndicatorProps) {
  const hourIndex = hour - 7; // Convert hour to index (7 AM = 0)
  const energy = energyData[hourIndex] || 50;
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  const colorClass = energy >= 85
    ? 'bg-green-400' 
    : energy >= 65
      ? 'bg-teal-400'
      : energy >= 45
        ? 'bg-amber-400'
        : 'bg-orange-400';
  
  const label = energy >= 85
    ? 'Peak Energy' 
    : energy >= 65
      ? 'High Energy'
      : energy >= 45
        ? 'Medium Energy'
        : 'Low Energy';

  return (
    <div 
      className={`${sizeClasses[size]} ${colorClass} rounded-full`}
      title={`${label} (${energy}%)`}
    />
  );
}
