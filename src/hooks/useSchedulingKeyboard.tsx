/**
 * ⌨️ USE SCHEDULING KEYBOARD - Keyboard Shortcuts for Scheduling
 * 
 * PHASE 5D: Power-user keyboard shortcuts for scheduling operations.
 * 
 * RESEARCH BASIS:
 * - Linear (2022) - Command palette with "Cmd+K"
 * - Notion (2021) - Keyboard shortcuts for every action
 * - VSCode (2019) - Keybindings with conflict detection
 * - Slack (2020) - "/" commands and shortcuts
 * - Gmail (2018) - Single-key shortcuts
 * 
 * SHORTCUTS:
 * - S - Schedule selected events
 * - U - Unschedule selected events
 * - Cmd/Ctrl+Z - Undo
 * - Cmd/Ctrl+Shift+Z - Redo
 * - Cmd/Ctrl+A - Select all in backlog
 * - Escape - Clear selection
 * - Delete/Backspace - Unschedule selected
 * 
 * USAGE:
 * useSchedulingKeyboard({
 *   onSchedule: () => openSchedulingModal(),
 *   onUnschedule: () => unscheduleSelected(),
 *   onUndo: undoStack.undo,
 *   onRedo: undoStack.redo,
 *   selectedEvents,
 *   enabled: true,
 * });
 */

import { useEffect, useCallback } from 'react';
import { Event } from '../utils/event-task-types';

export interface UseSchedulingKeyboardProps {
  // Actions
  onSchedule?: () => void;
  onUnschedule?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onDelete?: () => void;
  
  // State
  selectedEvents?: Event[];
  canUndo?: boolean;
  canRedo?: boolean;
  
  // Configuration
  enabled?: boolean;
  disableInInputs?: boolean; // Disable when focused in input/textarea
}

export function useSchedulingKeyboard({
  onSchedule,
  onUnschedule,
  onUndo,
  onRedo,
  onSelectAll,
  onClearSelection,
  onDelete,
  selectedEvents = [],
  canUndo = false,
  canRedo = false,
  enabled = true,
  disableInInputs = true,
}: UseSchedulingKeyboardProps) {
  /**
   * Check if keyboard shortcuts should be disabled
   */
  const shouldDisableShortcuts = useCallback(() => {
    if (!enabled) return true;
    
    if (disableInInputs) {
      const activeElement = document.activeElement;
      const tagName = activeElement?.tagName.toLowerCase();
      
      // Disable in inputs, textareas, and contenteditable
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        activeElement?.hasAttribute('contenteditable')
      ) {
        return true;
      }
    }
    
    return false;
  }, [enabled, disableInInputs]);
  
  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (shouldDisableShortcuts()) return;
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;
    
    // Cmd/Ctrl+Z - Undo
    if (modKey && e.key === 'z' && !e.shiftKey) {
      if (canUndo && onUndo) {
        e.preventDefault();
        onUndo();
        console.log('⌨️ KEYBOARD: Undo triggered');
      }
      return;
    }
    
    // Cmd/Ctrl+Shift+Z - Redo
    if (modKey && e.key === 'z' && e.shiftKey) {
      if (canRedo && onRedo) {
        e.preventDefault();
        onRedo();
        console.log('⌨️ KEYBOARD: Redo triggered');
      }
      return;
    }
    
    // Cmd/Ctrl+A - Select all
    if (modKey && e.key === 'a') {
      if (onSelectAll) {
        e.preventDefault();
        onSelectAll();
        console.log('⌨️ KEYBOARD: Select all triggered');
      }
      return;
    }
    
    // S - Schedule (only if events selected)
    if (e.key === 's' && selectedEvents.length > 0) {
      if (onSchedule) {
        e.preventDefault();
        onSchedule();
        console.log('⌨️ KEYBOARD: Schedule triggered for', selectedEvents.length, 'events');
      }
      return;
    }
    
    // U - Unschedule (only if events selected)
    if (e.key === 'u' && selectedEvents.length > 0) {
      if (onUnschedule) {
        e.preventDefault();
        onUnschedule();
        console.log('⌨️ KEYBOARD: Unschedule triggered for', selectedEvents.length, 'events');
      }
      return;
    }
    
    // Escape - Clear selection
    if (e.key === 'Escape') {
      if (onClearSelection) {
        e.preventDefault();
        onClearSelection();
        console.log('⌨️ KEYBOARD: Clear selection triggered');
      }
      return;
    }
    
    // Delete/Backspace - Delete/Unschedule
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedEvents.length > 0 && onDelete) {
        e.preventDefault();
        onDelete();
        console.log('⌨️ KEYBOARD: Delete triggered for', selectedEvents.length, 'events');
      }
      return;
    }
  }, [
    shouldDisableShortcuts,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onSchedule,
    onUnschedule,
    onSelectAll,
    onClearSelection,
    onDelete,
    selectedEvents,
  ]);
  
  /**
   * Attach/detach keyboard listener
   */
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
  
  /**
   * Log available shortcuts (for debugging)
   */
  useEffect(() => {
    if (enabled) {
      console.log('⌨️ KEYBOARD: Shortcuts enabled:', {
        'Cmd/Ctrl+Z': 'Undo',
        'Cmd/Ctrl+Shift+Z': 'Redo',
        'Cmd/Ctrl+A': 'Select all',
        'S': 'Schedule selected',
        'U': 'Unschedule selected',
        'Escape': 'Clear selection',
        'Delete': 'Delete selected',
      });
    }
  }, [enabled]);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * KEYBOARD SHORTCUTS HELP COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

export interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';
  
  const shortcuts = [
    { key: `${modKey}+Z`, description: 'Undo last action' },
    { key: `${modKey}+Shift+Z`, description: 'Redo last action' },
    { key: `${modKey}+A`, description: 'Select all unscheduled events' },
    { key: 'S', description: 'Schedule selected events' },
    { key: 'U', description: 'Unschedule selected events' },
    { key: 'Escape', description: 'Clear selection' },
    { key: 'Delete', description: 'Delete/unschedule selected' },
  ];
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black backdrop-blur-sm z-[200] flex items-center justify-center" style={{ opacity: 0.6 }} onClick={onClose}>
      <div className="bg-[#1a1d24] border border-purple-500/30 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">⌨️ Keyboard Shortcuts</h2>
        
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
              <span className="text-sm text-gray-400">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-mono text-purple-400">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
