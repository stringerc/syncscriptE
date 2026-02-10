import { motion } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getROYGBIVProgress } from '../utils/progress-calculations';

interface AnimatedAvatarProps {
  name: string;
  image: string;
  fallback?: string;
  progress?: number; // 0-100, default to 0
  animationType?: 'glow' | 'heartbeat' | 'shake' | 'spin' | 'pulse' | 'wiggle' | 'bounce' | 'none';
  className?: string;
  size?: number; // size in pixels for the avatar (default 36)
  status?: 'online' | 'away' | 'offline'; // Online status indicator
}

// Enhanced floating debris with energy aura (Super Saiyan effect)
function FloatingDebris({ size, intensity }: { size: number; intensity: number }) {
  const particles = Array.from({ length: 12 });
  
  return (
    <>
      {/* Golden energy aura */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgb(251, 191, 36) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.09, 0.18, 0.09],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Floating debris particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: '50%' }}>
        {particles.map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${10 + (i * 8)}%`,
              bottom: '-15%',
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              background: i % 2 === 0 ? '#fbbf24' : '#f59e0b',
              boxShadow: '0 0 4px rgba(251, 191, 36, 0.8)',
            }}
            animate={{
              y: [0, -(size * 1.4)],
              x: [0, (Math.random() - 0.5) * 25 * intensity],
              opacity: [0.9, 0],
              scale: [1.2, 0.3],
              rotate: [0, Math.random() * 360],
            }}
            transition={{
              duration: 1.2 + Math.random() * 0.6,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
      
      {/* Electrical sparks for high intensity */}
      {intensity > 0.7 && (
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`spark-${i}`}
              className="absolute w-px h-3 bg-yellow-300"
              style={{
                left: '50%',
                top: '50%',
                boxShadow: '0 0 6px #fef08a',
              }}
              animate={{
                x: [0, Math.cos(i * Math.PI * 2 / 3) * size * 0.6],
                y: [0, Math.sin(i * Math.PI * 2 / 3) * size * 0.6],
                opacity: [0, 1, 0],
                scaleY: [1, 1.5, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

// Enhanced EKG line with grid background and glow (Heartbeat effect)
// The EKG animation is synchronized with the heartbeat animation timing
function EKGLine({ size, radius, progress, duration }: { size: number; radius: number; progress: number; duration: number }) {
  const heartbeatCount = Math.max(1, Math.floor(progress / 25));
  const centerY = (size + 8) / 2;
  const startX = (size + 8) / 2 - radius;
  const endX = (size + 8) / 2 + radius;
  const totalWidth = endX - startX;
  const segmentWidth = totalWidth / (heartbeatCount + 1);
  const intensity = progress / 100;
  
  const createEKGPath = () => {
    let path = `M ${startX} ${centerY}`;
    
    for (let i = 0; i < heartbeatCount; i++) {
      const beatStart = startX + segmentWidth * (i + 0.3);
      const beatCenter = startX + segmentWidth * (i + 0.5);
      const beatEnd = startX + segmentWidth * (i + 0.7);
      
      path += ` L ${beatStart} ${centerY}`;
      path += ` L ${beatStart + 2} ${centerY - 2}`;
      path += ` L ${beatStart + 4} ${centerY}`;
      path += ` L ${beatCenter - 6} ${centerY}`;
      path += ` L ${beatCenter - 3} ${centerY + 3}`;
      path += ` L ${beatCenter - 1} ${centerY - 12}`;
      path += ` L ${beatCenter + 1} ${centerY + 4}`;
      path += ` L ${beatEnd - 4} ${centerY}`;
      path += ` L ${beatEnd - 2} ${centerY - 3}`;
      path += ` L ${beatEnd} ${centerY}`;
    }
    
    path += ` L ${endX} ${centerY}`;
    return path;
  };
  
  return (
    <svg 
      className="absolute pointer-events-none"
      width={size + 8}
      height={size + 8}
      style={{ 
        left: '50%', 
        top: '50%', 
        transform: 'translate(-50%, -50%)',
        zIndex: 11
      }}
    >
      <defs>
        <clipPath id={`avatar-clip-${size}`}>
          <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={radius - 3} />
        </clipPath>
        <filter id={`glow-${size}`}>
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <g clipPath={`url(#avatar-clip-${size})`}>
        {/* Subtle grid background */}
        <rect 
          x={startX} 
          y={centerY - 15} 
          width={totalWidth} 
          height={30}
          fill="none"
          stroke="rgba(239, 68, 68, 0.1)"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
        
        {/* EKG line with glow - synchronized with heartbeat */}
        <motion.path
          d={createEKGPath()}
          stroke="#ef4444"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${size})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 0.17, 0.17, 0.34, 0.34, 1],
            opacity: [0, 1, 1, 1, 1, 0],
          }}
          transition={{
            duration: duration,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.17, 0.19, 0.36, 0.38, 1], // Matches heartbeat scale pattern
          }}
        />
      </g>
    </svg>
  );
}

