import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Gamepad2, X, Trophy, Star } from 'lucide-react';

// Konami Code Easter Egg
export function useKonamiCode(onActivate: () => void) {
  const [sequence, setSequence] = useState<string[]>([]);
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const newSequence = [...sequence, e.key].slice(-10);
      setSequence(newSequence);
      
      if (newSequence.join(',') === konamiCode.join(',')) {
        onActivate();
        setSequence([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sequence, onActivate]);
}

// Secret Game Modal
export function SecretGame({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState<Array<{id: number; x: number; y: number}>>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    if (isPlaying && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
    }
  }, [isOpen, isPlaying, timeLeft]);

  useEffect(() => {
    if (!isPlaying) return;

    const spawnTarget = () => {
      const id = Date.now();
      const x = Math.random() * 80 + 10;
      const y = Math.random() * 60 + 20;
      setTargets(prev => [...prev, { id, x, y }]);
      
      setTimeout(() => {
        setTargets(prev => prev.filter(t => t.id !== id));
      }, 2000);
    };

    const interval = setInterval(spawnTarget, 800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setTargets([]);
    setIsPlaying(true);
  };

  const hitTarget = (id: number) => {
    setScore(s => s + 10);
    setTargets(prev => prev.filter(t => t.id !== id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative w-full max-w-2xl bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 m-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-6 h-6 text-pink-400" />
                <h2 className="text-xl font-bold text-white">Secret Game: Target Practice!</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Game Area */}
            <div className="relative h-80 bg-black/30 rounded-xl overflow-hidden mb-4">
              {!isPlaying && timeLeft === 30 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-gray-400 mb-4">Click the targets as fast as you can!</p>
                  <motion.button
                    onClick={startGame}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Game
                  </motion.button>
                </div>
              )}

              {!isPlaying && timeLeft === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
                  <p className="text-2xl font-bold text-white mb-2">Game Over!</p>
                  <p className="text-xl text-indigo-400 mb-4">Score: {score}</p>
                  <motion.button
                    onClick={startGame}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Play Again
                  </motion.button>
                </div>
              )}

              {isPlaying && (
                <>
                  {/* HUD */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between text-white">
                    <div>Score: {score}</div>
                    <div>Time: {timeLeft}s</div>
                  </div>

                  {/* Targets */}
                  {targets.map(target => (
                    <motion.button
                      key={target.id}
                      className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center"
                      style={{ left: `${target.x}%`, top: `${target.y}%` }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      onClick={() => hitTarget(target.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Star className="w-6 h-6 text-white" />
                    </motion.button>
                  ))}
                </>
              )}
            </div>

            <p className="text-xs text-gray-500 text-center">
              🎮 Easter Egg Unlocked! You found the secret game!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Floating Action Button with Easter Egg hint
export function FloatingEasterEgg({ onActivate }: { onActivate: () => void }) {
  const [clicks, setClicks] = useState(0);

  const handleClick = () => {
    const newClicks = clicks + 1;
    setClicks(newClicks);
    if (newClicks >= 5) {
      onActivate();
      setClicks(0);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 z-40"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={{
        boxShadow: [
          '0 0 20px rgba(99, 102, 241, 0.4)',
          '0 0 40px rgba(168, 85, 247, 0.4)',
          '0 0 20px rgba(99, 102, 241, 0.4)'
        ]
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Sparkles className="w-6 h-6 text-white" />
    </motion.button>
  );
}

// Achievement Unlocked Toast
export function AchievementToast({ 
  title, 
  description,
  icon: Icon 
}: { 
  title: string; 
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const IconComponent = Icon || Trophy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl px-6 py-4 flex items-center gap-4">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: 2 }}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center"
        >
          <IconComponent className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <p className="text-xs text-yellow-400 font-medium uppercase tracking-wider">Achievement Unlocked!</p>
          <h4 className="text-white font-semibold">{title}</h4>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Easter Egg Provider Component
export function EasterEggProvider({ children }: { children: React.ReactNode }) {
  const [gameOpen, setGameOpen] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);

  useKonamiCode(() => {
    setGameOpen(true);
    setShowAchievement(true);
    setTimeout(() => setShowAchievement(false), 5000);
  });

  return (
    <>
      {children}
      <FloatingEasterEgg onActivate={() => setGameOpen(true)} />
      <SecretGame isOpen={gameOpen} onClose={() => setGameOpen(false)} />
      {showAchievement && (
        <AchievementToast
          title="Code Breaker"
          description="You discovered the Konami Code secret!"
          icon={Gamepad2}
        />
      )}
    </>
  );
}
