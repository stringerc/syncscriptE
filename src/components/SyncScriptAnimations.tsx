import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Sparkles, Zap, Bot, Target, Shield, Brain, Rocket } from 'lucide-react';

interface SyncScriptLoadingProps {
  message?: string;
  stage?: 'initializing' | 'connecting' | 'syncing' | 'ready';
}

const STAGE_MESSAGES = {
  initializing: 'Initializing SyncScript...',
  connecting: 'Connecting to your workflow...',
  syncing: 'Syncing your universe...',
  ready: 'Ready to launch!'
};

const STAGE_ICONS = {
  initializing: Bot,
  connecting: Zap,
  syncing: Sparkles,
  ready: Rocket
};

export function SyncScriptLoading({ 
  message,
  stage = 'initializing'
}: SyncScriptLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, color: string}>>([]);

  useEffect(() => {
    // Generate particles
    const newParticles = [...Array(15)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981'][Math.floor(Math.random() * 4)]
    }));
    setParticles(newParticles);

    // Progress animation
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + Math.random() * 3;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const Icon = STAGE_ICONS[stage];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center bottom'
          }}
        />

        {/* Floating Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              boxShadow: `0 0 10px ${particle.color}`
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut'
            }}
          />
        ))}

        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Logo Animation */}
        <div className="relative mb-8">
          {/* Outer Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-indigo-400/30"
            style={{ width: 120, height: 120, marginLeft: -60, marginTop: -60, left: '50%', top: '50%' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Middle Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-purple-400/30"
            style={{ width: 100, height: 100, marginLeft: -50, marginTop: -50, left: '50%', top: '50%' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-pink-400/30"
            style={{ width: 80, height: 80, marginLeft: -40, marginTop: -40, left: '50%', top: '50%' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />

          {/* Center Icon */}
          <motion.div
            className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 20px rgba(99, 102, 241, 0.5)',
                '0 0 40px rgba(168, 85, 247, 0.5)',
                '0 0 20px rgba(99, 102, 241, 0.5)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
              <Icon className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>
        </div>

        {/* Brand Name */}
        <motion.h1
          className="text-4xl font-bold mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            SyncScript
          </span>
        </motion.h1>

        {/* Stage Message */}
        <motion.p
          className="text-gray-400 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={stage}
        >
          {message || STAGE_MESSAGES[stage]}
        </motion.p>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Progress Text */}
        <motion.p
          className="mt-2 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(progress)}%
        </motion.p>

        {/* Feature Highlights */}
        <motion.div
          className="mt-8 flex justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { icon: Brain, label: 'AI Powered' },
            { icon: Target, label: 'Goal Focused' },
            { icon: Shield, label: 'Secure' }
          ].map((feature, i) => (
            <motion.div
              key={feature.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            >
              <feature.icon className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-gray-400">{feature.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// Fun hover effect button
export function SyncScriptButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md'
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white',
    secondary: 'bg-white/10 text-white border border-white/20',
    ghost: 'bg-transparent text-white hover:bg-white/5'
  };

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative rounded-xl font-medium overflow-hidden
        ${sizeClasses[size]}
        ${variantClasses[variant]}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
        initial={{ x: '-200%' }}
        animate={{ x: isHovered ? '200%' : '-200%' }}
        transition={{ duration: 0.6 }}
      />

      {/* Sparkles on hover */}
      {isHovered && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                y: [0, -20],
                x: [(i - 1) * 20, (i - 1) * 30]
              }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              style={{ left: '50%', top: '50%' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
          ))}
        </>
      )}

      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

// Feature card with hover animation
export function FeatureCard({
  icon: Icon,
  title,
  description,
  color = 'indigo'
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color?: 'indigo' | 'purple' | 'pink' | 'green' | 'blue';
}) {
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    indigo: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    pink: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
    green: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
  };

  const iconColors = {
    indigo: 'text-indigo-400',
    purple: 'text-purple-400',
    pink: 'text-pink-400',
    green: 'text-emerald-400',
    blue: 'text-blue-400'
  };

  return (
    <motion.div
      className={`
        relative p-6 rounded-2xl bg-gradient-to-br ${colorClasses[color]}
        border backdrop-blur-sm cursor-pointer
        transition-all duration-300
      `}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colorClasses[color]} blur-xl`}
        animate={{ opacity: isHovered ? 0.6 : 0.2 }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon */}
      <motion.div
        className={`relative w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4`}
        animate={{
          rotate: isHovered ? [0, -10, 10, 0] : 0,
          scale: isHovered ? 1.1 : 1
        }}
        transition={{ duration: 0.5 }}
      >
        <Icon className={`w-6 h-6 ${iconColors[color]}`} />
      </motion.div>

      {/* Content */}
      <h3 className="relative text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="relative text-sm text-gray-400">{description}</p>

      {/* Hover indicator */}
      <motion.div
        className="absolute bottom-4 right-4"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
      >
        <Zap className={`w-5 h-5 ${iconColors[color]}`} />
      </motion.div>
    </motion.div>
  );
}
