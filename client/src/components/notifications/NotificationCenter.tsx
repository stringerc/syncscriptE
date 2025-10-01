import React, { useState } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { Bell, X, Check, Trash2, Settings, Filter, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NotificationItem } from './NotificationItem'
import { NotificationPreferences } from './NotificationPreferences'
import { EventEndedNotification } from '@/components/EventEndedNotification'
import { cn } from '@/lib/utils'

interface NotificationCenterProps {
  className?: string
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const {
    notifications,
    unreadCount,
    stats,
    markAllAsRead,
    clearAllNotifications,
    isLoading
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedEventEndedNotification, setSelectedEventEndedNotification] = useState<any>(null)
  const [showEventEndedModal, setShowEventEndedModal] = useState(false)

  const unreadNotifications = notifications?.filter(n => !n.isRead) || []
  const allNotifications = notifications || []
  const eventEndedNotifications = notifications?.filter(n => n.type === 'event_ended') || []

  const handleEventEndedNotificationClick = (notification: any) => {
    setSelectedEventEndedNotification(notification)
    setShowEventEndedModal(true)
    setIsOpen(false) // Close the notification center
  }

  const handleEventEndedNotificationRead = (notificationId: string) => {
    // Mark notification as read
    // This would typically call an API to mark the notification as read
    console.log('Marking notification as read:', notificationId)
  }

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return unreadNotifications
      case 'high':
        return notifications?.filter(n => n.priority === 'high' || n.priority === 'urgent') || []
      case 'tasks':
        return notifications?.filter(n => n.type === 'task_reminder' || n.type === 'deadline_warning') || []
      case 'events':
        return notifications?.filter(n => n.type === 'event_reminder' || n.type === 'event_ended') || []
      case 'energy':
        return notifications?.filter(n => n.type === 'energy_alert') || []
      default:
        return allNotifications
    }
  }

  const filteredNotifications = getFilteredNotifications()

  return (
    <div className={cn("relative", className)}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {/* Blue dot for event-ended notifications */}
        {eventEndedNotifications.filter(n => !n.isRead).length > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900"></div>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 top-12 z-50 w-96 max-h-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllAsRead()}
                      className="text-xs"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4 pb-2">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all" className="text-xs">
                    All
                    {allNotifications.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {allNotifications.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs">
                    Unread
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-1 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="high" className="text-xs">High</TabsTrigger>
                  <TabsTrigger value="tasks" className="text-xs">Tasks</TabsTrigger>
                  <TabsTrigger value="events" className="text-xs">Events</TabsTrigger>
                  <TabsTrigger value="energy" className="text-xs">Energy</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                <ScrollArea className="h-[400px]">
                  {isLoading ? (
                    <div className="p-8 text-center text-gray-500">
                      Loading notifications...
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No notifications</p>
                      {activeTab !== 'all' && (
                        <p className="text-sm">Try switching to a different filter</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredNotifications.map((notification) => {
                        // Special handling for event-ended notifications
                        if (notification.type === 'event_ended') {
                          return (
                            <div
                              key={notification.id}
                              className="p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                              onClick={() => handleEventEndedNotificationClick(notification)}
                            >
                              <div className="flex items-start space-x-3">
                                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                                      {notification.title}
                                    </h4>
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                    Click to manage incomplete tasks
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        
                        // Regular notification handling
                        return (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                          />
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('preferences')}>
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                </div>
                {notifications && notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearAllNotifications()}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Event Ended Notification Modal */}
      {selectedEventEndedNotification && (
        <EventEndedNotification
          notification={selectedEventEndedNotification}
          isOpen={showEventEndedModal}
          onClose={() => {
            setShowEventEndedModal(false)
            setSelectedEventEndedNotification(null)
          }}
          onNotificationRead={handleEventEndedNotificationRead}
        />
      )}
    </div>
  )
}
