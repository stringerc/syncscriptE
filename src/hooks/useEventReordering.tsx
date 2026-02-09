/**
 * 🔄 USE EVENT REORDERING - Drag to Reorder Hook
 * 
 * PHASE 5D: Enables drag-to-reorder for milestones/steps within backlog and calendar.
 * 
 * RESEARCH BASIS:
 * - Todoist (2023) - Drag to reorder tasks with visual feedback
 * - Linear (2022) - Reorder issues within projects
 * - Notion (2021) - Drag blocks to reorder with smooth animations
 * - Asana (2020) - Reorder tasks within sections
 * - Trello (2019) - Card reordering with drop zones
 * 
 * FEATURES:
 * - Drag milestone/step to new position
 * - Auto-update schedulingOrder
 * - Visual drop zones
 * - Smooth animations
 * - Persist to backend
 * 
 * USAGE:
 * const reordering = useEventReordering(events, setEvents);
 * 
 * <div
 *   draggable
 *   onDragStart={(e) => reordering.handleDragStart(e, event)}
 *   onDragOver={(e) => reordering.handleDragOver(e, index)}
 *   onDrop={(e) => reordering.handleDrop(e, parentId)}
 * />
 */

import { useState, useCallback } from 'react';
import { Event } from '../utils/event-task-types';

export interface ReorderingState {
  draggedEvent: Event | null;
  draggedIndex: number | null;
  hoverIndex: number | null;
  parentId: string | null;
}

export interface UseEventReorderingReturn {
  // State
  reorderingState: ReorderingState;
  
  // Handlers
  handleDragStart: (e: React.DragEvent, event: Event, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  handleDrop: (e: React.DragEvent, parentId: string) => void;
  
  // Utilities
  isDropZoneActive: (index: number) => boolean;
  getDraggedEvent: () => Event | null;
}

export function useEventReordering(
  events: Event[],
  setEvents: (events: Event[] | ((prev: Event[]) => Event[])) => void
): UseEventReorderingReturn {
  const [reorderingState, setReorderingState] = useState<ReorderingState>({
    draggedEvent: null,
    draggedIndex: null,
    hoverIndex: null,
    parentId: null,
  });
  
  /**
   * Start dragging an event for reordering
   */
  const handleDragStart = useCallback((
    e: React.DragEvent,
    event: Event,
    index: number
  ) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(event));
    e.dataTransfer.setData('text/plain', event.title);
    
    setReorderingState({
      draggedEvent: event,
      draggedIndex: index,
      hoverIndex: null,
      parentId: event.parentEventId || null,
    });
    
    console.log('🔄 REORDER: Drag start:', {
      event: event.title,
      index,
      parentId: event.parentEventId,
    });
  }, []);
  
  /**
   * Hovering over a potential drop position
   */
  const handleDragOver = useCallback((
    e: React.DragEvent,
    hoverIndex: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    setReorderingState(prev => ({
      ...prev,
      hoverIndex,
    }));
  }, []);
  
  /**
   * End dragging (cleanup)
   */
  const handleDragEnd = useCallback(() => {
    setReorderingState({
      draggedEvent: null,
      draggedIndex: null,
      hoverIndex: null,
      parentId: null,
    });
  }, []);
  
  /**
   * Drop event at new position
   * 
   * ALGORITHM:
   * 1. Get all siblings (same parent)
   * 2. Remove dragged event from old position
   * 3. Insert at new position
   * 4. Update schedulingOrder for all siblings
   * 5. Update events state
   */
  const handleDrop = useCallback((
    e: React.DragEvent,
    parentId: string
  ) => {
    e.preventDefault();
    
    const { draggedEvent, draggedIndex, hoverIndex } = reorderingState;
    
    if (!draggedEvent || draggedIndex === null || hoverIndex === null) {
      console.warn('⚠️ REORDER: Missing drag data');
      return;
    }
    
    if (draggedIndex === hoverIndex) {
      console.log('🔄 REORDER: Same position, no change');
      handleDragEnd();
      return;
    }
    
    // Get all siblings (same parent)
    const siblings = events.filter(e => e.parentEventId === parentId);
    const siblingIds = new Set(siblings.map(s => s.id));
    
    // Create reordered array
    const reordered = [...siblings];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(hoverIndex, 0, removed);
    
    // Update schedulingOrder
    const updatedSiblings = reordered.map((event, index) => ({
      ...event,
      schedulingOrder: index,
    }));
    
    // Update events state
    setEvents(prev => {
      const others = prev.filter(e => !siblingIds.has(e.id));
      return [...others, ...updatedSiblings];
    });
    
    console.log('🔄 REORDER: Drop complete:', {
      event: draggedEvent.title,
      from: draggedIndex,
      to: hoverIndex,
      newOrder: updatedSiblings.map(s => s.title),
    });
    
    handleDragEnd();
  }, [reorderingState, events, setEvents, handleDragEnd]);
  
  /**
   * Check if drop zone should be active
   */
  const isDropZoneActive = useCallback((index: number) => {
    return reorderingState.hoverIndex === index && 
           reorderingState.draggedIndex !== index;
  }, [reorderingState]);
  
  /**
   * Get currently dragged event
   */
  const getDraggedEvent = useCallback(() => {
    return reorderingState.draggedEvent;
  }, [reorderingState]);
  
  return {
    reorderingState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    isDropZoneActive,
    getDraggedEvent,
  };
}
