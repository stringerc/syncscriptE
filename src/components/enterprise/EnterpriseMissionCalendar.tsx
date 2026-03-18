import { useMemo, useState } from 'react';
import { addDays, addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';

type CalendarView = 'day' | 'week' | 'month' | 'timeline';

interface SchedulerItem {
  id: string;
  title: string;
  agent: string;
  plannedFor: string;
  status: string;
}

interface EnterpriseMissionCalendarProps {
  items: SchedulerItem[];
}

export function EnterpriseMissionCalendar({ items }: EnterpriseMissionCalendarProps) {
  const [view, setView] = useState<CalendarView>('day');
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());

  const dayItems = useMemo(
    () =>
      items
        .filter((item) => isSameDay(new Date(item.plannedFor), anchorDate))
        .sort((a, b) => new Date(a.plannedFor).getTime() - new Date(b.plannedFor).getTime()),
    [items, anchorDate]
  );

  const weekStart = useMemo(() => startOfWeek(anchorDate, { weekStartsOn: 1 }), [anchorDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, idx) => addDays(weekStart, idx)), [weekStart]);
  const monthDays = useMemo(() => eachDayOfInterval({ start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) }), [anchorDate]);
  const timelineItems = useMemo(
    () =>
      items
        .slice()
        .sort((a, b) => new Date(a.plannedFor).getTime() - new Date(b.plannedFor).getTime()),
    [items]
  );

  const moveAnchor = (delta: number) => {
    if (view === 'month') {
      setAnchorDate((prev) => addMonths(prev, delta));
      return;
    }
    if (view === 'week') {
      setAnchorDate((prev) => addDays(prev, delta * 7));
      return;
    }
    setAnchorDate((prev) => addDays(prev, delta));
  };

  const anchorLabel = useMemo(() => {
    if (view === 'month') return format(anchorDate, 'MMMM yyyy');
    if (view === 'week') return `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d')}`;
    return format(anchorDate, 'EEEE, MMM d');
  }, [anchorDate, view, weekDays]);

  return (
    <div className="rounded-xl border border-gray-800 bg-[#1e2128] p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-white">Mission Schedule</h4>
        <Tabs value={view} onValueChange={(value) => setView(value as CalendarView)}>
          <TabsList className="h-8">
            <TabsTrigger value="day" className="text-xs px-2">Day</TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-2">Week</TabsTrigger>
            <TabsTrigger value="month" className="text-xs px-2">Month</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs px-2">Timeline</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-md border border-gray-700 bg-[#252830] px-2 py-1.5">
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-gray-300" onClick={() => moveAnchor(-1)}>
          Prev
        </Button>
        <p className="text-xs text-gray-300">{anchorLabel}</p>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-gray-300" onClick={() => setAnchorDate(new Date())}>
            Today
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-gray-300" onClick={() => moveAnchor(1)}>
            Next
          </Button>
        </div>
      </div>

      {view === 'day' && (
        <div className="space-y-2">
          {dayItems.length === 0 && <p className="text-xs text-gray-500">No scheduled actions today.</p>}
          {dayItems.map((item) => (
            <div key={item.id} className="rounded-md border border-gray-700 bg-[#252830] px-3 py-2">
              <p className="text-sm text-white">{item.title}</p>
              <p className="text-xs text-gray-400">{format(new Date(item.plannedFor), 'h:mm a')} - {item.agent}</p>
            </div>
          ))}
        </div>
      )}

      {view === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayCount = items.filter((item) => isSameDay(new Date(item.plannedFor), day)).length;
            return (
              <div key={day.toISOString()} className="rounded-md border border-gray-700 bg-[#252830] px-2 py-3">
                <p className="text-[11px] text-gray-300">{format(day, 'EEE')}</p>
                <p className="text-sm text-white">{format(day, 'd')}</p>
                <p className="text-[11px] text-cyan-300 mt-1">{dayCount} scheduled</p>
              </div>
            );
          })}
        </div>
      )}

      {view === 'month' && (
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day) => {
            const dayCount = items.filter((item) => isSameDay(new Date(item.plannedFor), day)).length;
            return (
              <div key={day.toISOString()} className="rounded border border-gray-700 bg-[#252830] h-16 p-1">
                <p className="text-[10px] text-gray-300">{format(day, 'd')}</p>
                {dayCount > 0 && <p className="text-[10px] text-emerald-300">{dayCount} jobs</p>}
              </div>
            );
          })}
        </div>
      )}

      {view === 'timeline' && (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {timelineItems.length === 0 && <p className="text-xs text-gray-500">No timeline events yet.</p>}
          {timelineItems.map((item) => (
              <div key={item.id} className="rounded-md border border-gray-700 bg-[#252830] px-3 py-2">
                <p className="text-sm text-white">{item.title}</p>
                <p className="text-xs text-gray-400">{format(new Date(item.plannedFor), 'MMM d, h:mm a')} - {item.agent}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