// Simple lightning bolts (Shake effect)
function LightningBolts({ size }: { size: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            width: size * 0.6,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
            transformOrigin: 'center',
          }}
          animate={{
            rotate: [0, 120, 240, 360],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

// Enhanced orbital particles with trails (Spin effect)
function OrbitalParticles({ size, intensity }: { size: number; intensity: number }) {
  const orbitRadius = size * 0.7;
  
  return (
    <>
      {[0, 1, 2].map((i) => {
        const angle = i * (Math.PI * 2 / 3);
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
            }}
          >
            {/* Particle trail */}
            <motion.div
              className="absolute w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent rounded-full"
              style={{
                transformOrigin: 'left center',
                left: -4,
                top: -0.25,
              }}
              animate={{
                rotate: [angle * (180 / Math.PI), angle * (180 / Math.PI) + 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            {/* Main particle */}
            <motion.div
              className="absolute w-2 h-2 bg-cyan-400 rounded-full"
              style={{
                boxShadow: '0 0 8px rgba(6, 182, 212, 0.8)',
                left: -4,
                top: -4,
              }}
              animate={{
                x: [
                  Math.cos(angle) * orbitRadius,
                  Math.cos(angle + Math.PI * 2) * orbitRadius,
                ],
                y: [
                  Math.sin(angle) * orbitRadius,
                  Math.sin(angle + Math.PI * 2) * orbitRadius,
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>
        );
      })}
    </>
  );
}

// Enhanced ripple waves with gradient (Pulse effect)
function RippleWaves({ size }: { size: number }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            border: '2px solid transparent',
            background: 'linear-gradient(rgba(168, 85, 247, 0.4), rgba(147, 51, 234, 0.2)) border-box',
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
          animate={{
            width: [size * 0.8, size * 2],
            height: [size * 0.8, size * 2],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeOut',
          }}
        />
      ))}
      
      {/* Center glow pulse */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: size,
          height: size,
          background: 'radial-gradient(circle, rgb(168, 85, 247) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.16, 0.1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </>
  );
}

// Enhanced sound waves with multiple bars (Wiggle effect)
function SoundWaves({ size }: { size: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {[-1, 1].map((direction, idx) => (
        <div key={idx} className="absolute" style={{ [direction === -1 ? 'right' : 'left']: '100%' }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute h-0.5 rounded-full"
              style={{
                left: direction === -1 ? '-20px' : '0px',
                top: `${-4 + i * 3}px`,
                width: '16px',
                background: `linear-gradient(${direction === -1 ? '270deg' : '90deg'}, transparent, #10b981, transparent)`,
              }}
              animate={{
                scaleX: [0.4, 1.4, 0.4],
                opacity: [0.3, 0.9, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Enhanced bounce impact with expanding rings (Bounce effect)
function BounceImpact({ size }: { size: number }) {
  return (
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 pointer-events-none" style={{ width: size * 1.5 }}>
      {/* Main impact line */}
      <motion.div
        className="w-full h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full"
        style={{
          boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)',
        }}
        animate={{
          scaleX: [0.5, 1.3, 0.5],
          opacity: [0, 0.9, 0],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Expanding impact rings */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 bottom-0 transform -translate-x-1/2 border-2 border-orange-400 rounded-full"
          style={{
            boxShadow: '0 0 6px rgba(249, 115, 22, 0.4)',
          }}
          animate={{
            width: [size * 0.3, size * 1.2],
            height: [size * 0.15, size * 0.6],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export function AnimatedAvatar({ 
  name,
  image,
  fallback,
  progress = 0, // Default to 0 instead of undefined
  animationType = 'none',
  className,
  size = 36,
  status
}: AnimatedAvatarProps) {
  // Auto-generate fallback from name if not provided
  const avatarFallback = fallback || name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  const strokeWidth = size <= 44 ? 3 : Math.max(3, Math.round(size / 16)); // Scale stroke with size
  const radius = (size / 2) + 4;
  const circumference = 2 * Math.PI * radius;
  // Ensure progress is a valid number between 0 and 100
  const validProgress = Math.max(0, Math.min(100, progress || 0));
  
  // ══════════════════════════════════════════════════════════════════════════════
  // ROYGBIV LOOP PROGRESSION
  // ══════════════════════════════════════════════════════════════════════════════
  // Convert overall progress to ROYGBIV loop system
  // Example: 45% overall → Green ring at 15% filled
  // ══════════════════════════════════════════════════════════════════════════════
  const roygbivProgress = getROYGBIVProgress(validProgress);
  
  // Use the fill percentage (0-100% within current color) for the ring display
  const displayProgress = roygbivProgress.fillPercentage;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;
  const intensity = displayProgress / 100;

  // Animation variants based on type and intensity (progress)
  const getAnimation = () => {
    switch (animationType) {
      case 'glow':
        return {
          scale: [1, 1 + (0.08 * intensity), 1],
          filter: [
            'brightness(1) drop-shadow(0 0 0px rgba(255, 215, 0, 0))',
            `brightness(1.3) drop-shadow(0 0 ${10 * intensity}px rgba(255, 215, 0, 0.9))`,
            'brightness(1) drop-shadow(0 0 0px rgba(255, 215, 0, 0))',
          ],
        };
      
      case 'heartbeat':
        return {
          scale: [1, 1 + (0.12 * intensity), 1, 1 + (0.06 * intensity), 1],
        };
      
      case 'shake':
        return {
          x: [0, -2.5 * intensity, 2.5 * intensity, -2.5 * intensity, 0],
          rotate: [0, -1, 1, -1, 0],
        };
      
      case 'spin':
        return {
          x: [0, 3 * intensity, 0, -3 * intensity, 0],
          y: [0, -3 * intensity, 0, 3 * intensity, 0],
        };
      
      case 'pulse':
        return {
          scale: [1, 1 + (0.07 * intensity), 1],
          opacity: [1, 0.85, 1],
        };
      
      case 'wiggle':
        return {
          rotate: [0, -5 * intensity, 5 * intensity, -5 * intensity, 0],
        };
      
      case 'bounce':
        return {
          y: [0, -5 * intensity, 0],
        };
      
      default:
        return {};
    }
  };

  // Duration varies with intensity - higher progress = faster animation
  const getDuration = () => {
    const baseDuration = animationType === 'heartbeat' ? 1.2 : 
                        animationType === 'glow' ? 2 :
                        animationType === 'shake' ? 0.5 :
                        animationType === 'spin' ? 3 :
                        animationType === 'pulse' ? 2.5 :
                        animationType === 'wiggle' ? 1.5 :
                        1.8; // bounce
    
    return baseDuration * (1 - (progress / 200)); // Higher progress = faster
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // ROYGBIV COLOR SYSTEM - Loop Progression (Like Energy Points!)
  // ══════════════════════════════════════════════════════════════════════════════
  // Progress rings "level up" through ROYGBIV colors:
  // 
  // - 0-14% overall → RED ring fills from 0% → 100%
  // - 15-28% overall → ORANGE ring fills from 0% → 100%
  // - 29-42% overall → YELLOW ring fills from 0% → 100%
  // - 43-57% overall → GREEN ring fills from 0% → 100%
  // - 58-71% overall → BLUE ring fills from 0% → 100%
  // - 72-85% overall → INDIGO ring fills from 0% → 100%
  // - 86-100% overall → VIOLET ring fills from 0% → 100%
  // 
  // Example: 45% overall progress
  // → Green level (43-57% range)
  // → 15% filled within green
  // → Display: Green ring at 15%
  // 
  // Research: Duolingo (2023), Oura Ring (2023), Whoop (2024)
  // ══════════════════════════════════════════════════════════════════════════════
  
  const getProgressColor = () => {
    // Use the color from ROYGBIV progression
    const color = roygbivProgress.color;
    return [color, color, color];
  };

  return (
    <div className="relative inline-block" style={{ width: size + 8, height: size + 8, overflow: 'visible' }}>
      {/* Effects that appear outside the animated container */}
      {animationType === 'pulse' && <RippleWaves size={size} />}
      
      {/* Animated Container - both progress bar and avatar move together */}
      <motion.div
        className="relative w-full h-full"
        style={{ overflow: 'visible' }}
        animate={getAnimation()}
        transition={{
          duration: getDuration(),
          repeat: Infinity,
          ease: animationType === 'heartbeat' ? 'easeInOut' : 'linear',
        }}
      >
        {/* Glowing ring effect for progress bar */}
        <svg 
          className="absolute pointer-events-none"
          width={size + 8}
          height={size + 8}
          style={{ 
            left: '50%', 
            top: '50%', 
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            zIndex: 9,
            filter: `drop-shadow(0 0 ${2 + intensity * 4}px ${getProgressColor()[1]}40)`,
          }}
        >
          <defs>
            <linearGradient id={`progress-gradient-${animationType}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={getProgressColor()[0]} stopOpacity="0.6" />
              <stop offset="50%" stopColor={getProgressColor()[1]} stopOpacity="1" />
              <stop offset="100%" stopColor={getProgressColor()[2]} stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Circular progress ring with color animation */}
        <svg 
          className="absolute pointer-events-none"
          width={size + 8}
          height={size + 8}
          style={{ 
            left: '50%', 
            top: '50%', 
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            zIndex: 10
          }}
        >
          {/* Background circle */}
          <circle
            cx={(size + 8) / 2}
            cy={(size + 8) / 2}
            r={radius}
            fill="none"
            stroke="rgba(75, 85, 99, 0.3)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle with gradient */}
          <motion.circle
            cx={(size + 8) / 2}
            cy={(size + 8) / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            animate={{
              stroke: getProgressColor(),
            }}
            transition={{
              duration: getDuration(),
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </svg>

        {/* Special effects overlay for each animation type */}
        {animationType === 'heartbeat' && <EKGLine size={size} radius={radius} progress={validProgress} duration={getDuration()} />}
        {animationType === 'glow' && <FloatingDebris size={size} intensity={intensity} />}
        {animationType === 'shake' && <LightningBolts size={size} />}
        {animationType === 'spin' && <OrbitalParticles size={size} intensity={intensity} />}
        {animationType === 'wiggle' && <SoundWaves size={size} />}
        {animationType === 'bounce' && <BounceImpact size={size} />}
        
        {/* Avatar */}
        <Avatar 
          className="rounded-full overflow-hidden"
          style={{ 
            width: size, 
            height: size,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%'
          }}
        >
          <AvatarImage 
            src={image} 
            alt={name}
            className="rounded-full"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              borderRadius: '50%'
            }}
          />
          <AvatarFallback className="rounded-full">{avatarFallback}</AvatarFallback>
        </Avatar>
      </motion.div>

      {/* Status Indicator - Online/Away/Offline dot */}
      {status && (
        <div 
          className={`absolute bottom-0 right-0 rounded-full border-2 border-[#1a1d24] z-20 ${
            status === 'online' ? 'bg-green-400' :
            status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
          }`}
          style={{
            width: size > 48 ? '12px' : size > 36 ? '10px' : '8px',
            height: size > 48 ? '12px' : size > 36 ? '10px' : '8px',
          }}
        />
      )}
    </div>
  );
}