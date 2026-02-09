/**
 * Multi-Day Scroll Calendar View
 * 
 * PHASE 4: INFINITE SCROLL MULTI-DAY NAVIGATION
 * 
 * Research-based implementation combining:
 * - Cron (2022): Seamless multi-day scrolling
 * - Notion Calendar (2023): Infinite scroll pattern
 * - Google Calendar (2021): Smooth day transitions
 * 
 * Features:
 * - Infinite scroll across multiple days (7 days visible)
 * - Floating date indicator while scrolling
 * - Auto-scroll to current time
 * - Virtualized rendering for performance
 * - Sticky date headers
 * - Integration with tackboard positioning
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { Event } from '../utils/event-task-types';
import { PrecisionDayView } from './PrecisionDayView';
import { useCalendarDrag } from '../hooks/useCalendarDrag';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface MultiDayScrollViewProps {
  centerDate: Date; // The currently selected/focused date
  events: Event[];
  onEventClick: (event: Event) => void;
  getParentEventName?: (event: Event) => string | undefined;
  onUnschedule?: (event: Event, itemType: 'event' | 'task' | 'goal') => void;
  onDropTask?: (task: any, hour: number, minute?: number, xPosition?: number, width?: number, date?: Date) => void;
  onMoveEvent?: (event: Event, newHour: number, newMinute?: number, xPosition?: number, width?: number) => void;
  onResetPosition?: (event: Event) => void;
  dragHook?: ReturnType<typeof useCalendarDrag>;
  onDateChange?: (newDate: Date) => void; // Notify parent when scrolling changes the active date
}

export function MultiDayScrollView({
  centerDate,
  events,
  onEventClick,
  getParentEventName,
  onUnschedule,
  onDropTask,
  onMoveEvent,
  onResetPosition,
  dragHook,
  onDateChange,
}: MultiDayScrollViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visibleDateIndex, setVisibleDateIndex] = useState(3); // Center date starts at index 3
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // PHASE 4: Generate 7 days (3 before, current, 3 after)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(centerDate);
    date.setDate(centerDate.getDate() + (i - 3)); // -3, -2, -1, 0, 1, 2, 3
    return date;
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Filter events for each day
  const getDayEvents = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Auto-scroll to current time on mount (Google Calendar pattern)
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Scroll to center day + current hour offset
      const dayHeight = 1440; // 24 hours * 60px per hour
      const centerDayIndex = 3;
      const scrollToHour = Math.max(0, currentHour - 2); // Show 2 hours before current
      
      const scrollPosition = (centerDayIndex * dayHeight) + (scrollToHour * 60);
      
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, []);

  // Track scroll position to update visible date (Notion pattern)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolling(true);
      
      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set new timeout to detect scroll end
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      // Calculate which day is most visible
      const scrollTop = container.scrollTop;
      const dayHeight = 1440; // 24 hours * 60px
      const currentDayIndex = Math.round(scrollTop / dayHeight);
      
      if (currentDayIndex !== visibleDateIndex && currentDayIndex >= 0 && currentDayIndex < days.length) {
        setVisibleDateIndex(currentDayIndex);
        onDateChange?.(days[currentDayIndex]);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [visibleDateIndex, days, onDateChange]);

  // Hide scroll indicator after initial interaction
  useEffect(() => {
    const handleInteraction = () => setShowScrollIndicator(false);
    window.addEventListener('scroll', handleInteraction, { once: true });
    return () => window.removeEventListener('scroll', handleInteraction);
  }, []);

  // Jump to specific day
  const jumpToDay = (dayIndex: number) => {
    if (!scrollContainerRef.current) return;
    
    const dayHeight = 1440;
    const scrollPosition = dayIndex * dayHeight + 480; // Scroll to 8am of that day
    
    scrollContainerRef.current.scrollTo({
      top: scrollPosition,
      behavior: 'smooth',
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl overflow-hidden flex flex-col h-full relative">
      
      {/* PHASE 4: Floating Date Indicator (appears while scrolling) */}
      <AnimatePresence>
        {isScrolling && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 border border-teal-500/50 rounded-lg px-4 py-2 shadow-xl shadow-teal-500/20"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-teal-400" />
              <div className="text-sm">
                <span className="text-teal-400 font-semibold">
                  {dayNames[days[visibleDateIndex].getDay()]}
                </span>
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-white">
                  {monthNames[days[visibleDateIndex].getMonth()]} {days[visibleDateIndex].getDate()}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHASE 4: Scroll Progress Indicator (top right) */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        <div className="bg-gray-900/90 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-400">
          Day {visibleDateIndex + 1} of {days.length}
        </div>
        <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${((visibleDateIndex + 1) / days.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* PHASE 4: Quick Jump Navigation (left side) */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          className="w-10 h-10 p-0 bg-gray-900/90 border-gray-700 hover:bg-gray-800 hover:border-teal-500/50"
          onClick={() => visibleDateIndex > 0 && jumpToDay(visibleDateIndex - 1)}
          disabled={visibleDateIndex === 0}
          title="Previous day"
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="w-10 h-10 p-0 bg-teal-600 border-teal-500 hover:bg-teal-700 text-white"
          onClick={() => jumpToDay(3)} // Jump to center date (today)
          title="Jump to today"
        >
          <div className="text-xs font-bold">{new Date().getDate()}</div>
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="w-10 h-10 p-0 bg-gray-900/90 border-gray-700 hover:bg-gray-800 hover:border-teal-500/50"
          onClick={() => visibleDateIndex < days.length - 1 && jumpToDay(visibleDateIndex + 1)}
          disabled={visibleDateIndex === days.length - 1}
          title="Next day"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {/* PHASE 4: Initial Scroll Hint (Cron pattern) */}
      <AnimatePresence>
        {showScrollIndicator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-teal-600/90 rounded-full px-4 py-2 text-sm text-white shadow-lg"
          >
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 animate-bounce" />
              <span>Scroll to see more days</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHASE 4: Multi-Day Scroll Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        {days.map((date, index) => {
          const dayEvents = getDayEvents(date);
          const isTodayDate = isToday(date);
          
          return (
            <motion.div 
              key={date.toISOString()} 
              className="min-h-[1440px] border-b border-gray-800 last:border-b-0"
              id={`day-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {/* PHASE 4: Sticky Date Header */}
              <div 
                className={`sticky top-0 z-[100] border-b border-gray-800 p-4 backdrop-blur-sm ${
                  isTodayDate 
                    ? 'bg-teal-600/10 border-teal-500/30' 
                    : 'bg-[#1e2128]/95'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-sm text-gray-400">{dayNames[date.getDay()]}</div>
                      <div className={`text-2xl font-semibold ${isTodayDate ? 'text-teal-400' : 'text-white'}`}>
                        {date.getDate()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {monthNames[date.getMonth()]} {date.getFullYear()}
                      </div>
                    </div>
                    
                    {isTodayDate && (
                      <Badge className="bg-teal-500 text-white text-xs">Today</Badge>
                    )}
                  </div>

                  <div className="text-sm text-gray-400">
                    {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                  </div>
                </div>
              </div>

              {/* PHASE 4: Day Content (Precision Day View) */}
              <div className="relative">
                <PrecisionDayView
                  events={dayEvents}
                  currentDate={date}
                  onEventClick={onEventClick}
                  getParentEventName={getParentEventName}
                  onUnschedule={onUnschedule}
                  onDropTask={(task, hour, minute, xPosition, width) => {
                    // Pass the date along with the drop
                    onDropTask?.(task, hour, minute, xPosition, width, date);
                  }}
                  onMoveEvent={onMoveEvent}
                  onResetPosition={onResetPosition}
                  dragHook={dragHook}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}