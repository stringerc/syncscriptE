import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { useAnimation } from '@/contexts/AnimationContext'
import { 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  Target,
  Clock,
  AlertCircle,
  Trophy,
  Trash2,
  Sparkles,
  Eye,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Star,
  Flame,
  MapPin,
  CheckCircle
} from 'lucide-react'
import { formatDate, formatTime, formatCurrency, getPriorityColor } from '@/lib/utils'
import { EventModal } from '@/components/EventModal'
import { TaskModal } from '@/components/TaskModal'
import { Task, Event, Achievement, Streak, Notification } from '@/shared/types'

interface DashboardData {
  user: {
    id: string
    name: string
    email: string
    energyLevel: number
    timezone: string
  }
  todayTasks: Task[]
  upcomingEvents: Event[]
  recentAchievements: Achievement[]
  activeStreaks: Streak[]
  unreadNotifications: Notification[]
}

// Memoized task item component for performance
const TaskItem = memo(({ task, onComplete, onDelete, onView, order, showOrder, events }: { 
  task: Task, 
  onComplete: (id: string) => void,
  onDelete: (id: string) => void,
  onView: (id: string) => void,
  order?: number,
  showOrder?: boolean,
  events?: Event[]
}) => {
  const relatedEvent = events?.find(event => event.id === task.eventId)
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          {showOrder && order && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {order}
            </div>
          )}
          <h4 className="font-medium text-sm">{task.title}</h4>
          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {task.description}
          </p>
        )}
        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
          {task.estimatedDuration && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{task.estimatedDuration}m</span>
            </div>
          )}
          {task.budgetImpact && (
            <div className="flex items-center space-x-1">
              <DollarSign className="w-3 h-3" />
              <span>{formatCurrency(task.budgetImpact)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end space-y-2">
        <div className="flex space-x-2">
          {/* View Button */}
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onView(task.id)}
            title="View task details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          {/* Complete Button */}
          {task.status !== 'COMPLETED' && (
            <Button 
              size="sm" 
              variant="default"
              onClick={() => onComplete(task.id)}
              className="bg-green-600 hover:bg-green-700"
              title="Complete task"
            >
              <CheckSquare className="w-4 h-4" />
            </Button>
          )}
          
          {/* Delete Button */}
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => onDelete(task.id)}
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        {relatedEvent && (
          <div className="text-xs text-blue-600">
            Prep for: {relatedEvent.title}
          </div>
        )}
      </div>
    </div>
  )
})

