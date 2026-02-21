import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/railway-api'
import { cn } from '@/lib/utils'
import type { Task, Event, Achievement, Streak, Notification } from '@/types/syncscript'
import {
  CheckSquare,
  Calendar,
  Zap,
  Target,
  AlertCircle,
  Trophy,
  Trash2,
  Plus,
} from 'lucide-react'

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
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

interface DashboardData {
  user: { name?: string; email: string }
  todayTasks: Task[]
  upcomingEvents: Event[]
  recentAchievements: Achievement[]
  activeStreaks: Streak[]
  unreadNotifications: Notification[]
}

export function AppDashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/user/dashboard')
      return (res.data?.data ?? res.data) as DashboardData
    },
  })

  const completeTaskMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  })
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  })
  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/calendar/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  })

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Unable to load dashboard data</h2>
          <p className="text-muted-foreground mb-4">Something went wrong. Please try again.</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboard'] })}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const { user, todayTasks = [], upcomingEvents = [], recentAchievements = [], activeStreaks = [], unreadNotifications = [] } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening today</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Tasks</CardTitle>
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto" onClick={() => navigate('/app/tasks')}>
              <Plus className="w-4 h-4 mr-1" /> Add Task
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto" onClick={() => navigate('/app/calendar')}>
              <Plus className="w-4 h-4 mr-1" /> Add Event
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Streaks</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStreaks.reduce((s, x) => s + (x.count ?? 0), 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notifications</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications.filter((n) => !n.isRead).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Unread</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today's Tasks</CardTitle>
              <CardDescription>Your tasks for today</CardDescription>
            </div>
            <Button size="sm" onClick={() => navigate('/app/tasks')}>
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No tasks for today</p>
            ) : (
              <ul className="space-y-2">
                {todayTasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <span className={cn('text-xs px-2 py-0.5 rounded', getPriorityColor(task.priority))}>
                        {task.priority}
                      </span>
                      <span className="ml-2 font-medium truncate">{task.title}</span>
                      {task.estimatedDuration && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDuration(task.estimatedDuration)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {task.status !== 'COMPLETED' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => completeTaskMutation.mutate(task.id)}
                          disabled={completeTaskMutation.isPending}
                        >
                          <CheckSquare className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        disabled={deleteTaskMutation.isPending}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your upcoming events</CardDescription>
            </div>
            <Button size="sm" onClick={() => navigate('/app/calendar')}>
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No upcoming events</p>
            ) : (
              <ul className="space-y-2">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{event.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(event.startTime)} {formatTime(event.startTime)}
                        {event.location && ` · ${event.location}`}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteEventMutation.mutate(event.id)}
                      disabled={deleteEventMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" /> Recent Achievements
          </CardTitle>
          <CardDescription>Your latest accomplishments</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAchievements.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No achievements yet. Complete tasks to earn some!</p>
          ) : (
            <ul className="space-y-2">
              {recentAchievements.map((a) => (
                <li key={a.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Target className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-medium">{a.title}</span>
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(a.unlockedAt)}</span>
                  </div>
                  <span className="ml-auto font-semibold text-primary">+{a.points} pts</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
