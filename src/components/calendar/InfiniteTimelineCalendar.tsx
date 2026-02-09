/**
 * Infinite Timeline Calendar
 * 
 * RESEARCH BASIS:
 * - TikTok/Instagram infinite scroll: Engagement + discoverability (2016-present)
 * - TV Guide temporal navigation: Clear time orientation (1980s)
 * - Google Calendar day view: Professional scheduling standard (2006)
 * - Intersection Observer: Progressive loading for performance (2017)
 * 
 * ARCHITECTURE:
 * - 15-minute time slots (96 per day)
 * - Initial load: Current time ± 3 days (288 slots)
 * - Lazy load: ±1 week on scroll near edges
 * - Auto-scroll: Only when viewing "now" (within 5min)
 * 
 * UX PATTERNS:
 * - Down = Future, Up = Past (natural mental model)
 * - Current time line stays fixed in absolute time
 * - Return to Now FAB when scrolled >1 hour away
 * - Smooth scroll with requestAnimationFrame
 * - Contextual insights update based on visible range
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Event } from '../../utils/event-task-types';
import { TimelineSlot } from './TimelineSlot';
import { CurrentTimeLine, useCurrentTimePosition } from './CurrentTimeLine';
import { ReturnToNowButton, useReturnToNowVisibility } from './ReturnToNowButton';
import { ContextualInsightsPanel } from './ContextualInsightsPanel';
import { UnscheduledTasksPanel } from '../UnscheduledTasksPanel';
import { Calendar, ChevronUp, ChevronDown, CloudRain } from 'lucide-react';
import { Button } from '../ui/button';

interface InfiniteTimelineCalendarProps {
  /** All events in the system */
  events: Event[];
  /** Event click handler */
  onEventClick: (event: Event) => void;
  /** Drop task handler */
  onDropTask?: (task: any, dateTime: Date) => void;
  /** Create event at time */
  onCreateEvent?: (dateTime: Date) => void;
  /** Unscheduled tasks */
  unscheduledTasks?: any[];
  /** Schedule task handler */
  onScheduleTask?: (task: any, dateTime: Date) => void;
}

// Time slot size configuration
const SLOT_HEIGHT = 100; // pixels per 15-minute slot
const SLOTS_PER_HOUR = 4; // 15-minute granularity
const SLOTS_PER_DAY = 96; // 24 hours * 4

