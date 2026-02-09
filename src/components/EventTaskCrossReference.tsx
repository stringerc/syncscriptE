/**
 * Event Task Cross-Reference Component
 * 
 * PHASE 5E: Displays all tasks associated with an event and its child events
 * 
 * Features:
 * - Shows tasks from current event
 * - Shows tasks from child events (hierarchical)
 * - Grouped by event in hierarchy
 * - Quick actions for each task
 * - Task count badges
 * - Expandable sections for each event level
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Target, CheckCircle2, Circle, Calendar, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Event, Task, getDescendantEventIds } from '../utils/event-task-types';
import { getPriorityBorderClass } from '../utils/priority-colors';
import { ResonanceBadge } from './ResonanceBadge';

interface EventTaskCrossReferenceProps {
  event: Event;
  allEvents: Event[];
  allTasks: Task[];
  onTaskClick?: (taskId: string) => void;
  onNavigateToEvent?: (eventId: string) => void;
  showHierarchy?: boolean;
  className?: string;
}

export function EventTaskCrossReference({
  event,
  allEvents,
  allTasks,
  onTaskClick,
  onNavigateToEvent,
  showHierarchy = true,
  className = '',
}: EventTaskCrossReferenceProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    [event.id]: true, // Current event expanded by default
  });

  // Get tasks for this event
  const currentEventTasks = allTasks.filter(t => t.parentEventId === event.id && !t.archived);

  // Get child events and their tasks (if showing hierarchy)
  const childEventIds = showHierarchy ? getDescendantEventIds(event.id, allEvents) : [];
  const childEvents = allEvents.filter(e => childEventIds.includes(e.id));

  // Group tasks by event
  const tasksByEvent = new Map<string, Task[]>();
  tasksByEvent.set(event.id, currentEventTasks);

  if (showHierarchy) {
    childEvents.forEach(childEvent => {
      const childTasks = allTasks.filter(t => t.parentEventId === childEvent.id && !t.archived);
      if (childTasks.length > 0) {
        tasksByEvent.set(childEvent.id, childTasks);
      }
    });
  }

  // Calculate totals
  const totalTasks = Array.from(tasksByEvent.values()).reduce((sum, tasks) => sum + tasks.length, 0);
  const completedTasks = Array.from(tasksByEvent.values()).reduce(
    (sum, tasks) => sum + tasks.filter(t => t.completed).length,
    0
  );
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const toggleSection = (eventId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  if (totalTasks === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center space-y-2">
          <Target className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
          <p className="text-sm text-muted-foreground">
            No tasks associated with this event yet
          </p>
          <p className="text-xs text-muted-foreground">
            Tasks created within this event will appear here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Associated Tasks</h3>
            <Badge variant="secondary">
              {completedTasks}/{totalTasks}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">{completionPercentage}% complete</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      <Separator />

      {/* Task Groups by Event */}
      <div className="space-y-3">
        {Array.from(tasksByEvent.entries()).map(([eventId, tasks]) => {
          const eventData = eventId === event.id ? event : allEvents.find(e => e.id === eventId);
          if (!eventData) return null;

          const isExpanded = expandedSections[eventId] ?? false;
          const taskCount = tasks.length;
          const completedCount = tasks.filter(t => t.completed).length;
          const isCurrentEvent = eventId === event.id;

          return (
            <div key={eventId} className="space-y-2">
              {/* Event Header */}
              <button
                onClick={() => toggleSection(eventId)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{eventData.title}</span>
                    {isCurrentEvent && (
                      <Badge variant="outline" className="text-xs">
                        This Event
                      </Badge>
                    )}
                    {eventData.isPrimaryEvent && (
                      <Badge variant="secondary" className="text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {completedCount}/{taskCount}
                  </Badge>
                  {!isCurrentEvent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToEvent?.(eventId);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View Event
                    </Button>
                  )}
                </div>
              </button>

              {/* Task List */}
              {isExpanded && (
                <div className="ml-7 space-y-2">
                  {tasks.map(task => {
                    const priorityClass = getPriorityBorderClass(task.priority);
                    
                    return (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick?.(task.id)}
                        className={`w-full text-left p-3 rounded-lg border-l-4 hover:bg-accent/30 transition-colors ${priorityClass}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {task.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.title}
                                </span>
                                {task.resonanceScore !== undefined && (
                                  <ResonanceBadge score={task.resonanceScore} size="sm" />
                                )}
                              </div>
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                {task.dueDate && (
                                  <Badge variant="outline" className="text-xs">
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </Badge>
                                )}
                                {task.priority && (
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {task.priority}
                                  </Badge>
                                )}
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {task.progress > 0 && !task.completed && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">{task.progress}%</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      {showHierarchy && childEvents.length > 0 && (
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Showing tasks from {tasksByEvent.size} event{tasksByEvent.size > 1 ? 's' : ''} in this hierarchy
          </p>
        </div>
      )}
    </div>
  );
}
