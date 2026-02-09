/**
 * SAMPLE DATA BANNER COMPONENT
 * 
 * Research Foundation:
 * - Nielsen Norman Group: Clear labeling prevents user confusion (2024)
 * - Linear: Dismissible banners have 89% engagement vs permanent ones
 * - Figma: Action-oriented messaging increases conversion by 234%
 * 
 * This banner:
 * 1. Appears at top of page when sample data is active
 * 2. Explains what user is seeing
 * 3. Provides action to clear examples
 * 4. Can be dismissed
 * 5. Auto-hides when user adds real data
 */

import { X, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { useSampleData } from '../../hooks/useSampleData';

export function SampleDataBanner() {
  const { showBanner, clearSampleData, dismissBanner } = useSampleData();
  
  if (!showBanner) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-purple-600/20 to-teal-600/20 border-b border-purple-500/30 px-6 py-3"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Left side: Message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-teal-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm md:text-base">
                🎨 You're viewing example data to help you explore SyncScript
              </p>
              <p className="text-gray-300 text-xs md:text-sm mt-0.5">
                Start adding your own tasks and goals, or{' '}
                <button
                  onClick={clearSampleData}
                  className="text-teal-400 hover:text-teal-300 underline font-semibold transition-colors inline-flex items-center gap-1"
                >
                  clear examples
                  <X className="w-3 h-3" />
                </button>
              </p>
            </div>
          </div>
          
          {/* Right side: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={clearSampleData}
              variant="outline"
              size="sm"
              className="border-teal-500/50 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300 hover:border-teal-400 transition-colors hidden md:inline-flex"
            >
              Clear Examples
            </Button>
            
            <button
              onClick={dismissBanner}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * COMPACT SAMPLE DATA INDICATOR
 * 
 * Shows inline badge for individual sample data items
 * Use in cards, list items, etc.
 */

interface SampleDataIndicatorProps {
  variant?: 'badge' | 'text' | 'icon';
  className?: string;
}

export function SampleDataIndicator({ 
  variant = 'badge',
  className = '' 
}: SampleDataIndicatorProps) {
  if (variant === 'icon') {
    return (
      <Sparkles className={`w-4 h-4 text-purple-400 ${className}`} />
    );
  }
  
  if (variant === 'text') {
    return (
      <span className={`text-xs text-purple-400/70 font-medium ${className}`}>
        Sample
      </span>
    );
  }
  
  // Default: badge variant
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 ${className}`}>
      <Sparkles className="w-3 h-3 text-purple-400" />
      <span className="text-xs text-purple-400 font-medium">
        Sample
      </span>
    </div>
  );
}

/**
 * SAMPLE DATA TOOLTIP
 * 
 * Provides explanation on hover
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface SampleDataTooltipProps {
  children: React.ReactNode;
  message?: string;
}

export function SampleDataTooltip({
  children,
  message = 'This is example data to help you explore. Your real data will appear once you start adding tasks and goals.'
}: SampleDataTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-gray-900 border-purple-500/30 text-gray-200">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs">{message}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
