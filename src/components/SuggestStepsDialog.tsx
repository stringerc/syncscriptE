import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Sparkles, Loader2 } from 'lucide-react';

interface SuggestStepsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestoneName: string;
  existingSteps: any[];
  onAdd: (selectedSteps: any[]) => void;
}

export function SuggestStepsDialog({
  open,
  onOpenChange,
  milestoneName,
  existingSteps,
  onAdd
}: SuggestStepsDialogProps) {
  const [isGenerating, setIsGenerating] = React.useState(true);
  const [selectedSteps, setSelectedSteps] = React.useState<Set<string>>(new Set());
  const [suggestedSteps, setSuggestedSteps] = React.useState<any[]>([]);

  // Generate AI suggestions when modal opens
  React.useEffect(() => {
    if (open) {
      setIsGenerating(true);
      setSelectedSteps(new Set());
      
      // Simulate AI generation
      setTimeout(() => {
        const suggestions = generateStepSuggestions(milestoneName, existingSteps);
        setSuggestedSteps(suggestions);
        setIsGenerating(false);
      }, 1500);
    }
  }, [open, milestoneName, existingSteps]);

  const generateStepSuggestions = (milestoneName: string, existing: any[]) => {
    // AI-powered suggestions (mocked for now)
    const allSuggestions = [
      { 
        id: `step-${Date.now()}-1`, 
        title: 'Set up project structure and environment', 
        completed: false,
        assignedTo: { name: 'Unassigned', image: '', fallback: 'U' }
      },
      { 
        id: `step-${Date.now()}-2`, 
        title: 'Define success criteria and KPIs', 
        completed: false,
        assignedTo: { name: 'Unassigned', image: '', fallback: 'U' }
      },
      { 
        id: `step-${Date.now()}-3`, 
        title: 'Create detailed timeline and schedule', 
        completed: false,
        assignedTo: { name: 'Unassigned', image: '', fallback: 'U' }
      },
      { 
        id: `step-${Date.now()}-4`, 
        title: 'Identify and document dependencies', 
        completed: false,
        assignedTo: { name: 'Unassigned', image: '', fallback: 'U' }
      },
      { 
        id: `step-${Date.now()}-5`, 
        title: 'Conduct stakeholder review meeting', 
        completed: false,
        assignedTo: { name: 'Unassigned', image: '', fallback: 'U' }
      },
      { 
        id: `step-${Date.now()}-6`, 
        title: 'Document findings and insights', 
        completed: false,
        assignedTo: { name: 'Unassigned', image: '', fallback: 'U' }
      },
      { 
        id: `step-${Date.now()}-7`, 
        title: 'Prepare progress report', 
        completed: false,
        assignedTo: { name: 'Unassigned', image: '', fallback: 'U' }
      },
    ];

    // Filter out similar existing steps and return top 5
    const filtered = allSuggestions.filter(suggestion => {
      return !existing.some(existing => 
        existing.title.toLowerCase().includes(suggestion.title.toLowerCase().split(' ').slice(0, 2).join(' '))
      );
    });

    return filtered.slice(0, 5);
  };

  const toggleStep = (id: string) => {
    const newSelected = new Set(selectedSteps);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSteps(newSelected);
  };

  const handleAdd = () => {
    const stepsToAdd = suggestedSteps.filter(s => selectedSteps.has(s.id));
    onAdd(stepsToAdd);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1d24] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Suggested Steps
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            AI-powered step suggestions for your milestone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-400">
            Based on milestone "<span className="text-white">{milestoneName}</span>", here are some AI-suggested steps:
          </div>

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
              <div className="text-sm text-gray-400">Generating step suggestions...</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {suggestedSteps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedSteps.has(step.id)
                      ? 'bg-purple-500/10 border-purple-500/50'
                      : 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600'
                  }`}
                  onClick={() => toggleStep(step.id)}
                >
                  <Checkbox
                    checked={selectedSteps.has(step.id)}
                    onCheckedChange={() => toggleStep(step.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-white">{step.title}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isGenerating && suggestedSteps.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No new step suggestions available. All relevant steps may already be added.
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
              disabled={selectedSteps.size === 0 || isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Add {selectedSteps.size} Step{selectedSteps.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
