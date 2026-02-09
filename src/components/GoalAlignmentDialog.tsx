import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Target, Link as LinkIcon, TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface GoalAlignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGoal: {
    id: string;
    title: string;
    category: string;
  };
  availableGoals: {
    id: string;
    title: string;
    category: string;
    progress: number;
  }[];
  currentParentGoal?: string | null;
  currentChildGoals?: string[];
  currentAlignedWith?: string;
  onUpdateAlignment: (data: {
    parentGoal?: string | null;
    childGoals?: string[];
    alignedWith?: string;
  }) => void;
}

export function GoalAlignmentDialog({ 
  open, 
  onOpenChange, 
  currentGoal,
  availableGoals,
  currentParentGoal,
  currentChildGoals = [],
  currentAlignedWith,
  onUpdateAlignment
}: GoalAlignmentDialogProps) {
  const [parentGoal, setParentGoal] = useState<string | null>(currentParentGoal || null);
  const [selectedChildGoals, setSelectedChildGoals] = useState<string[]>(currentChildGoals);
  const [alignedWith, setAlignedWith] = useState(currentAlignedWith || '');

  // Filter out current goal from available goals
  const otherGoals = availableGoals.filter(g => g.id !== currentGoal.id);

  const handleSubmit = () => {
    onUpdateAlignment({
      parentGoal,
      childGoals: selectedChildGoals,
      alignedWith: alignedWith.trim() || undefined,
    });
    
    toast.success('Goal alignment updated', { 
      description: 'Goal relationships have been updated successfully' 
    });
    onOpenChange(false);
  };

  const toggleChildGoal = (goalId: string) => {
    if (selectedChildGoals.includes(goalId)) {
      setSelectedChildGoals(selectedChildGoals.filter(id => id !== goalId));
    } else {
      setSelectedChildGoals([...selectedChildGoals, goalId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-purple-400" />
            Goal Alignment
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-1">{currentGoal.title}</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Strategic Alignment */}
          <div className="space-y-3 p-4 bg-[#2a2d35] rounded-lg border border-gray-700">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <Label>Strategic Alignment</Label>
            </div>
            <p className="text-xs text-gray-400">
              Connect this goal to a larger company or personal objective
            </p>
            <Input
              value={alignedWith}
              onChange={(e) => setAlignedWith(e.target.value)}
              placeholder="e.g., Grow SyncScript to 10K users, Achieve financial independence"
              className="bg-[#1e2128] border-gray-700 text-white placeholder:text-gray-500"
            />
            {alignedWith && (
              <div className="flex items-center gap-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400">{alignedWith}</span>
              </div>
            )}
          </div>

          {/* Parent Goal */}
          <div className="space-y-3 p-4 bg-[#2a2d35] rounded-lg border border-gray-700">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <Label>Parent Goal</Label>
            </div>
            <p className="text-xs text-gray-400">
              Select a parent goal that this goal contributes to
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setParentGoal(null)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  parentGoal === null
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-700 bg-[#1e2128] hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  {parentGoal === null ? (
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-400">No parent goal</span>
                </div>
              </button>
              {otherGoals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setParentGoal(goal.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    parentGoal === goal.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-700 bg-[#1e2128] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {parentGoal === goal.id ? (
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm text-white">{goal.title}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {goal.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-purple-400">{goal.progress}%</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Child Goals */}
          <div className="space-y-3 p-4 bg-[#2a2d35] rounded-lg border border-gray-700">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <Label>Child Goals</Label>
            </div>
            <p className="text-xs text-gray-400">
              Select goals that contribute to achieving this goal
            </p>
            {otherGoals.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No other goals available</p>
            ) : (
              <div className="space-y-2">
                {otherGoals
                  .filter(g => g.id !== parentGoal) // Can't select parent as child
                  .map((goal) => {
                    const isSelected = selectedChildGoals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleChildGoal(goal.id)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/20'
                            : 'border-gray-700 bg-[#1e2128] hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-400" />
                            )}
                            <div>
                              <p className="text-sm text-white">{goal.title}</p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {goal.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-emerald-400">{goal.progress}%</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Summary */}
          {(parentGoal || selectedChildGoals.length > 0 || alignedWith) && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-300 mb-2">Alignment Summary:</p>
              <ul className="text-xs text-gray-300 space-y-1">
                {alignedWith && (
                  <li>• Aligned with: <span className="text-cyan-400">{alignedWith}</span></li>
                )}
                {parentGoal && (
                  <li>• Contributes to: <span className="text-purple-400">
                    {otherGoals.find(g => g.id === parentGoal)?.title}
                  </span></li>
                )}
                {selectedChildGoals.length > 0 && (
                  <li>• Has {selectedChildGoals.length} child goal{selectedChildGoals.length > 1 ? 's' : ''}</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-700 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
          >
            Update Alignment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
