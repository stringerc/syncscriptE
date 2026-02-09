/**
 * Planned Events Mock Data
 * Realistic reservations and upcoming events for budget conflict detection
 */

import { PlannedEvent } from '../types/budget-types';

export const plannedEvents: PlannedEvent[] = [
  // The main conflict event - upscale Italian dinner
  {
    id: 'event_dinner_001',
    title: 'Dinner at Osteria Francescana',
    type: 'dining',
    date: '2026-01-18',
    time: '19:30',
    venue: {
      name: 'Osteria Francescana',
      address: '220 W Broadway',
      city: 'New York, NY',
      cuisine: 'Italian Fine Dining',
      priceRange: '$$$$',
      rating: 4.9,
      reviewCount: 1247,
      phone: '(212) 555-0147',
      website: 'https://osteriafrancescana.com'
    },
    estimatedCost: 105,
    costType: 'per-person',
    numberOfPeople: 2,
    linkedBudgetGoalId: 'goal_budget_dining_001',
    conflictStatus: 'moderate',
    overageAmount: 45,
    notes: 'Anniversary celebration - special occasion',
    confirmationNumber: 'RES-2026-0118-1930',
    createdDate: '2026-01-08T14:30:00Z'
  },
  
  // Future events - no conflicts
  {
    id: 'event_dinner_002',
    title: 'Casual Lunch at Café Altro Paradiso',
    type: 'dining',
    date: '2026-01-22',
    time: '12:30',
    venue: {
      name: 'Café Altro Paradiso',
      address: '234 Spring St',
      city: 'New York, NY',
      cuisine: 'Italian',
      priceRange: '$$',
      rating: 4.5,
      reviewCount: 892
    },
    estimatedCost: 45,
    costType: 'per-person',
    numberOfPeople: 1,
    linkedBudgetGoalId: 'goal_budget_dining_001',
    conflictStatus: 'none',
    notes: 'Work lunch with client',
    createdDate: '2026-01-10T09:15:00Z'
  },

  {
    id: 'event_movie_001',
    title: 'Movie Night - Dune Part Two',
    type: 'entertainment',
    date: '2026-01-20',
    time: '20:00',
    venue: {
      name: 'AMC Lincoln Square',
      address: '1998 Broadway',
      city: 'New York, NY',
      category: 'Cinema',
      priceRange: '$',
      rating: 4.3,
      reviewCount: 543
    },
    estimatedCost: 32,
    costType: 'total',
    numberOfPeople: 2,
    linkedBudgetGoalId: 'goal_budget_entertainment_001',
    conflictStatus: 'none',
    notes: 'IMAX tickets + small popcorn',
    createdDate: '2026-01-09T18:20:00Z'
  },

  {
    id: 'event_concert_001',
    title: 'Jazz at Lincoln Center',
    type: 'entertainment',
    date: '2026-01-25',
    time: '19:00',
    venue: {
      name: 'Dizzy\'s Club',
      address: 'Broadway at 60th St',
      city: 'New York, NY',
      category: 'Live Music',
      priceRange: '$$$',
      rating: 4.8,
      reviewCount: 1891
    },
    estimatedCost: 75,
    costType: 'per-person',
    numberOfPeople: 2,
    linkedBudgetGoalId: 'goal_budget_entertainment_001',
    conflictStatus: 'none',
    notes: 'Wynton Marsalis performance',
    confirmationNumber: 'JAZZ-20260125-001',
    createdDate: '2026-01-05T11:45:00Z'
  }
];

// Helper function to get event by ID
export function getEventById(id: string): PlannedEvent | undefined {
  return plannedEvents.find(event => event.id === id);
}

// Helper function to get events by budget goal
export function getEventsByBudgetGoal(goalId: string): PlannedEvent[] {
  return plannedEvents.filter(event => event.linkedBudgetGoalId === goalId);
}

// Helper function to get conflicting events
export function getConflictingEvents(): PlannedEvent[] {
  return plannedEvents.filter(event => event.conflictStatus !== 'none');
}

// Helper function to get upcoming events
export function getUpcomingEvents(days: number = 7): PlannedEvent[] {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);
  
  return plannedEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= now && eventDate <= future;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
