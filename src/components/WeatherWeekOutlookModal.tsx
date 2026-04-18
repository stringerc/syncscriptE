import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CloudSun, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import type { DayOutlookRow } from '../utils/weather-event-conflicts';

function formatEventTime(d: Date): string {
  try {
    return new Date(d).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/** Smaller OWM icon URL — fits 7-across layout on narrow modals */
function weatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}.png`;
}

function shortForecastLabel(condition: string, description: string): string {
  const d = (description || condition || '').trim();
  if (!d) return condition || '—';
  if (d.length <= 12) return d;
  return `${d.slice(0, 11)}…`;
}

interface WeatherWeekOutlookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationLabel: string;
  demo: boolean;
  rows: DayOutlookRow[];
  onOpenConflictDetails?: () => void;
}

export function WeatherWeekOutlookModal({
  open,
  onOpenChange,
  locationLabel,
  demo,
  rows,
  onOpenConflictDetails,
}: WeatherWeekOutlookModalProps) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setSelectedDateKey(null);
  }, [open]);

  const conflictDayCount = rows.filter((r) => r.conflicts.length > 0).length;
  const selectedRow = selectedDateKey
    ? rows.find((r) => r.dateKey === selectedDateKey)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100%-0.75rem)] max-w-[min(98vw,52rem)] gap-0 overflow-hidden border border-sky-500/20 bg-gradient-to-b from-[#0a1628] via-[#0d1b2e] to-[#0a1628] p-0 text-gray-100 shadow-2xl shadow-sky-950/50 sm:max-w-[min(98vw,52rem)]"
      >
        <div className="border-b border-sky-500/15 bg-gradient-to-r from-sky-950/50 via-blue-950/40 to-indigo-950/50 px-4 py-3 pr-12 sm:px-5 sm:py-4">
          <DialogHeader className="gap-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-white sm:text-xl">
                <CloudSun className="h-5 w-5 shrink-0 text-sky-400 sm:h-6 sm:w-6" />
                Week ahead
              </DialogTitle>
              {demo && (
                <Badge
                  variant="outline"
                  className="border-amber-400/35 text-[10px] uppercase tracking-wide text-amber-200/85"
                >
                  Demo
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-sky-200/70 sm:text-sm">
              {locationLabel}
              {conflictDayCount > 0 ? (
                <span className="text-amber-200/90">
                  {' '}
                  · {conflictDayCount} day{conflictDayCount === 1 ? '' : 's'} with ! — tap that day
                  for calendar details
                </span>
              ) : null}
            </DialogDescription>
            {conflictDayCount > 0 && (
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-amber-200/75 sm:text-[11px]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
                <span>! = possible weather impact on something you scheduled.</span>
              </p>
            )}
          </DialogHeader>
        </div>

        {/* Single horizontal row: Mon → Sun style, left to right */}
        <div className="relative z-10 px-2 py-2 sm:px-4 sm:py-3">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Sparkles className="h-9 w-9 text-sky-400/50" />
              <p className="text-sm text-sky-200/60">Forecast is not available yet.</p>
            </div>
          ) : (
            <div
              className="relative z-10 w-full overflow-hidden rounded-xl border border-sky-500/25 bg-sky-950/40 shadow-inner shadow-black/20"
              aria-label="Seven day forecast, left to right"
            >
              {/* gap-px + bg on wrapper draws vertical lines between days */}
              <div
                className="grid w-full grid-cols-7 gap-px bg-white/15"
                dir="ltr"
              >
                {rows.map((row, i) => {
                  const hasConflict = row.conflicts.length > 0;
                  const isSelected = selectedDateKey === row.dateKey;
                  const popPct = Math.round(row.weather.pop * 100);
                  const label = shortForecastLabel(
                    row.weather.condition,
                    row.weather.description,
                  );

                  return (
                    <motion.button
                      key={row.dateKey}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`${row.weekdayShort} ${row.monthDay}, ${row.weather.tempMax} high, ${row.weather.tempMin} low, ${label}${hasConflict ? ', calendar alert' : ''}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025, duration: 0.18 }}
                      onClick={() =>
                        setSelectedDateKey((k) => (k === row.dateKey ? null : row.dateKey))
                      }
                      className={[
                        'relative flex min-h-[128px] min-w-0 flex-col items-center border-0 bg-[#070f1a] px-0.5 py-2 text-center transition-colors sm:min-h-[148px] sm:px-1 sm:py-2.5',
                        isSelected
                          ? 'ring-2 ring-inset ring-sky-400/70 bg-sky-950/80'
                          : 'hover:bg-sky-950/50',
                      ].join(' ')}
                    >
                      <div className="relative flex w-full flex-col items-center">
                        {hasConflict && (
                          <span
                            className="absolute -right-0.5 -top-0.5 z-[2] flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold leading-none text-amber-950 shadow-sm sm:h-5 sm:w-5 sm:text-[10px]"
                            title="Calendar weather note — tap"
                            aria-hidden
                          >
                            !
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase leading-tight tracking-wide text-sky-100 sm:text-[11px]">
                          {row.weekdayShort}
                        </span>
                        <span className="text-[9px] leading-tight text-sky-400/70 sm:text-[10px]">
                          {row.monthDay}
                        </span>
                        <img
                          src={weatherIconUrl(row.weather.icon)}
                          alt=""
                          width={40}
                          height={40}
                          className="my-0.5 h-8 w-8 shrink-0 sm:my-1 sm:h-10 sm:w-10"
                          loading="lazy"
                        />
                        <p
                          className="mb-0.5 line-clamp-2 min-h-[1.75rem] w-full px-0.5 text-[8px] font-medium capitalize leading-tight text-sky-200/85 sm:min-h-[2rem] sm:text-[9px]"
                          title={row.weather.description || row.weather.condition}
                        >
                          {label}
                        </p>
                        <span className="text-sm font-bold tabular-nums text-white sm:text-base">
                          {row.weather.tempMax}°
                        </span>
                        <span className="text-[10px] tabular-nums text-sky-400/75 sm:text-xs">
                          {row.weather.tempMin}°
                        </span>
                        <span className="mt-0.5 min-h-[12px] text-[8px] tabular-nums text-sky-400/90 sm:text-[9px]">
                          {popPct >= 10 ? `${popPct}% rain` : '\u00a0'}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 min-h-[96px] border-t border-white/10 bg-black/25 px-3 py-2.5 sm:min-h-[108px] sm:px-5 sm:py-3">
          <AnimatePresence mode="wait">
            {!selectedRow ? (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-xs text-sky-200/50 sm:text-sm"
              >
                {rows.length === 0
                  ? null
                  : 'Tap a day below the week row for events and any calendar alerts.'}
              </motion.p>
            ) : (
              <motion.div
                key={selectedRow.dateKey}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="max-h-[26vh] overflow-y-auto sm:max-h-[200px]"
              >
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    {selectedRow.weekdayShort} · {selectedRow.monthDay}
                  </h3>
                  <p className="text-xs capitalize text-sky-300/80">
                    {selectedRow.weather.description || selectedRow.weather.condition}
                  </p>
                </div>

                {selectedRow.events.length === 0 ? (
                  <p className="text-xs text-sky-200/45">No events on the calendar this day.</p>
                ) : (
                  <ul className="mb-3 space-y-1.5">
                    {selectedRow.events.map((ev) => (
                      <li
                        key={ev.id}
                        className="flex flex-wrap items-baseline gap-x-2 text-xs text-sky-100/90"
                      >
                        <span className="font-medium">{ev.title}</span>
                        <span className="text-[10px] text-sky-400/70">
                          {formatEventTime(ev.startTime)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {selectedRow.conflicts.length > 0 && (
                  <div className="rounded-lg border border-amber-500/25 bg-amber-950/30 px-3 py-2">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-200">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      Weather vs calendar
                    </p>
                    <ul className="space-y-2">
                      {selectedRow.conflicts.map((c) => (
                        <li key={c.eventId} className="text-[11px] leading-snug text-amber-100/90">
                          <span className="font-medium text-white">{c.title}</span>
                          <span className="text-amber-200/70"> — </span>
                          {c.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {onOpenConflictDetails && (
          <div className="border-t border-white/10 bg-black/30 px-4 py-2.5 sm:px-5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full text-[11px] text-sky-300 hover:bg-sky-500/10 hover:text-sky-200"
              onClick={() => onOpenConflictDetails()}
            >
              Open conflict playbook (demo scenarios)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
