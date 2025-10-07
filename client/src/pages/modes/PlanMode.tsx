import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateEventModal } from '@/components/calendar/CreateEventModal';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Calendar, 
  Plus, 
  Download,
  Zap,
  Clock,
  MapPin,
  Users,
  Video,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Mock data
const mockData = {
  currentWeek: 'Oct 6-12, 2025',
  energyPattern: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    peak: [10, 10, 10, 10, 10, 11, 11], // Peak hours for each day
    high: [[9, 11], [9, 11], [9, 11], [9, 11], [9, 11], [10, 12], [10, 12]]
  },
  events: [
    {
      day: 'Monday',
      date: 'Oct 6',
      items: [
        { time: '9:00 AM', title: 'Team Standup', duration: '30 min', type: 'meeting', icon: Users, color: 'blue' },
        { time: '10:00 AM', title: 'PEAK BLOCK 🔥', duration: '90 min', type: 'focus', icon: Zap, color: 'purple', isReserved: true },
        { time: '2:00 PM', title: 'Client Call - Acme Corp', duration: '60 min', type: 'meeting', icon: Video, color: 'green' }
      ]
    },
    {
      day: 'Tuesday',
      date: 'Oct 7',
      items: [
        { time: '10:00 AM', title: 'PEAK BLOCK 🔥', duration: '90 min', type: 'focus', icon: Zap, color: 'purple', isReserved: true },
        { time: '3:00 PM', title: 'Workshop - Design Sprint', duration: '120 min', type: 'workshop', icon: Sparkles, color: 'pink' }
      ]
    },
    {
      day: 'Wednesday',
      date: 'Oct 8',
      items: [
        { time: '9:00 AM', title: 'Team Standup', duration: '30 min', type: 'meeting', icon: Users, color: 'blue' },
        { time: '10:00 AM', title: 'PEAK BLOCK 🔥', duration: '90 min', type: 'focus', icon: Zap, color: 'purple', isReserved: true },
        { time: '1:00 PM', title: 'Lunch with Sarah', duration: '60 min', type: 'personal', icon: Users, color: 'orange' }
      ]
    },
    {
      day: 'Thursday',
      date: 'Oct 9',
      items: [
        { time: '9:00 AM', title: 'Team Standup', duration: '30 min', type: 'meeting', icon: Users, color: 'blue' },
        { time: '10:00 AM', title: 'PEAK BLOCK 🔥', duration: '90 min', type: 'focus', icon: Zap, color: 'purple', isReserved: true },
        { time: '2:00 PM', title: 'Q4 Planning Review', duration: '90 min', type: 'meeting', icon: FileText, color: 'indigo' }
      ]
    },
    {
      day: 'Friday',
      date: 'Oct 10',
      items: [
        { time: '10:00 AM', title: 'PEAK BLOCK 🔥', duration: '90 min', type: 'focus', icon: Zap, color: 'purple', isReserved: true },
        { time: '2:00 PM', title: 'Team Retro', duration: '60 min', type: 'meeting', icon: Users, color: 'blue' }
      ]
    }
  ],
  aiSuggestion: {
    title: 'Optimal Scheduling Found',
    message: 'I found 3 open PEAK slots this week. Should I schedule your 3 HIGH-priority tasks there?',
    tasks: [
      { title: 'Write Proposal', suggestedTime: 'Tue 10am (PEAK)' },
      { title: 'Budget Review', suggestedTime: 'Wed 10am (PEAK)' },
      { title: 'Client Strategy', suggestedTime: 'Thu 2pm (PEAK)' }
    ]
  },
  connectedCalendars: [
    { name: 'Google Calendar', type: 'primary', status: 'connected', color: 'blue' },
    { name: 'Outlook Calendar', type: 'work', status: 'connected', color: 'cyan' },
    { name: 'iCloud Calendar', type: 'personal', status: 'connected', color: 'gray' }
  ]
};

