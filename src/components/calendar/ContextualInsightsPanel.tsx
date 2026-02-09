/**
 * Contextual Insights Panel
 * 
 * RESEARCH BASIS:
 * - Context-aware computing (Schilit & Theimer, 1994)
 * - Just-in-time information delivery (Nielsen, 2003)
 * - Progressive disclosure (Apple HIG, 2007)
 * 
 * SMART BEHAVIOR:
 * - Shows insights relevant to currently visible time range
 * - Updates as user scrolls through timeline
 * - Prioritizes upcoming events (next 4 hours from viewport)
 * - Energy forecast for visible day
 * - Weather for visible time period
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, AlertTriangle, Brain, Zap, Cloud, 
  TrendingUp, Clock, MapPin, Users, Sparkles,
  CloudRain, Sun, Wind
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Event } from '../../utils/event-task-types';
import { AnimatedAvatar } from '../AnimatedAvatar';

interface ContextualInsightsPanelProps {
  /** Currently visible date/time range */
  visibleStartTime: Date;
  visibleEndTime: Date;
  /** All events in timeline */
  events: Event[];
  /** Current viewing date for header */
  viewingDate: Date;
}

export function ContextualInsightsPanel({
  visibleStartTime,
  visibleEndTime,
  events,
  viewingDate,
}: ContextualInsightsPanelProps) {
  // Filter events for visible time range + next 4 hours
  const contextualEvents = useMemo(() => {
    const fourHoursLater = new Date(visibleEndTime);
    fourHoursLater.setHours(fourHoursLater.getHours() + 4);
    
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      return eventStart >= visibleStartTime && eventStart <= fourHoursLater;
    }).sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [events, visibleStartTime, visibleEndTime]);
  
  // Calculate statistics for visible period
  const stats = useMemo(() => {
    const totalMinutes = contextualEvents.reduce((sum, event) => {
      const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60);
      return sum + duration;
    }, 0);
    
    const meetings = contextualEvents.filter(e => 
      e.attendees && e.attendees.length > 0
    );
    
    const focusTime = contextualEvents.filter(e => 
      e.title.toLowerCase().includes('focus') || 
      e.title.toLowerCase().includes('deep work')
    );
    
    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      meetings: meetings.length,
      meetingHours: (meetings.reduce((sum, e) => 
        sum + (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()), 0
      ) / (1000 * 60 * 60)).toFixed(1),
      focusHours: (focusTime.reduce((sum, e) => 
        sum + (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()), 0
      ) / (1000 * 60 * 60)).toFixed(1),
      bufferWarnings: 0, // Calculate based on gaps
      fragmentation: meetings.length > 5 ? 'High' : meetings.length > 2 ? 'Medium' : 'Low',
    };
  }, [contextualEvents]);
  
  // Get upcoming events (next 4 hours from viewport)
  const upcomingEvents = contextualEvents.slice(0, 4);
  
  // Format date for header
  const formattedDate = viewingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  // Energy forecast for visible time
  const energyForecast = useMemo(() => {
    const hour = visibleStartTime.getHours();
    
    if (hour >= 9 && hour < 12) {
      return { level: 'Peak', color: 'text-emerald-400', description: 'Deep work, complex tasks' };
    } else if (hour >= 14 && hour < 17) {
      return { level: 'High', color: 'text-blue-400', description: 'Meetings, decisions' };
    } else if (hour >= 17 && hour < 21) {
      return { level: 'Medium', color: 'text-amber-400', description: 'Routine tasks' };
    } else {
      return { level: 'Low', color: 'text-gray-400', description: 'Admin, breaks' };
    }
  }, [visibleStartTime]);
  
  // Weather for visible time (mock data - would come from API)
  const weatherData = useMemo(() => {
    const hour = visibleStartTime.getHours();
    
    if (hour >= 12 && hour < 15) {
      return { 
        condition: 'Light Rain', 
        icon: CloudRain, 
        temp: '68°F',
        alert: 'Light rain expected during lunch',
        recommendation: 'Consider indoor venue or bring umbrella'
      };
    } else if (hour >= 6 && hour < 10) {
      return {
        condition: 'Partly Cloudy',
        icon: Cloud,
        temp: '66°F',
        alert: null,
        recommendation: null
      };
    } else {
      return {
        condition: 'Clear',
        icon: Sun,
        temp: '72°F',
        alert: null,
        recommendation: null
      };
    }
  }, [visibleStartTime]);
  
  return (
    <div className="flex flex-col h-full bg-[#1a1d24] border-l border-gray-800">
      {/* Header - Sticky */}
      <div className="flex-shrink-0 border-b border-gray-800 p-4 bg-[#1e2128]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Viewing</h3>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
            <Calendar className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>
        
        <p className="text-sm text-gray-400">{formattedDate}</p>
        
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <StatCard
            label="Total"
            value={`${stats.totalHours}h`}
            icon={Clock}
            color="text-blue-400"
          />
          <StatCard
            label="Meetings"
            value={`${stats.meetingHours}h`}
            icon={Users}
            color="text-purple-400"
          />
          <StatCard
            label="Focus"
            value={`${stats.focusHours}h`}
            icon={Zap}
            color="text-emerald-400"
          />
        </div>
        
        {/* Fragmentation warning */}
        {stats.fragmentation === 'High' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-400">High Fragmentation</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {stats.meetings} meetings may reduce focus time
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-6">
          {/* AI Recommendation */}
          <InsightSection
            title="AI Recommendation"
            icon={Brain}
            iconColor="text-purple-400"
          >
            <div className="text-sm text-gray-300 mb-2">
              Add buffer time after "Strategic Planning Session"
            </div>
            <Button size="sm" variant="outline" className="w-full">
              View All Suggestions
            </Button>
          </InsightSection>
          
          <Separator className="bg-gray-800" />
          
          {/* Energy Levels */}
          <InsightSection
            title="Energy Levels"
            icon={Zap}
            iconColor="text-emerald-400"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Current Energy</span>
                <Badge className={`${energyForecast.color} bg-gray-800`}>
                  {energyForecast.level}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">{energyForecast.description}</p>
              
              {/* Today's energy forecast */}
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-400">Today's Forecast</p>
                <EnergyBar time="2:00 PM" level="Medium" />
                <EnergyBar time="5:00 PM" level="Low" />
                <EnergyBar time="8:00 PM" level="Recovery" />
              </div>
            </div>
          </InsightSection>
          
          <Separator className="bg-gray-800" />
          
          {/* Upcoming Events */}
          <InsightSection
            title="Upcoming Events"
            icon={Calendar}
            iconColor="text-blue-400"
          >
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <UpcomingEventCard key={event.id} event={event} />
                ))
              ) : (
                <p className="text-sm text-gray-500">No upcoming events in this time range</p>
              )}
            </div>
          </InsightSection>
          
          <Separator className="bg-gray-800" />
          
          {/* Weather Intelligence */}
          <InsightSection
            title="Weather Intelligence"
            icon={weatherData.icon}
            iconColor="text-sky-400"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{weatherData.condition}</span>
                <span className="text-lg font-semibold text-white">{weatherData.temp}</span>
              </div>
              
              {weatherData.alert && (
                <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-400 font-medium mb-1">{weatherData.alert}</p>
                  {weatherData.recommendation && (
                    <p className="text-xs text-gray-400">{weatherData.recommendation}</p>
                  )}
                </div>
              )}
            </div>
          </InsightSection>
        </div>
      </div>
    </div>
  );
}

