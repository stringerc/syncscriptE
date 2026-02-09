/**
 * Task Event Association Badge
 * 
 * PHASE 5E: Visual indicator showing a task's association with events
 * 
 * Features:
 * - Shows parent event name
 * - Shows full hierarchy on hover
 * - Clickable to navigate to event
 * - Different styles for primary/sub events
 */

import { Calendar, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Event, Task } from '../utils/event-task-types';
import { getTaskEventHierarchy } from '../utils/task-event-integration';

interface TaskEventAssociationBadgeProps {
  task: Task;
  allEvents: Event[];
  onNavigateToEvent?: (eventId: string) => void;
  mode?: 'compact' | 'full';
  className?: string;
}

export function TaskEventAssociationBadge({
  task,
  allEvents,
  onNavigateToEvent,
  mode = 'compact',
  className = '',
}: TaskEventAssociationBadgeProps) {
  // Don't render if task is not associated with an event
  if (!task.parentEventId && !task.primaryEventId) {
    return null;
  }

  const hierarchy = getTaskEventHierarchy(task, allEvents);
  const parentEvent = task.parentEventId
    ? allEvents.find(e => e.id === task.parentEventId)
    : null;
  const primaryEvent = task.primaryEventId
    ? allEvents.find(e => e.id === task.primaryEventId)
    : null;

  if (!parentEvent && !primaryEvent) {
    return null; // Event no longer exists
  }

  const displayEvent = parentEvent || primaryEvent!;
  const isPrimary = displayEvent.isPrimaryEvent;

  if (mode === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={isPrimary ? 'secondary' : 'outline'}
              className={`gap-1 cursor-pointer hover:bg-accent transition-colors ${className}`}
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToEvent?.(displayEvent.id);
              }}
            >
              <Calendar className="h-3 w-3" />
              <span className="text-xs truncate max-w-[100px]">
                {displayEvent.title}
              </span>
              {hierarchy.length > 1 && (
                <span className="text-xs opacity-70">
                  +{hierarchy.length - 1}
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold">Event Hierarchy</p>
              <div className="space-y-0.5">
                {hierarchy.map((event, index) => (
                  <div key={event.id} className="flex items-center gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      {index > 0 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={event.isPrimaryEvent ? 'font-semibold' : ''}>
                        {event.title}
                      </span>
                      {event.isPrimaryEvent && (
                        <span className="text-[10px] px-1 py-0.5 bg-primary/20 rounded">
                          PRIMARY
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground pt-1 border-t">
                Click badge to view event
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full mode
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {hierarchy.map((event, index) => (
          <div key={event.id} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3 w-3" />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToEvent?.(event.id);
              }}
              className={`hover:text-foreground hover:underline transition-colors ${
                event.isPrimaryEvent ? 'font-semibold' : ''
              }`}
            >
              {event.title}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Simple inline text version for use in descriptions
 */
export function TaskEventAssociationText({
  task,
  allEvents,
  className = '',
}: Omit<TaskEventAssociationBadgeProps, 'onNavigateToEvent' | 'mode'>) {
  const parentEvent = task.parentEventId
    ? allEvents.find(e => e.id === task.parentEventId)
    : null;

  if (!parentEvent) return null;

  return (
    <span className={`text-xs text-muted-foreground ${className}`}>
      Part of: <span className="font-medium">{parentEvent.title}</span>
    </span>
  );
}
