import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Music, Zap, Clock, TrendingUp, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface ResonanceOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function ResonanceOnboarding({ onComplete, onSkip }: ResonanceOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to SyncScript! 🎵",
      subtitle: "I help your day feel smooth, like a song that hits every beat.",
      icon: Music,
      content: "Your day is full of waves — work, tasks, rest, and focus. When the waves line up, life feels easy.",
      color: "from-purple-600 to-blue-600"
    },
    {
      title: "The Problem",
      subtitle: "Sometimes your waves crash into each other",
      icon: Activity,
      content: "Like homework and video games fighting for your brain, or deep work scheduled when you're tired.",
      color: "from-rose-600 to-orange-600"
    },
    {
      title: "The Fix",
      subtitle: "We tune your day like sound",
      icon: Zap,
      content: "I watch your rhythm and help you line things up. You'll do hard stuff when you're strongest and rest when you're not.",
      color: "from-teal-600 to-cyan-600"
    },
    {
      title: "Your Color Map",
      subtitle: "Green means good timing — you're in tune",
      icon: TrendingUp,
      content: "Green = good timing, less drag\nYellow = okay\nRed = too much drag, needs moving",
      color: "from-green-600 to-emerald-600"
    },
    {
      title: "Your Power Hours",
      subtitle: "When you're on-beat, work feels lighter",
      icon: Clock,
      content: "I'll highlight your power hours — when you're most focused. That's when hard work feels easy.",
      color: "from-amber-600 to-yellow-600"
    },
    {
      title: "You're in Control",
      subtitle: "You're the DJ; I just help with timing",
      icon: Music,
      content: "You can always say 'Keep it where it is' or 'Try your way'. After each block, tell me how it felt — I'll learn your rhythm.",
      color: "from-purple-600 to-pink-600"
    }
  ];

  const step = steps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ opacity: 0.8 }}>
      <motion.div
        className="bg-[#1a1c20] border border-gray-800 rounded-2xl max-w-2xl w-full overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Step {currentStep + 1} of {steps.length}</p>
              {/* Research: Cyan-teal for progress/onboarding (conveys forward movement) */}
              <Progress value={progress} className="h-1 w-32 mt-1" indicatorClassName="bg-gradient-to-r from-teal-500 to-cyan-400" />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-gray-400 hover:text-white"
          >
            Skip <X className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-8 min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl text-white mb-2">{step.title}</h2>
              <p className="text-lg text-gray-400 mb-6">{step.subtitle}</p>
              
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {step.content}
                </p>
              </div>

              {/* Visual example for specific steps */}
              {currentStep === 3 && (
                <div className="mt-6 flex gap-3 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500/20 border-2 border-green-500 rounded" />
                    <span className="text-sm text-gray-400">In Tune</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-500/20 border-2 border-yellow-500 rounded" />
                    <span className="text-sm text-gray-400">Okay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-rose-500/20 border-2 border-rose-500 rounded" />
                    <span className="text-sm text-gray-400">Clash</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Let's Find My Rhythm 🎵
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Compact version for help icon
export function ResonanceQuickHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">How Resonance Works</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-teal-400 font-medium mb-1">🎵 In Tune (Green)</p>
          <p className="text-gray-400">Good timing—this will feel easier</p>
        </div>

        <div>
          <p className="text-amber-400 font-medium mb-1">⚠️ Off-Beat (Yellow)</p>
          <p className="text-gray-400">Bad timing—expect drag</p>
        </div>

        <div>
          <p className="text-rose-400 font-medium mb-1">❌ Clash (Red)</p>
          <p className="text-gray-400">Heavy conflict—move for better flow</p>
        </div>

        <div className="pt-3 border-t border-gray-800">
          <p className="text-gray-300 italic text-xs">
            "We tune your day like sound. Tasks that 'sound good together' go next to each other."
          </p>
        </div>
      </div>
    </div>
  );
}
