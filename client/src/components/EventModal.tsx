import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { TemplateRecommendations } from '@/components/TemplateRecommendations'
import { SpeechToTextInput } from '@/components/SpeechToTextInput'
import { X, Save, Trash2, Calendar, Clock, MapPin, DollarSign, Sparkles, Plus, CheckCircle, Circle, Edit3, Eye, Pin, PinOff } from 'lucide-react'

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
      if (!event) {
        console.log('🎯 EventModal: No event, returning empty tasks')
        return []
      }
      console.log('🎯 EventModal: Fetching preparation tasks for event:', event.id)
      const response = await api.get(`/tasks?eventId=${event.id}`)
      console.log('🎯 EventModal: Preparation tasks response:', response.data.data)
      return response.data.data || []
    },
    enabled: !!event && isOpen,
    refetchInterval: 60 * 1000, // Refetch every 60 seconds for real-time updates
  })

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      console.log('🎯 EventModal: Event changed, initializing form data for:', event.title)
      setFormData({
        title: event.title,
        description: event.description || '',
        startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
        endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : '',
        location: event.location || '',
        budgetImpact: event.budgetImpact || 0
      })
      setIsEditing(false)
      // Reset preparation task management state
      setEditingTaskId(null)
      setShowAddTaskForm(false)
      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskPriority('MEDIUM')
    }
  }, [event])

  // Removed excessive logging for performance

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
  
  // Preparation task management
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [showAddTaskForm, setShowAddTaskForm] = useState(false)

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

  // Create new preparation task
  const createPrepTaskMutation = useMutation({
    mutationFn: async (taskData: { title: string; description: string; priority: string }) => {
      if (!event) throw new Error('No event to add task to')
      const response = await api.post('/tasks', {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        eventId: event.id,
        status: 'PENDING'
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['preparationTasks', event?.id] })
      refetchPreparationTasks()
      toast({
        title: "Task Added!",
        description: "Preparation task has been added successfully"
      })
      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskPriority('MEDIUM')
      setShowAddTaskForm(false)
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Task",
        description: error.response?.data?.error || "Failed to add preparation task",
        variant: "destructive"
      })
    }
  })

  // Update preparation task
  const updatePrepTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) => {
      const response = await api.put(`/tasks/${taskId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['preparationTasks', event?.id] })
      refetchPreparationTasks()
      toast({
        title: "Task Updated!",
        description: "Preparation task has been updated successfully"
      })
      setEditingTaskId(null)
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Task",
        description: error.response?.data?.error || "Failed to update preparation task",
        variant: "destructive"
      })
    }
  })

  // Delete preparation task
  const deletePrepTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.delete(`/tasks/${taskId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['preparationTasks', event?.id] })
      refetchPreparationTasks()
      toast({
        title: "Task Deleted!",
        description: "Preparation task has been deleted successfully"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Task",
        description: error.response?.data?.error || "Failed to delete preparation task",
        variant: "destructive"
      })
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

  // Preparation task handlers
  const handleAddPrepTask = () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive"
      })
      return
    }
    createPrepTaskMutation.mutate({
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority
    })
  }

  const handleEditPrepTask = (task: any) => {
    setEditingTaskId(task.id)
    setNewTaskTitle(task.title)
    setNewTaskDescription(task.description || '')
    setNewTaskPriority(task.priority)
  }

  const handleUpdatePrepTask = () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive"
      })
      return
    }
    updatePrepTaskMutation.mutate({
      taskId: editingTaskId!,
      data: {
        title: newTaskTitle,
        description: newTaskDescription,
        priority: newTaskPriority
      }
    })
  }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskPriority('MEDIUM')
  }

  const handleDeletePrepTask = (taskId: string) => {
    deletePrepTaskMutation.mutate(taskId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <h2 className="text-xl font-semibold">
              {!event ? 'Create New Event' : (isEditing ? 'Edit Event' : 'Event Details')}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && event && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const endpoint = event.isPinned 
                        ? `/pinned/events/${event.id}/unpin`
                        : `/pinned/events/${event.id}/pin`
                      
                      await api.post(endpoint)
                      
                      queryClient.invalidateQueries({ queryKey: ['pinned-events'] })
                      queryClient.invalidateQueries({ queryKey: ['calendar'] })
                      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                      
                      toast({
                        title: event.isPinned ? 'Event Unpinned' : 'Event Pinned!',
                        description: event.isPinned 
                          ? 'Removed from dashboard rail' 
                          : 'Added to dashboard rail'
                      })
                      
                      onEventUpdated?.()
                    } catch (error: any) {
                      toast({
                        title: 'Error',
                        description: error.response?.data?.error || 'Failed to update pin status',
                        variant: 'destructive'
                      })
                    }
                  }}
                >
                  {event.isPinned ? (
                    <><PinOff className="w-4 h-4 mr-2" />Unpin</>
                  ) : (
                    <><Pin className="w-4 h-4 mr-2" />Pin</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await api.post(`/scripts/events/${event.id}/save-as-script`, {
                        title: `${event.title} Template`,
                        description: 'Reusable script for similar events'
                      })
                      toast({
                        title: response.data.data.containsPII ? 'Script Created (PII Warning)' : 'Script Created!',
                        description: response.data.message || 'Event saved as reusable script'
                      })
                    } catch (error: any) {
                      toast({
                        title: 'Error',
                        description: error.response?.data?.error || 'Failed to create script',
                        variant: 'destructive'
                      })
                    }
                  }}
                >
                  💾 Save as Script
                </Button>
              </>
            )}
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
          {!event || isEditing ? (
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
                <SpeechToTextInput
                  value={formData.description || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  placeholder="Type or hold mic to speak event description..."
                  multiline
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

          {/* Preparation Tasks - Always visible */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-muted-foreground">Preparation Tasks:</h4>
              {console.log('🎯 EventModal: Rendering preparation tasks section, isEditing:', isEditing, 'showAddTaskForm:', showAddTaskForm, 'editingTaskId:', editingTaskId)}
              {isEditing && !showAddTaskForm && !editingTaskId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    console.log('🎯 EventModal: Add Prep button clicked')
                    setShowAddTaskForm(true)
                  }}
                  className="text-xs hover:bg-blue-50 hover:border-blue-300"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Prep
                </Button>
              )}
            </div>
            
            {/* Add New Task Form - Only in Edit Mode */}
            {isEditing && showAddTaskForm && !editingTaskId && (
              <div className="border rounded-lg p-3 mb-3 bg-muted/50">
                <div className="space-y-2">
                  <Input
                    placeholder="Task title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="text-sm"
                  />
                  <Textarea
                    placeholder="Task description (optional)"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex items-center space-x-2">
                    <Label className="text-xs">Priority:</Label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleAddPrepTask}
                      disabled={createPrepTaskMutation.isPending}
                      className="text-xs"
                    >
                      {createPrepTaskMutation.isPending ? 'Adding...' : 'Add Task'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddTaskForm(false)
                        setNewTaskTitle('')
                        setNewTaskDescription('')
                        setNewTaskPriority('MEDIUM')
                      }}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Task Form - Only in Edit Mode */}
            {isEditing && editingTaskId && (
              <div className="border rounded-lg p-3 mb-3 bg-muted/50">
                <div className="space-y-2">
                  <Input
                    placeholder="Task title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="text-sm"
                  />
                  <Textarea
                    placeholder="Task description (optional)"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex items-center space-x-2">
                    <Label className="text-xs">Priority:</Label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleUpdatePrepTask}
                      disabled={updatePrepTaskMutation.isPending}
                      className="text-xs"
                    >
                      {updatePrepTaskMutation.isPending ? 'Updating...' : 'Update Task'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks List */}
            {console.log('🎯 EventModal: Rendering tasks list, preparationTasks:', preparationTasks, 'length:', preparationTasks?.length, 'isEditing:', isEditing)}
            {preparationTasks && preparationTasks.length > 0 ? (
              <ul className="space-y-1">
                {preparationTasks
                  .sort((a: any, b: any) => {
                    const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
                    return priorityOrder[b.priority] - priorityOrder[a.priority]
                  })
                  .map((task: any) => (
                  <li key={task.id} className="flex items-center space-x-2 text-sm">
                    {task.status === 'COMPLETED' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`flex-1 ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    {/* Edit/Delete buttons only show in edit mode */}
                    {console.log('🎯 EventModal: Rendering task buttons for task:', task.title, 'isEditing:', isEditing)}
                    {isEditing && (
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            console.log('🎯 EventModal: Edit task button clicked for:', task.title)
                            handleEditPrepTask(task)
                          }}
                          disabled={editingTaskId === task.id}
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                          title="Edit task"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            console.log('🎯 EventModal: Delete task button clicked for:', task.title)
                            handleDeletePrepTask(task.id)
                          }}
                          disabled={deletePrepTaskMutation.isPending}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No preparation tasks yet</p>
            )}
          </div>
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

        {/* Template Recommendations */}
        {!isEditing && event && (
          <div className="px-6 pb-4">
            <TemplateRecommendations
              eventId={event.id}
              onApplied={() => {
                queryClient.invalidateQueries({ queryKey: ['calendar'] })
                queryClient.invalidateQueries({ queryKey: ['tasks'] })
                queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                onEventUpdated?.()
              }}
            />
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
        message="Are you sure you want to permanently delete this event? All associated tasks and preparation items will also be removed."
        confirmText="Delete Forever"
        cancelText="Keep Event"
        variant="delete"
        isLoading={deleteEventMutation.isPending}
        eventTitle={event?.title}
      />
    </div>
  )
}
