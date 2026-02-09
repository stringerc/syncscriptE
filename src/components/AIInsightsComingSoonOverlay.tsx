/**
 * AIInsightsComingSoonOverlay Component
 * 
 * Overlay for AI Insights panel showing "Coming Soon" message.
 * The underlying panel content is rendered at reduced opacity.
 * 
 * Key behaviors:
 * - Panel toggle still works (open/close)
 * - Content shows at 30% opacity
 * - Overlay explains feature is coming soon
 * - No interactive controls inside panel while showing
 */

import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Z_INDEX } from '../utils/global-rules';

export function AIInsightsComingSoonOverlay() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: Z_INDEX.comingSoonOverlay }}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-[#1a1c20]/70 backdrop-blur-sm" />
      
      {/* Content Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-6 shadow-2xl shadow-purple-500/10 mx-4 max-w-sm"
      >
        {/* Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-center mb-2 text-white">
          Coming Soon
        </h3>
        
        {/* Feature Name */}
        <h4 className="text-base text-center text-purple-400 mb-3">
          AI Insights Panel
        </h4>
        
        {/* Description */}
        <p className="text-sm text-gray-300 text-center leading-relaxed">
          Get real-time AI-powered insights and recommendations as you work. 
          Per-tab contextual insights launching soon.
        </p>
        
        {/* Expected Date */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Expected: Q1 2025
        </p>
      </motion.div>
    </div>
  );
}
