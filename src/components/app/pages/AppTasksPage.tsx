import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/railway-api'
import { cn } from '@/lib/utils'
import type { Task, Priority, TaskStatus } from '@/types/syncscript'
import { Plus, CheckSquare, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
}
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'URGENT': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950'
    case 'HIGH': return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950'
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950'
    case 'LOW': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
    default: return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950'
  }
}
function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
    case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950'
    case 'PENDING': return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950'
    case 'CANCELLED': return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950'
    case 'DEFERRED': return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950'
    default: return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950'
  }
}

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export function AppTasksPage() {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [duration, setDuration] = useState('')
  const [energyRequired, setEnergyRequired] = useState('')
  const [tags, setTags] = useState('')
  const [budgetImpact, setBudgetImpact] = useState('')

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks')
      const payload = res.data?.data ?? res.data
      return Array.isArray(payload) ? payload : (payload?.tasks ?? []) as Task[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/tasks', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setShowCreateForm(false)
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setDuration('')
      setEnergyRequired('')
      setTags('')
      setBudgetImpact('')
    },
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const handleCreate = () => {
    const payload: Record<string, unknown> = {
      title,
      description: description || undefined,
      priority,
      estimatedDuration: duration ? parseInt(duration, 10) : undefined,
      energyRequired: energyRequired ? parseInt(energyRequired, 10) : undefined,
      budgetImpact: budgetImpact ? parseFloat(budgetImpact) : undefined,
    }
    if (tags.trim()) payload.tags = tags.split(',').map((t) => t.trim()).filter(Boolean)
    createMutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your tasks and stay on track</p>
        </div>
        <Button onClick={() => setShowCreateForm((v) => !v)}>
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>New Task</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}>
              <ChevronUp className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                placeholder="Task description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Duration (minutes)</label>
                <Input
                  type="number"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Energy required</label>
                <Input
                  type="number"
                  placeholder="1-10"
                  value={energyRequired}
                  onChange={(e) => setEnergyRequired(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Tags (comma-separated)</label>
                <Input
                  placeholder="work, urgent"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Budget impact ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={budgetImpact}
                  onChange={(e) => setBudgetImpact(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending || !title.trim()}>
                Create Task
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>Your task list</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-muted-foreground py-8">No tasks yet. Create one above!</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={cn(
                    'flex items-center justify-between gap-4 p-4 rounded-lg border',
                    task.status === 'COMPLETED' && 'opacity-70'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
                        {task.priority}
                      </Badge>
                      <Badge variant="outline" className={cn('text-xs', getStatusColor(task.status))}>
                        {task.status}
                      </Badge>
                    </div>
                    <h3 className={cn('font-medium', task.status === 'COMPLETED' && 'line-through text-muted-foreground')}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {task.estimatedDuration != null && (
                        <span>Duration: {formatDuration(task.estimatedDuration)}</span>
                      )}
                      {task.energyRequired != null && (
                        <span>Energy: {task.energyRequired}</span>
                      )}
                      {task.budgetImpact != null && task.budgetImpact > 0 && (
                        <span>Budget: {formatCurrency(task.budgetImpact)}</span>
                      )}
                      {task.dueDate && (
                        <span>Due: {formatDate(task.dueDate)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {task.status !== 'COMPLETED' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => completeMutation.mutate(task.id)}
                        disabled={completeMutation.isPending}
                      >
                        <CheckSquare className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(task.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
