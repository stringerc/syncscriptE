import { motion } from 'motion/react';
import { Activity, TrendingUp } from 'lucide-react';

interface PhaseLockDialProps {
  alignment: number; // 0 to 1 (poor to perfect alignment)
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PhaseLockDial({ alignment, label = 'Phase Lock', size = 'md' }: PhaseLockDialProps) {
  const sizes = {
    sm: { dial: 80, stroke: 6, text: 'text-lg' },
    md: { dial: 120, stroke: 8, text: 'text-2xl' },
    lg: { dial: 160, stroke: 10, text: 'text-3xl' }
  };

  const { dial, stroke, text } = sizes[size];
  const radius = (dial - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (alignment * circumference);

  // Color based on alignment
  const getColor = () => {
    if (alignment >= 0.8) return { stroke: '#10b981', glow: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' }; // green
    if (alignment >= 0.6) return { stroke: '#0d9488', glow: 'drop-shadow(0 0 8px rgba(13, 148, 136, 0.5))' }; // teal
    if (alignment >= 0.4) return { stroke: '#f59e0b', glow: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))' }; // amber
    return { stroke: '#ef4444', glow: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))' }; // red
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: dial, height: dial }}>
        {/* Background circle */}
        <svg width={dial} height={dial} className="transform -rotate-90">
          <circle
            cx={dial / 2}
            cy={dial / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx={dial / 2}
            cy={dial / 2}
            r={radius}
            stroke={color.stroke}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: color.glow }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <Activity className="w-6 h-6 text-gray-400 mb-1" />
          </motion.div>
          <motion.span
            className={`${text} font-bold text-white`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {Math.round(alignment * 100)}%
          </motion.span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-xs text-gray-500">
          {alignment >= 0.8 ? '🎵 In Tune' : alignment >= 0.6 ? '✨ Good Flow' : alignment >= 0.4 ? '⚠️ Off-Beat' : '❌ Needs Tuning'}
        </p>
      </div>
    </div>
  );
}

interface MiniPhaseLockDialProps {
  alignment: number;
  size?: number;
}

export function MiniPhaseLockDial({ alignment, size = 40 }: MiniPhaseLockDialProps) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (alignment * circumference);

  const getColor = () => {
    if (alignment >= 0.8) return '#10b981';
    if (alignment >= 0.6) return '#0d9488';
    if (alignment >= 0.4) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">
          {Math.round(alignment * 100)}
        </span>
      </div>
    </div>
  );
}
