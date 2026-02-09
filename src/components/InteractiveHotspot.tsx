import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowDown, MousePointerClick } from 'lucide-react';
import { Button } from './ui/button';

interface InteractiveHotspotProps {
  show: boolean;
  targetId: string;
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  onDismiss: () => void;
  onAction?: () => void;
  actionLabel?: string;
  showPointer?: boolean;
}

/**
 * INTERACTIVE HOTSPOT COMPONENT
 * 
 * Research-backed progressive disclosure pattern:
 * - Pulsing animation draws eye attention (Nielsen Norman Group)
 * - Contextual positioning (attached to target element)
 * - Dismissible but not intrusive (user maintains control)
 * - Clear action prompt (reduces cognitive load)
 * 
 * Used for guiding first-time users through key actions:
 * 1. Log first energy level
 * 2. View AI suggestions
 * 3. Create first script
 * 4. Check ROYGBIV progress
 */
export function InteractiveHotspot({
  show,
  targetId,
  message,
  position = 'bottom',
  offset = 16,
  onDismiss,
  onAction,
  actionLabel = 'Got it!',
  showPointer = true
}: InteractiveHotspotProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          {/* Calculate position based on target element */}
          <HotspotContent
            targetId={targetId}
            message={message}
            position={position}
            offset={offset}
            onDismiss={onDismiss}
            onAction={onAction}
            actionLabel={actionLabel}
            showPointer={showPointer}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HotspotContent({
  targetId,
  message,
  position,
  offset,
  onDismiss,
  onAction,
  actionLabel,
  showPointer
}: Omit<InteractiveHotspotProps, 'show'>) {
  // In a real implementation, we'd calculate position based on target element's DOMRect
  // For now, we'll use absolute positioning
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Pulsing spotlight on target element */}
      <motion.div
        className="absolute bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          width: '200px',
          height: '200px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Tooltip card */}
      <motion.div
        initial={{ y: position === 'bottom' ? -10 : 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute pointer-events-auto"
        style={{
          top: position === 'bottom' ? `calc(50% + ${offset}px)` : 'auto',
          bottom: position === 'top' ? `calc(50% + ${offset}px)` : 'auto',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '320px'
        }}
      >
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-indigo-500/50 shadow-2xl shadow-indigo-500/20 overflow-hidden">
          {/* Animated border glow */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            animate={{
              boxShadow: [
                '0 0 20px rgba(99, 102, 241, 0.3)',
                '0 0 40px rgba(99, 102, 241, 0.5)',
                '0 0 20px rgba(99, 102, 241, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Content */}
          <div className="relative z-10 p-4">
            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700/50"
              aria-label="Dismiss hotspot"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            {showPointer && (
              <motion.div
                animate={{
                  y: [0, -5, 0],
                  rotate: [-5, 5, -5]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex justify-center mb-3"
              >
                <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-indigo-400" />
                </div>
              </motion.div>
            )}

            {/* Message */}
            <p className="text-white text-sm leading-relaxed mb-4 pr-6">
              {message}
            </p>

            {/* Action button */}
            {onAction ? (
              <Button
                onClick={() => {
                  onAction();
                  onDismiss();
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2"
              >
                {actionLabel}
              </Button>
            ) : (
              <Button
                onClick={onDismiss}
                variant="outline"
                className="w-full border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 text-sm py-2"
              >
                {actionLabel}
              </Button>
            )}
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        </div>

        {/* Pointer arrow */}
        {position === 'bottom' && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <div className="w-4 h-4 bg-slate-900 border-t border-l border-indigo-500/50 rotate-45" />
          </div>
        )}
        
        {position === 'top' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <div className="w-4 h-4 bg-slate-900 border-b border-r border-indigo-500/50 rotate-45" />
          </div>
        )}
      </motion.div>

      {/* Animated "tap here" indicator */}
      {showPointer && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          animate={{
            y: [0, 10, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowDown className="w-8 h-8 text-indigo-400" />
        </motion.div>
      )}
    </div>
  );
}

/**
 * Pre-defined hotspot configurations for common onboarding steps
 */
export const ONBOARDING_HOTSPOTS = {
  ENERGY_METER: {
    targetId: 'energy-meter',
    message: '👆 Tap here to log your first energy level! Just pick a number from 1-10 based on how you feel right now.',
    position: 'bottom' as const,
    actionLabel: 'Got it!'
  },
  
  AI_SUGGESTIONS: {
    targetId: 'ai-suggestions',
    message: '🤖 The AI analyzes your energy patterns and suggests the best tasks for right now.',
    position: 'left' as const,
    actionLabel: 'Amazing!'
  },
  
  SCRIPTS_TAB: {
    targetId: 'scripts-tab',
    message: '⚡ Scripts automate your workflow based on energy levels. Create one when you\'re ready!',
    position: 'bottom' as const,
    actionLabel: 'Show me more'
  },
  
  ROYGBIV_RING: {
    targetId: 'roygbiv-ring',
    message: '🌈 Your ROYGBIV Loop tracks long-term progress. Complete all 7 colors for epic rewards!',
    position: 'left' as const,
    actionLabel: 'Cool!'
  },
  
  PROFILE_MENU: {
    targetId: 'profile-menu',
    message: '👤 Customize your profile, upload a photo, and adjust settings here.',
    position: 'bottom' as const,
    actionLabel: 'Got it!'
  }
};
