import { memo } from 'react';
import { AreaChart, Area, Line, ResponsiveContainer, XAxis, YAxis, ReferenceLine } from 'recharts';

interface ResonanceWaveChartProps {
  rhythmAlign?: number;
  phaseLock?: number;
  flowState?: number;
  energyMatch?: number;
}

export const ResonanceWaveChart = memo(function ResonanceWaveChart({
  rhythmAlign = 92,
  phaseLock = 87,
  flowState = 78,
  energyMatch = 84,
}: ResonanceWaveChartProps) {
  // Generate wave data over time (simulating a day from 8am to 6pm)
  const generateWaveData = () => {
    const dataPoints = 60; // More points for smoother curves
    const data = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const t = i / dataPoints;
      const hour = 8 + (t * 10); // 8am to 6pm
      
      // Natural circadian rhythm energy baseline
      // Based on research: energy starts lower in morning, peaks mid-morning,
      // dips after lunch (post-lunch dip), peaks again mid-afternoon, then declines
      const circadianEnergy = 50 + 
        Math.sin((t - 0.15) * Math.PI * 1.5) * 20 + // Main energy curve
        Math.sin((t - 0.4) * Math.PI * 3) * -5; // Post-lunch dip
      
      // Create a resonance wave that oscillates around 50
      // This represents your schedule's alignment with optimal energy
      // Above 50 = in sync (good), Below 50 = out of sync (needs adjustment)
      const avgScore = (rhythmAlign + phaseLock + flowState + energyMatch) / 4;
      const scoreInfluence = (avgScore - 75) / 100; // Normalize around 75%
      
      // Create smooth wave with multiple frequencies for realistic variation
      const wave = 50 + 
        scoreInfluence * 20 + // Overall score influence
        Math.sin(t * Math.PI * 2 + 0.3) * 18 + // Main daily rhythm
        Math.sin(t * Math.PI * 4 + 1.2) * 8; // Secondary variation
      
      // Clamp values between 25 and 75 for visual clarity
      const resonanceValue = Math.max(25, Math.min(75, wave));
      const energyBaseline = Math.max(25, Math.min(75, circadianEnergy));
      
      // Determine if above or below the 50 line for both lines
      const isResonanceAbove = resonanceValue >= 50;
      const isEnergyAbove = energyBaseline >= 50;
      
      // For area fills - split into above and below 50 for resonance line
      const resonanceAboveArea = isResonanceAbove ? resonanceValue : 50;
      const resonanceBelowArea = !isResonanceAbove ? resonanceValue : 50;
      
      // For area fills - split into above and below 50 for energy baseline
      const energyAboveArea = isEnergyAbove ? energyBaseline : 50;
      const energyBelowArea = !isEnergyAbove ? energyBaseline : 50;
      
      data.push({
        time: hour.toFixed(1),
        resonance: resonanceValue,
        energyBaseline: energyBaseline,
        resonanceAboveArea: resonanceAboveArea, // For green fill (resonance)
        resonanceBelowArea: resonanceBelowArea, // For red fill (resonance)
        energyAboveArea: energyAboveArea, // For green fill (energy)
        energyBelowArea: energyBelowArea, // For red fill (energy)
        baseline: 50, // The reference line
        isAbove: isResonanceAbove,
      });
    }
    
    return data;
  };

  const data = generateWaveData();
  
  // Calculate overall alignment percentage (% of time above 50)
  const aboveCount = data.filter(d => d.isAbove).length;
  const alignmentPercentage = Math.round((aboveCount / data.length) * 100);

  return (
    <div className="w-full">
      {/* Chart Title */}
      <div className="mb-3">
        <h4 className="text-white text-sm mb-1">Resonance Overlay</h4>
        <p className="text-gray-400 text-xs">See when your schedule syncs with your natural energy rhythm</p>
      </div>

      {/* Wave Chart */}
      <div className="bg-[#0a0b0d] rounded-lg p-4 border border-gray-800/50">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              {/* Green gradient for above 50 (in sync) - Resonance */}
              <linearGradient id="aboveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
              
              {/* Red gradient for below 50 (out of sync) - Resonance */}
              <linearGradient id="belowGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
              
              {/* Green gradient for above 50 (in sync) - Energy Baseline */}
              <linearGradient id="energyAboveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
              
              {/* Red gradient for below 50 (out of sync) - Energy Baseline */}
              <linearGradient id="energyBelowGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="time" 
              stroke="#4b5563"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              interval={9}
              tickFormatter={(value) => `${Math.floor(parseFloat(value))}h`}
            />
            
            <YAxis 
              stroke="#4b5563"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 50, 100]}
            />
            
            {/* Green area - when energy baseline is above 50 */}
            <Area 
              type="monotone" 
              dataKey="energyAboveArea"
              stroke="none"
              fill="url(#energyAboveGradient)"
              isAnimationActive={true}
              animationDuration={1500}
              baseValue={50}
            />
            
            {/* Red area - when energy baseline is below 50 */}
            <Area 
              type="monotone" 
              dataKey="energyBelowArea"
              stroke="none"
              fill="url(#energyBelowGradient)"
              isAnimationActive={true}
              animationDuration={1500}
              baseValue={50}
            />
            
            {/* Green area - when resonance line is above 50 */}
            <Area 
              type="monotone" 
              dataKey="resonanceAboveArea"
              stroke="none"
              fill="url(#aboveGradient)"
              isAnimationActive={true}
              animationDuration={1500}
              baseValue={50}
            />
            
            {/* Red area - when resonance line is below 50 */}
            <Area 
              type="monotone" 
              dataKey="resonanceBelowArea"
              stroke="none"
              fill="url(#belowGradient)"
              isAnimationActive={true}
              animationDuration={1500}
              baseValue={50}
            />
            
            {/* Reference line at 50 (optimal threshold) */}
            <ReferenceLine 
              y={50} 
              stroke="#6b7280" 
              strokeDasharray="5 5" 
              strokeWidth={2}
              opacity={0.6}
            />
            
            {/* Natural circadian energy baseline */}
            <Line 
              type="monotone" 
              dataKey="energyBaseline" 
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={true}
              animationDuration={1500}
              animationDelay={200}
            />
            
            {/* Main resonance line */}
            <Line 
              type="monotone" 
              dataKey="resonance" 
              stroke="#14b8a6"
              strokeWidth={3}
              dot={false}
              isAnimationActive={true}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full bg-teal-500" />
            <span className="text-[10px] text-gray-400">Your Resonance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full bg-purple-500" />
            <span className="text-[10px] text-gray-400">Natural Energy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-green-500/40" />
            <span className="text-[10px] text-gray-400">In Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-red-500/40" />
            <span className="text-[10px] text-gray-400">Out of Sync</span>
          </div>
        </div>
        
        {/* Alignment percentage */}
        <div className="mt-3 text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
            alignmentPercentage >= 70 
              ? 'bg-green-500/20 border border-green-500/30' 
              : alignmentPercentage >= 50
              ? 'bg-yellow-500/20 border border-yellow-500/30'
              : 'bg-red-500/20 border border-red-500/30'
          }`}>
            <span className={`text-xs ${
              alignmentPercentage >= 70 
                ? 'text-green-400' 
                : alignmentPercentage >= 50
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}>
              {alignmentPercentage}% in-phase alignment throughout your day
            </span>
          </div>
        </div>
      </div>
      
      {/* Interpretation guide */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[10px] text-green-400">Above the Line (Green)</span>
          </div>
          <p className="text-[9px] text-gray-400">Your schedule is in sync with your optimal energy - great time for deep work and challenging tasks</p>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[10px] text-red-400">Below the Line (Red)</span>
          </div>
          <p className="text-[9px] text-gray-400">Schedule needs adjustment - consider moving tasks to green zones or taking breaks during these periods</p>
        </div>
      </div>
    </div>
  );
});
