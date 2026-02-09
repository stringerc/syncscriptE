/**
 * MemberProfileModal Component
 * 
 * Shows team member profile in team context:
 * - Status
 * - Recent progress (tasks assigned vs completed)
 * - Chat shortcut
 */

import { MessageSquare, Target, CheckCircle2, Clock, TrendingUp, Mail, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AnimatedAvatar } from './AnimatedAvatar';

interface MemberProfileModalProps {
  member: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role?: string;
    energy?: number;
    animation?: 'glow' | 'heartbeat' | 'pulse' | 'bounce';
    status?: 'online' | 'away' | 'offline';
  };
  open: boolean;
  onClose: () => void;
  onOpenChat: () => void;
}

export function MemberProfileModal({ member, open, onClose, onOpenChat }: MemberProfileModalProps) {
  // Mock progress data
  const tasksAssigned = 15;
  const tasksCompleted = 12;
  const completionRate = (tasksCompleted / tasksAssigned) * 100;

  const recentActivity = [
    { id: '1', type: 'completed', task: 'Design homepage mockup', time: '2h ago' },
    { id: '2', type: 'completed', task: 'Review pull request #124', time: '5h ago' },
    { id: '3', type: 'started', task: 'Implement new feature', time: '1d ago' },
    { id: '4', type: 'completed', task: 'Fix bug in login flow', time: '2d ago' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e2128] border-gray-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Team Member Profile</DialogTitle>
          <DialogDescription className="text-gray-400">
            View and manage {member.name}'s profile and recent activity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <AnimatedAvatar
                src={member.avatar}
                alt={member.name}
                animation={member.animation || 'glow'}
                size="lg"
              />
              <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#1e2128] ${
                member.status === 'online' ? 'bg-green-500' :
                member.status === 'away' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`} />
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl text-white font-semibold">{member.name}</h3>
              <p className="text-gray-400 text-sm mb-2">{member.email}</p>
              <div className="flex items-center gap-2">
                {member.role && (
                  <Badge variant="outline" className="capitalize">
                    {member.role}
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">
                  {member.status || 'offline'}
                </Badge>
                {member.energy !== undefined && (
                  <Badge className="bg-teal-600/20 text-teal-400 border-teal-600/30">
                    {member.energy} Energy
                  </Badge>
                )}
              </div>
            </div>

            <Button onClick={onOpenChat} className="bg-gradient-to-r from-teal-600 to-blue-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-[#252830] border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Assigned</span>
              </div>
              <p className="text-2xl text-white font-semibold">{tasksAssigned}</p>
            </div>

            <div className="p-4 bg-[#252830] border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Completed</span>
              </div>
              <p className="text-2xl text-white font-semibold">{tasksCompleted}</p>
            </div>

            <div className="p-4 bg-[#252830] border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <span className="text-sm text-gray-400">Rate</span>
              </div>
              <p className="text-2xl text-white font-semibold">{Math.round(completionRate)}%</p>
            </div>
          </div>

          {/* Task Completion Progress */}
          <div className="p-4 bg-[#252830] border border-gray-700 rounded-lg">
            <h4 className="text-white font-medium mb-3">Task Completion</h4>
            <Progress value={completionRate} className="h-2 mb-2" />
            <p className="text-sm text-gray-400">
              {tasksCompleted} of {tasksAssigned} tasks completed
            </p>
          </div>

          {/* Recent Activity */}
          <div>
            <h4 className="text-white font-medium mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-[#252830] border border-gray-700 rounded-lg"
                >
                  {activity.type === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{activity.task}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      activity.type === 'completed'
                        ? 'bg-green-600/20 text-green-400 border-green-600/30'
                        : 'bg-blue-600/20 text-blue-400 border-blue-600/30'
                    }
                  >
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
            <Button variant="outline" className="flex-1">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}