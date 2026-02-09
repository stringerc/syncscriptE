/**
 * TeamActivityModal Component
 * 
 * Shows team activity feed (mock data).
 */

import { Activity, CheckCircle2, UserPlus, Edit, Trash2, Calendar, Target, MessageSquare, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { AnimatedAvatar } from './AnimatedAvatar';

interface ActivityItem {
  id: string;
  type: 'task_completed' | 'member_added' | 'task_created' | 'event_created' | 'goal_achieved' | 'comment_added';
  user: {
    name: string;
    avatar: string;
  };
  title: string;
  description?: string;
  timestamp: Date;
}

interface TeamActivityModalProps {
  teamName: string;
  open: boolean;
  onClose: () => void;
}

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'task_completed',
    user: {
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
    title: 'Completed task: Design homepage mockup',
    description: 'Task marked as complete',
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
  },
  {
    id: '2',
    type: 'member_added',
    user: {
      name: 'Alex Kumar',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    },
    title: 'Added Mike Johnson to the team',
    timestamp: new Date(Date.now() - 14400000), // 4 hours ago
  },
  {
    id: '3',
    type: 'event_created',
    user: {
      name: 'Emily Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    },
    title: 'Created event: Team Planning Session',
    description: 'Scheduled for Oct 25, 2025 at 2:00 PM',
    timestamp: new Date(Date.now() - 21600000), // 6 hours ago
  },
  {
    id: '4',
    type: 'task_created',
    user: {
      name: 'Marcus Johnson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    },
    title: 'Created task: Review pull request #124',
    description: 'Assigned to Sarah Chen',
    timestamp: new Date(Date.now() - 28800000), // 8 hours ago
  },
  {
    id: '5',
    type: 'goal_achieved',
    user: {
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
    title: 'Achieved goal: Complete Q4 Design Sprint',
    description: '100% progress reached',
    timestamp: new Date(Date.now() - 43200000), // 12 hours ago
  },
  {
    id: '6',
    type: 'comment_added',
    user: {
      name: 'Alex Kumar',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    },
    title: 'Commented on task: Implement new feature',
    description: 'Looking good! Just a few suggestions...',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
  },
];

export function TeamActivityModal({ teamName, open, onClose }: TeamActivityModalProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'member_added':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'task_created':
        return <FileText className="w-4 h-4 text-purple-400" />;
      case 'event_created':
        return <Calendar className="w-4 h-4 text-teal-400" />;
      case 'goal_achieved':
        return <Target className="w-4 h-4 text-yellow-400" />;
      case 'comment_added':
        return <MessageSquare className="w-4 h-4 text-orange-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_completed':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'member_added':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'task_created':
        return 'bg-purple-600/20 text-purple-400 border-purple-600/30';
      case 'event_created':
        return 'bg-teal-600/20 text-teal-400 border-teal-600/30';
      case 'goal_achieved':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'comment_added':
        return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e2128] border-gray-800 max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-teal-400" />
            Team Activity
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Recent activity for {teamName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {MOCK_ACTIVITIES.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-4 bg-[#252830] border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
              >
                {/* Timeline dot */}
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback>{activity.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {index < MOCK_ACTIVITIES.length - 1 && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-700" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={getActivityColor(activity.type)}>
                        {getActivityIcon(activity.type)}
                      </Badge>
                      <span className="text-sm text-gray-400">{activity.user.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-white font-medium mb-1">{activity.title}</p>
                  {activity.description && (
                    <p className="text-sm text-gray-400">{activity.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
