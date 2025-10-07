import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Folder, 
  Users, 
  CheckSquare, 
  Clock,
  TrendingUp,
  Calendar,
  Target,
  Plus
} from 'lucide-react';

interface ProjectMember {
  id: string;
  name: string;
  role: string;
}

interface ProjectTask {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'blocked';
  assignee: string;
}

interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
}

interface Project {
  id: number;
  name: string;
  description: string;
  progress: number;
  members: ProjectMember[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  upcomingTasks: ProjectTask[];
  milestones: ProjectMilestone[];
  dueDate: string;
  status: 'on_track' | 'at_risk' | 'ahead';
}

interface ProjectDetailCardProps {
  project: Project;
  onAddTask?: () => void;
  onViewDetails?: () => void;
}

export function ProjectDetailCard({ project, onAddTask, onViewDetails }: ProjectDetailCardProps) {
  const getStatusColor = () => {
    switch (project.status) {
      case 'on_track':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'at_risk':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'ahead':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTaskStatusColor = (status: ProjectTask['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'blocked':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Folder className="w-6 h-6 text-violet-600" />
              <CardTitle className="text-xl">{project.name}</CardTitle>
            </div>
            <p className="text-sm text-gray-600">{project.description}</p>
          </div>
          <Badge className={`${getStatusColor()} text-xs font-medium`}>
            {project.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Progress Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
            <span className="text-2xl font-bold text-violet-600">{project.progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${project.progress}%`,
                backgroundImage: 'linear-gradient(to right, rgb(139 92 246), rgb(168 85 247))'
              }}
            />
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
            <TrendingUp className="w-3 h-3" />
            <span>{project.completedTasks} / {project.totalTasks} tasks complete</span>
          </div>
        </div>

        {/* Task Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs text-green-600 font-medium mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-700">{project.completedTasks}</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-600 font-medium mb-1">In Progress</div>
            <div className="text-2xl font-bold text-blue-700">{project.inProgressTasks}</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-xs text-red-600 font-medium mb-1">Blocked</div>
            <div className="text-2xl font-bold text-red-700">{project.blockedTasks}</div>
          </div>
        </div>

        {/* Team Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team ({project.members.length})
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project.members.slice(0, 5).map((member) => (
              <Avatar key={member.id} className="w-8 h-8 border-2 border-white">
                <AvatarFallback 
                  className="text-white text-xs"
                  style={{ backgroundImage: 'linear-gradient(to bottom right, rgb(168 85 247), rgb(236 72 153))' }}
                  title={`${member.name} - ${member.role}`}
                >
                  {member.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.members.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                +{project.members.length - 5}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Upcoming Tasks
            </div>
            <Button size="sm" variant="ghost" onClick={onAddTask}>
              <Plus className="w-3 h-3 mr-1" />
              Add Task
            </Button>
          </div>
          <div className="space-y-2">
            {project.upcomingTasks.map((task) => (
              <div 
                key={task.id}
                className="p-2 bg-white rounded border hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-800">{task.title}</span>
                  <Badge className={`${getTaskStatusColor(task.status)} text-xs`}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-1">{task.assignee}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div>
          <div className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" />
            Milestones
          </div>
          <div className="space-y-2">
            {project.milestones.map((milestone) => (
              <div 
                key={milestone.id}
                className={`p-2 rounded border ${
                  milestone.isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {milestone.isCompleted && (
                      <CheckSquare className="w-4 h-4 text-green-600" />
                    )}
                    <span className={`text-sm ${milestone.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {milestone.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    {milestone.dueDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button 
            onClick={onViewDetails}
            className="flex-1 text-white"
            style={{ backgroundImage: 'linear-gradient(to right, rgb(139 92 246), rgb(168 85 247))' }}
          >
            View Full Details
          </Button>
          <Button variant="outline" className="flex-1">
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