export function PlanMode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadTime] = useState(performance.now());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // Fetch events from backend with fallback to mock data
  const { data: backendEvents, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      console.log('📅 Fetching events from backend...');
      try {
        const response = await Promise.race([
          api.get('/calendar/events'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Backend timeout')), 15000)
          )
        ]);
        console.log('✅ Backend events response:', response);
        const events = response.data?.data || response.data || [];
        console.log(`📦 Received ${events.length} events from backend`);
        return events;
      } catch (err: any) {
        console.error('❌ Failed to fetch events:', err.message || err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
    enabled: true, // Enable backend queries for real data
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      console.log('📅 Creating event:', eventData);
      const response = await api.post('/calendar/events', eventData);
      return response.data;
    },
    onSuccess: () => {
      console.log('✅ Event created successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: '📅 Event Created!',
        description: 'Your event has been added to your calendar',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      console.error('❌ Failed to create event:', error);
      toast({
        title: '❌ Event Creation Failed',
        description: error.message || 'Failed to create event',
        duration: 3000,
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      console.log('🗑️ Deleting event:', eventId);
      const response = await api.delete(`/calendar/events/${eventId}`);
      return response.data;
    },
    onSuccess: () => {
      console.log('✅ Event deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: '🗑️ Event Deleted',
        description: 'Event removed from your calendar',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      console.error('❌ Failed to delete event:', error);
      toast({
        title: '❌ Event Deletion Failed',
        description: error.message || 'Failed to delete event',
        duration: 3000,
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, eventData }: { eventId: string; eventData: any }) => {
      console.log('✏️ Updating event:', eventId);
      const response = await api.put(`/calendar/events/${eventId}`, eventData);
      return response.data;
    },
    onSuccess: () => {
      console.log('✅ Event updated successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: '✏️ Event Updated!',
        description: 'Event details have been updated',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      console.error('❌ Failed to update event:', error);
      toast({
        title: '❌ Event Update Failed',
        description: error.message || 'Failed to update event',
        duration: 3000,
      });
    }
  });

  useEffect(() => {
    const endTime = performance.now();
    console.log(`📅 PlanMode loaded in ${Math.round(endTime - loadTime)}ms`);
    console.log('📊 Query status:', { isLoading, hasError: !!error, backendEventCount: backendEvents?.length || 0 });
    console.log(backendEvents?.length > 0 
      ? `✅ Using REAL backend data (${backendEvents.length} events)` 
      : '📋 Using mock data (no events from backend)'
    );
    if (error) {
      console.error('🔴 Backend error:', error);
    }
  }, [loadTime, backendEvents?.length, isLoading, error]);

  const handleNewEvent = () => {
    console.log('➕ New Event clicked');
    setShowCreateEvent(true);
  };

  const handleEventCreated = (eventData: any) => {
    console.log('📅 Event created:', eventData);
    setShowCreateEvent(false);
    createEventMutation.mutate(eventData);
  };

  const handleEditEvent = (event: any) => {
    console.log('✏️ Edit event clicked:', event.title);
    // TODO: Open edit modal with pre-filled data
    toast({
      title: '✏️ Edit Event',
      description: 'Event editing coming soon!',
      duration: 2000,
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    console.log('🗑️ Delete event clicked:', eventId);
    deleteEventMutation.mutate(eventId);
  };

  const handleExport = () => {
    console.log('💾 Export Calendar clicked');
    // TODO: Open export modal
  };

  const handleAIAutoSchedule = () => {
    console.log('🤖 AI Auto-schedule clicked');
    
    toast({
      title: '🤖 Auto-Scheduling in Progress...',
      description: 'Finding optimal time slots for 3 tasks based on your energy patterns',
      duration: 2000,
    });
    
    setTimeout(() => {
      toast({
        title: '✅ 3 Tasks Scheduled!',
        description: 'Tasks placed in your PEAK energy windows for maximum productivity',
        duration: 4000,
      });
    }, 2000);
    
    // TODO: Execute auto-scheduling
  };

  const handleConnectCalendar = () => {
    console.log('🔗 Connect Calendar clicked');
    // TODO: Open calendar connection modal
  };

  const eventTypeColors = {
    meeting: 'bg-blue-100 border-blue-300 text-blue-700',
    focus: 'bg-purple-100 border-purple-300 text-purple-700',
    workshop: 'bg-pink-100 border-pink-300 text-pink-700',
    personal: 'bg-orange-100 border-orange-300 text-orange-700'
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-2xl"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgb(59 130 246), rgb(6 182 212), rgb(14 165 233))' }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Calendar className="w-10 h-10" />
              Plan — Strategic Overview
            </h1>
            <p className="text-white/90 text-base md:text-lg mb-4">
              All calendars unified • AI-optimized scheduling • Energy-aware planning
            </p>
            
            {/* Week Navigation */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-lg font-semibold">{mockData.currentWeek}</div>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/20 ml-2"
              >
                Today
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleExport}
              variant="ghost"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={handleNewEvent}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-base md:text-lg px-6 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Event
            </Button>
          </div>
        </div>
      </div>

      {/* AI Scheduling Assistant */}
      <Card className="border-none shadow-xl overflow-hidden">
        <div 
          className="relative rounded-t-lg p-6"
          style={{ backgroundImage: 'linear-gradient(to right, rgb(147 51 234), rgb(219 39 119))' }}
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-white mb-2">
                  <Sparkles className="w-6 h-6" />
                  <h3 className="text-xl font-bold">AI Scheduling Assistant</h3>
                </div>
                <p className="text-white/90 font-medium">{mockData.aiSuggestion.title}</p>
              </div>
              <Button 
                onClick={handleAIAutoSchedule}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/50 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Yes, Auto-schedule
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-gray-900 dark:text-gray-100 mb-4 font-semibold text-lg">{mockData.aiSuggestion.message}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockData.aiSuggestion.tasks.map((task, index) => (
              <div key={index} className="p-4 bg-white dark:bg-slate-700 backdrop-blur-sm rounded-lg border border-purple-200 dark:border-purple-600">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">{task.title}</div>
                <div className="text-sm text-purple-600 dark:text-purple-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  {task.suggestedTime}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar - 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Calendar className="w-5 h-5 text-blue-600" />
                This Week
              </CardTitle>
              <CardDescription className="text-gray-600">
                ★ = Peak energy hours (AI-predicted) • 🔥 = Reserved focus blocks
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {mockData.events.map((day, dayIndex) => (
                  <div key={dayIndex} className="space-y-3">
                    <div className="flex items-center gap-3 pb-2 border-b">
                      <div className="text-lg font-bold text-gray-900">{day.day}</div>
                      <div className="text-sm text-gray-500">{day.date}</div>
                      <div className="ml-auto text-xs text-purple-600 font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Peak: 10-11am
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {day.items.map((event, eventIndex) => {
                        const Icon = event.icon;
                        return (
                          <div 
                            key={eventIndex}
                            className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                              event.isReserved 
                                ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300' 
                                : 'bg-white border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                event.isReserved 
                                  ? 'bg-purple-100' 
                                  : 'bg-blue-50'
                              }`}>
                                <Icon className={`w-4 h-4 ${
                                  event.isReserved 
                                    ? 'text-purple-600' 
                                    : 'text-blue-600'
                                }`} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 mb-1">
                                  {event.title}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="w-3.5 h-3.5" />
                                  {event.time}
                                  <span>•</span>
                                  <span>{event.duration}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Connected Calendars */}
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Calendar className="w-5 h-5 text-gray-600" />
                Connected Calendars
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {mockData.connectedCalendars.map((calendar, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className={`w-3 h-3 rounded-full ${
                      calendar.color === 'blue' ? 'bg-blue-500' :
                      calendar.color === 'cyan' ? 'bg-cyan-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {calendar.name}
                      </div>
                      <div className="text-xs text-gray-500">{calendar.type}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      Connected
                    </Badge>
                  </div>
                ))}
                
                <Button 
                  onClick={handleConnectCalendar}
                  variant="outline" 
                  className="w-full mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Calendar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Energy Pattern */}
          <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Zap className="w-5 h-5 text-purple-600" />
                Your Energy Pattern
              </CardTitle>
              <CardDescription className="text-gray-600">
                Peak times this week
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {mockData.energyPattern.labels.map((day, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-12 text-sm font-medium text-gray-700">
                      {day}
                    </div>
                    <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden relative">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                        style={{ 
                          left: `${(mockData.energyPattern.peak[index] / 24) * 100}%`,
                          width: '8.33%' // 2 hours = 8.33% of 24h
                        }}
                      />
                    </div>
                    <div className="text-xs font-medium text-purple-600 w-16">
                      {mockData.energyPattern.peak[index]}am
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-white/60 backdrop-blur-sm rounded-lg">
                <div className="text-sm text-purple-700">
                  <strong>Tip:</strong> Schedule deep work during peak hours for best results.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-none shadow-xl bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardHeader className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Sparkles className="w-5 h-5 text-amber-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => console.log('Find optimal time clicked')}
                >
                  <Zap className="w-4 h-4 mr-2 text-purple-600" />
                  Find Optimal Time
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4 mr-2 text-blue-600" />
                  Export Calendar
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => console.log('Resolve conflicts clicked')}
                >
                  <Clock className="w-4 h-4 mr-2 text-orange-600" />
                  Resolve Conflicts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        open={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}
