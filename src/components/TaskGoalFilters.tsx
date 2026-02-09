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

export interface TaskGoalFilters {
  status: string[];
  priority: string[];
  energyCost: string[];
  owner: string[];
  tags: string[];
  hasResources?: boolean;
  dueDateRange?: {
    start?: string;
    end?: string;
  };
}

interface TaskGoalFiltersProps {
  filters: TaskGoalFilters;
  onFiltersChange: (filters: TaskGoalFilters) => void;
  availableTags?: string[];
  availableOwners?: string[];
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'pending', label: 'Pending' },
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', color: 'text-red-400' },
  { value: 'medium', label: 'Medium', color: 'text-amber-400' },
  { value: 'low', label: 'Low', color: 'text-green-400' },
];

const ENERGY_COST_OPTIONS = [
  { value: 'high', label: 'High Energy', color: 'text-red-400' },
  { value: 'medium', label: 'Medium Energy', color: 'text-amber-400' },
  { value: 'low', label: 'Low Energy', color: 'text-green-400' },
];

export function TaskGoalFiltersComponent({ 
  filters, 
  onFiltersChange,
  availableTags = [],
  availableOwners = [],
}: TaskGoalFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFilter = (category: keyof TaskGoalFilters, value: string) => {
    const current = filters[category];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    
    onFiltersChange({ ...filters, [category]: updated });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: [],
      priority: [],
      energyCost: [],
      owner: [],
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
          {/* Status */}
          <DropdownMenuLabel className="text-white">Status</DropdownMenuLabel>
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.status.includes(option.value)}
              onCheckedChange={() => toggleFilter('status', option.value)}
              className="text-gray-300 focus:bg-gray-700/50 focus:text-white cursor-pointer"
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
          
          <DropdownMenuSeparator className="bg-gray-800" />
          
          {/* Priority */}
          <DropdownMenuLabel className="text-white">Priority</DropdownMenuLabel>
          {PRIORITY_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.priority.includes(option.value)}
              onCheckedChange={() => toggleFilter('priority', option.value)}
              className="text-gray-300 focus:bg-gray-700/50 focus:text-white cursor-pointer"
            >
              <span className={option.color}>{option.label}</span>
            </DropdownMenuCheckboxItem>
          ))}
          
          <DropdownMenuSeparator className="bg-gray-800" />
          
          {/* Energy Cost */}
          <DropdownMenuLabel className="text-white">Energy Cost</DropdownMenuLabel>
          {ENERGY_COST_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.energyCost.includes(option.value)}
              onCheckedChange={() => toggleFilter('energyCost', option.value)}
              className="text-gray-300 focus:bg-gray-700/50 focus:text-white cursor-pointer"
            >
              <span className={option.color}>{option.label}</span>
            </DropdownMenuCheckboxItem>
          ))}
          
          {availableOwners.length > 0 && (
            <>
              <DropdownMenuSeparator className="bg-gray-800" />
              
              {/* Owner */}
              <DropdownMenuLabel className="text-white">Owner</DropdownMenuLabel>
              {availableOwners.map((owner) => (
                <DropdownMenuCheckboxItem
                  key={owner}
                  checked={filters.owner.includes(owner)}
                  onCheckedChange={() => toggleFilter('owner', owner)}
                  className="text-gray-300 focus:bg-gray-700/50 focus:text-white cursor-pointer"
                >
                  {owner}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
          
          {availableTags.length > 0 && (
            <>
              <DropdownMenuSeparator className="bg-gray-800" />
              
              {/* Tags */}
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
          {filters.status.map((status) => (
            <Badge 
              key={`status-${status}`} 
              variant="outline" 
              className="gap-1 cursor-pointer hover:bg-red-400/10"
              onClick={() => toggleFilter('status', status)}
            >
              {STATUS_OPTIONS.find(o => o.value === status)?.label}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          {filters.priority.map((priority) => (
            <Badge 
              key={`priority-${priority}`} 
              variant="outline" 
              className="gap-1 cursor-pointer hover:bg-red-400/10"
              onClick={() => toggleFilter('priority', priority)}
            >
              {PRIORITY_OPTIONS.find(o => o.value === priority)?.label}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          {filters.energyCost.map((energy) => (
            <Badge 
              key={`energy-${energy}`} 
              variant="outline" 
              className="gap-1 cursor-pointer hover:bg-red-400/10"
              onClick={() => toggleFilter('energyCost', energy)}
            >
              {ENERGY_COST_OPTIONS.find(o => o.value === energy)?.label}
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