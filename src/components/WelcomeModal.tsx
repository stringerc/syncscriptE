import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from './ui/button';
import imgImageSyncScriptLogo from "figma:asset/914d5787f554946c037cbfbb2cf65fcc0de06278.png";

interface WelcomeModalProps {
  show: boolean;
  onClose: () => void;
  onGetStarted: () => void;
  onCustomizeProfile?: () => void;  // Optional: Navigate to profile setup
  userName?: string;
}

/**
 * FIRST-TIME USER WELCOME MODAL
 * 
 * Research-backed design principles:
 * 1. Show value BEFORE asking for work (Superhuman pattern)
 * 2. Clear call-to-action (single button, no choice paralysis)
 * 3. Visual delight (animations, gradients, icons)
 * 4. Dismissible but encouraged (X button available)
 * 5. Brief message (< 20 words for max retention)
 * 
 * This modal appears immediately after signup/login for first-time users
 * and introduces them to the sample data concept.
 */
export function WelcomeModal({
  show,
  onClose,
  onGetStarted,
  onCustomizeProfile,
  userName = 'there'
}: WelcomeModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl max-w-lg w-full pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated background effects */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl"
                  style={{ backgroundColor: '#6366f1' }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.06, 0.1, 0.06]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl"
                  style={{ backgroundColor: '#8b5cf6' }}
                  animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.06, 0.1, 0.06]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                />
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50"
                aria-label="Close welcome modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="relative z-10 p-8 pt-12">
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  className="flex justify-center mb-6"
                >
                  <img
                    src={imgImageSyncScriptLogo}
                    alt="SyncScript"
                    className="h-12"
                  />
                </motion.div>

                {/* Sparkles icon with animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring', damping: 12 }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center"
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    {/* Pulsing ring */}
                    <motion.div
                      animate={{
                        scale: [1, 1.4],
                        opacity: [0.5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-indigo-500/30 rounded-full"
                    />
                  </div>
                </motion.div>

                {/* Welcome text */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center space-y-3 mb-8"
                >
                  <h2 className="text-3xl font-bold text-white">
                    Welcome to SyncScript{userName !== 'there' ? `, ${userName}` : ''}! 🎉
                  </h2>
                  
                  <p className="text-lg text-slate-300 leading-relaxed max-w-md mx-auto">
                    This dashboard shows <span className="text-indigo-400 font-semibold">sample data</span> to demonstrate what's possible.
                  </p>
                  
                  <p className="text-base text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Your <span className="text-white font-medium">real journey</span> starts when you log your first energy level.
                  </p>
                </motion.div>

                {/* Feature highlights */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-3 gap-3 mb-8"
                >
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center">
                    <div className="text-2xl mb-1">⚡</div>
                    <div className="text-xs text-slate-400">Track Energy</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center">
                    <div className="text-2xl mb-1">🤖</div>
                    <div className="text-xs text-slate-400">AI Insights</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center">
                    <div className="text-2xl mb-1">🌈</div>
                    <div className="text-xs text-slate-400">ROYGBIV Loop</div>
                  </div>
                </motion.div>

                {/* CTA Buttons - Two Options */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  {/* Primary CTA: Quick Start */}
                  <Button
                    onClick={onGetStarted}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-lg py-6 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:scale-[1.02]"
                  >
                    <span>Quick Start</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  {/* Secondary CTA: Set Up Profile */}
                  {onCustomizeProfile && (
                    <Button
                      onClick={onCustomizeProfile}
                      variant="outline"
                      className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-200 hover:text-white text-base py-5 rounded-xl border-slate-700 hover:border-slate-600 transition-all"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      <span>Set Up My Profile First</span>
                    </Button>
                  )}
                </motion.div>

                {/* Subtle hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center text-xs text-slate-500 mt-4"
                >
                  {onCustomizeProfile 
                    ? 'Choose how you want to begin your journey' 
                    : 'Takes less than 30 seconds to get started'}
                </motion.p>
              </div>

              {/* Bottom gradient border */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
