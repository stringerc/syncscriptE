/**
 * DIRTY STATE MANAGEMENT HOOK
 * 
 * Tracks unsaved changes to calendar events with per-item state management.
 * Prevents accidental data loss and provides clear save/cancel affordances.
 * 
 * RESEARCH BASIS:
 * - Google Docs (2010): Auto-save with dirty state tracking
 * - Notion (2020): Per-block dirty state indicators
 * - Linear (2022): Issue edit state with explicit save/cancel
 * - Superhuman (2022): Dirty state with CMD+Enter to save
 * - Figma (2019): Real-time sync with conflict detection
 * 
 * DESIGN DECISIONS:
 * - Per-event dirty tracking (not global)
 * - Visual indicators on dirty items
 * - Explicit save/cancel actions
 * - Prevent navigation with unsaved changes
 * - Undo integration (save before undo)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Event } from '../utils/event-task-types';

export interface DirtyState {
  eventId: string;
  originalData: Event;
  modifiedData: Event;
  timestamp: number;
}

export interface DirtyStateManager {
  // State queries
  isDirty: (eventId: string) => boolean;
  getDirtyEvents: () => DirtyState[];
  hasDirtyEvents: boolean;
  
  // State mutations
  markDirty: (eventId: string, original: Event, modified: Event) => void;
  markClean: (eventId: string) => void;
  clearAll: () => void;
  
  // Actions
  saveEvent: (eventId: string, onSave: (event: Event) => void) => void;
  cancelEvent: (eventId: string, onCancel: (event: Event) => void) => void;
  saveAll: (onSave: (events: Event[]) => void) => void;
  cancelAll: (onCancel: (events: Event[]) => void) => void;
  
  // Utilities
  getOriginalData: (eventId: string) => Event | null;
  getModifiedData: (eventId: string) => Event | null;
}

export function useDirtyState(): DirtyStateManager {
  const [dirtyStates, setDirtyStates] = useState<Map<string, DirtyState>>(new Map());
  
  // Track if user has unsaved changes (for navigation guard)
  const hasDirtyEvents = dirtyStates.size > 0;
  
  // Check if specific event is dirty
  const isDirty = useCallback((eventId: string): boolean => {
    return dirtyStates.has(eventId);
  }, [dirtyStates]);
  
  // Get all dirty events
  const getDirtyEvents = useCallback((): DirtyState[] => {
    return Array.from(dirtyStates.values());
  }, [dirtyStates]);
  
  // Mark event as dirty (has unsaved changes)
  const markDirty = useCallback((eventId: string, original: Event, modified: Event) => {
    setDirtyStates(prev => {
      const next = new Map(prev);
      next.set(eventId, {
        eventId,
        originalData: original,
        modifiedData: modified,
        timestamp: Date.now(),
      });
      return next;
    });
  }, []);
  
  // Mark event as clean (saved)
  const markClean = useCallback((eventId: string) => {
    setDirtyStates(prev => {
      const next = new Map(prev);
      next.delete(eventId);
      return next;
    });
  }, []);
  
  // Clear all dirty states
  const clearAll = useCallback(() => {
    setDirtyStates(new Map());
  }, []);
  
  // Save single event
  const saveEvent = useCallback((eventId: string, onSave: (event: Event) => void) => {
    const dirtyState = dirtyStates.get(eventId);
    if (dirtyState) {
      onSave(dirtyState.modifiedData);
      markClean(eventId);
    }
  }, [dirtyStates, markClean]);
  
  // Cancel single event (revert to original)
  const cancelEvent = useCallback((eventId: string, onCancel: (event: Event) => void) => {
    const dirtyState = dirtyStates.get(eventId);
    if (dirtyState) {
      onCancel(dirtyState.originalData);
      markClean(eventId);
    }
  }, [dirtyStates, markClean]);
  
  // Save all dirty events
  const saveAll = useCallback((onSave: (events: Event[]) => void) => {
    const events = Array.from(dirtyStates.values()).map(s => s.modifiedData);
    onSave(events);
    clearAll();
  }, [dirtyStates, clearAll]);
  
  // Cancel all dirty events (revert all)
  const cancelAll = useCallback((onCancel: (events: Event[]) => void) => {
    const events = Array.from(dirtyStates.values()).map(s => s.originalData);
    onCancel(events);
    clearAll();
  }, [dirtyStates, clearAll]);
  
  // Get original data for event
  const getOriginalData = useCallback((eventId: string): Event | null => {
    return dirtyStates.get(eventId)?.originalData ?? null;
  }, [dirtyStates]);
  
  // Get modified data for event
  const getModifiedData = useCallback((eventId: string): Event | null => {
    return dirtyStates.get(eventId)?.modifiedData ?? null;
  }, [dirtyStates]);
  
  // RESEARCH: Warn user before leaving page with unsaved changes (Gmail pattern)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasDirtyEvents) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasDirtyEvents]);
  
  return {
    isDirty,
    getDirtyEvents,
    hasDirtyEvents,
    markDirty,
    markClean,
    clearAll,
    saveEvent,
    cancelEvent,
    saveAll,
    cancelAll,
    getOriginalData,
    getModifiedData,
  };
}
