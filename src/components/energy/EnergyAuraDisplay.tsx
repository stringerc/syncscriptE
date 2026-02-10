import { motion } from 'motion/react';
import { Zap } from 'lucide-react';
import { useEnergy } from '../../contexts/EnergyContext';
import { Badge } from '../ui/badge';

interface EnergyAuraDisplayProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EnergyAuraDisplay({ 
  showLabel = true,
  size = 'md',
  className = '',
}: EnergyAuraDisplayProps) {
  const { energy } = useEnergy();
  
  const totalEnergy = energy.totalEnergy;
  const todayCompletions = energy.entries.length; // Count entries as completions
  
  const maxEnergy = 200;
  const fillPercentage = Math.min((totalEnergy / maxEnergy) * 100, 100);
  
  // ROYGBIV colors for glow cycling
  const roygbivColors = [
    '#FF0000', // Red
    '#FF7F00', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#0000FF', // Blue
    '#4B0082', // Indigo
    '#9400D3', // Violet
  ];
  
  // Cycle through colors based on completions
  const currentColorIndex = todayCompletions % roygbivColors.length;
  const currentColor = roygbivColors[currentColorIndex];
  
  // Size configurations
  const sizeConfig = {
    sm: { outer: 80, inner: 60, strokeWidth: 8, fontSize: 'text-lg' },
    md: { outer: 120, inner: 90, strokeWidth: 12, fontSize: 'text-2xl' },
    lg: { outer: 160, inner: 120, strokeWidth: 16, fontSize: 'text-3xl' },
  };
  
  const config = sizeConfig[size];
  const radius = config.outer / 2;
  const innerRadius = config.inner / 2;
  const circumference = 2 * Math.PI * (radius - config.strokeWidth / 2);
  const fillLength = (fillPercentage / 100) * circumference;
  
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-gray-300">Energy</span>
          <Badge variant="outline" className="bg-amber-600/20 text-amber-400 border-amber-600/30">
            {Math.round(totalEnergy)} pts
          </Badge>
        </div>
      )}
      
      {/* Aura Circle */}
      <div className="relative" style={{ width: config.outer, height: config.outer }}>
        {/* Outer glow layers */}
        {totalEnergy > 0 && (
          <>
            {/* Multiple glow rings for depth */}
            {[3, 2, 1].map((layer) => (
              <motion.div
                key={layer}
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${currentColor} 0%, transparent 70%)`,
                  filter: `blur(${layer * 8}px)`,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.125, 0.2, 0.125],
                }}
                transition={{
                  duration: 2 + layer * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: layer * 0.2,
                }}
              />
            ))}
            
            {/* Pulsing outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: currentColor,
                boxShadow: `0 0 20px ${currentColor}80`,
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </>
        )}
        
        {/* SVG Circle */}
        <svg
          width={config.outer}
          height={config.outer}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={radius}
            cy={radius}
            r={radius - config.strokeWidth / 2}
            fill="none"
            stroke="rgba(75, 85, 99, 0.3)"
            strokeWidth={config.strokeWidth}
          />
          
          {/* Progress circle with gradient */}
          <defs>
            <linearGradient id={`auraGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              {roygbivColors.map((color, index) => (
                <stop
                  key={index}
                  offset={`${(index / (roygbivColors.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </linearGradient>
          </defs>
          
          <motion.circle
            cx={radius}
            cy={radius}
            r={radius - config.strokeWidth / 2}
            fill="none"
            stroke={`url(#auraGradient-${size})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - fillLength }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${currentColor})`,
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className={`${config.fontSize} font-bold text-white`}
            animate={{
              textShadow: [
                `0 0 10px ${currentColor}`,
                `0 0 20px ${currentColor}`,
                `0 0 10px ${currentColor}`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {Math.round(totalEnergy)}
          </motion.div>
          <div className="text-xs text-gray-400">energy</div>
        </div>
        
        {/* Particle effects for high energy */}
        {totalEnergy > 100 && (
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  backgroundColor: roygbivColors[i % roygbivColors.length],
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [0, Math.cos((i / 8) * Math.PI * 2) * radius * 1.5],
                  y: [0, Math.sin((i / 8) * Math.PI * 2) * radius * 1.5],
                  opacity: [1, 0],
                  scale: [1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Completions indicator */}
      {todayCompletions > 0 && (
        <motion.div
          className="flex items-center gap-2 text-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex gap-1">
            {[...Array(Math.min(todayCompletions, 7))].map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: roygbivColors[i] }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
              />
            ))}
            {todayCompletions > 7 && (
              <span className="text-gray-400 ml-1">+{todayCompletions - 7}</span>
            )}
          </div>
          <span className="text-gray-400">completions</span>
        </motion.div>
      )}
    </div>
  );
}