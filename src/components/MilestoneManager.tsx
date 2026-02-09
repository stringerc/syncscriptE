import { useState } from 'react';
import { Flag, Plus, X, Check, Circle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

interface MilestoneManagerProps {
  milestones: Milestone[];
  onMilestonesChange: (milestones: Milestone[]) => void;
}

export function MilestoneManager({ milestones, onMilestonesChange }: MilestoneManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  const handleAdd = () => {
    if (!newMilestoneTitle.trim()) {
      toast.error('Invalid milestone', { description: 'Please enter a title' });
      return;
    }

    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      completed: false,
    };

    onMilestonesChange([...milestones, newMilestone]);
    setNewMilestoneTitle('');
    setIsAdding(false);
    toast.success('Milestone added');
  };

  const handleToggle = (id: string) => {
    const updated = milestones.map(m =>
      m.id === id ? { ...m, completed: !m.completed } : m
    );
    onMilestonesChange(updated);
  };

  const handleRemove = (id: string) => {
    onMilestonesChange(milestones.filter(m => m.id !== id));
    toast.success('Milestone removed');
  };

  const completedCount = milestones.filter(m => m.completed).length;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300 flex items-center gap-2">
          <Flag className="w-4 h-4" />
          Milestones
          {milestones.length > 0 && (
            <span className="text-xs text-gray-500">
              ({completedCount}/{milestones.length})
            </span>
          )}
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="gap-1 h-7 text-xs"
        >
          <Plus className="w-3 h-3" />
          Add Milestone
        </Button>
      </div>

      {/* Progress Bar */}
      {milestones.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2"
            indicatorClassName={
              progress === 100 
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                : progress >= 50
                ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                : 'bg-gradient-to-r from-amber-600 to-amber-400'
            }
          />
        </div>
      )}

      {/* Add Milestone Form */}
      {isAdding && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 space-y-2">
          <Input
            placeholder="Milestone title..."
            value={newMilestoneTitle}
            onChange={(e) => setNewMilestoneTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="bg-gray-800/50 border-gray-700 text-white text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              className="flex-1 bg-teal-600 hover:bg-teal-500"
            >
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewMilestoneTitle('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Milestones List */}
      {milestones.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center gap-2 bg-gray-800/30 border border-gray-700 rounded-lg p-2 group hover:border-gray-600 transition-colors"
            >
              <Checkbox
                checked={milestone.completed}
                onCheckedChange={() => handleToggle(milestone.id)}
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${milestone.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                  {milestone.title}
                </div>
              </div>
              {milestone.completed && (
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              )}
              <button
                type="button"
                onClick={() => handleRemove(milestone.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-opacity"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {milestones.length === 0 && !isAdding && (
        <div className="text-center py-4 text-sm text-gray-500 bg-gray-800/20 border border-dashed border-gray-700 rounded-lg">
          No milestones yet. Break down your goal into achievable steps.
        </div>
      )}
    </div>
  );
}
