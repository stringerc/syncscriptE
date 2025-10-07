import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy, Flame, Zap } from 'lucide-react';

interface SuccessCelebrationProps {
  show: boolean;
  message: string;
  points?: number;
  emblem?: { emoji: string; name: string };
  onComplete?: () => void;
}

/**
 * Full-screen success celebration overlay
 * Shows when completing major milestones
 */
export function SuccessCelebration({ show, message, points, emblem, onComplete }: SuccessCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timeout = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in pointer-events-none">
      <div className="animate-scale-in">
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1 rounded-3xl shadow-2xl">
          <div className="bg-white rounded-3xl p-8 md:p-12 text-center space-y-6 max-w-md">
            {/* Icon */}
            <div className="relative">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-celebration">
                {emblem ? (
                  <span className="text-5xl">{emblem.emoji}</span>
                ) : (
                  <Trophy className="w-12 h-12 text-white" />
                )}
              </div>
              {/* Sparkles */}
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
              <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-purple-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>

            {/* Message */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🎉 {message}
              </h2>
              {emblem && (
                <p className="text-lg text-purple-600 font-semibold">
                  {emblem.name} Unlocked!
                </p>
              )}
            </div>

            {/* Points */}
            {points && (
              <div className="flex items-center justify-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  +{points} Points
                </span>
              </div>
            )}

            {/* Confetti effect (simplified) */}
            <div className="flex justify-center gap-2 text-2xl animate-pulse">
              🎊 ✨ 🎉 ⭐ 🌟
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini celebration for smaller achievements
 */
export function MiniCelebration({ icon = '✨', duration = 1000 }: { icon?: string; duration?: number }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    return () => clearTimeout(timeout);
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-scale-in">
      <div className="text-6xl animate-celebration">
        {icon}
      </div>
    </div>
  );
}

