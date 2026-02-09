import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Calendar, Clock, Target, Zap, Plus, X, Brain, CheckCircle2, Play, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { GOAL_TEMPLATES, TEMPLATE_CATEGORIES, GoalTemplate, getTemplateById } from '../utils/goal-templates';
import { CURRENT_USER } from '../utils/user-constants';
import { LocationInput } from './LocationInput';

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (task: any) => void;
}

export function NewTaskDialog({ open, onOpenChange, onSubmit }: NewTaskDialogProps) {
  const { createTask } = useTasks();
  
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!taskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      // Create task input following the CreateTaskInput interface
      const taskInput = {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        energyLevel: taskPriority, // Map priority to energy level
        estimatedTime: estimatedTime || '1h',
        tags: tags,
        dueDate: dueDate || new Date().toISOString(), // Default to today if no date provided
        location: location || undefined,
      };

      // Use TasksContext to create the task
      const newTask = await createTask(taskInput);

      // Call optional onSubmit callback
      if (onSubmit) {
        onSubmit(newTask);
      }

      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('medium');
      setEstimatedTime('');
      setDueDate('');
      setTags([]);
      setTagInput('');
      setLocation('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      // Error toast is already shown by TasksContext
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Create New Task</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add a new task to your workflow with AI-powered scheduling suggestions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-white">Task Title *</Label>
            <Input
              id="task-title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Complete budget analysis report"
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description" className="text-white">Description</Label>
            <Textarea
              id="task-description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Add details about this task..."
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-white">Priority</Label>
              <Select value={taskPriority} onValueChange={(v) => setTaskPriority(v as any)}>
                <SelectTrigger className="bg-[#2a2d35] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2d35] border-gray-700 text-white">
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🔴 High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estimated Time */}
            <div className="space-y-2">
              <Label htmlFor="estimated-time" className="text-white">Estimated Time</Label>
              <Input
                id="estimated-time"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g., 2h 30m"
                className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due-date" className="text-white">Due Date</Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-[#2a2d35] border-gray-700 text-white"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-white">Where</Label>
            <LocationInput
              value={location}
              onChange={setLocation}
              placeholder="e.g., Conference Room B, Downtown Office"
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-white">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag and press Enter"
                className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
              />
              <Button 
                type="button" 
                onClick={handleAddTag}
                variant="outline"
                size="icon"
                className="border-gray-700 hover:bg-gray-800"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline"
                    className="bg-teal-600/20 border-teal-500/50 text-teal-300 gap-1"
                  >
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-teal-100" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* AI Suggestion */}
          <div className="bg-teal-600/10 border border-teal-600/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-teal-300 mb-1">AI Scheduling Suggestion</p>
                <p className="text-gray-300">
                  Based on your energy patterns, schedule this task for <span className="text-teal-400">2:00 PM - 4:30 PM</span> when you're typically at peak performance.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-700 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:shadow-lg hover:shadow-teal-500/20"
          >
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NewGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (goal: any) => void;
}

