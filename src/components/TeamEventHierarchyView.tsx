/**
 * TEAM EVENT HIERARCHY VIEW
 * 
 * Displays a team event's complete hierarchy including primary event,
 * child events, and all associated tasks with visual tree structure.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, ChevronRight, Layers, Calendar, Target,
  CheckCircle2, Circle, Users, Clock, Plus, Link2
} from 'lucide-react';
import { TeamEventHierarchy } from '../utils/team-event-integration';
import { Event, Task } from '../utils/event-task-types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format } from 'date-fns';

interface TeamEventHierarchyViewProps {
  hierarchy: TeamEventHierarchy;
  onEventClick?: (event: Event) => void;
  onTaskClick?: (task: Task) => void;
  onAddChildEvent?: (parentEvent: Event) => void;
  onAddTask?: (event: Event) => void;
  canEdit?: boolean;
  className?: string;
}

export function TeamEventHierarchyView({
  hierarchy,
  onEventClick,
  onTaskClick,
  onAddChildEvent,
  onAddTask,
  canEdit = false,
  className = '',
}: TeamEventHierarchyViewProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(
    new Set([hierarchy.primaryEvent.id])
  );

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const getEventTasks = (eventId: string) => {
    return hierarchy.allTasks.filter(t => t.parentEventId === eventId);
  };

  const getChildEvents = (parentId: string) => {
    return hierarchy.childEvents.filter(e => e.parentEventId === parentId);
  };

  const renderEvent = (event: Event, depth: number = 0) => {
    const isExpanded = expandedEvents.has(event.id);
    const childEvents = getChildEvents(event.id);
    const tasks = getEventTasks(event.id);
    const hasChildren = childEvents.length > 0 || tasks.length > 0;
    
    const completedTasks = tasks.filter(t => t.completed).length;
    const taskProgress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    return (
      <div key={event.id} className="relative">
        {/* Depth Indicator */}
        {depth > 0 && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-700"
            style={{ left: `${(depth - 1) * 24}px` }}
          />
        )}

        {/* Event Card */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: depth * 0.05 }}
          className="mb-2"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <Card className={`p-3 ${
            event.completed ? 'bg-green-500/5 border-green-500/20' : 'bg-gray-800/50'
          }`}>
            <div className="flex items-start gap-2">
              {/* Expand/Collapse Button */}
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => toggleEvent(event.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="w-6 shrink-0" />
              )}

              {/* Event Icon */}
              <div className={`p-2 rounded-lg shrink-0 ${
                event.isPrimaryEvent 
                  ? 'bg-purple-500/20' 
                  : 'bg-blue-500/20'
              }`}>
                {event.isPrimaryEvent ? (
                  <Layers className="w-4 h-4 text-purple-400" />
                ) : (
                  <Calendar className="w-4 h-4 text-blue-400" />
                )}
              </div>

              {/* Event Info */}
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onEventClick?.(event)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {event.title}
                  </h4>
                  
                  {event.isPrimaryEvent && (
                    <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-300 text-xs">
                      Primary
                    </Badge>
                  )}
                  
                  {event.completed && (
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(event.startTime), 'MMM d')}</span>
                  </div>
                  
                  {childEvents.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>{childEvents.length} sub-events</span>
                    </div>
                  )}
                  
                  {tasks.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>{completedTasks}/{tasks.length} tasks</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{event.teamMembers.length}</span>
                  </div>
                </div>

                {/* Task Progress */}
                {tasks.length > 0 && (
                  <div className="mt-2">
                    <Progress value={taskProgress} className="h-1.5" />
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {canEdit && (
                <div className="flex items-center gap-1 shrink-0">
                  {onAddChildEvent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddChildEvent(event);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Event
                    </Button>
                  )}
                  {onAddTask && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddTask(event);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Task
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Tasks */}
              {tasks.length > 0 && (
                <div className="mb-2" style={{ marginLeft: `${(depth + 1) * 24}px` }}>
                  {tasks.map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-1"
                    >
                      <div
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          task.completed
                            ? 'bg-green-500/5 hover:bg-green-500/10'
                            : 'bg-gray-800/30 hover:bg-gray-800/50'
                        }`}
                        onClick={() => onTaskClick?.(task)}
                      >
                        <div className="flex items-center gap-2">
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-500 shrink-0" />
                          )}
                          
                          <Target className="w-3 h-3 text-blue-400 shrink-0" />
                          
                          <span className={`text-sm flex-1 min-w-0 truncate ${
                            task.completed ? 'text-gray-400 line-through' : 'text-white'
                          }`}>
                            {task.title}
                          </span>

                          {task.assignedTo && task.assignedTo.length > 0 && (
                            <div className="flex -space-x-1 shrink-0">
                              {task.assignedTo.slice(0, 2).map(member => (
                                <Avatar key={member.id} className="w-5 h-5 border border-gray-900">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {member.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Child Events (Recursive) */}
              {childEvents.map(childEvent => renderEvent(childEvent, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Event Hierarchy
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {hierarchy.childEvents.length + 1} events • {hierarchy.allTasks.length} tasks • {hierarchy.memberCount} members
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{hierarchy.completionRate}%</div>
            <div className="text-xs text-gray-400">Complete</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Hierarchy Tree */}
      <div className="space-y-2">
        {renderEvent(hierarchy.primaryEvent, 0)}
      </div>

      {/* Summary Stats */}
      <Card className="p-4 bg-gray-800/30">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400 mb-1">Total Events</div>
            <div className="text-lg font-semibold text-white">
              {hierarchy.childEvents.length + 1}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Max Depth</div>
            <div className="text-lg font-semibold text-white">
              {hierarchy.depth}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Total Tasks</div>
            <div className="text-lg font-semibold text-white">
              {hierarchy.allTasks.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Team Members</div>
            <div className="text-lg font-semibold text-white">
              {hierarchy.memberCount}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
