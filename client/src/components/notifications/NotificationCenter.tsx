import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Trophy,
  Zap,
  Calendar,
  DollarSign,
  Users,
  X,
  Check,
  Trash2,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'achievement';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: string;
  actionLabel?: string;
  actionRoute?: string;
}

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'achievement',
    title: '🔥 15-Day Streak!',
    message: 'Congratulations! You\'ve maintained a 15-day streak. Keep it up!',
    timestamp: new Date(Date.now() - 5 * 60000),
    read: false,
    icon: '🔥',
    actionLabel: 'View Achievements',
    actionRoute: '/do?tab=challenges'
  },
  {
    id: '2',
    type: 'success',
    title: 'Task Completed',
    message: '"Write Q4 Strategy" completed during PEAK energy. +150 points earned!',
    timestamp: new Date(Date.now() - 30 * 60000),
    read: false,
    icon: '✅',
  },
  {
    id: '3',
    type: 'info',
    title: 'Upcoming Event',
    message: 'Team Meeting starts in 30 minutes',
    timestamp: new Date(Date.now() - 45 * 60000),
    read: false,
    icon: '📅',
    actionLabel: 'View Calendar',
    actionRoute: '/plan'
  },
  {
    id: '4',
    type: 'achievement',
    title: '🎉 Challenge Complete!',
    message: 'You completed "Peak Performance" challenge. Claim your rewards!',
    timestamp: new Date(Date.now() - 120 * 60000),
    read: true,
    icon: '🏆',
    actionLabel: 'Claim Rewards',
    actionRoute: '/home'
  },
  {
    id: '5',
    type: 'warning',
    title: 'Budget Alert',
    message: 'You\'ve used 85% of your monthly budget. Review your expenses.',
    timestamp: new Date(Date.now() - 180 * 60000),
    read: true,
    icon: '💰',
    actionLabel: 'View Budget',
    actionRoute: '/manage?tab=money'
  },
  {
    id: '6',
    type: 'info',
    title: 'Friend Request',
    message: 'Alex Smith sent you a friend request',
    timestamp: new Date(Date.now() - 240 * 60000),
    read: true,
    icon: '👥',
    actionLabel: 'View Request',
    actionRoute: '/manage?tab=people'
  },
];

export function NotificationCenter({ open, onClose, onUnreadCountChange }: NotificationCenterProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Fetch notifications from backend with fallback to mock data
  const { data: backendNotifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      console.log('🔔 Fetching notifications from backend...');
      try {
        const response = await Promise.race([
          api.get('/notifications'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Backend timeout')), 15000)
          )
        ]);
        console.log('✅ Backend notifications response:', response);
        const notifications = response.data?.data?.notifications || response.data?.notifications || [];
        console.log(`📦 Received ${notifications.length} notifications from backend`);
        return notifications;
      } catch (err: any) {
        console.error('❌ Failed to fetch notifications:', err.message || err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  // Use backend notifications if available, otherwise fall back to mock data
  const notifications = backendNotifications && backendNotifications.length > 0 
    ? backendNotifications.map((n: any) => ({
        id: n.id,
        type: n.type || 'info',
        title: n.title,
        message: n.message,
        timestamp: new Date(n.createdAt),
        read: n.isRead || false,
        icon: n.icon,
        actionLabel: n.actionLabel,
        actionRoute: n.actionRoute
      }))
    : mockNotifications;

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Update parent component when unread count changes
  React.useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: '🔔 Notifications Enabled',
          description: 'You\'ll receive real-time notifications',
          duration: 3000,
        });
      } else {
        toast({
          title: '🔕 Notifications Disabled',
          description: 'You can enable them in your browser settings',
          duration: 3000,
        });
      }
    }
  };

  // Show push notification
  const showPushNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        tag: notification.id,
        requireInteraction: false
      });
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'achievement':
        return <Trophy className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (notification: Notification) => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20';
      case 'info':
        return 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20';
      case 'achievement':
        return 'border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20';
      default:
        return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      const newUnreadCount = updated.filter(n => !n.read).length;
      onUnreadCountChange?.(newUnreadCount);
      return updated;
    });
    toast({
      title: '✓ Marked as Read',
      duration: 2000,
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      onUnreadCountChange?.(0);
      return updated;
    });
    toast({
      title: `✓ ${unreadCount} Notifications Marked as Read`,
      duration: 3000,
    });
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      const newUnreadCount = updated.filter(n => !n.read).length;
      onUnreadCountChange?.(newUnreadCount);
      return updated;
    });
    toast({
      title: '🗑️ Notification Deleted',
      duration: 2000,
    });
  };

  const handleClearAll = () => {
    setNotifications([]);
    onUnreadCountChange?.(0);
    toast({
      title: '🗑️ All Notifications Cleared',
      duration: 3000,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                Notifications
                {unreadCount > 0 && (
                  <Badge 
                    className="ml-2 text-white font-semibold"
                    style={{ backgroundImage: 'linear-gradient(to right, rgb(239 68 68), rgb(249 115 22))' }}
                  >
                    {unreadCount} new
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
                Stay updated with your activities and achievements
              </DialogDescription>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="h-8 text-xs"
            >
              <Filter className="w-3 h-3 mr-1" />
              All ({notifications.length})
            </Button>
            <Button
              size="sm"
              variant={filter === 'unread' ? 'default' : 'outline'}
              onClick={() => setFilter('unread')}
              className="h-8 text-xs"
            >
              Unread ({unreadCount})
            </Button>
            
            <div className="flex-1"></div>
            
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkAllAsRead}
                className="h-8 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark All Read
              </Button>
            )}
            
            {notifications.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                className="h-8 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium mb-1">All Caught Up!</p>
              <p className="text-sm">You have no {filter === 'unread' ? 'unread' : ''} notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors relative",
                    !notification.read && "border-l-4 border-purple-500 dark:border-purple-400"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      getNotificationColor(notification)
                    )}>
                      {notification.icon ? (
                        <span className="text-xl">{notification.icon}</span>
                      ) : (
                        getNotificationIcon(notification)
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {getTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {notification.message}
                      </p>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {notification.actionLabel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-2"
                          >
                            {notification.actionLabel} →
                          </Button>
                        )}
                        
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-7 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 px-2"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(notification.id)}
                          className="h-7 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-purple-500 dark:bg-purple-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </span>
            <span className="text-gray-500 dark:text-gray-500">
              Press ESC to close
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
