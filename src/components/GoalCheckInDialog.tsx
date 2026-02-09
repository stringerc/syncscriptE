import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { SmilePlus, Meh, Frown, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CheckIn {
  id: string;
  date: string;
  progress: number;
  mood: 'positive' | 'neutral' | 'concerned';
  summary: string;
  blockers: string[];
  wins: string[];
  nextSteps: string[];
  author: string;
}

interface GoalCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalTitle: string;
  currentProgress: number;
  onSubmitCheckIn: (checkIn: Omit<CheckIn, 'id' | 'date' | 'author'>) => void;
}

export function GoalCheckInDialog({ 
  open, 
  onOpenChange, 
  goalTitle, 
  currentProgress,
  onSubmitCheckIn 
}: GoalCheckInDialogProps) {
  const [mood, setMood] = useState<'positive' | 'neutral' | 'concerned'>('neutral');
  const [progress, setProgress] = useState(currentProgress);
  const [summary, setSummary] = useState('');
  const [wins, setWins] = useState('');
  const [blockers, setBlockers] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  const handleSubmit = () => {
    if (!summary.trim()) {
      toast.error('Please add a summary');
      return;
    }

    const checkIn = {
      progress,
      mood,
      summary: summary.trim(),
      wins: wins.trim().split('\n').filter(w => w.trim()),
      blockers: blockers.trim().split('\n').filter(b => b.trim()),
      nextSteps: nextSteps.trim().split('\n').filter(n => n.trim()),
    };

    onSubmitCheckIn(checkIn);
    
    // Reset form
    setMood('neutral');
    setProgress(currentProgress);
    setSummary('');
    setWins('');
    setBlockers('');
    setNextSteps('');
    
    onOpenChange(false);
    toast.success('Check-in submitted', { description: 'Your progress update has been recorded' });
  };

  const moodOptions = [
    { value: 'positive', label: 'Positive', icon: SmilePlus, color: 'text-emerald-400 border-emerald-500 bg-emerald-500/20' },
    { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-blue-400 border-blue-500 bg-blue-500/20' },
    { value: 'concerned', label: 'Concerned', icon: Frown, color: 'text-amber-400 border-amber-500 bg-amber-500/20' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Goal Check-In</DialogTitle>
          <p className="text-sm text-gray-400 mt-1">{goalTitle}</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Mood Selection */}
          <div className="space-y-2">
            <Label>How are you feeling about this goal?</Label>
            <div className="grid grid-cols-3 gap-3">
              {moodOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = mood === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMood(option.value as any)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? option.color
                        : 'border-gray-700 bg-[#2a2d35] hover:border-gray-600'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? '' : 'text-gray-400'}`} />
                    <span className={`text-sm ${isSelected ? '' : 'text-gray-400'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress Update */}
          <div className="space-y-2">
            <Label>Update Progress</Label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              />
              <span className="text-xl font-semibold text-purple-400 min-w-[4rem] text-right">
                {progress}%
              </span>
            </div>
            <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label>Summary *</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summarize your progress and current status..."
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500 min-h-[80px]"
            />
          </div>

          {/* Wins */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Wins & Achievements
            </Label>
            <Textarea
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="List your wins (one per line)&#10;• Completed milestone X&#10;• Achieved target Y"
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500 min-h-[80px]"
            />
          </div>

          {/* Blockers */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Blockers & Challenges
            </Label>
            <Textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="List any blockers or challenges (one per line)&#10;• Need help with Z&#10;• Waiting on approval"
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500 min-h-[80px]"
            />
          </div>

          {/* Next Steps */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-400" />
              Next Steps
            </Label>
            <Textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="What are your next steps? (one per line)&#10;• Focus on feature A&#10;• Schedule meeting with team"
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500 min-h-[80px]"
            />
          </div>
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
            Submit Check-In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