/** Insight section container */
function InsightSection({ 
  title, 
  icon: Icon, 
  iconColor, 
  children 
}: { 
  title: string; 
  icon: any; 
  iconColor: string; 
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      {children}
    </div>
  );
}

/** Quick stat card */
function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-2 text-center">
      <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
      <div className="text-xs font-semibold text-white">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

/** Energy bar indicator */
function EnergyBar({ time, level }: { time: string; level: string }) {
  const getColor = (level: string) => {
    if (level === 'Peak') return 'bg-emerald-500';
    if (level === 'High') return 'bg-blue-500';
    if (level === 'Medium') return 'bg-amber-500';
    if (level === 'Low') return 'bg-gray-500';
    return 'bg-purple-500';
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16">{time}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${getColor(level)} rounded-full`} style={{ width: '60%' }} />
      </div>
      <span className="text-xs text-gray-400 w-16">{level}</span>
    </div>
  );
}

/** Upcoming event card */
function UpcomingEventCard({ event }: { event: Event }) {
  const startTime = new Date(event.startTime);
  const now = new Date();
  const minutesUntil = Math.round((startTime.getTime() - now.getTime()) / (1000 * 60));
  
  const getTimeUntilText = () => {
    if (minutesUntil < 0) return 'Now';
    if (minutesUntil < 60) return `In ${minutesUntil} min`;
    const hours = Math.floor(minutesUntil / 60);
    return `In ${hours}h ${minutesUntil % 60}min`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h5 className="text-sm font-medium text-white flex-1">{event.title}</h5>
        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">
          {getTimeUntilText()}
        </Badge>
      </div>
      
      {event.location && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
          <MapPin className="w-3 h-3" />
          {event.location}
        </div>
      )}
      
      {event.attendees && event.attendees.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex -space-x-2">
            {event.attendees.slice(0, 3).map((attendee, i) => (
              <AnimatedAvatar
                key={i}
                src={attendee.avatar}
                alt={attendee.name}
                size="xs"
                status="online"
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </motion.div>
  );
}
