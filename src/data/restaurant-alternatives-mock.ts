/**
 * Restaurant Alternatives Mock Data
 * Intelligent alternative suggestions based on budget, cuisine, and vibe matching
 */

import { RestaurantAlternative } from '../types/budget-types';

export const restaurantAlternatives: RestaurantAlternative[] = [
  // Alternative 1: Best Overall Match - Similar Italian, great vibe, fits budget
  {
    id: 'alt_rest_001',
    name: 'Locanda Verde',
    cuisine: 'Italian',
    priceRange: '$$',
    averageCostPerPlate: 55,
    address: '377 Greenwich St',
    city: 'New York, NY',
    distanceFromOriginal: '0.8 miles away',
    rating: 4.6,
    reviewCount: 2341,
    vibeMatch: 88,
    matchReason: 'Upscale-casual Italian with authentic regional dishes and intimate ambiance',
    budgetSavings: 50,
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
    whySuggested: 'Fits your $60 budget perfectly while maintaining the upscale Italian experience you\'re looking for. Chef Andrew Carmellini\'s renowned seasonal menu delivers exceptional quality.',
    highlights: [
      'Authentic Italian cuisine',
      'Intimate, romantic setting',
      'Excellent wine selection',
      'Farm-to-table ingredients'
    ],
    dietaryOptions: ['Vegetarian', 'Gluten-free options'],
    reservationUrl: 'https://resy.com/locanda-verde',
    phone: '(212) 925-3797',
    hoursToday: '5:00 PM - 11:00 PM',
    priceForTwo: 110
  },

  // Alternative 2: Best Value - Great quality at lower price point
  {
    id: 'alt_rest_002',
    name: 'Osteria Morini',
    cuisine: 'Italian',
    priceRange: '$$',
    averageCostPerPlate: 48,
    address: '218 Lafayette St',
    city: 'New York, NY',
    distanceFromOriginal: '1.2 miles away',
    rating: 4.7,
    reviewCount: 1876,
    vibeMatch: 85,
    matchReason: 'Northern Italian specialties in a warm, convivial atmosphere with excellent value',
    budgetSavings: 57,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    whySuggested: 'Exceptional value at $48 per person, well within your $60 budget. Specializes in Emilia-Romagna cuisine with handmade pastas and house-cured salumi.',
    highlights: [
      'Handmade pastas',
      'House-cured meats',
      'Cozy, neighborhood gem',
      'Outstanding service'
    ],
    dietaryOptions: ['Vegetarian', 'Vegan options available'],
    reservationUrl: 'https://resy.com/osteria-morini',
    phone: '(212) 965-8777',
    hoursToday: '5:00 PM - 10:30 PM',
    priceForTwo: 96
  },

  // Alternative 3: Premium Budget Option - Highest cost that still fits budget
  {
    id: 'alt_rest_003',
    name: 'L\'Artusi',
    cuisine: 'Italian',
    priceRange: '$$',
    averageCostPerPlate: 58,
    address: '228 W 10th St',
    city: 'New York, NY',
    distanceFromOriginal: '0.5 miles away',
    rating: 4.8,
    reviewCount: 3127,
    vibeMatch: 90,
    matchReason: 'Modern Italian with sophisticated ambiance and creative seasonal menu',
    budgetSavings: 47,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    whySuggested: 'Maximum quality within your $60 budget. Modern take on Italian classics with exceptional wine program and elegant but relaxed atmosphere perfect for special occasions.',
    highlights: [
      'Creative seasonal menu',
      'Extensive wine list',
      'Sleek, modern ambiance',
      'Perfect for celebrations'
    ],
    dietaryOptions: ['Vegetarian', 'Gluten-free pasta available'],
    reservationUrl: 'https://resy.com/lartusi',
    phone: '(212) 255-5757',
    hoursToday: '5:00 PM - 11:00 PM',
    priceForTwo: 116
  },

  // Alternative 4: Different cuisine, similar quality level
  {
    id: 'alt_rest_004',
    name: 'Gramercy Tavern',
    cuisine: 'American Contemporary',
    priceRange: '$$',
    averageCostPerPlate: 60,
    address: '42 E 20th St',
    city: 'New York, NY',
    distanceFromOriginal: '1.5 miles away',
    rating: 4.7,
    reviewCount: 4521,
    vibeMatch: 75,
    matchReason: 'Different cuisine but similar upscale-casual vibe with seasonal American menu',
    budgetSavings: 45,
    imageUrl: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80',
    whySuggested: 'Right at your $60 budget with world-class seasonal American cuisine. While not Italian, it offers the same celebratory atmosphere and exceptional quality.',
    highlights: [
      'Michelin-recognized',
      'Seasonal farm-to-table',
      'Warm, welcoming atmosphere',
      'Outstanding service'
    ],
    dietaryOptions: ['Vegetarian tasting menu', 'Vegan options', 'Gluten-free'],
    reservationUrl: 'https://resy.com/gramercy-tavern',
    phone: '(212) 477-0777',
    hoursToday: '5:30 PM - 10:00 PM',
    priceForTwo: 120
  },

  // Alternative 5: Budget-friendly but still quality
  {
    id: 'alt_rest_005',
    name: 'Via Carota',
    cuisine: 'Italian',
    priceRange: '$$',
    averageCostPerPlate: 42,
    address: '51 Grove St',
    city: 'New York, NY',
    distanceFromOriginal: '0.6 miles away',
    rating: 4.6,
    reviewCount: 2892,
    vibeMatch: 80,
    matchReason: 'Rustic Italian with charming village atmosphere and exceptional value',
    budgetSavings: 63,
    imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    whySuggested: 'Great value at $42 per person, leaving room in your budget. Beloved West Village gem with rustic Italian charm and consistently excellent food.',
    highlights: [
      'Charming village atmosphere',
      'Simple, perfect execution',
      'Fresh, seasonal ingredients',
      'Neighborhood favorite'
    ],
    dietaryOptions: ['Vegetarian', 'Many vegan options'],
    reservationUrl: 'https://resy.com/via-carota',
    phone: '(212) 255-1962',
    hoursToday: '5:00 PM - 11:00 PM',
    priceForTwo: 84
  }
];

