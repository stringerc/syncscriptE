import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
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
  Trash2
} from 'lucide-react'
import { formatDate, formatTime, formatCurrency, getPriorityColor } from '@/lib/utils'
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

export function DashboardPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/user/dashboard')
      return response.data.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false
  })

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.patch(`/tasks/${taskId}/complete`)
      return response.data
    },
    onSuccess: () => {
      // Only invalidate dashboard cache, not all caches
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: "Task Completed!",
        description: "Great job on completing that task."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to complete task",
        variant: "destructive"
      })
    }
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

  const handleCompleteTask = (taskId: string) => {
    completeTaskMutation.mutate(taskId)
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      deleteTaskMutation.mutate(taskId)
    }
  }

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteEventMutation.mutate(eventId)
    }
  }

  const handleViewEvent = (eventId: string) => {
    navigate(`/calendar?event=${eventId}`)
  }

  const handleAddTask = () => {
    navigate('/tasks')
  }

  const handleAddEvent = () => {
    navigate('/calendar')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  const { user, todayTasks, upcomingEvents, recentAchievements, activeStreaks, unreadNotifications } = dashboardData

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
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">Energy: {user.energyLevel}/10</span>
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
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayTasks.filter(t => t.status === 'COMPLETED').length} completed
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
              Next: {upcomingEvents[0]?.title || 'None'}
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
              Longest: {Math.max(...activeStreaks.map(s => s.count), 0)} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              Unread messages
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckSquare className="w-5 h-5" />
              <span>Today's Tasks</span>
            </CardTitle>
            <CardDescription>
              Your tasks for today, prioritized by AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tasks for today!</p>
                <Button className="mt-4" size="sm" onClick={handleAddTask}>
                  Add Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm">{task.title}</h4>
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
                        {task.budgetImpact && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{formatCurrency(task.budgetImpact)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCompleteTask(task.id)}
                      >
                        Complete
                      </Button>
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
                {todayTasks.length > 5 && (
                  <Button variant="ghost" className="w-full mt-2">
                    View All Tasks ({todayTasks.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Upcoming Events</span>
            </CardTitle>
            <CardDescription>
              Your scheduled events and meetings
            </CardDescription>
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
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(event.startTime)}</span>
                        </div>
                        {event.location && (
                          <span>{event.location}</span>
                        )}
                        {event.budgetImpact && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{formatCurrency(event.budgetImpact)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewEvent(event.id)}
                      >
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {upcomingEvents.length > 5 && (
                  <Button variant="ghost" className="w-full mt-2">
                    View All Events ({upcomingEvents.length})
                  </Button>
                )}
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
    </div>
  )
}
