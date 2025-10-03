import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { useEnergyAnalysisPrefetch } from '@/hooks/useEnergyAnalysisPrefetch'
import { usePointAnimation } from '@/contexts/PointAnimationContext'
import { AnimatedCounter } from '@/components/AnimatedCounter'
// Removed animation context import
import { getWeatherIcon } from '@/utils/weatherIcons'
import { useAchievements } from '@/contexts/AchievementsContext'
import { PinnedEventsRail } from '@/components/PinnedEventsRail'
import { BudgetChip } from '@/components/budget/BudgetChip'
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
  MapPin,
  Star,
  Flame,
  CheckCircle,
  Plus,
  Paperclip
} from 'lucide-react'
import { getTimezoneFromCoordinates } from '@/utils/timezone'
import { formatDate, formatTime, formatDateTime, formatCurrency, getPriorityColor } from '@/lib/utils'
import { EventModal } from '@/components/EventModal'
import { TaskModal } from '@/components/TaskModal'
import { ResourcesDrawer } from '@/components/ResourcesDrawer'
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
const TaskItem = memo(({ task, onComplete, onDelete, onView, onResourcesClick, order, showOrder, events }: { 
  task: Task, 
  onComplete: (id: string) => void,
  onDelete: (id: string) => void,
  onView: (id: string) => void,
  onResourcesClick?: (taskId: string) => void,
  order?: number,
  showOrder?: boolean,
  events?: Event[]
}) => {
  const relatedEvent = events?.find(event => event.id === task.eventId)
  
  // Fetch resources for this task
  const { data: resourceData } = useQuery({
    queryKey: ['task-resources', task.id],
    queryFn: async () => {
      // Disabled to prevent 404 errors and improve performance
      return []
    },
    enabled: false, // Disabled to prevent 404 errors
    staleTime: Infinity, // Never refetch
    gcTime: Infinity
  })
  
  const resourceCount = Array.isArray(resourceData) ? resourceData.length : 0
  const resourceNames = Array.isArray(resourceData) 
    ? resourceData.map((r: any) => r.title || 'Untitled')
    : []
  
  const tooltipText = resourceNames.length > 0 
    ? `Resources: ${resourceNames.join(', ')}` 
    : `${resourceCount} resources`
  
  console.log(`📎 TaskItem for "${task.title}": count=${resourceCount}, names=`, resourceNames, 'tooltip=', tooltipText)
  
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
          {task.isCritical && (
            <Badge variant="destructive" className="text-xs">
              🔴 Critical
            </Badge>
          )}
          {task.lockedPriority && (
            <Badge variant="secondary" className="text-xs">
              🔒 Locked
            </Badge>
          )}
          {resourceCount > 0 && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
              title={tooltipText}
              onClick={(e) => {
                e.stopPropagation()
                onResourcesClick?.(task.id)
              }}
            >
              <Paperclip className="w-3 h-3 mr-1" />
              {resourceCount}
            </Badge>
          )}
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
          <BudgetChip
            taskId={task.id}
            className="ml-2"
            editMode={false}
            showLineItemsButton={false}
          />
          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Due: {task.type === 'PREPARATION' ? formatDateTime(task.dueDate) : formatDate(task.dueDate)}</span>
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

// Nested Task Item Component (for bullet list in event cards)
const NestedTaskItem = memo(({ task, onResourcesClick, onClick }: {
  task: any,
  onResourcesClick?: (taskId: string) => void,
  onClick?: (task: any) => void
}) => {
  // Fetch resources for this nested task
  const { data: taskResourceData } = useQuery({
    queryKey: ['task-resources', task.id],
    queryFn: async () => {
      // Disabled to prevent 404 errors and improve performance
      return []
    },
    enabled: false, // Disabled to prevent 404 errors
    staleTime: Infinity, // Never refetch
    gcTime: Infinity
  })
  
  const taskResourceCount = Array.isArray(taskResourceData) ? taskResourceData.length : 0
  const taskResourceNames = Array.isArray(taskResourceData) 
    ? taskResourceData.map((r: any) => r.title || 'Untitled')
    : []
  const taskTooltipText = taskResourceNames.length > 0 
    ? `Resources: ${taskResourceNames.join(', ')}` 
    : `${taskResourceCount} resources`

  return (
    <div 
      className={`flex items-center gap-1 text-xs transition-all duration-200 cursor-pointer hover:text-foreground hover:underline ${
        task.status === 'COMPLETED' 
          ? 'line-through text-green-600' 
          : 'text-muted-foreground'
      }`}
      onClick={() => onClick?.(task)}
      title="Click to view task details"
    >
      <span>{task.status === 'COMPLETED' ? '✓' : '•'} {task.title}</span>
      {taskResourceCount > 0 && (
        <Badge 
          variant="outline" 
          className="text-[10px] px-1 py-0 h-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
          title={taskTooltipText}
          onClick={(e) => {
            e.stopPropagation()
            onResourcesClick?.(task.id)
          }}
        >
          <Paperclip className="w-2 h-2 mr-0.5" />
          {taskResourceCount}
        </Badge>
      )}
      <BudgetChip taskId={task.id} className="text-[10px] px-1 py-0 h-4" />
    </div>
  )
})

// Memoized event item component for performance
const EventItem = memo(({ event, onView, onDelete, weatherData, preparationTasks, events, allTasks, onResourcesClick, onTaskClick }: { 
  event: Event, 
  onView: (id: string) => void, 
  onDelete: (id: string) => void,
  weatherData?: { emoji: string; temperature: number; condition: string } | null,
  preparationTasks?: any[],
  events?: Event[],
  allTasks?: any[],
  onResourcesClick?: (taskId: string) => void,
  onTaskClick?: (task: any) => void
}) => {
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [showAllNestedTasks, setShowAllNestedTasks] = useState<Record<string, boolean>>({})
  
  // Removed excessive logging for performance
  return (
  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
    <div className="flex-1 pr-8">
      <div className="flex items-center space-x-2">
        <h4 className="font-medium text-sm">{event.title}</h4>
        {event.calendarProvider === 'google' && (
          <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
            G
          </Badge>
        )}
      </div>
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
              .map((task: any) => {
                // Check if this task has its own event (nested event)
                const hasNestedEvent = events?.find((e: any) => e.title === task.title)
                
                console.log(`🔍 Nested task check for task "${task.title}":`, {
                  taskId: task.id,
                  taskTitle: task.title,
                  hasNestedEvent: !!hasNestedEvent,
                  nestedEventId: hasNestedEvent?.id,
                  allEvents: events?.map(e => ({ id: e.id, title: e.title }))
                })
                
                return (
                  <div key={task.id}>
                    <NestedTaskItem 
                      task={task} 
                      onResourcesClick={onResourcesClick}
                      onClick={onTaskClick}
                    />
                    
                    {/* Show nested tasks if this task has its own event */}
                    {hasNestedEvent && (
                      <div className="ml-4 mt-1 space-y-1">
                        {(() => {
                          // Find tasks that belong to this nested event
                          // First try to find them in preparationTasks, but if not found, 
                          // we need to look for tasks that are specifically for this nested event
                          let nestedEventTasks = preparationTasks.filter((t: any) => 
                            t.eventId === hasNestedEvent.id && t.id !== task.id
                          )
                          
                          // If no tasks found in preparationTasks, look for tasks that might be 
                          // associated with this nested event by checking if they have the same eventId
                          if (nestedEventTasks.length === 0) {
                            // Look for all tasks that belong to this nested event
                            nestedEventTasks = allTasks?.filter((t: any) => 
                              t.eventId === hasNestedEvent.id && t.id !== task.id
                            ) || []
                          }
                          
                          console.log(`🔍 Nested tasks for event "${hasNestedEvent.title}":`, {
                            nestedEventId: hasNestedEvent.id,
                            nestedEventTitle: hasNestedEvent.title,
                            foundTasks: nestedEventTasks.map(t => ({ id: t.id, title: t.title, eventId: t.eventId })),
                            allPrepTasks: preparationTasks.map(t => ({ id: t.id, title: t.title, eventId: t.eventId })),
                            filterCondition: `t.eventId === hasNestedEvent.id && t.id !== task.id`,
                            taskId: task.id,
                            taskTitle: task.title,
                            detailedComparison: preparationTasks.map(t => ({
                              id: t.id,
                              title: t.title,
                              eventId: t.eventId,
                              matchesEventId: t.eventId === hasNestedEvent.id,
                              isNotCurrentTask: t.id !== task.id,
                              wouldMatch: t.eventId === hasNestedEvent.id && t.id !== task.id
                            }))
                          })
                          
                          // Sort nested tasks by priority to match main prep tasks
                          const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
                          const sortedNestedTasks = nestedEventTasks.sort((a: any, b: any) => {
                            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
                            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
                            return bPriority - aPriority
                          })
                          
                          const maxNestedTasks = 2
                          const shouldShowAll = showAllNestedTasks[task.id] || false
                          const tasksToShow = shouldShowAll ? sortedNestedTasks : sortedNestedTasks.slice(0, maxNestedTasks)
                          
                          return (
                            <>
                              {tasksToShow.map((nestedTask: any) => (
                                <div 
                                  key={nestedTask.id}
                                  className={`text-xs text-muted-foreground/80 transition-all duration-200 ${
                                    nestedTask.status === 'COMPLETED' 
                                      ? 'line-through text-green-500' 
                                      : ''
                                  }`}
                                >
                                  {nestedTask.status === 'COMPLETED' ? '✓' : '◦'} {nestedTask.title}
                                </div>
                              ))}
                              {sortedNestedTasks.length > maxNestedTasks && (
                                <button
                                  onClick={() => setShowAllNestedTasks(prev => ({
                                    ...prev,
                                    [task.id]: !prev[task.id]
                                  }))}
                                  className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer transition-colors duration-200"
                                >
                                  {shouldShowAll ? 'Show less' : `+${sortedNestedTasks.length - maxNestedTasks} more`}
                                </button>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )
              })}
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
            <span className="text-muted-foreground/70">•</span>
            <span>{new Date(event.startTime).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            {event.location ? (
              <>
                <span>{event.location}</span>
                <span 
                  title={weatherData ? `${weatherData.condition}, ${weatherData.temperature}°F` : 'Weather data unavailable'}
                  className="text-lg"
                  style={{ fontSize: '16px' }}
                >
                  {getWeatherIcon(
                    weatherData?.condition || 'Unknown',
                    weatherData?.emoji,
                    new Date(event.startTime)
                  )}
                </span>
              </>
            ) : weatherData ? (
              <>
                <span className="text-xs text-muted-foreground/60">Your location</span>
                <span 
                  title={weatherData ? `${weatherData.condition}, ${weatherData.temperature}°F` : 'Weather data unavailable'}
                  className="text-lg"
                  style={{ fontSize: '16px' }}
                >
                  {getWeatherIcon(
                    weatherData?.condition || 'Unknown',
                    weatherData?.emoji,
                    new Date(event.startTime)
                  )}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground/60">No location available</span>
            )}
          </div>
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
        // Disabled verbose logging for performance
        // console.log(`🔍 Dashboard EventItem: Checking event ${event.id} (${event.title}):`, {
        //   linkedTasks,
        //   linkedTasksLength: linkedTasks.length,
        //   eventsLength: events?.length
        // });
        
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
        const prepKeywords = ['prepare', 'coordinate', 'create', 'plan', 'organize', 'set up', 'check', 'verify', 'confirm'];
        const isLikelyPrepEvent = prepKeywords.some(keyword => 
          event.title.toLowerCase().includes(keyword)
        );
        
        if (isLikelyPrepEvent && events && events.length > 1) {
          // Find the main event (usually the one without prep keywords and later in time)
          const mainEvents = events.filter((e: any) => 
            !prepKeywords.some(keyword => e.title.toLowerCase().includes(keyword)) &&
            e.id !== event.id &&
            new Date(e.startTime) > new Date(event.startTime) // Main event should be after prep event
          );
          
          if (mainEvents.length > 0) {
            // Find the closest main event by time (earliest after this event)
            const closestMainEvent = mainEvents.reduce((closest: any, current: any) => {
              const currentTimeDiff = new Date(current.startTime).getTime() - new Date(event.startTime).getTime();
              const closestTimeDiff = new Date(closest.startTime).getTime() - new Date(event.startTime).getTime();
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
        
        // Additional check: Look for events that might be related by content similarity
        // This helps catch cases like "Check fasting requirements" -> "Labcorp appointment"
        if (events && events.length > 1) {
          const eventTitleLower = event.title.toLowerCase();
          
          // Look for events that might be related by medical/professional context
          const medicalKeywords = ['labcorp', 'appointment', 'doctor', 'medical', 'test', 'fasting', 'blood', 'check'];
          const hasMedicalContext = medicalKeywords.some(keyword => 
            eventTitleLower.includes(keyword)
          );
          
          if (hasMedicalContext) {
            // Find other events with similar medical context that occur after this one
            const relatedEvents = events.filter((e: any) => 
              e.id !== event.id &&
              new Date(e.startTime) > new Date(event.startTime) &&
              medicalKeywords.some(keyword => e.title.toLowerCase().includes(keyword))
            );
            
            if (relatedEvents.length > 0) {
              // Find the closest related event by time
              const closestRelatedEvent = relatedEvents.reduce((closest: any, current: any) => {
                const currentTimeDiff = new Date(current.startTime).getTime() - new Date(event.startTime).getTime();
                const closestTimeDiff = new Date(closest.startTime).getTime() - new Date(event.startTime).getTime();
                return currentTimeDiff < closestTimeDiff ? current : closest;
              });
              
              console.log(`🔄 Dashboard EventItem: Medical context: Found related event ${event.id} for main event:`, closestRelatedEvent);
              return (
                <div className="text-xs text-blue-600 mb-2">
                  Prep for: {closestRelatedEvent.title}
                </div>
              );
            }
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
  const { prefetchEnergyAnalysis } = useEnergyAnalysisPrefetch()
  const { showAchievements } = useAchievements()
  const { showPointAnimation } = usePointAnimation()
  // Removed animation functionality
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [resourcesDrawerTaskId, setResourcesDrawerTaskId] = useState<string | null>(null)
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

  // Restore cached weather data on component mount
  useEffect(() => {
    const cachedWeatherData = localStorage.getItem('event-weather-data')
    const lastFetch = localStorage.getItem('event-weather-last-fetch')
    const now = Date.now()
    
    // Only restore if data is recent (within 15 minutes)
    if (cachedWeatherData && lastFetch && (now - parseInt(lastFetch)) < 15 * 60 * 1000) {
      try {
        const parsedWeatherData = JSON.parse(cachedWeatherData)
        setEventWeatherData(parsedWeatherData)
        console.log('🌤️ Restored cached weather data on mount:', parsedWeatherData)
      } catch (error) {
        console.error('Failed to parse cached weather data on mount:', error)
      }
    }
  }, [])

  // Prefetch energy analysis data in background when dashboard loads
  useEffect(() => {
    if (isHydrated && token) {
      // Delay prefetch to not interfere with initial dashboard loading
      const timer = setTimeout(() => {
        prefetchEnergyAnalysis()
      }, 3000) // Wait 3 seconds after dashboard loads
      
      return () => clearTimeout(timer)
    }
  }, [isHydrated, token, prefetchEnergyAnalysis])

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
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on every mount
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
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
    staleTime: 5 * 60 * 1000, // 5 minutes - longer cache
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    enabled: !!token && isHydrated // Re-enabled for functionality
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
    onSuccess: async (data, variables) => {
      // Invalidate and refetch all relevant queries immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['gamification-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['gamification'] }),
        queryClient.invalidateQueries({ queryKey: ['user-dashboard'] })
      ])
      
      // Force refetch the gamification data if points were awarded
      if (variables.status === 'COMPLETED' && data.data?.pointsAwarded) {
        await queryClient.refetchQueries({ queryKey: ['gamification-summary'] })
        
        // Small delay to ensure data is updated before showing animation
        setTimeout(() => {
          showPointAnimation(data.data.pointsAwarded)
        }, 100)
      }
      
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
      console.log('🎯 DashboardPage: Making API call to:', `/tasks/${taskId}/complete`)
      
      // Find the task to get its estimated duration
      const task = allTasks?.find(t => t.id === taskId)
      const actualDuration = task?.estimatedDuration || 30
      
      const response = await api.patch(`/tasks/${taskId}/complete`, { actualDuration })
      console.log('🎯 DashboardPage: Task completion response:', response.data)
      
      toast({
        title: "Task Completed!",
        description: "Great job completing this task!"
      })
      
      // Find the completed task to check if it's a prep task
      const completedTask = allTasks?.find(t => t.id === taskId)
      const relatedEventId = completedTask?.eventId
      
      // Invalidate and refetch all relevant queries immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['user/dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['gamification'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      ])
      
      // Force refetch dashboard data
      await queryClient.refetchQueries({ queryKey: ['dashboard'] })
      
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

  // Fetch weather data for events - DISABLED for performance
  const fetchEventWeather = useCallback(async (events: Event[], forceRefresh = false) => {
    // Disabled for performance - weather not critical for initial load
    return

    // Check if we already have recent weather data (within last hour) - unless force refresh
    const lastFetch = localStorage.getItem('event-weather-last-fetch')
    const cachedWeatherData = localStorage.getItem('event-weather-data')
    const now = Date.now()
    
    if (!forceRefresh && lastFetch && cachedWeatherData && (now - parseInt(lastFetch)) < 60 * 60 * 1000) { // 1 hour cache
      console.log('🌤️ Using cached event weather data')
      try {
        const parsedWeatherData = JSON.parse(cachedWeatherData)
        setEventWeatherData(parsedWeatherData)
        console.log('🌤️ Restored cached weather data:', parsedWeatherData)
      } catch (error) {
        console.error('Failed to parse cached weather data:', error)
      }
      return
    }

    try {
      console.log('🌤️ Fetching weather for events:', events.map(e => ({ id: e.id, title: e.title, hasLocation: !!e.location })))
      
      // Include user coordinates for fallback location
      const requestData: any = { events }
      if (userLocation) {
        requestData.lat = userLocation.lat
        requestData.lon = userLocation.lon
      }
      
      const response = await api.post('/location/events/weather', requestData)
      console.log('🌤️ Weather API response:', response.data)
      
      const weatherData: Record<string, { emoji: string; temperature: number; condition: string } | null> = {}
      
      response.data.data.eventsWithWeather.forEach((item: any) => {
        console.log('🌤️ Weather for event:', item.eventId, item.weather)
        console.log('🌤️ Weather emoji:', item.weather?.emoji)
        weatherData[item.eventId] = item.weather
      })
      
      console.log('🌤️ Final weather data:', weatherData)
      setEventWeatherData(weatherData)
      console.log('🌤️ Weather data state updated with:', weatherData)
      
      // Cache the fetch time and weather data
      localStorage.setItem('event-weather-last-fetch', now.toString())
      localStorage.setItem('event-weather-data', JSON.stringify(weatherData))
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
        fetchEventWeather(dashboardData.upcomingEvents, true) // Force refresh to get latest data
        fetchEventPreparationTasks(dashboardData.upcomingEvents, true) // Force refresh to get latest data
      }, 500) // Wait 500ms before fetching to avoid rapid calls
      
      return () => clearTimeout(timer)
    }
  }, [dashboardData?.upcomingEvents, fetchEventWeather, fetchEventPreparationTasks])

  // Get user location for weather
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)

  // Get user's location and timezone
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          }
          setUserLocation(location)
          
          // Detect timezone from coordinates
          try {
            const timezoneInfo = await getTimezoneFromCoordinates(location.lat, location.lon)
            if (timezoneInfo) {
              console.log('🌍 Detected timezone:', timezoneInfo.timezone)
              // Update user profile with detected timezone
              // This could be sent to the backend to update the user's timezone preference
            }
          } catch (error) {
            console.error('Error detecting timezone:', error)
          }
        },
        (error) => {
          console.log('Location access denied or failed:', error)
        }
      )
    }
  }, [])

  // Use React Query for current weather with better caching
  const { data: currentWeatherData, isLoading: weatherLoading } = useQuery({
    queryKey: ['current-weather', userLocation],
    queryFn: async () => {
      console.log('🌤️ Fetching current weather...')
      let locationParam = ''
      if (userLocation) {
        locationParam = `?lat=${userLocation.lat}&lon=${userLocation.lon}`
      }
      const response = await api.get(`/location/weather/current${locationParam}`)
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
    enabled: false, // Disabled for performance - weather not critical for initial load
    staleTime: 30 * 60 * 1000, // 30 minutes - much longer cache
    cacheTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    retry: 1, // Only retry once
    retryDelay: 1000, // Faster retry
    onError: (error) => {
      console.error('Failed to fetch current weather:', error)
    }
  })

  // Fetch 6-hour weather forecast
  const { data: forecastData, isLoading: forecastLoading, error: forecastError } = useQuery({
    queryKey: ['weather-forecast-6h', userLocation],
    queryFn: async () => {
      console.log('🌤️ Fetching 6-hour weather forecast...')
      let locationParam = ''
      if (userLocation) {
        locationParam = `&lat=${userLocation.lat}&lon=${userLocation.lon}`
      }
      const response = await api.get(`/location/weather/forecast?days=1${locationParam}`)
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
    enabled: false, // Disabled for performance - forecast not critical for initial load
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
    console.log('➕ handleAddTask called')
    setSelectedTask(null)
    setIsTaskModalOpen(true)
  }, [])

  const handleAddEvent = useCallback(() => {
    console.log('➕ handleAddEvent called')
    setSelectedEvent(null)
    setIsModalOpen(true)
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

  // Show loading state only for critical data
  if (isLoading && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 text-sm">Loading your dashboard...</p>
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

  // Destructure dashboard data for use in the component
  const { user, upcomingEvents, recentAchievements, activeStreaks, unreadNotifications } = dashboardData || {}
  
  // Ensure all arrays are properly initialized to prevent undefined errors
  const safeUpcomingEvents = upcomingEvents || []
  const safeRecentAchievements = recentAchievements || []
  const safeActiveStreaks = activeStreaks || []
  const safeUnreadNotifications = unreadNotifications || []

  // Debug logging for dashboard events - disabled for performance
  // console.log('🎉 Dashboard Events Debug:', {
  //   totalEvents: safeUpcomingEvents.length,
  //   events: safeUpcomingEvents.map(event => ({
  //     id: event.id,
  //     title: event.title,
  //     startTime: event.startTime,
  //     calendarProvider: event.calendarProvider,
  //     isGoogleEvent: event.calendarProvider === 'google'
  //   })),
  //   googleEvents: safeUpcomingEvents.filter(e => e.calendarProvider === 'google')
  // })

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
          {/* Current Weather Widget - Header Style */}
          {currentWeather && (
            <div className="flex items-center space-x-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-lg">
                {getWeatherIcon(currentWeather.condition, currentWeather.emoji)}
              </span>
              <div className="text-xs">
                <div className="font-medium text-slate-700 dark:text-slate-300">
                  {currentWeather.temperature}°
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {currentWeather.location?.split(',')[0] || 'Current'}
                </div>
              </div>
            </div>
          )}

          {/* 6-Hour Forecast Strip */}
          {(forecastData && forecastData.length > 0) || forecastLoading ? (
            <div className="flex items-center space-x-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/20 dark:to-slate-700/20 px-4 py-3 rounded-lg border mb-4 mt-4">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Next 6h:</span>
              {forecastLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-500">Loading...</span>
                </div>
              ) : forecastData && forecastData.length > 0 ? (
                <div className="flex items-center space-x-4">
                  {forecastData.map((forecast, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="relative w-5 h-5">
                        {getWeatherIcon(forecast.condition, forecast.emoji)}
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
          <div className="flex items-center space-x-2 mt-2">
            <Zap className="w-5 h-5 text-primary" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <Card className="cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-105" onClick={() => navigate('/gamification')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${showAchievements ? 'text-yellow-600' : 'text-gray-400'}`}>
              <AnimatedCounter 
                value={gamificationData?.stats?.totalPoints || 0}
                duration={1500}
                className="font-bold"
              />
            </div>
            <p className={`text-xs ${showAchievements ? 'text-muted-foreground' : 'text-gray-400'}`}>
              Level {gamificationData?.stats?.currentLevel || 1} • {gamificationData?.achievements?.length || 0} achievements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pinned Events Rail */}
      <PinnedEventsRail />

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
              <div className="flex items-center space-x-2">
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
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleAddTask}
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
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
                      onResourcesClick={(taskId) => setResourcesDrawerTaskId(taskId)}
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Upcoming Events</span>
                </CardTitle>
                <CardDescription>
                  Your scheduled events and meetings
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleAddEvent}
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
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
                    allTasks={allTasks}
                    onResourcesClick={(taskId) => setResourcesDrawerTaskId(taskId)}
                    onTaskClick={(task) => {
                      setSelectedTask(task)
                      setIsTaskModalOpen(true)
                    }}
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
        onEventCreated={(createdEvent) => {
          setSelectedEvent(createdEvent)
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

      {/* Resources Drawer */}
      {resourcesDrawerTaskId && (
        <ResourcesDrawer
          taskId={resourcesDrawerTaskId}
          isOpen={!!resourcesDrawerTaskId}
          onClose={() => setResourcesDrawerTaskId(null)}
        />
      )}

    </div>
  )
}
