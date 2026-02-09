import { useState } from 'react';
import * as React from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2, Circle, Target, TrendingUp, Star, Calendar, Tag,
  ChevronRight, ChevronDown, MoreVertical, Edit, Trash2, Share2, Copy,
  User, Activity, Crown, Shield, Lock, Brain, AlertTriangle, 
  Smile, Meh, Frown, GitBranch, CheckSquare, Clock, MapPin, Eye, Users
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AnimatedAvatar } from './AnimatedAvatar';
import { toast } from 'sonner@2.0.3';
import { calculateGoalHealth, generateQuickActions } from '../utils/goal-ai-analytics';
import { GoalHealthBadge } from './GoalHealthBadge';
import { GoalQuickActions } from './GoalQuickActions';
import { EnergyBadge } from './EnergyBadge'; // PHASE 1.5: Energy badges for goals
import { getGoalEnergyValue } from '../utils/energy-system'; // PHASE 1.5: Energy values
// PHASE 2: Permission system integration
import { useItemPermissions } from '../hooks/usePermissions';
import type { UserRole } from '../types/unified-types';
// PHASE 3: Enhanced permission features
import { PermissionTooltip } from './goals/PermissionTooltip';
import { EnhancedRoleManagementModal } from './goals/EnhancedRoleManagementModal';

interface EnhancedGoalCardProps {
  goal: any;
  onViewGoal: (goal: any) => void;
  onEditGoal: (goalId: string) => void;
  onDuplicateGoal: (goalId: string) => void;
  onShareGoal: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onQuickAction?: (action: string, goalId: string) => void;
}

