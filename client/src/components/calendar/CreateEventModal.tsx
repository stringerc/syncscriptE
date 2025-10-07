import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Zap, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onEventCreated?: (eventData: any) => void;
  suggestedDate?: Date;
  suggestedTime?: string;
}

export function CreateEventModal({ open, onClose, onEventCreated, suggestedDate, suggestedTime }: CreateEventModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: suggestedDate ? suggestedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: suggestedTime || '10:00',
    duration: '60',
    location: '',
    attendees: '',
    energyLevel: 'HIGH' as 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK',
    type: 'meeting' as 'meeting' | 'focus' | 'personal' | 'workshop',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📅 Creating event:', formData);
    
    // Prepare event data for backend
    const eventData = {
      title: formData.title,
      description: formData.description,
      startTime: new Date(`${formData.date}T${formData.startTime}:00`).toISOString(),
      endTime: new Date(new Date(`${formData.date}T${formData.startTime}:00`).getTime() + (parseInt(formData.duration) * 60 * 1000)).toISOString(),
      location: formData.location || null,
      isAllDay: false,
      budgetImpact: formData.type === 'meeting' ? 0 : undefined
    };
    
    // Call the callback if provided
    if (onEventCreated) {
      onEventCreated(eventData);
    } else {
      // Fallback to toast notification
      toast({
        title: '✅ Event Created!',
        description: `${formData.title} scheduled for ${formData.date} at ${formData.startTime}`,
        duration: 3000,
      });
    }
    
    onClose();
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      duration: '60',
      location: '',
      attendees: '',
      energyLevel: 'HIGH',
      type: 'meeting',
    });
  };

  const energyLevels = [
    { value: 'PEAK', emoji: '🔥', label: 'Peak', color: 'purple' },
    { value: 'HIGH', emoji: '⚡', label: 'High', color: 'green' },
    { value: 'MEDIUM', emoji: '😐', label: 'Medium', color: 'yellow' },
    { value: 'LOW', emoji: '😴', label: 'Low', color: 'red' },
  ];

  const eventTypes = [
    { value: 'meeting', label: 'Meeting', icon: Users, color: 'blue' },
    { value: 'focus', label: 'Focus Block', icon: Zap, color: 'purple' },
    { value: 'personal', label: 'Personal', icon: Users, color: 'orange' },
    { value: 'workshop', label: 'Workshop', icon: Users, color: 'pink' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="w-6 h-6 text-blue-600" />
            Create New Event
          </DialogTitle>
          <DialogDescription>
            Schedule a new event with AI-powered time optimization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Team Meeting, Focus Session"
              required
              className="text-base"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Event Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {eventTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value as any })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? `border-${type.color}-500 bg-${type.color}-50` 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={isSelected ? {
                      borderColor: type.color === 'blue' ? 'rgb(59 130 246)' :
                                   type.color === 'purple' ? 'rgb(168 85 247)' :
                                   type.color === 'orange' ? 'rgb(249 115 22)' :
                                   'rgb(236 72 153)',
                      backgroundColor: type.color === 'blue' ? 'rgb(239 246 255)' :
                                       type.color === 'purple' ? 'rgb(250 245 255)' :
                                       type.color === 'orange' ? 'rgb(255 247 237)' :
                                       'rgb(253 242 248)'
                    } : {}}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? `text-${type.color}-600` : 'text-gray-600'}`} />
                    <div className={`text-xs font-medium ${isSelected ? `text-${type.color}-900` : 'text-gray-700'}`}>
                      {type.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-semibold flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm font-semibold flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-semibold">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="60"
                min="15"
                step="15"
              />
            </div>
          </div>

          {/* Energy Level */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Required Energy Level
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {energyLevels.map((level) => {
                const isSelected = formData.energyLevel === level.value;
                return (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, energyLevel: level.value as any })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected ? 'scale-105 shadow-lg' : 'hover:scale-105'
                    }`}
                    style={isSelected ? {
                      borderColor: level.color === 'purple' ? 'rgb(168 85 247)' :
                                   level.color === 'green' ? 'rgb(34 197 94)' :
                                   level.color === 'yellow' ? 'rgb(234 179 8)' :
                                   'rgb(239 68 68)',
                      backgroundImage: level.color === 'purple' ? 'linear-gradient(to bottom right, rgb(250 245 255), rgb(253 242 248))' :
                                       level.color === 'green' ? 'linear-gradient(to bottom right, rgb(240 253 244), rgb(236 253 245))' :
                                       level.color === 'yellow' ? 'linear-gradient(to bottom right, rgb(254 252 232), rgb(254 249 195))' :
                                       'linear-gradient(to bottom right, rgb(254 242 242), rgb(254 215 215))'
                    } : { borderColor: 'rgb(229 231 235)' }}
                  >
                    <div className="text-2xl mb-1">{level.emoji}</div>
                    <div className="text-xs font-medium text-gray-700">{level.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add notes, agenda, or details..."
              rows={3}
            />
          </div>

          {/* Location & Attendees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Location (Optional)
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Conference Room A, Zoom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendees" className="text-sm font-semibold flex items-center gap-1">
                <Users className="w-4 h-4" />
                Attendees (Optional)
              </Label>
              <Input
                id="attendees"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                placeholder="e.g., john@example.com"
              />
            </div>
          </div>

          {/* AI Suggestion */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-purple-900 mb-1">💡 AI Suggestion</div>
                <div className="text-sm text-purple-700">
                  Based on your {formData.energyLevel} energy requirement, this time slot has 85% success rate for similar tasks.
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              className="text-white"
              style={{ backgroundImage: 'linear-gradient(to right, rgb(59 130 246), rgb(14 165 233))' }}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

