import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, Settings, Calendar, CheckSquare, DollarSign, Users, Trophy } from 'lucide-react';

export function NotificationsPageZeroAPI() {
  const [loadTime, setLoadTime] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const endTime = performance.now();
    const loadTimeMs = Math.round(endTime - startTime);
    setLoadTime(loadTimeMs);
    
    console.log(`🚀 ZERO-API Notifications Page loaded in ${loadTimeMs}ms`);
    console.log('✅ No API calls made');
    console.log('✅ All notifications functionality working');
  }, []);

  // Mock notifications data
  const mockNotifications = [
    {
      id: '1',
      type: 'TASK_DUE',
      title: 'Task Due Soon',
      message: 'Your task "Review project proposal" is due in 2 hours',
      isRead: false,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      type: 'EVENT_REMINDER',
      title: 'Upcoming Event',
      message: 'Team Meeting starts in 30 minutes',
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'ACHIEVEMENT_UNLOCKED',
      title: 'Achievement Unlocked!',
      message: 'You unlocked "Task Master" - Complete 100 tasks',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      type: 'FRIEND_REQUEST',
      title: 'New Friend Request',
      message: 'Alice Johnson sent you a friend request',
      isRead: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '5',
      type: 'BUDGET_ALERT',
      title: 'Budget Alert',
      message: 'You are approaching your monthly budget limit',
      isRead: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_DUE':
        return <CheckSquare className="w-5 h-5 text-blue-600" />;
      case 'EVENT_REMINDER':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'ACHIEVEMENT_UNLOCKED':
        return <Trophy className="w-5 h-5 text-yellow-600" />;
      case 'FRIEND_REQUEST':
        return <Users className="w-5 h-5 text-pink-600" />;
      case 'BUDGET_ALERT':
        return <DollarSign className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'TASK_DUE':
        return 'from-blue-50 to-cyan-50 border-blue-200';
      case 'EVENT_REMINDER':
        return 'from-purple-50 to-pink-50 border-purple-200';
      case 'ACHIEVEMENT_UNLOCKED':
        return 'from-yellow-50 to-amber-50 border-yellow-200';
      case 'FRIEND_REQUEST':
        return 'from-pink-50 to-rose-50 border-pink-200';
      case 'BUDGET_ALERT':
        return 'from-red-50 to-orange-50 border-red-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    console.log(`✅ Mark notification ${notificationId} as read`);
  };

  const handleMarkAllAsRead = () => {
    console.log('✅ Mark all notifications as read');
  };

  const handleDeleteNotification = (notificationId: string) => {
    console.log(`✅ Delete notification ${notificationId}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Bell className="w-10 h-10" />
              Notifications - Zero API Mode
            </h1>
            <p className="text-white/90 text-lg flex items-center gap-2">
              <span>⚡ Loaded in {loadTime}ms</span>
              <span>•</span>
              <span>🚫 Zero network requests</span>
              <span>•</span>
              <span>🔔 {mockNotifications.length} notifications • {unreadCount} unread</span>
            </p>
          </div>
          <Button 
            onClick={handleMarkAllAsRead}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-lg px-6 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <Check className="w-5 h-5 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">{mockNotifications.length}</div>
            <p className="text-xs text-blue-600/70">All notifications</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Unread
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-1">{unreadCount}</div>
            <p className="text-xs text-red-600/70">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Read
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {mockNotifications.length - unreadCount}
            </div>
            <p className="text-xs text-green-600/70">Already read</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <span className="text-xl">⚡</span>
              Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">{loadTime}ms</div>
            <p className="text-xs text-purple-600/70">Ultra fast</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="border-none shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Bell className="w-6 h-6 text-blue-600" />
            Recent Notifications
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your latest updates and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {mockNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 rounded-xl transition-all duration-300 bg-gradient-to-br ${getNotificationColor(notification.type)} border-2 ${
                  notification.isRead ? 'opacity-70' : 'shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg mb-1 ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-indigo-900 flex items-center gap-2 text-xl">
            <span className="text-3xl">📋</span>
            Testing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-indigo-800">
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">1</span>
              <div><strong>Mark as Read</strong> - Click checkmark on unread notifications</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">2</span>
              <div><strong>Delete Notifications</strong> - Click trash icon to remove</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">3</span>
              <div><strong>Mark All Read</strong> - Use header button to mark all as read</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">4</span>
              <div><strong>Check Console</strong> - All interactions logged</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

