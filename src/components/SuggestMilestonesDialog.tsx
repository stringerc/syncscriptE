import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Sparkles, Loader2 } from 'lucide-react';

interface SuggestMilestonesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  existingMilestones: any[];
  onAdd: (selectedMilestones: any[]) => void;
}

export function SuggestMilestonesDialog({
  open,
  onOpenChange,
  taskName,
  existingMilestones,
  onAdd
}: SuggestMilestonesDialogProps) {
  const [isGenerating, setIsGenerating] = React.useState(true);
  const [selectedMilestones, setSelectedMilestones] = React.useState<Set<string>>(new Set());
  const [suggestedMilestones, setSuggestedMilestones] = React.useState<any[]>([]);

  // Generate AI suggestions when modal opens
  React.useEffect(() => {
    if (open) {
      setIsGenerating(true);
      setSelectedMilestones(new Set());
      
      // Simulate AI generation
      setTimeout(() => {
        const suggestions = generateMilestoneSuggestions(taskName, existingMilestones);
        setSuggestedMilestones(suggestions);
        setIsGenerating(false);
      }, 1500);
    }
  }, [open, taskName, existingMilestones]);

  const generateMilestoneSuggestions = (taskName: string, existing: any[]) => {
    // AI-powered suggestions (mocked for now)
    const allSuggestions = [
      { id: `m-${Date.now()}-1`, title: 'Initial planning and research', completed: false, completedBy: null, completedAt: null },
      { id: `m-${Date.now()}-2`, title: 'Requirements gathering and documentation', completed: false, completedBy: null, completedAt: null },
      { id: `m-${Date.now()}-3`, title: 'Design and prototyping', completed: false, completedBy: null, completedAt: null },
      { id: `m-${Date.now()}-4`, title: 'Implementation and development', completed: false, completedBy: null, completedAt: null },
      { id: `m-${Date.now()}-5`, title: 'Testing and quality assurance', completed: false, completedBy: null, completedAt: null },
      { id: `m-${Date.now()}-6`, title: 'Review and finalization', completed: false, completedBy: null, completedAt: null },
      { id: `m-${Date.now()}-7`, title: 'Deployment and launch', completed: false, completedBy: null, completedAt: null },
      { id: `m-${Date.now()}-8`, title: 'Stakeholder presentation', completed: false, completedBy: null, completedAt: null },
    ];

    // Filter out similar existing milestones and return top 5
    // Handle both 'title' (tasks) and 'name' (goals) properties
    const filtered = allSuggestions.filter(suggestion => {
      return !existing.some(existing => {
        const existingTitle = existing.title || existing.name || '';
        return existingTitle.toLowerCase().includes(suggestion.title.toLowerCase().split(' ').slice(0, 2).join(' '));
      });
    });

    return filtered.slice(0, 5);
  };

  const toggleMilestone = (id: string) => {
    const newSelected = new Set(selectedMilestones);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMilestones(newSelected);
  };

  const handleAdd = () => {
    const milestonesToAdd = suggestedMilestones.filter(m => selectedMilestones.has(m.id));
    onAdd(milestonesToAdd);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1d24] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Suggested Milestones
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            AI-powered milestone suggestions for your goal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-400">
            Based on "<span className="text-white">{taskName}</span>", here are some AI-suggested milestones:
          </div>

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
              <div className="text-sm text-gray-400">Generating milestone suggestions...</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {suggestedMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedMilestones.has(milestone.id)
                      ? 'bg-purple-500/10 border-purple-500/50'
                      : 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600'
                  }`}
                  onClick={() => toggleMilestone(milestone.id)}
                >
                  <Checkbox
                    checked={selectedMilestones.has(milestone.id)}
                    onCheckedChange={() => toggleMilestone(milestone.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-white">{milestone.title}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isGenerating && suggestedMilestones.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No new milestone suggestions available. All relevant milestones may already be added.
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
              onClick={handleAdd}
              disabled={selectedMilestones.size === 0 || isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Add {selectedMilestones.size} Milestone{selectedMilestones.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}