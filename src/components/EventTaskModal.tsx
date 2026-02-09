/**
 * Event/Task Modal (DEPRECATED - PHASE 4)
 * 
 * @deprecated This combined modal is being phased out in favor of separate EventModal and TaskModal components.
 * Use EventModal for events and TaskModal for tasks instead.
 * 
 * Legacy comprehensive modal for viewing and editing events and tasks
 * Includes tasks, subtasks, resources, links/notes, team members
 * AI task suggestions, and script conversion
 * 
 * Kept for backward compatibility during migration.
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { AnimatedAvatar } from './AnimatedAvatar';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  Paperclip,
  Link as LinkIcon,
  FileText,
  Users,
  Save,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  CalendarPlus,
  ListChecks,
  BookTemplate,
  Shield,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { Event, Task, Resource, LinkNote, TeamMember, getResourceCount, getLinksNotesCount, getCompletedSubtaskCount } from '../utils/event-task-types';
import { isEventPast } from '../utils/event-task-types';  // PHASE 3: Import auto-completion helper
import { AITaskSuggestionDialog } from './AITaskSuggestionDialog';
import { EventAdminManager, EventMember } from './EventAdminManager';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import { detectEventConflicts, formatConflictMessage } from '../utils/calendar-conflicts';

interface EventTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Event | Task | null;
  type: 'event' | 'task';
  currentUserId: string;
  onSave: (item: Event | Task) => void;
  onDelete?: () => void;
  onConvertTaskToEvent?: (task: Task) => void;
  onSaveAsScript?: (event: Event) => void;
  allEvents?: Event[]; // For conflict detection
}

export function EventTaskModal({
  open,
  onOpenChange,
  item,
  type,
  currentUserId,
  onSave,
  onDelete,
  onConvertTaskToEvent,
  onSaveAsScript,
  allEvents,
}: EventTaskModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [editedItem, setEditedItem] = useState<Event | Task | null>(item);

  // Reset editing state when modal opens/closes or item changes
  useEffect(() => {
    setIsEditing(false);
    setEditedItem(item);
  }, [open, item]);

  if (!item || !editedItem) return null;

  const isEvent = type === 'event';
  const event = isEvent ? (item as Event) : null;
  const task = !isEvent ? (item as Task) : null;

  // Check permissions
  const canEdit = isEvent
    ? event!.allowTeamEdits || event!.createdBy === currentUserId
    : true; // Tasks can always be edited

  const resourceCount = getResourceCount(item);
  const linksNotesCount = getLinksNotesCount(item);
  const taskCount = isEvent ? event!.tasks.length : 0;

  // Handle task completion toggle
  const handleToggleTaskComplete = (taskId: string, parentTaskId?: string) => {
    if (!isEvent) return;
    
    const updatedEvent = { ...event! };
    
    if (parentTaskId) {
      // It's a subtask
      const parentTask = updatedEvent.tasks.find(t => t.id === parentTaskId);
      if (parentTask) {
        const subtask = parentTask.subtasks.find(st => st.id === taskId);
        if (subtask) {
          subtask.completed = !subtask.completed;
        }
      }
    } else {
      // It's a main task
      const taskToToggle = updatedEvent.tasks.find(t => t.id === taskId);
      if (taskToToggle) {
        taskToToggle.completed = !taskToToggle.completed;
      }
    }
    
    setEditedItem(updatedEvent);
  };

  // Handle AI task suggestions
  const handleAITasksSelected = (tasks: Partial<Task>[]) => {
    if (!isEvent) return;
    
    const updatedEvent = { ...event! };
    const newTasks: Task[] = tasks.map(t => ({
      ...t,
      id: t.id || `task-${Date.now()}-${Math.random()}`,
      title: t.title || '',
      completed: false,
      subtasks: [],
      resources: [],
      linksNotes: [],
      assignedTo: [],
      createdBy: currentUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentEventId: event!.id,
      prepForEventId: event!.id,
      prepForEventName: event!.title,
    } as Task));
    
    updatedEvent.tasks = [...updatedEvent.tasks, ...newTasks];
    setEditedItem(updatedEvent);
    
    toast.success(`Added ${newTasks.length} AI-generated tasks`);
  };

  // Handle save
  const handleSave = () => {
    if (!editedItem) return;
    
    onSave(editedItem as any);
    setIsEditing(false);
    
    toast.success(`${isEvent ? 'Event' : 'Task'} updated`, {
      description: 'All team members have been notified',
    });
  };

  // Handle convert to event
  const handleConvertToEvent = () => {
    if (!task || !onConvertTaskToEvent) return;
    
    onConvertTaskToEvent(task);
    onOpenChange(false);
    
    toast.success('Task converted to event', {
      description: 'Event created successfully',
      icon: <CalendarPlus className="w-4 h-4" />,
    });
  };

  // Handle save as script
  const handleSaveAsScript = () => {
    if (!event || !onSaveAsScript) return;
    
    onSaveAsScript(event);
    
    toast.success('Saved as script', {
      description: 'Script available in Scripts & Templates tab',
      icon: <BookTemplate className="w-4 h-4" />,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`!max-w-[1400px] w-[95vw] max-h-[90vh] bg-[#1a1d24] border-gray-800 text-white p-0 overflow-hidden !z-[100] flex flex-col !border-l-4 ${isEvent ? '!border-l-teal-500' : '!border-l-blue-500'}`}>
          <DialogHeader className="p-6 pb-4 border-b border-gray-800 shrink-0">
            <DialogTitle className="sr-only">{isEvent ? event?.title : task?.title}</DialogTitle>
            <DialogDescription className="sr-only">
              {isEvent ? 'Event details and management' : 'Task details and management'}
            </DialogDescription>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {/* Type Identifier Badge */}
                  {isEvent ? (
                    <Badge className="bg-teal-500/20 text-teal-300 border border-teal-500/50 px-2 py-1">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      EVENT
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/50 px-2 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      TASK
                    </Badge>
                  )}
                  
                  {/* PHASE 3: Completed/Past Event Badge */}
                  {isEvent && event && (event.completed || isEventPast(event)) && (
                    <Badge className="bg-gray-500/20 text-gray-300 border border-gray-500/50 px-2 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      COMPLETED
                    </Badge>
                  )}
                  
                  {/* Prep For Badge */}
                  {task?.prepForEventName && (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                      Prep for: {task.prepForEventName}
                    </Badge>
                  )}
                </div>
                
                {isEditing ? (
                  <Input
                    value={(editedItem as any).title}
                    onChange={e => setEditedItem({ ...editedItem, title: e.target.value } as any)}
                    className="text-2xl mb-2 bg-[#2a2d35] border-gray-700 text-white"
                  />
                ) : (
                  <DialogTitle className="text-2xl text-white">{item.title}</DialogTitle>
                )}
                <DialogDescription className="sr-only">
                  {item.description || `${isEvent ? 'Event' : 'Task'} details for ${item.title}`}
                </DialogDescription>
              </div>
              
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button
                    variant={isEditing ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (isEditing) {
                        handleSave();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                  >
                    {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                    {isEditing ? 'Save' : 'Edit'}
                  </Button>
                )}
                
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-sm text-gray-400 mb-2">Description</h4>
                {isEditing ? (
                  <Textarea
                    value={(editedItem as any).description || ''}
                    onChange={e => setEditedItem({ ...editedItem, description: e.target.value } as any)}
                    placeholder="Add a description..."
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-300">{item.description || 'No description'}</p>
                )}
              </div>

              {/* Location - Only for Events */}
              {isEvent && event && event.location && (
                <div>
                  <h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </h4>
                  {isEditing ? (
                    <Input
                      value={(editedItem as any).location || ''}
                      onChange={e => setEditedItem({ ...editedItem, location: e.target.value } as any)}
                      placeholder="Add a location..."
                      className="bg-[#2a2d35] border-gray-700 text-white"
                    />
                  ) : (
                    <p className="text-gray-300">{event.location}</p>
                  )}
                </div>
              )}

              {/* Date/Time for Events */}
              {isEvent && event && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Start Time
                      </h4>
                      {isEditing ? (
                        <Input
                          type="datetime-local"
                          value={new Date(editedItem.startTime).toISOString().slice(0, 16)}
                          onChange={e => {
                            const newStartTime = new Date(e.target.value);
                            setEditedItem({ ...editedItem, startTime: newStartTime } as any);
                          }}
                        />
                      ) : (
                        <p className="text-gray-300">
                          {event.startTime.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        End Time
                      </h4>
                      {isEditing ? (
                        <Input
                          type="datetime-local"
                          value={new Date(editedItem.endTime).toISOString().slice(0, 16)}
                          onChange={e => {
                            const newEndTime = new Date(e.target.value);
                            setEditedItem({ ...editedItem, endTime: newEndTime } as any);
                          }}
                        />
                      ) : (
                        <p className="text-gray-300">
                          {event.endTime.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Conflict Warning - Only show when editing and conflicts exist */}
                  {isEditing && allEvents && (() => {
                    const conflictInfo = detectEventConflicts(editedItem as Event, allEvents);
                    return conflictInfo.hasConflict && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30"
                      >
                        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-300">
                            Scheduling Conflict
                          </p>
                          <p className="text-xs text-orange-400/80 mt-1">
                            {formatConflictMessage(conflictInfo)}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            You can still save this event. Consider adjusting the time to avoid conflicts.
                          </p>
                        </div>
                      </motion.div>
                    );
                  })()}
                </>
              )}

              <Separator />

              {/* Team Members */}
              {(isEvent ? event!.teamMembers : task?.assignedTo)?.length > 0 && (
                <>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team Members ({(isEvent ? event!.teamMembers : task?.assignedTo)?.length})
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {(isEvent ? event!.teamMembers : task?.assignedTo)?.map((member: TeamMember) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 bg-[#2a2d35] border border-gray-800 rounded-lg p-3"
                        >
                          <AnimatedAvatar
                            name={member.name}
                            image={member.avatar}
                            fallback={member.name[0]}
                            progress={member.progress}
                            animationType={member.progress >= 80 ? 'glow' : member.progress >= 50 ? 'pulse' : 'heartbeat'}
                            size={40}
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{member.name}</p>
                            {member.progress !== undefined && (
                              <div className="flex items-center gap-2 mt-1.5">
                                <Progress value={member.progress} className="h-1.5 w-24 bg-gray-700" />
                                <span className="text-xs text-gray-400 font-medium">{member.progress}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Tasks (for events) */}
              {isEvent && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm text-gray-400 flex items-center gap-2">
                        <ListChecks className="w-4 h-4" />
                        Tasks ({taskCount})
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAISuggestions(true)}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Suggest
                      </Button>
                    </div>

                    {event!.tasks.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ListChecks className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No tasks yet</p>
                        <p className="text-sm">Use AI to generate tasks</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                          {event!.tasks.map((eventTask: Task) => {
                            const subtaskProgress = getCompletedSubtaskCount(eventTask);
                            const hasResources = getResourceCount(eventTask) > 0;
                            const hasLinksNotes = getLinksNotesCount(eventTask) > 0;
                            
                            return (
                              <motion.div
                                key={eventTask.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-[#1a1f2e] rounded-lg p-3"
                              >
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={() => handleToggleTaskComplete(eventTask.id)}
                                    className="mt-0.5"
                                  >
                                    {eventTask.completed ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                                    )}
                                  </button>
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-gray-300 ${eventTask.completed ? 'line-through opacity-50' : ''}`}>
                                      {eventTask.title}
                                    </p>
                                    
                                    {/* Attachments */}
                                    <div className="flex items-center gap-3 mt-1">
                                      {hasResources && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <Paperclip className="w-3 h-3" />
                                          {getResourceCount(eventTask)} resource{getResourceCount(eventTask) > 1 ? 's' : ''}
                                        </span>
                                      )}
                                      {hasLinksNotes && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <LinkIcon className="w-3 h-3" />
                                          {getLinksNotesCount(eventTask)} link{getLinksNotesCount(eventTask) > 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Subtasks */}
                                    {eventTask.subtasks.length > 0 && (
                                      <div className="mt-2 ml-4 space-y-1">
                                        {eventTask.subtasks.map(subtask => (
                                          <div key={subtask.id} className="flex items-center gap-2">
                                            <button
                                              onClick={() => handleToggleTaskComplete(subtask.id, eventTask.id)}
                                              className="text-xs"
                                            >
                                              {subtask.completed ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                              ) : (
                                                <Circle className="w-4 h-4 text-gray-600 hover:text-gray-500" />
                                              )}
                                            </button>
                                            <span className={`text-sm text-gray-400 ${subtask.completed ? 'line-through opacity-50' : ''}`}>
                                              {subtask.title}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Resources */}
              {resourceCount > 0 && (
                <>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Resources ({resourceCount})
                    </h4>
                    <div className="space-y-2">
                      {item.resources.map((resource: Resource) => (
                        <div
                          key={resource.id}
                          className="flex items-center justify-between bg-[#1a1f2e] rounded-lg p-3 hover:bg-[#1e2433] transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-blue-400" />
                            <div className="min-w-0">
                              <p className="text-gray-300 truncate">{resource.name}</p>
                              <p className="text-xs text-gray-500">
                                Uploaded by {resource.uploadedBy}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Links & Notes */}
              {linksNotesCount > 0 && (
                <>
                  <div>
                    <h4 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Links & Notes ({linksNotesCount})
                    </h4>
                    <div className="space-y-2">
                      {item.linksNotes.map((linkNote: LinkNote) => (
                        <div
                          key={linkNote.id}
                          className="flex items-center justify-between bg-[#1a1f2e] rounded-lg p-3 hover:bg-[#1e2433] transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {linkNote.type === 'link' ? (
                              <ExternalLink className="w-5 h-5 text-purple-400" />
                            ) : (
                              <FileText className="w-5 h-5 text-yellow-400" />
                            )}
                            <div className="min-w-0">
                              <p className="text-gray-300 truncate">{linkNote.title}</p>
                              <p className="text-xs text-gray-500 truncate">{linkNote.content}</p>
                            </div>
                          </div>
                          {linkNote.type === 'link' && (
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {/* Convert Task to Event */}
                {!isEvent && onConvertTaskToEvent && (
                  <Button
                    variant="outline"
                    onClick={handleConvertToEvent}
                  >
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                )}

                {/* Save as Script */}
                {isEvent && event!.tasks.length > 0 && !event!.hasScript && (
                  <Button
                    variant="outline"
                    onClick={handleSaveAsScript}
                  >
                    <BookTemplate className="w-4 h-4 mr-2" />
                    Save as Script
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Task Suggestions Dialog */}
      <AITaskSuggestionDialog
        open={showAISuggestions}
        onOpenChange={setShowAISuggestions}
        eventTitle={item.title}
        eventDescription={(item as any).description}
        eventDate={isEvent ? event!.startTime : undefined}
        onTasksSelected={handleAITasksSelected}
        existingTasks={isEvent ? event!.tasks : []}
        parentEventEndsAt={isEvent ? event!.endTime : undefined}
      />
    </>
  );
}