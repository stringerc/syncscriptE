import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Plus, Clock, MapPin, DollarSign, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { Event } from '@/shared/types'
import { EventModal } from '@/components/EventModal'

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

  const { toast } = useToast()
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
      if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        deleteEventMutation.mutate(eventId)
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
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

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
                              <div 
                                key={task.id} 
                                className={`text-xs text-muted-foreground transition-all duration-200 ${
                                  task.status === 'COMPLETED' 
                                    ? 'line-through text-green-600' 
                                    : ''
                                }`}
                              >
                                {task.status === 'COMPLETED' ? '✓' : '•'} {task.title}
                              </div>
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
                            <span>{formatCurrency(event.budgetImpact)}</span>
                          </div>
                        )}
                      </div>
                    </div>
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
        />
      </div>
    )
  }