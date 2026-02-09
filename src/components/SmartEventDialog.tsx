import { useState, useEffect } from 'react';
import { Sparkles, Calendar, Clock, Zap, Users, CheckSquare, Lightbulb, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';

interface SmartEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: (event: any) => void;
}

interface SmartSuggestion {
  title: string;
  description: string;
  suggestedTime: string;
  duration: string;
  energyLevel: 'high' | 'medium' | 'low';
  attendees: string[];
  followUpTasks: string[];
  reasoning: string;
}

export function SmartEventDialog({ open, onOpenChange, onEventCreated }: SmartEventDialogProps) {
  const [step, setStep] = useState<'input' | 'analyzing' | 'suggestions'>('input');
  const [eventPurpose, setEventPurpose] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState<SmartSuggestion | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset when closed
      setTimeout(() => {
        setStep('input');
        setEventPurpose('');
        setSuggestion(null);
      }, 300);
    }
  }, [open]);

  const handleAnalyze = () => {
    if (!eventPurpose.trim()) {
      toast.error('Event purpose required', {
        description: 'Please describe what you want to accomplish',
      });
      return;
    }

    setStep('analyzing');
    setAnalyzing(true);

    // Simulate AI analysis
    setTimeout(() => {
      const mockSuggestions: SmartSuggestion[] = [
        {
          title: 'Q4 Planning Meeting',
          description: 'Strategic planning session for Q4 objectives and key results',
          suggestedTime: 'Tomorrow, 9:00 AM - 10:30 AM',
          duration: '90 minutes',
          energyLevel: 'high',
          attendees: ['Sarah Chen', 'Marcus Johnson', 'Elena Rodriguez'],
          followUpTasks: [
            'Draft Q4 OKRs document',
            'Assign team leads to initiatives',
            'Schedule individual team syncs',
          ],
          reasoning: 'Best scheduled during peak team energy hours. All key stakeholders are available.',
        },
        {
          title: 'Product Roadmap Review',
          description: 'Quarterly review of product development progress and upcoming features',
          suggestedTime: 'Thursday, 10:00 AM - 11:30 AM',
          duration: '90 minutes',
          energyLevel: 'high',
          attendees: ['David Kim', 'Maya Patel', 'Sarah Chen'],
          followUpTasks: [
            'Update product roadmap',
            'Create feature specifications',
            'Schedule design reviews',
          ],
          reasoning: 'Optimal time for collaborative decision-making. Product team has full availability.',
        },
        {
          title: 'Client Status Update',
          description: 'Monthly check-in with key client stakeholders',
          suggestedTime: 'Friday, 2:00 PM - 3:00 PM',
          duration: '60 minutes',
          energyLevel: 'medium',
          attendees: ['Client Team', 'Account Manager'],
          followUpTasks: [
            'Send meeting summary',
            'Update project status dashboard',
            'Schedule next check-in',
          ],
          reasoning: 'Afternoon slot works well for client timezone. Lower energy requirement for status updates.',
        },
      ];

      const selected = mockSuggestions[0]; // In real app, would use AI to select best match
      setSuggestion(selected);
      setAnalyzing(false);
      setStep('suggestions');
    }, 2500);
  };

  const handleCreateEvent = () => {
    if (!suggestion) return;

    const newEvent = {
      id: `event-${Date.now()}`,
      title: suggestion.title,
      description: suggestion.description,
      startTime: suggestion.suggestedTime,
      duration: suggestion.duration,
      energyLevel: suggestion.energyLevel,
      attendees: suggestion.attendees,
      followUpTasks: suggestion.followUpTasks,
      smartGenerated: true,
    };

    if (onEventCreated) {
      onEventCreated(newEvent);
    }

    toast.success('Smart Event created!', {
      description: `${suggestion.title} has been added to your calendar`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Smart Event Creation
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            AI-powered event planning with energy-aware timing and intelligent suggestions
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="purpose" className="text-white">
                What's the purpose of this event?
              </Label>
              <Textarea
                id="purpose"
                value={eventPurpose}
                onChange={(e) => setEventPurpose(e.target.value)}
                placeholder="e.g., Quarterly planning meeting with the team to review Q4 goals..."
                className="bg-gray-800/50 border-gray-700 text-white min-h-[120px]"
              />
              <p className="text-xs text-gray-500">
                Describe the meeting goals, key topics, or what you want to accomplish
              </p>
            </div>

            <div className="bg-teal-600/10 border border-teal-600/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-teal-300">
                <Lightbulb className="w-4 h-4" />
                <span className="text-sm font-medium">AI will analyze:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Your energy patterns</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  <span>Team availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-purple-400" />
                  <span>Optimal attendees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-3 h-3 text-green-400" />
                  <span>Follow-up actions</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {step === 'analyzing' && (
          <div className="py-12">
            <div className="text-center space-y-6">
              <motion.div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mx-auto flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>

              <div>
                <h3 className="text-xl text-white mb-2">Analyzing your request...</h3>
                <p className="text-gray-400">
                  Finding the perfect time and attendees
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Checking team calendars</span>
                    <span className="text-teal-400">100%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Analyzing energy patterns</span>
                    <span className="text-purple-400">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Generating suggestions</span>
                    <span className="text-blue-400">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Suggestions */}
        {step === 'suggestions' && suggestion && (
          <div className="space-y-6 py-4">
            {/* Main Suggestion */}
            <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-600/20 rounded-xl p-6 space-y-4">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl text-white">{suggestion.title}</h3>
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
                    Recommended
                  </Badge>
                </div>
                <p className="text-gray-300 text-sm">{suggestion.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">{suggestion.suggestedTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">{suggestion.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className={`w-4 h-4 ${
                    suggestion.energyLevel === 'high' ? 'text-green-400' :
                    suggestion.energyLevel === 'medium' ? 'text-yellow-400' :
                    'text-orange-400'
                  }`} />
                  <span className="text-gray-300 capitalize">{suggestion.energyLevel} energy</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-teal-400" />
                  <span className="text-gray-300">{suggestion.attendees.length} attendees</span>
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Why this time?</span>
              </div>
              <p className="text-sm text-gray-400">{suggestion.reasoning}</p>
            </div>

            {/* Attendees */}
            <div className="space-y-2">
              <Label className="text-white">Suggested Attendees</Label>
              <div className="flex flex-wrap gap-2">
                {suggestion.attendees.map((attendee, idx) => (
                  <Badge key={idx} variant="outline" className="text-white">
                    <Users className="w-3 h-3 mr-1" />
                    {attendee}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Follow-up Tasks */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Suggested Follow-up Tasks
              </Label>
              <div className="space-y-2 bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                {suggestion.followUpTasks.map((task, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                    <span className="text-gray-300">{task}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                These tasks will be automatically created after the event
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAnalyze}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze & Suggest
              </Button>
            </>
          )}

          {step === 'suggestions' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button
                onClick={handleCreateEvent}
                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500"
              >
                Create Smart Event
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
