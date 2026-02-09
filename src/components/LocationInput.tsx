/**
 * LocationInput Component - Phase 2
 * 
 * Smart location input with:
 * - Quick favorites (Home, Work, Gym)
 * - Recent locations (last 10)
 * - Google Places autocomplete
 * - Manual text input fallback
 */

import { useState, useEffect, useRef } from 'react';
import { MapPin, Star, Clock, Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface LocationSuggestion {
  id: string;
  name: string;
  address?: string;
  type: 'favorite' | 'recent' | 'places';
}

// Get user's favorite locations from localStorage
function getFavoriteLocations(): LocationSuggestion[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('syncscript_favorite_locations');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  // Default favorites
  return [
    { id: 'fav-1', name: 'Home', type: 'favorite' },
    { id: 'fav-2', name: 'Work', type: 'favorite' },
    { id: 'fav-3', name: 'Gym', type: 'favorite' },
  ];
}

// Get recent locations from localStorage
function getRecentLocations(): LocationSuggestion[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('syncscript_recent_locations');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

// Save location to recent history
function saveToRecentLocations(location: string) {
  if (!location.trim() || typeof window === 'undefined') return;
  
  const recent = getRecentLocations();
  
  // Don't add if it already exists
  const exists = recent.find(r => r.name.toLowerCase() === location.toLowerCase());
  if (exists) return;
  
  // Add to beginning, keep only last 10
  const updated = [
    { id: `recent-${Date.now()}`, name: location, type: 'recent' as const },
    ...recent
  ].slice(0, 10);
  
  localStorage.setItem('syncscript_recent_locations', JSON.stringify(updated));
}

export function LocationInput({ value, onChange, placeholder = "e.g., Conference Room B", className = "" }: LocationInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<LocationSuggestion[]>([]);
  const [recent, setRecent] = useState<LocationSuggestion[]>([]);
  const [placeSuggestions, setPlaceSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFavorites(getFavoriteLocations());
    setRecent(getRecentLocations());
  }, []);

  // Google Places Autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setPlaceSuggestions([]);
      return;
    }

    // Debounce search
    const timer = setTimeout(async () => {
      setIsLoadingPlaces(true);
      
      // Check if Google Places API key is available
      const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
      
      if (!apiKey) {
        // Fallback: Local search through favorites and recent
        const localResults = [...favorites, ...recent].filter(loc =>
          loc.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setPlaceSuggestions(localResults.slice(0, 5));
        setIsLoadingPlaces(false);
        return;
      }

      try {
        // Google Places Autocomplete API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchQuery)}&key=${apiKey}`,
          { method: 'GET' }
        );
        
        const data = await response.json();
        
        if (data.predictions) {
          const suggestions: LocationSuggestion[] = data.predictions.slice(0, 5).map((p: any, i: number) => ({
            id: `place-${i}`,
            name: p.structured_formatting.main_text,
            address: p.structured_formatting.secondary_text,
            type: 'places' as const,
          }));
          setPlaceSuggestions(suggestions);
        }
      } catch (error) {
        console.error('Google Places API error:', error);
        // Fallback to local search
        const localResults = [...favorites, ...recent].filter(loc =>
          loc.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setPlaceSuggestions(localResults.slice(0, 5));
      } finally {
        setIsLoadingPlaces(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, favorites, recent]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLocation = (location: LocationSuggestion) => {
    const locationText = location.address 
      ? `${location.name}, ${location.address}` 
      : location.name;
    onChange(locationText);
    saveToRecentLocations(locationText);
    setIsOpen(false);
    setSearchQuery('');
    
    // Refresh recent list
    setRecent(getRecentLocations());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSearchQuery(newValue);
    setIsOpen(true);
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const showFavorites = isOpen && !searchQuery && favorites.length > 0;
  const showRecent = isOpen && !searchQuery && recent.length > 0;
  const showPlaces = isOpen && searchQuery.length >= 3;

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`pl-10 pr-10 ${className}`}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (showFavorites || showRecent || showPlaces) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-[#2a2d35] border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {/* Favorites Section */}
          {showFavorites && (
            <div className="p-2 border-b border-gray-700">
              <div className="text-xs font-semibold text-gray-400 px-2 py-1 flex items-center gap-1">
                <Star className="w-3 h-3" />
                Favorites
              </div>
              {favorites.map(loc => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded flex items-center gap-2 text-white transition-colors"
                >
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>{loc.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Recent Section */}
          {showRecent && (
            <div className="p-2 border-b border-gray-700">
              <div className="text-xs font-semibold text-gray-400 px-2 py-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Recent
              </div>
              {recent.map(loc => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded flex items-center gap-2 text-gray-300 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{loc.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Results / Places API */}
          {showPlaces && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-400 px-2 py-1 flex items-center gap-1">
                <Search className="w-3 h-3" />
                {isLoadingPlaces ? 'Searching...' : 'Suggestions'}
              </div>
              {isLoadingPlaces ? (
                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                  Loading suggestions...
                </div>
              ) : placeSuggestions.length > 0 ? (
                placeSuggestions.map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium">{loc.name}</div>
                        {loc.address && (
                          <div className="text-gray-400 text-xs truncate">{loc.address}</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                  No suggestions found. Press Enter to use "{searchQuery}"
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {isOpen && !showFavorites && !showRecent && !showPlaces && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Start typing to search locations
            </div>
          )}
        </div>
      )}
    </div>
  );
}
