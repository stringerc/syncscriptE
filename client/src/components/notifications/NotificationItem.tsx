import React from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { Notification } from '@/types/notification'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Clock, 
  Calendar, 
  Zap, 
  Trophy, 
  AlertTriangle, 
  Info,
  X,
  Check,
  ExternalLink
} from 'lucide-react'

interface NotificationItemProps {
  notification: Notification
}

const getNotificationIcon = (type: string, priority: string) => {
  const iconClass = cn(
    "h-4 w-4",
    priority === 'urgent' ? "text-red-500" :
    priority === 'high' ? "text-orange-500" :
    priority === 'medium' ? "text-blue-500" :
    "text-gray-500"
  )

  switch (type) {
    case 'task_reminder':
    case 'deadline_warning':
      return <Clock className={iconClass} />
    case 'event_reminder':
      return <Calendar className={iconClass} />
    case 'energy_alert':
      return <Zap className={iconClass} />
    case 'achievement':
      return <Trophy className={iconClass} />
    case 'system':
      return <Info className={iconClass} />
    default:
      return <AlertTriangle className={iconClass} />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 border-red-200 text-red-800'
    case 'high':
      return 'bg-orange-100 border-orange-200 text-orange-800'
    case 'medium':
      return 'bg-blue-100 border-blue-200 text-blue-800'
    case 'low':
      return 'bg-gray-100 border-gray-200 text-gray-800'
    default:
      return 'bg-gray-100 border-gray-200 text-gray-800'
  }
}

const formatTimestamp = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { markAsRead, deleteNotification } = useNotifications()

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification(notification.id)
  }

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }

  const isExpired = notification.expiresAt && new Date(notification.expiresAt) < new Date()

  if (isExpired) {
    return null // Don't render expired notifications
  }

  return (
    <div
      className={cn(
        "p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors",
        "hover:bg-gray-50 dark:hover:bg-gray-800",
        !notification.read && "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn(
                  "text-sm font-medium truncate",
                  !notification.read && "font-semibold"
                )}>
                  {notification.title}
                </h4>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", getPriorityColor(notification.priority))}
                >
                  {notification.priority}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {notification.message}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {formatTimestamp(notification.timestamp)}
                </span>
                
                {notification.actionText && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    {notification.actionText}
                    <ExternalLink className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="h-6 w-6 p-0"
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                title="Delete notification"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
