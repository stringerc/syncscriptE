/**
 * Matches calendar events to day-level forecast risk.
 * Heuristics: virtual meetings are low-sensitivity; outdoor, travel, and on-site work flag as weather-exposed.
 */

import type { Event } from './event-task-types';

export type WeatherRiskLevel = 'none' | 'low' | 'moderate' | 'high';

export interface ForecastDaySlice {
  dateKey: string;
  weekdayShort: string;
  monthDay: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  description: string;
  icon: string;
  pop: number;
  windMax?: number;
}

export interface EventWeatherConflict {
  eventId: string;
  title: string;
  severity: 'low' | 'moderate' | 'high';
  reason: string;
}

export interface DayOutlookRow {
  dateKey: string;
  weekdayShort: string;
  monthDay: string;
  weather: ForecastDaySlice;
  events: Pick<Event, 'id' | 'title' | 'startTime' | 'endTime'>[];
  conflicts: EventWeatherConflict[];
}

const VIRTUAL_HINT =
  /(zoom|teams meeting|google meet|virtual\b|webinar|online only|\bremote\b|live stream|stream only)/i;

const OUTDOOR_OR_TRAVEL_HINT =
  /(outdoor|site visit|field trip|hike|trail|golf|stadium|park picnic|soccer|football game|tennis|wedding|beach|marathon|\b5k\b|festival|fair\b|patio|terrace|bbq|barbecue|commute|drive to|flight|airport|train to|road trip|client visit|on-?site|delivery route|photo shoot|photoshoot)/i;

export function eventIsWeatherSensitive(
  event: Pick<Event, 'title' | 'description' | 'location'>,
): boolean {
  const text = [event.title, event.description ?? '', event.location ?? ''].join(' ').toLowerCase();
  if (VIRTUAL_HINT.test(text)) return false;
  return OUTDOOR_OR_TRAVEL_HINT.test(text);
}

function conditionLower(c: string): string {
  return c.toLowerCase();
}

/** Day-level risk from aggregated OpenWeather-style fields (imperial wind mph). */
export function dayWeatherRiskLevel(day: ForecastDaySlice): WeatherRiskLevel {
  const c = conditionLower(day.condition);
  const desc = conditionLower(day.description);
  const pop = day.pop;
  const wind = day.windMax ?? 0;
  const hi = day.tempMax;
  const lo = day.tempMin;

  if (c.includes('thunder') || desc.includes('thunder')) return 'high';
  if ((c.includes('snow') || c.includes('sleet')) && pop >= 0.25) return 'high';
  if (pop >= 0.75 && (c.includes('rain') || c.includes('drizzle'))) return 'high';
  if (wind >= 35) return 'high';
  if (hi >= 98 || lo <= 15) return 'high';

  if (pop >= 0.5 && (c.includes('rain') || c.includes('drizzle'))) return 'moderate';
  if (c.includes('snow') || c.includes('sleet')) return 'moderate';
  if (hi >= 92 || (lo <= 28 && lo > 15)) return 'moderate';
  if (wind >= 25) return 'moderate';

  if (pop >= 0.35 && (c.includes('rain') || c.includes('drizzle'))) return 'low';
  if (hi >= 88 || lo <= 32) return 'low';
  if (wind >= 18) return 'low';

  return 'none';
}

function buildConflictReason(day: ForecastDaySlice, risk: WeatherRiskLevel): string {
  const parts: string[] = [];
  const c = conditionLower(day.condition);
  if (c.includes('thunder')) parts.push('Thunderstorms in the forecast');
  else if (c.includes('snow') || c.includes('sleet')) parts.push('Wintry conditions expected');
  else if (c.includes('rain') || c.includes('drizzle')) {
    parts.push(`Rain risk (${Math.round(day.pop * 100)}% max precip chance)`);
  } else if (day.pop >= 0.45) {
    parts.push(`${Math.round(day.pop * 100)}% chance of precipitation`);
  }
  if (day.tempMax >= 92) parts.push(`High heat (${day.tempMax}°F peak)`);
  if (day.tempMin <= 32) parts.push(`Cold snap (low ${day.tempMin}°F)`);
  if ((day.windMax ?? 0) >= 25) parts.push(`Gusty winds (up to ${day.windMax} mph)`);

  const head = parts.length ? parts.join(' • ') : `${day.condition} that day`;
  if (risk === 'high') return `${head} — may disrupt outdoor or travel plans.`;
  if (risk === 'moderate') return `${head} — worth a backup plan for exposed plans.`;
  return `${head} — minor impact possible.`;
}

export function conflictSeverityFromRisk(risk: WeatherRiskLevel): 'low' | 'moderate' | 'high' | null {
  if (risk === 'none') return null;
  return risk;
}

export function buildWeekOutlookRows(
  daily: ForecastDaySlice[],
  allEvents: Event[],
): DayOutlookRow[] {
  return daily.map((weather) => {
    const [y, m, d] = weather.dateKey.split('-').map(Number);
    const dayStart = new Date(y, m - 1, d).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const events = allEvents.filter((e) => {
      const start = new Date(e.startTime).getTime();
      const end = new Date(e.endTime).getTime();
      return start < dayEnd && end > dayStart;
    });

    const dayRisk = dayWeatherRiskLevel(weather);
    const conflicts: EventWeatherConflict[] = [];

    for (const e of events) {
      if (!eventIsWeatherSensitive(e)) continue;
      const sev = conflictSeverityFromRisk(dayRisk);
      if (!sev) continue;
      conflicts.push({
        eventId: e.id,
        title: e.title,
        severity: sev,
        reason: buildConflictReason(weather, dayRisk),
      });
    }

    const sevOrder: Record<EventWeatherConflict['severity'], number> = {
      high: 0,
      moderate: 1,
      low: 2,
    };
    conflicts.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

    return {
      dateKey: weather.dateKey,
      weekdayShort: weather.weekdayShort,
      monthDay: weather.monthDay,
      weather,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime,
      })),
      conflicts,
    };
  });
}
