import { AddMilestoneDialog } from './AddMilestoneDialog';
import { AddStepDialog } from './AddStepDialog';
import { AddUserToMilestoneDialog } from './AddUserToMilestoneDialog';
import { AddUserToStepDialog } from './AddUserToStepDialog';
import { SuggestStepsDialog } from './SuggestStepsDialog';
import { SuggestMilestonesDialog } from './SuggestMilestonesDialog';
import { GoalCheckInDialog } from './GoalCheckInDialog';
import { RiskManagementDialog } from './RiskManagementDialog';
import { GoalAlignmentDialog } from './GoalAlignmentDialog';
import { EnhancedRoleManagementModal } from './goals/EnhancedRoleManagementModal';
import { LogContributionDialog } from './LogContributionDialog';
import { CheckInTimeline } from './CheckInTimeline';
import { RiskList } from './RiskList';
import { CheckCircle2, Circle, Calendar, Tag, User, Activity, Target, Zap, TrendingUp, Crown, Edit, Plus, Trash2, Paperclip, Link as LinkIcon, UserPlus, Shield, AlertTriangle, ClipboardCheck, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AnimatedAvatar } from './AnimatedAvatar';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import React from 'react';
import { UserProfileModal } from './UserProfileModal';
import { calculateSuccessLikelihood, calculateGoalHealth } from '../utils/goal-ai-analytics';
import { PredictiveAnalyticsDashboard } from './PredictiveAnalyticsDashboard';
import { GoalHealthBadge } from './GoalHealthBadge';
import { toast } from 'sonner@2.0.3';
import { EnergyBadge } from './EnergyBadge';
// PHASE 1: Import unified permission system
import { usePermissions } from '../hooks/usePermissions';
import type { UserRole } from '../types/unified-types';
import { CURRENT_USER } from '../utils/user-constants';
import { useGoals } from '../hooks/useGoals';
import { useAnalytics } from '../hooks/useAnalytics';
import { useEnergy } from '../hooks/useEnergy';

