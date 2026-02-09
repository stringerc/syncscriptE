/**
 * Task Event Filter Component
 * 
 * PHASE 5E: Filter tasks by event association status
 * 
 * Features:
 * - Toggle between All, Standalone, and Event-Associated tasks
 * - Visual indicators for filter state
 * - Count badges for each filter option
 */

import { Calendar, Target, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

export type TaskEventFilterType = 'all' | 'standalone' | 'event-associated';

interface TaskEventFilterProps {
  value: TaskEventFilterType;
  onChange: (value: TaskEventFilterType) => void;
  counts?: {
    all: number;
    standalone: number;
    eventAssociated: number;
  };
  className?: string;
}

export function TaskEventFilter({
  value,
  onChange,
  counts,
  className = '',
}: TaskEventFilterProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Tabs value={value} onValueChange={(v) => onChange(v as TaskEventFilterType)}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Layers className="h-4 w-4" />
            <span>All Tasks</span>
            {counts && (
              <Badge variant="secondary" className="ml-1">
                {counts.all}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="standalone" className="gap-2">
            <Target className="h-4 w-4" />
            <span>Standalone</span>
            {counts && (
              <Badge variant="secondary" className="ml-1">
                {counts.standalone}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="event-associated" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span>In Events</span>
            {counts && (
              <Badge variant="secondary" className="ml-1">
                {counts.eventAssociated}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

/**
 * Compact version for mobile or tight spaces
 */
export function TaskEventFilterCompact({
  value,
  onChange,
  counts,
  className = '',
}: TaskEventFilterProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant={value === 'all' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('all')}
        className="gap-1.5"
      >
        <Layers className="h-3.5 w-3.5" />
        {counts && <span className="text-xs">{counts.all}</span>}
      </Button>
      <Button
        variant={value === 'standalone' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('standalone')}
        className="gap-1.5"
      >
        <Target className="h-3.5 w-3.5" />
        {counts && <span className="text-xs">{counts.standalone}</span>}
      </Button>
      <Button
        variant={value === 'event-associated' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('event-associated')}
        className="gap-1.5"
      >
        <Calendar className="h-3.5 w-3.5" />
        {counts && <span className="text-xs">{counts.eventAssociated}</span>}
      </Button>
    </div>
  );
}
