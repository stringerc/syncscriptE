import { motion } from 'motion/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Activity } from 'lucide-react';

interface ResonanceBadgeProps {
  score: number; // -1 to +1 (constructive to destructive)
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  tooltip?: string;
  className?: string;
}

export function ResonanceBadge({ 
  score, 
  size = 'sm', 
  showIcon = false,
  tooltip,
  className = ''
}: ResonanceBadgeProps) {
  // Classify resonance
  const getResonanceType = () => {
    if (score > 0.3) return 'constructive';
    if (score < -0.3) return 'destructive';
    return 'neutral';
  };

  const getStatusLabel = () => {
    if (score > 0.6) return '🎵 In Tune';
    if (score > 0.3) return '✨ Good Timing';
    if (score > 0) return '👍 Okay';
    if (score > -0.3) return '⚠️ Off-Beat';
    return '❌ Clash';
  };

  const getFriendlyTooltip = () => {
    if (tooltip) return tooltip;
    
    if (score > 0.6) return 'Good timing—this will feel easier';
    if (score > 0.3) return 'Decent fit with your rhythm';
    if (score > 0) return 'Timing is okay, not perfect';
    if (score > -0.3) return 'Bad timing—expect drag';
    return 'Heavy clash—move this for better flow';
  };

  const getColors = () => {
    const type = getResonanceType();
    switch (type) {
      case 'constructive':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/30',
          glow: 'shadow-green-500/20'
        };
      case 'destructive':
        return {
          bg: 'bg-rose-500/20',
          text: 'text-rose-400',
          border: 'border-rose-500/30',
          glow: 'shadow-rose-500/20'
        };
      default:
        return {
          bg: 'bg-slate-500/20',
          text: 'text-slate-400',
          border: 'border-slate-500/30',
          glow: 'shadow-slate-500/20'
        };
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const colors = getColors();
  const displayScore = (score * 100).toFixed(0);
  const prefix = score > 0 ? '+' : '';

  const badge = (
    <motion.div
      className={`inline-flex items-center gap-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} font-medium ${className}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      {showIcon && <Activity className="w-3 h-3" />}
      <span>{prefix}{displayScore}</span>
    </motion.div>
  );

  const friendlyTooltip = getFriendlyTooltip();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 border-gray-800 max-w-[200px]">
          <p className="text-xs font-medium mb-1">{getStatusLabel()}</p>
          <p className="text-xs text-gray-400">{friendlyTooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ResonanceIndicatorProps {
  magnitude: number; // 0-100
  phase: number; // 0-2π radians
  frequency: number; // tasks per day
  damping: number; // 0-1 friction factor
  label: string;
}

export function ResonanceIndicator({ 
  magnitude, 
  phase, 
  frequency, 
  damping,
  label 
}: ResonanceIndicatorProps) {
  // Calculate resonance score based on alignment
  const phaseAlignment = Math.cos(phase); // -1 to 1
  const resonanceScore = (magnitude / 100) * phaseAlignment * (1 - damping);

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-sm">{label}</span>
      <ResonanceBadge 
        score={resonanceScore}
        tooltip={`Magnitude: ${magnitude}% | Phase: ${(phase * 180 / Math.PI).toFixed(0)}° | Damping: ${(damping * 100).toFixed(0)}%`}
      />
    </div>
  );
}
