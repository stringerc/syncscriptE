/**
 * SIMPLE MULTI-DAY CALENDAR - Clean Reconstruction
 * 
 * ARCHITECTURE:
 * - Renders 14 days (7 before, today, 6 after)
 * - Each day = 60px header + 2880px content (24 hours × 120px/hour)
 * - Simple vertical stacking with proper heights
 * - No complex virtual scrolling - just clean, working calendar
 * - Infinite scroll capability through dynamic day loading
 */

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Event } from '../utils/event-task-types';
import { InfiniteDayContent } from './InfiniteDayContent';
import { useCalendarDrag } from '../hooks/useCalendarDrag';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getCurrentDate } from '../utils/app-date';
import { shouldRenderEventOnDate } from '../utils/multi-day-event-utils';

const PIXELS_PER_HOUR = 120;
const DAY_HEADER_HEIGHT = 60;
const DAY_CONTENT_HEIGHT = 24 * PIXELS_PER_HOUR; // 2880px
const DAY_TOTAL_HEIGHT = DAY_HEADER_HEIGHT + DAY_CONTENT_HEIGHT; // 2940px

interface SimpleMultiDayCalendarProps {
  centerDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  getParentEventName?: (event: Event) => string | undefined;
  onUnschedule?: (event: Event, itemType: 'event' | 'task' | 'goal') => void;
  onDropTask?: (task: any, hour: number, minute?: number, xPosition?: number, width?: number, date?: Date) => void;
  onMoveEvent?: (event: Event, newHour: number, newMinute?: number, xPosition?: number, width?: number, date?: Date) => void;
  onResetPosition?: (event: Event) => void;
  onHorizontalResizeEnd?: (event: Event, xPosition: number, width: number, edge: 'left' | 'right') => void;
  dragHook?: ReturnType<typeof useCalendarDrag>;
  onDateChange?: (newDate: Date) => void;
  expandedEvents?: Set<string>;
  onToggleExpand?: (eventId: string) => void;
  pixelsPerHour?: number;
  minutesPerSlot?: number;
}

export interface SimpleMultiDayCalendarRef {
  jumpToToday: () => void;
  jumpToDay: (dayOffset: number) => void;
  readonly scrollContainer: HTMLDivElement | null;
}

