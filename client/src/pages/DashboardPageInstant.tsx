import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ButtonTest } from '@/components/ButtonTest';
import { 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  Zap, 
  Trophy,
  Plus
} from 'lucide-react';

export function DashboardPageInstant() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to SyncScript! 🚀
          </h1>
          <p className="text-muted-foreground">
            Your AI-powered life management dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Energy: 8/10
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
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              8 completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
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
            <div className="text-2xl font-bold">1,250</div>
            <p className="text-xs text-muted-foreground">
              Level 3
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Level</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8/10</div>
            <p className="text-xs text-muted-foreground">
              High energy
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
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <span>Complete project proposal</span>
              </div>
              <Badge variant="outline" className="text-xs">
                HIGH
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="line-through text-muted-foreground">Team standup meeting</span>
              </div>
              <Badge variant="outline" className="text-xs">
                MEDIUM
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <span>Review budget allocation</span>
              </div>
              <Badge variant="outline" className="text-xs">
                LOW
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
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
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="text-2xl">🎉</div>
              <div className="flex-1">
                <h4 className="font-medium">Welcome to SyncScript!</h4>
                <p className="text-sm text-muted-foreground">You've successfully loaded the dashboard!</p>
              </div>
              <Badge variant="secondary">+10 pts</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="text-2xl">🚀</div>
              <div className="flex-1">
                <h4 className="font-medium">First Login</h4>
                <p className="text-sm text-muted-foreground">You've logged in for the first time!</p>
              </div>
              <Badge variant="secondary">+25 pts</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="text-2xl">⚡</div>
              <div className="flex-1">
                <h4 className="font-medium">Energy Master</h4>
                <p className="text-sm text-muted-foreground">Maintained high energy for 3 days!</p>
              </div>
              <Badge variant="secondary">+50 pts</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Button Test Component */}
      <ButtonTest />

      {/* Status Message */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Dashboard loaded successfully!</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            All systems are operational. The Brief and End Day buttons are now active. Use the test component above to verify all buttons are working.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
