/**
 * TEAM EVENT FILTER
 * 
 * Filter controls for team events with count badges.
 * Filters: All, Primary, Child, Active, Completed, Archived
 */

import React from 'react';
import { Layers, Calendar, TrendingUp, CheckCircle2, Archive, Search } from 'lucide-react';
import { TeamEventFilter as FilterType } from '../utils/team-event-integration';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

interface TeamEventFilterProps {
  value: FilterType;
  onChange: (filter: FilterType) => void;
  counts: {
    all: number;
    primary: number;
    child: number;
    active: number;
    completed: number;
    archived: number;
  };
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
  className?: string;
}

export function TeamEventFilter({
  value,
  onChange,
  counts,
  searchQuery = '',
  onSearchChange,
  showSearch = true,
  className = '',
}: TeamEventFilterProps) {
  const filters: {
    value: FilterType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
  }[] = [
    { value: 'all', label: 'All Events', icon: Calendar, count: counts.all },
    { value: 'primary', label: 'Primary', icon: Layers, count: counts.primary },
    { value: 'child', label: 'Sub-Events', icon: Calendar, count: counts.child },
    { value: 'active', label: 'Active', icon: TrendingUp, count: counts.active },
    { value: 'completed', label: 'Completed', icon: CheckCircle2, count: counts.completed },
    { value: 'archived', label: 'Archived', icon: Archive, count: counts.archived },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search */}
      {showSearch && onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700"
          />
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => {
          const Icon = filter.icon;
          const isActive = value === filter.value;
          
          return (
            <Button
              key={filter.value}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange(filter.value)}
              className={`${
                isActive
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-800/50 hover:bg-gray-800 text-gray-300 border-gray-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {filter.label}
              <Badge
                variant="secondary"
                className={`ml-2 ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {filter.count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Active Filter Indicator */}
      {value !== 'all' && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Showing:</span>
          <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
            {filters.find(f => f.value === value)?.label}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange('all')}
            className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
          >
            Clear filter
          </Button>
        </div>
      )}

      {/* Search Results Indicator */}
      {showSearch && searchQuery.trim() && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Search results for:</span>
          <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400">
            "{searchQuery}"
          </Badge>
          {onSearchChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300"
            >
              Clear search
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
