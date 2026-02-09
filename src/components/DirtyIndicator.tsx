/**
 * DIRTY STATE INDICATOR
 * 
 * Visual affordance for unsaved changes on calendar events.
 * Shows save/cancel buttons with keyboard shortcuts.
 * 
 * RESEARCH BASIS:
 * - Linear (2022): Floating save/cancel bar
 * - Notion (2020): Inline edit controls
 * - Superhuman (2022): CMD+Enter to save, ESC to cancel
 * - Google Docs (2010): Auto-save with manual trigger option
 * - Figma (2019): Undo/Redo with visual feedback
 * - Photoshop (1990): Iconic undo/redo buttons
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, AlertCircle, Undo2, Redo2 } from 'lucide-react';
import { Button } from './ui/button';

interface DirtyIndicatorProps {
  onSave: () => void;
  onCancel: () => void;
  className?: string;
}

export function DirtyIndicator({
  onSave,
  onCancel,
  className = '',
}: DirtyIndicatorProps) {
  return (
    <div
      className={`
        ${className}
        absolute left-0 right-0 bottom-0 border-t
        bg-yellow-600/20 backdrop-blur-md border-yellow-600/40
        px-4 py-3 z-40
        flex items-center justify-between gap-4
      `}
    >
      {/* Left side - info */}
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-400" />
        <div>
          <div className="text-sm font-semibold text-yellow-200">
            Unsaved changes
          </div>
          <div className="text-xs text-yellow-300/70">
            Save or cancel changes before navigating away
          </div>
        </div>
      </div>
      
      {/* Right side - actions */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo buttons - Research-based placement */}
        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-yellow-600/40">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="hover:bg-red-600/20 hover:text-red-300"
          >
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            className="bg-teal-600 hover:bg-teal-500 text-white"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * FLOATING DIRTY STATE BAR
 * 
 * Sticky bar at top/bottom of calendar when there are unsaved changes.
 * Shows count and provides bulk save/cancel actions + undo/redo.
 * 
 * RESEARCH BASIS:
 * - Google Docs (2010): Undo/Redo always visible when editing
 * - Figma (2019): Prominent undo/redo in toolbar
 * - Linear (2022): Floating action bar with undo
 * - Photoshop (1990+): Industry standard undo/redo placement
 */

interface FloatingDirtyBarProps {
  dirtyCount: number;
  onSaveAll: () => void;
  onCancelAll: () => void;
  position?: 'top' | 'bottom';
  // Undo/Redo support
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  undoDescription?: string | null;
  redoDescription?: string | null;
}

export function FloatingDirtyBar({
  dirtyCount,
  onSaveAll,
  onCancelAll,
  position = 'bottom',
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  undoDescription,
  redoDescription,
}: FloatingDirtyBarProps) {
  // RESEARCH-BASED VISIBILITY LOGIC:
  // Show banner when:
  // 1. There are unsaved (dirty) changes, OR
  // 2. There are operations that can be undone
  // This ensures users can always undo recent actions even if they've been saved
  const shouldShow = dirtyCount > 0 || canUndo;
  
  // Debug logging for banner visibility
  React.useEffect(() => {
    console.log('📊 FloatingDirtyBar visibility:', {
      shouldShow,
      dirtyCount,
      canUndo,
      canRedo,
    });
  }, [shouldShow, dirtyCount, canUndo, canRedo]);
  
  if (!shouldShow) return null;
  
  const positionClasses = position === 'top' 
    ? 'top-0 border-b' 
    : 'bottom-0 border-t';
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
        className={`
          absolute left-0 right-0 ${positionClasses}
          bg-yellow-600/20 backdrop-blur-md border-yellow-600/40
          px-4 py-3 z-40
          flex items-center justify-between gap-4
        `}
      >
        {/* Left side - info */}
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <div>
            <div className="text-sm font-semibold text-yellow-200">
              {dirtyCount > 0 
                ? `${dirtyCount} ${dirtyCount === 1 ? 'event' : 'events'} with unsaved changes`
                : 'Recent changes available to undo'
              }
            </div>
            <div className="text-xs text-yellow-300/70">
              {dirtyCount > 0 
                ? 'Save or cancel changes before navigating away'
                : 'Use ⌘Z to undo or ⌘⇧Z to redo'
              }
            </div>
          </div>
        </div>
        
        {/* Right side - actions */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo buttons - Research-based placement */}
          {(onUndo || onRedo) && (
            <>
              <div className="flex items-center gap-1 mr-2 pr-2 border-r border-yellow-600/40">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    console.log('🔘🔘🔘 UNDO BUTTON CLICKED! 🔘🔘🔘');
                    console.log('  - canUndo prop:', canUndo);
                    console.log('  - onUndo exists:', !!onUndo);
                    console.log('  - Button disabled:', !canUndo);
                    if (onUndo) {
                      console.log('  ✅ Calling onUndo handler...');
                      onUndo();
                      console.log('  ✅ onUndo handler called successfully');
                    } else {
                      console.log('  ❌ onUndo handler is undefined!');
                    }
                  }}
                  onMouseDown={() => console.log('👆 Undo button mouse down - disabled:', !canUndo)}
                  disabled={!canUndo}
                  className="hover:bg-yellow-600/20 hover:text-yellow-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={canUndo ? `Undo: ${undoDescription || 'Last action'} (⌘Z)` : 'Nothing to undo'}
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="hover:bg-yellow-600/20 hover:text-yellow-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={canRedo ? `Redo: ${redoDescription || 'Last undone action'} (⌘⇧Z)` : 'Nothing to redo'}
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
          
          {/* Save/Cancel buttons - Only show when there are dirty changes */}
          {dirtyCount > 0 && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancelAll}
                className="hover:bg-red-600/20 hover:text-red-300"
              >
                <X className="w-4 h-4 mr-1.5" />
                Cancel All
              </Button>
              <Button
                size="sm"
                onClick={onSaveAll}
                className="bg-teal-600 hover:bg-teal-500 text-white"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Save All
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}