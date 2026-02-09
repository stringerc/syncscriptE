/**
 * Resonance Wave Graph - Shared between Dashboard Card and Full Page
 * 
 * Shows:
 * - Your actual resonance (teal line)
 * - Recommended circadian rhythm (purple dashed line)
 * - Green zones = in sync (above 0.65 threshold)
 * - Red zones = out of sync (below 0.65 threshold)
 * - Threshold line at 0.65
 */

import { memo, useMemo } from 'react';
import { AreaChart, Area, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine } from 'recharts';
import { Task, Event } from '../utils/event-task-types';
import { getCircadianCurve, getEnergyLevelForHour, calculateResonanceScore, type TimeSlot, type UserContext } from '../utils/resonance-calculus';
import { getCurrentDate } from '../utils/app-date';

interface ResonanceWaveGraphProps {
  tasks: Task[];
  events: Event[];
  height?: number;
  showLegend?: boolean;
  compact?: boolean;
}

export const ResonanceWaveGraph = memo(function ResonanceWaveGraph({
  tasks,
  events,
  height = 380,
  showLegend = true,
  compact = false,
}: ResonanceWaveGraphProps) {
  
  // Generate 24-hour wave timeline data (EXACT SAME LOGIC as ResonanceEnginePage)
  const waveTimelineData = useMemo(() => {
    const now = getCurrentDate();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Step 1: Calculate RAW data for each hour
    const rawData = Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date(startOfDay);
      hourStart.setHours(hour, 0, 0, 0);
      
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1, 0, 0, 0);
      
      // Get tasks scheduled in this hour
      const tasksInHour = tasks.filter(task => {
        if (!task.scheduledTime) return false;
        const taskTime = new Date(task.scheduledTime);
        return taskTime >= hourStart && taskTime < hourEnd;
      });
      
      // Get events scheduled in this hour
      const eventsInHour = events.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= hourStart && eventStart < hourEnd;
      });
      
      // Calculate actual resonance for this hour
      let actualResonance: number;
      
      if (tasksInHour.length > 0 || eventsInHour.length > 0) {
        // Hour has scheduled items - calculate REALISTIC resonance
        
        // Research-based: Different activity types have different cognitive values
        const activityResonances: number[] = [];
        const circadianPotential = getCircadianCurve(hour); // What you COULD achieve
        
        // Process tasks
        tasksInHour.forEach(task => {
          const timeSlot: TimeSlot = {
            startTime: hourStart,
            endTime: hourEnd,
            hour,
            duration: 60,
            naturalEnergy: getEnergyLevelForHour(hour),
          };
          
          const context: UserContext = {
            currentTime: getCurrentDate(),
            dayStart: startOfDay,
            schedule: events,
            completedTasksToday: tasks.filter(t => t.completed).length,
            recentTaskSwitches: 0,
            cognitiveLoad: 0,
          };
          
          const score = calculateResonanceScore(task, timeSlot, context);
          
          // REALISTIC ADJUSTMENT: Task-hour mismatch penalty
          // Research: Doing low-value work during peak hours WASTES potential
          let adjustedScore = score.overall;
          
          // Peak time waste (9-11 AM doing low-energy tasks)
          if (hour >= 9 && hour < 11 && task.energyLevel === 'low') {
            adjustedScore *= 0.65; // Wasting 35% of peak potential
          }
          
          // Good use of peak time (high-energy task at peak hour)
          if (hour >= 9 && hour < 11 && task.energyLevel === 'high') {
            adjustedScore *= 1.05; // Slight bonus for good scheduling
          }
          
          // Afternoon slump with high-energy task (realistic struggle)
          if (hour >= 13 && hour < 15 && task.energyLevel === 'high') {
            adjustedScore *= 0.75; // Swimming upstream
          }
          
          activityResonances.push(adjustedScore);
        });
        
        // Process events (meetings, calls, etc.)
        eventsInHour.forEach(event => {
          // Research: Meetings are typically LOW cognitive value but MEDIUM energy drain
          // Peak time meeting = major waste (Mark et al., 2016)
          let meetingResonance = circadianPotential * 0.60; // Base: meetings use 60% of potential
          
          // Peak time meeting waste (9-11 AM)
          if (hour >= 9 && hour < 11) {
            meetingResonance = circadianPotential * 0.55; // Only capturing 55% of peak potential
          }
          
          // Post-lunch meeting (already low energy, meeting makes it worse)
          if (hour >= 13 && hour < 15) {
            meetingResonance = circadianPotential * 0.70; // Less waste since time already suboptimal
          }
          
          // Afternoon meetings (decent time for collaborative work)
          if (hour >= 15 && hour < 17) {
            meetingResonance = circadianPotential * 0.75; // Better fit
          }
          
          activityResonances.push(meetingResonance);
        });
        
        // Calculate average for the hour
        if (activityResonances.length > 0) {
          actualResonance = activityResonances.reduce((sum, r) => sum + r, 0) / activityResonances.length;
          
          // OVER-SCHEDULING PENALTY (Research: Back-to-back reduces performance)
          // Perlow (1999): No breaks = 20-30% performance degradation
          if (tasksInHour.length + eventsInHour.length > 2) {
            actualResonance *= 0.80; // 20% penalty for packed schedule
          }
        } else {
          actualResonance = circadianPotential;
        }
      } else {
        // No scheduled items - show POTENTIAL (what you could achieve)
        // This creates aspiration gap vs. recommended line
        actualResonance = getCircadianCurve(hour) * 0.85; // Show 85% of potential when empty
      }
      
      return {
        hour,
        rawResonance: actualResonance,
        rawRecommended: getCircadianCurve(hour), // Raw circadian curve
        taskCount: tasksInHour.length,
        eventCount: eventsInHour.length,
      };
    });
    
    // Step 2: Apply 3-point weighted moving average for BOTH curves
    // Research-based: Gaussian weighting [0.25, 0.5, 0.25] preserves peaks while smoothing
    const smoothData = rawData.map((point, i) => {
      const prev = rawData[i - 1] || rawData[i]; // Handle edges
      const curr = rawData[i];
      const next = rawData[i + 1] || rawData[i]; // Handle edges
      
      // Smooth YOUR resonance: 25% previous + 50% current + 25% next
      const smoothedResonance = (prev.rawResonance * 0.25) + (curr.rawResonance * 0.5) + (next.rawResonance * 0.25);
      
      // Smooth RECOMMENDED resonance (circadian curve) - SAME ALGORITHM
      const smoothedRecommended = (prev.rawRecommended * 0.25) + (curr.rawRecommended * 0.5) + (next.rawRecommended * 0.25);
      
      const threshold = 0.65; // The "in sync" threshold
      
      // For area fills - split based on threshold
      const yourAbove = smoothedResonance > threshold ? smoothedResonance : threshold;
      const yourBelow = smoothedResonance < threshold ? smoothedResonance : threshold;
      
      return {
        hour: point.hour,
        hourLabel: point.hour === 0 ? '12AM' : 
                   point.hour < 12 ? `${point.hour}AM` : 
                   point.hour === 12 ? '12PM' : 
                   `${point.hour - 12}PM`,
        yourResonance: smoothedResonance, // Smoothed version
        recommended: smoothedRecommended, // NOW SMOOTHED!
        yourAbove,
        yourBelow,
        threshold,
        isInSync: smoothedResonance > threshold,
        gap: Math.abs(smoothedResonance - smoothedRecommended),
        taskCount: point.taskCount,
        eventCount: point.eventCount,
      };
    });
    
    return smoothData;
  }, [tasks, events]);

  // Calculate alignment percentage
  const inSyncCount = waveTimelineData.filter(d => d.isInSync).length;
  const alignmentPercentage = Math.round((inSyncCount / waveTimelineData.length) * 100);

  return (
    <div className="w-full">
      {/* The Chart - Dynamic Green/Red Zones */}
      <div className={compact ? "" : "mb-4"}>
        <div className="bg-black/20 rounded-xl p-3">
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart 
              data={waveTimelineData}
              margin={{ top: 10, right: compact ? 5 : 20, left: compact ? -20 : 0, bottom: compact ? 10 : 20 }}
            >
              <defs>
                {/* Green gradient for "in sync" zones (above threshold) */}
                <linearGradient id="syncGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                
                {/* Red gradient for "out of sync" zones (below threshold) */}
                <linearGradient id="outOfSyncGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>

                {/* Subtle gradient for recommended line */}
                <linearGradient id="recommendedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              
              {!compact && (
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              )}
              
              <XAxis 
                dataKey="hourLabel" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: compact ? 9 : 11 }}
                interval={compact ? 3 : 2}
              />
              
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: compact ? 9 : 11 }}
                domain={[0, 1]}
                ticks={compact ? [0, 0.65, 1] : [0, 0.25, 0.5, 0.65, 0.75, 1]}
                tickFormatter={(value) => compact ? `${Math.round(value * 100)}%` : value.toFixed(2)}
              />
              
              {!compact && (
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                  labelStyle={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '8px' }}
                  formatter={(value: any, name: string) => {
                    const displayName = name === 'yourResonance' ? 'Your Resonance' :
                                      name === 'recommended' ? 'Recommended' : name;
                    return [value.toFixed(3), displayName];
                  }}
                />
              )}
              
              {/* Threshold reference line at 0.65 */}
              <ReferenceLine 
                y={0.65} 
                stroke="#f59e0b" 
                strokeDasharray="5 5"
                strokeWidth={2}
                label={compact ? undefined : {
                  value: 'In-Sync Threshold (0.65)',
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 11,
                }}
              />

              {/* Green area - when above threshold (in sync) */}
              <Area
                type="natural"
                dataKey="yourAbove"
                stroke="none"
                fill="url(#syncGradient)"
                baseValue={0.65}
                isAnimationActive={true}
              />

              {/* Red area - when below threshold (out of sync) */}
              <Area
                type="natural"
                dataKey="yourBelow"
                stroke="none"
                fill="url(#outOfSyncGradient)"
                baseValue={0.65}
                isAnimationActive={true}
              />

              {/* Recommended resonance line (subtle, for reference) */}
              <Line
                type="natural"
                dataKey="recommended"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                opacity={0.6}
              />

              {/* Your actual resonance line (prominent) */}
              <Line
                type="natural"
                dataKey="yourResonance"
                stroke="#14b8a6"
                strokeWidth={3}
                dot={false}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Interpretation */}
        {showLegend && (
          <div className="mt-3 flex items-center gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 rounded-full bg-teal-500" />
              <span className="text-xs text-gray-400">Your Resonance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 rounded-full bg-purple-500 opacity-60" style={{ borderTop: '2px dashed #8b5cf6' }} />
              <span className="text-xs text-gray-400">Recommended</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/40" />
              <span className="text-xs text-gray-400">In Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/40" />
              <span className="text-xs text-gray-400">Out of Sync</span>
            </div>
          </div>
        )}

        {/* Compact stats */}
        {compact && (
          <div className="mt-2 text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
              alignmentPercentage >= 70 
                ? 'bg-green-500/20 border border-green-500/30' 
                : alignmentPercentage >= 50
                ? 'bg-yellow-500/20 border border-yellow-500/30'
                : 'bg-red-500/20 border border-red-500/30'
            }`}>
              <span className={`text-xs font-medium ${
                alignmentPercentage >= 70 
                  ? 'text-green-400' 
                  : alignmentPercentage >= 50
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}>
                {alignmentPercentage}% in sync today
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
