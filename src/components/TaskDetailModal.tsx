import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AnimatedAvatar } from './AnimatedAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { EnhancedMilestoneItem } from './EnhancedMilestoneItem';
import { CheckCircle2, Circle, Clock, Calendar, Tag, User, Activity, MessageSquare, X, Zap, Target, Link as LinkIcon, Paperclip, Plus, Trash2, Crown, Edit, MapPin, Cloud, CloudRain, CloudSnow, Sun, Users, Sparkles, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfileModal } from './UserProfileModal';
import { AddResourceDialog } from './AddResourceDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { AddMilestoneDialog } from './AddMilestoneDialog';
import { AddStepDialog } from './AddStepDialog';
import { AddUserToMilestoneDialog } from './AddUserToMilestoneDialog';
import { AddUserToStepDialog } from './AddUserToStepDialog';
import { SuggestMilestonesDialog } from './SuggestMilestonesDialog';
import { SuggestStepsDialog } from './SuggestStepsDialog';
import { TeamBadge } from './TeamBadge';
import { EnergyBadge } from './EnergyBadge';
import { toast } from 'sonner@2.0.3';
import { Input } from './ui/input';
// PHASE 1: Import unified permission system
import { usePermissions } from '../hooks/usePermissions';
import type { UserRole } from '../types/unified-types';
import { useAnalytics } from '../hooks/useAnalytics';
import { useEnergy } from '../hooks/useEnergy';
import { CURRENT_USER } from '../utils/user-constants';