export function NewGoalDialog({ open, onOpenChange, onSubmit }: NewGoalDialogProps) {
  // Step management
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  
  // Form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState<'professional' | 'personal' | 'financial' | 'health'>('professional');
  const [targetDate, setTargetDate] = useState('');
  const [milestones, setMilestones] = useState<string[]>([]);
  const [milestoneInput, setMilestoneInput] = useState('');
  const [location, setLocation] = useState('');
  
  // Tracking fields (dynamic based on template)
  const [trackingData, setTrackingData] = useState<Record<string, any>>({});
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isAISuggestingMilestones, setIsAISuggestingMilestones] = useState(false);

  const handleAddMilestone = () => {
    if (milestoneInput.trim() && milestones.length < 5) {
      setMilestones([...milestones, milestoneInput.trim()]);
      setMilestoneInput('');
    }
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleAISuggestMilestones = async () => {
    if (!goalTitle.trim()) {
      toast.error('Please enter a goal title first');
      return;
    }

    setIsAISuggestingMilestones(true);
    
    // Simulate AI suggestion delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // AI-suggested milestones based on goal title and category
    const suggestions = generateMilestoneSuggestions(goalTitle, goalCategory);
    setMilestones(suggestions);
    setIsAISuggestingMilestones(false);
    
    toast.success('AI milestones generated!', {
      description: `Added ${suggestions.length} suggested milestones`
    });
  };

  const generateMilestoneSuggestions = (title: string, category: string): string[] => {
    // Smart milestone generation based on keywords
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('launch') || titleLower.includes('build') || titleLower.includes('create')) {
      return ['Research & Planning', 'Design Phase', 'Development', 'Testing & QA', 'Launch & Monitor'];
    } else if (titleLower.includes('learn') || titleLower.includes('course') || titleLower.includes('study')) {
      return ['Course enrollment', 'Complete first 25%', 'Reach halfway point', 'Final 25%', 'Certification achieved'];
    } else if (titleLower.includes('save') || titleLower.includes('fund')) {
      return ['Save 25%', 'Save 50%', 'Save 75%', 'Goal reached'];
    } else if (category === 'health') {
      return ['Week 1: Build habit', 'Week 2-3: Consistency', 'Week 4-6: Progress', '90-day milestone'];
    } else if (category === 'professional') {
      return ['Initial planning', 'Execute first phase', 'Mid-point review', 'Final phase', 'Complete & reflect'];
    } else {
      return ['Get started', 'Make progress', 'Reach halfway', 'Final push', 'Achieve goal'];
    }
  };

  const handleTemplateSelect = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setGoalCategory(template.category.toLowerCase() as any);
    setGoalDescription(template.description);
    
    // Pre-populate tracking data with default values
    if (template.defaultValues) {
      setTrackingData(template.defaultValues);
    }
    
    // Pre-populate milestones
    if (template.suggestedMilestones && template.suggestedMilestones.length > 0) {
      setMilestones(template.suggestedMilestones.slice(0, 5));
    }
    
    setStep('details');
  };

  const handleSubmit = () => {
    if (!goalTitle.trim()) {
      toast.error('Goal title is required');
      return;
    }

    // Prepare collaborators array with current user as creator
    const allCollaborators = [
      {
        name: CURRENT_USER.name,
        image: CURRENT_USER.avatar,
        fallback: CURRENT_USER.fallback,
        progress: 85, // Creator starts at 85% to match existing goal data pattern
        animationType: 'glow',
        status: 'online',
        role: 'creator'
      },
      ...collaborators
    ];

    const newGoal = {
      id: String(Date.now()),
      title: goalTitle,
      description: goalDescription,
      category: goalCategory.charAt(0).toUpperCase() + goalCategory.slice(1), // Capitalize
      progress: 0,
      deadline: targetDate || 'No deadline',
      status: 'on-track',
      timeHorizon: 'This Quarter',
      currentUserRole: 'creator',
      isPrivate: false,
      confidenceScore: 8,
      tasks: { completed: 0, total: milestones.length },
      milestones: milestones.map((m, idx) => ({
        id: `m${idx + 1}`,
        name: m,
        completed: false,
        current: idx === 0,
        targetDate: '',
        assignedTo: [{ name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.fallback }],
        steps: [] // Will be added later through edit
      })),
      collaborators: allCollaborators,
      keyResults: [],
      activity: [],
      location: location || undefined,
      // Add tracking data from template
      ...trackingData,
      // Add template metadata
      templateId: selectedTemplate?.id,
      trackingType: selectedTemplate?.trackingType,
    };

    if (onSubmit) {
      onSubmit(newGoal);
    } else {
      // Fallback toast if no onSubmit handler
      toast.success('Goal created!', {
        description: `"${goalTitle}" has been added to your goals`
      });
    }

    // Reset form
    setStep('template');
    setSelectedTemplate(null);
    setGoalTitle('');
    setGoalDescription('');
    setGoalCategory('professional');
    setTargetDate('');
    setMilestones([]);
    setMilestoneInput('');
    setLocation('');
    setTrackingData({});
    setCollaborators([]);
    onOpenChange(false);
  };

  const categoryEmojis = {
    professional: '💼',
    personal: '🎯',
    financial: '💰',
    health: '❤️'
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        // Reset on close
        setStep('template');
        setSelectedTemplate(null);
        setTrackingData({});
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="bg-[#1e2128] border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            {step === 'template' ? (
              <>
                <Sparkles className="w-6 h-6 text-purple-400" />
                Choose a Goal Template
              </>
            ) : (
              <>
                <Target className="w-6 h-6 text-purple-400" />
                Create New Goal
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {step === 'template' 
              ? 'Select a template to get started with pre-configured tracking, or start from scratch'
              : 'Set a meaningful goal and break it down into achievable milestones'
            }
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Template Selection */}
        {step === 'template' && (
          <div className="space-y-6 py-4">
            {TEMPLATE_CATEGORIES.map((category) => {
              const templates = GOAL_TEMPLATES[category.id];
              if (!templates || templates.length === 0) return null;
              
              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="text-lg text-white">{category.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="group bg-[#2a2d35] hover:bg-[#32353d] border border-gray-700 hover:border-purple-500/50 rounded-lg p-4 text-left transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{template.icon}</span>
                          <div className="flex-1">
                            <h4 className="text-white group-hover:text-purple-400 transition-colors mb-1">
                              {template.name}
                            </h4>
                            <p className="text-xs text-gray-400 line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Custom Goal Option */}
            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setStep('details');
                }}
                className="w-full group bg-[#2a2d35] hover:bg-[#32353d] border border-gray-700 hover:border-purple-500/50 rounded-lg p-4 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-8 h-8 text-purple-400" />
                  <div className="flex-1">
                    <h4 className="text-white group-hover:text-purple-400 transition-colors mb-1">
                      Custom Goal
                    </h4>
                    <p className="text-xs text-gray-400">
                      Start from scratch with a blank goal
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Goal Details Form */}
        {step === 'details' && (
          <div className="space-y-6 py-4">
            {/* Template Badge (if selected) */}
            {selectedTemplate && (
              <div className="flex items-center gap-2 bg-purple-600/10 border border-purple-600/30 rounded-lg p-3">
                <span className="text-2xl">{selectedTemplate.icon}</span>
                <div className="flex-1">
                  <p className="text-purple-300 text-sm">Using Template:</p>
                  <p className="text-white">{selectedTemplate.name}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('template')}
                  className="text-purple-400 hover:text-purple-300"
                >
                  Change
                </Button>
              </div>
            )}
          
          {/* Goal Title */}
          <div className="space-y-2">
            <Label htmlFor="goal-title" className="text-white">Goal Title *</Label>
            <Input
              id="goal-title"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g., Launch Personal Finance Dashboard"
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Goal Description */}
          <div className="space-y-2">
            <Label htmlFor="goal-description" className="text-white">Description</Label>
            <Textarea
              id="goal-description"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="Describe your goal in detail..."
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-white">Category</Label>
              <Select value={goalCategory} onValueChange={(v) => setGoalCategory(v as any)}>
                <SelectTrigger className="bg-[#2a2d35] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2d35] border-gray-700 text-white">
                  <SelectItem value="professional">💼 Professional</SelectItem>
                  <SelectItem value="personal">🎯 Personal</SelectItem>
                  <SelectItem value="financial">💰 Financial</SelectItem>
                  <SelectItem value="health">❤️ Health</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <Label htmlFor="target-date" className="text-white">Target Date</Label>
              <Input
                id="target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-[#2a2d35] border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-white">Where (optional)</Label>
            <LocationInput
              value={location}
              onChange={setLocation}
              placeholder="e.g., Boston Marathon, Home Office"
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500">Add location for goals with physical milestones</p>
          </div>

          {/* Dynamic Tracking Fields */}
          {selectedTemplate && selectedTemplate.formFields.length > 0 && (
            <div className="space-y-4 bg-[#2a2d35] border border-purple-600/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                <Label className="text-purple-300">Goal Tracking</Label>
              </div>
              
              {selectedTemplate.formFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name} className="text-white">
                    {field.label} {field.required && '*'}
                  </Label>
                  <Input
                    id={field.name}
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={trackingData[field.name] || ''}
                    onChange={(e) => setTrackingData({
                      ...trackingData,
                      [field.name]: e.target.value
                    })}
                    placeholder={field.placeholder}
                    className="bg-[#1e2128] border-gray-700 text-white placeholder:text-gray-500"
                    required={field.required}
                  />
                </div>
              ))}
              
              <p className="text-xs text-gray-400">
                These fields help track your progress toward this goal
              </p>
            </div>
          )}

          {/* Milestones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="milestones" className="text-white">
                Milestones {selectedTemplate && '(Pre-populated from template)'}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAISuggestMilestones}
                disabled={isAISuggestingMilestones || !goalTitle.trim()}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-600/10"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                {isAISuggestingMilestones ? 'Suggesting...' : 'AI Suggest'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                id="milestones"
                value={milestoneInput}
                onChange={(e) => setMilestoneInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMilestone())}
                placeholder="Add a milestone and press Enter"
                className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
                disabled={milestones.length >= 5}
              />
              <Button 
                type="button" 
                onClick={handleAddMilestone}
                variant="outline"
                size="icon"
                className="border-gray-700 hover:bg-gray-800"
                disabled={milestones.length >= 5}
              >
                <Plus className="w-4 h-4" />\n              </Button>
            </div>
            {milestones.length > 0 && (
              <div className="space-y-2 mt-3">
                {milestones.map((milestone, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 bg-[#2a2d35] border border-gray-700 rounded-lg p-3"
                  >
                    <div className="w-6 h-6 rounded-full border-2 border-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-purple-400">{index + 1}</span>
                    </div>
                    <span className="flex-1 text-gray-300">{milestone}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMilestone(index)}
                      className="hover:bg-gray-800 h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">Add up to 5 milestones to track your progress</p>
          </div>

          {/* Team Members / Collaborators */}
          <div className="space-y-2">
            <Label className="text-white">Team Members (Optional)</Label>
            <div className="bg-[#2a2d35] border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-3">
                Invite team members to collaborate on this goal. You can assign admin roles later in goal settings.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC', animationType: 'pulse' },
                  { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ', animationType: 'heartbeat' },
                  { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK', animationType: 'bounce' },
                  { name: 'Elena Rodriguez', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', fallback: 'ER', animationType: 'wiggle' },
                ].map((member) => {
                  const isSelected = collaborators.some(c => c.name === member.name);
                  return (
                    <button
                      key={member.name}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setCollaborators(collaborators.filter(c => c.name !== member.name));
                        } else {
                          setCollaborators([...collaborators, {
                            ...member,
                            progress: Math.floor(Math.random() * 18) + 68, // Random progress between 68-85% to match existing data
                            status: 'online',
                            role: 'collaborator' // Default role - can be changed to admin later in goal settings
                          }]);
                        }
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                        isSelected 
                          ? 'bg-purple-600/20 border-purple-500' 
                          : 'bg-[#1e2128] border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-sm text-white">{member.name}</p>
                        <p className="text-xs text-gray-400">Team Member</p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      )}
                    </button>
                  );
                })}
              </div>
              {collaborators.length > 0 && (
                <p className="text-xs text-purple-400 mt-3">
                  {collaborators.length} team member{collaborators.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-purple-300 mb-1">Goal Success Prediction</p>
                <p className="text-gray-300">
                  Based on your completion patterns, you have an <span className="text-purple-400">87% success probability</span> for {goalCategory} goals. Break this into smaller steps for best results.
                </p>
              </div>
            </div>
          </div>
        </div>
        )}

        <DialogFooter>
          {step === 'details' && (
            <Button 
              variant="outline" 
              onClick={() => setStep('template')}
              className="border-gray-700 hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-700 hover:bg-gray-800"
          >
            Cancel
          </Button>
          {step === 'details' && (
            <Button 
              onClick={handleSubmit}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/20"
            >
              Create Goal
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StartFocusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartFocusDialog({ open, onOpenChange }: StartFocusDialogProps) {
  const [focusTask, setFocusTask] = useState('');
  const [duration, setDuration] = useState('25');
  const [breakDuration, setBreakDuration] = useState('5');
  const [sessions, setSessions] = useState('4');

  const handleStart = () => {
    if (!focusTask.trim()) {
      toast.error('Please specify what you\'ll be working on');
      return;
    }

    toast.success('Focus session started!', {
      description: `${duration} minutes of focused work on "${focusTask}"`
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f1115] border-0 text-white max-w-full w-screen h-screen p-0 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto">
          {/* Background gradient effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-red-900/10 pointer-events-none"></div>
          
          {/* Content container */}
          <div className="relative z-10 w-full max-w-2xl">
            <DialogHeader className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Brain className="w-10 h-10 text-white" />
                </div>
              </div>
              <DialogTitle className="text-white text-4xl mb-2">Start Focus Session</DialogTitle>
              <DialogDescription className="text-gray-400 text-lg">
                Enter deep work mode with Pomodoro technique
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8 py-4">
              {/* Focus Task */}
              <div className="space-y-3">
                <Label htmlFor="focus-task" className="text-white text-lg">What will you work on? *</Label>
                <Input
                  id="focus-task"
                  value={focusTask}
                  onChange={(e) => setFocusTask(e.target.value)}
                  placeholder="e.g., Complete budget analysis"
                  className="bg-[#1e2128] border-gray-700 text-white placeholder:text-gray-500 h-14 text-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Focus Duration */}
                <div className="space-y-3">
                  <Label htmlFor="duration" className="text-white">Focus (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="bg-[#1e2128] border-gray-700 text-white h-14 text-lg"
                  />
                </div>

                {/* Break Duration */}
                <div className="space-y-3">
                  <Label htmlFor="break" className="text-white">Break (min)</Label>
                  <Input
                    id="break"
                    type="number"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(e.target.value)}
                    className="bg-[#1e2128] border-gray-700 text-white h-14 text-lg"
                  />
                </div>

                {/* Sessions */}
                <div className="space-y-3">
                  <Label htmlFor="sessions" className="text-white">Sessions</Label>
                  <Input
                    id="sessions"
                    type="number"
                    value={sessions}
                    onChange={(e) => setSessions(e.target.value)}
                    className="bg-[#1e2128] border-gray-700 text-white h-14 text-lg"
                  />
                </div>
              </div>

              {/* Pomodoro Info */}
              <div className="bg-orange-600/10 border border-orange-600/30 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-orange-300 mb-1 text-lg">Total Time: {parseInt(duration) * parseInt(sessions) + parseInt(breakDuration) * (parseInt(sessions) - 1)} minutes</p>
                    <p className="text-gray-300">
                      {sessions} × {duration}min focus sessions with {breakDuration}min breaks between
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Energy */}
              <div className="bg-[#1e2128] rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-lg">Current Energy Level</span>
                  <span className="text-teal-400 text-lg">78% High</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div className="bg-gradient-to-r from-teal-500 to-green-400 h-3 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <p className="text-sm text-gray-500 mt-3">Perfect time for focused work</p>
              </div>
            </div>

            <DialogFooter className="mt-8 flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-gray-700 hover:bg-gray-800 h-14 px-8 text-lg flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleStart}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-lg hover:shadow-orange-500/20 h-14 px-8 text-lg flex-1"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Focus Session
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ScheduleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleEventDialog({ open, onOpenChange }: ScheduleEventDialogProps) {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState<'meeting' | 'call' | 'event'>('meeting');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState('');

  const handleSubmit = () => {
    if (!eventTitle.trim()) {
      toast.error('Event title is required');
      return;
    }

    toast.success('Event scheduled!', {
      description: `"${eventTitle}" has been added to your calendar`
    });

    setEventTitle('');
    setEventDescription('');
    setEventType('meeting');
    setStartDate('');
    setStartTime('');
    setDuration('60');
    setLocation('');
    setAttendees('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Schedule New Event</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add a new event to your calendar with intelligent time recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="event-title" className="text-white">Event Title *</Label>
            <Input
              id="event-title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g., Client Strategy Meeting"
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description" className="text-white">Description</Label>
            <Textarea
              id="event-description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Add details about this event..."
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-type" className="text-white">Event Type</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as any)}>
                <SelectTrigger className="bg-[#2a2d35] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2d35] border-gray-700 text-white">
                  <SelectItem value="meeting">📅 Meeting</SelectItem>
                  <SelectItem value="call">📞 Call</SelectItem>
                  <SelectItem value="event">🎯 Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration-event" className="text-white">Duration (minutes)</Label>
              <Input
                id="duration-event"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-white">Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#2a2d35] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time" className="text-white">Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-[#2a2d35] border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-white">Location / Meeting Link</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Conference Room A or Zoom link"
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendees" className="text-white">Attendees (Optional)</Label>
            <Input
              id="attendees"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="Email addresses, separated by commas"
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 mb-1">Smart Scheduling Suggestion</p>
                <p className="text-gray-300">
                  Based on attendee availability and your energy patterns, we recommend <span className="text-blue-400">Tuesday, 10:00 AM</span> for optimal meeting effectiveness.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-700 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/20"
          >
            Schedule Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface Task {
  id: string;
  title: string;
  priority: string;
  energyLevel?: string;
  estimatedTime: string;
  progress?: number;
  tags: string[];
  dueDate: string;
  aiSuggestion?: string;
  completed: boolean;
}

interface AITaskGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTasks?: Task[];
}

export function AITaskGenerationDialog({ open, onOpenChange, existingTasks = [] }: AITaskGenerationDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<Array<{
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    estimatedTime: string;
    selected: boolean;
    reason?: string;
  }>>([]);

  // Generate suggestions based on existing tasks
  const handleSuggestTasks = () => {
    setIsGenerating(true);

    setTimeout(() => {
      // Analyze existing tasks to find patterns
      const allTags = existingTasks.flatMap(t => t.tags);
      const tagFrequency: Record<string, number> = {};
      allTags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
      
      const topTags = Object.entries(tagFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);

      const hasFinanceTasks = allTags.includes('Finance');
      const hasProjectTasks = allTags.includes('Projects');
      const hasMeetingTasks = allTags.includes('Meetings');
      const hasCommunicationTasks = allTags.includes('Communication') || allTags.includes('Email');

      // Generate intelligent task suggestions based on patterns
      const suggestions = [];

      if (hasFinanceTasks) {
        suggestions.push({
          id: 's1',
          title: 'Monthly financial reconciliation review',
          priority: 'medium' as const,
          estimatedTime: '1h 30m',
          selected: true,
          reason: 'Based on your Finance tasks pattern'
        });
      }

      if (hasProjectTasks) {
        suggestions.push({
          id: 's2',
          title: 'Update project status dashboard',
          priority: 'medium' as const,
          estimatedTime: '45m',
          selected: true,
          reason: 'Complements your Project work'
        });
      }

      if (hasMeetingTasks) {
        suggestions.push({
          id: 's3',
          title: 'Follow-up on action items from recent meetings',
          priority: 'high' as const,
          estimatedTime: '1h',
          selected: true,
          reason: 'Meeting follow-up best practice'
        });
      }

      if (hasCommunicationTasks) {
        suggestions.push({
          id: 's4',
          title: 'Weekly team communication digest',
          priority: 'low' as const,
          estimatedTime: '30m',
          selected: true,
          reason: 'Pattern detected in your email tasks'
        });
      }

      // Add general productivity suggestions
      suggestions.push(
        {
          id: 's5',
          title: 'Review and update next week\'s priorities',
          priority: 'medium' as const,
          estimatedTime: '45m',
          selected: true,
          reason: 'Weekly planning recommendation'
        },
        {
          id: 's6',
          title: 'Deep work session: Focus on most important task',
          priority: 'high' as const,
          estimatedTime: '2h',
          selected: true,
          reason: 'Based on your high-priority task patterns'
        },
        {
          id: 's7',
          title: 'Quick wins: Complete 3 small pending tasks',
          priority: 'low' as const,
          estimatedTime: '1h',
          selected: false,
          reason: 'Momentum building strategy'
        }
      );

      setGeneratedTasks(suggestions.slice(0, 6));
      setIsGenerating(false);
      toast.success(`AI suggested ${Math.min(suggestions.length, 6)} tasks based on your patterns!`);
    }, 1500);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please describe what you need to accomplish');
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      const tasks = [
        {
          id: '1',
          title: 'Research current market trends and competitors',
          priority: 'high' as const,
          estimatedTime: '2h',
          selected: true,
          reason: 'Foundation for informed decision-making'
        },
        {
          id: '2',
          title: 'Draft project proposal outline',
          priority: 'high' as const,
          estimatedTime: '1h 30m',
          selected: true,
          reason: 'Core deliverable'
        },
        {
          id: '3',
          title: 'Review budget requirements',
          priority: 'medium' as const,
          estimatedTime: '45m',
          selected: true,
          reason: 'Essential planning step'
        },
        {
          id: '4',
          title: 'Schedule stakeholder review meeting',
          priority: 'medium' as const,
          estimatedTime: '15m',
          selected: true,
          reason: 'Coordination and alignment'
        },
        {
          id: '5',
          title: 'Prepare presentation slides',
          priority: 'low' as const,
          estimatedTime: '1h',
          selected: false,
          reason: 'Supporting material'
        },
      ];
      setGeneratedTasks(tasks);
      setIsGenerating(false);
      toast.success('AI generated 5 tasks from your goal!');
    }, 1500);
  };

  const toggleTask = (id: string) => {
    setGeneratedTasks(tasks =>
      tasks.map(task =>
        task.id === id ? { ...task, selected: !task.selected } : task
      )
    );
  };

  const handleConfirm = () => {
    const selectedTasks = generatedTasks.filter(t => t.selected);
    toast.success(`Added ${selectedTasks.length} tasks to your list!`, {
      description: 'Tasks have been scheduled based on your energy patterns'
    });
    setPrompt('');
    setGeneratedTasks([]);
    onOpenChange(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/50 bg-red-600/10';
      case 'medium': return 'border-yellow-500/50 bg-yellow-600/10';
      case 'low': return 'border-green-500/50 bg-green-600/10';
      default: return 'border-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">AI Task Generation</DialogTitle>
          <DialogDescription className="text-gray-400">
            Describe your goal and AI will break it down into actionable tasks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {generatedTasks.length === 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="ai-prompt" className="text-white">What do you want to accomplish?</Label>
                <Textarea
                  id="ai-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., I need to prepare a comprehensive project proposal for Q1 2024"
                  className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500 min-h-[120px]"
                  disabled={isGenerating}
                />
              </div>

              <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-purple-300 mb-1">AI-Powered Task Breakdown</p>
                    <p className="text-gray-300 text-sm">
                      Our AI will analyze your goal, break it into manageable tasks, estimate time requirements, assign priorities, and schedule them based on your energy patterns.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate from Goal
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleSuggestTasks}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full border-teal-600/50 bg-teal-600/10 hover:bg-teal-600/20 text-teal-300"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-teal-400 border-t-transparent rounded-full" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Suggest Tasks
                    </>
                  )}
                </Button>
              </div>

              {existingTasks.length > 0 && (
                <div className="bg-teal-600/10 border border-teal-600/30 rounded-lg p-3">
                  <p className="text-teal-300 text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>
                      <strong>Smart Suggestions:</strong> AI will analyze your {existingTasks.length} existing tasks to recommend related work
                    </span>
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white">Generated Tasks</h3>
                  <Badge variant="outline" className="text-teal-400 border-teal-500/50">
                    {generatedTasks.filter(t => t.selected).length} selected
                  </Badge>
                </div>

                <p className="text-gray-400 text-sm">
                  Review and select the tasks you want to add. Click any task to toggle selection.
                </p>

                <div className="space-y-2">
                  {generatedTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        task.selected
                          ? getPriorityColor(task.priority) + ' border-opacity-100'
                          : 'border-gray-700 bg-[#2a2d35] opacity-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          task.selected ? 'border-teal-500 bg-teal-500' : 'border-gray-600'
                        }`}>
                          {task.selected && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-white">{task.title}</p>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {getPriorityIcon(task.priority)} {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.estimatedTime}
                            </span>
                          </div>
                          {task.reason && (
                            <div className="mt-2 text-xs text-teal-400 flex items-start gap-1">
                              <Zap className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span>{task.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setGeneratedTasks([]);
                    setPrompt('');
                  }}
                  className="flex-1 border-gray-700 hover:bg-gray-800"
                >
                  Regenerate
                </Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={generatedTasks.filter(t => t.selected).length === 0}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 hover:shadow-lg hover:shadow-teal-500/20"
                >
                  Confirm & Add Tasks
                </Button>
              </div>
            </>
          )}
        </div>

        {generatedTasks.length === 0 && (
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setPrompt('');
                onOpenChange(false);
              }}
              className="border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface VoiceToTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceToTaskDialog({ open, onOpenChange }: VoiceToTaskDialogProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState<Array<{
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    estimatedTime: string;
    selected: boolean;
  }>>([]);

  const handleStartListening = () => {
    setIsListening(true);
    toast.info('Listening...', { description: 'Speak your tasks or goals' });

    setTimeout(() => {
      const exampleTranscript = "I need to finish the budget report by Friday, then schedule a team meeting to discuss Q1 goals, and don't forget to review the design mockups";
      setTranscript(exampleTranscript);
      setIsListening(false);
      
      setTimeout(() => {
        const tasks = [
          {
            id: '1',
            title: 'Finish budget report',
            priority: 'high' as const,
            estimatedTime: '3h',
            selected: true,
          },
          {
            id: '2',
            title: 'Schedule team meeting for Q1 goals',
            priority: 'high' as const,
            estimatedTime: '30m',
            selected: true,
          },
          {
            id: '3',
            title: 'Review design mockups',
            priority: 'medium' as const,
            estimatedTime: '1h',
            selected: true,
          },
        ];
        setGeneratedTasks(tasks);
        toast.success('Tasks extracted from your voice note!');
      }, 500);
    }, 3000);
  };

  const toggleTask = (id: string) => {
    setGeneratedTasks(tasks =>
      tasks.map(task =>
        task.id === id ? { ...task, selected: !task.selected } : task
      )
    );
  };

  const handleConfirm = () => {
    const selectedTasks = generatedTasks.filter(t => t.selected);
    toast.success(`Added ${selectedTasks.length} tasks!`, {
      description: 'Voice tasks added to your workflow'
    });
    setTranscript('');
    setGeneratedTasks([]);
    setIsListening(false);
    onOpenChange(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/50 bg-red-600/10';
      case 'medium': return 'border-yellow-500/50 bg-yellow-600/10';
      case 'low': return 'border-green-500/50 bg-green-600/10';
      default: return 'border-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Voice to Task</DialogTitle>
          <DialogDescription className="text-gray-400">
            Speak naturally and AI will convert your voice into organized tasks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {generatedTasks.length === 0 ? (
            <>
              <div className="bg-[#2a2d35] border-2 border-gray-700 rounded-xl p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  {isListening ? (
                    <>
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                          <div className="w-20 h-20 bg-[#1e2128] rounded-full flex items-center justify-center">
                            <div className="flex gap-1">
                              <div className="w-1 h-8 bg-red-400 rounded animate-pulse" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-1 h-12 bg-red-400 rounded animate-pulse" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-1 h-6 bg-red-400 rounded animate-pulse" style={{ animationDelay: '300ms' }}></div>
                              <div className="w-1 h-10 bg-red-400 rounded animate-pulse" style={{ animationDelay: '450ms' }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 w-24 h-24 bg-red-500/20 rounded-full animate-ping"></div>
                      </div>
                      <p className="text-white">Listening...</p>
                      <p className="text-gray-400 text-sm">Speak your tasks or goals clearly</p>
                    </>
                  ) : transcript ? (
                    <>
                      <CheckCircle2 className="w-16 h-16 text-teal-400" />
                      <p className="text-white">Voice captured successfully!</p>
                      <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-4 w-full text-left">
                        <p className="text-gray-300 italic">"{transcript}"</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <div className="w-20 h-20 bg-[#1e2128] rounded-full flex items-center justify-center">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                              <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <p className="text-white">Ready to listen</p>
                      <p className="text-gray-400 text-sm">Click the button below to start</p>
                    </>
                  )}
                </div>
              </div>

              {!transcript && (
                <Button 
                  onClick={handleStartListening}
                  disabled={isListening}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/20 h-12"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                    <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                  </svg>
                  {isListening ? 'Listening...' : 'Start Recording'}
                </Button>
              )}

              <div className="bg-teal-600/10 border border-teal-600/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-teal-300 mb-1">Voice AI Tips</p>
                    <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                      <li>Speak naturally about what you need to do</li>
                      <li>Mention deadlines if important (e.g., "by Friday")</li>
                      <li>AI will intelligently extract and prioritize tasks</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white">Extracted Tasks</h3>
                  <Badge variant="outline" className="text-teal-400 border-teal-500/50">
                    {generatedTasks.filter(t => t.selected).length} selected
                  </Badge>
                </div>

                <p className="text-gray-400 text-sm">
                  Review and confirm the tasks extracted from your voice. Click to toggle selection.
                </p>

                <div className="space-y-2">
                  {generatedTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        task.selected
                          ? getPriorityColor(task.priority) + ' border-opacity-100'
                          : 'border-gray-700 bg-[#2a2d35] opacity-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          task.selected ? 'border-teal-500 bg-teal-500' : 'border-gray-600'
                        }`}>
                          {task.selected && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-white">{task.title}</p>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {getPriorityIcon(task.priority)} {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.estimatedTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setGeneratedTasks([]);
                    setTranscript('');
                  }}
                  className="flex-1 border-gray-700 hover:bg-gray-800"
                >
                  Record Again
                </Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={generatedTasks.filter(t => t.selected).length === 0}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 hover:shadow-lg hover:shadow-teal-500/20"
                >
                  Confirm & Add Tasks
                </Button>
              </div>
            </>
          )}
        </div>

        {generatedTasks.length === 0 && !transcript && (
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setTranscript('');
                setIsListening(false);
                onOpenChange(false);
              }}
              className="border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AIGoalGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIGoalGenerationDialog({ open, onOpenChange }: AIGoalGenerationDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGoals, setGeneratedGoals] = useState<Array<{
    id: string;
    title: string;
    category: 'professional' | 'personal' | 'financial' | 'health';
    timeframe: string;
    milestones: string[];
    selected: boolean;
    reason?: string;
  }>>([]);

  // Suggest goals based on common patterns and best practices
  const handleSuggestGoals = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const suggestions = [
        {
          id: 's1',
          title: 'Build Emergency Fund of $10,000',
          category: 'financial' as const,
          timeframe: '12 months',
          milestones: [
            'Save $2,500 by month 3',
            'Reach $5,000 by month 6',
            'Hit $7,500 by month 9',
            'Complete $10,000 by month 12'
          ],
          selected: true,
          reason: 'Financial security is foundational for peace of mind'
        },
        {
          id: 's2',
          title: 'Read 24 Books This Year',
          category: 'personal' as const,
          timeframe: '12 months',
          milestones: [
            'Complete 6 books in Q1',
            'Finish 12 books by Q2',
            'Reach 18 books by Q3',
            'Achieve 24 books by year end'
          ],
          selected: true,
          reason: 'Continuous learning and personal growth'
        },
        {
          id: 's3',
          title: 'Exercise 5x Per Week Consistently',
          category: 'health' as const,
          timeframe: '6 months',
          milestones: [
            'Build 2-week consistency streak',
            'Achieve 30-day workout streak',
            'Complete 50 total workouts',
            'Maintain habit for 6 months'
          ],
          selected: true,
          reason: 'Physical health improves mental performance'
        },
        {
          id: 's4',
          title: 'Launch Side Project or Business',
          category: 'professional' as const,
          timeframe: '6 months',
          milestones: [
            'Validate idea and define MVP',
            'Build prototype or minimum product',
            'Get first 10 users/customers',
            'Reach profitability or growth milestone'
          ],
          selected: true,
          reason: 'Career growth and financial independence'
        },
        {
          id: 's5',
          title: 'Master a New Professional Skill',
          category: 'professional' as const,
          timeframe: '4 months',
          milestones: [
            'Complete foundational course or certification',
            'Build 3 practice projects',
            'Apply skill in real work scenario',
            'Teach or mentor someone else'
          ],
          selected: false,
          reason: 'Skill development increases career opportunities'
        },
        {
          id: 's6',
          title: 'Improve Sleep Quality (7-8 hours nightly)',
          category: 'health' as const,
          timeframe: '3 months',
          milestones: [
            'Establish consistent bedtime routine',
            'Track sleep for 30 days',
            'Optimize sleep environment',
            'Maintain 7+ hours for 60 consecutive days'
          ],
          selected: false,
          reason: 'Quality sleep is the foundation of productivity'
        }
      ];

      setGeneratedGoals(suggestions);
      setIsGenerating(false);
      toast.success(`AI suggested ${suggestions.length} goals based on best practices!`);
    }, 1500);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please describe your goal or aspiration');
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      const goals = [
        {
          id: '1',
          title: 'Launch Personal Finance Dashboard',
          category: 'professional' as const,
          timeframe: '3 months',
          milestones: [
            'Complete market research and feature planning',
            'Design UI/UX and create mockups',
            'Develop MVP with core features',
            'Beta testing and user feedback',
            'Official launch and marketing'
          ],
          selected: true,
          reason: 'Aligns with your professional development goals'
        },
        {
          id: '2',
          title: 'Increase Professional Network by 30%',
          category: 'professional' as const,
          timeframe: '6 months',
          milestones: [
            'Attend 2 industry events per month',
            'Connect with 10 professionals weekly',
            'Engage in 3 online communities',
            'Host or speak at 1 event'
          ],
          selected: true,
          reason: 'Strategic career advancement opportunity'
        },
        {
          id: '3',
          title: 'Master Advanced Project Management Skills',
          category: 'professional' as const,
          timeframe: '4 months',
          milestones: [
            'Complete PMP certification course',
            'Lead 2 cross-functional projects',
            'Implement agile methodologies',
            'Mentor junior team members'
          ],
          selected: false,
          reason: 'Builds on your existing management experience'
        },
      ];
      setGeneratedGoals(goals);
      setIsGenerating(false);
      toast.success('AI generated SMART goals from your vision!');
    }, 1500);
  };

  const toggleGoal = (id: string) => {
    setGeneratedGoals(goals =>
      goals.map(goal =>
        goal.id === id ? { ...goal, selected: !goal.selected } : goal
      )
    );
  };

  const handleConfirm = () => {
    const selectedGoals = generatedGoals.filter(g => g.selected);
    toast.success(`Added ${selectedGoals.length} SMART goals!`, {
      description: 'Goals have been broken down into actionable milestones'
    });
    setPrompt('');
    setGeneratedGoals([]);
    onOpenChange(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'professional': return 'border-purple-500/50 bg-purple-600/10';
      case 'personal': return 'border-blue-500/50 bg-blue-600/10';
      case 'financial': return 'border-green-500/50 bg-green-600/10';
      case 'health': return 'border-red-500/50 bg-red-600/10';
      default: return 'border-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'professional': return '💼';
      case 'personal': return '🎯';
      case 'financial': return '💰';
      case 'health': return '❤️';
      default: return '⭐';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">AI Goal Generation</DialogTitle>
          <DialogDescription className="text-gray-400">
            Describe your vision and AI will create SMART goals with actionable milestones
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {generatedGoals.length === 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="ai-goal-prompt" className="text-white">What do you want to achieve?</Label>
                <Textarea
                  id="ai-goal-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., I want to advance my career in product management and build stronger leadership skills"
                  className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500 min-h-[120px]"
                  disabled={isGenerating}
                />
              </div>

              <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-purple-300 mb-1">AI-Powered SMART Goals</p>
                    <p className="text-gray-300 text-sm">
                      Our AI will transform your vision into Specific, Measurable, Achievable, Relevant, and Time-bound goals with clear milestones and actionable steps.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Generating SMART Goals...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Goals from Vision
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-700" />
                  <span className="text-gray-500 text-xs">OR</span>
                  <div className="flex-1 h-px bg-gray-700" />
                </div>

                <Button 
                  onClick={handleSuggestGoals}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full" />
                      Analyzing patterns...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Suggest Goals Based on Best Practices
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-teal-600/10 border border-teal-600/30 rounded-lg p-3">
                <p className="text-teal-300 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>
                    <strong>Pro Tip:</strong> Be specific about your aspirations, timeframe, and what success looks like to you
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-teal-600/10 border border-teal-600/30 rounded-lg p-4">
                <p className="text-teal-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    <strong>AI Generated {generatedGoals.length} SMART Goals</strong> - Select the ones you want to add
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-3">
                  {generatedGoals.map((goal) => (
                    <div
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        goal.selected 
                          ? 'border-purple-500 bg-purple-600/10' 
                          : 'border-gray-700 bg-[#2a2d35] hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {goal.selected ? (
                            <CheckCircle2 className="w-5 h-5 text-purple-400" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-2">
                            <span className={`text-lg px-2 py-0.5 rounded ${getCategoryColor(goal.category)}`}>
                              {getCategoryIcon(goal.category)}
                            </span>
                            <div className="flex-1">
                              <h4 className="text-white mb-1">{goal.title}</h4>
                              <div className="flex items-center gap-3 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {goal.timeframe}
                                </span>
                                <span className="capitalize">{goal.category}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 space-y-1.5">
                            <p className="text-sm text-gray-400">Key Milestones:</p>
                            {goal.milestones.map((milestone, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <ChevronRight className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-300">{milestone}</span>
                              </div>
                            ))}
                          </div>

                          {goal.reason && (
                            <div className="mt-3 text-xs text-purple-400 flex items-start gap-1">
                              <Zap className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span>{goal.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setGeneratedGoals([]);
                    setPrompt('');
                  }}
                  className="flex-1 border-gray-700 hover:bg-gray-800"
                >
                  Regenerate
                </Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={generatedGoals.filter(g => g.selected).length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  Confirm & Add Goals
                </Button>
              </div>
            </>
          )}
        </div>

        {generatedGoals.length === 0 && (
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setPrompt('');
                onOpenChange(false);
              }}
              className="border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
