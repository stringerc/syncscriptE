/**
 * SmartEventCreation Component
 * 
 * AI-guided event creation with smart suggestions.
 * 
 * Features:
 * - Best time windows suggestion
 * - Required attendees picker
 * - Travel buffer calculator
 * - Energy cost estimate
 * - Multi-step wizard
 */

import { useState } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, Check, Clock, Users, MapPin, Zap, Brain, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface SmartEventCreationProps {
  open: boolean;
  onClose: () => void;
  onEventCreate: (event: any) => void;
}

export function SmartEventCreation({ open, onClose, onEventCreate }: SmartEventCreationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    duration: '60',
    attendees: [] as string[],
    location: '',
    travelTime: '0',
    suggestedTime: '',
    energyCost: 'medium' as 'low' | 'medium' | 'high',
  });

  const steps = [
    { title: 'What\'s the event?', subtitle: 'Basic details' },
    { title: 'Who needs to attend?', subtitle: 'Select attendees' },
    { title: 'Where & When?', subtitle: 'Location and timing' },
    { title: 'Review & Create', subtitle: 'AI-optimized event' },
  ];

  const handleNext = () => {
    if (currentStep === 0 && !eventData.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = () => {
    const newEvent = {
      id: Date.now().toString(),
      title: eventData.title,
      description: eventData.description,
      startTime: new Date(Date.now() + 86400000), // Tomorrow
      endTime: new Date(Date.now() + 86400000 + parseInt(eventData.duration) * 60000),
      location: eventData.location,
      attendees: eventData.attendees,
      travelBuffer: parseInt(eventData.travelTime),
      energyCost: eventData.energyCost,
      aiOptimized: true,
    };

    onEventCreate(newEvent);
    toast.success('Smart Event created', {
      description: 'AI-optimized for best time and attendees',
    });
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(0);
    setEventData({
      title: '',
      description: '',
      duration: '60',
      attendees: [],
      location: '',
      travelTime: '0',
      suggestedTime: '',
      energyCost: 'medium',
    });
    onClose();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Mock AI suggestions
  const getAISuggestions = () => {
    if (currentStep === 1) {
      return {
        title: 'Suggested Attendees',
        items: [
          'Based on calendar history, Sarah Chen is available',
          'Mike Johnson typically attends these meetings',
        ],
      };
    }
    if (currentStep === 2) {
      return {
        title: 'Best Time Windows',
        items: [
          '2 PM - 3 PM (High availability - 85%)',
          '10 AM - 11 AM (Backup slot - 70%)',
          'Add 15 min travel buffer recommended',
        ],
      };
    }
    return null;
  };

  const suggestions = getAISuggestions();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1e2128] border-gray-800 max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white">Create Smart Event</DialogTitle>
              <DialogDescription className="text-gray-400">AI-powered event scheduling</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-xl text-white mb-2">{steps[currentStep].title}</h3>
              <p className="text-sm text-gray-400 mb-6">{steps[currentStep].subtitle}</p>

              {/* Step 0: Basic Details */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-white">Event Title *</Label>
                    <Input
                      id="title"
                      value={eventData.title}
                      onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                      placeholder="e.g., Team Planning Session"
                      className="mt-1 bg-[#1a1c20] border-gray-800"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-white">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={eventData.description}
                      onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                      placeholder="Add event details..."
                      rows={3}
                      className="mt-1 bg-[#1a1c20] border-gray-800 resize-none"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration" className="text-white">Duration (minutes)</Label>
                    <Select value={eventData.duration} onValueChange={(value) => setEventData({ ...eventData, duration: value })}>
                      <SelectTrigger className="mt-1 bg-[#1a1c20] border-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 1: Attendees */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="attendees" className="text-white">Add Attendees</Label>
                    <Input
                      id="attendees"
                      placeholder="Enter email addresses"
                      className="mt-1 bg-[#1a1c20] border-gray-800"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          setEventData({
                            ...eventData,
                            attendees: [...eventData.attendees, e.currentTarget.value],
                          });
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Press Enter to add</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {eventData.attendees.map((email, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {email}
                        <button
                          onClick={() => setEventData({
                            ...eventData,
                            attendees: eventData.attendees.filter((_, idx) => idx !== i),
                          })}
                          className="ml-1 hover:text-red-400"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Location & Timing */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location" className="text-white">Location</Label>
                    <Input
                      id="location"
                      value={eventData.location}
                      onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                      placeholder="e.g., Conference Room A or Zoom"
                      className="mt-1 bg-[#1a1c20] border-gray-800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="travelTime" className="text-white">Travel Buffer (minutes)</Label>
                    <Select value={eventData.travelTime} onValueChange={(value) => setEventData({ ...eventData, travelTime: value })}>
                      <SelectTrigger className="mt-1 bg-[#1a1c20] border-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No travel time</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="energyCost" className="text-white">Energy Cost Estimate</Label>
                    <Select value={eventData.energyCost} onValueChange={(value: any) => setEventData({ ...eventData, energyCost: value })}>
                      <SelectTrigger className="mt-1 bg-[#1a1c20] border-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Routine meeting</SelectItem>
                        <SelectItem value="medium">Medium - Important discussion</SelectItem>
                        <SelectItem value="high">High - Intensive session</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#252830] border border-gray-700 rounded-lg">
                    <h4 className="text-white font-semibold mb-3">Event Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Title:</span>
                        <span className="text-white">{eventData.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white">{eventData.duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Attendees:</span>
                        <span className="text-white">{eventData.attendees.length}</span>
                      </div>
                      {eventData.location && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Location:</span>
                          <span className="text-white">{eventData.location}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Travel Buffer:</span>
                        <span className="text-white">{eventData.travelTime} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Energy Cost:</span>
                        <Badge variant="outline" className="capitalize">{eventData.energyCost}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-600/10 border border-purple-600/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-white font-medium mb-1">AI Recommendations</h5>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Best time: Tomorrow 2-3 PM (85% availability)</li>
                          <li>• All attendees available in this window</li>
                          <li>• {eventData.travelTime !== '0' ? 'Travel buffer included' : 'Consider adding travel time'}</li>
                          <li>• Energy optimal: Schedule before 4 PM</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              {suggestions && currentStep < 3 && (
                <div className="mt-4 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Brain className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-blue-400">{suggestions.title}</p>
                      {suggestions.items.map((item, i) => (
                        <p key={i} className="text-sm text-gray-400">• {item}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-teal-600 to-cyan-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
