/**
 * TEAM EVENT CARD
 * 
 * Display card for team events with hierarchy badges, statistics, and quick actions.
 * Shows primary events with child event counts and task progress.
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, Users, CheckCircle2, Clock, ChevronRight,
  MoreVertical, Edit, Trash2, Archive, Copy, Share2,
  Layers, Target, TrendingUp, AlertCircle
} from 'lucide-react';
import { Event } from '../utils/event-task-types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format } from 'date-fns';

interface TeamEventCardProps {
  event: Event;
  childEventsCount?: number;
  totalTasks?: number;
  completedTasks?: number;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onDuplicate?: () => void;
  onShare?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  className?: string;
}

export function TeamEventCard({
  event,
  childEventsCount = 0,
  totalTasks = 0,
  completedTasks = 0,
  onViewDetails,
  onEdit,
  onDelete,
  onArchive,
  onDuplicate,
  onShare,
  canEdit = false,
  canDelete = false,
  className = '',
}: TeamEventCardProps) {
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isCompleted = event.completed;
  const isArchived = event.archived;
  const isPrimary = event.isPrimaryEvent;
  
  // Calculate time status
  const now = new Date();
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const isUpcoming = startTime > now;
  const isActive = startTime <= now && endTime >= now;
  const isPast = endTime < now;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={className}
    >
      <Card 
        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg border ${
          isArchived ? 'opacity-60 border-gray-600' : 
          isCompleted ? 'border-green-500/30 bg-green-500/5' : 
          isActive ? 'border-blue-500/30 bg-blue-500/5' : 
          'border-gray-700'
        }`}
        onClick={onViewDetails}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Primary Event Badge */}
              {isPrimary && (
                <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-300 text-xs">
                  <Layers className="w-3 h-3 mr-1" />
                  Primary
                </Badge>
              )}
              
              {/* Status Badge */}
              {isArchived ? (
                <Badge variant="outline" className="bg-gray-500/10 border-gray-500/30 text-gray-400 text-xs">
                  <Archive className="w-3 h-3 mr-1" />
                  Archived
                </Badge>
              ) : isCompleted ? (
                <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              ) : isActive ? (
                <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : isUpcoming ? (
                <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Upcoming
                </Badge>
              ) : null}
            </div>
            
            <h3 className="text-base font-semibold text-white truncate">
              {event.title}
            </h3>
            
            {event.description && (
              <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                {event.description}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canEdit && (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Event
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare?.(); }}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                  </>
                )}
                {canEdit && canDelete && <DropdownMenuSeparator />}
                {canEdit && !isArchived && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive?.(); }}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                    className="text-red-400 focus:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Time Information */}
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{format(startTime, 'MMM d, yyyy')}</span>
          </div>
          {endTime && startTime.getTime() !== endTime.getTime() && (
            <div className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              <span>{format(endTime, 'MMM d, yyyy')}</span>
            </div>
          )}
          {event.category && (
            <Badge variant="outline" className="text-xs">
              {event.category}
            </Badge>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {/* Child Events */}
          {isPrimary && childEventsCount > 0 && (
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-xs text-gray-400">Events</div>
                <div className="text-sm font-semibold text-white">{childEventsCount}</div>
              </div>
            </div>
          )}
          
          {/* Tasks */}
          {totalTasks > 0 && (
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-xs text-gray-400">Tasks</div>
                <div className="text-sm font-semibold text-white">
                  {completedTasks}/{totalTasks}
                </div>
              </div>
            </div>
          )}
          
          {/* Team Members */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            <div>
              <div className="text-xs text-gray-400">Members</div>
              <div className="text-sm font-semibold text-white">{event.teamMembers.length}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Team Members Avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {event.teamMembers.slice(0, 4).map((member, idx) => (
              <Avatar key={member.id} className="w-6 h-6 border-2 border-gray-900">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="text-xs">
                  {member.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {event.teamMembers.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center">
                <span className="text-xs text-gray-400">+{event.teamMembers.length - 4}</span>
              </div>
            )}
          </div>
          
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs text-blue-400 hover:text-blue-300"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
            >
              View Details
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
