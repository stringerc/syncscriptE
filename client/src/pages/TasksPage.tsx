import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Plus, Clock, DollarSign, Zap, Trash2, Eye, EyeOff, CheckCircle, RotateCcw, Paperclip } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatDuration, formatCurrency, getPriorityColor } from '@/lib/utils'
import { buildHierarchicalPrepChain, isPrepTask, getEventTitleFromPrepTask } from '@/lib/prepChain'
import { TaskModal } from '@/components/TaskModal'
import { ResourcesDrawer } from '@/components/ResourcesDrawer'
import { Task, Priority } from '@/shared/types'

export function TasksPage() {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    estimatedDuration: 30,
    energyRequired: 5,
    tags: ''
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)
  const [showDeletedTasks, setShowDeletedTasks] = useState(false)
  const [resourcesDrawerTaskId, setResourcesDrawerTaskId] = useState<string | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  })

  // Separate tasks into pending and completed
  const pendingTasks = tasks?.filter(task => task.status !== 'COMPLETED') || []
  const completedTasks = tasks?.filter(task => task.status === 'COMPLETED') || []
  
  // Sort pending tasks by priority
  const sortedPendingTasks = pendingTasks.sort((a, b) => {
    const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
  
  // Sort completed tasks by completion date (most recent first)
  const sortedCompletedTasks = completedTasks.sort((a, b) => {
    if (!a.updatedAt || !b.updatedAt) return 0
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  // Group completed tasks by month
  const completedTasksByMonth = sortedCompletedTasks.reduce((acc, task) => {
    if (!task.updatedAt) return acc
    
    const date = new Date(task.updatedAt)
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`
    const monthName = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        monthName,
        tasks: []
      }
    }
    acc[monthKey].tasks.push(task)
    return acc
  }, {} as Record<string, { monthName: string; tasks: Task[] }>)

  // Fetch events to show which event prep tasks are associated with
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.get('/calendar')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  })

  // Fetch deleted tasks
  const { data: deletedTasks } = useQuery<Task[]>({
    queryKey: ['deleted-tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/deleted')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  })

  // Group deleted tasks by month
  const deletedTasksByMonth = (deletedTasks || []).reduce((acc, task) => {
    if (!task.deletedAt) return acc
    
    const date = new Date(task.deletedAt)
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`
    const monthName = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        monthName,
        tasks: []
      }
    }
    acc[monthKey].tasks.push(task)
    return acc
  }, {} as Record<string, { monthName: string; tasks: Task[] }>)

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await api.post('/tasks', taskData)
      return response.data
    },
    onSuccess: () => {
      // Only invalidate tasks cache, not dashboard
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setNewTask({ title: '', description: '', priority: 'MEDIUM', estimatedDuration: 30, energyRequired: 5, tags: '' })
      setShowAddForm(false)
      toast({
        title: "Task Created!",
        description: "Your new task has been added successfully."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create task",
        variant: "destructive"
      })
    }
  })

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.patch(`/tasks/${taskId}/complete`)
      return response.data
    },
    onSuccess: () => {
      // Only invalidate tasks cache, not dashboard
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: "Task Completed!",
        description: "Great job on completing that task."
      })
    }
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.delete(`/tasks/${taskId}`)
      return response.data
    },
    onSuccess: () => {
      // Only invalidate tasks cache, not dashboard
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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

  const restoreTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.patch(`/tasks/${taskId}/restore`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['deleted-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({
        title: "Task Restored!",
        description: "Task has been restored successfully"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to restore task",
        variant: "destructive"
      })
    }
  })

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive"
      })
      return
    }
    createTaskMutation.mutate(newTask)
  }

  const handleCompleteTask = (taskId: string) => {
    completeTaskMutation.mutate(taskId)
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      deleteTaskMutation.mutate(taskId)
    }
  }

  const handleStatusChange = (taskId: string, newStatus: string) => {
    console.log('🔄 handleStatusChange called:', { taskId, newStatus })
    updateTaskStatusMutation.mutate({ taskId, status: newStatus })
  }

  const handleRestoreTask = (taskId: string) => {
    if (confirm('Are you sure you want to restore this task?')) {
      restoreTaskMutation.mutate(taskId)
    }
  }

  const handleViewTask = (taskId: string) => {
    const task = tasks?.find(t => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setIsTaskModalOpen(true)
    }
  }

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false)
    setSelectedTask(null)
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setSelectedTask(updatedTask)
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  const handleTaskDeleted = (taskId: string) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

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
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Manage your tasks with AI-powered prioritization
          </p>
        </div>
        <Button onClick={() => {
          setSelectedTask(null)
          setIsTaskModalOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
            <CardDescription>Add a new task to your list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Task Title</label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                <Input
                  type="number"
                  value={newTask.estimatedDuration}
                  onChange={(e) => setNewTask({ ...newTask, estimatedDuration: parseInt(e.target.value) || 30 })}
                  placeholder="30"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Energy Required (1-10)</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={newTask.energyRequired}
                  onChange={(e) => setNewTask({ ...newTask, energyRequired: parseInt(e.target.value) || 5 })}
                  placeholder="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <Input
                  value={newTask.tags}
                  onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                  placeholder="work, important"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5" />
            <span>Tasks</span>
            <span className="text-sm font-normal text-muted-foreground">
              ({pendingTasks.length})
            </span>
          </CardTitle>
          <CardDescription>
            Tasks to be completed, ordered by priority (1 = highest priority)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No tasks!
              </h3>
              <p className="text-muted-foreground mb-4">
                {completedTasks.length > 0 ? 'All tasks completed! 🎉' : 'Create your first task to get started.'}
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPendingTasks.map((task, index) => {
                  // Find the related event for prep tasks
                  const relatedEvent = events?.find(event => event.id === task.eventId)
                  
                  // Fetch resources for this task
                  const { data: resourceData } = useQuery({
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
                  
                  const resourceCount = Array.isArray(resourceData) ? resourceData.length : 0
                  const resourceNames = Array.isArray(resourceData) 
                    ? resourceData.map((r: any) => r.title || 'Untitled')
                    : []
                  const tooltipText = resourceNames.length > 0 
                    ? `Resources: ${resourceNames.join(', ')}` 
                    : `${resourceCount} resources`
                  
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {index + 1}
                          </div>
                          <h4 className="font-medium text-sm">
                            {task.title.replace(/^Prep for:\s*/i, '')}
                          </h4>
                          {resourceCount > 0 && (
                            <Badge 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                              title={tooltipText}
                              onClick={(e) => {
                                e.stopPropagation()
                                setResourcesDrawerTaskId(task.id)
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
                          <p className="text-xs text-muted-foreground mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          {task.estimatedDuration && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDuration(task.estimatedDuration)}</span>
                            </div>
                          )}
                          {task.energyRequired && (
                            <div className="flex items-center space-x-1">
                              <Zap className="w-3 h-3" />
                              <span>{task.energyRequired}/10</span>
                            </div>
                          )}
                          {task.budgetImpact && (
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-3 h-3" />
                              <span>{formatCurrency(task.budgetImpact)}</span>
                            </div>
                          )}
                          {task.dueDate && (
                            <span>Due: {formatDate(task.dueDate)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex space-x-2">
                          {/* Status Toggle Buttons */}
                          {/* View Button */}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewTask(task.id)}
                            title="View task details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {/* Complete Button */}
                          {task.status !== 'COMPLETED' && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleCompleteTask(task.id)}
                              disabled={completeTaskMutation.isPending}
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
                            onClick={() => handleDeleteTask(task.id)}
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Event indicator for prep tasks */}
                        {relatedEvent && (
                          <div className="text-xs text-blue-600">
                            Prep for: {relatedEvent.title}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Completed Tasks</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({completedTasks.length})
                  </span>
                </CardTitle>
                <CardDescription>
                  Tasks you've finished! 🎉
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                className="flex items-center space-x-2"
              >
                {showCompletedTasks ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Show</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {showCompletedTasks && (
            <CardContent>
              <div className="space-y-6">
                {Object.entries(completedTasksByMonth)
                  .sort(([a], [b]) => b.localeCompare(a)) // Sort months newest first
                  .map(([monthKey, { monthName, tasks }]) => (
                    <div key={monthKey} className="space-y-3">
                      <div className="flex items-center space-x-2 pb-2 border-b">
                        <h3 className="font-semibold text-lg text-green-700 dark:text-green-300">
                          {monthName}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          ({tasks.length} completed)
                        </span>
                      </div>
                      <div className="space-y-3">
                        {tasks.map((task) => {
                          // Find the related event for prep tasks
                          const relatedEvent = events?.find(event => event.id === task.eventId)
                          
                          return (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-4 rounded-lg border bg-green-50 dark:bg-green-900/20"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold">
                                    ✓
                                  </div>
                                  <h4 className="font-medium text-sm line-through text-green-700 dark:text-green-300">
                                    {task.title.replace(/^Prep for:\s*/i, '')}
                                  </h4>
                                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                </div>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mb-2 line-through">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  {task.estimatedDuration && (
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{formatDuration(task.estimatedDuration)}</span>
                                    </div>
                                  )}
                                  {task.energyRequired && (
                                    <div className="flex items-center space-x-1">
                                      <Zap className="w-3 h-3" />
                                      <span>{task.energyRequired}/10</span>
                                    </div>
                                  )}
                                  {task.updatedAt && (
                                    <span>Completed: {formatDate(task.updatedAt)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <div className="flex space-x-2">
                                  {/* View Button */}
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewTask(task.id)}
                                    title="View task details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  
                                  {/* Delete Button */}
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleDeleteTask(task.id)}
                                    title="Delete task"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                
                                {/* Event indicator for prep tasks */}
                                {relatedEvent && (
                                  <div className="text-xs text-blue-600">
                                    Prep for: {relatedEvent.title}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Deleted Tasks */}
      {deletedTasks && deletedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span>Deleted Tasks</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({deletedTasks.length})
                  </span>
                </CardTitle>
                <CardDescription>
                  Tasks you've deleted (can be restored)
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeletedTasks(!showDeletedTasks)}
                className="flex items-center space-x-2"
              >
                {showDeletedTasks ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Show</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {showDeletedTasks && (
            <CardContent>
              <div className="space-y-6">
                {Object.entries(deletedTasksByMonth)
                  .sort(([a], [b]) => b.localeCompare(a)) // Sort months newest first
                  .map(([monthKey, { monthName, tasks }]) => (
                    <div key={monthKey} className="space-y-3">
                      <div className="flex items-center space-x-2 pb-2 border-b">
                        <h3 className="font-semibold text-lg text-red-700 dark:text-red-300">
                          {monthName}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          ({tasks.length} deleted)
                        </span>
                      </div>
                      <div className="space-y-3">
                        {tasks.map((task) => {
                          // Find the related event for prep tasks
                          const relatedEvent = events?.find(event => event.id === task.eventId)
                          
                          return (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-4 rounded-lg border bg-red-50 dark:bg-red-900/20"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
                                    🗑️
                                  </div>
                                  <h4 className="font-medium text-sm text-red-700 dark:text-red-300">
                                    {task.title.replace(/^Prep for:\s*/i, '')}
                                  </h4>
                                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                </div>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  {task.estimatedDuration && (
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{formatDuration(task.estimatedDuration)}</span>
                                    </div>
                                  )}
                                  {task.energyRequired && (
                                    <div className="flex items-center space-x-1">
                                      <Zap className="w-3 h-3" />
                                      <span>{task.energyRequired}/10</span>
                                    </div>
                                  )}
                                  {task.deletedAt && (
                                    <span>Deleted: {formatDate(task.deletedAt)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <div className="flex space-x-2">
                                  {/* View Button */}
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewTask(task.id)}
                                    title="View task details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  
                                  {/* Restore Button */}
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    onClick={() => handleRestoreTask(task.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                    title="Restore task"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                </div>
                                
                                {/* Event indicator for prep tasks */}
                                {relatedEvent && (
                                  <div className="text-xs text-blue-600">
                                    Prep for: {relatedEvent.title}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
      
      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
      
      <ResourcesDrawer
        taskId={resourcesDrawerTaskId || ''}
        isOpen={!!resourcesDrawerTaskId}
        onClose={() => setResourcesDrawerTaskId(null)}
      />
    </div>
  )
}