// Memoized event item component for performance
const EventItem = memo(({ event, onView, onDelete, weatherData, preparationTasks, events }: { 
  event: Event, 
  onView: (id: string) => void, 
  onDelete: (id: string) => void,
  weatherData?: { emoji: string; temperature: number; condition: string } | null,
  preparationTasks?: any[],
  events?: Event[]
}) => {
  const [showAllTasks, setShowAllTasks] = useState(false)
  
  // Removed excessive logging for performance
  return (
  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
    <div className="flex-1 pr-8">
      <h4 className="font-medium text-sm">{event.title}</h4>
      {event.description && (
        <p className="text-xs text-muted-foreground mt-1">
          {event.description}
        </p>
      )}
      
      {/* Preparation Tasks */}
      {preparationTasks && preparationTasks.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-muted-foreground mb-1">Prep tasks:</div>
          <div className="space-y-1">
            {(showAllTasks ? preparationTasks : preparationTasks.slice(0, 3))
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
            {preparationTasks.length > 3 && (
              <button
                onClick={() => setShowAllTasks(!showAllTasks)}
                className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer transition-colors duration-200"
              >
                {showAllTasks ? 'Show less' : `+${preparationTasks.length - 3} more`}
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
              <span>{event.location}</span>
              <span 
                title={weatherData ? `${weatherData.condition}, ${weatherData.temperature}°F` : 'Weather data unavailable'}
                className="text-lg"
                style={{ fontSize: '16px' }}
              >
                {weatherData?.emoji || '🌤️'}
              </span>
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
    <div className="flex flex-col items-end space-y-2">
      {/* Prep relationship indicator - top right with proper spacing */}
      {(() => {
        // Check if this event was created from a task that was preparing for another event
        // We'll look for tasks that are linked to this event and also have their own eventId
        // (meaning they're prep tasks for other events)
        const linkedTasks = preparationTasks || [];
        console.log(`🔍 Dashboard EventItem: Checking event ${event.id} (${event.title}):`, {
          linkedTasks,
          linkedTasksLength: linkedTasks.length,
          eventsLength: events?.length
        });
        
        const prepTask = linkedTasks.find((task: any) => 
          task.eventId && task.eventId !== event.id
        );
        
        if (prepTask) {
          console.log(`✅ Dashboard EventItem: Found prep task for event ${event.id}:`, prepTask);
          // This task is preparing for another event, so this event should show that relationship
          // We need to find the parent event to get its title
          const parentEvent = events?.find((e: any) => e.id === prepTask.eventId);
          if (parentEvent) {
            console.log(`✅ Dashboard EventItem: Found parent event:`, parentEvent);
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
        
        if (isLikelyPrepEvent && events && events.length > 1) {
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
            
            console.log(`🔄 Dashboard EventItem: Fallback: Found likely prep event ${event.id} for main event:`, closestMainEvent);
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
          onClick={() => onView(event.id)}
        >
          View
        </Button>
        <Button 
          size="sm" 
          variant="destructive"
          onClick={() => onDelete(event.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
  )
})

export function DashboardPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token, user: authUser } = useAuthStore()
  const { animationEnabled, toggleAnimation } = useAnimation()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [eventWeatherData, setEventWeatherData] = useState<Record<string, { emoji: string; temperature: number; condition: string } | null>>({})
  const [currentWeather, setCurrentWeather] = useState<{ emoji: string; temperature: number; condition: string; location: string } | null>(null)
  const [eventPreparationTasks, setEventPreparationTasks] = useState<Record<string, any[]>>({})
  const [isHydrated, setIsHydrated] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null)

  // Wait for Zustand store to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Only refresh dashboard data when energy level changes (for the header display)
  useEffect(() => {
    const handleFocus = () => {
      // Only invalidate queries, don't force refetch
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [queryClient])

  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/user/dashboard')
      return response.data.data
    },
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Always refetch when component mounts
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    retry: 1, // Only retry once for faster error handling
    retryDelay: 500, // Faster retry
    enabled: !!token && isHydrated // Only run if user is authenticated and store is hydrated
  })

  // Fetch tasks directly from /tasks endpoint to match Tasks page
  const { data: allTasks } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: !!token && isHydrated
  })

  // Filter and sort tasks the same way as Tasks page
  const standardizedTasks = useMemo(() => {
    if (!allTasks) return []
    
    // Filter out completed tasks for today's tasks
    const pendingTasks = allTasks.filter(task => task.status !== 'COMPLETED')
    
    // Sort by priority: URGENT > HIGH > MEDIUM > LOW
    return pendingTasks.sort((a, b) => {
      const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [allTasks])

  // Fetch gamification data for dashboard widget
  const { data: gamificationData } = useQuery({
    queryKey: ['gamification-summary'],
    queryFn: async () => {
      const response = await api.get('/gamification')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!token && isHydrated
  })



  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await api.delete(`/calendar/${eventId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.delete(`/tasks/${taskId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: "Task Deleted",
        description: "The task has been removed successfully."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete task",
        variant: "destructive"
      })
    }
  })

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string, status: string }) => {
      console.log('Updating task status:', { taskId, status })
      try {
        const response = await api.patch(`/tasks/${taskId}/status`, { status })
        console.log('Status update response:', response.data)
        return response.data
      } catch (error) {
        console.error('Status update error:', error)
        throw error
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: "Status Updated!",
        description: `Task status changed to ${variables.status.replace('_', ' ').toLowerCase()}`
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update task status",
        variant: "destructive"
      })
    }
  })

  const prioritizeTasksMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const response = await api.post('/ai/prioritize-tasks', { taskIds })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: "Tasks Prioritized!",
        description: `AI has prioritized ${data.data.successfullyUpdated} out of ${data.data.totalRequested} tasks using the Eisenhower Matrix.`
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to prioritize tasks",
        variant: "destructive"
      })
    }
  })


  const handleDeleteTask = useCallback((taskId: string) => {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      deleteTaskMutation.mutate(taskId)
    }
  }, [deleteTaskMutation])

  const handleStatusChange = useCallback((taskId: string, newStatus: string) => {
    console.log('🔄 Dashboard handleStatusChange called:', { taskId, newStatus })
    updateTaskStatusMutation.mutate({ taskId, status: newStatus })
  }, [updateTaskStatusMutation])

  const handleDeleteEvent = useCallback((eventId: string) => {
    // Find the event to get its title
    const event = dashboardData?.upcomingEvents?.find(e => e.id === eventId)
    if (event) {
      setEventToDelete({ id: eventId, title: event.title })
      setShowDeleteConfirm(true)
    }
  }, [dashboardData])

  const handleConfirmDelete = useCallback(() => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete.id)
      setShowDeleteConfirm(false)
      setEventToDelete(null)
    }
  }, [deleteEventMutation, eventToDelete])

  const handlePrioritizeTasks = useCallback(() => {
    if (!standardizedTasks || standardizedTasks.length === 0) {
      toast({
        title: "No Tasks to Prioritize",
        description: "You don't have any tasks to prioritize right now.",
        variant: "destructive"
      })
      return
    }

    const taskIds = standardizedTasks.map(task => task.id)
    prioritizeTasksMutation.mutate(taskIds)
  }, [standardizedTasks, prioritizeTasksMutation, toast])

  const handleViewEvent = useCallback((eventId: string) => {
    const event = dashboardData?.upcomingEvents.find(e => e.id === eventId)
    if (event) {
      setSelectedEvent(event)
      setIsModalOpen(true)
    }
  }, [dashboardData?.upcomingEvents])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }, [])

  const handleViewTask = useCallback((taskId: string) => {
    const task = standardizedTasks.find(t => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setIsTaskModalOpen(true)
    }
  }, [standardizedTasks])

  const handleCloseTaskModal = useCallback(() => {
    setIsTaskModalOpen(false)
    setSelectedTask(null)
  }, [])

  const handleTaskUpdated = useCallback((updatedTask: Task) => {
    console.log('🎯 DashboardPage: handleTaskUpdated called with:', updatedTask)
    setSelectedTask(updatedTask)
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    
    // If this was a prep task that was completed, refresh the preparation tasks for the related event
    const relatedEventId = updatedTask.eventId
    if (relatedEventId && updatedTask.status === 'COMPLETED') {
      console.log('🎯 DashboardPage: Refreshing prep tasks for event:', relatedEventId)
      // Clear the cached preparation tasks data
      localStorage.removeItem('prep-tasks-last-fetch')
      
      // Refetch preparation tasks for this specific event
      api.get(`/tasks?eventId=${relatedEventId}`)
        .then(prepResponse => {
          const tasks = prepResponse.data.data || []
          
          // Sort tasks by priority: URGENT > HIGH > MEDIUM > LOW
          const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
          const sortedTasks = tasks.sort((a: any, b: any) => {
            const aPriority = priorityOrder[a.priority] || 0
            const bPriority = priorityOrder[b.priority] || 0
            return bPriority - aPriority
          })
          
          setEventPreparationTasks(prev => ({
            ...prev,
            [relatedEventId]: sortedTasks
          }))
        })
        .catch(error => {
          console.error('Failed to refresh preparation tasks:', error)
        })
    }
  }, [queryClient])

  const handleTaskDeleted = useCallback((taskId: string) => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }, [queryClient])

  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      console.log('🎯 DashboardPage: Completing task:', taskId)
      console.log('🎯 DashboardPage: Making API call to:', `/tasks/${taskId}/status`)
      console.log('🎯 DashboardPage: Request payload:', { status: 'COMPLETED' })
      
      const response = await api.patch(`/tasks/${taskId}/status`, { status: 'COMPLETED' })
      console.log('🎯 DashboardPage: Task completion response:', response.data)
      
      toast({
        title: "Task Completed!",
        description: "Great job completing this task!"
      })
      
      // Find the completed task to check if it's a prep task
      const completedTask = allTasks?.find(t => t.id === taskId)
      const relatedEventId = completedTask?.eventId
      
      // Invalidate and refetch dashboard data
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.refetchQueries({ queryKey: ['dashboard'] })
      
      // If this was a prep task, also refresh the preparation tasks for the related event
      if (relatedEventId) {
        console.log('🎯 DashboardPage: Refreshing prep tasks for event:', relatedEventId)
        // Clear the cached preparation tasks data
        localStorage.removeItem('prep-tasks-last-fetch')
        
        // Refetch preparation tasks for this specific event
        try {
          const prepResponse = await api.get(`/tasks?eventId=${relatedEventId}`)
          const tasks = prepResponse.data.data || []
          
          // Sort tasks by priority: URGENT > HIGH > MEDIUM > LOW
          const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
          const sortedTasks = tasks.sort((a: any, b: any) => {
            const aPriority = priorityOrder[a.priority] || 0
            const bPriority = priorityOrder[b.priority] || 0
            return bPriority - aPriority
          })
          
          setEventPreparationTasks(prev => ({
            ...prev,
            [relatedEventId]: sortedTasks
          }))
        } catch (error) {
          console.error('Failed to refresh preparation tasks:', error)
        }
      }
    } catch (error: any) {
      console.error('🎯 DashboardPage: Task completion failed:', error)
      console.error('🎯 DashboardPage: Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      })
      toast({
        title: "Failed to Complete Task",
        description: error.response?.data?.error || error.message || "Failed to complete task",
        variant: "destructive"
      })
    }
  }, [queryClient, toast, allTasks])

  // Fetch weather data for events
  const fetchEventWeather = useCallback(async (events: Event[]) => {
    if (events.length === 0) return

    // Check if we already have recent weather data (within last 15 minutes)
    const lastFetch = localStorage.getItem('event-weather-last-fetch')
    const now = Date.now()
    if (lastFetch && (now - parseInt(lastFetch)) < 15 * 60 * 1000) {
      console.log('🌤️ Using cached event weather data')
      return
    }

    try {
      console.log('🌤️ Fetching weather for events:', events.map(e => ({ id: e.id, title: e.title, location: e.location })))
      const response = await api.post('/location/events/weather', { events })
      console.log('🌤️ Weather API response:', response.data)
      
      const weatherData: Record<string, { emoji: string; temperature: number; condition: string } | null> = {}
      
      response.data.data.eventsWithWeather.forEach((item: any) => {
        console.log('🌤️ Weather for event:', item.eventId, item.weather)
        console.log('🌤️ Weather emoji:', item.weather?.emoji)
        weatherData[item.eventId] = item.weather
      })
      
      console.log('🌤️ Final weather data:', weatherData)
      setEventWeatherData(weatherData)
      
      // Cache the fetch time
      localStorage.setItem('event-weather-last-fetch', now.toString())
    } catch (error) {
      console.error('Failed to fetch event weather:', error)
    }
  }, [])

  // Fetch preparation tasks for events (with caching)
  const fetchEventPreparationTasks = useCallback(async (events: Event[], forceRefresh = false) => {
    if (events.length === 0) return

    // Check if we already have recent preparation tasks data (within last 5 minutes)
    const lastFetch = localStorage.getItem('prep-tasks-last-fetch')
    const now = Date.now()
    if (!forceRefresh && lastFetch && (now - parseInt(lastFetch)) < 5 * 60 * 1000) {
      console.log('📋 Using cached preparation tasks data')
      return
    }

    try {
      const preparationTasksData: Record<string, any[]> = {}
      
      // Fetch all tasks at once and filter by event IDs
      const eventIds = events.map(e => e.id)
      const response = await api.get(`/tasks`)
      const allTasks = response.data.data || []
      
      // Filter and group tasks by event ID
      eventIds.forEach(eventId => {
        const eventTasks = allTasks.filter((task: any) => task.eventId === eventId)
        
        // Sort tasks by priority: URGENT > HIGH > MEDIUM > LOW
        const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        const sortedTasks = eventTasks.sort((a: any, b: any) => {
          const aPriority = priorityOrder[a.priority] || 0
          const bPriority = priorityOrder[b.priority] || 0
          return bPriority - aPriority
        })
        
        preparationTasksData[eventId] = sortedTasks
      })
      
      setEventPreparationTasks(preparationTasksData)
      
      // Cache the fetch time
      localStorage.setItem('prep-tasks-last-fetch', now.toString())
    } catch (error) {
      console.error('Failed to fetch event preparation tasks:', error)
    }
  }, [])


  // Fetch weather data when events change (with debouncing)
  useEffect(() => {
    if (dashboardData?.upcomingEvents) {
      const timer = setTimeout(() => {
        fetchEventWeather(dashboardData.upcomingEvents)
        fetchEventPreparationTasks(dashboardData.upcomingEvents, true) // Force refresh to get latest data
      }, 500) // Wait 500ms before fetching to avoid rapid calls
      
      return () => clearTimeout(timer)
    }
  }, [dashboardData?.upcomingEvents, fetchEventWeather, fetchEventPreparationTasks])

  // Use React Query for current weather with better caching
  const { data: currentWeatherData, isLoading: weatherLoading } = useQuery({
    queryKey: ['current-weather'],
    queryFn: async () => {
      console.log('🌤️ Fetching current weather...')
      const response = await api.get('/location/weather/current')
      console.log('🌤️ Current weather response:', response.data)

      if (response.data.success && response.data.data.weather) {
        const weather = response.data.data.weather
        return {
          emoji: weather.emoji || '🌤️',
          temperature: weather.temperature || 72,
          condition: weather.condition || 'Unknown',
          location: weather.location || response.data.data.location || 'Unknown'
        }
      } else {
        console.log('🌤️ No weather data in response, using fallback')
        return {
          emoji: '🌤️',
          temperature: 72,
          condition: 'Unknown',
          location: 'Unknown'
        }
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - increased to reduce API calls
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Retry failed requests twice
    retryDelay: 2000, // Wait 2 seconds between retries
    onError: (error) => {
      console.error('Failed to fetch current weather:', error)
    }
  })

  // Fetch 6-hour weather forecast
  const { data: forecastData, isLoading: forecastLoading, error: forecastError } = useQuery({
    queryKey: ['weather-forecast-6h'],
    queryFn: async () => {
      console.log('🌤️ Fetching 6-hour weather forecast...')
      const response = await api.get('/location/weather/forecast?days=1')
      console.log('🌤️ Forecast response:', response.data)

      if (response.data.success && response.data.data.forecast) {
        // Get next 6 hours (first 2 forecast entries, as OpenWeather provides 3-hour intervals)
        const next6Hours = response.data.data.forecast.slice(0, 2).map((item: any) => ({
          time: new Date(item.timestamp),
          temperature: item.temperature,
          condition: item.condition,
          emoji: item.emoji
        }))
        console.log('🌤️ Processed forecast data:', next6Hours)
        return next6Hours
      }
      console.log('🌤️ No forecast data available')
      return []
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    retry: 2, // Retry failed requests twice
    retryDelay: 2000, // Wait 2 seconds between retries
    onError: (error) => {
      console.error('Failed to fetch weather forecast:', error)
    }
  })

  // Debug forecast data
  useEffect(() => {
    console.log('🌤️ Forecast data state:', { forecastData, forecastLoading, forecastError })
  }, [forecastData, forecastLoading, forecastError])

  // Update currentWeather state when data changes
  useEffect(() => {
    if (currentWeatherData) {
      setCurrentWeather(currentWeatherData)
    }
  }, [currentWeatherData])

  const handleAddTask = useCallback(() => {
    navigate('/tasks')
  }, [navigate])

  const handleAddEvent = useCallback(() => {
    navigate('/calendar')
  }, [navigate])

  // Get weather icon component based on condition
  const getWeatherIcon = useCallback((condition: string) => {
    const conditionLower = condition.toLowerCase()
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return (
        <div className="relative w-6 h-6">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <defs>
              <radialGradient id="sun-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF3C7" stopOpacity="1"/>
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.6"/>
              </radialGradient>
              <filter id="sun-glow">
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Sun rays */}
            <g stroke="#F59E0B" strokeWidth="1" opacity="0.8">
              <line x1="12" y1="2" x2="12" y2="4">
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite"/>
              </line>
              <line x1="12" y1="20" x2="12" y2="22">
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite"/>
              </line>
              <line x1="2" y1="12" x2="4" y2="12">
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite"/>
              </line>
              <line x1="20" y1="12" x2="22" y2="12">
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite"/>
              </line>
              <line x1="4.24" y1="4.24" x2="5.66" y2="5.66">
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite"/>
              </line>
              <line x1="18.34" y1="18.34" x2="19.76" y2="19.76">
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite"/>
              </line>
              <line x1="19.76" y1="4.24" x2="18.34" y2="5.66">
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite"/>
              </line>
              <line x1="5.66" y1="18.34" x2="4.24" y2="19.76">
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite"/>
              </line>
            </g>
            
            {/* Sun center */}
            <circle cx="12" cy="12" r="4" fill="url(#sun-gradient)" filter="url(#sun-glow)">
              <animate attributeName="r" values="4;4.2;4" dur="4s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
      )
    } else if (conditionLower.includes('mist') || conditionLower.includes('fog') || conditionLower.includes('haze') || conditionLower.includes('clouds')) {
      return (
        <div className="relative w-6 h-6">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            {/* Simple mist cloud with visible elements */}
            <ellipse cx="8" cy="8" rx="4" ry="2" fill="#E2E8F0" opacity="0.8">
              <animateTransform attributeName="transform" type="translate" values="0,0; 2,0; 0,0" dur="6s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.8;0.4;0.8" dur="4s" repeatCount="indefinite"/>
            </ellipse>
            
            <ellipse cx="16" cy="12" rx="3" ry="1.5" fill="#CBD5E1" opacity="0.6">
              <animateTransform attributeName="transform" type="translate" values="0,0; -1,0; 0,0" dur="5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0.3;0.6" dur="3s" repeatCount="indefinite"/>
            </ellipse>
            
            <ellipse cx="12" cy="16" rx="3.5" ry="1.8" fill="#94A3B8" opacity="0.7">
              <animateTransform attributeName="transform" type="translate" values="0,0; 1.5,0; 0,0" dur="7s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.7;0.3;0.7" dur="5s" repeatCount="indefinite"/>
            </ellipse>
            
            {/* Small mist particles */}
            <circle cx="6" cy="6" r="0.8" fill="#64748B" opacity="0.6">
              <animate attributeName="cx" values="6;10;6" dur="8s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="6s" repeatCount="indefinite"/>
            </circle>
            
            <circle cx="18" cy="14" r="0.6" fill="#475569" opacity="0.5">
              <animate attributeName="cx" values="18;16;18" dur="9s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0.2;0.5" dur="7s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
      )
    } else if (conditionLower.includes('cloud')) {
      console.log('🎨 Rendering CLOUD weather icon')
      return (
        <div className="relative w-6 h-6">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <defs>
              <radialGradient id="cloud-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F9FAFB" stopOpacity="1"/>
                <stop offset="50%" stopColor="#E5E7EB" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#9CA3AF" stopOpacity="0.6"/>
              </radialGradient>
            </defs>
            
            {/* Cloud with gentle floating animation */}
            <path d="M18 10c0-3.3-2.7-6-6-6s-6 2.7-6 6c-1.1 0-2 .9-2 2s.9 2 2 2h12c1.1 0 2-.9 2-2s-.9-2-2-2z" 
                  fill="url(#cloud-gradient)">
              <animateTransform attributeName="transform" type="translate" values="0,0; 0,-1; 0,0" dur="6s" repeatCount="indefinite"/>
            </path>
            
            {/* Small cloud particles floating around */}
            <circle cx="6" cy="8" r="1" fill="#D1D5DB" opacity="0.6">
              <animate attributeName="cx" values="6;8;6" dur="8s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0.3;0.6" dur="5s" repeatCount="indefinite"/>
            </circle>
            
            <circle cx="18" cy="12" r="0.8" fill="#E5E7EB" opacity="0.5">
              <animate attributeName="cx" values="18;16;18" dur="7s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0.2;0.5" dur="6s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
      )
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      console.log('🎨 Rendering RAIN weather icon')
      return (
        <div className="relative w-6 h-6">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <defs>
              <radialGradient id="rain-cloud-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F3F4F6" stopOpacity="1"/>
                <stop offset="50%" stopColor="#9CA3AF" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#6B7280" stopOpacity="0.6"/>
              </radialGradient>
            </defs>
            
            {/* Rain cloud */}
            <path d="M18 10c0-3.3-2.7-6-6-6s-6 2.7-6 6c-1.1 0-2 .9-2 2s.9 2 2 2h12c1.1 0 2-.9 2-2s-.9-2-2-2z" 
                  fill="url(#rain-cloud-gradient)">
              <animateTransform attributeName="transform" type="translate" values="0,0; 0,-0.5; 0,0" dur="4s" repeatCount="indefinite"/>
            </path>
            
            {/* Animated rain drops */}
            <g stroke="#3B82F6" strokeWidth="1" opacity="0.8">
              <line x1="8" y1="14" x2="8" y2="18">
                <animate attributeName="y2" values="18;22;18" dur="1s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1s" repeatCount="indefinite"/>
              </line>
              <line x1="12" y1="14" x2="12" y2="20">
                <animate attributeName="y2" values="20;24;20" dur="1.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.2s" repeatCount="indefinite"/>
              </line>
              <line x1="16" y1="14" x2="16" y2="19">
                <animate attributeName="y2" values="19;23;19" dur="0.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="0.8s" repeatCount="indefinite"/>
              </line>
            </g>
          </svg>
        </div>
      )
    } else if (conditionLower.includes('thunderstorm') || conditionLower.includes('storm')) {
      return (
        <div className="relative w-6 h-6">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <defs>
              <radialGradient id="storm-cloud-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E5E7EB" stopOpacity="1"/>
                <stop offset="50%" stopColor="#6B7280" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#374151" stopOpacity="0.6"/>
              </radialGradient>
            </defs>
            
            {/* Storm cloud */}
            <path d="M18 10c0-3.3-2.7-6-6-6s-6 2.7-6 6c-1.1 0-2 .9-2 2s.9 2 2 2h12c1.1 0 2-.9 2-2s-.9-2-2-2z" 
                  fill="url(#storm-cloud-gradient)">
              <animateTransform attributeName="transform" type="translate" values="0,0; 0,-1; 0,0" dur="3s" repeatCount="indefinite"/>
            </path>
            
            {/* Lightning bolt */}
            <path d="M12 14l-2 4h2l-1 2 3-4h-2z" fill="#FCD34D" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="0.5s" repeatCount="indefinite"/>
            </path>
            
            {/* Heavy rain */}
            <g stroke="#1E40AF" strokeWidth="1.5" opacity="0.9">
              <line x1="7" y1="14" x2="7" y2="22">
                <animate attributeName="y2" values="22;24;22" dur="0.6s" repeatCount="indefinite"/>
              </line>
              <line x1="11" y1="14" x2="11" y2="22">
                <animate attributeName="y2" values="22;24;22" dur="0.7s" repeatCount="indefinite"/>
              </line>
              <line x1="15" y1="14" x2="15" y2="22">
                <animate attributeName="y2" values="22;24;22" dur="0.5s" repeatCount="indefinite"/>
              </line>
              <line x1="19" y1="14" x2="19" y2="22">
                <animate attributeName="y2" values="22;24;22" dur="0.8s" repeatCount="indefinite"/>
              </line>
            </g>
          </svg>
        </div>
      )
    } else if (conditionLower.includes('snow')) {
      return (
        <div className="relative w-6 h-6">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <defs>
              <radialGradient id="snow-cloud-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F8FAFC" stopOpacity="1"/>
                <stop offset="50%" stopColor="#E2E8F0" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.6"/>
              </radialGradient>
            </defs>
            
            {/* Snow cloud */}
            <path d="M18 10c0-3.3-2.7-6-6-6s-6 2.7-6 6c-1.1 0-2 .9-2 2s.9 2 2 2h12c1.1 0 2-.9 2-2s-.9-2-2-2z" 
                  fill="url(#snow-cloud-gradient)">
              <animateTransform attributeName="transform" type="translate" values="0,0; 0,-0.5; 0,0" dur="5s" repeatCount="indefinite"/>
            </path>
            
            {/* Snowflakes */}
            <g fill="#E0E7FF" opacity="0.8">
              <circle cx="8" cy="16" r="0.5">
                <animate attributeName="cy" values="16;22;16" dur="3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="12" cy="18" r="0.4">
                <animate attributeName="cy" values="18;24;18" dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="16" cy="17" r="0.6">
                <animate attributeName="cy" values="17;23;17" dur="3.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="3.5s" repeatCount="indefinite"/>
              </circle>
            </g>
          </svg>
        </div>
      )
    } else if (conditionLower.includes('wind')) {
      return (
        <div className="relative w-6 h-6">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <defs>
              <filter id="wind-blur">
                <feGaussianBlur stdDeviation="0.5"/>
              </filter>
            </defs>
            
            {/* Wind lines */}
            <g stroke="#9CA3AF" strokeWidth="1" opacity="0.7" filter="url(#wind-blur)">
              <path d="M2 8 Q6 6 10 8 Q14 10 18 8 Q20 7 22 8">
                <animate attributeName="d" values="M2 8 Q6 6 10 8 Q14 10 18 8 Q20 7 22 8;M2 8 Q6 10 10 8 Q14 6 18 8 Q20 9 22 8;M2 8 Q6 6 10 8 Q14 10 18 8 Q20 7 22 8" dur="2s" repeatCount="indefinite"/>
              </path>
              <path d="M2 12 Q6 10 10 12 Q14 14 18 12 Q20 11 22 12">
                <animate attributeName="d" values="M2 12 Q6 10 10 12 Q14 14 18 12 Q20 11 22 12;M2 12 Q6 14 10 12 Q14 10 18 12 Q20 13 22 12;M2 12 Q6 10 10 12 Q14 14 18 12 Q20 11 22 12" dur="2.5s" repeatCount="indefinite"/>
              </path>
              <path d="M2 16 Q6 14 10 16 Q14 18 18 16 Q20 15 22 16">
                <animate attributeName="d" values="M2 16 Q6 14 10 16 Q14 18 18 16 Q20 15 22 16;M2 16 Q6 18 10 16 Q14 14 18 16 Q20 17 22 16;M2 16 Q6 14 10 16 Q14 18 18 16 Q20 15 22 16" dur="3s" repeatCount="indefinite"/>
              </path>
            </g>
          </svg>
        </div>
      )
    } else {
      // Default sunny weather
      console.log('🎨 Rendering DEFAULT weather icon')
      return (
        <div className="relative w-6 h-6">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <defs>
              <radialGradient id="default-sun-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF3C7" stopOpacity="1"/>
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.6"/>
              </radialGradient>
            </defs>
            
            <circle cx="12" cy="12" r="4" fill="url(#default-sun-gradient)">
              <animate attributeName="r" values="4;4.2;4" dur="4s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
      )
    }
  }, [])

  // Memoized calculations for performance - must be before any conditional returns
  const completedTasksCount = useMemo(() => {
    if (!allTasks) return 0
    return allTasks.filter(t => t.status === 'COMPLETED').length
  }, [allTasks])
  
  const nextEventTitle = useMemo(() => 
    dashboardData?.upcomingEvents?.[0]?.title || 'None', 
    [dashboardData?.upcomingEvents]
  )
  
  const longestStreak = useMemo(() => 
    Math.max(...(dashboardData?.activeStreaks?.map(s => s.count) || []), 0), 
    [dashboardData?.activeStreaks]
  )

  // Wait for hydration before checking authentication
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Initializing...</p>
        </div>
      </div>
    )
  }

  // Check authentication after all hooks are declared
  if (!token) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Not Authenticated</h3>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to access the dashboard.
          </p>
          <Button onClick={() => navigate('/auth')}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    // Check if it's an authentication error
    const isAuthError = error?.response?.status === 401 || error?.message?.includes('token')
    
    if (isAuthError) {
      // Redirect to login page
      navigate('/auth')
      return null
    }
    
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground">
            {error?.response?.data?.error || error?.message || 'Please try refreshing the page'}
          </p>
          <div className="mt-2 space-x-2">
            <Button 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/auth')}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Conditional return after all hooks
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const { user, upcomingEvents, recentAchievements, activeStreaks, unreadNotifications } = dashboardData

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user.name || 'User'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your life management today
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Current Weather Widget */}
          {currentWeather && (
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 px-4 py-2 rounded-lg border">
              <div className="relative">
                {getWeatherIcon(currentWeather.condition)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {currentWeather.temperature}°F
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {currentWeather.condition}
                </span>
              </div>
            </div>
          )}

          {/* 6-Hour Forecast Strip */}
          {(forecastData && forecastData.length > 0) || forecastLoading ? (
            <div className="flex items-center space-x-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/20 dark:to-slate-700/20 px-3 py-2 rounded-lg border">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Next 6h:</span>
              {forecastLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-500">Loading...</span>
                </div>
              ) : forecastData && forecastData.length > 0 ? (
                <div className="flex items-center space-x-2">
                  {forecastData.map((forecast, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <div className="relative w-4 h-4">
                        {getWeatherIcon(forecast.condition)}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {forecast.temperature}°
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                          {forecast.time.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            hour12: true 
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500">No forecast data</span>
              )}
            </div>
          ) : null}
          
          {/* Energy Level */}
          <div className="flex items-center space-x-2">
            <div className="relative">

              {/* Main energy aura - gradual progression */}
              <div className="relative">
                {/* Base aura - grows with energy level */}
                <div 
                  className={`absolute inset-0 rounded-full ${(user.energyLevel ?? 5) >= 2 ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/30 animate-pulse' : ''}`} 
                  style={{ 
                    width: `${100 + ((user.energyLevel ?? 5) * 30)}%`,
                    height: `${100 + ((user.energyLevel ?? 5) * 30)}%`,
                    left: `-${((user.energyLevel ?? 5) * 15)}%`,
                    top: `-${((user.energyLevel ?? 5) * 15)}%`,
                    animationDuration: `${2.5 - ((user.energyLevel ?? 5) * 0.2)}s`
                  }}
                >
                </div>
                
                {/* Secondary aura - appears at level 4+ */}
                {(user.energyLevel ?? 5) >= 4 && (
                  <div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300/15 to-yellow-500/25 animate-ping" 
                    style={{ 
                      width: `${150 + ((user.energyLevel ?? 5) * 25)}%`, 
                      height: `${150 + ((user.energyLevel ?? 5) * 25)}%`,
                      left: `-${25 + ((user.energyLevel ?? 5) * 12.5)}%`,
                      top: `-${25 + ((user.energyLevel ?? 5) * 12.5)}%`,
                      animationDuration: `${3 - ((user.energyLevel ?? 5) * 0.2)}s`
                    }}
                  >
                  </div>
                )}
                
                {/* Tertiary aura - appears at level 7+ */}
                {(user.energyLevel ?? 5) >= 7 && (
                  <div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-200/10 to-yellow-400/20 animate-pulse" 
                    style={{ 
                      width: `${200 + ((user.energyLevel ?? 5) * 20)}%`, 
                      height: `${200 + ((user.energyLevel ?? 5) * 20)}%`,
                      left: `-${50 + ((user.energyLevel ?? 5) * 10)}%`,
                      top: `-${50 + ((user.energyLevel ?? 5) * 10)}%`,
                      animationDuration: `${1.5 - ((user.energyLevel ?? 5) * 0.1)}s`
                    }}
                  >
                  </div>
                )}
              </div>

              {/* Main lightning bolt - Fill effect matching header - CLICKABLE TOGGLE */}
              <button 
                className="relative w-5 h-5 cursor-pointer hover:scale-110 transition-transform duration-200"
                onClick={toggleAnimation}
                title={animationEnabled ? "Disable Energy Animation" : "Enable Energy Animation"}
              >
                {/* Background lightning bolt (empty) */}
                <Zap 
                  className="absolute inset-0 w-5 h-5 text-gray-300 dark:text-gray-600"
                />
                {/* Filled lightning bolt based on energy level */}
                <Zap 
                  className={`absolute inset-0 w-5 h-5 ${
                    (user.energyLevel ?? 5) >= 10 ? 'text-yellow-200' : 
                    (user.energyLevel ?? 5) >= 9 ? 'text-yellow-300' : 
                    (user.energyLevel ?? 5) >= 7 ? 'text-yellow-400' : 
                    (user.energyLevel ?? 5) >= 5 ? 'text-yellow-500' : 
                    (user.energyLevel ?? 5) >= 3 ? 'text-yellow-600' : 
                    'text-primary'
                  } ${animationEnabled ? 'animate-pulse' : 'opacity-70'}`} 
                  style={{
                    clipPath: `polygon(0% 0%, ${((user.energyLevel ?? 5) / 10) * 100}% 0%, ${((user.energyLevel ?? 5) / 10) * 100}% 100%, 0% 100%)`,
                    ...(animationEnabled && (user.energyLevel ?? 5) >= 7 ? { 
                      animationDuration: `${0.6 - ((user.energyLevel ?? 5) * 0.04)}s`,
                      filter: (user.energyLevel ?? 5) >= 9 ? 'drop-shadow(0 0 8px rgba(255, 255, 0, 0.8))' : 'none'
                    } : {})
                  }}
                />
              </button>
              
              {/* Super Saiyan sparks - gradual progression (only when animation enabled) */}
              {animationEnabled && (user.energyLevel ?? 5) >= 3 && (
                <>
                  {/* Ground-breaking effects - Super Saiyan style */}
                  <div className="absolute -bottom-8 left-0 w-full h-8 overflow-hidden">
                    {/* Ground pieces flying up - Super Saiyan style */}
                    {Array.from({ length: Math.min(Math.floor(((user.energyLevel ?? 5) - 2) * 2), 12) }, (_, i) => (
                      <div 
                        key={i}
                        className={`absolute bottom-0 bg-gradient-to-t from-yellow-800 to-yellow-500 rounded-sm`}
                        style={{
                          left: `${5 + (i * 8)}px`,
                          width: `${0.5 + (i % 3) * 0.5}rem`,
                          height: `${0.5 + (i % 2) * 0.5}rem`,
                          animation: `bounce ${1.5 - ((user.energyLevel ?? 5) * 0.1)}s ease-in-out infinite ${i * 0.1}s`,
                          zIndex: 1
                        }}
                      >
                        {/* Inner glow effect */}
                        <div className="w-full h-full bg-gradient-to-t from-yellow-600 to-yellow-300 rounded-sm opacity-80"></div>
                      </div>
                    ))}
                  </div>

                  {/* Multi-layered Energy Aura - Super Saiyan */}
                  {/* Base aura - grows with energy level */}
                  <div 
                    className={`absolute inset-0 rounded-full ${(user.energyLevel ?? 5) >= 2 ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/30 animate-pulse' : ''}`} 
                    style={{
                      width: `${100 + ((user.energyLevel ?? 5) * 20)}%`,
                      height: `${100 + ((user.energyLevel ?? 5) * 20)}%`,
                      left: `${-((user.energyLevel ?? 5) * 10)}%`,
                      top: `${-((user.energyLevel ?? 5) * 10)}%`,
                      animationDuration: `${2 - ((user.energyLevel ?? 5) * 0.15)}s`,
                      zIndex: 1
                    }}
                  />

                  {/* Secondary aura - level 4+ */}
                  {(user.energyLevel ?? 5) >= 4 && (
                    <div 
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300/15 to-yellow-500/25 animate-ping"
                      style={{
                        width: `${120 + ((user.energyLevel ?? 5) * 15)}%`,
                        height: `${120 + ((user.energyLevel ?? 5) * 15)}%`,
                        left: `${-((user.energyLevel ?? 5) * 7.5)}%`,
                        top: `${-((user.energyLevel ?? 5) * 7.5)}%`,
                        animationDuration: `${1.8 - ((user.energyLevel ?? 5) * 0.12)}s`
                      }}
                    />
                  )}

                  {/* Tertiary aura - level 7+ */}
                  {(user.energyLevel ?? 5) >= 7 && (
                    <div 
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-200/10 to-yellow-400/20 animate-pulse"
                      style={{
                        width: `${140 + ((user.energyLevel ?? 5) * 10)}%`,
                        height: `${140 + ((user.energyLevel ?? 5) * 10)}%`,
                        left: `${-((user.energyLevel ?? 5) * 5)}%`,
                        top: `${-((user.energyLevel ?? 5) * 5)}%`,
                        animationDuration: `${1.5 - ((user.energyLevel ?? 5) * 0.1)}s`
                      }}
                    />
                  )}

                  {/* Divine aura - level 9+ */}
                  {(user.energyLevel ?? 5) >= 9 && (
                    <div 
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-100/5 to-yellow-300/15 animate-ping"
                      style={{
                        width: `${160 + ((user.energyLevel ?? 5) * 5)}%`,
                        height: `${160 + ((user.energyLevel ?? 5) * 5)}%`,
                        left: `${-((user.energyLevel ?? 5) * 2.5)}%`,
                        top: `${-((user.energyLevel ?? 5) * 2.5)}%`,
                        animationDuration: `${1.2 - ((user.energyLevel ?? 5) * 0.08)}s`,
                        filter: 'drop-shadow(0 0 10px rgba(255, 255, 0, 0.6))'
                      }}
                    />
                  )}
                  {Array.from({ length: Math.min(Math.floor(((user.energyLevel ?? 5) - 2) * 3), 20) }, (_, i) => {
                    const angle = (i * 18) % 360; // Distribute sparks in a circle
                    const radius = 20 + ((user.energyLevel ?? 5) * 5);
                    const x = Math.cos(angle * Math.PI / 180) * radius;
                    const y = Math.sin(angle * Math.PI / 180) * radius;
                    const size = 2 + ((user.energyLevel ?? 5) * 0.3);
                    const opacity = 0.3 + ((user.energyLevel ?? 5) * 0.05);
                    const animationSpeed = 2 - ((user.energyLevel ?? 5) * 0.15);
                    
                    return (
                      <svg 
                        key={i}
                        className={`absolute text-yellow-400 animate-ping`}
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          width: `${size}rem`,
                          height: `${size}rem`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: `${animationSpeed}s`,
                          opacity: opacity,
                          zIndex: 1
                        }}
                        viewBox="0 0 24 24" 
                        fill="none"
                      >
                        <path d="M8 2L5 8h3l-2 4 4-5h-2z" fill="currentColor" />
                      </svg>
                    );
                  })}
                </>
              )}
            </div>
            <button 
              onClick={() => navigate('/energy-analysis')}
              className="text-sm font-medium hover:text-primary transition-colors cursor-pointer"
              title="Click to optimize your energy and schedule"
            >
              Energy: {user.energyLevel ?? 5}/10
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{standardizedTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasksCount} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Next: {nextEventTitle}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streaks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStreaks.length}</div>
            <p className="text-xs text-muted-foreground">
              Longest: {longestStreak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              Unread messages
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/gamification')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gamification</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {gamificationData?.stats?.totalPoints || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Level {gamificationData?.stats?.currentLevel || 1} • {gamificationData?.achievements?.length || 0} achievements
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5" />
                  <span>Today's Tasks</span>
                </CardTitle>
                <CardDescription>
                  Your tasks for today, ordered by AI priority (1 = highest priority)
                </CardDescription>
              </div>
            {standardizedTasks.length > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handlePrioritizeTasks}
                disabled={prioritizeTasksMutation.isPending}
                className="flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{prioritizeTasksMutation.isPending ? 'Prioritizing...' : 'Prioritize'}</span>
              </Button>
            )}
            </div>
          </CardHeader>
          <CardContent>
            {standardizedTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tasks for today!</p>
                <Button className="mt-4" size="sm" onClick={handleAddTask}>
                  Add Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {standardizedTasks
                  .slice(0, 5)
                  .map((task, index) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onComplete={handleCompleteTask}
                      onDelete={handleDeleteTask}
                      onView={handleViewTask}
                      order={index + 1}
                      showOrder={true}
                      events={dashboardData?.upcomingEvents}
                    />
                  ))}
                {standardizedTasks.length > 5 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-2"
                    onClick={() => navigate('/tasks')}
                  >
                    View All Tasks ({standardizedTasks.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Upcoming Events</span>
            </CardTitle>
            <CardDescription>
              Your scheduled events and meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming events!</p>
                <Button className="mt-4" size="sm" onClick={handleAddEvent}>
                  Add Event
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onView={handleViewEvent}
                    onDelete={handleDeleteEvent}
                    weatherData={eventWeatherData[event.id]}
                    preparationTasks={eventPreparationTasks[event.id]}
                    events={upcomingEvents}
                  />
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full mt-2"
                  onClick={() => navigate('/calendar')}
                >
                  View All Events {upcomingEvents.length > 0 && `(${upcomingEvents.length})`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Recent Achievements</span>
            </CardTitle>
            <CardDescription>
              Your latest accomplishments and milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <h4 className="font-medium text-sm">{achievement.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(achievement.unlockedAt)}
                    </span>
                    <span className="text-xs font-medium text-primary">
                      +{achievement.points} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEventUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['events'] })
        }}
      />
      
      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
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
    </div>
  )
}
