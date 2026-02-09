/**
 * Task/Event Card Component
 * 
 * Displays a task or event card with:
 * - Prep badges
 * - Task list with checkboxes
 * - Resource/link indicators
 * - Team member avatars
 * - Click to open modal
 */

import { Event, Task, getResourceCount, getLinksNotesCount, getCompletedSubtaskCount } from '../utils/event-task-types';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import {
  CheckCircle2,
  Circle,
  Paperclip,
  Link as LinkIcon,
  Users,
  Calendar,
  Clock,
} from 'lucide-react';
import { motion } from 'motion/react';

interface TaskEventCardProps {
  item: Event | Task;
  type: 'event' | 'task';
  onClick: () => void;
  className?: string;
}

export function TaskEventCard({ item, type, onClick, className = '' }: TaskEventCardProps) {
  const isEvent = type === 'event';
  const event = isEvent ? (item as Event) : null;
  const task = !isEvent ? (item as Task) : null;

  const resourceCount = getResourceCount(item);
  const linksNotesCount = getLinksNotesCount(item);
  
  // Get task completion stats
  const eventTasks = event?.tasks || [];
  const completedTasks = eventTasks.filter(t => t.completed).length;
  const totalTasks = eventTasks.length;
  
  // Get team members
  const teamMembers = isEvent ? event!.teamMembers : task?.assignedTo || [];

  // Get priority color for left accent (matching Tasks tab)
  const getPriorityColor = () => {
    if (task?.priority === 'high') return 'border-l-red-500';
    if (task?.priority === 'medium') return 'border-l-yellow-500';
    if (task?.priority === 'low') return 'border-l-green-500';
    return 'border-l-blue-500'; // default for events
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`bg-[#1e2128] border border-gray-800 rounded-xl p-5 hover:shadow-lg hover:border-gray-700 transition-all cursor-pointer ${getPriorityColor()} border-l-[3px] ${className}`}
    >
      {/* Header with Title and Prep Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-200 mb-1 truncate">{item.title}</h3>
          
          {/* Prep For Badge (for tasks) */}
          {task?.prepForEventName && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
              Prep for: {task.prepForEventName}
            </Badge>
          )}
        </div>

        {/* Time/Date */}
        {isEvent && event && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Tasks List (for events with tasks) */}
      {isEvent && totalTasks > 0 && (
        <div className="mb-3 space-y-1">
          {eventTasks.slice(0, 3).map((eventTask: Task) => {
            const taskResourceCount = getResourceCount(eventTask);
            const taskLinksNotesCount = getLinksNotesCount(eventTask);
            
            return (
              <div
                key={eventTask.id}
                className="flex items-center gap-2 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle task completion
                }}
              >
                {eventTask.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
                <span className={`flex-1 truncate ${eventTask.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                  {eventTask.title}
                </span>
                
                {/* Task-level attachments */}
                <div className="flex items-center gap-1">
                  {taskResourceCount > 0 && (
                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                      <Paperclip className="w-3 h-3" />
                      {taskResourceCount}
                    </span>
                  )}
                  {taskLinksNotesCount > 0 && (
                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                      <LinkIcon className="w-3 h-3" />
                      {taskLinksNotesCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          
          {totalTasks > 3 && (
            <p className="text-xs text-gray-500 pl-6">
              +{totalTasks - 3} more tasks
            </p>
          )}
        </div>
      )}

      {/* Progress Bar (for events with tasks) */}
      {isEvent && totalTasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{completedTasks}/{totalTasks} tasks</span>
          </div>
          <Progress 
            value={(completedTasks / totalTasks) * 100} 
            className="h-1.5"
          />
        </div>
      )}

      {/* Bottom Row: Team Members + Attachments */}
      <div className="flex items-center justify-between">
        {/* Team Members */}
        {teamMembers.length > 0 && (
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {teamMembers.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="w-6 h-6 border-2 border-[#1a1f2e]">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            {teamMembers.length > 3 && (
              <span className="text-xs text-gray-500 ml-2">
                +{teamMembers.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Attachments Count */}
        <div className="flex items-center gap-3">
          {resourceCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{resourceCount}</span>
            </div>
          )}
          {linksNotesCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{linksNotesCount}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}