/**
 * CalendarImportSelector Component
 * 
 * Import events from connected calendar services (Google Calendar, Outlook, etc.).
 * Shows connected calendar icons and import modal.
 */

import { useState } from 'react';
import { Plus, Download, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';

interface CalendarSource {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  calendars?: CalendarOption[];
}

interface CalendarOption {
  id: string;
  name: string;
  color: string;
  eventCount: number;
}

const CALENDAR_SOURCES: CalendarSource[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    icon: 'https://www.google.com/calendar/images/ext/gc_button1_en.gif',
    connected: true,
    calendars: [
      { id: '1', name: 'Work', color: '#4285f4', eventCount: 24 },
      { id: '2', name: 'Personal', color: '#ea4335', eventCount: 12 },
      { id: '3', name: 'Family', color: '#34a853', eventCount: 8 },
    ],
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    icon: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b',
    connected: true,
    calendars: [
      { id: '4', name: 'Work Calendar', color: '#0078d4', eventCount: 18 },
    ],
  },
  {
    id: 'apple-calendar',
    name: 'Apple Calendar',
    icon: 'https://help.apple.com/assets/63D9970A1F09271B64379626/63D9970B1F09271B64379633/en_US/a1f94468b2f5651c665ab1ad58f928b9.png',
    connected: false,
  },
];

interface CalendarImportSelectorProps {
  onImport: (events: any[]) => void;
}

export function CalendarImportSelector({ onImport }: CalendarImportSelectorProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<CalendarSource | null>(null);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const connectedSources = CALENDAR_SOURCES.filter(s => s.connected);

  const handleSourceClick = (source: CalendarSource) => {
    if (!source.connected) {
      toast.info(`Connect ${source.name}`, {
        description: 'Go to Settings > Integrations to connect',
      });
      return;
    }
    setSelectedSource(source);
    setShowImportModal(true);
  };

  const handleImport = async () => {
    if (selectedCalendars.length === 0) {
      toast.error('Please select at least one calendar');
      return;
    }

    setIsImporting(true);

    // Mock import delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock imported events
    const selectedCals = selectedSource?.calendars?.filter(c => 
      selectedCalendars.includes(c.id)
    ) || [];

    const totalEvents = selectedCals.reduce((sum, cal) => sum + cal.eventCount, 0);

    const mockEvents = Array.from({ length: totalEvents }, (_, i) => ({
      id: `imported-${Date.now()}-${i}`,
      title: `Imported Event ${i + 1}`,
      startTime: new Date(Date.now() + Math.random() * 7 * 86400000),
      endTime: new Date(Date.now() + Math.random() * 7 * 86400000 + 3600000),
      eventType: ['work', 'social', 'personal'][Math.floor(Math.random() * 3)],
      importedFrom: selectedSource?.name,
      tags: ['Imported', selectedSource?.name || ''],
    }));

    onImport(mockEvents);

    toast.success(`Imported ${totalEvents} events`, {
      description: `From ${selectedCals.length} calendar${selectedCals.length > 1 ? 's' : ''}`,
    });

    setIsImporting(false);
    setShowImportModal(false);
    setSelectedSource(null);
    setSelectedCalendars([]);
  };

  const toggleCalendar = (calendarId: string) => {
    setSelectedCalendars(prev => 
      prev.includes(calendarId) 
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  const selectAll = () => {
    const allIds = selectedSource?.calendars?.map(c => c.id) || [];
    setSelectedCalendars(allIds);
  };

  const deselectAll = () => {
    setSelectedCalendars([]);
  };

  return (
    <>
      {/* Connected Calendar Icons + Import Button */}
      <div className="flex items-center gap-2">
        {/* Connected Calendar Icons */}
        <div className="flex items-center gap-1">
          {connectedSources.map((source) => (
            <button
              key={source.id}
              onClick={() => handleSourceClick(source)}
              className="w-8 h-8 rounded-lg bg-[#252830] border border-gray-700 hover:border-teal-600 transition-colors flex items-center justify-center p-1 group"
              title={`Import from ${source.name}`}
            >
              <Calendar className="w-5 h-5 text-gray-400 group-hover:text-teal-400 transition-colors" />
            </button>
          ))}
        </div>

        {/* Plus Button for General Import */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImportModal(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Import Events
        </Button>
      </div>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="bg-[#1e2128] border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Import Calendar Events</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose calendars to import events from
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Source Selection */}
            {!selectedSource ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Select a calendar source:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CALENDAR_SOURCES.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => handleSourceClick(source)}
                      disabled={!source.connected}
                      className={`flex items-center gap-4 p-4 bg-[#252830] border rounded-lg transition-colors ${
                        source.connected
                          ? 'border-gray-700 hover:border-teal-600 group'
                          : 'border-gray-800 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Calendar className="w-10 h-10 text-gray-400 group-hover:text-teal-400 transition-colors" />
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{source.name}</p>
                        <p className="text-xs text-gray-400">
                          {source.connected ? `${source.calendars?.length || 0} calendars` : 'Not connected'}
                        </p>
                      </div>
                      {source.connected ? (
                        <Badge variant="outline" className="border-teal-600 text-teal-400">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-700 text-gray-500">
                          Disconnected
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Back to source selection */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedSource(null);
                        setSelectedCalendars([]);
                      }}
                      className="text-teal-400 hover:text-teal-300 text-sm"
                    >
                      ← Back to sources
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAll}>
                      Deselect All
                    </Button>
                  </div>
                </div>

                {/* Calendar List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedSource.calendars?.map((calendar) => (
                    <motion.div
                      key={calendar.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-3 p-4 bg-[#252830] border rounded-lg transition-colors ${
                        selectedCalendars.includes(calendar.id)
                          ? 'border-teal-600 bg-teal-600/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <Checkbox
                        checked={selectedCalendars.includes(calendar.id)}
                        onCheckedChange={() => toggleCalendar(calendar.id)}
                        className="mt-1"
                      />
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: calendar.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">{calendar.name}</p>
                        <p className="text-xs text-gray-400">
                          {calendar.eventCount} events
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Selection Summary */}
                <div className="flex items-center justify-between p-3 bg-[#252830] border border-gray-700 rounded-lg">
                  <span className="text-sm text-gray-400">
                    {selectedCalendars.length} calendar{selectedCalendars.length !== 1 ? 's' : ''} selected
                    {selectedCalendars.length > 0 && (
                      <span className="ml-2 text-teal-400">
                        ({selectedSource.calendars
                          ?.filter(c => selectedCalendars.includes(c.id))
                          .reduce((sum, c) => sum + c.eventCount, 0)} events)
                      </span>
                    )}
                  </span>
                  <Button
                    onClick={handleImport}
                    disabled={selectedCalendars.length === 0 || isImporting}
                    className="bg-gradient-to-r from-teal-600 to-cyan-600"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Import Selected
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
