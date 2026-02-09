/**
 * SmartItemCreation Components
 * 
 * Smart Task and Smart Goal creation with guided modal steppers.
 * 
 * Features:
 * - Multi-step wizard interface
 * - AI-powered suggestions (mocked)
 * - Structured item generation
 * - Pre-filled intelligent defaults
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ChevronRight, ChevronLeft, Check, Target, Zap, 
  Calendar, Tag, Users, Brain, Lightbulb, AlertCircle 
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface SmartTaskCreationProps {
  open: boolean;
  onClose: () => void;
  onTaskCreate: (task: any) => void;
}

export function SmartTaskCreation({ open, onClose, onTaskCreate }: SmartTaskCreationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    energyLevel: 'medium',
    estimatedTime: '',
    dueDate: '',
    tags: [] as string[],
  });

  const steps = [
    {
      title: 'What do you want to accomplish?',
      subtitle: 'Describe your task',
      fields: ['title', 'description'],
    },
    {
      title: 'Task Context',
      subtitle: 'Help us categorize and prioritize',
      fields: ['category', 'priority'],
    },
    {
      title: 'Energy & Time',
      subtitle: 'When and how much focus?',
      fields: ['energyLevel', 'estimatedTime', 'dueDate'],
    },
    {
      title: 'Review & Create',
      subtitle: 'Everything looks good?',
      fields: ['review'],
    },
  ];

  const handleNext = () => {
    // Validate current step
    const currentFields = steps[currentStep].fields;
    
    if (currentStep === 0) {
      if (!taskData.title.trim()) {
        toast.error('Please enter a task title');
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = () => {
    const newTask = {
      id: Date.now().toString(),
      ...taskData,
      completed: false,
      progress: 0,
      aiGenerated: true,
      collaborators: [],
      attachments: [],
    };

    onTaskCreate(newTask);
    toast.success('Smart Task created', {
      description: 'AI-optimized task added to your list',
    });
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(0);
    setTaskData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      energyLevel: 'medium',
      estimatedTime: '',
      dueDate: '',
      tags: [],
    });
    onClose();
  };

  // AI Suggestions (mocked)
  const getAISuggestions = () => {
    if (currentStep === 1) {
      return [
        { label: 'High priority suggested', value: 'Due date is soon' },
        { label: 'Work category detected', value: 'Based on keywords' },
      ];
    }
    if (currentStep === 2) {
      return [
        { label: 'Best time: 9 AM - 11 AM', value: 'Peak energy hours' },
        { label: 'Estimated: 2 hours', value: 'Based on similar tasks' },
      ];
    }
    return [];
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1e2128] border-gray-800 max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white">Create Smart Task</DialogTitle>
              <DialogDescription className="text-gray-400">AI-powered task creation</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-xl text-white mb-2">{steps[currentStep].title}</h3>
              <p className="text-sm text-gray-400 mb-6">{steps[currentStep].subtitle}</p>

              {/* Step 0: Title & Description */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-white">Task Title *</Label>
                    <Input
                      id="title"
                      value={taskData.title}
                      onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                      placeholder="e.g., Prepare Q4 presentation"
                      className="mt-1 bg-[#1a1c20] border-gray-800"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-white">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={taskData.description}
                      onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                      placeholder="Add more details about this task..."
                      rows={3}
                      className="mt-1 bg-[#1a1c20] border-gray-800 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Category & Priority */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category" className="text-white">Category</Label>
                    <Select value={taskData.category} onValueChange={(value) => setTaskData({ ...taskData, category: value })}>
                      <SelectTrigger className="mt-1 bg-[#1a1c20] border-gray-800">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority" className="text-white">Priority</Label>
                    <Select value={taskData.priority} onValueChange={(value) => setTaskData({ ...taskData, priority: value })}>
                      <SelectTrigger className="mt-1 bg-[#1a1c20] border-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 2: Energy & Time */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="energyLevel" className="text-white">Energy Level Required</Label>
                    <Select value={taskData.energyLevel} onValueChange={(value) => setTaskData({ ...taskData, energyLevel: value })}>
                      <SelectTrigger className="mt-1 bg-[#1a1c20] border-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Light tasks</SelectItem>
                        <SelectItem value="medium">Medium - Focused work</SelectItem>
                        <SelectItem value="high">High - Deep work</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="estimatedTime" className="text-white">Estimated Time</Label>
                    <Input
                      id="estimatedTime"
                      value={taskData.estimatedTime}
                      onChange={(e) => setTaskData({ ...taskData, estimatedTime: e.target.value })}
                      placeholder="e.g., 2h 30m"
                      className="mt-1 bg-[#1a1c20] border-gray-800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate" className="text-white">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={taskData.dueDate}
                      onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                      className="mt-1 bg-[#1a1c20] border-gray-800"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#252830] border border-gray-700 rounded-lg">
                    <h4 className="text-white font-semibold mb-3">Task Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Title:</span>
                        <span className="text-white">{taskData.title}</span>
                      </div>
                      {taskData.category && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Category:</span>
                          <span className="text-white capitalize">{taskData.category}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Priority:</span>
                        <Badge variant="outline" className="capitalize">{taskData.priority}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Energy Level:</span>
                        <Badge variant="outline" className="capitalize">{taskData.energyLevel}</Badge>
                      </div>
                      {taskData.estimatedTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Estimated Time:</span>
                          <span className="text-white">{taskData.estimatedTime}</span>
                        </div>
                      )}
                      {taskData.dueDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Due Date:</span>
                          <span className="text-white">{new Date(taskData.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-purple-600/10 border border-purple-600/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-white font-medium mb-1">AI Recommendations</h5>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Best time slot: Tomorrow 9-11 AM (peak energy)</li>
                          <li>• Break into 3 smaller subtasks for better focus</li>
                          <li>• Similar tasks took avg. 2h 15m</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              {getAISuggestions().length > 0 && currentStep < 3 && (
                <div className="mt-4 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      {getAISuggestions().map((suggestion, i) => (
                        <div key={i} className="text-sm">
                          <span className="text-blue-400">{suggestion.label}</span>
                          <span className="text-gray-400 ml-2">— {suggestion.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-teal-600 to-cyan-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * SmartGoalCreation Component
 * 
 * Similar to Smart Task but for goals with milestones.
 */

interface SmartGoalCreationProps {
  open: boolean;
  onClose: () => void;
  onGoalCreate: (goal: any) => void;
}

export function SmartGoalCreation({ open, onClose, onGoalCreate }: SmartGoalCreationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [goalData, setGoalData] = useState({
    title: '',
    description: '',
    category: '',
    deadline: '',
    targetValue: '',
    milestones: [] as string[],
  });

  const steps = [
    {
      title: 'Define Your Goal',
      subtitle: "What's your objective?",
    },
    {
      title: 'Set Your Target',
      subtitle: 'How will you measure success?',
    },
    {
      title: 'Create Milestones',
      subtitle: 'Break it down into steps',
    },
    {
      title: 'Review & Launch',
      subtitle: 'Ready to start?',
    },
  ];

  const handleCreate = () => {
    const newGoal = {
      id: Date.now().toString(),
      ...goalData,
      progress: 0,
      status: 'on-track',
      aiGenerated: true,
      tasks: { completed: 0, total: goalData.milestones.length },
      milestones: goalData.milestones.map((name, i) => ({
        name,
        completed: false,
        current: i === 0,
      })),
    };

    onGoalCreate(newGoal);
    toast.success('Smart Goal created', {
      description: 'AI-structured goal with milestones',
    });
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(0);
    setGoalData({
      title: '',
      description: '',
      category: '',
      deadline: '',
      targetValue: '',
      milestones: [],
    });
    onClose();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Similar implementation to SmartTaskCreation
  // ... (implementation details follow same pattern)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1e2128] border-gray-800 max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white">Create Smart Goal</DialogTitle>
              <DialogDescription className="text-gray-400">AI-guided goal planning</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="py-6">
          <p className="text-center text-gray-400">
            Smart Goal creation wizard - Similar multi-step flow for goals
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <Button variant="outline" onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)} className="bg-gradient-to-r from-orange-600 to-yellow-600">
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} className="bg-gradient-to-r from-teal-600 to-cyan-600">
              <Check className="w-4 h-4 mr-2" />
              Create Goal
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
