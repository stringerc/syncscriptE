import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Bell, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { Notification } from '@/shared/types'

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications')
      return response.data.data
    }
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.patch(`/notifications/${notificationId}/read`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete(`/notifications/${notificationId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({
        title: "Notification deleted",
        description: "The notification has been removed."
      })
    }
  })

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId)
  }

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId)
  }

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <p className="text-xs text-muted-foreground">
            {unreadCount} unread notifications
          </p>
        </div>
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="max-h-64 overflow-y-auto">
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <div className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(notification.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                {index < notifications.length - 1 && <DropdownMenuSeparator />}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        )}
        
        {notifications && notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
