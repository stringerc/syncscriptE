/**
 * ↩️ USE SCHEDULING UNDO - Undo/Redo for Scheduling Actions
 * 
 * PHASE 5D: Command pattern for undo/redo scheduling operations.
 * 
 * RESEARCH BASIS:
 * - Figma (2023) - Ctrl+Z undo with command history
 * - Notion (2021) - Undo/redo for all actions
 * - Google Docs (2020) - Command pattern with history
 * - VSCode (2019) - Undo stack with 50 action limit
 * - Photoshop (2018) - History panel
 * 
 * SUPPORTED ACTIONS:
 * - Schedule milestone/step
 * - Unschedule milestone/step
 * - Reorder events
 * - Batch schedule
 * - Custom time changes
 * 
 * USAGE:
 * const { execute, undo, redo, canUndo, canRedo } = useSchedulingUndo();
 * 
 * execute({
 *   type: 'schedule',
 *   execute: () => scheduleEvents(events),
 *   undo: () => unscheduleEvents(events),
 * });
 */

import { useState, useCallback } from 'react';
import { Event } from '../utils/event-task-types';

export type CommandType = 
  | 'schedule'
  | 'unschedule'
  | 'reorder'
  | 'batch_schedule'
  | 'custom_time';

export interface Command {
  type: CommandType;
  description: string;
  execute: () => void;
  undo: () => void;
  timestamp: Date;
}

export interface UseSchedulingUndoReturn {
  // State
  canUndo: boolean;
  canRedo: boolean;
  historyCount: number;
  currentIndex: number;
  
  // Actions
  execute: (command: Omit<Command, 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  
  // Utilities
  getHistory: () => Command[];
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
}

const MAX_HISTORY = 50; // Keep last 50 actions

export function useSchedulingUndo(): UseSchedulingUndoReturn {
  const [history, setHistory] = useState<Command[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  /**
   * Execute a new command and add to history
   */
  const execute = useCallback((command: Omit<Command, 'timestamp'>) => {
    // Execute the command
    command.execute();
    
    // Create timestamped command
    const timestampedCommand: Command = {
      ...command,
      timestamp: new Date(),
    };
    
    // Add to history (remove any forward history)
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(timestampedCommand);
      
      // Keep only last MAX_HISTORY commands
      if (newHistory.length > MAX_HISTORY) {
        return newHistory.slice(-MAX_HISTORY);
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => {
      const newIndex = prev + 1;
      return newIndex >= MAX_HISTORY ? MAX_HISTORY - 1 : newIndex;
    });
    
    console.log('↩️ UNDO: Command executed:', {
      type: command.type,
      description: command.description,
      historyLength: currentIndex + 2,
    });
  }, [currentIndex]);
  
  /**
   * Undo last command
   */
  const undo = useCallback(() => {
    if (currentIndex < 0) {
      console.warn('⚠️ UNDO: Nothing to undo');
      return;
    }
    
    const command = history[currentIndex];
    command.undo();
    
    setCurrentIndex(prev => prev - 1);
    
    console.log('↩️ UNDO: Undid command:', {
      type: command.type,
      description: command.description,
      newIndex: currentIndex - 1,
    });
  }, [history, currentIndex]);
  
  /**
   * Redo next command
   */
  const redo = useCallback(() => {
    if (currentIndex >= history.length - 1) {
      console.warn('⚠️ UNDO: Nothing to redo');
      return;
    }
    
    const command = history[currentIndex + 1];
    command.execute();
    
    setCurrentIndex(prev => prev + 1);
    
    console.log('↩️ REDO: Redid command:', {
      type: command.type,
      description: command.description,
      newIndex: currentIndex + 1,
    });
  }, [history, currentIndex]);
  
  /**
   * Clear history
   */
  const clear = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    
    console.log('↩️ UNDO: History cleared');
  }, []);
  
  /**
   * Get full history
   */
  const getHistory = useCallback(() => {
    return history;
  }, [history]);
  
  /**
   * Get description of action that would be undone
   */
  const getUndoDescription = useCallback(() => {
    if (currentIndex < 0) return null;
    return history[currentIndex]?.description || null;
  }, [history, currentIndex]);
  
  /**
   * Get description of action that would be redone
   */
  const getRedoDescription = useCallback(() => {
    if (currentIndex >= history.length - 1) return null;
    return history[currentIndex + 1]?.description || null;
  }, [history, currentIndex]);
  
  return {
    canUndo: currentIndex >= 0,
    canRedo: currentIndex < history.length - 1,
    historyCount: history.length,
    currentIndex,
    execute,
    undo,
    redo,
    clear,
    getHistory,
    getUndoDescription,
    getRedoDescription,
  };
}

/**
 * ═══════════════════════════════════════════════════════════════
 * COMMAND FACTORIES - Helper functions to create common commands
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Create schedule command
 */
export function createScheduleCommand(
  events: Event[],
  scheduledEvents: Event[],
  onSchedule: (events: Event[]) => void,
  onUnschedule: (events: Event[]) => void
): Omit<Command, 'timestamp'> {
  return {
    type: 'schedule',
    description: `Schedule ${events.length} ${events.length === 1 ? 'event' : 'events'}`,
    execute: () => onSchedule(scheduledEvents),
    undo: () => onUnschedule(events),
  };
}

/**
 * Create unschedule command
 */
export function createUnscheduleCommand(
  events: Event[],
  onUnschedule: (events: Event[]) => void,
  onSchedule: (events: Event[]) => void
): Omit<Command, 'timestamp'> {
  return {
    type: 'unschedule',
    description: `Unschedule ${events.length} ${events.length === 1 ? 'event' : 'events'}`,
    execute: () => onUnschedule(events),
    undo: () => onSchedule(events),
  };
}

/**
 * Create reorder command
 */
export function createReorderCommand(
  eventId: string,
  fromIndex: number,
  toIndex: number,
  onReorder: (eventId: string, fromIndex: number, toIndex: number) => void
): Omit<Command, 'timestamp'> {
  return {
    type: 'reorder',
    description: `Reorder event from position ${fromIndex + 1} to ${toIndex + 1}`,
    execute: () => onReorder(eventId, fromIndex, toIndex),
    undo: () => onReorder(eventId, toIndex, fromIndex),
  };
}

/**
 * Create batch schedule command
 */
export function createBatchScheduleCommand(
  parentEvents: Event[],
  allScheduledEvents: Event[],
  onSchedule: (events: Event[]) => void,
  onUnschedule: (events: Event[]) => void
): Omit<Command, 'timestamp'> {
  return {
    type: 'batch_schedule',
    description: `Batch schedule ${parentEvents.length} parent events`,
    execute: () => onSchedule(allScheduledEvents),
    undo: () => onUnschedule(allScheduledEvents),
  };
}
