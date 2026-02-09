import { useState } from 'react';
import { 
  CheckCircle2, Circle, Clock, Target, Zap, Brain, 
  Plus, Filter, Calendar, Tag, TrendingUp, Star,
  ChevronRight, Play, Pause, MoreVertical, AlertCircle,
  Edit, Trash2, Share2, Copy, Paperclip, Lightbulb, Link,
  FileText, FileSpreadsheet, File, Image, Video, Music, Archive, Code, Sparkles
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { DashboardLayout } from '../layout/DashboardLayout';
import { AIInsightsContent } from '../AIInsightsSection';
import { ResonanceBadge } from '../ResonanceBadge';
import { NewTaskDialog, NewGoalDialog, VoiceToTaskDialog, AITaskGenerationDialog, AIGoalGenerationDialog, StartFocusDialog } from '../QuickActionsDialogs';
import { EnhancedTaskGoalDialog } from '../EnhancedTaskGoalDialog';
import { TaskGoalFiltersComponent, TaskGoalFilters } from '../TaskGoalFilters';
import { AttachmentManager, Attachment } from '../AttachmentManager';
import { AnimatedAvatar } from '../AnimatedAvatar';
import { Resource, ResourceIcons } from '../ResourceManager';
import { SmartTaskCreation, SmartGoalCreation } from '../SmartItemCreation';
import { ImportSelector } from '../ImportSelector';
import { filterTasks, filterGoals, extractUniqueTags, extractUniqueOwners } from '../../utils/task-goal-filters';

export function TasksGoalsPage() {
  const [activeView, setActiveView] = useState<'tasks' | 'goals'>('tasks');
  
  // Simplified data for now
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Complete budget allocation analysis',
      priority: 'high',
      energyLevel: 'high',
      estimatedTime: '2h 30m',
      progress: 65,
      tags: ['Finance', 'Urgent'],
      dueDate: 'Today, 3:00 PM',
      completed: false,
      collaborators: [],
      attachments: [],
      resources: [],
    }
  ]);

  const [goals, setGoals] = useState([
    {
      id: '1',
      title: 'Improve financial planning skills',
      progress: 45,
      deadline: 'Q1 2025',
      status: 'on-track',
      streak: 12,
      thisWeek: 3,
    }
  ]);

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white mb-2">Tasks & Goals</h1>
            <p className="text-gray-400">AI-powered task management and goal tracking</p>
          </div>
        </div>

        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'tasks' | 'goals')} defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-white text-xl mb-4">Tasks</h2>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        <Circle className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <h3 className="text-white">{task.title}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {task.priority}
                            </Badge>
                            <span className="text-sm text-gray-400">{task.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {task.progress > 0 && (
                      <div className="mt-3">
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-white text-xl mb-4">Goals</h2>
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="text-white mb-2">{goal.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <span>Deadline: {goal.deadline}</span>
                      <span>Status: {goal.status}</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
