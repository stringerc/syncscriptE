import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Check, X, Download, Upload, Filter, Search, 
  Loader2, AlertCircle, ChevronDown, ChevronRight, Clock,
  Users, MapPin, ExternalLink
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
  calendarName: string;
  color?: string;
  recurring?: boolean;
  recurrenceRule?: string;
  source: 'google_calendar' | 'outlook_calendar';
}

interface CalendarImportDialogProps {
  open: boolean;
  onClose: () => void;
  provider: 'google_calendar' | 'outlook_calendar';
}

export function CalendarImportDialog({ open, onClose, provider }: CalendarImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [calendarFilter, setCalendarFilter] = useState<string[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [importProgress, setImportProgress] = useState(0);

  // Load events when dialog opens
  useEffect(() => {
    if (open) {
      loadCalendarEvents();
    }
  }, [open, provider]);

  const loadCalendarEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/integrations/${provider}/events`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      setEvents(data.events || []);
      
      // Auto-select upcoming events
      const upcomingEvents = data.events?.filter((e: CalendarEvent) => 
        new Date(e.start) > new Date()
      ) || [];
      setSelectedEvents(new Set(upcomingEvents.map((e: CalendarEvent) => e.id)));
      
      toast.success(`Loaded ${data.events?.length || 0} events`);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (selectedEvents.size === 0) {
      toast.error('Please select at least one event to import');
      return;
    }

    setImporting(true);
    setImportProgress(0);

    try {
      const eventsToImport = events.filter(e => selectedEvents.has(e.id));
      const total = eventsToImport.length;
      let completed = 0;

      // Import in batches of 10
      const batchSize = 10;
      for (let i = 0; i < eventsToImport.length; i += batchSize) {
        const batch = eventsToImport.slice(i, i + batchSize);
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/calendar/import`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              events: batch,
              source: provider
            })
          }
        );

        if (!response.ok) {
          throw new Error('Import failed');
        }

        completed += batch.length;
        setImportProgress((completed / total) * 100);
      }

      toast.success(`Successfully imported ${completed} events!`);
      onClose();
    } catch (error) {
      console.error('Failed to import events:', error);
      toast.error('Failed to import events');
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEvents.size === filteredEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(filteredEvents.map(e => e.id)));
    }
  };

  const toggleEventExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());

    // Date filter
    const eventDate = new Date(event.start);
    const now = new Date();
    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'upcoming' && eventDate > now) ||
      (dateFilter === 'past' && eventDate < now);

    // Calendar filter
    const matchesCalendar = calendarFilter.length === 0 ||
      calendarFilter.includes(event.calendarName);

    return matchesSearch && matchesDate && matchesCalendar;
  });

  // Get unique calendar names
  const uniqueCalendars = Array.from(new Set(events.map(e => e.calendarName)));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProviderName = () => {
    return provider === 'google_calendar' ? 'Google Calendar' : 'Outlook Calendar';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-950 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Import from {getProviderName()}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Select events to import into your SyncScript calendar
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
            <p className="text-gray-400">Loading calendar events...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-900 border-gray-800 text-white"
                  />
                </div>
              </div>

              {/* Date filter */}
              <div className="flex gap-2">
                {(['all', 'upcoming', 'past'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={dateFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateFilter(filter)}
                    className={dateFilter === filter ? 'bg-blue-600' : 'bg-gray-900 border-gray-800'}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Calendar filter */}
            {uniqueCalendars.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <Filter className="w-4 h-4 text-gray-500 mt-1" />
                {uniqueCalendars.map((calendar) => (
                  <Badge
                    key={calendar}
                    variant={calendarFilter.includes(calendar) ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      calendarFilter.includes(calendar)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      if (calendarFilter.includes(calendar)) {
                        setCalendarFilter(calendarFilter.filter(c => c !== calendar));
                      } else {
                        setCalendarFilter([...calendarFilter, calendar]);
                      }
                    }}
                  >
                    {calendar}
                  </Badge>
                ))}
              </div>
            )}

            {/* Select all */}
            <div className="flex items-center justify-between py-2 px-4 bg-gray-900 rounded-lg border border-gray-800">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedEvents.size === filteredEvents.length && filteredEvents.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-gray-300">
                  {selectedEvents.size} of {filteredEvents.length} selected
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCalendarEvents}
                className="text-gray-400 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Events list */}
            <ScrollArea className="h-[400px] pr-4">
              {filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-12 h-12 text-gray-700 mb-4" />
                  <p className="text-gray-500">No events found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((event) => {
                    const isExpanded = expandedEvents.has(event.id);
                    const isSelected = selectedEvents.has(event.id);

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border rounded-lg transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600/5'
                            : 'border-gray-800 bg-gray-900/50'
                        }`}
                      >
                        <div className="flex items-start gap-3 p-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleEventSelection(event.id)}
                            className="mt-1"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-white mb-1">{event.title}</h4>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(event.start)}
                                  </span>
                                  {event.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {event.location}
                                    </span>
                                  )}
                                  {event.attendees && event.attendees.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {event.attendees.length} attendees
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-700 text-xs">
                                  {event.calendarName}
                                </Badge>
                                {event.recurring && (
                                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                                    Recurring
                                  </Badge>
                                )}
                                {event.description && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleEventExpanded(event.id)}
                                    className="text-gray-400 hover:text-white h-6 w-6 p-0"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Expanded details */}
                            <AnimatePresence>
                              {isExpanded && event.description && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="mt-3 pt-3 border-t border-gray-800"
                                >
                                  <p className="text-sm text-gray-400">{event.description}</p>
                                  {event.attendees && event.attendees.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-500 mb-1">Attendees:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {event.attendees.map((attendee, idx) => (
                                          <Badge key={idx} variant="outline" className="bg-gray-800/50 text-gray-400 border-gray-700 text-xs">
                                            {attendee}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Import progress */}
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Importing events...</span>
                  <span className="text-white font-medium">{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <div className="text-sm text-gray-400">
                {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={importing}
                  className="bg-gray-900 border-gray-800 text-white hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selectedEvents.size === 0 || importing}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import {selectedEvents.size} Event{selectedEvents.size !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}