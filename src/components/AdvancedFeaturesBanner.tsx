/**
 * Advanced Features Banner
 * 
 * Teaches users about the research-backed UX improvements
 * Can be dismissed and won't show again (localStorage)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, MousePointer2, Keyboard } from 'lucide-react';
import { Button } from './ui/button';

const STORAGE_KEY = 'syncscript_advanced_features_banner_dismissed';

export function AdvancedFeaturesBanner() {
  const [isDismissed, setIsDismissed] = useState(true);
  
  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);
  
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };
  
  if (isDismissed) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gradient-to-r from-teal-600/10 via-blue-600/10 to-purple-600/10 border border-teal-500/30 rounded-xl p-4 relative overflow-hidden"
      >
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-blue-500/5 to-purple-500/5 animate-pulse" />
        
        <div className="relative z-10">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1">
                ✨ New: Advanced Scheduling Features
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                We've added research-backed UX improvements to make scheduling faster and easier:
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {/* Feature 1 */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-teal-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <MousePointer2 className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-medium text-teal-300">Double-Click</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Double-click any task to open quick time picker
                  </p>
                </div>
                
                {/* Feature 2 */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <MousePointer2 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-blue-300">Auto-Scroll</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Drag tasks near screen edges to auto-scroll
                  </p>
                </div>
                
                {/* Feature 3 */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Keyboard className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-medium text-purple-300">Persisted</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    All changes now save automatically
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}