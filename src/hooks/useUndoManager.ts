/**
 * UNDO/REDO SYSTEM
 * 
 * Per-item undo stack for calendar events with CMD+Z/CMD+Shift+Z support.
 * Tracks operations at the individual event level for precise control.
 * 
 * RESEARCH BASIS:
 * - Figma (2019): Per-object undo history
 * - Linear (2022): Issue-level undo/redo
 * - Notion (2020): Block-level history
 * - Google Docs (2010): Real-time collaborative undo
 * - Superhuman (2022): Action-specific undo with visual confirmation
 * 
 * DESIGN DECISIONS:
 * - Per-event undo stacks (not global timeline)
 * - Maximum 50 operations per event (memory management)
 * - Operation types: move, resize, edit, create, delete, scheduleTask
 * - Visual toast confirmation on undo/redo
 * - Integration with dirty state (undo marks clean)
 * - CRITICAL FIX: Timestamps on all operations for true chronological ordering
 */

import { useState, useCallback, useEffect } from 'react';
import { Event } from '../utils/event-task-types';

// ✅ CRITICAL FIX: All operations now have timestamps for proper chronological sorting
export type UndoOperation = 
  | { type: 'move'; eventId: string; timestamp: number; before: { startTime: Date; endTime: Date; xPosition?: number; width?: number }; after: { startTime: Date; endTime: Date; xPosition?: number; width?: number } }
  | { type: 'resizeEnd'; eventId: string; timestamp: number; before: { endTime: Date }; after: { endTime: Date } }
  | { type: 'resizeStart'; eventId: string; timestamp: number; before: { startTime: Date }; after: { startTime: Date } }
  | { type: 'resizeHorizontal'; eventId: string; timestamp: number; before: { xPosition: number; width: number }; after: { xPosition: number; width: number } }
  | { type: 'resizeCorner'; eventId: string; timestamp: number; before: { startTime?: Date; endTime?: Date; xPosition: number; width: number }; after: { startTime?: Date; endTime?: Date; xPosition: number; width: number } }
  | { type: 'edit'; eventId: string; timestamp: number; before: Event; after: Event }
  | { type: 'create'; eventId: string; timestamp: number; event: Event }
  | { type: 'delete'; eventId: string; timestamp: number; event: Event }
  | { type: 'scheduleTask'; eventId: string; timestamp: number; taskId: string; before: { scheduledTime: string | null }; after: { scheduledTime: string } }; // ✅ ADDED: Missing scheduleTask type

export interface UndoState {
  eventId: string;
  operations: UndoOperation[];
  currentIndex: number; // -1 = no undo available
}

export interface UndoManager {
  // State queries
  canUndo: (eventId?: string) => boolean;
  canRedo: (eventId?: string) => boolean;
  getUndoCount: (eventId: string) => number;
  getRedoCount: (eventId: string) => number;
  
  // History management
  pushOperation: (operation: UndoOperation) => void;
  clearHistory: (eventId: string) => void;
  clearAllHistory: () => void;
  
  // Undo/Redo actions
  undo: (eventId?: string) => UndoOperation | null;
  redo: (eventId?: string) => UndoOperation | null;
  
  // Utilities
  getLastOperation: (eventId: string) => UndoOperation | null;
  getAllOperations: (eventId: string) => UndoOperation[];
  
  // Reactivity - revision counter increments on every state change
  revision: number;
}

const MAX_UNDO_STACK = 50; // Maximum operations per event

