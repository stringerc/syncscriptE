/**
 * Calendar Navigation Context
 * 
 * RESEARCH: iOS Navigation Pattern + React Context API Best Practices
 * 
 * Pattern Used By:
 * - iOS UITabBarController (Apple HIG)
 * - Google Calendar sidebar navigation
 * - React Navigation (React Native)
 * 
 * PURPOSE:
 * Allow Sidebar to trigger "Jump to Today" when Calendar tab is clicked,
 * even when already on the Calendar page.
 * 
 * This creates a "reset to home" behavior similar to:
 * - Tapping active tab in iOS → scrolls to top
 * - Clicking Calendar sidebar → jumps to today
 */

import React, { createContext, useContext, useRef, useCallback } from 'react';

interface CalendarNavigationContextType {
  // Register the jumpToToday function from CalendarEventsPage
  registerJumpToToday: (fn: () => void) => void;
  
  // Trigger the jump from anywhere (e.g., Sidebar)
  triggerJumpToToday: () => void;
}

const CalendarNavigationContext = createContext<CalendarNavigationContextType | null>(null);

export function CalendarNavigationProvider({ children }: { children: React.ReactNode }) {
  const jumpToTodayRef = useRef<(() => void) | null>(null);

  const registerJumpToToday = useCallback((fn: () => void) => {
    jumpToTodayRef.current = fn;
  }, []);

  const triggerJumpToToday = useCallback(() => {
    if (jumpToTodayRef.current) {
      console.log('🎯 Context: Triggering jumpToToday from Sidebar');
      jumpToTodayRef.current();
    } else {
      console.warn('⚠️ Context: jumpToToday not registered yet');
    }
  }, []);

  return (
    <CalendarNavigationContext.Provider value={{ registerJumpToToday, triggerJumpToToday }}>
      {children}
    </CalendarNavigationContext.Provider>
  );
}

export function useCalendarNavigation() {
  const context = useContext(CalendarNavigationContext);
  if (!context) {
    throw new Error('useCalendarNavigation must be used within CalendarNavigationProvider');
  }
  return context;
}