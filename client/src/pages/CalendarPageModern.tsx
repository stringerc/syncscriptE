import { useState, useEffect, useCallback, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, Clock, MapPin, DollarSign, Trash2, Paperclip, RefreshCw, Download, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { Event } from '@/shared/types'
import { EventModal } from '@/components/EventModal'
import { TaskModal } from '@/components/TaskModal'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { ResourcesDrawer } from '@/components/ResourcesDrawer'
import BudgetChip from '@/components/budget/BudgetChip'
import { 
  Panel, 
  PanelHeader, 
  PanelTitle, 
  PanelSubtitle, 
  PanelBody, 
  PanelFooter, 
  EmptyState, 
  Toolbar 
} from '@/components/ui/Panel'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'
import { telemetryService } from '@/services/telemetryService'

// Calendar Task Item Component (for bullet list in event cards)
const CalendarTaskItem = memo(({ task, onResourcesClick, onClick }: {
  task: any,
  onResourcesClick?: (taskId: string) => void,
  onClick?: (task: any) => void
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
      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
      onClick={() => onClick?.(task)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          task.priority === 'URGENT' ? 'bg-red-500' :
          task.priority === 'HIGH' ? 'bg-orange-500' :
          task.priority === 'MEDIUM' ? 'bg-yellow-500' :
          'bg-green-500'
        }`} />
        <span className="text-sm truncate">{task.title}</span>
      </div>
      {resourceCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onResourcesClick?.(task.id)
          }}
          title={tooltipText}
        >
          <Paperclip className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
})

CalendarTaskItem.displayName = 'CalendarTaskItem'

// Event Card Component
const EventCard = memo(({ event, onEdit, onDelete, onTaskClick, onResourcesClick }: {
  event: Event,
  onEdit: (event: Event) => void,
  onDelete: (event: Event) => void,
  onTaskClick: (task: any) => void,
  onResourcesClick: (taskId: string) => void
}) => {
  const isPast = new Date(event.startTime) < new Date()
  const isToday = new Date(event.startTime).toDateString() === new Date().toDateString()
  
  return (
    <Panel 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isPast ? 'opacity-60' : ''
      } ${isToday ? 'ring-2 ring-brand-primary' : ''}`}
      onClick={() => onEdit(event)}
    >
      <PanelHeader>
        <div className="flex items-start justify-between w-full">
          <div className="flex-1 min-w-0">
            <PanelTitle className="text-base truncate">{event.title}</PanelTitle>
            {event.description && (
              <PanelSubtitle className="text-xs mt-1 line-clamp-2">
                {event.description}
              </PanelSubtitle>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(event)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </PanelHeader>
      
      <PanelBody>
        <div className="space-y-2">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {event.isAllDay 
                ? 'All day' 
                : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
              }
            </span>
          </div>
          
          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          {/* Budget Impact */}
          {event.budgetImpact && event.budgetImpact > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{formatCurrency(event.budgetImpact)}</span>
            </div>
          )}
          
          {/* Preparation Tasks */}
          {event.preparationTasks && event.preparationTasks.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Preparation Tasks:</div>
              <div className="space-y-1">
                {event.preparationTasks.slice(0, 3).map((task: any) => (
                  <CalendarTaskItem
                    key={task.id}
                    task={task}
                    onResourcesClick={onResourcesClick}
                    onClick={onTaskClick}
                  />
                ))}
                {event.preparationTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-4">
                    +{event.preparationTasks.length - 3} more tasks
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </PanelBody>
    </Panel>
  )
})

EventCard.displayName = 'EventCard'

// Main Calendar Page Component
export default function CalendarPageModern() {
  const { isFlagEnabled } = useFeatureFlags()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // State
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isResourcesDrawerOpen, setIsResourcesDrawerOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showConflictResolver, setShowConflictResolver] = useState(false)

  // Emit telemetry for panel rendering
  useEffect(() => {
    telemetryService.recordEvent('ui.panel.rendered', {
      screen: 'calendar',
      panel: 'actionbar'
    })
    telemetryService.recordEvent('ui.panel.rendered', {
      screen: 'calendar', 
      panel: 'legend'
    })
  }, [])

  // Fetch events
  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ['events', searchTerm],
    queryFn: async () => {
      const response = await api.get('/calendar', {
        params: { search: searchTerm }
      })
      return response.data.data || []
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await api.delete(`/calendar/${eventId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast({ title: 'Event deleted successfully' })
      setEventToDelete(null)
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete event', 
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive'
      })
    }
  })

  // Event handlers
  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  const handleDeleteEvent = (event: Event) => {
    setEventToDelete(event)
  }

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete.id)
    }
  }

  const handleTaskClick = (task: any) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const handleResourcesClick = (taskId: string) => {
    setSelectedTaskId(taskId)
    setIsResourcesDrawerOpen(true)
  }

  const handleEventModalClose = () => {
    setIsEventModalOpen(false)
    setSelectedEvent(null)
  }

  const handleEventUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] })
  }

  const handleRefresh = () => {
    refetch()
    toast({ title: 'Calendar refreshed' })
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({ title: 'Export functionality coming soon' })
  }

  const handleConflictResolver = () => {
    setShowConflictResolver(true)
    telemetryService.recordEvent('ui.dialog.opened', {
      screen: 'calendar',
      kind: 'conflict-resolver'
    })
  }

  // Group events by date
  const groupedEvents = events.reduce((acc: any, event: Event) => {
    const date = new Date(event.startTime).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(event)
    return acc
  }, {})

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Panel>
          <EmptyState
            icon={<AlertTriangle className="h-12 w-12 text-destructive" />}
            title="Failed to load calendar"
            description="There was an error loading your calendar events. Please try again."
            action={
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            }
          />
        </Panel>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Action Bar Panel */}
      <Panel>
        <PanelHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <PanelTitle>Calendar</PanelTitle>
              <PanelSubtitle>Manage your events and schedule</PanelSubtitle>
            </div>
            <Toolbar>
              <Button
                variant="outline"
                size="sm"
                onClick={handleConflictResolver}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Resolve Conflicts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleCreateEvent} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Event
              </Button>
            </Toolbar>
          </div>
        </PanelHeader>
        
        <PanelBody>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{events.length} events</span>
            </div>
          </div>
        </PanelBody>
      </Panel>

      {/* Events List */}
      {isLoading ? (
        <Panel>
          <EmptyState
            icon={<RefreshCw className="h-12 w-12 animate-spin" />}
            title="Loading calendar..."
            description="Fetching your events"
          />
        </Panel>
      ) : sortedDates.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<Calendar className="h-12 w-12 text-muted-foreground" />}
            title="No events found"
            description="Create your first event to get started"
            action={
              <Button onClick={handleCreateEvent}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {formatDate(new Date(date))}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {groupedEvents[date].length} event{groupedEvents[date].length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedEvents[date].map((event: Event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    onTaskClick={handleTaskClick}
                    onResourcesClick={handleResourcesClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <EventModal
        event={selectedEvent}
        isOpen={isEventModalOpen}
        onClose={handleEventModalClose}
        onEventUpdated={handleEventUpdated}
      />

      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setSelectedTask(null)
        }}
        onTaskUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['events'] })
        }}
      />

      <ResourcesDrawer
        isOpen={isResourcesDrawerOpen}
        onClose={() => {
          setIsResourcesDrawerOpen(false)
          setSelectedTaskId(null)
        }}
        taskId={selectedTaskId}
      />

      <ConfirmationModal
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={confirmDeleteEvent}
        title="Delete Event"
        description={`Are you sure you want to delete "${eventToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}