interface TaskDetailModalProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: string;
    energyLevel: string;
    estimatedTime: string;
    progress: number;
    tags: string[];
    dueDate: string;
    aiSuggestion?: string | { day: string; time: string; reason: string };
    completed: boolean;
    location?: string;
    team?: {
      id: string;
      name: string;
      color?: string;
    };
    collaborators?: { 
      name: string;
      image: string;
      fallback: string;
      progress: number;
      animationType: 'glow' | 'pulse' | 'heartbeat' | 'bounce' | 'wiggle' | 'shake';
      status?: 'online' | 'away' | 'offline';
      role: 'creator' | 'admin' | 'collaborator';
    }[];
    subtasks?: { 
      id: string;
      title: string;
      completed: boolean;
      completedBy: string | null;
      completedAt: string | null;
      assignedTo?: { name: string; image: string; fallback: string }[];
      steps?: { 
        id: string; 
        title: string; 
        completed: boolean; 
        assignedTo: { name: string; image: string; fallback: string };
        resources?: { id: string; type: 'link' | 'file'; name: string; url?: string; fileName?: string; fileSize?: string; addedBy: string; addedAt: string }[];
      }[];
      resources?: { id: string; type: 'link' | 'file'; name: string; url?: string; fileName?: string; fileSize?: string; addedBy: string; addedAt: string }[];
    }[];
    activity?: { user: string; action: string; detail: string; time: string }[];
    resources?: { id: string; type: 'link' | 'file'; name: string; url?: string; fileName?: string; fileSize?: string; addedBy: string; addedAt: string }[];
    taskLeader?: string;
    currentUserRole?: 'creator' | 'admin' | 'collaborator';
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [expandedCollaborator, setExpandedCollaborator] = React.useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = React.useState<string | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = React.useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = React.useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = React.useState(false);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = React.useState(false);
  const [isAddStepOpen, setIsAddStepOpen] = React.useState(false);
  const [selectedMilestoneForStep, setSelectedMilestoneForStep] = React.useState<{ id: string; name: string; assignedTo?: { name: string; image: string; fallback: string }[] } | null>(null);
  const [resourceContext, setResourceContext] = React.useState<{ type: 'task' | 'milestone' | 'step'; id?: string; milestoneId?: string; name: string } | null>(null);
  const [taskResources, setTaskResources] = React.useState(task?.resources || []);
  const [milestoneResources, setMilestoneResources] = React.useState<Record<string, any[]>>({});
  const [stepResources, setStepResources] = React.useState<Record<string, any[]>>({});
  const [currentTask, setCurrentTask] = React.useState(task);
  const [milestones, setMilestones] = React.useState(task?.subtasks || []);
  const [isAddUserToMilestoneOpen, setIsAddUserToMilestoneOpen] = React.useState(false);
  const [selectedMilestoneForUser, setSelectedMilestoneForUser] = React.useState<{ id: string; name: string; assignedTo?: { name: string; image: string; fallback: string }[] } | null>(null);
  const [expandedStep, setExpandedStep] = React.useState<string | null>(null);
  const [isAddUserToStepOpen, setIsAddUserToStepOpen] = React.useState(false);
  const [selectedStepForUser, setSelectedStepForUser] = React.useState<{ id: string; milestoneId: string; name: string; assignedTo?: { name: string; image: string; fallback: string } } | null>(null);
  const [isSuggestMilestonesOpen, setIsSuggestMilestonesOpen] = React.useState(false);
  const [isSuggestStepsOpen, setIsSuggestStepsOpen] = React.useState(false);
  const [selectedMilestoneForSuggestSteps, setSelectedMilestoneForSuggestSteps] = React.useState<{ id: string; name: string } | null>(null);
  const [showAddStepForMilestone, setShowAddStepForMilestone] = React.useState<string | null>(null);
  const [newStepTitle, setNewStepTitle] = React.useState('');
  
  // PHASE 1: Initialize hooks
  const { track: trackAnalytics } = useAnalytics();
  const { energy } = useEnergy();
  const permissions = usePermissions();
  
  // Update state when task changes
  React.useEffect(() => {
    if (task) {
      setMilestones(task.subtasks || []);
      setTaskResources(task.resources || []);
      setCurrentTask(task);
      setActiveTab('overview'); // Reset to overview tab when task changes
    }
  }, [task]);
  
  const currentUser = 'Jordan Smith';

  // Handlers for EnhancedMilestoneItem
  const handleToggleMilestone = (taskId: string, milestoneId: string) => {
    setMilestones(prev => prev.map(milestone => {
      if (milestone.id === milestoneId) {
        // Check if there are incomplete steps
        const hasIncompleteSteps = milestone.steps && milestone.steps.some(step => !step.completed);
        
        if (!milestone.completed && hasIncompleteSteps) {
          // Warn user before completing milestone with incomplete steps
          const confirmed = window.confirm(
            `This milestone has ${milestone.steps.filter(s => !s.completed).length} incomplete step(s). Mark as complete anyway?`
          );
          if (!confirmed) return milestone;
        }
        
        const newCompleted = !milestone.completed;
        
        // ANALYTICS: Track milestone completion event with backend persistence
        trackAnalytics('task_milestone_completion_toggled', {
          task_id: taskId,
          milestone_id: milestoneId,
          was_completed: milestone.completed,
          new_completed: !milestone.completed,
          has_incomplete_steps: hasIncompleteSteps,
          user_role: currentUserRole,
          energy_level: energy.total,
          energy_color: energy.color
        }, CURRENT_USER.name);
        
        toast.success(newCompleted ? 'Milestone completed! 🎉' : 'Milestone reopened', {
          description: milestone.title,
        });
        
        return {
          ...milestone,
          completed: newCompleted,
          completedBy: newCompleted ? currentUser : null,
          completedAt: newCompleted ? new Date().toLocaleString() : null,
        };
      }
      return milestone;
    }));
  };

  const handleToggleStep = (taskId: string, milestoneId: string, stepId: string) => {
    setMilestones(prev => prev.map(milestone => {
      if (milestone.id === milestoneId && milestone.steps) {
        const step = milestone.steps.find(s => s.id === stepId);
        
        const updatedSteps = milestone.steps.map(step => {
          if (step.id === stepId) {
            return { ...step, completed: !step.completed };
          }
          return step;
        });
        
        // ANALYTICS: Track step completion event with backend persistence
        trackAnalytics('task_step_completion_toggled', {
          task_id: taskId,
          milestone_id: milestoneId,
          step_id: stepId,
          was_completed: step?.completed,
          new_completed: !step?.completed,
          user_role: currentUserRole,
          energy_level: energy.total,
          energy_color: energy.color
        }, CURRENT_USER.name);
        
        // Check if all steps are now complete
        const allStepsComplete = updatedSteps.every(s => s.completed);
        if (allStepsComplete && !milestone.completed) {
          toast.success('All steps complete!', {
            description: `Consider marking "${milestone.title}" as complete`,
            action: {
              label: 'Complete',
              onClick: () => handleToggleMilestone(taskId, milestoneId),
            },
          });
        }
        
        return { ...milestone, steps: updatedSteps };
      }
      return milestone;
    }));
  };

  const handleAddStep = (taskId: string, milestoneId: string, stepTitle: string) => {
    setMilestones(prev => prev.map(milestone => {
      if (milestone.id === milestoneId) {
        const newStep = {
          id: `step-${Date.now()}-${Math.random()}`,
          title: stepTitle,
          completed: false,
          assignedTo: { name: currentUser, image: '', fallback: currentUser[0] },
        };
        
        return {
          ...milestone,
          steps: [...(milestone.steps || []), newStep],
        };
      }
      return milestone;
    }));
  };
  
  // Helper function to format date in user-friendly way
  const formatDueDate = (dueDate: string): string => {
    try {
      const date = new Date(dueDate);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const diffTime = taskDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const time = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      // Today
      if (diffDays === 0) {
        return `Today at ${time}`;
      }
      // Tomorrow
      else if (diffDays === 1) {
        return `Tomorrow at ${time}`;
      }
      // Yesterday
      else if (diffDays === -1) {
        return `Yesterday at ${time}`;
      }
      // Within this week
      else if (diffDays > 1 && diffDays <= 7) {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        return `${dayName} at ${time}`;
      }
      // Same year
      else if (date.getFullYear() === now.getFullYear()) {
        const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${monthDay} at ${time}`;
      }
      // Different year
      else {
        const fullDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${fullDate} at ${time}`;
      }
    } catch (error) {
      return dueDate;
    }
  };
  
  // Helper function to get simulated weather for location
  const getWeatherForLocation = (location: string): { temp: string | null; condition: string; icon: any } | null => {
    if (!location) return null;
    
    // Simulate weather based on location (in real app, would call weather API)
    const locationWeather: Record<string, { temp: string | null; condition: string; icon: any }> = {
      'Product Team Room': { temp: '72°F', condition: 'Indoor', icon: null },
      'Conference Room B': { temp: '70°F', condition: 'Indoor', icon: null },
      'Downtown Office - Floor 8': { temp: '68°F', condition: 'Indoor', icon: null },
      'Zoom': { temp: null, condition: 'Virtual', icon: null },
      "Gold's Gym": { temp: '65°F', condition: 'Indoor', icon: null },
    };
    
    // Check if it's an outdoor location or has weather relevance
    const outdoor = location.toLowerCase().includes('outdoor') || 
                   location.toLowerCase().includes('park') ||
                   location.toLowerCase().includes('street');
    
    if (outdoor) {
      return { temp: '68°F', condition: 'Sunny', icon: Sun };
    }
    
    return locationWeather[location] || null;
  };
  
  if (!task) return null;
  
  // PHASE 1: Define permissions based on user role
  const currentUserRole = (task.currentUserRole || 'viewer') as UserRole;
  const canEdit = permissions.canEdit(currentUserRole);
  const canDelete = permissions.canDelete(currentUserRole);
  const canManageMilestones = permissions.canManageMilestones(currentUserRole);
  const canDeleteResources = permissions.canManageCollaborators(currentUserRole); // Admins can manage resources
  const isCreatorOrAdmin = permissions.isCreatorOrAdmin(currentUserRole);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-500/50 bg-red-500/10';
      case 'medium': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
      case 'low': return 'text-green-400 border-green-500/50 bg-green-500/10';
      default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
    }
  };

  const getEnergyColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-purple-400';
      case 'medium': return 'text-blue-400';
      case 'low': return 'text-teal-400';
      default: return 'text-gray-400';
    }
  };

  const completedMilestones = milestones?.filter(st => st.completed).length || 0;
  const totalMilestones = milestones?.length || 0;
  const taskProgress = totalMilestones === 0 ? 100 : Math.round((completedMilestones / totalMilestones) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1400px] w-[95vw] max-h-[90vh] bg-[#1a1d24] border-gray-800 text-white p-0 overflow-hidden !z-[100] !border-l-4 !border-l-blue-500 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-gray-800 shrink-0">
          <DialogTitle className="sr-only">{task.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {task.description || `Task details for ${task.title}`}
          </DialogDescription>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {/* Type Identifier Badge */}
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/50 px-2 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  TASK
                </Badge>
                <h2 className="text-2xl text-white">{task.title}</h2>
                {task.team && <TeamBadge team={task.team} />}
                {isCreatorOrAdmin && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-yellow-400">{currentUserRole === 'creator' ? 'Creator' : 'Admin'}</span>
                  </div>
                )}
              </div>
              {task.description && (
                <p className="text-gray-400 text-sm">{task.description}</p>
              )}
            </div>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2 hover:bg-gray-800"
                onClick={() => setIsEditTaskOpen(true)}
              >
                <Edit className="w-4 h-4" />
                Edit Task
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b border-gray-800 bg-transparent px-6 shrink-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="milestones" className="data-[state=active]:bg-teal-600/20 data-[state=active]:text-teal-400">
              <Target className="w-4 h-4 mr-2" />
              Milestones ({completedMilestones}/{totalMilestones})
            </TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-400">
              <Paperclip className="w-4 h-4 mr-2" />
              Resources ({taskResources.length})
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
              <Users className="w-4 h-4 mr-2" />
              Team ({task.collaborators?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400">
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Task Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-2">Priority</div>
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Badge>
                </div>
                <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-2">Energy Level</div>
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${getEnergyColor(task.energyLevel)}`} />
                    <span className={getEnergyColor(task.energyLevel)}>
                      {task.energyLevel.charAt(0).toUpperCase() + task.energyLevel.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-2">Estimated Time</div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-white">{task.estimatedTime}</span>
                  </div>
                </div>
                <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-2">Due Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm">{formatDueDate(task.dueDate)}</span>
                  </div>
                </div>
              </div>

              {/* Location & Weather */}
              {task.location && (
                <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">{task.location}</span>
                    {(() => {
                      const weather = getWeatherForLocation(task.location);
                      if (weather && weather.temp) {
                        return (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            {weather.icon && <weather.icon className="w-4 h-4" />}
                            <span>{weather.temp}</span>
                            {weather.condition !== 'Indoor' && weather.condition !== 'Virtual' && (
                              <span className="text-xs">• {weather.condition}</span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggestion */}
              {task.aiSuggestion && (
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="text-sm text-purple-400 mb-1 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    AI Suggestion
                  </div>
                  <p className="text-sm text-gray-300">
                    {typeof task.aiSuggestion === 'string' 
                      ? task.aiSuggestion 
                      : `${task.aiSuggestion.day} at ${task.aiSuggestion.time} - ${task.aiSuggestion.reason}`
                    }
                  </p>
                </div>
              )}

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Overall Progress</div>
                  <div className="text-sm text-teal-400">{taskProgress}%</div>
                </div>
                <Progress value={taskProgress} className="h-2" />
              </div>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="mt-0 space-y-6">
              {/* Task Resources */}
              <div>
                <div className="text-sm text-gray-400 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Resources ({taskResources.length})
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 text-xs hover:bg-gray-800"
                    onClick={() => {
                      setResourceContext({ type: 'task', name: task.title });
                      setIsAddResourceOpen(true);
                    }}
                  >
                    <Plus className="w-3 h-3" />
                    Add Resource
                  </Button>
                </div>
                {taskResources.length > 0 ? (
                  <div className="space-y-2">
                    {taskResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="bg-[#2a2d35] border border-gray-800 rounded-lg p-3 hover:bg-[#32353d] transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            resource.type === 'link' ? 'bg-blue-500/10' : 'bg-teal-500/10'
                          }`}>
                            {resource.type === 'link' ? (
                              <LinkIcon className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Paperclip className="w-4 h-4 text-teal-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-white hover:text-blue-400 transition-colors block truncate"
                            >
                              {resource.name}
                            </a>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">Added by {resource.addedBy}</span>
                              <span className="text-xs text-gray-600">•</span>
                              <span className="text-xs text-gray-500">{resource.addedAt}</span>
                              {resource.fileSize && (
                                <>
                                  <span className="text-xs text-gray-600">•</span>
                                  <span className="text-xs text-gray-500">{resource.fileSize}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {canDeleteResources && (
                            <button
                              onClick={() => {
                                setTaskResources(taskResources.filter(r => r.id !== resource.id));
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-6 text-center">
                    <Paperclip className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No resources added yet</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Milestones Tab */}
            <TabsContent value="milestones" className="mt-0 space-y-6">
              {milestones && milestones.length >= 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Milestones
                      <span className="text-teal-400 text-xs">
                        ({completedMilestones}/{totalMilestones} completed)
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      {canManageMilestones && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1.5 text-xs hover:bg-gray-800"
                            onClick={() => setIsAddMilestoneOpen(true)}
                          >
                            <Plus className="w-3 h-3" />
                            Add Milestone
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1.5 text-xs hover:bg-gray-800 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                            onClick={() => setIsSuggestMilestonesOpen(true)}
                          >
                            <Plus className="w-3 h-3" />
                            Suggest Milestones
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {milestones.length > 0 ? (
                    <div className="space-y-2">
                      {milestones.map((milestone) => {
                        const isExpanded = expandedMilestone === milestone.id;
                        const completedSteps = milestone.steps?.filter(s => s.completed).length || 0;
                        const totalSteps = milestone.steps?.length || 0;
                        const isInProgress = !milestone.completed && completedSteps > 0;
                        
                        // Calculate total resources for this milestone (milestone resources + step resources)
                        let totalMilestoneResources = 0;
                        const milestoneResourcesList = milestoneResources[milestone.id] || milestone.resources || [];
                        totalMilestoneResources += milestoneResourcesList.length;
                        
                        // Add step resources to the count
                        if (milestone.steps) {
                          milestone.steps.forEach(step => {
                            const stepResourcesList = stepResources[step.id] || step.resources || [];
                            totalMilestoneResources += stepResourcesList.length;
                          });
                        }

                        return (
                          <motion.div
                            key={milestone.id}
                            className="bg-[#2a2d35] border border-gray-800 rounded-lg overflow-hidden"
                          >
                            <div 
                              className="p-4 cursor-pointer hover:bg-[#32353d] transition-colors"
                              onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                            >
                              <div className="flex items-start gap-3 group/milestone">
                                {/* Clickable Milestone Checkbox */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleMilestone(task.id, milestone.id);
                                  }}
                                  className="shrink-0 hover:scale-110 transition-all mt-0.5 relative group/checkbox"
                                  title={milestone.completed ? 'Mark as incomplete' : 'Mark as complete'}
                                >
                                  {milestone.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-teal-400" />
                                  ) : (
                                    <>
                                      <Circle className={`w-5 h-5 ${isInProgress ? 'text-blue-400' : 'text-gray-400'} group-hover/checkbox:text-teal-400 transition-colors`} />
                                      <div className="absolute inset-0 rounded-full bg-teal-500/0 group-hover/checkbox:bg-teal-500/10 transition-colors" />
                                      {isInProgress && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-3 mb-1">
                                    <div className="flex items-center gap-2 flex-1">
                                      <div className={`text-sm ${milestone.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                                        {milestone.title}
                                      </div>
                                      {!milestone.completed && (
                                        <EnergyBadge amount={50} />
                                      )}
                                      {/* Resource count badge */}
                                      {totalMilestoneResources > 0 && (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded">
                                          <Paperclip className="w-3 h-3 text-blue-400" />
                                          <span className="text-xs text-blue-400">{totalMilestoneResources}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {milestone.assignedTo && milestone.assignedTo.length > 0 && (
                                        <div className="flex items-center gap-1">
                                          {currentUserRole === 'creator' && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMilestoneForUser({ id: milestone.id, name: milestone.title, assignedTo: milestone.assignedTo });
                                                setIsAddUserToMilestoneOpen(true);
                                              }}
                                              className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center hover:bg-teal-500/30 transition-all opacity-0 group-hover/milestone:opacity-100"
                                              title="Add user to milestone"
                                            >
                                              <Plus className="w-3.5 h-3.5 text-teal-400" />
                                            </button>
                                          )}
                                          <div className="flex items-center -space-x-2">
                                            {milestone.assignedTo.map((user, idx) => (
                                              <img
                                                key={idx}
                                                src={user.image}
                                                alt={user.name}
                                                title={user.name}
                                                className="w-6 h-6 rounded-full object-cover border-2 border-[#2a2d35]"
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {/* Complete Button for Milestone */}
                                      {!milestone.completed && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="opacity-0 group-hover/milestone:opacity-100 transition-opacity h-7 px-3 text-xs bg-teal-500/10 border-teal-500/50 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleMilestone(task.id, milestone.id);
                                          }}
                                        >
                                          <Check className="w-3.5 h-3.5 mr-1" />
                                          Complete
                                        </Button>
                                      )}
                                      {/* Add Step Button */}
                                      {!milestone.completed && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="opacity-0 group-hover/milestone:opacity-100 transition-opacity h-7 px-2 text-xs text-gray-400 hover:text-teal-300 hover:bg-teal-500/10"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAddStepForMilestone(showAddStepForMilestone === milestone.id ? null : milestone.id);
                                            setNewStepTitle('');
                                          }}
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          Step
                                        </Button>
                                      )}
                                      {currentUserRole === 'creator' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete milestone "${milestone.title}"?`)) {
                                              setMilestones(milestones.filter(m => m.id !== milestone.id));
                                            }
                                          }}
                                          className="p-1.5 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover/milestone:opacity-100"
                                          title="Delete milestone (Creator only)"
                                        >
                                          <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                      )}
                                      <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </motion.div>
                                    </div>
                                  </div>
                                  {milestone.completed && milestone.completedBy && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      Completed by {milestone.completedBy} • {milestone.completedAt}
                                    </div>
                                  )}
                                  {isInProgress && (
                                    <div className="mt-2">
                                      <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-blue-400">In Progress</span>
                                        <span className="text-blue-400">{completedSteps}/{totalSteps} steps</span>
                                      </div>
                                      <Progress value={(completedSteps / totalSteps) * 100} className="h-1.5" />
                                    </div>
                                  )}
                                  {!milestone.completed && !isInProgress && milestone.assignedTo && milestone.assignedTo.length > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      Assigned to {milestone.assignedTo.map(u => u.name).join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Add Step Input */}
                            {showAddStepForMilestone === milestone.id && (
                              <div className="px-4 pb-3 border-t border-gray-700/50 pt-3">
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={newStepTitle}
                                    onChange={(e) => setNewStepTitle(e.target.value)}
                                    placeholder="Enter step title..."
                                    className="flex-1 h-7 text-xs bg-gray-800/50 border-gray-700 focus:border-teal-500"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && newStepTitle.trim()) {
                                        handleAddStep(task.id, milestone.id, newStepTitle);
                                        setNewStepTitle('');
                                        setShowAddStepForMilestone(null);
                                      } else if (e.key === 'Escape') {
                                        setShowAddStepForMilestone(null);
                                        setNewStepTitle('');
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
                                    onClick={() => {
                                      if (newStepTitle.trim()) {
                                        handleAddStep(task.id, milestone.id, newStepTitle);
                                        setNewStepTitle('');
                                        setShowAddStepForMilestone(null);
                                      }
                                    }}
                                  >
                                    Add
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
                                    onClick={() => {
                                      setShowAddStepForMilestone(null);
                                      setNewStepTitle('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            <motion.div
                              initial={false}
                              animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 border-t border-gray-700/50 pt-3">
                                {milestone.steps && milestone.steps.length > 0 ? (
                                  <div className="space-y-2 mb-3">
                                    {(() => {
                                      // Check if all steps have the same single assignee
                                      const uniqueAssignees = new Set(
                                        milestone.steps
                                          .filter(s => s.assignedTo)
                                          .map(s => s.assignedTo?.name)
                                      );
                                      const hasSingleAssignee = uniqueAssignees.size === 1 && milestone.steps.every(s => s.assignedTo);
                                      
                                      return milestone.steps.map((step) => {
                                        const isStepExpanded = expandedStep === step.id;
                                        const stepResourcesList = stepResources[step.id] || step.resources || [];
                                      return (
                                        <div key={step.id} className="bg-[#1a1d24] rounded overflow-hidden">
                                          <div 
                                            className="flex items-center gap-2 text-xs group/step p-2 cursor-pointer hover:bg-[#22252d] transition-colors"
                                            onClick={() => setExpandedStep(isStepExpanded ? null : step.id)}
                                          >
                                            {/* Clickable Step Checkbox */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStep(task.id, milestone.id, step.id);
                                              }}
                                              className="shrink-0 hover:scale-110 transition-all relative group/stepcheckbox"
                                              title={step.completed ? 'Mark as incomplete' : 'Mark as complete'}
                                            >
                                              {step.completed ? (
                                                <CheckCircle2 className="w-4 h-4 text-teal-400/80" />
                                              ) : (
                                                <>
                                                  <Circle className="w-4 h-4 text-gray-400 group-hover/stepcheckbox:text-teal-400 transition-colors" />
                                                  <div className="absolute inset-0 rounded-full bg-teal-500/0 group-hover/stepcheckbox:bg-teal-500/10 transition-colors" />
                                                </>
                                              )}
                                            </button>
                                            <span className={`${step.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                              {step.title}
                                            </span>
                                            {!step.completed && (
                                              <EnergyBadge amount={5} />
                                            )}
                                            {stepResourcesList.length > 0 && (
                                              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded">
                                                <Paperclip className="w-3 h-3 text-blue-400" />
                                                <span className="text-xs text-blue-400">{stepResourcesList.length}</span>
                                              </div>
                                            )}
                                            <div className="flex-1" />
                                            {!hasSingleAssignee && step.assignedTo && (
                                              <img
                                                src={step.assignedTo.image}
                                                alt={step.assignedTo.name}
                                                title={step.assignedTo.name}
                                                className="w-6 h-6 rounded-full object-cover border border-gray-700"
                                              />
                                            )}
                                            {!hasSingleAssignee && !step.assignedTo && (
                                              <span className="text-gray-500 text-xs">Unassigned</span>
                                            )}
                                            {/* Complete Button for Step */}
                                            {!step.completed && (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="opacity-0 group-hover/step:opacity-100 transition-opacity h-6 px-2 text-[10px] bg-teal-500/10 border-teal-500/50 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleToggleStep(task.id, milestone.id, step.id);
                                                }}
                                              >
                                                <Check className="w-3 h-3 mr-0.5" />
                                                Complete
                                              </Button>
                                            )}
                                            {canEdit && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (confirm(`Delete step "${step.title}"?`)) {
                                                    setMilestones(milestones.map(m => {
                                                      if (m.id === milestone.id) {
                                                        return {
                                                          ...m,
                                                          steps: (m.steps || []).filter(s => s.id !== step.id)
                                                        };
                                                      }
                                                      return m;
                                                    }));
                                                  }
                                                }}
                                                className="opacity-0 group-hover/step:opacity-100 transition-opacity p-0.5 hover:bg-red-500/10 rounded"
                                                title="Delete step"
                                              >
                                                <Trash2 className="w-3 h-3 text-red-400" />
                                              </button>
                                            )}
                                            {currentUserRole === 'creator' && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedStepForUser({ id: step.id, milestoneId: milestone.id, name: step.title, assignedTo: step.assignedTo });
                                                  setIsAddUserToStepOpen(true);
                                                }}
                                                className="opacity-0 group-hover/step:opacity-100 transition-opacity p-0.5 hover:bg-teal-500/10 rounded"
                                                title="Add user to step"
                                              >
                                                <Plus className="w-3 h-3 text-teal-400" />
                                              </button>
                                            )}
                                            <motion.div
                                              animate={{ rotate: isStepExpanded ? 180 : 0 }}
                                              transition={{ duration: 0.2 }}
                                            >
                                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                              </svg>
                                            </motion.div>
                                          </div>
                                          
                                          {/* Step Expanded Content - Resources */}
                                          <motion.div
                                            initial={false}
                                            animate={{ height: isStepExpanded ? 'auto' : 0, opacity: isStepExpanded ? 1 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="px-3 pb-2 pt-1 border-t border-gray-700/30">
                                              {stepResourcesList.length > 0 ? (
                                                <div className="space-y-1 mb-2">
                                                  {stepResourcesList.map((resource) => (
                                                    <div
                                                      key={resource.id}
                                                      className="flex items-start gap-2 p-2 bg-[#2a2d35] rounded hover:bg-[#32353d] transition-colors group/resource"
                                                    >
                                                      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                                                        resource.type === 'link' ? 'bg-blue-500/10' : 'bg-teal-500/10'
                                                      }`}>
                                                        {resource.type === 'link' ? (
                                                          <LinkIcon className="w-3 h-3 text-blue-400" />
                                                        ) : (
                                                          <Paperclip className="w-3 h-3 text-teal-400" />
                                                        )}
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <a
                                                          href={resource.url}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="text-xs text-white hover:text-blue-400 transition-colors block truncate"
                                                        >
                                                          {resource.name}
                                                        </a>
                                                        <div className="text-xs text-gray-500 truncate">
                                                          {resource.addedBy} • {resource.addedAt}
                                                        </div>
                                                      </div>
                                                      {canDeleteResources && (
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setStepResources({
                                                              ...stepResources,
                                                              [step.id]: stepResourcesList.filter(r => r.id !== resource.id)
                                                            });
                                                          }}
                                                          className="opacity-0 group-hover/resource:opacity-100 transition-opacity p-0.5 hover:bg-red-500/10 rounded"
                                                        >
                                                          <Trash2 className="w-3 h-3 text-red-400" />
                                                        </button>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="text-xs text-gray-500 text-center py-2 mb-2">
                                                  No resources yet
                                                </div>
                                              )}
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 gap-1 text-xs w-full hover:bg-gray-800"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setResourceContext({ type: 'step', id: step.id, milestoneId: milestone.id, name: step.title });
                                                  setIsAddResourceOpen(true);
                                                }}
                                              >
                                                <Plus className="w-3 h-3" />
                                                Add Resource
                                              </Button>
                                            </div>
                                          </motion.div>
                                        </div>
                                      );
                                      });
                                    })()}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-500 text-center py-3 mb-3">
                                    No steps yet. Add your first step below.
                                  </div>
                                )}
                                
                                {/* Milestone Resources Section */}
                                {milestoneResourcesList.length > 0 && (
                                  <div className="mb-3">
                                    <div className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                                      <Paperclip className="w-3 h-3" />
                                      Milestone Resources ({milestoneResourcesList.length})
                                    </div>
                                    <div className="space-y-1">
                                      {milestoneResourcesList.map((resource) => (
                                        <div
                                          key={resource.id}
                                          className="flex items-start gap-2 p-2 bg-[#1a1d24] rounded hover:bg-[#22252d] transition-colors group/resource">
                                          <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                                            resource.type === 'link' ? 'bg-blue-500/10' : 'bg-teal-500/10'
                                          }`}>
                                            {resource.type === 'link' ? (
                                              <LinkIcon className="w-3 h-3 text-blue-400" />
                                            ) : (
                                              <Paperclip className="w-3 h-3 text-teal-400" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <a
                                              href={resource.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-white hover:text-blue-400 transition-colors block truncate"
                                            >
                                              {resource.name}
                                            </a>
                                            <div className="text-xs text-gray-500 truncate">
                                              {resource.addedBy} • {resource.addedAt}
                                            </div>
                                          </div>
                                          {canDeleteResources && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setMilestoneResources({
                                                  ...milestoneResources,
                                                  [milestone.id]: milestoneResourcesList.filter(r => r.id !== resource.id)
                                                });
                                              }}
                                              className="opacity-0 group-hover/resource:opacity-100 transition-opacity p-0.5 hover:bg-red-500/10 rounded"
                                            >
                                              <Trash2 className="w-3 h-3 text-red-400" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="space-y-2">
                                  {canManageMilestones && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 gap-1 text-xs hover:bg-gray-800"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedMilestoneForStep({ id: milestone.id, name: milestone.title, assignedTo: milestone.assignedTo });
                                          setIsAddStepOpen(true);
                                        }}
                                      >
                                        <Plus className="w-3 h-3" />
                                        Add Step
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 gap-1 text-xs hover:bg-gray-800 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedMilestoneForSuggestSteps({ id: milestone.id, name: milestone.title });
                                          setIsSuggestStepsOpen(true);
                                        }}
                                      >
                                        <Plus className="w-3 h-3" />
                                        Suggest Step
                                      </Button>
                                    </div>
                                  )}
                                  {canEdit && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 gap-1 text-xs w-full hover:bg-gray-800 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setResourceContext({ type: 'milestone', id: milestone.id, name: milestone.title });
                                        setIsAddResourceOpen(true);
                                      }}
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      Add Resource to Milestone
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-6 text-center">
                      <Target className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No milestones yet</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="mt-0 space-y-6">
              {task.collaborators && task.collaborators.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Collaborators ({task.collaborators.length})
                  </div>
                  <div className="space-y-3">
                    {task.collaborators.map((collab, idx) => {
                      const isExpanded = expandedCollaborator === collab.name;
                      
                      // Calculate completed milestones and steps for this collaborator
                      const completedItems = milestones?.filter(m => 
                        m.completed && m.completedBy === collab.name
                      ) || [];
                      
                      const completedSteps = milestones?.flatMap(m => 
                        m.steps?.filter(s => s.completed && s.assignedTo?.name === collab.name) || []
                      ) || [];
                      
                      return (
                        <div key={idx} className="bg-[#2a2d35] border border-gray-800 rounded-lg overflow-hidden">
                          <div 
                            className="p-4 cursor-pointer hover:bg-[#32353d] transition-colors"
                            onClick={() => setExpandedCollaborator(isExpanded ? null : collab.name)}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUser(collab);
                                  setIsUserProfileOpen(true);
                                }}
                                className="cursor-pointer relative"
                              >
                                <AnimatedAvatar
                                  name={collab.name}
                                  image={collab.image}
                                  fallback={collab.fallback}
                                  size={48}
                                  progress={collab.progress}
                                  animationType={collab.animationType}
                                />
                                {/* Online Status Indicator */}
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1d24] ${
                                  collab.status === 'online' ? 'bg-green-400' :
                                  collab.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                                }`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm text-white">{collab.name}</div>
                                  {collab.role === 'creator' && (
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded">
                                      <Crown className="w-3 h-3 text-yellow-400" />
                                      <span className="text-xs text-yellow-400">Creator</span>
                                    </div>
                                  )}
                                  {collab.role === 'admin' && (
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded">
                                      <Crown className="w-3 h-3 text-blue-400" />
                                      <span className="text-xs text-blue-400">Admin</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="text-xs text-gray-400">
                                    {completedItems.length} milestones • {completedSteps.length} steps
                                  </div>
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </motion.div>
                                </div>
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-gray-400">Progress</span>
                                    <span className="text-teal-400">{collab.progress}%</span>
                                  </div>
                                  <Progress value={collab.progress} className="h-1.5" />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Expanded Collaborator Details */}
                          <motion.div
                            initial={false}
                            animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-gray-700/50 pt-3">
                              {completedItems.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-xs text-gray-400 mb-2">Completed Milestones</div>
                                  <div className="space-y-1">
                                    {completedItems.map((item) => (
                                      <div key={item.id} className="flex items-start gap-2 text-xs">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="text-gray-300">{item.title}</div>
                                          {item.completedAt && (
                                            <div className="text-gray-500">{item.completedAt}</div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {completedSteps.length > 0 && (
                                <div>
                                  <div className="text-xs text-gray-400 mb-2">Completed Steps</div>
                                  <div className="space-y-1">
                                    {completedSteps.map((step) => (
                                      <div key={step.id} className="flex items-start gap-2 text-xs">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                                        <div className="text-gray-300">{step.title}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {completedItems.length === 0 && completedSteps.length === 0 && (
                                <div className="text-xs text-gray-500 text-center py-2">
                                  No completed items yet
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
              
            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-0 space-y-6">
              {task.activity && task.activity.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Recent Activity
                  </div>
                  <div className="bg-[#2a2d35] border border-gray-800 rounded-lg divide-y divide-gray-800">
                    {task.activity.map((item, idx) => (
                      <div key={idx} className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white">
                              <span className="text-teal-400">{item.user}</span> {item.action}
                            </div>
                            {item.detail && (
                              <div className="text-xs text-gray-400 mt-0.5">{item.detail}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">{item.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-6 pt-4 border-t border-gray-800 shrink-0 bg-[#1a1d24]">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600"
              onClick={() => onOpenChange(false)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </Button>
          </div>
        </div>
      </DialogContent>

      <UserProfileModal
        user={selectedUser}
        open={isUserProfileOpen}
        onOpenChange={setIsUserProfileOpen}
        canEdit={currentUserRole === 'creator' || currentUserRole === 'admin'}
        onUpdateCustomTitle={(title) => {
          // In a real app, this would update the backend
          console.log('Updated custom title to:', title);
        }}
      />

      <AddResourceDialog
        open={isAddResourceOpen}
        onOpenChange={setIsAddResourceOpen}
        context={resourceContext}
        taskResources={taskResources}
        setTaskResources={setTaskResources}
        milestoneResources={milestoneResources}
        setMilestoneResources={setMilestoneResources}
        stepResources={stepResources}
        setStepResources={setStepResources}
        isTaskLeader={isCreatorOrAdmin}
      />

      <EditTaskDialog
        open={isEditTaskOpen}
        onOpenChange={setIsEditTaskOpen}
        task={task}
        onSave={(updatedTask) => {
          console.log('Task updated:', updatedTask);
          setCurrentTask(updatedTask);
        }}
      />

      <AddMilestoneDialog
        open={isAddMilestoneOpen}
        onOpenChange={setIsAddMilestoneOpen}
        onAdd={(newMilestone) => {
          setMilestones([...milestones, newMilestone]);
        }}
        availableUsers={task?.collaborators?.map(c => ({ 
          name: c.name, 
          image: c.image, 
          fallback: c.fallback 
        })) || []}
      />

      <AddStepDialog
        open={isAddStepOpen}
        onOpenChange={setIsAddStepOpen}
        onAdd={(newStep) => {
          setMilestones(milestones.map(milestone => {
            if (milestone.id === selectedMilestoneForStep?.id) {
              return {
                ...milestone,
                steps: [...(milestone.steps || []), newStep]
              };
            }
            return milestone;
          }));
        }}
        availableUsers={selectedMilestoneForStep?.assignedTo || []}
        milestoneName={selectedMilestoneForStep?.name || ''}
      />

      <AddUserToMilestoneDialog
        open={isAddUserToMilestoneOpen}
        onOpenChange={setIsAddUserToMilestoneOpen}
        onAdd={(user) => {
          setMilestones(milestones.map(milestone => {
            if (milestone.id === selectedMilestoneForUser?.id) {
              return {
                ...milestone,
                assignedTo: [...(milestone.assignedTo || []), user]
              };
            }
            return milestone;
          }));
        }}
        availableUsers={
          (task?.collaborators || [])
            .map(c => ({ name: c.name, image: c.image, fallback: c.fallback }))
            .filter(user => !selectedMilestoneForUser?.assignedTo?.some(assignedUser => assignedUser.name === user.name))
        }
        milestoneName={selectedMilestoneForUser?.name || ''}
      />

      <AddUserToStepDialog
        open={isAddUserToStepOpen}
        onOpenChange={setIsAddUserToStepOpen}
        onAdd={(user) => {
          setMilestones(milestones.map(milestone => {
            if (milestone.id === selectedStepForUser?.milestoneId) {
              return {
                ...milestone,
                steps: milestone.steps?.map(step => {
                  if (step.id === selectedStepForUser?.id) {
                    return {
                      ...step,
                      assignedTo: user
                    };
                  }
                  return step;
                })
              };
            }
            return milestone;
          }));
        }}
        availableUsers={
          (task?.collaborators || [])
            .map(c => ({ name: c.name, image: c.image, fallback: c.fallback }))
            .filter(user => user.name !== selectedStepForUser?.assignedTo?.name)
        }
        stepName={selectedStepForUser?.name || ''}
      />

      <SuggestMilestonesDialog
        open={isSuggestMilestonesOpen}
        onOpenChange={setIsSuggestMilestonesOpen}
        taskName={task?.title || ''}
        existingMilestones={milestones}
        onAdd={(selectedMilestones) => {
          setMilestones([...milestones, ...selectedMilestones]);
        }}
      />

      <SuggestStepsDialog
        open={isSuggestStepsOpen}
        onOpenChange={setIsSuggestStepsOpen}
        milestoneName={selectedMilestoneForSuggestSteps?.name || ''}
        existingSteps={milestones.find(m => m.id === selectedMilestoneForSuggestSteps?.id)?.steps || []}
        onAdd={(selectedSteps) => {
          setMilestones(milestones.map(milestone => {
            if (milestone.id === selectedMilestoneForSuggestSteps?.id) {
              return {
                ...milestone,
                steps: [...(milestone.steps || []), ...selectedSteps]
              };
            }
            return milestone;
          }));
        }}
      />
    </Dialog>
  );
}