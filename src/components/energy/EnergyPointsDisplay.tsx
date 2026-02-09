import { motion } from 'motion/react';
import { Zap, TrendingUp } from 'lucide-react';
import { useEnergy } from '../../contexts/EnergyContext';
import { Badge } from '../ui/badge';

interface EnergyPointsDisplayProps {
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

export function EnergyPointsDisplay({ 
  showLabel = true, 
  compact = false,
  className = '',
}: EnergyPointsDisplayProps) {
  const { energy } = useEnergy();
  
  const totalEnergy = energy.totalEnergy;
  const breakdown = energy.bySource;
  
  const maxEnergy = 200; // Maximum display energy
  const percentage = Math.min((totalEnergy / maxEnergy) * 100, 100);
  
  // Calculate segment widths as percentages of total
  const total = totalEnergy || 1;
  const segments = [
    { source: 'tasks', color: 'bg-orange-500', width: (breakdown.tasks / total) * percentage },
    { source: 'goals', color: 'bg-yellow-500', width: (breakdown.goals / total) * percentage },
    { source: 'milestones', color: 'bg-green-500', width: (breakdown.milestones / total) * percentage },
    { source: 'achievements', color: 'bg-blue-500', width: (breakdown.achievements / total) * percentage },
    { source: 'health', color: 'bg-teal-500', width: (breakdown.health / total) * percentage },
  ].filter(s => s.width > 0);
  
  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-gray-300">Energy</span>
          </div>
          <Badge variant="outline" className="bg-amber-600/20 text-amber-400 border-amber-600/30">
            {Math.round(totalEnergy)} pts
          </Badge>
        </div>
      )}
      
      {/* Segmented Energy Bar */}
      <div className={`relative ${compact ? 'h-2' : 'h-4'} bg-gray-800/50 rounded-full overflow-hidden border border-gray-700`}>
        <div className="absolute inset-0 flex">
          {segments.map((segment, index) => (
            <motion.div
              key={segment.source}
              className={`${segment.color} relative`}
              initial={{ width: 0 }}
              animate={{ width: `${segment.width}%` }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                  delay: index * 0.2,
                }}
              />
            </motion.div>
          ))}
        </div>
        
        {/* Glow effect */}
        {totalEnergy > 0 && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-yellow-500/20 to-teal-500/20 blur-sm"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
      
      {/* Legend (only if not compact) */}
      {!compact && (
        <div className="flex flex-wrap gap-3 text-xs">
          {breakdown.tasks > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-gray-400">Tasks</span>
            </div>
          )}
          {breakdown.goals > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-400">Goals</span>
            </div>
          )}
          {breakdown.milestones > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-400">Milestones</span>
            </div>
          )}
          {breakdown.achievements > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-400">Achievements</span>
            </div>
          )}
          {breakdown.health > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-gray-400">Health</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}