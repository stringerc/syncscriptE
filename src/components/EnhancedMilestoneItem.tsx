import { useState } from 'react';
import { 
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Paperclip, ExternalLink, FileText, Plus, Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';
import { CURRENT_USER } from '../utils/user-constants';

interface Step {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: any;
  resources?: any[];
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedBy?: string | null;
  completedAt?: string | null;
  assignedTo?: any[];
  steps?: Step[];
  resources?: any[];
}

interface EnhancedMilestoneItemProps {
  task: any;
  milestone: Milestone;
  onToggleMilestone: (taskId: string, milestoneId: string) => void;
  onToggleStep: (taskId: string, milestoneId: string, stepId: string) => void;
  onAddStep: (taskId: string, milestoneId: string, stepTitle: string) => void;
  onViewResources?: (resources: any[], title: string) => void;
}

export function EnhancedMilestoneItem({
  task,
  milestone,
  onToggleMilestone,
  onToggleStep,
  onAddStep,
  onViewResources
}: EnhancedMilestoneItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');

  const hasSteps = milestone.steps && milestone.steps.length > 0;
  const completedSteps = milestone.steps?.filter(s => s.completed).length || 0;
  const totalSteps = milestone.steps?.length || 0;
  const completionPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Collect all resources from milestone and its steps
  const allResources: any[] = [];
  if (milestone.resources) {
    allResources.push(...milestone.resources);
  }
  if (milestone.steps) {
    milestone.steps.forEach(step => {
      if (step.resources) {
        allResources.push(...step.resources);
      }
    });
  }
  const resourceCount = allResources.length;

  const handleAddStepSubmit = () => {
    if (!newStepTitle.trim()) {
      toast.error('Please enter a step title');
      return;
    }
    
    onAddStep(task.id, milestone.id, newStepTitle);
    setNewStepTitle('');
    setShowAddStep(false);
    toast.success('Step added!', { description: newStepTitle });
  };

  return (
    <div className="space-y-2 bg-gray-900/20 border border-gray-700/30 rounded-lg p-3">
      {/* Milestone Header */}
      <div className="flex items-start gap-2 group">
        {/* Expand/Collapse Steps Button */}
        {hasSteps && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 hover:opacity-70 transition-opacity mt-0.5"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-teal-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
        )}
        
        {/* Completion Checkbox - Enhanced Visibility */}
        <button
          onClick={() => onToggleMilestone(task.id, milestone.id)}
          className="shrink-0 hover:scale-110 transition-all mt-0.5 relative group/checkbox"
          title={milestone.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {milestone.completed ? (
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
          ) : (
            <>
              <Circle className="w-5 h-5 text-gray-400 group-hover/checkbox:text-teal-400 transition-colors" />
              <div className="absolute inset-0 rounded-full bg-teal-500/0 group-hover/checkbox:bg-teal-500/10 transition-colors" />
            </>
          )}
        </button>
        
        {/* Milestone Title & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-sm ${ 
              milestone.completed ? 'text-gray-400 line-through' : 'text-gray-300'
            }`}>
              {milestone.title}
            </span>
            
            {/* Steps Progress */}
            {hasSteps && (
              <>
                <span className="text-xs text-gray-500">
                  ({completedSteps}/{totalSteps} steps)
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-teal-400 font-medium">{completionPercent}%</span>
                </div>
              </>
            )}
            
            {/* Resources Badge */}
            {resourceCount > 0 && onViewResources && (
              <button
                onClick={() => onViewResources(allResources, `${task.title} - ${milestone.title}`)}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400 hover:bg-blue-500/20 transition-colors"
                title={allResources.map(r => r.name).join(', ')}
              >
                <Paperclip className="w-3 h-3" />
                <span>{resourceCount}</span>
              </button>
            )}
          </div>
          
          {/* Completion Info */}
          {milestone.completed && milestone.completedBy && (
            <div className="text-[10px] text-gray-500">
              Completed by {milestone.completedBy} {milestone.completedAt && `· ${milestone.completedAt}`}
            </div>
          )}
        </div>
        
        {/* Complete Button (appears on hover) */}
        {!milestone.completed && (
          <Button
            size="sm"
            variant="outline"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-3 text-xs bg-teal-500/10 border-teal-500/50 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300"
            onClick={() => onToggleMilestone(task.id, milestone.id)}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Complete
          </Button>
        )}
        
        {/* Add Step Button */}
        {!milestone.completed && (
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs text-gray-400 hover:text-teal-300 hover:bg-teal-500/10"
            onClick={() => setShowAddStep(!showAddStep)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Step
          </Button>
        )}
      </div>
      
      {/* Add Step Input */}
      {showAddStep && (
        <div className="flex items-center gap-2 ml-6 pl-4 border-l-2 border-teal-500/30">
          <Input
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            placeholder="Enter step title..."
            className="flex-1 h-7 text-xs bg-gray-800/50 border-gray-700 focus:border-teal-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddStepSubmit();
              } else if (e.key === 'Escape') {
                setShowAddStep(false);
                setNewStepTitle('');
              }
            }}
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
            onClick={handleAddStepSubmit}
          >
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
            onClick={() => {
              setShowAddStep(false);
              setNewStepTitle('');
            }}
          >
            Cancel
          </Button>
        </div>
      )}
      
      {/* Expanded Steps */}
      {hasSteps && expanded && (
        <div className="ml-6 pl-4 border-l-2 border-gray-700/50 space-y-1.5">
          {milestone.steps!.map((step) => (
            <div key={step.id} className="flex items-center gap-2 group/step">
              {/* Step Checkbox - Enhanced Visibility */}
              <button
                onClick={() => onToggleStep(task.id, milestone.id, step.id)}
                className="shrink-0 hover:scale-110 transition-all relative group/stepcheckbox"
                title={step.completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-400/80" />
                ) : (
                  <>
                    <Circle className="w-4 h-4 text-gray-400 group-hover/stepcheckbox:text-teal-400 transition-colors" />
                    <div className="absolute inset-0 rounded-full bg-teal-500/0 group-hover/stepcheckbox:bg-teal-500/10 transition-colors" />
                  </>
                )}
              </button>
              
              {/* Step Title */}
              <span className={`text-xs flex-1 ${ 
                step.completed ? 'text-gray-500 line-through' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
              
              {/* Step Resources */}
              {step.resources && step.resources.length > 0 && (
                <div className="flex items-center gap-1 px-1 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400">
                  <Paperclip className="w-2.5 h-2.5" />
                  <span>{step.resources.length}</span>
                </div>
              )}
              
              {/* Complete Button for Step (appears on hover) */}
              {!step.completed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="opacity-0 group-hover/step:opacity-100 transition-opacity h-6 px-2 text-[10px] bg-teal-500/10 border-teal-500/50 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300"
                  onClick={() => onToggleStep(task.id, milestone.id, step.id)}
                >
                  <Check className="w-3 h-3 mr-0.5" />
                  Complete
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}