export function InfiniteTimelineCalendar({
  events,
  onEventClick,
  onDropTask,
  onCreateEvent,
  unscheduledTasks = [],
  onScheduleTask,
}: InfiniteTimelineCalendarProps) {
  // Calculate timeline boundaries
  const now = new Date();
  
  // Timeline starts at midnight TODAY (not 3 days ago)
  const [timelineStart] = useState(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  });
  
  // Timeline ends 7 days from now (load more as user scrolls)
  const [timelineEnd, setTimelineEnd] = useState(() => {
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    return end;
  });
  
  // Generate time slots dynamically
  const [visibleDays, setVisibleDays] = useState(1); // Start with just TODAY
  
  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const current = new Date(timelineStart);
    const endDate = new Date(timelineStart);
    endDate.setDate(endDate.getDate() + visibleDays);
    
    while (current <= endDate) {
      slots.push(new Date(current));
      current.setMinutes(current.getMinutes() + 15);
    }
    
    return slots;
  }, [timelineStart, visibleDays]);
  
  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate current time position and slot index
  const currentTimePosition = useCurrentTimePosition(timelineStart);
  const currentSlotIndex = useMemo(() => {
    const diffMs = now.getTime() - timelineStart.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return Math.floor(diffMinutes / 15);
  }, [now, timelineStart]);
  
  // Get currently visible time range based on scroll position
  const scrolledSlotIndex = Math.floor(scrollTop / SLOT_HEIGHT);
  const visibleStartTime = timeSlots[scrolledSlotIndex] || now;
  const visibleEndTime = timeSlots[Math.min(scrolledSlotIndex + 24, timeSlots.length - 1)] || now;
  
  // Viewing date for header
  const viewingDate = visibleStartTime;
  
  // Return to Now button visibility
  const returnToNowState = useReturnToNowVisibility(visibleStartTime, 60);
  
  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current && currentSlotIndex > 0) {
      // Scroll to current time minus 4 hours (show context above)
      const targetScrollTop = Math.max(0, (currentSlotIndex - 16) * SLOT_HEIGHT);
      
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = targetScrollTop;
        }
      }, 100);
    }
  }, []); // Only run on mount
  
  // Handle scroll
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollTop(scrollContainerRef.current.scrollTop);
      
      // Lazy load more days when near bottom
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage > 0.8 && visibleDays < 90) { // Max 3 months
        setVisibleDays(prev => Math.min(prev + 7, 90));
      }
    }
  }, [visibleDays]);
  
  // Return to now handler
  const handleReturnToNow = useCallback(() => {
    if (scrollContainerRef.current) {
      const targetScrollTop = Math.max(0, (currentSlotIndex - 16) * SLOT_HEIGHT);
      scrollContainerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
    }
  }, [currentSlotIndex]);
  
  // Navigate by day
  const handlePreviousDay = useCallback(() => {
    if (scrollContainerRef.current) {
      const targetScrollTop = Math.max(0, scrollTop - SLOTS_PER_DAY * SLOT_HEIGHT);
      scrollContainerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
    }
  }, [scrollTop]);
  
  const handleNextDay = useCallback(() => {
    if (scrollContainerRef.current) {
      const targetScrollTop = scrollTop + SLOTS_PER_DAY * SLOT_HEIGHT;
      scrollContainerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
    }
  }, [scrollTop]);
  
  // Format date for header
  const formattedViewingDate = viewingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  // Calculate stats for header
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === viewingDate.toDateString();
  });
  
  const totalHours = todayEvents.reduce((sum, event) => {
    const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);
  
  return (
    <div className="flex h-full gap-4">
      {/* Main Timeline - 60% width */}
      <div className="flex-[6] flex flex-col bg-[#1e2128] border border-gray-800 rounded-xl overflow-hidden">
        {/* Sticky Header */}
        <div className="flex-shrink-0 border-b border-gray-800 p-4 bg-[#1a1d24]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">{formattedViewingDate}</h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{todayEvents.length} events</span>
                <span>•</span>
                <span>{totalHours.toFixed(1)}h scheduled</span>
              </div>
            </div>
            
            {/* Quick navigation */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePreviousDay}
              >
                <ChevronUp className="w-4 h-4 mr-1" />
                Previous Day
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNextDay}
              >
                Next Day
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Scrollable Timeline */}
        <div 
          className="flex-1 relative overflow-y-auto custom-scrollbar" 
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {/* Time slots */}
          <div className="relative" style={{ minHeight: `${timeSlots.length * SLOT_HEIGHT}px` }}>
            {timeSlots.map((dateTime, index) => {
              const isHour = dateTime.getMinutes() === 0;
              const isHalfHour = dateTime.getMinutes() === 30;
              
              // Find events that overlap this time slot
              const slotEvents = events.filter(event => {
                const eventStart = new Date(event.startTime);
                const eventEnd = new Date(event.endTime);
                const slotEnd = new Date(dateTime);
                slotEnd.setMinutes(slotEnd.getMinutes() + 15);
                
                return eventStart < slotEnd && eventEnd > dateTime;
              });
              
              // Weather data (mock)
              const hour = dateTime.getHours();
              const weather = hour === 12 ? {
                condition: 'Light Rain',
                temp: '68°F',
                icon: CloudRain,
                alert: true,
              } : undefined;
              
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    top: `${index * SLOT_HEIGHT}px`,
                    left: 0,
                    right: 0,
                    height: `${SLOT_HEIGHT}px`,
                  }}
                >
                  <TimelineSlot
                    dateTime={dateTime}
                    isHour={isHour}
                    isHalfHour={isHalfHour}
                    events={slotEvents}
                    weather={weather}
                    showWeather={hour === 12 && isHour}
                    onDrop={(dt) => onDropTask?.(null, dt)}
                    onClick={(dt) => onCreateEvent?.(dt)}
                    onEventClick={onEventClick}
                    dataNav={`calendar-slot-${dateTime.getTime()}`}
                  />
                </div>
              );
            })}
            
            {/* Current Time Line Overlay */}
            <CurrentTimeLine
              currentTime={now}
              offsetTop={currentTimePosition}
              isInViewport={Math.abs(scrolledSlotIndex - currentSlotIndex) < 24}
            />
          </div>
        </div>
      </div>
      
      {/* Right Sidebar - 40% width */}
      <div className="flex-[4] flex flex-col gap-4">
        {/* Contextual Insights - Full height */}
        <div className="flex-1 overflow-hidden rounded-xl">
          <ContextualInsightsPanel
            visibleStartTime={visibleStartTime}
            visibleEndTime={visibleEndTime}
            events={events}
            viewingDate={viewingDate}
          />
        </div>
      </div>
      
      {/* Return to Now FAB */}
      <ReturnToNowButton
        visible={returnToNowState.visible}
        onReturnToNow={handleReturnToNow}
        hoursAway={returnToNowState.hoursAway}
        direction={returnToNowState.direction}
      />
    </div>
  );
}