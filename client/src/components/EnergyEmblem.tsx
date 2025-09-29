import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Heart, Sparkles, Waves } from 'lucide-react';

interface EnergyEmblemProps {
  energyLevel: number; // 0-100
  emblemType: 'bolt' | 'heart' | 'comet' | 'wave';
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
  className?: string;
}

const EnergyEmblem: React.FC<EnergyEmblemProps> = ({
  energyLevel,
  emblemType,
  isActive = true,
  size = 'md',
  showAnimation = true,
  className = ''
}) => {
  const [isSurge, setIsSurge] = useState(false);
  const [previousEnergy, setPreviousEnergy] = useState(energyLevel);

  // Size configurations
  const sizeConfig = {
    sm: { icon: 16, container: 'w-8 h-8' },
    md: { icon: 24, container: 'w-12 h-12' },
    lg: { icon: 32, container: 'w-16 h-16' }
  };

  // Emblem configurations
  const emblemConfig = {
    bolt: {
      icon: Zap,
      name: 'Lightning Bolt',
      colors: {
        low: 'text-yellow-400',
        medium: 'text-yellow-500',
        high: 'text-yellow-600',
        surge: 'text-yellow-300'
      },
      bgColors: {
        low: 'bg-yellow-100',
        medium: 'bg-yellow-200',
        high: 'bg-yellow-300',
        surge: 'bg-yellow-400'
      }
    },
    heart: {
      icon: Heart,
      name: 'Heart of Energy',
      colors: {
        low: 'text-pink-400',
        medium: 'text-pink-500',
        high: 'text-pink-600',
        surge: 'text-pink-300'
      },
      bgColors: {
        low: 'bg-pink-100',
        medium: 'bg-pink-200',
        high: 'bg-pink-300',
        surge: 'bg-pink-400'
      }
    },
    comet: {
      icon: Sparkles,
      name: 'Cosmic Comet',
      colors: {
        low: 'text-purple-400',
        medium: 'text-purple-500',
        high: 'text-purple-600',
        surge: 'text-purple-300'
      },
      bgColors: {
        low: 'bg-purple-100',
        medium: 'bg-purple-200',
        high: 'bg-purple-300',
        surge: 'bg-purple-400'
      }
    },
    wave: {
      icon: Waves,
      name: 'Energy Wave',
      colors: {
        low: 'text-blue-400',
        medium: 'text-blue-500',
        high: 'text-blue-600',
        surge: 'text-blue-300'
      },
      bgColors: {
        low: 'bg-blue-100',
        medium: 'bg-blue-200',
        high: 'bg-blue-300',
        surge: 'bg-blue-400'
      }
    }
  };

  // Determine energy state
  const getEnergyState = (level: number) => {
    if (level >= 80) return 'surge';
    if (level >= 60) return 'high';
    if (level >= 40) return 'medium';
    return 'low';
  };

  const energyState = getEnergyState(energyLevel);
  const config = emblemConfig[emblemType] || emblemConfig.bolt; // Default to bolt if emblemType is invalid
  const IconComponent = config.icon;

  // Detect energy surge
  useEffect(() => {
    if (showAnimation && energyLevel > previousEnergy && energyLevel >= 80) {
      setIsSurge(true);
      setTimeout(() => setIsSurge(false), 2000);
    }
    setPreviousEnergy(energyLevel);
  }, [energyLevel, previousEnergy, showAnimation]);

  // Animation variants
  const containerVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 }
    },
    surge: {
      scale: [1, 1.2, 1],
      rotate: [0, 5, -5, 0],
      transition: { duration: 0.6, ease: "easeInOut" }
    },
    pulse: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const iconVariants = {
    idle: {
      scale: 1,
      transition: { duration: 0.3 }
    },
    surge: {
      scale: [1, 1.3, 1],
      transition: { duration: 0.6, ease: "easeInOut" }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const sparkleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0 }
  };

  if (!isActive) {
    return (
      <div className={`${sizeConfig[size].container} ${className} flex items-center justify-center`}>
        <IconComponent 
          size={sizeConfig[size].icon} 
          className="text-gray-400" 
        />
      </div>
    );
  }

  return (
    <div className={`${sizeConfig[size].container} ${className} relative flex items-center justify-center`}>
      {/* Main emblem container */}
      <motion.div
        className={`${sizeConfig[size].container} rounded-full flex items-center justify-center ${
          energyState === 'surge' ? config.bgColors.surge : 
          energyState === 'high' ? config.bgColors.high :
          energyState === 'medium' ? config.bgColors.medium : 
          config.bgColors.low
        }`}
        variants={containerVariants}
        animate={isSurge ? 'surge' : energyLevel >= 60 ? 'pulse' : 'idle'}
        initial="idle"
      >
        <motion.div
          variants={iconVariants}
          animate={isSurge ? 'surge' : energyLevel >= 60 ? 'pulse' : 'idle'}
        >
          <IconComponent 
            size={sizeConfig[size].icon} 
            className={
              energyState === 'surge' ? config.colors.surge : 
              energyState === 'high' ? config.colors.high :
              energyState === 'medium' ? config.colors.medium : 
              config.colors.low
            }
          />
        </motion.div>
      </motion.div>

      {/* Surge sparkles */}
      <AnimatePresence>
        {isSurge && showAnimation && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  transformOrigin: '0 0'
                }}
                initial="hidden"
                exit="exit"
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
                animate={{
                  x: Math.cos((i * 60) * Math.PI / 180) * 30,
                  y: Math.sin((i * 60) * Math.PI / 180) * 30,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Energy level indicator */}
      {size !== 'sm' && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
          <div 
            className={`w-2 h-2 rounded-full ${
              energyState === 'surge' ? 'bg-yellow-400' :
              energyState === 'high' ? 'bg-green-500' :
              energyState === 'medium' ? 'bg-yellow-500' :
              'bg-red-400'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default EnergyEmblem;
