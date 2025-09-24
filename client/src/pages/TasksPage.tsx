import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckSquare, Plus, Clock, DollarSign, Zap, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatDuration, formatCurrency, getPriorityColor } from '@/lib/utils'
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

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  })

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
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5" />
            <span>Your Tasks</span>
          </CardTitle>
          <CardDescription>
            {tasks?.length || 0} tasks total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks && tasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No tasks yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Create your first task to get started with SyncScript.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks?.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        task.status === 'COMPLETED' ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'
                      }`}>
                        {task.status}
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
                  <div className="flex space-x-2">
                    {task.status !== 'COMPLETED' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCompleteTask(task.id)}
                      >
                        Complete
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
