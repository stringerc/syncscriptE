import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pin, PinOff, GripVertical, Calendar, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'
import { useState } from 'react'

interface PinnedEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  isPinned: boolean
  pinOrder: number
  preparationTasks?: any[]
}

export function PinnedEventsRail() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isFlagEnabled } = useFeatureFlags()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Check if pinned events feature is enabled
  if (!isFlagEnabled('pinnedEvents')) {
    return null
  }

  // Fetch pinned events
  const { data: pinnedEvents, isLoading } = useQuery<PinnedEvent[]>({
    queryKey: ['pinned-events'],
    queryFn: async () => {
      const response = await api.get('/pinned/pinned')
      return response.data.data
    },
    staleTime: 30 * 1000
  })

  // Unpin mutation
  const unpinMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await api.post(`/pinned/events/${eventId}/unpin`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast({
        title: 'Event Unpinned',
        description: 'Event removed from pinned list'
      })
    }
  })

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (eventIds: string[]) => {
      await api.post('/pinned/reorder', { eventIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-events'] })
    }
  })

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // Reorder in UI optimistically
    const newEvents = [...(pinnedEvents || [])]
    const draggedItem = newEvents[draggedIndex]
    newEvents.splice(draggedIndex, 1)
    newEvents.splice(index, 0, draggedItem)

    setDraggedIndex(index)
  }

  const handleDrop = (index: number) => {
    if (draggedIndex === null || !pinnedEvents) return

    const newEvents = [...pinnedEvents]
    const draggedItem = newEvents[draggedIndex]
    newEvents.splice(draggedIndex, 1)
    newEvents.splice(index, 0, draggedItem)

    const eventIds = newEvents.map(e => e.id)
    reorderMutation.mutate(eventIds)

    setDraggedIndex(null)
  }

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pin className="h-5 w-5 text-blue-600" />
            Pinned Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!pinnedEvents || pinnedEvents.length === 0) {
    return null
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pin className="h-5 w-5 text-blue-600" />
          Pinned Events
          <Badge variant="secondary" className="ml-auto">
            {pinnedEvents.length}/5
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pinnedEvents.map((event, index) => (
          <div
            key={event.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            className={`
              p-3 rounded-lg border bg-white hover:shadow-md transition-all cursor-move
              ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}
            `}
          >
            <div className="flex items-start gap-3">
              <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{event.title}</h4>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(event.startTime).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(event.startTime).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>

                {event.preparationTasks && event.preparationTasks.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.preparationTasks.length} task{event.preparationTasks.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => unpinMutation.mutate(event.id)}
                disabled={unpinMutation.isPending}
                className="h-8 w-8 p-0"
                title="Unpin event"
              >
                <PinOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <p className="text-xs text-center text-muted-foreground mt-4">
          💡 Drag to reorder • Max 5 pinned events
        </p>
      </CardContent>
    </Card>
  )
}