// Helper function to get alternatives by event
export function getAlternativesForEvent(eventId: string): RestaurantAlternative[] {
  // In a real app, this would filter based on the event's requirements
  // For now, return the top 3 alternatives for the main conflict event
  if (eventId === 'event_dinner_001') {
    return restaurantAlternatives.slice(0, 3);
  }
  return [];
}

// Helper function to sort alternatives by various criteria
export function sortAlternatives(
  alternatives: RestaurantAlternative[], 
  sortBy: 'vibeMatch' | 'savings' | 'rating' | 'price'
): RestaurantAlternative[] {
  const sorted = [...alternatives];
  
  switch (sortBy) {
    case 'vibeMatch':
      return sorted.sort((a, b) => b.vibeMatch - a.vibeMatch);
    case 'savings':
      return sorted.sort((a, b) => b.budgetSavings - a.budgetSavings);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'price':
      return sorted.sort((a, b) => a.averageCostPerPlate - b.averageCostPerPlate);
    default:
      return sorted;
  }
}

// Helper function to filter alternatives by max price
export function filterByMaxPrice(
  alternatives: RestaurantAlternative[], 
  maxPrice: number
): RestaurantAlternative[] {
  return alternatives.filter(alt => alt.averageCostPerPlate <= maxPrice);
}

// Helper function to get best match
export function getBestMatch(alternatives: RestaurantAlternative[]): RestaurantAlternative | undefined {
  if (alternatives.length === 0) return undefined;
  
  // Calculate weighted score: vibeMatch (40%) + rating (30%) + savings factor (30%)
  const scored = alternatives.map(alt => ({
    alternative: alt,
    score: (alt.vibeMatch * 0.4) + (alt.rating * 20 * 0.3) + ((alt.budgetSavings / 100) * 100 * 0.3)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0].alternative;
}
