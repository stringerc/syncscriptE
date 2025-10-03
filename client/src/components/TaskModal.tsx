import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { ResourcesDrawer } from '@/components/ResourcesDrawer'
import { ResourcesBadge } from '@/components/ResourcesBadge'
import BudgetChip from '@/components/budget/BudgetChip'
import { BudgetModal } from '@/components/budget/BudgetModal'
import { BudgetSummary } from '@/components/budget/BudgetSummary'
import { LineItemsViewer } from '@/components/budget/LineItemsViewer'
import { InlineSuggestions } from '@/components/InlineSuggestions'
import { SpeechToTextInput } from '@/components/SpeechToTextInput'
import { buildPrepChainTitle, isPrepTask } from '@/lib/prepChain'
import { formatDateTime } from '@/lib/utils'
import { 
  X, 
  Save, 
  Trash2, 
  CheckSquare, 
  MapPin, 
  Clock, 
  Calendar,
  Sparkles,
  AlertCircle,
  Mic,
  Download,
  MoreHorizontal
} from 'lucide-react'
import { Task, Priority, TaskStatus } from '@/shared/types'

interface TaskModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
}

interface CalendarSuggestion {
  suggestedTime: string
  suggestedEndTime: string
  reasoning: string
  conflicts: string[]
}