export function EnhancedGoalCard({
  goal,
  onViewGoal,
  onEditGoal,
  onDuplicateGoal,
  onShareGoal,
  onDeleteGoal,
  onQuickAction
}: EnhancedGoalCardProps) {
  const [expandedKeyResults, setExpandedKeyResults] = useState(false);
  const [expandedMilestones, setExpandedMilestones] = useState(false);
  const [expandedContributors, setExpandedContributors] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState(false);
  const [expandedCheckIns, setExpandedCheckIns] = useState(false);
  const [expandedRisks, setExpandedRisks] = useState(false);
  const [expandedAlignment, setExpandedAlignment] = useState(false);
  // PHASE 3: Role Management Modal state
  const [roleManagementOpen, setRoleManagementOpen] = useState(false);

  // PHASE 2: Get permissions for this goal
  const permissions = useItemPermissions(goal.currentUserRole);

  // PHASE 3: Calculate health and quick actions
  const health = calculateGoalHealth(goal);
  const quickActions = generateQuickActions(goal);

  const handleQuickAction = (action: string) => {
    if (onQuickAction) {
      onQuickAction(action, goal.id);
    } else {
      toast.info(`Quick action: ${action}`);
    }
  };

  // PHASE 3: Handle role updates
  const handleUpdateRole = (collaboratorId: string, newRole: 'admin' | 'collaborator' | 'viewer') => {
    toast.success(`Role updated to ${newRole}`, {
      description: `Collaborator role has been changed successfully`
    });
    // In real implementation, this would call an API to update the role
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    toast.info('Collaborator removed', {
      description: 'The collaborator has been removed from this goal'
    });
    // In real implementation, this would call an API to remove the collaborator
  };

  const handleInviteCollaborator = () => {
    toast.info('Invite collaborator', {
      description: 'Opening invitation dialog...'
    });
    // In real implementation, this would open an invitation dialog
  };

  // PHASE 2: Get role display info for badge
  const getRoleIcon = (role: UserRole | undefined) => {
    switch (role) {
      case 'creator': return Crown;
      case 'admin': return Shield;
      case 'collaborator': return Users;
      case 'viewer': return Eye;
      default: return User;
    }
  };

  const getRoleColor = (role: UserRole | undefined) => {
    switch (role) {
      case 'creator': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'admin': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'collaborator': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'viewer': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <motion.div
      className="bg-[#1e2128] border border-gray-800 rounded-xl p-5 hover:border-purple-600/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer"
      data-nav={`goal-${goal.id}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={() => onViewGoal(goal)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-white">{goal.title}</h3>
            {goal.isPrivate && (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
            {/* PHASE 2: Role Badge */}
            {goal.currentUserRole && (
              <Badge variant="outline" className={getRoleColor(goal.currentUserRole)}>
                {React.createElement(getRoleIcon(goal.currentUserRole), { className: 'w-3 h-3 inline-block mr-1' })}
                {goal.currentUserRole.charAt(0).toUpperCase() + goal.currentUserRole.slice(1)}
              </Badge>
            )}
            {goal.timeHorizon && (
              <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                {goal.timeHorizon}
              </Badge>
            )}
            <Badge variant={
              goal.status === 'ahead' ? 'default' : 
              goal.status === 'on-track' ? 'secondary' : 'outline'
            } className={
              goal.status === 'ahead' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              goal.status === 'on-track' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            }>
              {goal.status === 'ahead' ? '🚀 Ahead' :
               goal.status === 'on-track' ? '✓ On Track' : '⚠️ At Risk'}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {goal.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {goal.deadline}
            </span>
            {goal.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                {goal.location}
              </span>
            )}
            {goal.confidenceScore !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-yellow-400">{goal.confidenceScore}/10 confidence</span>
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-gray-200 hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-purple-500"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1e2128] border-gray-700">
            {/* PHASE 2: Permission-gated actions */}
            {permissions.canEdit && (
              <DropdownMenuItem 
                className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditGoal(goal.id);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Goal
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateGoal(goal.id);
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onShareGoal(goal.id);
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Goal
            </DropdownMenuItem>
            {/* PHASE 2: Only creator can delete/archive */}
            {permissions.canDelete && (
              <>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem 
                  className="text-orange-400 hover:text-orange-300 hover:bg-orange-900/20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteGoal(goal.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Archive Goal
                </DropdownMenuItem>
              </>
            )}
            {/* PHASE 2: Show disabled state for viewers */}
            {!permissions.canEdit && !permissions.canDelete && permissions.isViewer && (
              <DropdownMenuItem 
                disabled
                className="text-gray-500 cursor-not-allowed"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Only Access
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-400">Overall Progress</span>
          <span className="text-purple-400">{goal.progress}%</span>
        </div>
        <Progress 
          value={goal.progress} 
          className="h-2 bg-purple-950/50" 
          indicatorClassName="bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-400"
        />
      </div>

      {/* Key Results Section - PHASE 1 NEW */}
      {goal.keyResults && goal.keyResults.length > 0 && (
        <div className="mb-3">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-800/30 p-2 -mx-2 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedKeyResults(!expandedKeyResults);
            }}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-gray-300">Key Results</span>
              <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/30 text-xs h-5">
                {goal.keyResults.length}
              </Badge>
            </div>
            {expandedKeyResults ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {expandedKeyResults && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3 pl-2"
            >
              {goal.keyResults.map((kr: any) => (
                <div key={kr.id} className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-gray-300 flex-1">{kr.description}</p>
                    <Badge variant="outline" className="text-xs bg-gray-800 border-gray-700 ml-2">
                      {kr.confidence}/10
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 flex-wrap">
                    <span className="font-mono text-teal-400">{kr.currentValue}</span>
                    <span>→</span>
                    <span className="font-mono text-white">{kr.targetValue}</span>
                    <span className="text-gray-500">{kr.unit}</span>
                    <span className="ml-auto flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {kr.dueDate}
                    </span>
                  </div>
                  <Progress 
                    value={kr.progress} 
                    className="h-2 bg-gray-800" 
                    indicatorClassName={
                      kr.progress >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                      kr.progress >= 50 ? 'bg-gradient-to-r from-teal-500 to-cyan-400' :
                      'bg-gradient-to-r from-yellow-500 to-orange-400'
                    }
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <AnimatedAvatar
                      name={kr.owner.name}
                      image={kr.owner.image}
                      fallback={kr.owner.fallback}
                      size={20}
                      animationType="glow"
                      className="shrink-0"
                    />
                    <span className="text-xs text-gray-400">{kr.owner.name}</span>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-teal-400 border-teal-500/30 hover:bg-teal-500/10 hover:border-teal-500/50"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info('AI Suggestions', { description: 'AI will suggest additional Key Results based on your goal' });
                }}
              >
                <Brain className="w-3 h-3 mr-2" />
                + Suggest Key Results
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* Milestones Section - PHASE 1 ENHANCED */}
      {goal.milestones && goal.milestones.length > 0 && (
        <div className="mb-4">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-800/30 p-2 -mx-2 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedMilestones(!expandedMilestones);
            }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">Milestones</span>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs h-5">
                {goal.milestones.filter((m: any) => m.completed).length}/{goal.milestones.length}
              </Badge>
            </div>
            {expandedMilestones ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {expandedMilestones ? (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2 pl-2"
            >
              {goal.milestones.map((milestone: any) => (
                <div key={milestone.id} className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    {milestone.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    ) : milestone.current ? (
                      <div className="w-5 h-5 rounded-full border-2 border-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <span className={
                          milestone.completed ? 'text-sm text-gray-400 line-through' :
                          milestone.current ? 'text-sm text-teal-400' : 'text-sm text-gray-300'
                        }>
                          {milestone.name}
                        </span>
                        {milestone.targetDate && (
                          <span className="text-xs text-gray-500 ml-2">{milestone.targetDate}</span>
                        )}
                      </div>
                      {milestone.completed && milestone.celebrationNote && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1 mt-2">
                          <p className="text-xs text-yellow-300">🎉 {milestone.celebrationNote}</p>
                        </div>
                      )}
                      {milestone.completed && milestone.completedBy && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-gray-500">Completed by {milestone.completedBy}</span>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-500">{milestone.completedAt}</span>
                        </div>
                      )}
                      {milestone.assignedTo && (
                        <div className="flex items-center gap-2 mt-2">
                          {Array.isArray(milestone.assignedTo) ? (
                            milestone.assignedTo.slice(0, 3).map((person: any, idx: number) => (
                              <AnimatedAvatar
                                key={idx}
                                name={person.name}
                                image={person.image}
                                fallback={person.fallback}
                                size={20}
                                animationType="pulse"
                                className="shrink-0"
                              />
                            ))
                          ) : (
                            <>
                              <AnimatedAvatar
                                name={milestone.assignedTo.name}
                                image={milestone.assignedTo.image}
                                fallback={milestone.assignedTo.fallback}
                                size={20}
                                animationType="pulse"
                                className="shrink-0"
                              />
                              <span className="text-xs text-gray-400">{milestone.assignedTo.name}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-purple-400 border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info('AI Suggestions', { description: 'AI will suggest milestones based on your goal timeline' });
                }}
              >
                <Brain className="w-3 h-3 mr-2" />
                + Suggest Milestones
              </Button>
            </motion.div>
          ) : (
            <div className="mt-2 pl-2 space-y-2">
              {goal.milestones.slice(0, 3).map((milestone: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  {milestone.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  ) : milestone.current ? (
                    <div className="w-4 h-4 rounded-full border-2 border-teal-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-teal-400" />
                    </div>
                  ) : (
                    <Circle className="w-4 h-4 text-gray-600" />
                  )}
                  <span className={
                    milestone.completed ? 'text-gray-400 line-through' :
                    milestone.current ? 'text-teal-400' : 'text-gray-500'
                  }>
                    {milestone.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contributors Section - PHASE 1 WITH ROLES */}
      {goal.collaborators && goal.collaborators.length > 0 && (
        <div className="mb-4">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-800/30 p-2 -mx-2 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedContributors(!expandedContributors);
            }}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">Contributors</span>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs h-5">
                {goal.collaborators.length}
              </Badge>
            </div>
            {expandedContributors ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {expandedContributors ? (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3 pl-2"
            >
              {goal.collaborators.map((collaborator: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
                  <div className="relative shrink-0">
                    <AnimatedAvatar
                      name={collaborator.name}
                      image={collaborator.image}
                      fallback={collaborator.fallback}
                      size={40}
                      animationType={collaborator.animationType}
                      progress={collaborator.progress}
                      className="shrink-0"
                    />
                    {/* Online Status Indicator */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                      collaborator.status === 'online' ? 'bg-green-400' :
                      collaborator.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                    }`} />
                    {/* Role Icon Badge */}
                    {collaborator.role === 'owner' && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 border-2 border-gray-900 flex items-center justify-center">
                        <Crown className="w-3 h-3 text-gray-900" />
                      </div>
                    )}
                    {collaborator.role === 'champion' && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-gray-900 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-gray-900" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm text-gray-300 truncate">{collaborator.name}</span>
                      <Badge variant="outline" className={
                        collaborator.role === 'owner' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs h-5' :
                        collaborator.role === 'champion' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs h-5' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs h-5'
                      }>
                        {collaborator.role === 'owner' ? 'Owner' :
                         collaborator.role === 'champion' ? 'Champion' : 'Contributor'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Contribution</span>
                      <span className="text-purple-400">{collaborator.progress || 0}%</span>
                    </div>
                    <Progress 
                      value={collaborator.progress || 0} 
                      className="h-1.5 bg-gray-800" 
                      indicatorClassName="bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-400"
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInviteCollaborator();
                  }}
                >
                  <User className="w-3 h-3 mr-2" />
                  + Invite
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-400 border-gray-500/30 hover:bg-gray-500/10 hover:border-gray-500/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRoleManagementOpen(true);
                  }}
                >
                  <Users className="w-3 h-3 mr-2" />
                  Manage Roles
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="mt-2 pl-2 flex items-center gap-2">
              {goal.collaborators.slice(0, 4).map((collaborator: any, idx: number) => (
                <div key={idx} className="relative">
                  <AnimatedAvatar
                    name={collaborator.name}
                    image={collaborator.image}
                    fallback={collaborator.fallback}
                    size={32}
                    animationType={collaborator.animationType}
                    progress={collaborator.progress}
                    className="shrink-0"
                  />
                  {/* Online Status */}
                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
                    collaborator.status === 'online' ? 'bg-green-400' :
                    collaborator.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                  }`} />
                  {/* Role Icon */}
                  {collaborator.role === 'owner' && (
                    <Crown className="absolute -top-1 -right-1 w-3.5 h-3.5 text-yellow-400" />
                  )}
                  {collaborator.role === 'champion' && (
                    <Shield className="absolute -top-1 -right-1 w-3.5 h-3.5 text-blue-400" />
                  )}
                </div>
              ))}
              {goal.collaborators.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300">
                  +{goal.collaborators.length - 4}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity Feed - PHASE 1 NEW */}
      {goal.activity && goal.activity.length > 0 && (
        <div className="mb-4">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-800/30 p-2 -mx-2 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedActivity(!expandedActivity);
            }}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Recent Activity</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs h-5">
                {goal.activity.length}
              </Badge>
            </div>
            {expandedActivity ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {expandedActivity && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2 pl-2"
            >
              {goal.activity.map((activity: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
                  <Activity className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300">
                      <span className="text-green-400">{activity.user}</span>{' '}
                      <span className="text-gray-400">{activity.action}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.detail}</p>
                    <span className="text-xs text-gray-600 mt-1 block">{activity.time}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Check-ins Section - PHASE 2 NEW */}
      {goal.checkIns && goal.checkIns.length > 0 && (
        <div className="mb-4">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-800/30 p-2 -mx-2 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedCheckIns(!expandedCheckIns);
            }}
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-300">Progress Check-ins</span>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs h-5">
                {goal.checkIns.length}
              </Badge>
              {goal.nextCheckIn && (
                <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600 text-xs h-5">
                  <Clock className="w-3 h-3 mr-1" />
                  {goal.nextCheckIn}
                </Badge>
              )}
            </div>
            {expandedCheckIns ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {expandedCheckIns && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3 pl-2"
            >
              {goal.checkIns.map((checkIn: any) => (
                <div key={checkIn.id} className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {checkIn.mood === 'positive' ? (
                        <Smile className="w-4 h-4 text-green-400" />
                      ) : checkIn.mood === 'neutral' ? (
                        <Meh className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <Frown className="w-4 h-4 text-orange-400" />
                      )}
                      <span className="text-xs text-gray-400">{checkIn.date}</span>
                      <Badge variant="outline" className="text-xs bg-gray-800 border-gray-700">
                        {checkIn.progress}%
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{checkIn.summary}</p>
                  {checkIn.wins && checkIn.wins.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-green-400 mb-1">✓ Wins:</p>
                      <ul className="text-xs text-gray-400 space-y-1 pl-4">
                        {checkIn.wins.map((win: string, idx: number) => (
                          <li key={idx}>• {win}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {checkIn.blockers && checkIn.blockers.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-orange-400 mb-1">⚠ Blockers:</p>
                      <ul className="text-xs text-gray-400 space-y-1 pl-4">
                        {checkIn.blockers.map((blocker: string, idx: number) => (
                          <li key={idx}>• {blocker}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {checkIn.nextSteps && checkIn.nextSteps.length > 0 && (
                    <div>
                      <p className="text-xs text-blue-400 mb-1">→ Next Steps:</p>
                      <ul className="text-xs text-gray-400 space-y-1 pl-4">
                        {checkIn.nextSteps.map((step: string, idx: number) => (
                          <li key={idx}>• {step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">By {checkIn.author}</p>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 hover:border-indigo-500/50"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info('Add Check-in', { description: 'Log progress update for this goal' });
                }}
              >
                <CheckSquare className="w-3 h-3 mr-2" />
                + Add Check-in
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* Risks & Blockers Section - PHASE 2 NEW */}
      {goal.risks && goal.risks.length > 0 && (
        <div className="mb-4">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-800/30 p-2 -mx-2 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedRisks(!expandedRisks);
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-300">Risks & Blockers</span>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs h-5">
                {goal.risks.filter((r: any) => r.status === 'active').length} active
              </Badge>
            </div>
            {expandedRisks ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {expandedRisks && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3 pl-2"
            >
              {goal.risks.map((risk: any) => (
                <div key={risk.id} className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <AlertTriangle className={`w-4 h-4 shrink-0 ${
                        risk.severity === 'critical' ? 'text-red-400' :
                        risk.severity === 'high' ? 'text-orange-400' :
                        risk.severity === 'medium' ? 'text-yellow-400' : 'text-gray-400'
                      }`} />
                      <h4 className="text-sm text-white">{risk.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={
                        risk.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30 text-xs h-5' :
                        risk.severity === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs h-5' :
                        risk.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs h-5' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs h-5'
                      }>
                        {risk.severity}
                      </Badge>
                      <Badge variant="outline" className={
                        risk.status === 'active' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs h-5' :
                        risk.status === 'mitigating' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs h-5' :
                        'bg-green-500/20 text-green-400 border-green-500/30 text-xs h-5'
                      }>
                        {risk.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{risk.description}</p>
                  {risk.mitigationPlan && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1.5 mb-2">
                      <p className="text-xs text-blue-300"><strong>Mitigation:</strong> {risk.mitigationPlan}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Owner: {risk.owner}</span>
                    <span>Updated {risk.updatedAt}</span>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-orange-400 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info('Add Risk', { description: 'Track new blocker or risk for this goal' });
                }}
              >
                <AlertTriangle className="w-3 h-3 mr-2" />
                + Add Risk
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* Goal Alignment Section - PHASE 2 NEW */}
      {(goal.parentGoal || (goal.childGoals && goal.childGoals.length > 0) || goal.alignedWith) && (
        <div className="mb-4">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-800/30 p-2 -mx-2 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedAlignment(!expandedAlignment);
            }}
          >
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-300">Goal Alignment</span>
            </div>
            {expandedAlignment ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {expandedAlignment && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3 pl-2"
            >
              {goal.alignedWith && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                  <p className="text-xs text-cyan-400 mb-1">📍 Aligned with:</p>
                  <p className="text-sm text-white">{goal.alignedWith}</p>
                </div>
              )}
              {goal.parentGoal && (
                <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">⬆️ Parent Goal:</p>
                  <p className="text-sm text-blue-300">{goal.parentGoal}</p>
                </div>
              )}
              {goal.childGoals && goal.childGoals.length > 0 && (
                <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-2">⬇️ Sub-goals ({goal.childGoals.length}):</p>
                  <div className="space-y-2">
                    {goal.childGoals.map((childId: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-gray-300">Sub-goal {childId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Goal-specific details (keep existing) */}
      {goal.tasks && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          {goal.tasks.completed} of {goal.tasks.total} tasks completed
        </div>
      )}

      {goal.currentBook && (
        <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3 text-sm mb-3">
          <p className="text-gray-400">Currently reading:</p>
          <p className="text-blue-300">{goal.currentBook}</p>
        </div>
      )}

      {goal.currentAmount && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-lg text-teal-400 mb-1">{goal.currentAmount}</div>
            <div className="text-xs text-gray-400">Current</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-lg text-white mb-1">{goal.targetAmount}</div>
            <div className="text-xs text-gray-400">Target</div>
          </div>
        </div>
      )}

      {goal.streak !== undefined && (
        <div className="flex items-center justify-between bg-orange-600/10 border border-orange-600/20 rounded-lg p-3">
          <div>
            <div className="text-sm text-gray-400">Current Streak</div>
            <div className="text-xl text-orange-400">🔥 {goal.streak} days</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">This Week</div>
            <div className="text-xl text-white">{goal.thisWeek} / 5</div>
          </div>
        </div>
      )}

      {/* PHASE 3: Health and Quick Actions */}
      <div className="mt-4 space-y-3">
        <GoalHealthBadge health={health.overallHealth} score={health.healthScore} compact />
        {quickActions.length > 0 && (
          <div onClick={(e) => e.stopPropagation()}>
            <GoalQuickActions actions={quickActions} onAction={handleQuickAction} />
          </div>
        )}
      </div>

      {/* PHASE 1.5: Energy Badge */}
      {!goal.completed && (() => {
        // Determine goal size based on category
        let goalSize: 'small' | 'medium' | 'large' = 'medium';
        
        if (goal.category === 'Professional' || goal.category === 'Career') {
          goalSize = 'large';
        } else if (goal.category === 'Habit' || goal.category === 'Quick Win') {
          goalSize = 'small';
        }
        
        const energyAmount = getGoalEnergyValue(goalSize);
        
        return (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
            <span className="text-sm text-gray-400">Complete to earn:</span>
            <EnergyBadge 
              priority={goalSize === 'large' ? 'high' : goalSize === 'medium' ? 'medium' : 'low'}
              energyAmount={energyAmount}
              size="md"
            />
          </div>
        );
      })()}

      {/* PHASE 3: Role Management Modal */}
      {goal.collaborators && goal.collaborators.length > 0 && (
        <EnhancedRoleManagementModal
          open={roleManagementOpen}
          onOpenChange={setRoleManagementOpen}
          itemType="goal"
          itemTitle={goal.title}
          collaborators={goal.collaborators.map((c: any) => ({
            ...c,
            id: c.id || c.name, // Ensure each collaborator has an ID
            email: c.email || `${c.name.toLowerCase().replace(' ', '.')}@example.com`,
            role: c.role || 'collaborator' // Default to collaborator if no role set
          }))}
          currentUserRole={goal.currentUserRole || 'viewer'}
          onUpdateRole={handleUpdateRole}
          onRemoveCollaborator={handleRemoveCollaborator}
          onInviteCollaborator={handleInviteCollaborator}
        />
      )}
    </motion.div>
  );
}