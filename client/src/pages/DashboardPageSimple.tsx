import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuthStore } from '@/stores/authStore';
import { 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  Zap, 
  Trophy,
  Plus,
  AlertCircle
} from 'lucide-react';

interface SimpleDashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    energyLevel: number;
  };
  todayTasks: any[];
  upcomingEvents: any[];
  recentAchievements: any[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalPoints: number;
    level: number;
  };
}

export function DashboardPageSimple() {
  const { user, token } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Use mock data immediately to avoid API delays
  const dashboardData: SimpleDashboardData = {
    user: {
      id: user?.id || 'mock-user',
      name: user?.name || 'User',
      email: user?.email || 'user@example.com',
      energyLevel: 7
    },
    todayTasks: [
      {
        id: '1',
        title: 'Welcome to SyncScript!',
        status: 'PENDING',
        priority: 'HIGH'
      },
      {
        id: '2', 
        title: 'Explore the dashboard',
        status: 'PENDING',
        priority: 'MEDIUM'
      }
    ],
    upcomingEvents: [
      {
        id: '1',
        title: 'Team Meeting',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      }
    ],
    recentAchievements: [
      {
        id: 'welcome',
        title: 'Welcome to SyncScript!',
        description: 'You\'ve successfully loaded the dashboard!',
        points: 10,
        icon: '🎉',
        rarity: 'common'
      },
      {
        id: 'first-login',
        title: 'First Login',
        description: 'You\'ve logged in for the first time!',
        points: 25,
        icon: '🚀',
        rarity: 'common'
      }
    ],
    stats: {
      totalTasks: 2,
      completedTasks: 0,
      totalPoints: 100,
      level: 1
    }
  };

  const isLoading = false;
  const error = null;

  // Wait for hydration
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!token) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Not Authenticated</h3>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state with fallback data
  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground">
            There was an issue loading your dashboard data.
          </p>
        </div>
      </div>
    );
  }

  const data = dashboardData!;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {data.user.name}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Energy: {data.user.energyLevel}/10
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Today's schedule
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              Level {data.stats.level}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Level</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.user.energyLevel}/10</div>
            <p className="text-xs text-muted-foreground">
              Current level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Today's Tasks
          </CardTitle>
          <CardDescription>
            Your tasks for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.todayTasks.length > 0 ? (
            <div className="space-y-2">
              {data.todayTasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      task.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <span className={task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </span>
                  </div>
                  {task.priority && (
                    <Badge variant="outline" className="text-xs">
                      {task.priority}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks for today</p>
              <Button className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {data.recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Recent Achievements
            </CardTitle>
            <CardDescription>
              Your latest accomplishments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentAchievements.slice(0, 3).map((achievement: any) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                  <Badge variant="secondary">+{achievement.points} pts</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Plus className="h-6 w-6" />
              <span className="text-sm">Add Task</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Add Event</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <DollarSign className="h-6 w-6" />
              <span className="text-sm">Add Expense</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Trophy className="h-6 w-6" />
              <span className="text-sm">View Progress</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}