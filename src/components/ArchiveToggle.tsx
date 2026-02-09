/**
 * Archive Toggle Component
 * 
 * PHASE 5D: Archive Visibility Control
 * 
 * Features:
 * - Toggle between active and archived tasks/events
 * - Show count of archived items
 * - Visual indicator for archived state
 * - Research-based: "Show Archived" pattern from Gmail, Asana
 */

import { Archive, ArchiveRestore } from 'lucide-react';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface ArchiveToggleProps {
  showArchived: boolean;
  onToggle: (show: boolean) => void;
  archivedCount: number;
  activeCount: number;
  itemType?: 'tasks' | 'events' | 'goals';
}

export function ArchiveToggle({ 
  showArchived, 
  onToggle, 
  archivedCount, 
  activeCount,
  itemType = 'tasks'
}: ArchiveToggleProps) {
  return (
    <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3">
      {/* Icon */}
      <div className={`shrink-0 ${showArchived ? 'text-purple-400' : 'text-gray-400'}`}>
        {showArchived ? (
          <ArchiveRestore className="w-4 h-4" />
        ) : (
          <Archive className="w-4 h-4" />
        )}
      </div>

      {/* Label & Count */}
      <div className="flex-1 min-w-0">
        <Label 
          htmlFor="archive-toggle" 
          className="text-sm font-medium text-white cursor-pointer flex items-center gap-2"
        >
          Show Archived
          <Badge 
            variant="outline" 
            className={`text-xs ${
              showArchived 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                : 'bg-gray-700/50 text-gray-400 border-gray-600'
            }`}
          >
            {archivedCount} {itemType}
          </Badge>
        </Label>
        <p className="text-xs text-gray-400 mt-0.5">
          {showArchived 
            ? `Showing ${archivedCount + activeCount} total (${activeCount} active + ${archivedCount} archived)`
            : `Showing ${activeCount} active ${itemType}`
          }
        </p>
      </div>

      {/* Switch */}
      <Switch
        id="archive-toggle"
        checked={showArchived}
        onCheckedChange={onToggle}
        className={showArchived ? 'data-[state=checked]:bg-purple-600' : ''}
      />
    </div>
  );
}
