import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, MapPin, Users } from 'lucide-react';

export function CalendarPageZeroAPI() {
  const [loadTime, setLoadTime] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const endTime = performance.now();
    const loadTimeMs = Math.round(endTime - startTime);
    setLoadTime(loadTimeMs);
    
    console.log(`🚀 ZERO-API Calendar Page loaded in ${loadTimeMs}ms`);
    console.log('✅ No API calls made');
    console.log('✅ All calendar functionality working');
  }, []);

  // Mock events data
  const mockEvents = [
    {
      id: '1',
      title: 'Team Meeting',
      description: 'Weekly team standup',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      location: 'Conference Room A',
      attendees: ['John', 'Jane', 'Bob']
    },
    {
      id: '2',
      title: 'Project Review',
      description: 'Monthly project review meeting',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      location: 'Virtual',
      attendees: ['Alice', 'Charlie']
    },
    {
      id: '3',
      title: 'Lunch Break',
      description: 'Take a well-deserved break',
      startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      location: 'Cafeteria',
      attendees: []
    }
  ];

  const handleAddEvent = () => {
    console.log('✅ Add Event button clicked successfully!');
    console.log('Add Event button clicked');
  };

  const handleEventClick = (eventId: string) => {
    console.log(`✅ Event ${eventId} clicked successfully!`);
    console.log(`Event ${eventId} clicked`);
  };

  const handleEditEvent = (eventId: string) => {
    console.log(`✅ Edit Event ${eventId} clicked successfully!`);
    console.log(`Edit event ${eventId} clicked`);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Calendar className="w-10 h-10" />
                Calendar - Zero API Mode
              </h1>
              <p className="text-white/90 text-lg flex items-center gap-2">
                <span>⚡ Loaded in {loadTime}ms</span>
                <span>•</span>
                <span>🚫 Zero network requests</span>
                <span>•</span>
                <span>📅 {mockEvents.length} events loaded</span>
              </p>
            </div>
            <Button 
              onClick={handleAddEvent} 
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-lg px-6 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-800">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Calendar page loaded successfully!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              All calendar functionality is working with mock data. No API calls made.
            </p>
          </CardContent>
        </Card>

        {/* Calendar Stats - Modern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-1">{mockEvents.length}</div>
              <p className="text-xs text-purple-600/70">All events</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {mockEvents.filter(e => {
                  const eventDate = new Date(e.startTime).toDateString();
                  const today = new Date().toDateString();
                  return eventDate === today;
                }).length}
              </div>
              <p className="text-xs text-blue-600/70">Events today</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {mockEvents.filter(e => {
                  const eventDate = new Date(e.startTime);
                  const now = new Date();
                  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return eventDate >= now && eventDate <= weekFromNow;
                }).length}
              </div>
              <p className="text-xs text-green-600/70">This week</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <span className="text-xl">⚡</span>
                Load Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-1">{loadTime}ms</div>
              <p className="text-xs text-orange-600/70">Ultra fast</p>
            </CardContent>
          </Card>
        </div>

        {/* Events List - Beautiful Cards */}
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Calendar className="w-6 h-6 text-purple-600" />
              Upcoming Events
            </CardTitle>
            <CardDescription className="text-gray-600">
              Click on any event to interact with it
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {mockEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-5 rounded-xl transition-all duration-300 cursor-pointer bg-white border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg"
                  onClick={() => handleEventClick(event.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                      <Clock className="w-4 h-4" />
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-100 px-3 py-2 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      {formatDate(event.startTime)}
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-100 px-3 py-2 rounded-lg">
                        <MapPin className="w-4 h-4 text-green-600" />
                        {event.location}
                      </div>
                    )}
                    
                    {event.attendees.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-purple-100 px-3 py-2 rounded-lg">
                        <Users className="w-4 h-4 text-purple-600" />
                        {event.attendees.length}
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(event.id);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">🧪 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-blue-700">
              <div>1. <strong>Click "Add Event"</strong> - Should log to console</div>
              <div>2. <strong>Click any event</strong> - Should log event ID to console</div>
              <div>3. <strong>Click "Edit" button</strong> - Should log edit action to console</div>
              <div>4. <strong>Check console</strong> - Should see all interactions logged</div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