export function useUndoManager(): UndoManager {
  // Map of eventId -> undo state
  const [undoStates, setUndoStates] = useState<Map<string, UndoState>>(new Map());
  
  // Revision counter for reactivity
  const [revision, setRevision] = useState(0);
  
  // Get or create undo state for an event
  const getUndoState = useCallback((eventId: string): UndoState => {
    const existing = undoStates.get(eventId);
    if (existing) return existing;
    
    return {
      eventId,
      operations: [],
      currentIndex: -1,
    };
  }, [undoStates]);
  
  // Check if undo is available
  const canUndo = useCallback((eventId?: string): boolean => {
    if (!eventId) {
      // Check if ANY event can undo
      const result = Array.from(undoStates.values()).some(state => state.currentIndex >= 0);
      return result;
    }
    const state = undoStates.get(eventId);
    const result = state ? state.currentIndex >= 0 : false;
    return result;
  }, [undoStates]);
  
  // Check if redo is available
  const canRedo = useCallback((eventId?: string): boolean => {
    if (!eventId) {
      // Check if ANY event can redo
      return Array.from(undoStates.values()).some(
        state => state.currentIndex < state.operations.length - 1
      );
    }
    const state = undoStates.get(eventId);
    return state ? state.currentIndex < state.operations.length - 1 : false;
  }, [undoStates]);
  
  // Get undo count
  const getUndoCount = useCallback((eventId: string): number => {
    const state = undoStates.get(eventId);
    return state ? state.currentIndex + 1 : 0;
  }, [undoStates]);
  
  // Get redo count
  const getRedoCount = useCallback((eventId: string): number => {
    const state = undoStates.get(eventId);
    return state ? state.operations.length - state.currentIndex - 1 : 0;
  }, [undoStates]);
  
  // Push new operation onto stack
  const pushOperation = useCallback((operation: UndoOperation) => {
    setUndoStates(prev => {
      const next = new Map(prev);
      const state = getUndoState(operation.eventId);
      
      // If we're in the middle of history, discard future operations
      const operations = state.operations.slice(0, state.currentIndex + 1);
      
      // Add new operation
      operations.push(operation);
      
      // Limit stack size
      const trimmedOperations = operations.slice(-MAX_UNDO_STACK);
      
      const newState = {
        eventId: operation.eventId,
        operations: trimmedOperations,
        currentIndex: trimmedOperations.length - 1,
      };
      
      next.set(operation.eventId, newState);
      
      console.log('📝 pushOperation:', {
        type: operation.type,
        eventId: operation.eventId,
        stackSize: newState.operations.length,
        currentIndex: newState.currentIndex,
      });
      
      return next;
    });
    setRevision(prev => prev + 1); // Increment revision counter
  }, [getUndoState]);
  
  // Clear history for specific event
  const clearHistory = useCallback((eventId: string) => {
    setUndoStates(prev => {
      const next = new Map(prev);
      next.delete(eventId);
      return next;
    });
    setRevision(prev => prev + 1); // Increment revision counter
  }, []);
  
  // Clear all history
  const clearAllHistory = useCallback(() => {
    setUndoStates(new Map());
    setRevision(prev => prev + 1); // Increment revision counter
  }, []);
  
  // Undo operation
  const undo = useCallback((eventId?: string): UndoOperation | null => {
    let targetEventId = eventId;
    
    // ✅ CRITICAL FIX: If no event specified, find the TRULY most recent operation using timestamps
    if (!targetEventId) {
      let mostRecentTimestamp = 0;
      let mostRecentEventId: string | null = null;
      
      undoStates.forEach((state, id) => {
        if (state.currentIndex >= 0) {
          const op = state.operations[state.currentIndex];
          // ✅ Use actual timestamp instead of index for true chronological ordering
          if (op.timestamp > mostRecentTimestamp) {
            mostRecentTimestamp = op.timestamp;
            mostRecentEventId = id;
          }
        }
      });
      
      if (!mostRecentEventId) {
        console.log('⏪ undo: No operations to undo');
        return null;
      }
      targetEventId = mostRecentEventId;
      console.log(`⏪ undo: Found most recent operation in event "${targetEventId}" at timestamp ${mostRecentTimestamp}`);
    }
    
    const state = undoStates.get(targetEventId);
    if (!state || state.currentIndex < 0) {
      console.log('⏪ undo: No operations for event', targetEventId);
      return null;
    }
    
    const operation = state.operations[state.currentIndex];
    const newIndex = state.currentIndex - 1;
    
    console.log('⏪ undo:', {
      type: operation.type,
      eventId: targetEventId,
      timestamp: operation.timestamp,
      oldIndex: state.currentIndex,
      newIndex: newIndex,
      remainingOps: newIndex + 1,
    });
    
    // Move index back
    setUndoStates(prev => {
      const next = new Map(prev);
      next.set(targetEventId!, {
        ...state,
        currentIndex: newIndex,
      });
      return next;
    });
    setRevision(prev => prev + 1); // Increment revision counter
    
    return operation;
  }, [undoStates]);
  
  // Redo operation
  const redo = useCallback((eventId?: string): UndoOperation | null => {
    let targetEventId = eventId;
    
    // If no event specified, find the most recent redo-able operation
    if (!targetEventId) {
      let mostRecentIndex = -1;
      let mostRecentEventId: string | null = null;
      
      undoStates.forEach((state, id) => {
        if (state.currentIndex < state.operations.length - 1) {
          if (state.currentIndex > mostRecentIndex) {
            mostRecentIndex = state.currentIndex;
            mostRecentEventId = id;
          }
        }
      });
      
      if (!mostRecentEventId) return null;
      targetEventId = mostRecentEventId;
    }
    
    const state = undoStates.get(targetEventId);
    if (!state || state.currentIndex >= state.operations.length - 1) return null;
    
    const operation = state.operations[state.currentIndex + 1];
    
    // Move index forward
    setUndoStates(prev => {
      const next = new Map(prev);
      next.set(targetEventId!, {
        ...state,
        currentIndex: state.currentIndex + 1,
      });
      return next;
    });
    setRevision(prev => prev + 1); // Increment revision counter
    
    return operation;
  }, [undoStates]);
  
  // Get last operation
  const getLastOperation = useCallback((eventId: string): UndoOperation | null => {
    const state = undoStates.get(eventId);
    if (!state || state.currentIndex < 0) return null;
    return state.operations[state.currentIndex];
  }, [undoStates]);
  
  // Get all operations for event
  const getAllOperations = useCallback((eventId: string): UndoOperation[] => {
    const state = undoStates.get(eventId);
    return state ? state.operations : [];
  }, [undoStates]);
  
  // RESEARCH: Global keyboard shortcuts (CMD+Z, CMD+Shift+Z)
  // ❌ REMOVED: Keyboard handling should be at the UI layer, not in the data structure
  // The undo manager is a pure data structure - execution belongs in CalendarEventsPage
  // Research basis: VSCode (2016), Figma (2019) - separation of storage from execution
  
  return {
    canUndo,
    canRedo,
    getUndoCount,
    getRedoCount,
    pushOperation,
    clearHistory,
    clearAllHistory,
    undo,
    redo,
    getLastOperation,
    getAllOperations,
    revision,
  };
}