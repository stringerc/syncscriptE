import { useState, useEffect, useCallback, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, Clock, MapPin, DollarSign, Trash2, Paperclip, RefreshCw, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { Event } from '@/shared/types'
import { EventModal } from '@/components/EventModal'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { ResourcesDrawer } from '@/components/ResourcesDrawer'
import { BudgetChip } from '@/components/budget/BudgetChip'

// Calendar Task Item Component (for bullet list in event cards)
const CalendarTaskItem = memo(({ task, onResourcesClick }: {
  task: any,
  onResourcesClick?: (taskId: string) => void
}) => {
  // Fetch resources for this task
  const { data: taskResourceData } = useQuery({
    queryKey: ['task-resources', task.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/resources/tasks/${task.id}/resources`)
        return response.data.data.resources || []
      } catch (error) {
        return []
      }
    },
    enabled: !!task.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
  
  const resourceCount = Array.isArray(taskResourceData) ? taskResourceData.length : 0
  const resourceNames = Array.isArray(taskResourceData) 
    ? taskResourceData.map((r: any) => r.title || 'Untitled')
    : []
  const tooltipText = resourceNames.length > 0 
    ? `Resources: ${resourceNames.join(', ')}` 
    : `${resourceCount} resources`

  return (
    <div 
      className={`flex items-center gap-1 text-xs text-muted-foreground transition-all duration-200 ${
        task.status === 'COMPLETED' 
          ? 'line-through text-green-600' 
          : ''
      }`}
    >
      <span>{task.status === 'COMPLETED' ? '✓' : '•'} {task.title}</span>
      {resourceCount > 0 && (
        <Badge 
          variant="outline" 
          className="text-[10px] px-1 py-0 h-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
          title={tooltipText}
          onClick={(e) => {
            e.stopPropagation()
            onResourcesClick?.(task.id)
          }}
        >
          <Paperclip className="w-2 h-2 mr-0.5" />
          {resourceCount}
        </Badge>
      )}
      <BudgetChip taskId={task.id} className="text-[10px] px-1 py-0 h-4" />
    </div>
  )
})

export function CalendarPage() {
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    budgetImpact: 0
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [eventWeatherData, setEventWeatherData] = useState<Record<string, { emoji: string; temperature: number; condition: string } | null>>({})
  const [eventPreparationTasks, setEventPreparationTasks] = useState<Record<string, any[]>>({})
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null)
  const [resourcesDrawerTaskId, setResourcesDrawerTaskId] = useState<string | null>(null)
  const [syncTimeRange, setSyncTimeRange] = useState('30') // Default to 30 days

  const { toast} = useToast()
  const queryClient = useQueryClient()

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['events', showPastEvents],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (showPastEvents) {
        params.append('includePast', 'true')
      }
      const response = await api.get(`/calendar?${params.toString()}`)
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  })

  // Check Google Calendar connection status
  const { data: googleCalendarStatus } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: async () => {
      const response = await api.get('/google-calendar/status')
      return response.data
    },
    retry: 1,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Sync from Google Calendar mutation
  const syncFromGoogleMutation = useMutation({
    mutationFn: async ({ timeRange }: { timeRange: string }) => {
      const response = await api.post('/calendar/sync-from-google', {
        calendarId: 'primary',
        timeRange
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      const { stats } = data.data
      toast({
        title: "Sync Complete!",
        description: `Synced ${stats.created} new events and updated ${stats.updated} existing events from Google Calendar`,
        duration: 5000
      })
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.response?.data?.message || "Failed to sync events from Google Calendar",
        variant: "destructive"
      })
    }
  })

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await api.post('/calendar', eventData)
      return response.data
    },
    onSuccess: () => {
      // Only invalidate events cache, not dashboard
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setNewEvent({ title: '', description: '', startTime: '', endTime: '', location: '', budgetImpact: 0 })
      setShowAddForm(false)
      toast({
        title: "Event Created!",
        description: "Your new event has been added to your calendar."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create event",
        variant: "destructive"
      })
    }
  })

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await api.delete(`/calendar/${eventId}`)
      return response.data
    },
    onSuccess: () => {
      // Only invalidate events cache, not dashboard
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast({
        title: "Event Deleted",
        description: "The event has been removed successfully."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete event",
        variant: "destructive"
      })
    }
  })

  const handleCreateEvent = () => {
    if (!newEvent.title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive"
      })
      return
    }
    if (!newEvent.startTime || !newEvent.endTime) {
      toast({
        title: "Error",
        description: "Start and end times are required",
        variant: "destructive"
      })
      return
    }
    
    // Convert datetime-local strings to proper ISO datetime strings
    const eventData = {
      ...newEvent,
      startTime: new Date(newEvent.startTime).toISOString(),
      endTime: new Date(newEvent.endTime).toISOString()
    }
    
    createEventMutation.mutate(eventData)
  }

    const handleDeleteEvent = (eventId: string) => {
      // Find the event to get its title
      const event = events?.find(e => e.id === eventId)
      if (event) {
        setEventToDelete({ id: eventId, title: event.title })
        setShowDeleteConfirm(true)
      }
    }

    const handleConfirmDelete = () => {
      if (eventToDelete) {
        deleteEventMutation.mutate(eventToDelete.id)
        setShowDeleteConfirm(false)
        setEventToDelete(null)
      }
    }

    const handleViewEvent = (event: Event) => {
      setSelectedEvent(event)
      setIsModalOpen(true)
    }

    const handleCloseModal = () => {
      setIsModalOpen(false)
      setSelectedEvent(null)
    }

    const toggleEventExpansion = (eventId: string) => {
      setExpandedEvents(prev => {
        const newSet = new Set(prev)
        if (newSet.has(eventId)) {
          newSet.delete(eventId)
        } else {
          newSet.add(eventId)
        }
        return newSet
      })
    }

    // Fetch weather data for events
    const fetchEventWeather = useCallback(async (events: Event[]) => {
      if (events.length === 0) return

      try {
        const response = await api.post('/location/events/weather', { events })
        
        const weatherData: Record<string, { emoji: string; temperature: number; condition: string } | null> = {}
        
        response.data.data.eventsWithWeather.forEach((item: any) => {
          weatherData[item.eventId] = item.weather
        })
        setEventWeatherData(weatherData)
      } catch (error) {
        console.error('Failed to fetch event weather:', error)
      }
    }, [])

    // Fetch preparation tasks for events
    const fetchEventPreparationTasks = useCallback(async (events: Event[]) => {
      if (events.length === 0) return

      try {
        const preparationTasksData: Record<string, any[]> = {}
        
        // Fetch preparation tasks for each event
        await Promise.all(events.map(async (event) => {
          try {
            const response = await api.get(`/tasks?eventId=${event.id}`)
            preparationTasksData[event.id] = response.data.data || []
          } catch (error) {
            console.error(`Failed to fetch preparation tasks for event ${event.id}:`, error)
            preparationTasksData[event.id] = []
          }
        }))
        
        setEventPreparationTasks(preparationTasksData)
      } catch (error) {
        console.error('Failed to fetch event preparation tasks:', error)
      }
    }, [])

    // Fetch weather data and preparation tasks when events change
    useEffect(() => {
      if (events) {
        fetchEventWeather(events)
        fetchEventPreparationTasks(events)
      }
    }, [events, fetchEventWeather, fetchEventPreparationTasks])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Manage your events and schedule
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Google Calendar Sync Section */}
          {googleCalendarStatus?.data?.connected && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-muted-foreground">Sync:</label>
                <select
                  value={syncTimeRange}
                  onChange={(e) => setSyncTimeRange(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncFromGoogleMutation.mutate({ timeRange: syncTimeRange })}
                disabled={syncFromGoogleMutation.isPending}
                className="flex items-center space-x-1"
              >
                {syncFromGoogleMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Sync from Google</span>
              </Button>
            </div>
          )}
          
          <Button onClick={() => {
            setSelectedEvent(null)
            setIsModalOpen(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Google Calendar Status Banner */}
      {!googleCalendarStatus?.data?.connected ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Connect Google Calendar</h3>
                  <p className="text-sm text-blue-700">
                    Sync your Google Calendar events to see them in your events list
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/google-calendar'}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Connect Google Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-900">Google Calendar Connected</h3>
                  <p className="text-sm text-green-700">
                    Your Google Calendar is connected. Use the sync button above to import events.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/google-calendar'}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Manage Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>Add a new event to your calendar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Title</label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Enter event title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Enter event description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <Input
                  type="datetime-local"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <Input
                  type="datetime-local"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <Input
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Enter event location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Budget Impact</label>
              <Input
                type="number"
                value={newEvent.budgetImpact}
                onChange={(e) => setNewEvent({ ...newEvent, budgetImpact: parseFloat(e.target.value) || 0 })}
                placeholder="Enter budget impact amount"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleCreateEvent}
                disabled={createEventMutation.isPending}
              >
                {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Your Events</span>
              </CardTitle>
              <CardDescription>
                {events?.length || 0} events scheduled
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPastEvents(!showPastEvents)}
            >
              {showPastEvents ? 'Hide Past Events' : 'Show Past Events'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {events && events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No events yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Create your first event to get started with calendar management.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {events?.map((event) => {
                const isPastEvent = new Date(event.startTime) < new Date()
                return (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-4 rounded-lg border bg-card ${
                      isPastEvent ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        {event.calendarProvider === 'google' && (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            G
                          </span>
                        )}
                        {isPastEvent && (
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            Past Event
                          </span>
                        )}
                        {event.aiGenerated && (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600">
                            AI Generated
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {event.description}
                        </p>
                      )}
                      
                      {/* Preparation Tasks */}
                      {eventPreparationTasks[event.id] && eventPreparationTasks[event.id].length > 0 && (
                        <div className="mt-2 mb-2">
                          <div className="text-xs text-muted-foreground mb-1">Prep tasks:</div>
                          <div className="space-y-1">
                            {(expandedEvents.has(event.id) ? eventPreparationTasks[event.id] : eventPreparationTasks[event.id].slice(0, 3))
                              .sort((a: any, b: any) => {
                                const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
                                return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
                              })
                              .map((task: any) => (
                              <CalendarTaskItem 
                                key={task.id}
                                task={task}
                                onResourcesClick={setResourcesDrawerTaskId}
                              />
                            ))}
                            {eventPreparationTasks[event.id].length > 3 && (
                              <button
                                onClick={() => toggleEventExpansion(event.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer transition-colors duration-200"
                              >
                                {expandedEvents.has(event.id) ? 'Show less' : `+${eventPreparationTasks[event.id].length - 3} more`}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(event.startTime)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.startTime).toLocaleDateString()} {new Date(event.startTime).toLocaleTimeString()}
                        </div>
                        {event.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                            {eventWeatherData[event.id]?.emoji && (
                              <span title={`${eventWeatherData[event.id]?.condition}, ${eventWeatherData[event.id]?.temperature}°F`}>
                                {eventWeatherData[event.id]?.emoji}
                              </span>
                            )}
                          </div>
                        )}
                        {event.budgetImpact !== null && event.budgetImpact !== undefined && event.budgetImpact > 0 && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>${event.budgetImpact.toFixed(0)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {/* Prep relationship indicator - top right */}
                      {(() => {
                        // Check if this event was created from a task that was preparing for another event
                        // We'll look for tasks that are linked to this event and also have their own eventId
                        // (meaning they're prep tasks for other events)
                        const linkedTasks = eventPreparationTasks[event.id] || [];
                        console.log(`🔍 Checking event ${event.id} (${event.title}):`, {
                          linkedTasks,
                          linkedTasksLength: linkedTasks.length,
                          eventPreparationTasksKeys: Object.keys(eventPreparationTasks)
                        });
                        
                        const prepTask = linkedTasks.find((task: any) => 
                          task.eventId && task.eventId !== event.id
                        );
                        
                        if (prepTask) {
                          console.log(`✅ Found prep task for event ${event.id}:`, prepTask);
                          // This task is preparing for another event, so this event should show that relationship
                          // We need to find the parent event to get its title
                          const parentEvent = events?.find((e: any) => e.id === prepTask.eventId);
                          if (parentEvent) {
                            console.log(`✅ Found parent event:`, parentEvent);
                            return (
                              <div className="text-xs text-blue-600 mb-2">
                                Prep for: {parentEvent.title}
                              </div>
                            );
                          }
                        }
                        
                        // Fallback: Check if event title suggests it's a prep event
                        // Look for events that might be prep events based on their titles and timing
                        const prepKeywords = ['prepare', 'coordinate', 'create', 'plan', 'organize', 'set up'];
                        const isLikelyPrepEvent = prepKeywords.some(keyword => 
                          event.title.toLowerCase().includes(keyword)
                        );
                        
                        if (isLikelyPrepEvent && events && Array.isArray(events) && events.length > 1) {
                          // Find the main event (usually the one without prep keywords and earliest time)
                          const mainEvents = events.filter((e: any) => 
                            !prepKeywords.some(keyword => e.title.toLowerCase().includes(keyword)) &&
                            e.id !== event.id
                          );
                          
                          if (mainEvents.length > 0) {
                            // Find the closest main event by time
                            const closestMainEvent = mainEvents.reduce((closest: any, current: any) => {
                              const currentTimeDiff = Math.abs(new Date(current.startTime).getTime() - new Date(event.startTime).getTime());
                              const closestTimeDiff = Math.abs(new Date(closest.startTime).getTime() - new Date(event.startTime).getTime());
                              return currentTimeDiff < closestTimeDiff ? current : closest;
                            });
                            
                            console.log(`🔄 Fallback: Found likely prep event ${event.id} for main event:`, closestMainEvent);
                            return (
                              <div className="text-xs text-blue-600 mb-2">
                                Prep for: {closestMainEvent.title}
                              </div>
                            );
                          }
                        }
                        
                        return null;
                      })()}
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewEvent(event)}
                        >
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
        </Card>

        {/* Event Modal */}
        <EventModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onEventUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
          }}
          onEventCreated={(createdEvent) => {
            setSelectedEvent(createdEvent)
          }}
        />

        {/* Delete Event Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false)
            setEventToDelete(null)
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Event"
          message="Are you sure you want to permanently delete this event? All associated tasks and preparation items will also be removed."
          confirmText="Delete Forever"
          cancelText="Keep Event"
          variant="delete"
          isLoading={deleteEventMutation.isPending}
          eventTitle={eventToDelete?.title}
        />
      
      <ResourcesDrawer
        taskId={resourcesDrawerTaskId || ''}
        isOpen={!!resourcesDrawerTaskId}
        onClose={() => setResourcesDrawerTaskId(null)}
      />
      </div>
    )
  }