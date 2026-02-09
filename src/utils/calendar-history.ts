/**
 * Calendar History Manager - Production Undo/Redo System
 * 
 * Research-based on:
 * - Command Pattern (Gang of Four Design Patterns)
 * - Google Docs undo/redo implementation
 * - Figma's history management
 * - Adobe Photoshop's action stack
 * - Apple HIG keyboard shortcuts
 * 
 * Features:
 * ✅ Command pattern for each action type
 * ✅ Dual stack architecture (undo/redo)
 * ✅ Type-safe command definitions
 * ✅ Memory-efficient (max 50 actions)
 * ✅ Human-readable descriptions
 * ✅ Granular action tracking
 */

import { CalendarEvent } from '../types/calendar';

// Command Types
export type CommandType = 'create' | 'update' | 'delete' | 'move' | 'resize' | 'batch';

// Base Command Interface
export interface Command {
  id: string;
  type: CommandType;
  timestamp: number;
  description: string;
  execute: (events: CalendarEvent[]) => CalendarEvent[];
  undo: (events: CalendarEvent[]) => CalendarEvent[];
}

// Create Event Command
export interface CreateEventCommand extends Command {
  type: 'create';
  event: CalendarEvent;
}

// Update Event Command
export interface UpdateEventCommand extends Command {
  type: 'update';
  eventId: string;
  previousState: CalendarEvent;
  newState: CalendarEvent;
}

// Delete Event Command
export interface DeleteEventCommand extends Command {
  type: 'delete';
  event: CalendarEvent;
}

// Move Event Command
export interface MoveEventCommand extends Command {
  type: 'move';
  eventId: string;
  previousStart: Date;
  previousEnd: Date;
  newStart: Date;
  newEnd: Date;
}

// Resize Event Command
export interface ResizeEventCommand extends Command {
  type: 'resize';
  eventId: string;
  previousEnd: Date;
  newEnd: Date;
}

// Batch Command (for multiple operations)
export interface BatchCommand extends Command {
  type: 'batch';
  commands: Command[];
}

// Command Factory Functions
export function createCreateCommand(event: CalendarEvent): CreateEventCommand {
  return {
    id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'create',
    timestamp: Date.now(),
    description: `Create "${event.title}"`,
    event,
    execute: (events) => [...events, event],
    undo: (events) => events.filter(e => e.id !== event.id),
  };
}

export function createUpdateCommand(
  eventId: string,
  previousState: CalendarEvent,
  newState: CalendarEvent
): UpdateEventCommand {
  return {
    id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'update',
    timestamp: Date.now(),
    description: `Edit "${newState.title}"`,
    eventId,
    previousState,
    newState,
    execute: (events) => events.map(e => e.id === eventId ? newState : e),
    undo: (events) => events.map(e => e.id === eventId ? previousState : e),
  };
}

export function createDeleteCommand(event: CalendarEvent): DeleteEventCommand {
  return {
    id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'delete',
    timestamp: Date.now(),
    description: `Delete "${event.title}"`,
    event,
    execute: (events) => events.filter(e => e.id !== event.id),
    undo: (events) => [...events, event],
  };
}

export function createMoveCommand(
  eventId: string,
  eventTitle: string,
  previousStart: Date,
  previousEnd: Date,
  newStart: Date,
  newEnd: Date
): MoveEventCommand {
  return {
    id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'move',
    timestamp: Date.now(),
    description: `Move "${eventTitle}"`,
    eventId,
    previousStart,
    previousEnd,
    newStart,
    newEnd,
    execute: (events) => events.map(e => 
      e.id === eventId 
        ? { ...e, start: newStart, end: newEnd }
        : e
    ),
    undo: (events) => events.map(e => 
      e.id === eventId 
        ? { ...e, start: previousStart, end: previousEnd }
        : e
    ),
  };
}

export function createResizeCommand(
  eventId: string,
  eventTitle: string,
  previousEnd: Date,
  newEnd: Date
): ResizeEventCommand {
  return {
    id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'resize',
    timestamp: Date.now(),
    description: `Resize "${eventTitle}"`,
    eventId,
    previousEnd,
    newEnd,
    execute: (events) => events.map(e => 
      e.id === eventId 
        ? { ...e, end: newEnd }
        : e
    ),
    undo: (events) => events.map(e => 
      e.id === eventId 
        ? { ...e, end: previousEnd }
        : e
    ),
  };
}

export function createBatchCommand(commands: Command[], description: string): BatchCommand {
  return {
    id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'batch',
    timestamp: Date.now(),
    description,
    commands,
    execute: (events) => {
      let result = events;
      for (const cmd of commands) {
        result = cmd.execute(result);
      }
      return result;
    },
    undo: (events) => {
      let result = events;
      // Undo in reverse order
      for (let i = commands.length - 1; i >= 0; i--) {
        result = commands[i].undo(result);
      }
      return result;
    },
  };
}

// History Manager Class
export class CalendarHistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxStackSize = 50; // Memory management

  // Execute a new command
  executeCommand(command: Command, currentEvents: CalendarEvent[]): CalendarEvent[] {
    // Add to undo stack
    this.undoStack.push(command);
    
    // Clear redo stack (new action invalidates redo history)
    this.redoStack = [];
    
    // Maintain max stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift(); // Remove oldest
    }
    
    // Execute the command
    return command.execute(currentEvents);
  }

  // Undo last action
  undo(currentEvents: CalendarEvent[]): { events: CalendarEvent[]; command: Command } | null {
    const command = this.undoStack.pop();
    if (!command) return null;
    
    // Add to redo stack
    this.redoStack.push(command);
    
    // Undo the command
    const events = command.undo(currentEvents);
    
    return { events, command };
  }

  // Redo last undone action
  redo(currentEvents: CalendarEvent[]): { events: CalendarEvent[]; command: Command } | null {
    const command = this.redoStack.pop();
    if (!command) return null;
    
    // Add back to undo stack
    this.undoStack.push(command);
    
    // Re-execute the command
    const events = command.execute(currentEvents);
    
    return { events, command };
  }

  // Check if can undo
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  // Check if can redo
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Get undo description
  getUndoDescription(): string | null {
    if (this.undoStack.length === 0) return null;
    const command = this.undoStack[this.undoStack.length - 1];
    return command.description;
  }

  // Get redo description
  getRedoDescription(): string | null {
    if (this.redoStack.length === 0) return null;
    const command = this.redoStack[this.redoStack.length - 1];
    return command.description;
  }

  // Get stack sizes for debugging
  getStackSizes(): { undo: number; redo: number } {
    return {
      undo: this.undoStack.length,
      redo: this.redoStack.length,
    };
  }

  // Clear all history (on save or cancel)
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  // Get full history for debugging
  getHistory(): { undo: Command[]; redo: Command[] } {
    return {
      undo: [...this.undoStack],
      redo: [...this.redoStack],
    };
  }
}

// Export singleton instance for calendar
export const calendarHistory = new CalendarHistoryManager();
