import { X, Zap, CheckCircle2, Circle, Target, TrendingUp, Calendar, Clock, Award, Flame, Phone, MessageCircle, Edit, Check, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Progress } from './ui/progress';
import { AnimatedAvatar } from './AnimatedAvatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface UserProfileModalProps {
  user: {
    name: string;
    image: string;
    fallback: string;
    progress: number;
    animationType: 'glow' | 'pulse' | 'heartbeat' | 'bounce' | 'wiggle' | 'shake';
    status?: 'online' | 'away' | 'offline';
    role?: string;
    email?: string;
    customTitle?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit?: boolean; // Whether the current user can edit (creator or admin)
  onUpdateCustomTitle?: (title: string) => void;
}

export function UserProfileModal({ user, open, onOpenChange, canEdit = false, onUpdateCustomTitle }: UserProfileModalProps) {
  if (!user) return null;

  // Helper function to capitalize role names
  const capitalizeRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Initialize custom title with capitalized role as default
  const defaultTitle = user.customTitle || (user.role ? capitalizeRole(user.role) : 'Team Member');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [customTitle, setCustomTitle] = useState(defaultTitle);
  const [tempTitle, setTempTitle] = useState(customTitle);

  // Update customTitle when user changes
  useEffect(() => {
    const newTitle = user.customTitle || (user.role ? capitalizeRole(user.role) : 'Team Member');
    setCustomTitle(newTitle);
    setTempTitle(newTitle);
    setIsEditingTitle(false); // Reset edit mode when user changes
  }, [user.name, user.role, user.customTitle]); // Re-run when user identity or role changes

  // Mock data for user statistics - in a real app, this would come from props or API
  const userStats = {
    tasksCompletedToday: 8,
    totalTasksToday: 12,
    currentStreak: 12,
    totalTasksCompleted: 247,
    averageEnergyLevel: user.progress,
    tasksInProgress: [
      { id: '1', title: 'Gather Q3 spending data', completed: true, completedAt: '2 hours ago', project: 'Q3 Budget Report' },
      { id: '2', title: 'Create allocation spreadsheet', completed: true, completedAt: '45 min ago', project: 'Q3 Budget Report' },
      { id: '3', title: 'Calculate variance analysis', completed: false, dueDate: 'Today', project: 'Q3 Budget Report' },
      { id: '4', title: 'Review timeline and milestones', completed: true, completedAt: '5 hours ago', project: 'Project Proposal' },
      { id: '5', title: 'Check budget calculations', completed: false, dueDate: 'Tomorrow', project: 'Project Proposal' },
    ],
    recentActivity: [
      { action: 'completed milestone', detail: 'Create allocation spreadsheet', time: '45 min ago', project: 'Q3 Budget Report' },
      { action: 'completed milestone', detail: 'Gather Q3 spending data', time: '2 hours ago', project: 'Q3 Budget Report' },
      { action: 'commented on task', detail: 'Finance team needs this by EOD', time: '3 hours ago', project: 'Q3 Budget Report' },
      { action: 'completed milestone', detail: 'Review timeline and milestones', time: '5 hours ago', project: 'Project Proposal' },
    ]
  };

  const completedToday = userStats.tasksInProgress.filter(t => t.completed);
  const inProgress = userStats.tasksInProgress.filter(t => !t.completed);
  const completionRate = Math.round((userStats.tasksCompletedToday / userStats.totalTasksToday) * 100);

  const getEnergyLevel = (progress: number) => {
    if (progress >= 80) return { label: 'Peak', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/50' };
    if (progress >= 60) return { label: 'High', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/50' };
    if (progress >= 40) return { label: 'Medium', color: 'text-teal-400', bgColor: 'bg-teal-500/20', borderColor: 'border-teal-500/50' };
    return { label: 'Low', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/50' };
  };

  const energyLevel = getEnergyLevel(user.progress);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[900px] w-[95vw] max-h-[90vh] bg-[#1a1d24] border-gray-800 text-white p-0 overflow-hidden !z-[110]">
        <DialogHeader className="sr-only">
          <DialogTitle>{user.name}'s Profile</DialogTitle>
          <DialogDescription>View profile details and activity</DialogDescription>
        </DialogHeader>
        {/* Header with gradient background */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600/20 via-blue-600/20 to-purple-600/20" />
          <div className="relative p-8 pb-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                <AnimatedAvatar
                  name={user.name}
                  image={user.image}
                  fallback={user.fallback}
                  size={96}
                  progress={user.progress}
                  animationType={user.animationType}
                />
                {/* Online Status Indicator */}
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[#1a1d24] ${
                  user.status === 'online' ? 'bg-green-400' :
                  user.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="group/title">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl">{user.name}</h2>
                      {user.role === 'creator' && (
                        <div className="flex items-center gap-0.5 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded">
                          <Crown className="w-3.5 h-3.5 text-yellow-400" />
                          <span className="text-xs text-yellow-400">Creator</span>
                        </div>
                      )}
                      {user.role === 'admin' && (
                        <div className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded">
                          <Crown className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs text-blue-400">Admin</span>
                        </div>
                      )}
                      {user.role === 'collaborator' && (
                        <div className="flex items-center gap-0.5 px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 rounded">
                          <span className="text-xs text-teal-400">Collaborator</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Editable Custom Title */}
                    <div className="flex items-center gap-2">
                      {isEditingTitle ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            className="bg-[#2a2d35] border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-teal-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setCustomTitle(tempTitle);
                                setIsEditingTitle(false);
                                onUpdateCustomTitle?.(tempTitle);
                              }
                              if (e.key === 'Escape') {
                                setTempTitle(customTitle);
                                setIsEditingTitle(false);
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              setCustomTitle(tempTitle);
                              setIsEditingTitle(false);
                              onUpdateCustomTitle?.(tempTitle);
                            }}
                            className="p-1 hover:bg-teal-500/10 rounded transition-colors"
                          >
                            <Check className="w-3.5 h-3.5 text-teal-400" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-400 text-sm">{customTitle}</p>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setTempTitle(customTitle);
                                setIsEditingTitle(true);
                              }}
                              className="opacity-0 group-hover/title:opacity-100 p-1 hover:bg-gray-700/50 rounded transition-all"
                            >
                              <Edit className="w-3 h-3 text-gray-400 hover:text-teal-400" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    
                    {user.email && (
                      <p className="text-gray-500 text-xs mt-1">{user.email}</p>
                    )}
                  </div>
                  
                  {/* Action Buttons - Call & Message */}
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${energyLevel.bgColor} ${energyLevel.borderColor}`}>
                      <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-400' : user.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'} animate-pulse`} />
                      <span className={`text-xs capitalize ${energyLevel.color}`}>
                        {user.status || 'offline'}
                      </span>
                    </div>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-teal-600/50 bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 hover:text-teal-300"
                        onClick={() => {
                          // Handle message action
                          console.log('Message', user.name);
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-blue-600/50 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300"
                        onClick={() => {
                          // Handle call action
                          console.log('Call', user.name);
                        }}
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </Button>
                    </motion.div>
                  </div>
                </div>
                
                {/* Energy Level */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${energyLevel.color}`} />
                      <span className="text-sm text-gray-400">Current Energy Level</span>
                    </div>
                    <span className={`text-sm ${energyLevel.color}`}>{energyLevel.label} ({user.progress}%)</span>
                  </div>
                  <Progress 
                    value={user.progress} 
                    className="h-2 bg-gray-800" 
                    indicatorClassName="bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-8 py-4 grid grid-cols-4 gap-4 border-b border-gray-800">
          <motion.div 
            className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4 text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
            </div>
            <div className="text-2xl text-white mb-1">{userStats.tasksCompletedToday}</div>
            <div className="text-xs text-gray-400">Tasks Today</div>
          </motion.div>
          
          <motion.div 
            className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4 text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl text-white mb-1">{completionRate}%</div>
            <div className="text-xs text-gray-400">Completion Rate</div>
          </motion.div>
          
          <motion.div 
            className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4 text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-2xl text-white mb-1">{userStats.currentStreak}</div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </motion.div>
          
          <motion.div 
            className="bg-[#2a2d35] border border-gray-800 rounded-lg p-4 text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl text-white mb-1">{userStats.totalTasksCompleted}</div>
            <div className="text-xs text-gray-400">Total Tasks</div>
          </motion.div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="p-8 pt-6 overflow-y-auto max-h-[calc(90vh-400px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tasks Completed Today */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm flex items-center gap-2 text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  Completed Today ({completedToday.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {completedToday.map((task) => (
                  <motion.div
                    key={task.id}
                    className="bg-[#2a2d35] border border-gray-800 rounded-lg p-3 hover:border-teal-600/50 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-300 line-through">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {task.project}
                          </Badge>
                          <span className="text-xs text-gray-500">{task.completedAt}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tasks In Progress */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm flex items-center gap-2 text-gray-400">
                  <Target className="w-4 h-4 text-blue-400" />
                  In Progress ({inProgress.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {inProgress.map((task) => (
                  <motion.div
                    key={task.id}
                    className="bg-[#2a2d35] border border-gray-800 rounded-lg p-3 hover:border-blue-600/50 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start gap-2">
                      <Circle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {task.project}
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {task.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-6">
            <h3 className="text-sm flex items-center gap-2 text-gray-400 mb-4">
              <Clock className="w-4 h-4" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {userStats.recentActivity.map((activity, idx) => (
                <div key={idx} className="flex gap-3 relative">
                  {idx < userStats.recentActivity.length - 1 && (
                    <div className="absolute left-2 top-6 bottom-0 w-px bg-gray-700" />
                  )}
                  <div className="w-4 h-4 rounded-full bg-teal-600 border-2 border-[#1a1d24] shrink-0 mt-1 z-10" />
                  <div className="flex-1 pb-4">
                    <div className="text-sm text-white">
                      <span className="capitalize">{activity.action}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{activity.detail}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {activity.project}
                      </Badge>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Custom scrollbar styles */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1a1d24;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #2a2d35;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #3a3d45;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}