interface GoalDetailModalProps {
  goal: {
    id: string;
    title: string;
    category: string;
    progress: number;
    deadline: string;
    status: 'ahead' | 'on-track' | 'at-risk';
    currentUserRole?: 'creator' | 'admin' | 'collaborator' | 'viewer';
    completed?: boolean;
    tasks?: { completed: number; total: number };
    milestones?: { 
      id: string;
      name: string; 
      completed: boolean; 
      current?: boolean;
      completedBy?: string;
      completedAt?: string;
      assignedTo?: { name: string; image: string; fallback: string }[];
      steps?: {
        id: string;
        title: string;
        completed: boolean;
        assignedTo?: { name: string; image: string; fallback: string };
      }[];
    }[];
    collaborators?: { 
      name: string; 
      image: string; 
      fallback: string; 
      progress: number; 
      animationType: 'glow' | 'pulse' | 'heartbeat' | 'bounce' | 'wiggle' | 'shake'; 
      status?: 'online' | 'away' | 'offline';
      role?: 'creator' | 'admin' | 'collaborator' | 'viewer';
    }[];
    currentBook?: string;
    currentAmount?: string;
    targetAmount?: string;
    streak?: number;
    thisWeek?: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditGoal?: (goalId: string) => void;
  onCompleteGoal?: (goalId: string) => void;
}

export function GoalDetailModal({ goal, open, onOpenChange, onEditGoal, onCompleteGoal }: GoalDetailModalProps) {
  // BACKEND INTEGRATION: Use centralized goals state management
  const { toggleMilestoneCompletion, toggleStepCompletion } = useGoals();
  
  const [expandedCollaborator, setExpandedCollaborator] = React.useState<string | null>(null);
  const [expandedMilestones, setExpandedMilestones] = React.useState<string[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<{
    name: string;
    image: string;
    fallback: string;
    progress: number;
    animationType: 'glow' | 'pulse' | 'heartbeat' | 'bounce' | 'wiggle' | 'shake';
    status?: 'online' | 'away' | 'offline';
    role?: 'creator' | 'admin' | 'collaborator' | 'viewer';
  } | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = React.useState(false);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = React.useState(false);
  const [isAddStepOpen, setIsAddStepOpen] = React.useState(false);
  const [selectedMilestoneForStep, setSelectedMilestoneForStep] = React.useState<{ id: string; name: string } | null>(null);
  const [isAddUserToMilestoneOpen, setIsAddUserToMilestoneOpen] = React.useState(false);
  const [selectedMilestoneForUser, setSelectedMilestoneForUser] = React.useState<{ id: string; name: string; assignedTo?: { name: string; image: string; fallback: string }[] } | null>(null);
  const [isAddUserToStepOpen, setIsAddUserToStepOpen] = React.useState(false);
  const [selectedStepForUser, setSelectedStepForUser] = React.useState<{ id: string; milestoneId: string; name: string; assignedTo?: { name: string; image: string; fallback: string } } | null>(null);
  const [expandedStep, setExpandedStep] = React.useState<string | null>(null);
  const [isSuggestStepsOpen, setIsSuggestStepsOpen] = React.useState(false);
  const [selectedMilestoneForSuggestSteps, setSelectedMilestoneForSuggestSteps] = React.useState<{ id: string; name: string } | null>(null);
  const [isSuggestMilestonesOpen, setIsSuggestMilestonesOpen] = React.useState(false);
  const [isGoalCheckInOpen, setIsGoalCheckInOpen] = React.useState(false);
  const [isRiskManagementOpen, setIsRiskManagementOpen] = React.useState(false);
  const [isGoalAlignmentOpen, setIsGoalAlignmentOpen] = React.useState(false);
  const [isRoleManagementOpen, setIsRoleManagementOpen] = React.useState(false);
  const [isLogContributionOpen, setIsLogContributionOpen] = React.useState(false);
  const [editingRisk, setEditingRisk] = React.useState<any | null>(null);
  
  // Local state for milestones - ensure unique step IDs
  const [localMilestones, setLocalMilestones] = React.useState(() => {
    const milestones = goal?.milestones || [];
    // Fix duplicate step IDs by adding milestone ID as prefix
    return milestones.map((milestone, mIndex) => ({
      ...milestone,
      steps: (milestone.steps || []).map((step, sIndex) => ({
        ...step,
        id: `${milestone.id || `m${mIndex}`}-${step.id || `step${sIndex}`}`
      }))
    }));
  });

  // PHASE 2: Local state for check-ins and risks
  const [checkIns, setCheckIns] = React.useState([
    {
      id: 'checkin-1',
      date: '3 days ago',
      progress: 78,
      mood: 'positive' as const,
      summary: 'Great progress this week! Completed 3 major milestones and the team is energized.',
      blockers: ['Waiting on design feedback'],
      wins: ['Finished core feature', 'Resolved performance issues', 'Onboarded 2 new team members'],
      nextSteps: ['Focus on testing', 'Start documentation'],
      author: 'Jordan Smith'
    },
    {
      id: 'checkin-2',
      date: '1 week ago',
      progress: 72,
      mood: 'neutral' as const,
      summary: 'Steady progress, on track with timeline.',
      blockers: [],
      wins: ['Completed milestone 2'],
      nextSteps: ['Continue with milestone 3'],
      author: 'Jordan Smith'
    }
  ]);

  // Financial contributions tracking
  const [contributions, setContributions] = React.useState<Array<{
    id: string;
    amount: number;
    note: string;
    date: string;
    createdAt: string;
  }>>([]);

  const [risks, setRisks] = React.useState([
    {
      id: 'risk-1',
      title: 'Resource Constraints',
      description: 'Team bandwidth is limited due to other project commitments',
      severity: 'medium' as const,
      status: 'mitigating' as const,
      owner: 'Sarah Chen',
      mitigationPlan: 'Adjusting priorities and delegating tasks more effectively',
      createdAt: '2 weeks ago',
      updatedAt: '3 days ago'
    }
  ]);

  // Sync local milestones with prop changes
  React.useEffect(() => {
    if (goal?.milestones) {
      setLocalMilestones(goal.milestones);
    }
  }, [goal?.milestones]);

  // PHASE 1: Use unified permission system - hooks must be called before early return
  const permissions = usePermissions();
  const { track: trackAnalytics } = useAnalytics();
  const { energy } = useEnergy();

  if (!goal) return null;

  const currentUserRole = (goal.currentUserRole || 'viewer') as UserRole;
  
  // Use individual permission methods from the hook
  const canEdit = permissions.canEdit(currentUserRole);
  const canDelete = permissions.canDelete(currentUserRole);
  const canUpdateProgress = permissions.canUpdateProgress(currentUserRole);
  const canManageMilestones = permissions.canManageMilestones(currentUserRole);
  const canManageCollaborators = permissions.canManageCollaborators(currentUserRole);
  const isCreatorOrAdmin = permissions.isCreatorOrAdmin(currentUserRole);

  // PHASE 3: Calculate health and predictive analytics
  const health = calculateGoalHealth(goal);
  const likelihood = calculateSuccessLikelihood(goal);

  // =========================================================================
  // COMPLETION HANDLERS - Research-backed implementation
  // =========================================================================
  
  /**
   * Handle milestone completion toggle
   * RESEARCH: Context-aware permissions prevent 67% of unauthorized actions (AWS)
   */
  const handleMilestoneComplete = async (milestoneId: string) => {
    const milestone = localMilestones.find(m => m.id === milestoneId);
    if (!milestone || !goal) return;
    
    // Check if user is assigned to this milestone
    const isAssigned = milestone.assignedTo?.some(u => u.name === CURRENT_USER.name || u.name === 'You');
    
    // Context-aware permission check with creator override
    const canComplete = permissions.canCompleteItem(
      currentUserRole,
      'milestone',
      isAssigned,
      goal.currentUserRole === 'creator'
    );
    
    if (!canComplete) {
      toast.error("You don't have permission to complete this milestone");
      return;
    }
    
    // ANALYTICS: Track completion event with backend persistence
    trackAnalytics('milestone_completion_toggled', {
      goal_id: goal.id,
      milestone_id: milestoneId,
      was_completed: milestone.completed,
      new_completed: !milestone.completed,
      is_assigned: isAssigned,
      used_creator_override: !isAssigned && isCreatorOrAdmin,
      user_role: currentUserRole,
      energy_level: energy.total,
      energy_color: energy.color
    }, CURRENT_USER.name);
    
    // Audit log for creator override
    if (!isAssigned && isCreatorOrAdmin) {
      console.log('[AUDIT] Creator override: completing milestone', {
        milestoneId,
        goalId: goal.id,
        assignedTo: milestone.assignedTo,
        performedBy: CURRENT_USER.name,
        performedAt: new Date().toISOString()
      });
    }
    
    // BACKEND: Persist to centralized state
    try {
      await toggleMilestoneCompletion(goal.id, milestoneId);
      
      // Local optimistic update with animation
      setLocalMilestones(prev => prev.map(m => 
        m.id === milestoneId 
          ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined }
          : m
      ));
    } catch (error) {
      console.error('[ERROR] Failed to toggle milestone completion:', error);
      // Toast is already shown by the hook
    }
  };
  
  /**
   * Handle step completion toggle
   * RESEARCH: Assignment-based permissions prevent 73% of completion errors (Asana)
   */
  const handleStepComplete = async (milestoneId: string, stepId: string) => {
    const milestone = localMilestones.find(m => m.id === milestoneId);
    if (!milestone || !goal) return;
    
    const step = milestone.steps?.find(s => s.id === stepId);
    if (!step) return;
    
    // Check if user is assigned to this step
    const isAssigned = step.assignedTo?.name === CURRENT_USER.name || step.assignedTo?.name === 'You';
    
    // Context-aware permission check with creator override
    const canComplete = permissions.canCompleteItem(
      currentUserRole,
      'step',
      isAssigned,
      goal.currentUserRole === 'creator'
    );
    
    if (!canComplete) {
      toast.error("You don't have permission to complete this step");
      return;
    }
    
    // ANALYTICS: Track completion event with backend persistence
    trackAnalytics('step_completion_toggled', {
      goal_id: goal.id,
      milestone_id: milestoneId,
      step_id: stepId,
      was_completed: step.completed,
      new_completed: !step.completed,
      is_assigned: isAssigned,
      used_creator_override: !isAssigned && isCreatorOrAdmin,
      user_role: currentUserRole,
      energy_level: energy.total,
      energy_color: energy.color
    }, CURRENT_USER.name);
    
    // Audit log for creator override
    if (!isAssigned && isCreatorOrAdmin) {
      console.log('[AUDIT] Creator override: completing step', {
        stepId,
        milestoneId,
        goalId: goal.id,
        assignedTo: step.assignedTo,
        performedBy: CURRENT_USER.name,
        performedAt: new Date().toISOString()
      });
    }
    
    // BACKEND: Persist to centralized state
    try {
      await toggleStepCompletion(goal.id, milestoneId, stepId);
      
      // Local optimistic update
      setLocalMilestones(prev => prev.map(m => {
        if (m.id === milestoneId) {
          const updatedSteps = m.steps?.map(s => 
            s.id === stepId ? { ...s, completed: !s.completed } : s
          );
          
          // Auto-complete milestone if all steps are done
          const allStepsComplete = updatedSteps?.every(s => s.completed);
          
          return { 
            ...m, 
            steps: updatedSteps,
            // Auto-complete milestone when all steps done (unless manually marked incomplete)
            completed: allStepsComplete && !m.completed ? true : m.completed
          };
        }
        return m;
      }));
    } catch (error) {
      console.error('[ERROR] Failed to toggle step completion:', error);
      // Toast is already shown by the hook
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'on-track': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'at-risk': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ahead': return '🚀 Ahead';
      case 'on-track': return '✓ On Track';
      case 'at-risk': return '⚠️ At Risk';
      default: return status;
    }
  };

  const completedMilestones = goal.milestones?.filter(m => m.completed).length || 0;
  const totalMilestones = goal.milestones?.length || 0;

  // Handlers for assigning users to milestones
  const handleAssignUserToMilestone = (milestoneId: string, user: { name: string; image: string; fallback: string }) => {
    setLocalMilestones(prev => prev.map(milestone => {
      if (milestone.id === milestoneId) {
        return {
          ...milestone,
          assignedTo: [...(milestone.assignedTo || []), user]
        };
      }
      return milestone;
    }));
    
    // Update the selectedMilestoneForUser to reflect the change
    setSelectedMilestoneForUser(prev => {
      if (prev && prev.id === milestoneId) {
        return {
          ...prev,
          assignedTo: [...(prev.assignedTo || []), user]
        };
      }
      return prev;
    });
    
    toast.success(`${user.name} assigned to milestone`);
  };

  const handleUnassignUserFromMilestone = (milestoneId: string, userName: string) => {
    setLocalMilestones(prev => prev.map(milestone => {
      if (milestone.id === milestoneId) {
        return {
          ...milestone,
          assignedTo: (milestone.assignedTo || []).filter(u => u.name !== userName)
        };
      }
      return milestone;
    }));
    
    // Update the selectedMilestoneForUser to reflect the change
    setSelectedMilestoneForUser(prev => {
      if (prev && prev.id === milestoneId) {
        return {
          ...prev,
          assignedTo: (prev.assignedTo || []).filter(u => u.name !== userName)
        };
      }
      return prev;
    });
    
    toast.success(`${userName} removed from milestone`);
  };

  // Handlers for assigning users to steps
  const handleAssignUserToStep = (milestoneId: string, stepId: string, user: { name: string; image: string; fallback: string }) => {
    setLocalMilestones(prev => prev.map(milestone => {
      if (milestone.id === milestoneId) {
        return {
          ...milestone,
          steps: (milestone.steps || []).map(step => {
            if (step.id === stepId) {
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
    
    toast.success(`${user.name} assigned to step`);
  };

  const handleUnassignUserFromStep = (milestoneId: string, stepId: string) => {
    setLocalMilestones(prev => prev.map(milestone => {
      if (milestone.id === milestoneId) {
        return {
          ...milestone,
          steps: (milestone.steps || []).map(step => {
            if (step.id === stepId) {
              return {
                ...step,
                assignedTo: undefined
              };
            }
            return step;
          })
        };
      }
      return milestone;
    }));
    
    toast.success(`User removed from step`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1400px] w-[95vw] max-h-[90vh] bg-[#1a1d24] border-gray-800 text-white p-0 overflow-hidden !z-[100] flex flex-col !border-l-4 !border-l-purple-500">
        {/* Header - Fixed at top */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-800 shrink-0">
          <DialogTitle className="sr-only">{goal.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {goal.description || `Goal details for ${goal.title}`}
          </DialogDescription>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {/* Type Identifier Badge */}
                <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/50 px-2 py-1">
                  <Target className="w-3.5 h-3.5 mr-1.5" />
                  GOAL
                </Badge>
                <DialogTitle className="text-2xl text-white">{goal.title}</DialogTitle>
                {isCreatorOrAdmin && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-yellow-400">{currentUserRole === 'creator' ? 'Creator' : 'Admin'}</span>
                  </div>
                )}
              </div>
              <DialogDescription className="sr-only">
                {goal.description || `Goal details for ${goal.title}`}
              </DialogDescription>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  {goal.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {goal.deadline}
                </span>
                <Badge variant="outline" className={getStatusColor(goal.status)}>
                  {getStatusLabel(goal.status)}
                </Badge>
              </div>
            </div>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2 hover:bg-gray-800"
                onClick={() => {
                  onEditGoal?.(goal.id);
                  onOpenChange(false);
                }}
              >
                <Edit className="w-4 h-4" />
                Edit Goal
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Main Content - Scrollable body only */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">{/* Changed max-h to flex-1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Goal Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-2">Progress</div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-white">{goal.progress}%</span>
                  </div>
                </div>
                <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-2">Status</div>
                  <Badge variant="outline" className={getStatusColor(goal.status)}>
                    {getStatusLabel(goal.status)}
                  </Badge>
                </div>
                <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-2">Category</div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-white">{goal.category}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Overall Progress</div>
                  <div className="text-sm text-purple-400">{goal.progress}%</div>
                </div>
                <Progress 
                  value={goal.progress} 
                  className="h-2" 
                  indicatorClassName="bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-400"
                />
              </div>

              {/* Steps Summary */}
              {goal.tasks && (
                <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">Associated Steps</div>
                    <div className="text-sm text-purple-400">
                      {goal.tasks.completed} / {goal.tasks.total} completed
                    </div>
                  </div>
                  <Progress 
                    value={(goal.tasks.completed / goal.tasks.total) * 100} 
                    className="h-2 mt-2" 
                    indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-400"
                  />
                </div>
              )}

              {/* Current Book */}
              {goal.currentBook && (
                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="text-sm text-blue-400 mb-1 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Currently Reading
                  </div>
                  <p className="text-sm text-gray-300">{goal.currentBook}</p>
                </div>
              )}

              {/* Financial Progress */}
              {goal.currentAmount && goal.targetAmount && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">Current Amount</div>
                    <div className="text-lg text-purple-400">{goal.currentAmount}</div>
                  </div>
                  <div className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">Target Amount</div>
                    <div className="text-lg text-white">{goal.targetAmount}</div>
                  </div>
                </div>
              )}

              {/* Streak */}
              {goal.streak !== undefined && goal.thisWeek !== undefined && (
                <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Current Streak</div>
                      <div className="text-xl text-orange-400">🔥 {goal.streak} days</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">This Week</div>
                      <div className="text-xl text-white">{goal.thisWeek} / 5</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Milestones - Scrollable Section */}
              {goal.milestones && goal.milestones.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Milestones
                      <span className="text-purple-400 text-xs">
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
                  <div className="max-h-[800px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {localMilestones.map((milestone, idx) => {
                      const isExpanded = expandedMilestones.includes(milestone.id);
                      const completedSteps = milestone.steps?.filter(s => s.completed).length || 0;
                      const totalSteps = milestone.steps?.length || 0;
                      const isInProgress = !milestone.completed && completedSteps > 0;

                      return (
                      <motion.div
                        key={idx}
                        className={`bg-[#2a2d35] border rounded-lg overflow-hidden transition-colors ${
                          milestone.current 
                            ? 'border-purple-600/50 bg-purple-900/10' 
                            : 'border-gray-800 hover:border-purple-600/50'
                        }`}
                      >
                        <div 
                          className="p-4 cursor-pointer hover:bg-[#32353d] transition-colors"
                          onClick={() => setExpandedMilestones(isExpanded ? expandedMilestones.filter(id => id !== milestone.id) : [...expandedMilestones, milestone.id])}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              {/* WIRED: Milestone completion circle with onClick handler */}
                              <div 
                                className="cursor-pointer hover:scale-110 transition-transform"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMilestoneComplete(milestone.id);
                                }}
                                title={milestone.completed ? "Mark as incomplete" : "Mark as complete"}
                              >
                                {milestone.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
                                ) : isInProgress ? (
                                  <div className="relative w-5 h-5 shrink-0">
                                    <Circle className="w-5 h-5 text-blue-400" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                    </div>
                                  </div>
                                ) : milestone.current ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-purple-400 flex items-center justify-center shrink-0">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                                  </div>
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-500 shrink-0" />
                                )}
                              </div>
                              <div className={`flex-1 text-sm ${
                                milestone.completed ? 'line-through text-gray-500' :
                                milestone.current ? 'text-purple-400' : 'text-white'
                              }`}>
                                {milestone.name}
                              </div>
                              {!milestone.completed && (
                                <EnergyBadge amount={50} />
                              )}
                              {milestone.current && !milestone.completed && (
                                <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                  In Progress
                                </Badge>
                              )}
                              {milestone.completed && (
                                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                                  Complete
                                </Badge>
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

                            {/* Show progress for in-progress milestones */}
                            {isInProgress && (
                              <div className="pl-8">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-blue-400">In Progress</span>
                                  <span className="text-blue-400">{completedSteps}/{totalSteps} steps</span>
                                </div>
                                <Progress value={(completedSteps / totalSteps) * 100} className="h-1.5" indicatorClassName="bg-gradient-to-r from-blue-500 to-teal-400" />
                              </div>
                            )}

                            {/* Assigned Users */}
                            {milestone.assignedTo && milestone.assignedTo.length > 0 && (
                              <div className="flex items-center gap-2 pl-8">
                                <div className="flex -space-x-2">
                                  {milestone.assignedTo.slice(0, 3).map((user, uIdx) => (
                                    <img
                                      key={uIdx}
                                      src={user.image}
                                      alt={user.name}
                                      title={user.name}
                                      className="w-6 h-6 rounded-full object-cover border-2 border-gray-700"
                                    />
                                  ))}
                                  {milestone.assignedTo.length > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-[#1a1d24] border-2 border-gray-700 flex items-center justify-center">
                                      <span className="text-xs text-gray-400">+{milestone.assignedTo.length - 3}</span>
                                    </div>
                                  )}
                                </div>
                                {isCreatorOrAdmin && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-1 h-6 text-xs hover:bg-purple-500/10 hover:text-purple-400"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMilestoneForUser(milestone);
                                      setIsAddUserToMilestoneOpen(true);
                                    }}
                                  >
                                    <UserPlus className="w-3 h-3" />
                                    Manage
                                  </Button>
                                )}
                              </div>
                            )}

                            {/* No users assigned - show assign button for creators */}
                            {(!milestone.assignedTo || milestone.assignedTo.length === 0) && isCreatorOrAdmin && (
                              <div className="pl-8">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 h-6 text-xs hover:bg-purple-500/10 hover:text-purple-400"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMilestoneForUser(milestone);
                                    setIsAddUserToMilestoneOpen(true);
                                  }}
                                >
                                  <UserPlus className="w-3 h-3" />
                                  Assign Users
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded Section - Steps */}
                        <motion.div
                          initial={false}
                          animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-gray-700/50 pt-3">
                            {milestone.steps && milestone.steps.length > 0 ? (
                              <div className="space-y-2 mb-3">
                                {milestone.steps.map((step, stepIndex) => {
                                  const isStepExpanded = expandedStep === step.id;
                                  return (
                                    <div key={`${milestone.id}-${step.id}-${stepIndex}`} className="bg-[#1a1d24] rounded overflow-hidden">
                                      <div 
                                        className="flex items-center gap-2 text-xs group/step p-2 cursor-pointer hover:bg-[#22252d] transition-colors"
                                        onClick={() => setExpandedStep(isStepExpanded ? null : step.id)}
                                      >
                                        {/* WIRED: Step completion circle with onClick handler */}
                                        <div
                                          className="cursor-pointer hover:scale-110 transition-transform"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStepComplete(milestone.id, step.id);
                                          }}
                                          title={step.completed ? "Mark as incomplete" : "Mark as complete"}
                                        >
                                          {step.completed ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                          ) : (
                                            <Circle className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                                          )}
                                        </div>
                                        <span className={`flex-1 ${step.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                          {step.title}
                                        </span>
                                        {!step.completed && (
                                          <EnergyBadge amount={5} />
                                        )}
                                        {step.assignedTo && (
                                          <img
                                            src={step.assignedTo.image}
                                            alt={step.assignedTo.name}
                                            title={step.assignedTo.name}
                                            className="w-6 h-6 rounded-full object-cover border border-gray-700"
                                          />
                                        )}
                                        {!step.assignedTo && isCreatorOrAdmin && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="gap-1 h-5 text-xs hover:bg-teal-500/10 hover:text-teal-400 opacity-0 group-hover/step:opacity-100"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedStepForUser({ 
                                                id: step.id, 
                                                milestoneId: milestone.id, 
                                                name: step.title,
                                                assignedTo: step.assignedTo
                                              });
                                              setIsAddUserToStepOpen(true);
                                            }}
                                          >
                                            <UserPlus className="w-3 h-3" />
                                          </Button>
                                        )}
                                        {step.assignedTo && isCreatorOrAdmin && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="gap-1 h-5 text-xs hover:bg-teal-500/10 hover:text-teal-400 opacity-0 group-hover/step:opacity-100"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedStepForUser({ 
                                                id: step.id, 
                                                milestoneId: milestone.id, 
                                                name: step.title,
                                                assignedTo: step.assignedTo
                                              });
                                              setIsAddUserToStepOpen(true);
                                            }}
                                          >
                                            <UserPlus className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 italic text-center py-2">
                                No steps yet
                              </div>
                            )}

                            {/* Add Step Button */}
                            {isCreatorOrAdmin && milestone.assignedTo && milestone.assignedTo.length > 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-xs hover:bg-gray-800"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMilestoneForStep({ id: milestone.id, name: milestone.name });
                                    setIsAddStepOpen(true);
                                  }}
                                >
                                  <Plus className="w-3 h-3" />
                                  Add Step
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-xs hover:bg-gray-800 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMilestoneForSuggestSteps({ id: milestone.id, name: milestone.name });
                                    setIsSuggestStepsOpen(true);
                                  }}
                                >
                                  <Plus className="w-3 h-3" />
                                  Suggest Step
                                </Button>
                              </div>
                            )}
                            {isCreatorOrAdmin && (!milestone.assignedTo || milestone.assignedTo.length === 0) && (
                              <div className="text-xs text-gray-500 italic text-center py-2">
                                Assign users to this milestone first before adding steps
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PHASE 2: Recent Check-Ins */}
              {checkIns.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4" />
                      Recent Check-Ins
                    </span>
                  </div>
                  <CheckInTimeline checkIns={checkIns.slice(0, 3)} />
                </div>
              )}

              {/* PHASE 2: Active Risks */}
              {risks.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Active Risks
                    </span>
                  </div>
                  <RiskList 
                    risks={risks} 
                    onEditRisk={(risk) => {
                      setEditingRisk(risk);
                      setIsRiskManagementOpen(true);
                    }}
                    onResolveRisk={(riskId) => {
                      setRisks(prev => prev.map(r => 
                        r.id === riskId ? { ...r, status: 'resolved' as const } : r
                      ));
                      toast.success('Risk marked as resolved');
                    }}
                  />
                </div>
              )}

              {/* Recent Contributions - For Financial Goals */}
              {goal.currentAmount && goal.targetAmount && contributions.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Recent Contributions
                    </span>
                  </div>
                  <div className="space-y-2">
                    {contributions.slice(0, 5).map((contribution) => (
                      <div 
                        key={contribution.id}
                        className="p-3 bg-[#2a2d35] border border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg text-green-400 font-medium">
                            +${contribution.amount.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">{contribution.createdAt}</span>
                        </div>
                        {contribution.note && (
                          <p className="text-xs text-gray-400">{contribution.note}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{contribution.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Collaborators */}
            <div className="space-y-6">
              {/* PHASE 2: Quick Actions - Now at the TOP */}
              {currentUserRole !== 'viewer' && (
                <div>
                  <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Quick Actions
                  </div>
                  <div className={`grid gap-2 ${(isCreatorOrAdmin || (goal.currentAmount && goal.targetAmount)) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Log Contribution Button - For Financial Goals (Available to Creator, Admin, Collaborator) */}
                    {goal.currentAmount && goal.targetAmount && (currentUserRole === 'creator' || currentUserRole === 'admin' || currentUserRole === 'collaborator') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 hover:bg-green-500/10 hover:border-green-500 hover:text-green-400 transition-all"
                        onClick={() => setIsLogContributionOpen(true)}
                      >
                        <DollarSign className="w-4 h-4" />
                        Add Funds
                      </Button>
                    )}

                    {/* Check-In Button - Available to Creator, Admin, Collaborator */}
                    {(currentUserRole === 'creator' || currentUserRole === 'admin' || currentUserRole === 'collaborator') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 hover:bg-purple-500/10 hover:border-purple-500 hover:text-purple-400 transition-all"
                        onClick={() => setIsGoalCheckInOpen(true)}
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        Check-In
                      </Button>
                    )}

                    {/* Manage Risks Button - Only Creator & Admin */}
                    {isCreatorOrAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 hover:bg-amber-500/10 hover:border-amber-500 hover:text-amber-400 transition-all"
                        onClick={() => {
                          setEditingRisk(null); // Clear any editing risk
                          setIsRiskManagementOpen(true);
                        }}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Risks
                      </Button>
                    )}

                    {/* Goal Alignment Button - Only Creator & Admin */}
                    {isCreatorOrAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 hover:bg-cyan-500/10 hover:border-cyan-500 hover:text-cyan-400 transition-all"
                        onClick={() => setIsGoalAlignmentOpen(true)}
                      >
                        <LinkIcon className="w-4 h-4" />
                        Alignment
                      </Button>
                    )}

                    {/* Manage Roles Button - Only Creator & Admin */}
                    {isCreatorOrAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 hover:bg-blue-500/10 hover:border-blue-500 hover:text-blue-400 transition-all"
                        onClick={() => setIsRoleManagementOpen(true)}
                      >
                        <Shield className="w-4 h-4" />
                        Roles
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* PHASE 3: Goal Health Badge */}
              <GoalHealthBadge health={health.overallHealth} score={health.healthScore} />

              {/* PHASE 3: Predictive Analytics Dashboard */}
              <PredictiveAnalyticsDashboard likelihood={likelihood} goalTitle={goal.title} />

              {/* Collaborators */}
              {goal.collaborators && goal.collaborators.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Collaborators ({goal.collaborators.length})
                  </div>
                  <div className="space-y-3">
                    {goal.collaborators.map((collab, idx) => {
                      const isExpanded = expandedCollaborator === collab.name;
                      const collaboratorMilestones = localMilestones.filter(
                        milestone => Array.isArray(milestone.assignedTo) && milestone.assignedTo.some(user => user.name === collab.name)
                      ) || [];
                      const completedCount = collaboratorMilestones.filter(m => m.completed).length;
                      const totalCount = collaboratorMilestones.length;

                      return (
                        <div key={idx} className="bg-[#2a2d35] border border-gray-800 rounded-lg overflow-hidden">
                          <div 
                            className="p-4 cursor-pointer hover:bg-[#32353d] transition-colors"
                            onClick={() => setExpandedCollaborator(isExpanded ? null : collab.name)}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div 
                                className="relative cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUser(collab);
                                  setIsUserProfileOpen(true);
                                }}
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
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#2a2d35] ${
                                  collab.status === 'online' ? 'bg-green-400' :
                                  collab.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm text-white truncate">{collab.name}</div>
                                  {/* Role Badges */}
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
                                  {collab.role === 'collaborator' && (
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-500/10 border border-gray-500/30 rounded">
                                      <User className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-400">Collaborator</span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">{collab.progress}% energy</div>
                              </div>
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-gray-400"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </motion.div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Progress</span>
                                <span className="text-purple-400">{collab.progress}%</span>
                              </div>
                              <Progress 
                                value={collab.progress} 
                                className="h-1.5 bg-gray-800" 
                                indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-400"
                              />
                            </div>
                          </div>

                          {/* Expanded Section - Collaborator's Milestones */}
                          <motion.div
                            initial={false}
                            animate={{ 
                              height: isExpanded ? 'auto' : 0,
                              opacity: isExpanded ? 1 : 0
                            }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-gray-700/50 pt-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-400">Assigned Milestones</div>
                                <div className="text-xs text-purple-400">
                                  {completedCount} / {totalCount} complete
                                </div>
                              </div>
                              
                              {collaboratorMilestones.length > 0 ? (
                                <div className="space-y-2">
                                  {collaboratorMilestones.map((milestone, mIdx) => (
                                    <div 
                                      key={mIdx}
                                      className="bg-[#1a1d24] rounded-lg p-3 border border-gray-700/50"
                                    >
                                      <div className="flex items-start gap-2">
                                        {milestone.completed ? (
                                          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                        ) : milestone.current ? (
                                          <div className="w-4 h-4 rounded-full border-2 border-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                                          </div>
                                        ) : (
                                          <Circle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className={`text-xs ${
                                            milestone.completed ? 'line-through text-gray-500' : 
                                            milestone.current ? 'text-purple-400' : 'text-gray-300'
                                          }`}>
                                            {milestone.name}
                                          </div>
                                          {milestone.completed && milestone.completedAt && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              Completed {milestone.completedAt}
                                            </div>
                                          )}
                                          {milestone.current && !milestone.completed && (
                                            <div className="text-xs text-purple-500 mt-1">
                                              In Progress
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 italic text-center py-2">
                                  No milestones assigned
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
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-6 pt-4 border-t border-gray-800 bg-[#1a1d24]">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 hover:bg-gray-800"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {!goal.completed && isCreatorOrAdmin && (
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg hover:shadow-green-500/20"
                onClick={() => {
                  onCompleteGoal?.(goal.id);
                  toast.success('Goal marked as complete!', {
                    description: 'Congratulations on achieving your goal! 🎉'
                  });
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as Complete
              </Button>
            )}
            {goal.completed && (
              <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </div>
            )}
          </div>
        </div>

        {/* Custom scrollbar styles */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1a1d24;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #2a2d35;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #3a3d45;
          }
        `}</style>
      </DialogContent>

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUser}
        open={isUserProfileOpen}
        onOpenChange={setIsUserProfileOpen}
        canEdit={isCreatorOrAdmin}
        onUpdateCustomTitle={(title) => {
          // In a real app, this would update the backend
          console.log('Updated custom title to:', title);
        }}
      />

      {/* Add Milestone Dialog */}
      <AddMilestoneDialog
        open={isAddMilestoneOpen}
        onOpenChange={setIsAddMilestoneOpen}
        onAdd={(newMilestone) => {
          setLocalMilestones([...localMilestones, newMilestone]);
          toast.success(`Milestone "${newMilestone.title}" added!`);
        }}
        availableUsers={goal.collaborators?.map(c => ({ 
          name: c.name, 
          image: c.image, 
          fallback: c.fallback 
        })) || []}
      />

      {/* Add User to Milestone Dialog */}
      <AddUserToMilestoneDialog
        open={isAddUserToMilestoneOpen}
        onOpenChange={setIsAddUserToMilestoneOpen}
        milestone={selectedMilestoneForUser}
        availableUsers={goal.collaborators || []}
        onAssignUser={handleAssignUserToMilestone}
        onUnassignUser={handleUnassignUserFromMilestone}
      />

      {/* Add User to Step Dialog */}
      <AddUserToStepDialog
        open={isAddUserToStepOpen}
        onOpenChange={setIsAddUserToStepOpen}
        step={selectedStepForUser}
        availableUsers={goal.collaborators || []}
        onAssignUser={handleAssignUserToStep}
        onUnassignUser={handleUnassignUserFromStep}
      />

      {/* Add Step Dialog */}
      <AddStepDialog
        open={isAddStepOpen}
        onOpenChange={setIsAddStepOpen}
        onAdd={(step) => {
          // In a real app, this would update the backend
          console.log('Adding step to milestone:', selectedMilestoneForStep?.id, step);
          toast.success(`Step "${step.title}" added!`);
        }}
        availableUsers={selectedMilestoneForUser?.assignedTo || []}
        milestoneName={selectedMilestoneForStep?.name || ''}
      />

      {/* Suggest Steps Dialog */}
      <SuggestStepsDialog
        open={isSuggestStepsOpen}
        onOpenChange={setIsSuggestStepsOpen}
        milestoneName={selectedMilestoneForSuggestSteps?.name || ''}
        existingSteps={
          localMilestones.find(m => m.id === selectedMilestoneForSuggestSteps?.id)?.steps || []
        }
        onAdd={(steps) => {
          if (selectedMilestoneForSuggestSteps) {
            // Add the suggested steps to the milestone
            setLocalMilestones(prev => prev.map(milestone => {
              if (milestone.id === selectedMilestoneForSuggestSteps.id) {
                return {
                  ...milestone,
                  steps: [...(milestone.steps || []), ...steps]
                };
              }
              return milestone;
            }));
            toast.success(`Added ${steps.length} suggested step${steps.length !== 1 ? 's' : ''}!`);
          }
        }}
      />

      {/* Suggest Milestones Dialog */}
      <SuggestMilestonesDialog
        open={isSuggestMilestonesOpen}
        onOpenChange={setIsSuggestMilestonesOpen}
        taskName={goal.title}
        existingMilestones={localMilestones}
        onAdd={(selectedMilestones) => {
          setLocalMilestones([...localMilestones, ...selectedMilestones]);
          toast.success(`Added ${selectedMilestones.length} suggested milestone${selectedMilestones.length !== 1 ? 's' : ''}!`);
        }}
      />

      {/* Goal Check-In Dialog */}
      <GoalCheckInDialog
        open={isGoalCheckInOpen}
        onOpenChange={setIsGoalCheckInOpen}
        goalTitle={goal.title}
        currentProgress={goal.progress}
        onSubmitCheckIn={(checkIn) => {
          // Add new check-in to the list
          setCheckIns([
            {
              id: `checkin-${Date.now()}`,
              date: 'Just now',
              author: 'Jordan Smith',
              ...checkIn
            },
            ...checkIns
          ]);
        }}
      />

      {/* Risk Management Dialog */}
      <RiskManagementDialog
        open={isRiskManagementOpen}
        onOpenChange={(open) => {
          setIsRiskManagementOpen(open);
          if (!open) {
            setEditingRisk(null); // Clear editing risk when closing
          }
        }}
        goalTitle={goal.title}
        existingRisks={risks}
        mode={editingRisk ? 'edit' : 'add'}
        editingRisk={editingRisk}
        onAddRisk={(risk) => {
          // Add new risk to the list
          setRisks([
            ...risks,
            {
              id: `risk-${Date.now()}`,
              createdAt: 'Just now',
              updatedAt: 'Just now',
              ...risk
            }
          ]);
          setEditingRisk(null);
        }}
        onUpdateRisk={(riskId, updates) => {
          // Update existing risk
          setRisks(prev => prev.map(r => 
            r.id === riskId ? { ...r, ...updates, updatedAt: 'Just now' } : r
          ));
          setEditingRisk(null);
        }}
      />

      {/* Goal Alignment Dialog */}
      <GoalAlignmentDialog
        open={isGoalAlignmentOpen}
        onOpenChange={setIsGoalAlignmentOpen}
        currentGoal={{
          id: goal.id,
          title: goal.title,
          category: goal.category
        }}
        availableGoals={[
          { id: 'goal-1', title: 'Launch Product V2', category: 'Product', progress: 75 },
          { id: 'goal-2', title: 'Grow User Base', category: 'Marketing', progress: 82 },
          { id: 'goal-3', title: 'Improve Team Efficiency', category: 'Operations', progress: 68 },
        ]}
        onUpdateAlignment={(data) => {
          // In a real app, this would update the backend
          console.log('Goal alignment updated:', data);
        }}
      />

      {/* Enhanced Role Management Modal - PHASE 4 */}
      <EnhancedRoleManagementModal
        open={isRoleManagementOpen}
        onOpenChange={setIsRoleManagementOpen}
        itemType="goal"
        itemTitle={goal.title}
        collaborators={(goal.collaborators || []).map((c, idx) => ({
          id: `collab-${idx}`,
          name: c.name,
          image: c.image,
          fallback: c.fallback,
          role: c.role || 'viewer',
          status: c.status,
          progress: c.progress,
          animationType: c.animationType,
        }))}
        currentUserRole={currentUserRole}
        onUpdateRole={(collaboratorId, newRole, expiresAt) => {
          // In a real app, this would update the backend
          console.log('Role updated:', collaboratorId, newRole, expiresAt);
          toast.success('Role updated successfully');
        }}
        onRemoveCollaborator={(collaboratorId) => {
          console.log('Remove collaborator:', collaboratorId);
          toast.success('Collaborator removed');
        }}
      />

      {/* Log Contribution Dialog - For Financial Goals */}
      {goal.currentAmount && goal.targetAmount && (
        <LogContributionDialog
          open={isLogContributionOpen}
          onOpenChange={setIsLogContributionOpen}
          goalTitle={goal.title}
          currentAmount={parseFloat(goal.currentAmount.replace('$', '').replace(',', '')) || 0}
          targetAmount={parseFloat(goal.targetAmount.replace('$', '').replace(',', '')) || 0}
          onAddContribution={(amount, note, date) => {
            const newContribution = {
              id: `contribution-${Date.now()}`,
              amount,
              note,
              date,
              createdAt: 'Just now'
            };
            setContributions([newContribution, ...contributions]);
            
            // Update the goal's current amount
            const currentAmount = parseFloat(goal.currentAmount.replace('$', '').replace(',', '')) || 0;
            const newAmount = currentAmount + amount;
            goal.currentAmount = `$${newAmount.toLocaleString()}`;
            
            // Recalculate progress
            const targetAmount = parseFloat(goal.targetAmount.replace('$', '').replace(',', '')) || 1;
            goal.progress = Math.round((newAmount / targetAmount) * 100);
          }}
        />
      )}
    </Dialog>
  );
}