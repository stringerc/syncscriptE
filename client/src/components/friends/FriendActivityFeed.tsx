import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, 
  Trophy, 
  Zap, 
  CheckSquare, 
  Calendar,
  Target,
  Clock
} from 'lucide-react';

interface FriendActivity {
  id: string;
  friendName: string;
  friendEmoji: string;
  type: 'task_complete' | 'challenge_complete' | 'energy_log' | 'streak_milestone' | 'event_scheduled';
  title: string;
  description: string;
  timestamp: string;
  points?: number;
  isOnline: boolean;
}

interface FriendActivityFeedProps {
  activities: FriendActivity[];
}

export function FriendActivityFeed({ activities }: FriendActivityFeedProps) {
  const getActivityIcon = (type: FriendActivity['type']) => {
    switch (type) {
      case 'task_complete':
        return <CheckSquare className="w-4 h-4 text-green-600" />;
      case 'challenge_complete':
        return <Trophy className="w-4 h-4 text-orange-600" />;
      case 'energy_log':
        return <Zap className="w-4 h-4 text-purple-600" />;
      case 'streak_milestone':
        return <Flame className="w-4 h-4 text-red-600" />;
      case 'event_scheduled':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: FriendActivity['type']) => {
    switch (type) {
      case 'task_complete':
        return 'border-green-200 bg-green-50';
      case 'challenge_complete':
        return 'border-orange-200 bg-orange-50';
      case 'energy_log':
        return 'border-purple-200 bg-purple-50';
      case 'streak_milestone':
        return 'border-red-200 bg-red-50';
      case 'event_scheduled':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <Card className="border-none shadow-xl">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-pink-600" />
          Friend Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">No recent activity from friends</p>
              <p className="text-xs mt-1">Invite friends to see their progress!</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div 
                key={activity.id}
                className={`p-3 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${getActivityColor(activity.type)}`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback 
                        className="text-white text-sm"
                        style={{ backgroundImage: 'linear-gradient(to bottom right, rgb(236 72 153), rgb(168 85 247))' }}
                      >
                        {activity.friendName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {activity.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">
                        {activity.friendEmoji} {activity.friendName}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      {getActivityIcon(activity.type)}
                      <span className="text-sm font-medium text-gray-800">{activity.title}</span>
                    </div>
                    
                    <p className="text-xs text-gray-600">{activity.description}</p>
                    
                    {activity.points && (
                      <Badge className="mt-2 bg-purple-100 text-purple-700 border-purple-300 text-xs">
                        +{activity.points} pts
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