export function TaskModal({ task, isOpen, onClose, onTaskUpdated, onTaskDeleted }: TaskModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [resourcesDrawerOpen, setResourcesDrawerOpen] = useState(false)
  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [lineItemsViewerOpen, setLineItemsViewerOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    notes: '',
    location: '',
    priority: 'MEDIUM' as Priority,
    estimatedDuration: 30
  })
  const [calendarSuggestion, setCalendarSuggestion] = useState<CalendarSuggestion | null>(null)
  const [showCalendarSuggestion, setShowCalendarSuggestion] = useState(false)
  const [customEventTime, setCustomEventTime] = useState({
    startTime: '',
    endTime: ''
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showConvertToPrep, setShowConvertToPrep] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState('')

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        notes: task.notes || '',
        location: task.location || '',
        priority: task.priority,
        estimatedDuration: task.estimatedDuration || 30
      })
    }
  }, [task])

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/tasks', data)
      return response.data
    },
    onSuccess: (data) => {
      toast({
        title: "Task Created",
        description: "Task has been created successfully"
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onTaskUpdated?.(data.data)
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.response?.data?.error || "Failed to create task",
        variant: "destructive"
      })
    }
  })

  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!task) throw new Error('No task to update')
      const response = await api.put(`/tasks/${task.id}`, data)
      return response.data
    },
    onSuccess: (data) => {
      toast({
        title: "Task Updated",
        description: "Task has been updated successfully"
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onTaskUpdated?.(data.data)
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update task",
        variant: "destructive"
      })
    }
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task) throw new Error('No task to delete')
      const response = await api.delete(`/tasks/${task.id}`)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Task Deleted",
        description: "Task has been deleted successfully"
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onTaskDeleted?.(task!.id)
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "Failed to delete task",
        variant: "destructive"
      })
    }
  })

  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task) throw new Error('No task to complete')
      console.log('🎯 TaskModal: Calling API to complete task:', task.id)
      const response = await api.patch(`/tasks/${task.id}/complete`, { 
        actualDuration: task.estimatedDuration 
      })
      console.log('🎯 TaskModal: API response:', response.data)
      return response.data
    },
    onSuccess: (data) => {
      console.log('🎯 TaskModal: Task completion successful:', data)
      toast({
        title: "Task Completed!",
        description: "Great job completing this task!"
      })
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['user/dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['gamification'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      // Close modal after successful completion
      onClose()
      onTaskUpdated?.(data.data)
    },
    onError: (error: any) => {
      console.error('🎯 TaskModal: Task completion failed:', error)
      toast({
        title: "Failed to Complete Task",
        description: error.response?.data?.error || "Failed to complete task",
        variant: "destructive"
      })
    }
  })

  const uncompleteTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task) throw new Error('No task to uncomplete')
      console.log('🎯 TaskModal: Calling API to uncomplete task:', task.id)
      const response = await api.patch(`/tasks/${task.id}/uncomplete`)
      console.log('🎯 TaskModal: API response:', response.data)
      return response.data
    },
    onSuccess: (data) => {
      console.log('🎯 TaskModal: Task uncompletion successful:', data)
      toast({
        title: "Task Uncompleted",
        description: "Task has been reverted to pending status"
      })
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['user/dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['gamification'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      // Close modal after successful uncompletion
      onClose()
      onTaskUpdated?.(data.data)
    },
    onError: (error: any) => {
      console.error('🎯 TaskModal: Task uncompletion failed:', error)
      toast({
        title: "Failed to Uncomplete Task",
        description: error.response?.data?.error || "Failed to uncomplete task",
        variant: "destructive"
      })
    }
  })

  const suggestCalendarEventMutation = useMutation({
    mutationFn: async () => {
      if (!task) throw new Error('No task to suggest calendar event for')
      const response = await api.post(`/ai/tasks/${task.id}/suggest-calendar`, {
        taskTitle: task.title,
        taskDescription: task.description,
        estimatedDuration: task.estimatedDuration,
        location: task.location,
        notes: task.notes
      })
      return response.data
    },
    onSuccess: (data) => {
      setCalendarSuggestion(data.data.suggestion)
      // Initialize custom time fields with AI suggestions
      const suggestion = data.data.suggestion
      setCustomEventTime({
        startTime: new Date(suggestion.suggestedTime).toISOString().slice(0, 16), // Format for datetime-local input
        endTime: new Date(suggestion.suggestedEndTime).toISOString().slice(0, 16)
      })
      setShowCalendarSuggestion(true)
    },
    onError: (error: any) => {
      toast({
        title: "Suggestion Failed",
        description: error.response?.data?.error || "Failed to generate calendar suggestion",
        variant: "destructive"
      })
    }
  })

  const createCalendarEventMutation = useMutation({
    mutationFn: async () => {
      if (!task) throw new Error('No task to create calendar event for')
      
      // Use custom time if provided, otherwise fall back to AI suggestion
      const startTime = customEventTime.startTime || calendarSuggestion?.suggestedTime
      const endTime = customEventTime.endTime || calendarSuggestion?.suggestedEndTime
      
      if (!startTime || !endTime) {
        throw new Error('Start time and end time are required')
      }
      
      // Create the calendar event with clean title (no "Prep for:" in event title)
      const eventTitle = task.title.replace(/^Prep for:\s*/i, '');
      
      const eventResponse = await api.post('/calendar', {
        title: eventTitle,
        description: task.description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        location: task.location || undefined,
        budgetImpact: task.budgetImpact || 0
      })
      
      // Update the task to link it to the new event and mark it as a prep task
      const updateData: any = {
        eventId: eventResponse.data.data.id,
        title: task.title.replace(/^Prep for:\s*/i, ''), // Keep clean title, event relationship shown separately
        // Keep all other task properties unchanged
        description: task.description,
        priority: task.priority
      }
      
      // Only include optional fields if they have values (not null/undefined)
      if (task.energyRequired !== null && task.energyRequired !== undefined) {
        updateData.energyRequired = task.energyRequired
      }
      if (task.budgetImpact !== null && task.budgetImpact !== undefined) {
        updateData.budgetImpact = task.budgetImpact
      }
      if (task.estimatedDuration !== null && task.estimatedDuration !== undefined) {
        updateData.estimatedDuration = task.estimatedDuration
      }
      if (task.location !== null && task.location !== undefined && task.location !== '') {
        updateData.location = task.location
      }
      if (task.notes !== null && task.notes !== undefined && task.notes !== '') {
        updateData.notes = task.notes
      }
      
      await api.put(`/tasks/${task.id}`, updateData)
      
      return eventResponse.data
    },
    onSuccess: () => {
      toast({
        title: "Calendar Event Created!",
        description: "The task has been converted to a calendar event and linked as a preparation task"
      })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setShowCalendarSuggestion(false)
      setCalendarSuggestion(null)
      // Close the modal since the task is now linked to the event
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Event",
        description: error.response?.data?.error || "Failed to create calendar event",
        variant: "destructive"
      })
    }
  })


  // AI Suggest Task Mutation
  const aiSuggestMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ai-suggestions/task')
      return response.data
    },
    onSuccess: (data) => {
      const suggestion = data.data
      setFormData({
        ...formData,
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority as Priority,
        estimatedDuration: suggestion.estimatedDuration
      })
      toast({
        title: "✨ AI Suggested Task",
        description: `${suggestion.reasoning}\n\nReview the suggestion below and click "Create Task" to save it!`,
        duration: 8000
      })
    },
    onError: (error: any) => {
      toast({
        title: "Suggestion Failed",
        description: error.response?.data?.error || "Failed to generate task suggestion",
        variant: "destructive"
      })
    }
  })

  // Voice to Task Mutation
  const voiceInputMutation = useMutation({
    mutationFn: async (transcript: string) => {
      const response = await api.post('/ai-suggestions/voice-to-task', { transcript })
      return response.data
    },
    onSuccess: (data) => {
      const parsed = data.data
      setFormData({
        title: parsed.title,
        description: parsed.description,
        notes: parsed.notes,
        location: parsed.location,
        priority: parsed.priority as Priority,
        estimatedDuration: parsed.estimatedDuration
      })
      toast({
        title: "🎤 Voice Understood!",
        description: "Task details filled from your voice input",
        duration: 4000
      })
    },
    onError: (error: any) => {
      toast({
        title: "Voice Input Failed",
        description: error.response?.data?.error || "Failed to process voice input",
        variant: "destructive"
      })
    }
  })

  const handleAISuggest = () => {
    aiSuggestMutation.mutate()
  }

  const handleVoiceInput = () => {
    // Use Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser. Try Chrome or Edge.",
        variant: "destructive"
      })
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      toast({
        title: "🎤 Listening...",
        description: "Speak naturally about the task you want to create",
        duration: 10000
      })
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      console.log('Voice transcript:', transcript)
      voiceInputMutation.mutate(transcript)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      toast({
        title: "Voice Error",
        description: `Speech recognition error: ${event.error}`,
        variant: "destructive"
      })
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleSave = () => {
    if (task) {
      updateTaskMutation.mutate(formData)
    } else {
      createTaskMutation.mutate(formData)
    }
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    deleteTaskMutation.mutate()
    setShowDeleteConfirm(false)
  }

  const handleComplete = () => {
    console.log('🎯 TaskModal: Complete button clicked for task:', task?.id, task?.title)
    completeTaskMutation.mutate()
  }

  const handleUncomplete = () => {
    console.log('🎯 TaskModal: Uncomplete button clicked for task:', task?.id, task?.title)
    uncompleteTaskMutation.mutate()
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleClose = () => {
    setIsEditing(false)
    setShowCalendarSuggestion(false)
    setCalendarSuggestion(null)
    onClose()
  }

  const handleSuggestCalendar = () => {
    suggestCalendarEventMutation.mutate()
  }

  const handleConvertToPrep = () => {
    if (!selectedEventId) {
      toast({
        title: "Please select an event",
        description: "You need to choose an event to convert this task to a prep task",
        variant: "destructive"
      })
      return
    }
    convertToPrepMutation.mutate(selectedEventId)
  }

  // Fetch resources for the task
  const { data: resourceData } = useQuery({
    queryKey: ['task-resources', task?.id],
    queryFn: async () => {
      if (!task?.id) return []
      try {
        const response = await api.get(`/resources/tasks/${task.id}/resources`)
        console.log('🔍 Resource query response:', response.data)
        return response.data.data.resources || []
      } catch (error) {
        console.error('🔍 Resource query error:', error)
        return []
      }
    },
    enabled: !!task?.id && isOpen,
    staleTime: 30 * 1000, // 30 seconds cache to prevent flickering
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true, // Refetch when modal opens
    refetchOnWindowFocus: false, // Don't refetch on focus
  })

  // Fetch events for conversion dropdown
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.get('/calendar')
      return response.data.data || []
    },
    enabled: showConvertToPrep,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Convert task to prep task mutation
  const convertToPrepMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!task) throw new Error('No task to convert')
      const response = await api.post(`/tasks/${task.id}/convert-to-prep`, { eventId })
      return response.data
    },
    onSuccess: (data) => {
      toast({
        title: "Task Converted!",
        description: data.message || "Task has been converted to a prep task"
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      setShowConvertToPrep(false)
      setSelectedEventId('')
      onTaskUpdated?.(data.data)
    },
    onError: (error: any) => {
      toast({
        title: "Conversion Failed",
        description: error.response?.data?.error || "Failed to convert task to prep task",
        variant: "destructive"
      })
    }
  })
  
  const resourceCount = Array.isArray(resourceData) ? resourceData.length : 0
  const resourceNames = Array.isArray(resourceData) 
    ? resourceData.map((r: any) => r.title || 'Untitled')
    : []
  
  console.log(`📎 TaskModal for "${task?.title}": count=${resourceCount}, names=`, resourceNames)

  const handleCreateCalendarEvent = () => {
    createCalendarEventMutation.mutate()
  }

  const handleOpenResources = () => {
    setResourcesDrawerOpen(true)
  }

  const handleCloseResources = () => {
    setResourcesDrawerOpen(false)
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold">
              {!task ? 'Create New Task' : (isEditing ? 'Edit Task' : 'Task Details')}
            </h2>
            {task && !isEditing && resourceCount > 0 && (
              <ResourcesBadge 
                count={resourceCount} 
                onClick={handleOpenResources}
                resourceNames={resourceNames}
              />
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Voice Input Button - Show when creating new task or editing existing task */}
            {(!task || isEditing) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleVoiceInput}
                disabled={voiceInputMutation.isPending}
                className="flex items-center gap-2"
              >
                {voiceInputMutation.isPending ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Listening...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    {!task ? 'Voice Create' : 'Voice Edit'}
                  </>
                )}
              </Button>
            )}
            
            {/* Suggest Task Button - Show when creating new task */}
            {!task && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAISuggest}
                disabled={aiSuggestMutation.isPending}
                className="flex items-center gap-2"
              >
                {aiSuggestMutation.isPending ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI Suggest
                  </>
                )}
              </Button>
            )}
            {task && !isEditing && resourceCount > 0 && (
              <ResourcesBadge 
                count={resourceCount} 
                onClick={handleOpenResources}
                resourceNames={resourceNames}
              />
            )}
            {task && isEditing && (
              <ResourcesBadge 
                count={resourceCount} 
                onClick={handleOpenResources}
                alwaysShow={true}
                resourceNames={resourceNames}
              />
            )}
            {task && (
              <BudgetChip
                taskId={task.id}
                onClick={() => setBudgetModalOpen(true)}
                className="ml-2"
                editMode={isEditing}
              />
            )}
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {!task || isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Where should this task be performed?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="w-full p-2 border rounded-md text-black"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{task?.title}</h3>
                {task?.description && (
                  <p className="text-muted-foreground mt-2">{task.description}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    task?.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                    task?.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    task?.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task?.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    task?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    task?.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task?.status}
                  </span>
                </div>

                {task?.estimatedDuration && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{task.estimatedDuration} minutes</span>
                  </div>
                )}

                {task?.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{task.location}</span>
                  </div>
                )}

                {task && (
                  <BudgetSummary taskId={task.id} />
                )}

                {task?.notes && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {task.notes}
                    </p>
                  </div>
                )}

                {task?.dueDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Due: {task.type === 'PREPARATION' ? formatDateTime(task.dueDate) : new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Calendar Suggestion Section */}
        {showCalendarSuggestion && calendarSuggestion && (
          <div className="border-t p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">AI Calendar Suggestion</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCalendarSuggestion(false)
                  setCustomEventTime({ startTime: '', endTime: '' })
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              {/* AI Suggestion Display */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">AI Suggested Time:</span>
                </div>
                <div className="text-sm text-blue-700">
                  {new Date(calendarSuggestion.suggestedTime).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })} - {new Date(calendarSuggestion.suggestedEndTime).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
                
                <p className="text-sm text-blue-800">
                  <strong>Reasoning:</strong> {calendarSuggestion.reasoning}
                </p>
                
                {calendarSuggestion.conflicts.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Potential conflicts:</p>
                      <ul className="text-sm text-orange-700 list-disc list-inside">
                        {calendarSuggestion.conflicts.map((conflict, index) => (
                          <li key={index}>{conflict}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Date/Time Input Fields */}
              <div className="border-t border-blue-200 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Customize Event Time:</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="startTime" className="text-sm font-medium text-blue-800">
                        Start Time
                      </Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={customEventTime.startTime}
                        onChange={(e) => setCustomEventTime(prev => ({ ...prev, startTime: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="endTime" className="text-sm font-medium text-blue-800">
                        End Time
                      </Label>
                      <Input
                        id="endTime"
                        type="datetime-local"
                        value={customEventTime.endTime}
                        onChange={(e) => setCustomEventTime(prev => ({ ...prev, endTime: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-blue-600">
                    💡 You can modify the AI-suggested time above, or keep the original suggestion
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCalendarSuggestion(false)
                  setCustomEventTime({ startTime: '', endTime: '' })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCalendarEvent}
                disabled={createCalendarEventMutation.isPending}
              >
                {createCalendarEventMutation.isPending ? 'Creating...' : 'Create Calendar Event'}
              </Button>
            </div>
          </div>
        )}

        {/* Notes Suggestion Section */}

        {/* AI Suggestions */}
        {isEditing && formData.title && (
          <div className="px-6 pb-4 border-t pt-4">
            <InlineSuggestions 
              type="task"
              context={formData.title}
              onAccept={(suggestion, createdId) => {
                queryClient.invalidateQueries({ queryKey: ['tasks'] })
                queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                toast({
                  title: 'Task Created',
                  description: `Created: ${suggestion.title}`
                })
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <div className="flex space-x-2">
            {!isEditing && task && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestCalendar}
                  disabled={suggestCalendarEventMutation.isPending}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {suggestCalendarEventMutation.isPending ? 'Analyzing...' : 'Suggest Calendar Event'}
                </Button>
                {task.status !== 'COMPLETED' ? (
                  <Button
                    onClick={() => {
                      console.log('🎯 BUTTON CLICKED: Complete Task button clicked!')
                      handleComplete()
                    }}
                    disabled={completeTaskMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    {completeTaskMutation.isPending ? 'Completing...' : 'Complete Task'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      console.log('🎯 BUTTON CLICKED: Uncomplete Task button clicked!')
                      handleUncomplete()
                    }}
                    disabled={uncompleteTaskMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                    size="sm"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    {uncompleteTaskMutation.isPending ? 'Uncompleting...' : 'Uncomplete Task'}
                  </Button>
                )}
                {/* Convert to Prep Task Button - only show if task is not already a prep task */}
                {(() => {
                  console.log('🔍 TaskModal: Checking task for Convert to Prep Task button:', JSON.stringify({
                    taskId: task.id,
                    taskTitle: task.title,
                    eventId: task.eventId,
                    hasEventId: !!task.eventId,
                    shouldShowButton: !task.eventId
                  }, null, 2));
                  console.log('🔍 TaskModal: Full task object:', JSON.stringify(task, null, 2));
                  return !task.eventId;
                })() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConvertToPrep(!showConvertToPrep)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Convert to Prep Task
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex space-x-2">
            {!isEditing && task && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteTaskMutation.isPending}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete Task'}
              </Button>
            )}
            {(isEditing || !task) && (
              <>
                {task && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={task ? updateTaskMutation.isPending : createTaskMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {task 
                    ? (updateTaskMutation.isPending ? 'Saving...' : 'Save Changes')
                    : (createTaskMutation.isPending ? 'Creating...' : 'Create Task')
                  }
                </Button>
              </>
            )}
            {!isEditing && task && (
              <Button
                variant="outline"
                onClick={handleEdit}
              >
                Edit Task
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteTaskMutation.isPending}
      />
      
      {/* Resources Drawer */}
      {task && (
        <ResourcesDrawer
          taskId={task.id}
          isOpen={resourcesDrawerOpen}
          onClose={handleCloseResources}
        />
      )}
      
      {/* Budget Modal */}
      {task && (
        <BudgetModal
          taskId={task.id}
          isOpen={budgetModalOpen}
          onClose={() => setBudgetModalOpen(false)}
        />
      )}
      
      {/* Line Items Viewer */}
      {task && (
        <LineItemsViewer
          taskId={task.id}
          isOpen={lineItemsViewerOpen}
          onClose={() => setLineItemsViewerOpen(false)}
        />
      )}

      {/* Convert to Prep Task Modal */}
      {showConvertToPrep && task && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Convert to Prep Task</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select an event to convert "{task.title}" into a preparation task.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Event:</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-black dark:text-white"
                >
                  <option value="">Choose an event...</option>
                  {events?.map((event: any) => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {new Date(event.startTime).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConvertToPrep(false)
                    setSelectedEventId('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConvertToPrep}
                  disabled={convertToPrepMutation.isPending || !selectedEventId}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {convertToPrepMutation.isPending ? 'Converting...' : 'Convert Task'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
