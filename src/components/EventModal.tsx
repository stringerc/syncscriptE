/**
 * Event Modal - PHASE 4: Architectural Cleanup
 * 
 * Dedicated modal for event management
 * Features: scheduling, location, RSVP, team members, tasks list, resources, links/notes,
 * AI task suggestions, conflict detection, save as script, auto-completion
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { AnimatedAvatar } from './AnimatedAvatar';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { EnhancedMilestoneItem } from './EnhancedMilestoneItem';
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
  ListChecks,
  BookTemplate,
  Shield,
  AlertTriangle,
  MapPin,
  UserPlus,
  Flag,
  Zap,
} from 'lucide-react';
import { Event, Task, Resource, LinkNote, TeamMember, getResourceCount, getLinksNotesCount } from '../utils/event-task-types';
import { isEventPast } from '../utils/event-task-types';
import { AITaskSuggestionDialog } from './AITaskSuggestionDialog';
import { EventAdminManager, EventMember } from './EventAdminManager';
import { EventAgendaTab } from './EventAgendaTab';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import { detectEventConflicts, formatConflictMessage } from '../utils/calendar-conflicts';
import { getEventEnergyValue } from '../utils/energy-system'; // PHASE 1.6: Energy system

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  currentUserId: string;
  onSave: (event: Event) => void;
  onDelete?: () => void;
  onSaveAsScript?: (event: Event) => void;
  allEvents?: Event[]; // For conflict detection
  onBulkUpdate?: (events: Event[]) => void; // NEW: For updating multiple events (milestones/steps)
  onCompleteEvent?: (eventId: string) => void; // PHASE 1.6: Energy system integration
}

export function EventModal({
  open,
  onOpenChange,
  event,
  currentUserId,
  onSave,
  onDelete,
  onSaveAsScript,
  allEvents,
  onBulkUpdate,
  onCompleteEvent, // PHASE 1.6: Energy system integration
}: EventModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Event | null>(event);
  const [activeTab, setActiveTab] = useState('overview');

  // Reset editing state when modal opens/closes or event changes
  useEffect(() => {
    setIsEditing(false);
    setEditedEvent(event);
    setActiveTab('overview');
  }, [open, event]);

  if (!event || !editedEvent) return null;

  // Check permissions
  const canEdit = event.allowTeamEdits || event.createdBy === currentUserId;

  const resourceCount = getResourceCount(event);
  const linksNotesCount = getLinksNotesCount(event);
  const taskCount = event.tasks.length;
  const completedTaskCount = event.tasks.filter(t => t.completed).length;

  // Detect conflicts
  const conflicts = allEvents && editedEvent.startTime && editedEvent.endTime
    ? detectEventConflicts(editedEvent, allEvents.filter(e => e.id !== editedEvent.id))
    : [];

  // Check if event is past/completed
  const isPastOrCompleted = event.completed || isEventPast(event);

  // Handle task completion toggle
  const handleToggleTaskComplete = (taskId: string, parentTaskId?: string) => {
    const updatedEvent = { ...editedEvent };
    
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
    
    setEditedEvent(updatedEvent);
  };

  // Handle milestone completion toggle
  const handleToggleMilestone = (taskId: string, milestoneId: string) => {
    const updatedEvent = { ...editedEvent };
    const task = updatedEvent.tasks.find(t => t.id === taskId);
    if (task) {
      const milestone = task.subtasks.find(m => m.id === milestoneId);
      if (milestone) {
        // Check if there are incomplete steps
        const hasIncompleteSteps = milestone.steps && milestone.steps.some(step => !step.completed);
        
        if (!milestone.completed && hasIncompleteSteps) {
          // Warn user before completing milestone with incomplete steps
          const confirmed = window.confirm(
            `This milestone has ${milestone.steps.filter(s => !s.completed).length} incomplete step(s). Mark as complete anyway?`
          );
          if (!confirmed) return;
        }
        
        milestone.completed = !milestone.completed;
        
        if (milestone.completed) {
          milestone.completedBy = currentUserId;
          milestone.completedAt = new Date().toLocaleString();
          toast.success('Milestone completed! 🎉', { description: milestone.title });
        } else {
          milestone.completedBy = null;
          milestone.completedAt = null;
        }
      }
    }
    setEditedEvent(updatedEvent);
    onSave(updatedEvent);
  };

  // Handle step completion toggle
  const handleToggleStep = (taskId: string, milestoneId: string, stepId: string) => {
    const updatedEvent = { ...editedEvent };
    const task = updatedEvent.tasks.find(t => t.id === taskId);
    if (task) {
      const milestone = task.subtasks.find(m => m.id === milestoneId);
      if (milestone && milestone.steps) {
        const step = milestone.steps.find(s => s.id === stepId);
        if (step) {
          step.completed = !step.completed;
          
          // Check if all steps are now complete
          if (step.completed && milestone.steps.every(s => s.completed)) {
            toast.success('All steps complete!', {
              description: `Consider marking "${milestone.title}" as complete`,
              action: {
                label: 'Complete',
                onClick: () => handleToggleMilestone(taskId, milestoneId),
              },
            });
          }
        }
      }
    }
    setEditedEvent(updatedEvent);
    onSave(updatedEvent);
  };

  // Handle adding a new step to a milestone
  const handleAddStep = (taskId: string, milestoneId: string, stepTitle: string) => {
    const updatedEvent = { ...editedEvent };
    const task = updatedEvent.tasks.find(t => t.id === taskId);
    if (task) {
      const milestone = task.subtasks.find(m => m.id === milestoneId);
      if (milestone) {
        if (!milestone.steps) {
          milestone.steps = [];
        }
        
        const newStep = {
          id: `step-${Date.now()}-${Math.random()}`,
          title: stepTitle,
          completed: false,
          assignedTo: { name: currentUserId, image: '', fallback: currentUserId[0] },
        };
        
        milestone.steps.push(newStep);
        setEditedEvent(updatedEvent);
        onSave(updatedEvent);
      }
    }
  };

  // Handle AI task suggestions
  const handleAITasksSelected = (tasks: Partial<Task>[]) => {
    const updatedEvent = { ...editedEvent };
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
      parentEventId: event.id,
      prepForEventId: event.id,
      prepForEventName: event.title,
    } as Task));
    
    updatedEvent.tasks = [...updatedEvent.tasks, ...newTasks];
    setEditedEvent(updatedEvent);
    
    toast.success(`Added ${newTasks.length} AI-generated tasks`);
  };

  // Handle save
  const handleSave = () => {
    if (!editedEvent) return;
    
    onSave(editedEvent);
    setIsEditing(false);
    
    toast.success('Event updated', {
      description: 'All team members have been notified',
    });
  };

  // Handle save as script
  const handleSaveAsScript = () => {
    if (!onSaveAsScript) return;
    
    onSaveAsScript(event);
    
    toast.success('Saved as script', {
      description: 'Script available in Scripts & Templates tab',
      icon: <BookTemplate className="w-4 h-4" />,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[1400px] w-[95vw] max-h-[90vh] bg-[#1a1d24] border-gray-800 text-white p-0 overflow-hidden !z-[100] flex flex-col !border-l-4 !border-l-teal-500">
          {/* Header - Fixed at top */}
          <DialogHeader className="p-6 pb-4 border-b border-gray-800 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {/* Type Identifier Badge */}
                  <Badge className="bg-teal-500/20 text-teal-300 border border-teal-500/50 px-2 py-1">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    EVENT
                  </Badge>
                  
                  {/* Completed/Past Badge */}
                  {isPastOrCompleted && (
                    <Badge className="bg-gray-500/20 text-gray-300 border border-gray-500/50 px-2 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      COMPLETED
                    </Badge>
                  )}

                  {/* Conflict Warning */}
                  {conflicts.length > 0 && (
                    <Badge className="bg-red-500/20 text-red-300 border border-red-500/50 px-2 py-1">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                      {conflicts.length} CONFLICT{conflicts.length > 1 ? 'S' : ''}
                    </Badge>
                  )}
                </div>
                
                {isEditing ? (
                  <Input
                    value={editedEvent.title}
                    onChange={e => setEditedEvent({ ...editedEvent, title: e.target.value })}
                    className="text-2xl mb-2 bg-[#2a2d35] border-gray-700 text-white"
                  />
                ) : (
                  <DialogTitle className="text-2xl text-white">{event.title}</DialogTitle>
                )}
                <DialogDescription className="sr-only">
                  {event.description || `Event details for ${event.title}`}
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
                
                {onSaveAsScript && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveAsScript}
                    className="gap-2"
                  >
                    <BookTemplate className="w-4 h-4" />
                    Save as Script
                  </Button>
                )}
                
                {/* PHASE 1.6: Mark Event as Complete */}
                {onCompleteEvent && !event.completed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onCompleteEvent(event.id);
                      onOpenChange(false);
                    }}
                    className="gap-2 border-teal-500/50 text-teal-400 hover:bg-teal-500/10 hover:border-teal-500"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Complete
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

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full justify-start rounded-none border-b border-gray-800 bg-transparent px-6">
              <TabsTrigger value="overview" className="data-[state=active]:bg-teal-600/20 data-[state=active]:text-teal-400">
                <Calendar className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
                <ListChecks className="w-4 h-4 mr-2" />
                Tasks ({completedTaskCount}/{taskCount})
              </TabsTrigger>
              <TabsTrigger value="team" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
                <Users className="w-4 h-4 mr-2" />
                Team ({event.teamMembers.length})
              </TabsTrigger>
              <TabsTrigger value="resources" className="data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-400">
                <Paperclip className="w-4 h-4 mr-2" />
                Resources ({resourceCount + linksNotesCount})
              </TabsTrigger>
              <TabsTrigger value="agenda" className="data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400">
                <Flag className="w-4 h-4 mr-2" />
                📋 Agenda
              </TabsTrigger>
            </TabsList>

            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">Description</h4>
                  {isEditing ? (
                    <Textarea
                      value={editedEvent.description || ''}
                      onChange={e => setEditedEvent({ ...editedEvent, description: e.target.value })}
                      placeholder="Add a description..."
                      rows={3}
                      className="bg-[#2a2d35] border-gray-700 text-white"
                    />
                  ) : (
                    <p className="text-gray-300">{event.description || 'No description'}</p>
                  )}
                </div>

                {/* Time & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Start Time
                    </h4>
                    {isEditing ? (
                      <Input
                        type="datetime-local"
                        value={new Date(editedEvent.startTime).toISOString().slice(0, 16)}
                        onChange={e => {
                          const newStartTime = new Date(e.target.value);
                          setEditedEvent({ ...editedEvent, startTime: newStartTime });
                        }}
                        className="bg-[#2a2d35] border-gray-700 text-white"
                      />
                    ) : (
                      <p className="text-gray-300">
                        {new Date(event.startTime).toLocaleString()}
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
                        value={new Date(editedEvent.endTime).toISOString().slice(0, 16)}
                        onChange={e => {
                          const newEndTime = new Date(e.target.value);
                          setEditedEvent({ ...editedEvent, endTime: newEndTime });
                        }}
                        className="bg-[#2a2d35] border-gray-700 text-white"
                      />
                    ) : (
                      <p className="text-gray-300">
                        {new Date(event.endTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                {event.location && (
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </h4>
                    {isEditing ? (
                      <Input
                        value={editedEvent.location || ''}
                        onChange={e => setEditedEvent({ ...editedEvent, location: e.target.value })}
                        className="bg-[#2a2d35] border-gray-700 text-white"
                      />
                    ) : (
                      <p className="text-gray-300">{event.location}</p>
                    )}
                  </div>
                )}

                {/* PHASE 1.6: Energy Reward Display */}
                {!event.completed && (
                  <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                          <h4 className="text-teal-400 font-semibold">Energy Reward</h4>
                          <p className="text-sm text-gray-400">Complete this event to earn energy</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-teal-400">+{getEventEnergyValue(0)}</p>
                        <p className="text-xs text-gray-500">energy points</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conflicts Warning */}
                {conflicts.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-red-400 font-semibold mb-2">Scheduling Conflicts Detected</h4>
                        <div className="space-y-2">
                          {conflicts.map((conflict, idx) => (
                            <p key={idx} className="text-sm text-red-300">
                              {formatConflictMessage(conflict)}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Event Permissions */}
                <div>
                  <h4 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Event Permissions
                  </h4>
                  <EventAdminManager
                    event={event}
                    currentUserId={currentUserId}
                    onUpdateEvent={(updated) => {
                      setEditedEvent(updated);
                      onSave(updated);
                    }}
                  />
                </div>
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="mt-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg text-white font-semibold">
                    Event Tasks ({completedTaskCount}/{taskCount})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAISuggestions(true)}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Suggestions
                  </Button>
                </div>

                {taskCount === 0 ? (
                  <div className="bg-[#1a1f2e] rounded-lg p-8 text-center">
                    <ListChecks className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">No tasks yet for this event</p>
                    <Button
                      variant="outline"
                      onClick={() => setShowAISuggestions(true)}
                      className="gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate AI Task Suggestions
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {event.tasks.map((task: Task) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="bg-[#1a1f2e] rounded-lg p-4"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggleTaskComplete(task.id)}
                              className="mt-0.5"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                              )}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`text-white ${task.completed ? 'line-through opacity-50' : ''}`}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                              )}
                              
                              {/* Milestones (Subtasks) - Enhanced UI */}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {task.subtasks.map((milestone: Task) => (
                                    <EnhancedMilestoneItem
                                      key={milestone.id}
                                      task={task}
                                      milestone={milestone}
                                      onToggleMilestone={handleToggleMilestone}
                                      onToggleStep={handleToggleStep}
                                      onAddStep={handleAddStep}
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Assigned Members */}
                              {task.assignedTo && task.assignedTo.length > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Users className="w-3 h-3 text-gray-500" />
                                  <div className="flex -space-x-2">
                                    {task.assignedTo.slice(0, 3).map((member: TeamMember) => (
                                      <AnimatedAvatar
                                        key={member.id}
                                        name={member.name}
                                        image={member.avatar}
                                        fallback={member.name[0]}
                                        size={24}
                                        className="border-2 border-[#1a1f2e]"
                                      />
                                    ))}
                                    {task.assignedTo.length > 3 && (
                                      <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-[#1a1f2e] flex items-center justify-center text-xs text-gray-300">
                                        +{task.assignedTo.length - 3}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="mt-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg text-white font-semibold">
                    Team Members ({event.teamMembers.length})
                  </h4>
                  {canEdit && (
                    <Button variant="outline" size="sm" className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      Add Member
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.teamMembers.map((member: TeamMember) => (
                    <div
                      key={member.id}
                      className="bg-[#1a1f2e] border border-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <AnimatedAvatar
                          name={member.name}
                          image={member.avatar}
                          fallback={member.name[0]}
                          progress={member.progress}
                          animationType={member.progress >= 80 ? 'glow' : member.progress >= 50 ? 'pulse' : 'heartbeat'}
                          size={48}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                          {member.progress !== undefined && (
                            <div className="flex items-center gap-2 mt-2">
                              <Progress value={member.progress} className="h-1.5 flex-1 bg-gray-700" />
                              <span className="text-xs text-gray-400 font-medium">{member.progress}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="mt-0 space-y-6">
                {/* Resources */}
                {resourceCount > 0 && (
                  <div>
                    <h4 className="text-lg text-white font-semibold mb-3 flex items-center gap-2">
                      <Paperclip className="w-5 h-5" />
                      Files & Documents ({resourceCount})
                    </h4>
                    <div className="space-y-2">
                      {event.resources.map((resource: Resource) => (
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
                )}

                {resourceCount > 0 && linksNotesCount > 0 && <Separator />}

                {/* Links & Notes */}
                {linksNotesCount > 0 && (
                  <div>
                    <h4 className="text-lg text-white font-semibold mb-3 flex items-center gap-2">
                      <LinkIcon className="w-5 h-5" />
                      Links & Notes ({linksNotesCount})
                    </h4>
                    <div className="space-y-2">
                      {event.linksNotes.map((linkNote: LinkNote) => (
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
                )}

                {resourceCount === 0 && linksNotesCount === 0 && (
                  <div className="bg-[#1a1f2e] rounded-lg p-8 text-center">
                    <Paperclip className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No resources attached yet</p>
                  </div>
                )}
              </TabsContent>

              {/* Agenda Tab */}
              <TabsContent value="agenda" className="mt-0 space-y-6">
                <EventAgendaTab
                  event={event}
                  allEvents={allEvents || []}
                  onUpdateEvents={(updatedEvents) => {
                    console.log('🎯 EventModal.onUpdateEvents called', {
                      updatedEventsCount: updatedEvents.length,
                      originalEventsCount: allEvents?.length,
                      hasOnBulkUpdate: !!onBulkUpdate,
                    });
                    
                    // CRITICAL FIX: Use onBulkUpdate to update ALL events (including new milestones/steps)
                    if (onBulkUpdate) {
                      onBulkUpdate(updatedEvents);
                      console.log('✅ Called onBulkUpdate with', updatedEvents.length, 'events');
                    }
                    
                    // Also update the parent event in the modal's local state
                    const updatedEvent = updatedEvents.find(e => e.id === event.id);
                    if (updatedEvent) {
                      setEditedEvent(updatedEvent);
                      onSave(updatedEvent);
                    }
                  }}
                  currentUserId={currentUserId}
                  canEdit={canEdit}
                />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* AI Task Suggestion Dialog */}
      {showAISuggestions && event && (
        <AITaskSuggestionDialog
          open={showAISuggestions}
          onOpenChange={setShowAISuggestions}
          event={event}
          onTasksSelected={handleAITasksSelected}
        />
      )}
    </>
  );
}