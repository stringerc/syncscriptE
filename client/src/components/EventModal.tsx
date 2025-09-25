import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { X, Save, Trash2, Calendar, Clock, MapPin, DollarSign, Sparkles, Plus, CheckCircle, Circle } from 'lucide-react'

interface Event {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  budgetImpact?: number
  isAllDay: boolean
}

interface EventModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
  onEventUpdated?: () => void
}

export function EventModal({ event, isOpen, onClose, onEventUpdated }: EventModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    budgetImpact: 0
  })

  // Fetch preparation tasks for this event
  const { data: preparationTasks, refetch: refetchPreparationTasks } = useQuery({
    queryKey: ['preparationTasks', event?.id],
    queryFn: async () => {
      if (!event) return []
      const response = await api.get(`/tasks?eventId=${event.id}`)
      return response.data.data || []
    },
    enabled: !!event && isOpen,
    refetchInterval: 5000, // Refetch every 5 seconds to get real-time updates
  })

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
        endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : '',
        location: event.location || '',
        budgetImpact: event.budgetImpact || 0
      })
      setIsEditing(false)
    }
  }, [event])

  const updateEventMutation = useMutation({
    mutationFn: async (data: Partial<Event>) => {
      if (!event) throw new Error('No event to update')
      const response = await api.put(`/calendar/${event.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({
        title: "Event Updated",
        description: "Your event has been updated successfully."
      })
      setIsEditing(false)
      onEventUpdated?.()
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update event",
        variant: "destructive"
      })
    }
  })

  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('No event to delete')
      const response = await api.delete(`/calendar/${event.id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({
        title: "Event Deleted",
        description: "The event has been removed successfully."
      })
      onClose()
      onEventUpdated?.()
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "Failed to delete event",
        variant: "destructive"
      })
    }
  })

  const addToGoogleCalendarMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('No event to add to Google Calendar')
      const response = await api.post('/google-calendar/events', {
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location || undefined,
        calendarId: 'primary'
      })
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Added to Google Calendar",
        description: "The event has been successfully added to your Google Calendar."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add to Google Calendar",
        description: error.response?.data?.error || "Failed to add event to Google Calendar",
        variant: "destructive"
      })
    }
  })

  const [generatedTasks, setGeneratedTasks] = useState<any[]>([])
  const [showTaskSelection, setShowTaskSelection] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const generatePreparationTasksMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('No event to generate tasks for')
      const response = await api.post(`/ai/events/${event.id}/prepare`)
      return response.data
    },
    onSuccess: (data) => {
      if (data.data.tasks && data.data.tasks.length > 0) {
        setGeneratedTasks(data.data.tasks)
        setSelectedTasks(new Set(data.data.tasks.map((task: any) => task.id)))
        setShowTaskSelection(true)
      } else {
        toast({
          title: "No Tasks Generated",
          description: "AI couldn't generate preparation tasks for this event",
          variant: "destructive"
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.response?.data?.error || "Failed to generate preparation tasks",
        variant: "destructive"
      })
    }
  })

  const addSelectedTasksMutation = useMutation({
    mutationFn: async () => {
      const tasksToAdd = generatedTasks.filter(task => selectedTasks.has(task.id))
      // Tasks are already created in the database, just need to refresh the UI
      return { success: true, count: tasksToAdd.length }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['preparationTasks', event?.id] })
      refetchPreparationTasks()
      toast({
        title: "Tasks Added!",
        description: `Added ${data.count} preparation tasks to your task list`
      })
      setShowTaskSelection(false)
      setGeneratedTasks([])
      setSelectedTasks(new Set())
    }
  })

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive"
      })
      return
    }

    if (!formData.startTime || !formData.endTime) {
      toast({
        title: "Error",
        description: "Start and end times are required",
        variant: "destructive"
      })
      return
    }

    const updateData = {
      title: formData.title,
      description: formData.description,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      location: formData.location,
      budgetImpact: formData.budgetImpact
    }

    updateEventMutation.mutate(updateData)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    deleteEventMutation.mutate()
    setShowDeleteConfirm(false)
  }

  if (!isOpen || !event) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edit Event' : 'Event Details'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isEditing ? (
            /* Edit Form */
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Conference Room A"
                />
              </div>

              <div>
                <Label htmlFor="budgetImpact">Budget Impact</Label>
                <Input
                  id="budgetImpact"
                  type="number"
                  value={formData.budgetImpact}
                  onChange={(e) => setFormData(prev => ({ ...prev, budgetImpact: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g., 50.00"
                />
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{event.title}</h3>
                {event.description && (
                  <p className="text-muted-foreground mt-2">{event.description}</p>
                )}
                
                {/* Preparation Tasks */}
                {preparationTasks && preparationTasks.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Preparation Tasks:</h4>
                    <ul className="space-y-1">
                      {preparationTasks.map((task: any) => (
                        <li key={task.id} className="flex items-center space-x-2 text-sm">
                          {task.status === 'COMPLETED' ? (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className={task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}>
                            {task.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                  </span>
                </div>

                {event.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                )}

                {event.budgetImpact !== null && event.budgetImpact !== undefined && event.budgetImpact > 0 && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">${event.budgetImpact.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Task Selection Section */}
        {showTaskSelection && (
          <div className="border-t p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generated Preparation Tasks</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTasks(new Set(generatedTasks.map(task => task.id)))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTasks(new Set())}
                >
                  Select None
                </Button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {generatedTasks
                .sort((a, b) => {
                  // Sort by priority: URGENT > HIGH > MEDIUM > LOW
                  const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
                  const aPriority = priorityOrder[a.priority] || 0
                  const bPriority = priorityOrder[b.priority] || 0
                  return bPriority - aPriority
                })
                .map((task) => (
                <div key={task.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(task.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedTasks)
                      if (e.target.checked) {
                        newSelected.add(task.id)
                      } else {
                        newSelected.delete(task.id)
                      }
                      setSelectedTasks(newSelected)
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {task.estimatedDuration}min
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    {task.tags && (
                      <span className="text-xs text-blue-600 mt-1 inline-block">
                        #{task.tags}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTaskSelection(false)
                  setGeneratedTasks([])
                  setSelectedTasks(new Set())
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => addSelectedTasksMutation.mutate()}
                disabled={selectedTasks.size === 0 || addSelectedTasksMutation.isPending}
              >
                Add {selectedTasks.size} Selected Tasks
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <div className="flex space-x-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generatePreparationTasksMutation.mutate()}
                  disabled={generatePreparationTasksMutation.isPending}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generatePreparationTasksMutation.isPending ? 'Generating...' : 'Generate Prep Tasks'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteEventMutation.isPending}
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteEventMutation.isPending ? 'Deleting...' : 'Delete Event'}
                </Button>
              </>
            )}
          </div>
          <div className="flex space-x-2">
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => addToGoogleCalendarMutation.mutate()}
                disabled={addToGoogleCalendarMutation.isPending}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                {addToGoogleCalendarMutation.isPending ? 'Adding...' : 'Add to Google Calendar'}
              </Button>
            )}
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateEventMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateEventMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete Event"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteEventMutation.isPending}
      />
    </div>
  )
}
