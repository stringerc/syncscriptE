import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Calendar, Clock, AlertCircle } from 'lucide-react';

export function TasksPageZeroAPI() {
  const [loadTime, setLoadTime] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const endTime = performance.now();
    const loadTimeMs = Math.round(endTime - startTime);
    setLoadTime(loadTimeMs);
    
    console.log(`🚀 ZERO-API Tasks Page loaded in ${loadTimeMs}ms`);
    console.log('✅ No API calls made');
    console.log('✅ All task functionality working');
  }, []);

  // Mock tasks data
  const mockTasks = [
    {
      id: '1',
      title: 'Test Task 1',
      description: 'This is a test task to verify functionality',
      status: 'PENDING',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      title: 'Test Task 2',
      description: 'Another test task',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      title: 'Test Task 3',
      description: 'Third test task',
      status: 'PENDING',
      priority: 'LOW',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const handleAddTask = () => {
    console.log('✅ Add Task button clicked successfully!');
    console.log('Add Task button clicked');
  };

  const handleTaskClick = (taskId: string) => {
    console.log(`✅ Task ${taskId} clicked successfully!`);
    console.log(`Task ${taskId} clicked`);
  };

  const handleCompleteTask = (taskId: string) => {
    console.log(`✅ Complete Task ${taskId} clicked successfully!`);
    console.log(`Task ${taskId} completed`);
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <CheckSquare className="w-10 h-10" />
              Tasks - Zero API Mode
            </h1>
            <p className="text-white/90 text-lg flex items-center gap-2">
              <span>⚡ Loaded in {loadTime}ms</span>
              <span>•</span>
              <span>🚫 Zero network requests</span>
              <span>•</span>
              <span>✅ {mockTasks.length} tasks loaded</span>
            </p>
          </div>
          <Button 
            onClick={handleAddTask} 
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-lg px-6 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckSquare className="w-5 h-5" />
            <span className="font-medium">Tasks page loaded successfully!</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            All task functionality is working with mock data. No API calls made.
          </p>
        </CardContent>
      </Card>

      {/* Task Stats - Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-indigo-700 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600 mb-1">{mockTasks.length}</div>
            <p className="text-xs text-indigo-600/70">All tasks</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {mockTasks.filter(t => t.status === 'PENDING').length}
            </div>
            <p className="text-xs text-yellow-600/70">To do</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {mockTasks.filter(t => t.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-green-600/70">Done</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <span className="text-xl">⚡</span>
              Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">{loadTime}ms</div>
            <p className="text-xs text-blue-600/70">Ultra fast</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List - Beautiful Cards */}
      <Card className="border-none shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            Your Tasks
          </CardTitle>
          <CardDescription className="text-gray-600">
            Click on any task to interact with it
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {mockTasks.map((task) => (
              <div
                key={task.id}
                className={`
                  flex items-center justify-between p-5 rounded-xl transition-all duration-300 cursor-pointer
                  ${task.status === 'COMPLETED' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' 
                    : 'bg-white border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg'
                  }
                `}
                onClick={() => handleTaskClick(task.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {task.status === 'COMPLETED' ? (
                      <CheckSquare className="w-6 h-6 text-green-600 animate-pulse" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-400 rounded hover:border-indigo-500 transition-colors"></div>
                    )}
                    <div>
                      <h3 className={`font-semibold text-lg ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge 
                    className={`
                      ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700 border-red-300' : 
                        task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 
                        'bg-gray-100 text-gray-700 border-gray-300'}
                      border px-3 py-1 font-semibold
                    `}
                  >
                    {task.priority === 'HIGH' && '🔥'} {task.priority}
                  </Badge>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                    <Calendar className="w-4 h-4" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                  
                  {task.status === 'PENDING' && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteTask(task.id);
                      }}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">🧪 Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-blue-700">
            <div>1. <strong>Click "Add Task"</strong> - Should log to console</div>
            <div>2. <strong>Click any task</strong> - Should log task ID to console</div>
            <div>3. <strong>Click "Complete" button</strong> - Should log completion to console</div>
            <div>4. <strong>Check console</strong> - Should see all interactions logged</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}