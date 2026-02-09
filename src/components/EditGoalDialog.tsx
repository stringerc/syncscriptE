import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Plus, Star, Lock, Unlock } from 'lucide-react';

interface EditGoalDialogProps {
  goal: {
    id: string;
    title: string;
    description?: string;
    category: string;
    status: string;
    timeHorizon?: string;
    deadline: string;
    confidenceScore?: number;
    isPrivate?: boolean;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedGoal: any) => void;
}

export function EditGoalDialog({ goal, open, onOpenChange, onSave }: EditGoalDialogProps) {
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    category: 'Professional',
    status: 'on-track',
    timeHorizon: 'This Quarter',
    deadline: '',
    confidenceScore: 8,
    isPrivate: false,
  });

  // Initialize form when goal changes
  React.useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        category: goal.category,
        status: goal.status,
        timeHorizon: goal.timeHorizon || 'This Quarter',
        deadline: goal.deadline,
        confidenceScore: goal.confidenceScore || 8,
        isPrivate: goal.isPrivate || false,
      });
    }
  }, [goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;
    
    onSave({
      ...goal,
      ...formData,
    });
    onOpenChange(false);
  };

  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Goal</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update goal information, tracking, and milestones
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">Goal Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter goal title..."
              className="bg-gray-900 border-gray-700 text-white"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your goal..."
              className="bg-gray-900 border-gray-700 text-white min-h-[100px]"
            />
          </div>

          {/* Category & Time Horizon */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-300">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Financial">Financial</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Learning">Learning</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeHorizon" className="text-gray-300">Time Horizon *</Label>
              <Select
                value={formData.timeHorizon}
                onValueChange={(value) => setFormData({ ...formData, timeHorizon: value })}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="This Quarter">This Quarter</SelectItem>
                  <SelectItem value="This Year">This Year</SelectItem>
                  <SelectItem value="3 Years">3 Years</SelectItem>
                  <SelectItem value="5+ Years">5+ Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status & Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-300">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="ahead">🚀 Ahead</SelectItem>
                  <SelectItem value="on-track">✓ On Track</SelectItem>
                  <SelectItem value="at-risk">⚠️ At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-gray-300">Deadline</Label>
              <Input
                id="deadline"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                placeholder="e.g., 15 days left"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="confidenceScore" className="text-gray-300">
                Confidence Score (0-10)
              </Label>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400">{formData.confidenceScore}/10</span>
              </div>
            </div>
            <input
              type="range"
              id="confidenceScore"
              min="0"
              max="10"
              value={formData.confidenceScore}
              onChange={(e) => setFormData({ ...formData, confidenceScore: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 - Not confident</span>
              <span>10 - Very confident</span>
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                {formData.isPrivate ? (
                  <Lock className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Unlock className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="text-white">Private Goal</p>
                  <p className="text-sm text-gray-400">
                    {formData.isPrivate ? 'Only you can see this goal' : 'This goal is visible to others'}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant={formData.isPrivate ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
                className={
                  formData.isPrivate
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                    : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                }
              >
                {formData.isPrivate ? 'Private' : 'Public'}
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