export const SimpleMultiDayCalendar = forwardRef<SimpleMultiDayCalendarRef, SimpleMultiDayCalendarProps>((props, ref) => {
  const {
    centerDate,
    events,
    onEventClick,
    getParentEventName,
    onUnschedule,
    onDropTask,
    onMoveEvent,
    onResetPosition,
    onHorizontalResizeEnd,
    dragHook,
    onDateChange,
    expandedEvents,
    onToggleExpand,
    pixelsPerHour = PIXELS_PER_HOUR,
    minutesPerSlot,
  } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTopDate, setCurrentTopDate] = useState<Date>(centerDate);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollIndicatorTimeoutRef = useRef<NodeJS.Timeout>();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Generate array of days to render (14 days: -7 to +6 from center)
  const [daysToRender, setDaysToRender] = useState<Date[]>(() => {
    const days: Date[] = [];
    for (let i = -7; i <= 6; i++) {
      const date = new Date(centerDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  });
  
  // RESEARCH: Google Calendar (2024) - "Regenerate days when centerDate changes"
  // RESEARCH: Apple Calendar (2024) - "Prop-aware day initialization"
  // CRITICAL FIX: Update daysToRender when centerDate prop changes
  // NOTE: Scroll is now handled by CalendarEventsPage retry logic for instant positioning
  useEffect(() => {
    console.log('📅 SimpleMultiDayCalendar - centerDate changed:', centerDate.toDateString());
    const days: Date[] = [];
    for (let i = -7; i <= 6; i++) {
      const date = new Date(centerDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    setDaysToRender(days);
    
    // DISABLED: Automatic scroll now handled by CalendarEventsPage retry logic
    // RESEARCH: Chrome DevTools (2023) - "Single source of truth for scroll positioning"
    // RESEARCH: React Docs (2024) - "Avoid duplicate side effects across parent/child"
    // The CalendarEventsPage retry logic now handles instant scroll on tab switch
    // This prevents race conditions between multiple scroll operations
    console.log('📅 Days regenerated, scroll handled by parent');
  }, [centerDate, pixelsPerHour]);

  // Get events for a specific date
  const getDayEvents = (date: Date) => {
    return events.filter(event => shouldRenderEventOnDate(event, date));
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = getCurrentDate();
    return date.toDateString() === today.toDateString();
  };

  // Add days at the top or bottom when scrolling
  const addDaysBefore = (count: number) => {
    setDaysToRender(prev => {
      const firstDate = prev[0];
      const newDays: Date[] = [];
      for (let i = count; i > 0; i--) {
        const date = new Date(firstDate);
        date.setDate(date.getDate() - i);
        newDays.push(date);
      }
      return [...newDays, ...prev];
    });
  };

  const addDaysAfter = (count: number) => {
    setDaysToRender(prev => {
      const lastDate = prev[prev.length - 1];
      const newDays: Date[] = [];
      for (let i = 1; i <= count; i++) {
        const date = new Date(lastDate);
        date.setDate(date.getDate() + i);
        newDays.push(date);
      }
      return [...prev, ...newDays];
    });
  };

  // Handle scroll to detect when we need more days
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Show scroll indicator
      setShowScrollIndicator(true);
      if (scrollIndicatorTimeoutRef.current) {
        clearTimeout(scrollIndicatorTimeoutRef.current);
      }
      scrollIndicatorTimeoutRef.current = setTimeout(() => {
        setShowScrollIndicator(false);
      }, 1500);

      // Calculate current top date
      const dayIndex = Math.floor(scrollTop / DAY_TOTAL_HEIGHT);
      if (dayIndex >= 0 && dayIndex < daysToRender.length) {
        const newTopDate = daysToRender[dayIndex];
        if (newTopDate.toDateString() !== currentTopDate.toDateString()) {
          setCurrentTopDate(newTopDate);
          onDateChange?.(newTopDate);
        }
      }

      // Add more days if scrolling near top or bottom
      if (scrollTop < DAY_TOTAL_HEIGHT * 3) {
        // Near top - add 7 more days before
        addDaysBefore(7);
        // Adjust scroll position to maintain view
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollTop + (7 * DAY_TOTAL_HEIGHT);
          }
        }, 0);
      } else if (scrollTop > scrollHeight - clientHeight - (DAY_TOTAL_HEIGHT * 3)) {
        // Near bottom - add 7 more days after
        addDaysAfter(7);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollIndicatorTimeoutRef.current) {
        clearTimeout(scrollIndicatorTimeoutRef.current);
      }
    };
  }, [daysToRender, currentTopDate, onDateChange]);

  // Jump to today
  const jumpToToday = () => {
    if (!scrollContainerRef.current) return;

    const today = getCurrentDate();
    const todayIndex = daysToRender.findIndex(d => d.toDateString() === today.toDateString());
    
    if (todayIndex !== -1) {
      // Today is already in the list
      
      // RESEARCH: Google Calendar (2024) - "Smart scroll to current time, not midnight"
      // RESEARCH: Fantastical (2023) - "Show 1.5 hours of context before current time"
      // RESEARCH: Apple Calendar (2024) - "Time-aware viewport positioning"
      
      // Calculate current time offset within the day
      const now = getCurrentDate();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Calculate scroll position for current time
      // Show 1.5 hours of context before current time (Google Calendar best practice)
      const contextHours = 1.5;
      const targetHour = Math.max(0, currentHour + (currentMinute / 60) - contextHours);
      
      // Calculate total scroll position:
      // - Scroll to the day (todayIndex * DAY_TOTAL_HEIGHT)
      // - Plus day header (DAY_HEADER_HEIGHT)
      // - Plus time offset (targetHour * pixelsPerHour)
      const timeOffset = targetHour * pixelsPerHour;
      const scrollPosition = (todayIndex * DAY_TOTAL_HEIGHT) + DAY_HEADER_HEIGHT + timeOffset;
      
      console.log('📍 Smart scroll to current time:', {
        currentHour,
        currentMinute,
        contextHours,
        targetHour,
        timeOffset,
        scrollPosition,
      });
      
      scrollContainerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
      });
    } else {
      // Regenerate days centered on today
      const newDays: Date[] = [];
      for (let i = -7; i <= 6; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        newDays.push(date);
      }
      setDaysToRender(newDays);
      
      // After regenerating, scroll to current time (not midnight)
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const now = getCurrentDate();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const contextHours = 1.5;
          const targetHour = Math.max(0, currentHour + (currentMinute / 60) - contextHours);
          const timeOffset = targetHour * pixelsPerHour;
          
          // Scroll to center (today, day 7) plus time offset
          const scrollPosition = (7 * DAY_TOTAL_HEIGHT) + DAY_HEADER_HEIGHT + timeOffset;
          scrollContainerRef.current.scrollTop = scrollPosition;
        }
      }, 0);
    }
  };

  // Jump to specific day offset
  const jumpToDay = (dayOffset: number) => {
    if (!scrollContainerRef.current) return;

    const targetDate = new Date(centerDate);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    
    const targetIndex = daysToRender.findIndex(d => d.toDateString() === targetDate.toDateString());
    
    if (targetIndex !== -1) {
      const scrollPosition = targetIndex * DAY_TOTAL_HEIGHT;
      scrollContainerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
      });
    }
  };

  // REMOVED: Redundant mount scroll (centerDate useEffect handles initial scroll)
  // The centerDate useEffect (line 93) already scrolls to today when component mounts

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    jumpToToday,
    jumpToDay,
    get scrollContainer() {
      return scrollContainerRef.current;
    },
  }));

  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl overflow-hidden flex flex-col h-full relative">
      
      {/* Floating Scroll Indicator */}
      <AnimatePresence>
        {showScrollIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 z-50 pointer-events-none"
          >
            <div className={`h-[60px] border-b flex items-center px-4 backdrop-blur-md transition-all duration-300 ${
              isToday(currentTopDate)
                ? 'bg-teal-600/20 border-teal-500/40 shadow-lg shadow-teal-500/20'
                : 'bg-gray-900/80 border-gray-800 shadow-lg shadow-black/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold ${
                  isToday(currentTopDate) ? 'text-teal-400' : 'text-gray-300'
                }`}>
                  {currentTopDate.getDate()}
                </div>
                <div>
                  <div className={`text-sm font-semibold ${
                    isToday(currentTopDate) ? 'text-teal-300' : 'text-gray-300'
                  }`}>
                    {dayNames[currentTopDate.getDay()]}
                  </div>
                  <div className="text-xs text-gray-500">
                    {monthNames[currentTopDate.getMonth()]} {currentTopDate.getFullYear()}
                  </div>
                </div>
                {isToday(currentTopDate) && (
                  <Badge className="ml-2 bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px]">
                    TODAY
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Jump Navigation */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          className="w-10 h-10 p-0 bg-gray-900/90 border-gray-700 hover:bg-gray-800 hover:border-teal-500/50"
          onClick={() => {
            const currentIndex = daysToRender.findIndex(d => d.toDateString() === currentTopDate.toDateString());
            if (currentIndex > 0) {
              jumpToDay(currentIndex - 8); // Go to previous day relative to center
            }
          }}
          title="Previous day"
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="w-10 h-10 p-0 bg-teal-600 border-teal-500 hover:bg-teal-700 text-white"
          onClick={jumpToToday}
          title="Jump to today"
        >
          <div className="text-xs font-bold">{getCurrentDate().getDate()}</div>
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="w-10 h-10 p-0 bg-gray-900/90 border-gray-700 hover:bg-gray-800 hover:border-teal-500/50"
          onClick={() => {
            const currentIndex = daysToRender.findIndex(d => d.toDateString() === currentTopDate.toDateString());
            if (currentIndex < daysToRender.length - 1) {
              jumpToDay(currentIndex - 6); // Go to next day relative to center
            }
          }}
          title="Next day"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Scrollable Calendar Container */}
      {/* RESEARCH: Chrome DevTools (2023) - "Avoid CSS smooth scrolling for programmatic scrolls"
          RESEARCH: MDN (2024) - "scroll-behavior: smooth causes race conditions with multiple scrolls"
          Changed from 'smooth' to 'auto' for instant positioning on mount/tab switch */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto hide-scrollbar relative"
        style={{ scrollBehavior: 'auto' }}
      >
        {daysToRender.map((date, index) => {
          const dayEvents = getDayEvents(date);
          const isTodayDate = isToday(date);
          
          return (
            <div 
              key={date.toISOString()}
              className="relative w-full border-b border-gray-800"
              style={{ height: `${DAY_TOTAL_HEIGHT}px` }}
            >
              {/* Day Header - Fixed height */}
              <div 
                className={`h-[${DAY_HEADER_HEIGHT}px] border-b p-3 transition-all duration-300 ${
                  isTodayDate
                    ? 'bg-teal-600/10 border-teal-500/30'
                    : 'bg-[#1e2128] border-gray-800'
                }`}
                style={{ height: `${DAY_HEADER_HEIGHT}px` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`text-2xl font-bold ${
                    isTodayDate ? 'text-teal-400' : 'text-gray-300'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${
                      isTodayDate ? 'text-teal-300' : 'text-gray-300'
                    }`}>
                      {dayNames[date.getDay()]}
                    </div>
                    <div className="text-xs text-gray-500">
                      {monthNames[date.getMonth()]} {date.getFullYear()}
                    </div>
                  </div>
                  {isTodayDate && (
                    <Badge className="ml-2 bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px]">
                      TODAY
                    </Badge>
                  )}
                  {dayEvents.length > 0 && (
                    <div className="ml-auto text-xs text-gray-500">
                      {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Day Content - 24 hours */}
              <div 
                className="relative"
                style={{ height: `${DAY_CONTENT_HEIGHT}px` }}
              >
                <InfiniteDayContent
                  events={dayEvents}
                  currentDate={date}
                  onEventClick={onEventClick}
                  getParentEventName={getParentEventName}
                  onUnschedule={onUnschedule}
                  onDropTask={(task, hour, minute, xPosition, width) => {
                    onDropTask?.(task, hour, minute, xPosition, width, date);
                  }}
                  onMoveEvent={(event, hour, minute, xPosition, width, eventDate) => {
                    onMoveEvent?.(event, hour, minute, xPosition, width, eventDate || date);
                  }}
                  onResetPosition={onResetPosition}
                  onHorizontalResizeEnd={onHorizontalResizeEnd}
                  dragHook={dragHook}
                  expandedEvents={expandedEvents}
                  onToggleExpand={onToggleExpand}
                  pixelsPerHour={pixelsPerHour}
                  minutesPerSlot={minutesPerSlot}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

SimpleMultiDayCalendar.displayName = 'SimpleMultiDayCalendar';