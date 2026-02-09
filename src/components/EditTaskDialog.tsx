import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { X, Plus, CheckCircle2, Circle, Paperclip, ChevronDown, ChevronRight } from 'lucide-react';

interface EditTaskDialogProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: string;
    energyLevel: string;
    estimatedTime: string;
    dueDate: string;
    tags: string[];
    subtasks?: any[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedTask: any) => void;
}

export function EditTaskDialog({ task, open, onOpenChange, onSave }: EditTaskDialogProps) {
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    priority: 'medium',
    energyLevel: 'medium',
    estimatedTime: '',
    dueDate: '',
    tags: [] as string[],
  });
  const [newTag, setNewTag] = React.useState('');
  const [expandedMilestones, setExpandedMilestones] = React.useState<Record<string, boolean>>({});

  // Initialize form when task changes
  React.useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        energyLevel: task.energyLevel,
        estimatedTime: task.estimatedTime,
        dueDate: task.dueDate,
        tags: [...task.tags],
      });
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;
    
    const updatedTask = {
      ...task,
      ...formData,
    };
    
    onSave(updatedTask);
    onOpenChange(false);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1d24] border-gray-800 text-white !z-[110]">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Task</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update task details, priorities, and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm text-gray-300">
              Task Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-[#2a2d35] border-gray-700 text-white"
              placeholder="Enter task title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-[#2a2d35] border-gray-700 text-white min-h-[100px]"
              placeholder="Enter task description"
            />
          </div>

          {/* Priority and Energy Level */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm text-gray-300">
                Priority
              </Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-[#2a2d35] border border-gray-700 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="energyLevel" className="text-sm text-gray-300">
                Energy Level
              </Label>
              <select
                id="energyLevel"
                value={formData.energyLevel}
                onChange={(e) => setFormData({ ...formData, energyLevel: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-[#2a2d35] border border-gray-700 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Estimated Time and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedTime" className="text-sm text-gray-300">
                Estimated Time
              </Label>
              <Input
                id="estimatedTime"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                className="bg-[#2a2d35] border-gray-700 text-white"
                placeholder="e.g., 2 hours"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm text-gray-300">
                Due Date
              </Label>
              <Input
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="bg-[#2a2d35] border-gray-700 text-white"
                placeholder="e.g., Tomorrow, 3pm"
              />
            </div>
          </div>

          {/* Milestones & Steps */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Milestones & Steps</Label>
              <div className="space-y-3 max-h-[300px] overflow-y-auto bg-[#2a2d35] border border-gray-700 rounded-lg p-3">
                {task.subtasks.map((milestone: any) => {
                  // Calculate milestone's resource count (milestone resources + step resources)
                  let milestoneResourceCount = 0;
                  if (milestone.resources) {
                    milestoneResourceCount += milestone.resources.length;
                  }
                  if (milestone.steps) {
                    milestone.steps.forEach((step: any) => {
                      if (step.resources) {
                        milestoneResourceCount += step.resources.length;
                      }
                    });
                  }
                  
                  const isExpanded = expandedMilestones[milestone.id];
                  
                  return (
                    <div key={milestone.id} className="space-y-2">
                      {/* Milestone Header */}
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedMilestones({
                            ...expandedMilestones,
                            [milestone.id]: !isExpanded
                          })}
                          className="mt-0.5 text-gray-400 hover:text-gray-200"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        {milestone.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-400 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-600 mt-0.5" />
                        )}
                        <div className="flex-1 flex items-center gap-2 flex-wrap">
                          <span className={milestone.completed ? 'text-gray-400 line-through' : 'text-gray-200'}>
                            {milestone.title}
                          </span>
                          {/* Milestone's direct resources */}
                          {milestone.resources && milestone.resources.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3 text-blue-400" />
                              <span className="text-xs text-blue-400">{milestone.resources.length}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Milestone Resources (when expanded) */}
                      {isExpanded && milestone.resources && milestone.resources.length > 0 && (
                        <div className="ml-10 space-y-1">
                          <div className="text-xs text-gray-400">Resources:</div>
                          {milestone.resources.map((resource: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-300 bg-blue-500/5 border border-blue-500/20 rounded px-2 py-1">
                              <Paperclip className="w-3 h-3 text-blue-400" />
                              <span>{resource.name || resource.title || resource}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Steps (when expanded) */}
                      {isExpanded && milestone.steps && milestone.steps.length > 0 && (
                        <div className="ml-10 space-y-2 pt-2">
                          <div className="text-xs text-gray-400">Steps:</div>
                          {milestone.steps.map((step: any) => (
                            <div key={step.id} className="space-y-1">
                              <div className="flex items-center gap-2">
                                {step.completed ? (
                                  <CheckCircle2 className="w-3 h-3 text-teal-400" />
                                ) : (
                                  <Circle className="w-3 h-3 text-gray-600" />
                                )}
                                <span className={`text-sm ${step.completed ? 'text-gray-400 line-through' : 'text-gray-300'}`}>
                                  {step.title}
                                </span>
                                {/* Step resources */}
                                {step.resources && step.resources.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Paperclip className="w-3 h-3 text-blue-400" />
                                    <span className="text-xs text-blue-400">{step.resources.length}</span>
                                  </div>
                                )}
                              </div>
                              {/* Step Resources */}
                              {step.resources && step.resources.length > 0 && (
                                <div className="ml-5 space-y-1">
                                  {step.resources.map((resource: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-300 bg-blue-500/5 border border-blue-500/20 rounded px-2 py-1">
                                      <Paperclip className="w-3 h-3 text-blue-400" />
                                      <span>{resource.name || resource.title || resource}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-300">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="bg-[#2a2d35] border-gray-700 text-white flex-1"
                placeholder="Add a tag"
              />
              <Button
                type="button"
                size="sm"
                onClick={addTag}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs gap-1 pr-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-gray-700 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:shadow-lg hover:shadow-teal-500/20"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}