import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Zap, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay: boolean;
  budgetImpact?: number;
  preparationTasks?: any[];
}

interface EventCompletionProps {
  event: Event;
  onComplete?: () => void;
}

const EventCompletion: React.FC<EventCompletionProps> = ({ event, onComplete }) => {
  const [completionPercentage, setCompletionPercentage] = useState(80);
  const [isCompleting, setIsCompleting] = useState(false);
  const queryClient = useQueryClient();

  // Complete event mutation
  const completeEventMutation = useMutation({
    mutationFn: async (percentage: number) => {
      const response = await api.patch(`/calendar/${event.id}/complete`, {
        completionPercentage: percentage
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Event Completed! 🎉",
        description: data.message,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['energy-status'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to complete event",
        variant: "destructive"
      });
    }
  });

  const handleComplete = () => {
    setIsCompleting(true);
    completeEventMutation.mutate(completionPercentage);
  };

  const getCompletionMessage = (percentage: number) => {
    if (percentage >= 80) {
      return "Excellent! You'll earn bonus EP for this completion!";
    } else if (percentage >= 50) {
      return "Good work! You'll earn standard EP for this completion.";
    } else {
      return "Keep going! You'll earn minimal EP for this completion.";
    }
  };

  const getEstimatedEP = (percentage: number) => {
    if (percentage >= 80) {
      const baseEP = 20;
      const bonusMultiplier = Math.min(percentage / 100, 1.5);
      return Math.round(baseEP * bonusMultiplier);
    } else if (percentage >= 50) {
      return Math.round(15 * (percentage / 100));
    } else {
      return Math.round(5 * (percentage / 100));
    }
  };

  const formatEventTime = (startTime: string, endTime: string, isAllDay: boolean) => {
    if (isAllDay) {
      return "All Day";
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `${startStr} - ${endStr}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Complete Event
        </CardTitle>
        <CardDescription>
          Mark your event as completed and earn Energy Points
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Details */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatEventTime(event.startTime, event.endTime, event.isAllDay)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Completion Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Completion Percentage</label>
            <Badge variant="secondary" className="text-lg font-bold">
              {completionPercentage}%
            </Badge>
          </div>
          
          <Slider
            value={[completionPercentage]}
            onValueChange={(value) => setCompletionPercentage(value[0])}
            max={100}
            min={0}
            step={5}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>80%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress 
            value={completionPercentage} 
            className="h-2"
          />
        </div>

        {/* EP Preview */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Estimated EP Reward</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {getEstimatedEP(completionPercentage)} EP
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {getCompletionMessage(completionPercentage)}
          </p>
        </div>

        {/* Complete Button */}
        <Button
          onClick={handleComplete}
          disabled={isCompleting}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {isCompleting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mr-2"
              >
                <CheckCircle className="h-4 w-4" />
              </motion.div>
              Completing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Event
            </>
          )}
        </Button>

        {/* Completion Tiers */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>0-49%:</span>
            <span>Minimal EP (5 × percentage)</span>
          </div>
          <div className="flex justify-between">
            <span>50-79%:</span>
            <span>Standard EP (15 × percentage)</span>
          </div>
          <div className="flex justify-between">
            <span>80-100%:</span>
            <span>Bonus EP (20 × percentage, max 1.5x)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCompletion;
