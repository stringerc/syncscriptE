/**
 * Event Task Breadcrumb Component
 * 
 * PHASE 5E: Shows hierarchical breadcrumb trail for tasks associated with events
 * 
 * Features:
 * - Displays: Primary Event > Sub Event > Task
 * - Clickable navigation to parent events
 * - Compact badge mode for task cards
 * - Full breadcrumb mode for modals
 * - Shows depth indicators for deep hierarchies
 */

import { ChevronRight, Calendar, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Event, Task } from '../utils/event-task-types';

interface EventTaskBreadcrumbProps {
  task?: Task;
  event?: Event;
  allEvents?: Event[];
  mode?: 'full' | 'compact' | 'badge';
  onNavigateToEvent?: (eventId: string) => void;
  className?: string;
}

export function EventTaskBreadcrumb({
  task,
  event,
  allEvents = [],
  mode = 'full',
  onNavigateToEvent,
  className = '',
}: EventTaskBreadcrumbProps) {
  // Build breadcrumb trail
  const buildBreadcrumbTrail = (): { id: string; title: string; isPrimary: boolean }[] => {
    const trail: { id: string; title: string; isPrimary: boolean }[] = [];

    // If we have a task, start from its parent event
    let currentEventId = task?.parentEventId || event?.id;
    
    // Traverse up the hierarchy
    while (currentEventId && allEvents.length > 0) {
      const currentEvent = allEvents.find(e => e.id === currentEventId);
      if (!currentEvent) break;

      trail.unshift({
        id: currentEvent.id,
        title: currentEvent.title,
        isPrimary: currentEvent.isPrimaryEvent || false,
      });

      currentEventId = currentEvent.parentEventId;
    }

    return trail;
  };

  const breadcrumbTrail = buildBreadcrumbTrail();

  // Don't render if no trail
  if (breadcrumbTrail.length === 0) {
    return null;
  }

  // BADGE MODE: Compact badge for task cards
  if (mode === 'badge') {
    const primaryEvent = breadcrumbTrail.find(item => item.isPrimary) || breadcrumbTrail[0];
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`gap-1 cursor-pointer hover:bg-accent/50 transition-colors ${className}`}
              onClick={() => onNavigateToEvent?.(primaryEvent.id)}
            >
              <Calendar className="h-3 w-3" />
              <span className="text-xs truncate max-w-[120px]">
                {primaryEvent.title}
              </span>
              {breadcrumbTrail.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  +{breadcrumbTrail.length - 1}
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="text-xs font-semibold">Event Hierarchy:</p>
              <div className="flex items-center gap-1 text-xs">
                {breadcrumbTrail.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-1">
                    <span className={item.isPrimary ? 'font-semibold' : ''}>
                      {item.title}
                    </span>
                    {index < breadcrumbTrail.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // COMPACT MODE: Single line with icons
  if (mode === 'compact') {
    return (
      <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        <Calendar className="h-3.5 w-3.5" />
        {breadcrumbTrail.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1">
            <button
              onClick={() => onNavigateToEvent?.(item.id)}
              className={`hover:text-foreground hover:underline transition-colors ${
                item.isPrimary ? 'font-semibold text-foreground' : ''
              }`}
            >
              {item.title}
            </button>
            {index < breadcrumbTrail.length - 1 && (
              <ChevronRight className="h-3 w-3 opacity-50" />
            )}
          </div>
        ))}
        {task && (
          <>
            <ChevronRight className="h-3 w-3 opacity-50" />
            <div className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              <span className="text-foreground">{task.title}</span>
            </div>
          </>
        )}
      </div>
    );
  }

  // FULL MODE: Full breadcrumb with visual hierarchy
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Event Hierarchy
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {breadcrumbTrail.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <Button
              variant={item.isPrimary ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onNavigateToEvent?.(item.id)}
              className="h-8 gap-2"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{item.title}</span>
              {item.isPrimary && (
                <Badge variant="outline" className="ml-1 text-xs">
                  Primary
                </Badge>
              )}
            </Button>
            {index < breadcrumbTrail.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
        {task && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-md">
              <Target className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{task.title}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
