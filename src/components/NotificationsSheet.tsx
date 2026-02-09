import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from './ui/sheet';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Users, 
  Zap,
  Clock,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'reminder';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: 'check' | 'alert' | 'calendar' | 'users' | 'zap';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Task Completed',
    message: 'You completed "Q4 Budget Review" ahead of schedule!',
    time: '5 minutes ago',
    read: false,
    icon: 'check'
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Upcoming Meeting',
    message: 'Team sync starts in 30 minutes',
    time: '25 minutes ago',
    read: false,
    icon: 'calendar'
  },
  {
    id: '3',
    type: 'warning',
    title: 'Low Energy Alert',
    message: 'Your cognitive reserve is at 35%. Consider taking a break.',
    time: '1 hour ago',
    read: false,
    icon: 'zap'
  },
  {
    id: '4',
    type: 'info',
    title: 'New Team Member',
    message: 'Sarah Chen joined your workspace',
    time: '2 hours ago',
    read: true,
    icon: 'users'
  },
  {
    id: '5',
    type: 'warning',
    title: 'Weather Alert',
    message: 'Heavy rain expected at 5 PM. Reschedule outdoor activities.',
    time: '3 hours ago',
    read: true,
    icon: 'alert'
  },
  {
    id: '6',
    type: 'info',
    title: 'Resonance Optimized',
    message: 'Your daily schedule has been optimized for peak performance',
    time: '4 hours ago',
    read: true,
    icon: 'zap'
  },
];

function getNotificationIcon(icon: string) {
  switch (icon) {
    case 'check':
      return CheckCircle2;
    case 'alert':
      return AlertCircle;
    case 'calendar':
      return Calendar;
    case 'users':
      return Users;
    case 'zap':
      return Zap;
    default:
      return Bell;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'success':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'warning':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'info':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'reminder':
      return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    default:
      return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
}

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-[#1e2128] border-gray-800 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-400" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            Stay updated with your tasks, meetings, and system alerts
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No notifications</p>
              <p className="text-gray-500 text-sm">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.icon);
              const colorClass = getNotificationColor(notification.type);
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    relative bg-[#2a2d35] rounded-lg p-4 border transition-all
                    ${notification.read 
                      ? 'border-gray-700 opacity-60' 
                      : 'border-gray-600 hover:border-teal-500/30'
                    }
                    cursor-pointer group
                  `}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${colorClass} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-white font-medium">{notification.title}</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded"
                        >
                          <X className="w-3 h-3 text-gray-400 hover:text-white" />
                        </button>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {notification.time}
                      </div>
                    </div>

                    {!notification.read && (
                      <div className="w-2 h-2 bg-teal-400 rounded-full shrink-0 mt-2" />
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
