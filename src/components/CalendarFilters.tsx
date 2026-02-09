/**
 * CalendarFilters Component
 * 
 * Filters for calendar events: Work, Social, Holidays, and user-defined tags.
 * No separate holiday toggle - holidays are just another filter option.
 */

import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export interface CalendarFilters {
  eventTypes: string[];
  tags: string[];
}

interface CalendarFiltersProps {
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
  availableTags?: string[];
}

const EVENT_TYPE_OPTIONS = [
  { value: 'work', label: 'Work', color: 'text-blue-400' },
  { value: 'social', label: 'Social', color: 'text-purple-400' },
  { value: 'holidays', label: 'Holidays', color: 'text-green-400' },
  { value: 'personal', label: 'Personal', color: 'text-orange-400' },
  { value: 'meeting', label: 'Meeting', color: 'text-teal-400' },
  { value: 'deadline', label: 'Deadline', color: 'text-red-400' },
  { value: 'focus', label: 'Focus Time', color: 'text-cyan-400' },
];

export function CalendarFilters({ 
  filters, 
  onFiltersChange,
  availableTags = [],
}: CalendarFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFilter = (category: keyof CalendarFilters, value: string) => {
    const current = filters[category];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    
    onFiltersChange({ ...filters, [category]: updated });
  };

  const clearFilters = () => {
    onFiltersChange({
      eventTypes: [],
      tags: [],
    });
  };

  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" className="bg-teal-600 ml-1">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 bg-[#1e2128] border-gray-800">
          {/* Event Types */}
          <DropdownMenuLabel className="text-white">Event Type</DropdownMenuLabel>
          {EVENT_TYPE_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.eventTypes.includes(option.value)}
              onCheckedChange={() => toggleFilter('eventTypes', option.value)}
              className="text-gray-300 focus:bg-gray-700/50 focus:text-white cursor-pointer"
            >
              <span className={option.color}>{option.label}</span>
            </DropdownMenuCheckboxItem>
          ))}
          
          {availableTags.length > 0 && (
            <>
              <DropdownMenuSeparator className="bg-gray-800" />
              
              {/* Custom Tags */}
              <DropdownMenuLabel className="text-white">Tags</DropdownMenuLabel>
              <div className="max-h-32 overflow-y-auto">
                {availableTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={filters.tags.includes(tag)}
                    onCheckedChange={() => toggleFilter('tags', tag)}
                    className="text-gray-300 focus:bg-gray-700/50 focus:text-white cursor-pointer"
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </>
          )}
          
          {activeFilterCount > 0 && (
            <>
              <DropdownMenuSeparator className="bg-gray-800" />
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All Filters
              </Button>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.eventTypes.map((type) => (
            <Badge 
              key={`type-${type}`} 
              variant="outline" 
              className="gap-1 cursor-pointer hover:bg-red-400/10"
              onClick={() => toggleFilter('eventTypes', type)}
            >
              {EVENT_TYPE_OPTIONS.find(o => o.value === type)?.label}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          {filters.tags.map((tag) => (
            <Badge 
              key={`tag-${tag}`} 
              variant="outline" 
              className="gap-1 cursor-pointer hover:bg-red-400/10"
              onClick={() => toggleFilter('tags', tag)}
            >
              {tag}
              <X className="w-3 h-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Filter events based on active filters
 */
export function filterEvents(events: any[], filters: CalendarFilters): any[] {
  let filtered = [...events];

  // Event type filter
  if (filters.eventTypes.length > 0) {
    filtered = filtered.filter(event => 
      filters.eventTypes.includes(event.eventType || event.type)
    );
  }

  // Tags filter
  if (filters.tags.length > 0) {
    filtered = filtered.filter(event => 
      event.tags?.some((tag: string) => filters.tags.includes(tag))
    );
  }

  return filtered;
}

/**
 * Extract unique tags from events
 */
export function extractEventTags(events: any[]): string[] {
  const tags = new Set<string>();
  events.forEach(event => {
    event.tags?.forEach((tag: string) => tags.add(tag));
  });
  return Array.from(tags).sort();
}
