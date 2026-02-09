import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface DragScrollIndicatorsProps {
  activeZone: 'top' | 'bottom' | null;
  topZoneSize?: number;
  bottomZoneSize?: number;
}

/**
 * Visual feedback indicators for drag-scroll zones
 * 
 * RESEARCH-BACKED UX:
 * - Shows users where auto-scroll zones are active
 * - Reduces confusion and improves discoverability
 * - Animated gradient indicates scroll direction and speed
 */
export function DragScrollIndicators({ 
  activeZone, 
  topZoneSize = 50, 
  bottomZoneSize = 100 
}: DragScrollIndicatorsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {/* Top Scroll Zone Indicator */}
      <AnimatePresence>
        {activeZone === 'top' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 flex flex-col items-center justify-start"
            style={{ height: topZoneSize }}
          >
            {/* Gradient overlay */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-transparent"
              style={{
                animation: 'scroll-pulse-up 1.5s ease-in-out infinite'
              }}
            />
            
            {/* Icon indicator */}
            <div className="relative mt-4 flex items-center gap-2 px-4 py-2 bg-purple-500/90 backdrop-blur-sm rounded-full shadow-lg">
              <ChevronUp className="w-4 h-4 text-white animate-bounce" />
              <span className="text-xs font-medium text-white">Scrolling Up</span>
              <ChevronUp className="w-4 h-4 text-white animate-bounce" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Scroll Zone Indicator - LARGER for easier down-scrolling */}
      <AnimatePresence>
        {activeZone === 'bottom' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end"
            style={{ height: bottomZoneSize }}
          >
            {/* Gradient overlay - BRIGHTER for more visibility */}
            <div 
              className="absolute inset-0 bg-gradient-to-t from-purple-500/30 via-purple-500/15 to-transparent"
              style={{
                animation: 'scroll-pulse-down 1.5s ease-in-out infinite'
              }}
            />
            
            {/* Icon indicator - LARGER and more prominent */}
            <div className="relative mb-6 flex items-center gap-2 px-5 py-2.5 bg-purple-500/95 backdrop-blur-sm rounded-full shadow-xl border border-purple-400/30">
              <ChevronDown className="w-5 h-5 text-white animate-bounce" style={{ animationDuration: '0.8s' }} />
              <span className="text-sm font-semibold text-white">Scrolling Down (Enhanced)</span>
              <ChevronDown className="w-5 h-5 text-white animate-bounce" style={{ animationDuration: '0.8s' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add scroll pulse animations */}
      <style>{`
        @keyframes scroll-pulse-up {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes scroll-pulse-down {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
