/**
 * useCalendarEvents Hook
 * 
 * Provides access to calendar events from the centralized store
 * This is a convenience hook that wraps the events context/store
 */

import { useMemo, useCallback, useState } from 'react';
import { sampleCalendarEvents } from '../data/sample-calendar-events';
import { Event } from '../utils/event-task-types';

export function useCalendarEvents() {
  // Use state to allow updates
  const [events, setEvents] = useState<Event[]>(sampleCalendarEvents);
  
  /**
   * Get events for a specific date
   */
  const getEventsForDate = useCallback((year: number, month: number, day: number): Event[] => {
    const targetDate = new Date(year, month, day);
    const targetStart = targetDate.getTime();
    const targetEnd = targetStart + 24 * 60 * 60 * 1000; // Next day
    
    return events.filter(event => {
      const eventStart = new Date(event.startTime).getTime();
      const eventEnd = new Date(event.endTime).getTime();
      
      // Check if event overlaps with this day
      return (eventStart < targetEnd && eventEnd > targetStart);
    });
  }, [events]);
  
  /**
   * Get all events for a specific month
   */
  const getEventsForMonth = useCallback((year: number, month: number): Event[] => {
    const monthStart = new Date(year, month, 1).getTime();
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
    
    return events.filter(event => {
      const eventStart = new Date(event.startTime).getTime();
      const eventEnd = new Date(event.endTime).getTime();
      
      // Check if event overlaps with this month
      return (eventStart <= monthEnd && eventEnd >= monthStart);
    });
  }, [events]);
  
  /**
   * Update an event in the store
   */
  const updateEvent = useCallback((eventId: string, updates: Partial<Event>) => {
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === eventId ? { ...event, ...updates } : event
      )
    );
  }, []);
  
  /**
   * Add a new event to the store
   */
  const addEvent = useCallback((event: Event) => {
    setEvents(prevEvents => [...prevEvents, event]);
  }, []);
  
  /**
   * Delete an event from the store
   */
  const deleteEvent = useCallback((eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
  }, []);
  
  /**
   * Bulk update events (replace entire array)
   */
  const bulkUpdateEvents = useCallback((newEvents: Event[]) => {
    setEvents(newEvents);
  }, []);
  
  return {
    events,
    loading: false,
    error: null,
    getEventsForDate,
    getEventsForMonth,
    updateEvent,
    addEvent,
    deleteEvent,
    bulkUpdateEvents
  };
}