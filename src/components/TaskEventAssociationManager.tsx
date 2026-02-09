/**
 * Task-Event Association Manager
 * 
 * PHASE 5E: Manages linking/unlinking tasks to/from events
 * 
 * Features:
 * - Link existing tasks to events
 * - Unlink tasks from events
 * - Choose primary event for task
 * - Warning about archive behavior
 * - Search and filter events
 */

import { useState } from 'react';
import { Search, Calendar, Link2, Unlink, AlertTriangle, X, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Event, Task } from '../utils/event-task-types';
import { toast } from 'sonner@2.0.3';

interface TaskEventAssociationManagerProps {
  task: Task;
  allEvents: Event[];
  onLinkToEvent: (taskId: string, eventId: string, primaryEventId?: string, archiveWithParent?: boolean) => void;
  onUnlinkFromEvent: (taskId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskEventAssociationManager({
  task,
  allEvents,
  onLinkToEvent,
  onUnlinkFromEvent,
  open,
  onOpenChange,
}: TaskEventAssociationManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [archiveWithParent, setArchiveWithParent] = useState(task.archiveWithParentEvent ?? true);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Current association
  const currentEvent = task.parentEventId
    ? allEvents.find(e => e.id === task.parentEventId)
    : null;

  const currentPrimaryEvent = task.primaryEventId
    ? allEvents.find(e => e.id === task.primaryEventId)
    : null;

  // Filter events for search
  const filteredEvents = allEvents.filter(event => {
    // Don't show archived events
    if (event.archived) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.category?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Group events by primary/sub
  const primaryEvents = filteredEvents.filter(e => e.isPrimaryEvent);
  const subEvents = filteredEvents.filter(e => !e.isPrimaryEvent);

  const handleLink = () => {
    if (!selectedEventId) {
      toast.error('Please select an event to link');
      return;
    }

    const selectedEvent = allEvents.find(e => e.id === selectedEventId);
    if (!selectedEvent) return;

    // Determine primary event
    const primaryEventId = selectedEvent.isPrimaryEvent
      ? selectedEvent.id
      : selectedEvent.primaryEventId || selectedEvent.id;

    onLinkToEvent(task.id, selectedEventId, primaryEventId, archiveWithParent);
    toast.success(`Task linked to "${selectedEvent.title}"`);
    onOpenChange(false);
    
    // Reset state
    setSelectedEventId(null);
    setSearchQuery('');
  };

  const handleUnlink = () => {
    onUnlinkFromEvent(task.id);
    toast.success('Task unlinked from event');
    setIsUnlinking(false);
    onOpenChange(false);
  };

  const renderEventOption = (event: Event) => {
    const isSelected = selectedEventId === event.id;
    const isCurrent = event.id === task.parentEventId;

    return (
      <button
        key={event.id}
        onClick={() => setSelectedEventId(event.id)}
        disabled={isCurrent}
        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
          isSelected
            ? 'border-primary bg-primary/5'
            : isCurrent
            ? 'border-muted bg-muted cursor-not-allowed opacity-50'
            : 'border-transparent hover:border-border hover:bg-accent/50'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">{event.title}</span>
            </div>
            {isCurrent && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Current
              </Badge>
            )}
            {event.isPrimaryEvent && (
              <Badge variant="outline" className="text-xs flex-shrink-0">
                Primary
              </Badge>
            )}
          </div>

          {event.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 ml-6">
              {event.description}
            </p>
          )}

          <div className="flex items-center gap-2 ml-6 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {new Date(event.startTime).toLocaleDateString()}
            </Badge>
            {event.category && (
              <Badge variant="secondary" className="text-xs">
                {event.category}
              </Badge>
            )}
            {event.tasks?.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {event.tasks.length} tasks
              </Badge>
            )}
          </div>

          {/* Show parent hierarchy if it's a sub-event */}
          {!event.isPrimaryEvent && event.primaryEventId && (
            <div className="flex items-center gap-1 ml-6 text-xs text-muted-foreground">
              <span>Part of:</span>
              <span className="font-medium">
                {allEvents.find(e => e.id === event.primaryEventId)?.title || 'Unknown Event'}
              </span>
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentEvent ? (
              <>
                <Link2 className="h-5 w-5" />
                Manage Event Association
              </>
            ) : (
              <>
                <Link2 className="h-5 w-5" />
                Link Task to Event
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentEvent
              ? 'Change which event this task is associated with or remove the association.'
              : 'Link this task to an event to keep them organized together.'}
          </DialogDescription>
        </DialogHeader>

        {/* Current Association */}
        {currentEvent && !isUnlinking && (
          <div className="space-y-3">
            <Label>Current Association</Label>
            <div className="p-3 rounded-lg border bg-accent/50">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{currentEvent.title}</span>
                    {currentEvent.isPrimaryEvent && (
                      <Badge variant="secondary" className="text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                  {currentPrimaryEvent && currentPrimaryEvent.id !== currentEvent.id && (
                    <div className="flex items-center gap-1 ml-6 text-xs text-muted-foreground">
                      <span>Primary Event:</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="font-medium">{currentPrimaryEvent.title}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUnlinking(true)}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Unlink
                </Button>
              </div>
            </div>
            <Separator />
          </div>
        )}

        {/* Unlink Confirmation */}
        {isUnlinking && (
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Are you sure you want to unlink this task?</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>The task will become a standalone task</li>
                    <li>It will no longer appear in the event's task list</li>
                    {task.archiveWithParentEvent && (
                      <li>It will not auto-archive when the event completes</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUnlinking(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleUnlink}>
                <Unlink className="h-4 w-4 mr-2" />
                Unlink Task
              </Button>
            </div>
          </div>
        )}

        {/* Event Selection */}
        {!isUnlinking && (
          <>
            <div className="space-y-3">
              <Label>
                {currentEvent ? 'Change Event Association' : 'Select Event'}
              </Label>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Event List */}
              <ScrollArea className="h-[300px] rounded-lg border">
                <div className="p-4 space-y-4">
                  {/* Primary Events */}
                  {primaryEvents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Primary Events
                      </h4>
                      <div className="space-y-2">
                        {primaryEvents.map(renderEventOption)}
                      </div>
                    </div>
                  )}

                  {/* Sub Events */}
                  {subEvents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Sub Events
                      </h4>
                      <div className="space-y-2">
                        {subEvents.map(renderEventOption)}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {filteredEvents.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? 'No events found matching your search' : 'No active events available'}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Archive Behavior Option */}
              {selectedEventId && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="archive-with-parent">Auto-archive with event</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically archive this task when the event completes
                      </p>
                    </div>
                    <Switch
                      id="archive-with-parent"
                      checked={archiveWithParent}
                      onCheckedChange={setArchiveWithParent}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleLink} disabled={!selectedEventId}>
                <Link2 className="h-4 w-4 mr-2" />
                {currentEvent ? 'Change Association' : 'Link to Event'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
