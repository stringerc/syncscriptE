import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Clock, MapPin, Users, Zap, Video, AlertTriangle, Brain, MoreVertical,
  Edit, Trash2, Copy, Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { DashboardLayout } from '../layout/DashboardLayout';
import { getPageInsights } from '../../utils/insights-config';
import { AnimatedAvatar } from '../AnimatedAvatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { CURRENT_USER } from '../../utils/user-constants';

interface CalendarEvent {
  id: number;
  title: string;
  day: number;
  hour: number;
  duration: number;
  color: string;
  type: 'meeting' | 'focus' | 'deadline' | 'break';
  location?: string;
  collaborators?: {
    name: string;
    image: string;
    fallback: string;
    progress: number;
    animationType: 'glow' | 'pulse' | 'heartbeat' | 'bounce' | 'wiggle' | 'shake' | 'spin';
  }[];
}

export function CalendarEventsPage() {
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 30)); // Dec 30, 2024 (Monday)

  const aiInsightsContent = getPageInsights('/calendar');

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'day') {
      newDate.setDate(newDate.getDate() - 1);
      toast.info('Previous day');
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
      toast.info('Previous week');
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
      toast.info('Previous month');
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + 1);
      toast.info('Next day');
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
      toast.info('Next week');
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
      toast.info('Next month');
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2024, 11, 30)); // Dec 30, 2024
    toast.success('Jumped to today');
  };

  const getHeaderText = () => {
    if (currentView === 'day') {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric' 
      });
    } else if (currentView === 'week') {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  return (
    <DashboardLayout aiInsightsContent={aiInsightsContent}>
      <motion.div 
        className="flex-1 overflow-auto hide-scrollbar p-6 flex flex-col gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white mb-2">Calendar & Events</h1>
            <p className="text-gray-400">Energy-aware scheduling with weather and route intelligence</p>
          </div>
          <Button 
            className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 transition-all"
            onClick={() => toast.success('New Event', { description: 'Event creation dialog will open here' })}
          >
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <h2 className="text-xl text-white">
              {getHeaderText()}
            </h2>
          </div>

          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Calendar View */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl overflow-hidden">
          {currentView === 'day' && <DayCalendar currentDate={currentDate} />}
          {currentView === 'week' && <WeekCalendar currentDate={currentDate} />}
          {currentView === 'month' && <MonthCalendar currentDate={currentDate} />}
        </div>

        {/* Sidebar Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <UpcomingEvents />
          <WeatherPanel />
          <EnergyPanel />
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

function DayCalendar({ currentDate }: { currentDate: Date }) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 10 PM

  const events: CalendarEvent[] = [
    { 
      id: 1, 
      title: 'Morning Team Standup', 
      day: 0, 
      hour: 9, 
      duration: 0.5, 
      color: 'bg-blue-600',
      type: 'meeting',
      location: 'Zoom',
      collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, progress: CURRENT_USER.energyLevel, animationType: 'glow' },
      ],
    },
    { 
      id: 2, 
      title: 'Deep Work: Feature Development', 
      day: 0, 
      hour: 10, 
      duration: 2, 
      color: 'bg-purple-600',
      type: 'focus',
      collaborators: [],
    },
    { 
      id: 3, 
      title: 'Client Presentation Prep', 
      day: 0, 
      hour: 14, 
      duration: 1.5, 
      color: 'bg-teal-600',
      type: 'meeting',
      location: 'Conference Room A',
      collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, progress: CURRENT_USER.energyLevel, animationType: 'glow' },
      ],
    },
    { 
      id: 4, 
      title: 'Team Retrospective', 
      day: 0, 
      hour: 16, 
      duration: 1, 
      color: 'bg-orange-600',
      type: 'meeting',
      location: 'Zoom',
      collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, progress: CURRENT_USER.energyLevel, animationType: 'glow' },
      ],
    },
  ];

  return (
    <div className="overflow-auto">
      <div className="min-w-[600px]">
        {/* Time slots */}
        {hours.map((hour) => {
          const hourEvents = events.filter(e => e.hour === hour);
          return (
            <div key={hour} className="grid grid-cols-[100px_1fr] border-b border-gray-800/50">
              <div className="p-4 text-sm text-gray-500 border-r border-gray-800/50">
                {hour % 12 || 12}:00 {hour >= 12 ? 'PM' : 'AM'}
              </div>
              <div className="p-2 min-h-[80px] relative">
                {hourEvents.map(event => (
                  <EventCard key={event.id} event={event} viewType="day" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekCalendar({ currentDate }: { currentDate: Date }) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 9 PM
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const events: CalendarEvent[] = [
    { 
      id: 1, 
      title: 'Team Standup', 
      day: 0, 
      hour: 9, 
      duration: 0.5, 
      color: 'bg-blue-600',
      type: 'meeting',
      collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, progress: CURRENT_USER.energyLevel, animationType: 'glow' },
      ],
    },
    { 
      id: 2, 
      title: 'Client Meeting', 
      day: 1, 
      hour: 14, 
      duration: 1, 
      color: 'bg-teal-600',
      type: 'meeting',
      collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, progress: CURRENT_USER.energyLevel, animationType: 'glow' },
      ],
    },
    { 
      id: 3, 
      title: 'Deep Work Block', 
      day: 2, 
      hour: 10, 
      duration: 2, 
      color: 'bg-purple-600',
      type: 'focus',
      collaborators: [],
    },
    { 
      id: 4, 
      title: 'Product Review', 
      day: 3, 
      hour: 15, 
      duration: 1, 
      color: 'bg-orange-600',
      type: 'meeting',
      collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, progress: CURRENT_USER.energyLevel, animationType: 'glow' },
      ],
    },
    { 
      id: 5, 
      title: '1:1 with Manager', 
      day: 4, 
      hour: 11, 
      duration: 0.5, 
      color: 'bg-green-600',
      type: 'meeting',
      collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, progress: CURRENT_USER.energyLevel, animationType: 'glow' },
      ],
    },
  ];

  return (
    <div className="overflow-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-gray-800">
          <div className="p-3" />
          {weekDays.map((day, i) => {
            const dayDate = new Date(currentDate);
            dayDate.setDate(currentDate.getDate() + i);
            return (
              <div key={day} className="p-3 text-center border-l border-gray-800">
                <div className="text-sm text-gray-400">{day}</div>
                <div className="text-lg text-white">{dayDate.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-gray-800/50">
            <div className="p-3 text-sm text-gray-500">
              {hour % 12 || 12}:00 {hour >= 12 ? 'PM' : 'AM'}
            </div>
            {weekDays.map((day, dayIndex) => {
              const dayEvents = events.filter(e => e.day === dayIndex && e.hour === hour);
              return (
                <div key={day} className="p-2 border-l border-gray-800/50 min-h-[60px] relative">
                  {dayEvents.map(event => (
                    <EventCard key={event.id} event={event} viewType="week" />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthCalendar({ currentDate }: { currentDate: Date }) {
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
  const daysInMonth = lastDay.getDate();
  
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Sample events for month view
  const monthEvents: { [key: number]: CalendarEvent[] } = {
    5: [
      { id: 1, title: 'Team Meeting', day: 5, hour: 10, duration: 1, color: 'bg-blue-600', type: 'meeting', collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, progress: CURRENT_USER.energyLevel, animationType: 'glow' },
      ]},
    ],
    12: [
      { id: 2, title: 'Client Presentation', day: 12, hour: 14, duration: 2, color: 'bg-teal-600', type: 'meeting', collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, progress: CURRENT_USER.energyLevel, animationType: 'glow' },
      ]},
      { id: 3, title: 'Workshop', day: 12, hour: 16, duration: 1, color: 'bg-purple-600', type: 'focus', collaborators: [] },
    ],
    20: [
      { id: 4, title: 'Project Deadline', day: 20, hour: 17, duration: 0, color: 'bg-red-600', type: 'deadline', collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, progress: CURRENT_USER.energyLevel, animationType: 'glow' },
      ]},
    ],
    30: [
      { id: 5, title: 'Team Standup', day: 30, hour: 9, duration: 0.5, color: 'bg-blue-600', type: 'meeting', collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, progress: CURRENT_USER.energyLevel, animationType: 'glow' },
      ]},
      { id: 6, title: 'Deep Work', day: 30, hour: 10, duration: 2, color: 'bg-purple-600', type: 'focus', collaborators: [] },
    ],
  };

  // Create calendar grid
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="min-h-[120px] p-2 border-b border-r border-gray-800/50 bg-gray-900/30" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === 30 && currentDate.getMonth() === 11; // Dec 30
    const dayEvents = monthEvents[day] || [];
    
    calendarDays.push(
      <div 
        key={day} 
        className={`min-h-[120px] p-2 border-b border-r border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
          isToday ? 'bg-teal-600/5 border-teal-600/30' : ''
        }`}
      >
        <div className={`text-sm mb-2 ${isToday ? 'text-teal-400 font-semibold' : 'text-gray-400'}`}>
          {day}
        </div>
        <div className="space-y-1">
          {dayEvents.slice(0, 3).map(event => (
            <div
              key={event.id}
              className={`${event.color} text-white text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}
              onClick={() => toast.info(event.title, { description: `View event details` })}
            >
              <span className="truncate flex-1">{event.title}</span>
              {event.collaborators && event.collaborators.length > 0 && (
                <div className="flex -space-x-1.5 shrink-0">
                  {event.collaborators.slice(0, 2).map((collab, idx) => (
                    <div
                      key={idx}
                      className="w-4 h-4 rounded-full border border-gray-900 overflow-hidden"
                      style={{ zIndex: event.collaborators!.length - idx }}
                    >
                      <img src={collab.image} alt={collab.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {event.collaborators.length > 2 && (
                    <div className="w-4 h-4 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-[8px]">
                      +{event.collaborators.length - 2}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <div className="text-xs text-gray-500 px-2">
              +{dayEvents.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-gray-800">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center border-r border-gray-800 text-sm text-gray-400">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays}
        </div>
      </div>
    </div>
  );
}

interface EventCardProps {
  event: CalendarEvent;
  viewType: 'day' | 'week' | 'month';
}

function EventCard({ event, viewType }: EventCardProps) {
  const isCompact = viewType === 'week';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div
          className={`${event.color} text-white rounded p-2 cursor-pointer hover:opacity-90 transition-opacity mb-1`}
          style={{ height: isCompact ? `${event.duration * 50}px` : 'auto' }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs mb-1 truncate">{event.title}</div>
              {!isCompact && event.location && (
                <div className="flex items-center gap-1 text-xs opacity-90 mb-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              {!isCompact && event.collaborators && event.collaborators.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex -space-x-2">
                    {event.collaborators.slice(0, 3).map((collaborator, idx) => (
                      <AnimatedAvatar
                        key={idx}
                        name={collaborator.name}
                        image={collaborator.image}
                        fallback={collaborator.fallback}
                        size={24}
                        animationType={collaborator.animationType}
                        progress={collaborator.progress}
                        className="ring-2 ring-white/20"
                      />
                    ))}
                    {event.collaborators.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-900/80 border-2 border-white/20 flex items-center justify-center text-[10px] font-medium">
                        +{event.collaborators.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {isCompact && event.collaborators && event.collaborators.length > 0 && (
              <div className="shrink-0">
                <Users className="w-3 h-3 opacity-75" />
              </div>
            )}
          </div>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-[#1e2128] border-gray-700 w-80">
        <div className="p-3 border-b border-gray-700">
          <h4 className="text-white font-medium mb-2">{event.title}</h4>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <MapPin className="w-3.5 h-3.5" />
              {event.location}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            {event.duration > 0 ? `${event.duration}h duration` : 'All day'}
          </div>
        </div>
        
        {event.collaborators && event.collaborators.length > 0 && (
          <div className="p-3 border-b border-gray-700">
            <div className="text-xs text-gray-400 mb-2">Attendees ({event.collaborators.length})</div>
            <div className="space-y-2">
              {event.collaborators.map((collaborator, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <AnimatedAvatar
                    name={collaborator.name}
                    image={collaborator.image}
                    fallback={collaborator.fallback}
                    size={28}
                    animationType={collaborator.animationType}
                    progress={collaborator.progress}
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-300">{collaborator.name}</div>
                    <div className="text-xs text-gray-500">{collaborator.progress}% contribution</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="p-1">
          <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
            <Edit className="w-4 h-4 mr-2" />
            Edit Event
          </DropdownMenuItem>
          <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Event
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UpcomingEvents() {
  const events = [
    { 
      title: 'Team Standup', 
      time: '9:00 AM', 
      type: 'meeting',
      collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, animationType: 'glow' },
      ],
    },
    { 
      title: 'Client Presentation', 
      time: '2:00 PM', 
      type: 'meeting',
      collaborators: [
        { name: CURRENT_USER.name, image: CURRENT_USER.avatar, fallback: CURRENT_USER.initials, animationType: 'glow' },
      ],
    },
    { 
      title: 'Project Deadline', 
      time: '5:00 PM', 
      type: 'deadline',
      collaborators: [],
    },
  ];

  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-5">
      <h3 className="text-white mb-4 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-teal-400" />
        Upcoming Events
      </h3>
      <div className="space-y-3">
        {events.map((event, i) => (
          <div key={i} className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm">{event.title}</span>
              {event.type === 'meeting' ? (
                <Video className="w-4 h-4 text-blue-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {event.time}
              </div>
              {event.collaborators && event.collaborators.length > 0 && (
                <div className="flex -space-x-2">
                  {event.collaborators.slice(0, 3).map((collab: any, idx: number) => (
                    <div
                      key={idx}
                      className="w-5 h-5 rounded-full border border-gray-900 overflow-hidden"
                      title={collab.name}
                    >
                      <img src={collab.image} alt={collab.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeatherPanel() {
  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-5">
      <h3 className="text-white mb-4">Weather Intelligence</h3>
      <div className="space-y-4">
        <div className="p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Current Weather</span>
            <Badge className="bg-blue-500/20 text-blue-400">Clear</Badge>
          </div>
          <div className="text-2xl text-white">72°F</div>
        </div>
        <div className="text-xs text-gray-400">
          Perfect weather for outdoor meetings today
        </div>
      </div>
    </div>
  );
}

function EnergyPanel() {
  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-5">
      <h3 className="text-white mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-teal-400" />
        Energy Optimization
      </h3>
      <div className="space-y-4">
        <div className="p-3 bg-green-600/10 border border-green-600/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Current Energy</span>
            <Badge className="bg-green-500/20 text-green-400">HIGH</Badge>
          </div>
          <p className="text-xs text-gray-400">
            Perfect time for high-focus work
          </p>
        </div>
        <div className="bg-teal-600/10 border border-teal-600/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-teal-300 mb-1">Scheduling Tip</p>
              <p className="text-gray-400 text-xs">
                Move important meetings to 10:00 AM for better performance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
