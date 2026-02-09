/**
 * Calendar Events Mock Data
 * 
 * Provides sample calendar events for testing and development
 * Used by resonance calculations and energy analysis
 * 
 * TODAY: January 10, 2026 (Friday)
 */

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  type: 'meeting' | 'focus' | 'break' | 'event';
  description?: string;
  location?: string;
  attendees?: string[];
  energyLevel?: 'high' | 'medium' | 'low';
}

// Helper to create dates for TODAY (January 10, 2026)
const createTodayDate = (hour: number, minute: number = 0): string => {
  const date = new Date(2026, 0, 10, hour, minute, 0, 0); // Jan 10, 2026
  return date.toISOString();
};

export const calendarEvents: CalendarEvent[] = [
  // Morning meeting during peak energy time (reduces available focus time)
  {
    id: 'evt-1',
    title: 'Team Standup',
    start: createTodayDate(9, 30), // 9:30 AM
    end: createTodayDate(10, 0), // 10:00 AM
    type: 'meeting',
    description: 'Daily sync with engineering team',
    location: 'Zoom',
    attendees: ['Engineering Team'],
    energyLevel: 'medium',
  },
  
  // Client call during peak hours (another meeting in prime time)
  {
    id: 'evt-2',
    title: 'Client Presentation Review',
    start: createTodayDate(10, 30), // 10:30 AM
    end: createTodayDate(11, 30), // 11:30 AM
    type: 'meeting',
    description: 'Q1 2026 project stakeholder review',
    location: 'Conference Room B',
    attendees: ['Sarah Chen', 'Marcus Rodriguez'],
    energyLevel: 'high',
  },
  
  // Lunch break (low energy time - post-lunch dip)
  {
    id: 'evt-3',
    title: 'Lunch Break',
    start: createTodayDate(12, 0), // 12:00 PM
    end: createTodayDate(13, 0), // 1:00 PM
    type: 'break',
    description: 'Midday recharge',
    energyLevel: 'low',
  },
  
  // Afternoon meeting (good for collaboration)
  {
    id: 'evt-4',
    title: 'Product Roadmap Planning',
    start: createTodayDate(14, 0), // 2:00 PM
    end: createTodayDate(15, 0), // 3:00 PM
    type: 'meeting',
    description: 'Q1 feature prioritization',
    location: 'Zoom',
    attendees: ['Product Team'],
    energyLevel: 'medium',
  },
  
  // Late afternoon focus block
  {
    id: 'evt-5',
    title: 'Admin & Email',
    start: createTodayDate(16, 0), // 4:00 PM
    end: createTodayDate(17, 0), // 5:00 PM
    type: 'focus',
    description: 'Process emails and admin tasks',
    energyLevel: 'low',
  },
];

/**
 * CALENDAR GAPS CREATED (Available for task scheduling):
 * 
 * 1. 8:00 AM - 9:30 AM (90 min) - PEAK ENERGY - Perfect for high-energy tasks
 * 2. 10:00 AM - 10:30 AM (30 min) - HIGH ENERGY - Good for quick focused work
 * 3. 11:30 AM - 12:00 PM (30 min) - MEDIUM ENERGY - Pre-lunch slot
 * 4. 1:00 PM - 2:00 PM (60 min) - LOW ENERGY - Post-lunch dip (admin tasks)
 * 5. 3:00 PM - 4:00 PM (60 min) - MEDIUM ENERGY - Afternoon slot
 * 6. 5:00 PM - 6:00 PM (60 min) - DECLINING ENERGY - End of day
 * 
 * This creates realistic gaps where:
 * - High-energy tasks (9-11 AM) are partially blocked by meetings
 * - There ARE gaps available for rescheduling
 * - The algorithm can suggest better times for mismatched tasks
 */
