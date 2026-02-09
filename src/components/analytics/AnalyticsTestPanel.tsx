/**
 * Analytics Test Component
 * 
 * Quick testing interface to generate sample analytics events
 * Useful for testing the analytics pipeline
 */

import React, { useState } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { CURRENT_USER } from '../../utils/user-constants';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { CheckCircle2, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function AnalyticsTestPanel() {
  const { track, flush, getBufferSize } = useAnalytics();
  const [bufferSize, setBufferSize] = useState(0);
  const [eventCount, setEventCount] = useState(0);

  // Update buffer size display
  const updateBufferSize = () => {
    setBufferSize(getBufferSize());
  };

  // Generate a sample milestone completion event
  const generateMilestoneEvent = () => {
    track('milestone_completion_toggled', {
      goal_id: `test_goal_${Date.now()}`,
      milestone_id: `test_milestone_${Date.now()}`,
      was_completed: false,
      new_completed: true,
      is_assigned: true,
      used_creator_override: false,
      user_role: 'creator',
      energy_level: Math.floor(Math.random() * 100),
      energy_color: 'cyan'
    }, CURRENT_USER.name);
    
    setEventCount(prev => prev + 1);
    updateBufferSize();
    toast.success('Milestone completion event tracked');
  };

  // Generate a sample step completion event
  const generateStepEvent = () => {
    track('step_completion_toggled', {
      goal_id: `test_goal_${Date.now()}`,
      milestone_id: `test_milestone_${Date.now()}`,
      step_id: `test_step_${Date.now()}`,
      was_completed: false,
      new_completed: true,
      is_assigned: true,
      used_creator_override: false,
      user_role: 'collaborator',
      energy_level: Math.floor(Math.random() * 100),
      energy_color: 'purple'
    }, CURRENT_USER.name);
    
    setEventCount(prev => prev + 1);
    updateBufferSize();
    toast.success('Step completion event tracked');
  };

  // Generate a sample task event
  const generateTaskEvent = () => {
    track('task_milestone_completion_toggled', {
      task_id: `test_task_${Date.now()}`,
      milestone_id: `test_milestone_${Date.now()}`,
      was_completed: false,
      new_completed: true,
      has_incomplete_steps: false,
      user_role: 'creator',
      energy_level: Math.floor(Math.random() * 100),
      energy_color: 'green'
    }, CURRENT_USER.name);
    
    setEventCount(prev => prev + 1);
    updateBufferSize();
    toast.success('Task event tracked');
  };

  // Generate bulk events (for testing)
  const generateBulkEvents = () => {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const eventType = ['milestone_completion_toggled', 'step_completion_toggled', 'task_milestone_completion_toggled'][i % 3];
      
      track(eventType, {
        goal_id: `test_goal_${Date.now()}_${i}`,
        milestone_id: `test_milestone_${Date.now()}_${i}`,
        was_completed: false,
        new_completed: true,
        is_assigned: true,
        user_role: 'creator',
        energy_level: Math.floor(Math.random() * 100),
        energy_color: ['cyan', 'purple', 'green'][i % 3]
      }, CURRENT_USER.name);
    }
    
    setEventCount(prev => prev + count);
    updateBufferSize();
    toast.success(`${count} events tracked`);
  };

  // Manual flush
  const handleFlush = () => {
    flush();
    setTimeout(updateBufferSize, 100);
    toast.info('Flushing analytics buffer to backend');
  };

  return (
    <Card className="bg-[#1e2128] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Analytics Test Panel
        </CardTitle>
        <CardDescription>
          Generate test events to verify analytics pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#16181d] rounded-lg p-3">
            <div className="text-gray-400 text-sm mb-1">Events Generated</div>
            <div className="text-2xl font-bold text-white">{eventCount}</div>
          </div>
          <div className="bg-[#16181d] rounded-lg p-3">
            <div className="text-gray-400 text-sm mb-1">Buffer Size</div>
            <div className="text-2xl font-bold text-cyan-400">{bufferSize}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={generateMilestoneEvent}
            variant="outline"
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Milestone Event
          </Button>
          <Button
            onClick={generateStepEvent}
            variant="outline"
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Step Event
          </Button>
          <Button
            onClick={generateTaskEvent}
            variant="outline"
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Task Event
          </Button>
          <Button
            onClick={generateBulkEvents}
            variant="outline"
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Bulk (10x)
          </Button>
        </div>

        {/* Flush Button */}
        <Button
          onClick={handleFlush}
          className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Flush to Backend
        </Button>

        {/* Info */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
          <p className="mb-1">💡 Events are batched and auto-flush:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Every 30 seconds</li>
            <li>After 20 events</li>
            <li>On page unload</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}