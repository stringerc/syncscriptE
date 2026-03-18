/**
 * useCalendarEvents Hook
 * 
 * Provides access to calendar events from the centralized store
 * This is a convenience hook that wraps the events context/store
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { sampleCalendarEvents } from '../data/sample-calendar-events';
import { Event } from '../utils/event-task-types';
import { checklistTracking } from '../components/onboarding/checklist-tracking';
import { emitContractDomainEvent } from '../contracts/runtime/contract-runtime';
import { LocalScheduleCommandAdapter } from '../contracts/adapters/local-schedule-command-adapter';
import type { ContractCommandContext } from '../contracts/core/command-contract';
import { syncShadowScheduleProjection } from '../contracts/runtime/backend-projection-mirror';
import {
  executeAuthorityRoutedCommand,
} from '../contracts/runtime/backend-authority-routing';

const STORAGE_KEY = 'syncscript_calendar_events';

function toValidDate(value: unknown, fallback: Date): Date {
  const parsed = value instanceof Date ? value : new Date(value as any);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function normalizeEvent(event: Event): Event {
  const now = new Date();
  return {
    ...event,
    startTime: toValidDate((event as any).startTime, now),
    endTime: toValidDate((event as any).endTime, new Date(now.getTime() + 60 * 60 * 1000)),
    createdAt: toValidDate((event as any).createdAt, now),
    updatedAt: toValidDate((event as any).updatedAt, now),
    tasks: (event.tasks || []).map((task) => ({
      ...task,
      dueDate: task.dueDate ? toValidDate(task.dueDate as any, now) : task.dueDate,
      createdAt: toValidDate((task as any).createdAt, now),
      updatedAt: toValidDate((task as any).updatedAt, now),
      scheduledTime: task.scheduledTime
        ? toValidDate(task.scheduledTime as any, now)
        : task.scheduledTime,
    })),
  };
}

function loadPersistedEvents(): Event[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map((event) => normalizeEvent(event as Event));
      }
    }
  } catch {
    // Corrupted data — fall through to defaults
  }
  return sampleCalendarEvents.map((event) => normalizeEvent(event));
}

function resolveActorId(): string {
  if (typeof window === 'undefined') return 'system';
  return (
    window.localStorage.getItem('syncscript_auth_user_id') ||
    window.localStorage.getItem('auth_user_id') ||
    'system'
  );
}

function buildCommandContext(): ContractCommandContext {
  return {
    workspaceId: 'workspace-main',
    actorType: 'human',
    actorId: resolveActorId(),
    routeContext: 'calendar-events-hook',
  };
}

export function useCalendarEvents() {
  const [events, setEvents] = useState<Event[]>(loadPersistedEvents);
  const isInitialMount = useRef(true);
  const eventsRef = useRef<Event[]>(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const scheduleCommandAdapter = useMemo(
    () =>
      new LocalScheduleCommandAdapter(
        () => eventsRef.current,
        (updater) => {
          setEvents((prev) => updater(prev));
        },
      ),
    [],
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Storage full or unavailable — silent fail
    }
  }, [events]);

  useEffect(() => {
    void syncShadowScheduleProjection(events as Array<Record<string, unknown>>).catch(() => {
      // Shadow reads are non-authoritative in Batch 1; never block calendar updates.
    });
  }, [events]);
  
  /**
   * Get events for a specific date
   */
  const getEventsForDate = useCallback((year: number, month: number, day: number): Event[] => {
    const targetDate = new Date(year, month, day);
    const targetStart = targetDate.getTime();
    const targetEnd = targetStart + 24 * 60 * 60 * 1000; // Next day
    
    return events.filter(event => {
      const eventStart = new Date(event.startTime).getTime();
      const eventEnd = new Date(event.endTime).getTime();
      
      // Check if event overlaps with this day
      return (eventStart < targetEnd && eventEnd > targetStart);
    });
  }, [events]);
  
  /**
   * Get all events for a specific month
   */
  const getEventsForMonth = useCallback((year: number, month: number): Event[] => {
    const monthStart = new Date(year, month, 1).getTime();
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
    
    return events.filter(event => {
      const eventStart = new Date(event.startTime).getTime();
      const eventEnd = new Date(event.endTime).getTime();
      
      // Check if event overlaps with this month
      return (eventStart <= monthEnd && eventEnd >= monthStart);
    });
  }, [events]);
  
  /**
   * Update an event in the store
   */
  const updateEvent = useCallback((eventId: string, updates: Partial<Event>) => {
    void executeAuthorityRoutedCommand({
      domain: 'schedule',
      commandType: 'schedule.event.update',
      workspaceId: 'workspace-main',
      payload: {
        eventId,
        updates: updates as Record<string, unknown>,
      },
      runLocal: () =>
        scheduleCommandAdapter.updateEvent(buildCommandContext(), {
          eventId,
          updates: updates as any,
        }),
    }).then((result) => {
      if (!result.ok) {
        setEvents(prevEvents =>
          prevEvents.map(event =>
            event.id === eventId ? { ...event, ...updates } : event,
          ),
        );
      }
    });
    emitContractDomainEvent('schedule.event.updated', 'event', eventId, {
      patch: updates as Record<string, unknown>,
    });
  }, [scheduleCommandAdapter]);
  
  /**
   * Add a new event to the store
   */
  const addEvent = useCallback((event: Event) => {
    const startIso = event.startTime instanceof Date ? event.startTime.toISOString() : String(event.startTime);
    const endIso = event.endTime instanceof Date ? event.endTime.toISOString() : String(event.endTime);
    void executeAuthorityRoutedCommand({
      domain: 'schedule',
      commandType: 'schedule.event.create',
      workspaceId: 'workspace-main',
      payload: {
        eventId: String(event.id),
        title: event.title,
        startsAt: startIso,
        endsAt: endIso,
        linkedTaskIds: Array.isArray(event.tasks) ? event.tasks.map(task => task.id) : [],
      },
      runLocal: () =>
        scheduleCommandAdapter.createEvent(buildCommandContext(), {
          event: {
            // Keep local schedule parity fields alongside contract payload.
            id: String(event.id),
            entityKind: 'event',
            entityId: String(event.id),
            workspaceId: 'workspace-main',
            version: 1,
            createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : new Date().toISOString(),
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            startsAt: startIso,
            endsAt: endIso,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            scheduleStatus: event.completed ? 'completed' : 'scheduled',
            sourceTaskId: String((event as any)?.createdFromTaskId || '').trim() || undefined,
            sourceGoalId: String((event as any)?.linkedGoalId || '').trim() || undefined,
            createdFromTaskId: String((event as any)?.createdFromTaskId || '').trim() || undefined,
            linkedGoalId: String((event as any)?.linkedGoalId || '').trim() || undefined,
            tasks: Array.isArray(event.tasks) ? event.tasks : [],
            linkedTaskIds: Array.isArray(event.tasks) ? event.tasks.map((task) => task.id) : [],
          },
        }),
    }).then((result) => {
      if (!result.ok) {
        setEvents(prevEvents => [...prevEvents, event]);
      }
    });
    emitContractDomainEvent('schedule.event.created', 'event', String(event.id), {
      title: event.title,
      startTime: startIso,
      endTime: endIso,
      linkedTaskIds: Array.isArray(event.tasks) ? event.tasks.map(task => task.id) : [],
    });
    try { checklistTracking.completeItem('event'); } catch {}
  }, [scheduleCommandAdapter]);
  
  /**
   * Delete an event from the store
   */
  const deleteEvent = useCallback((eventId: string) => {
    void executeAuthorityRoutedCommand({
      domain: 'schedule',
      commandType: 'schedule.event.delete',
      workspaceId: 'workspace-main',
      payload: { eventId },
      runLocal: () => scheduleCommandAdapter.deleteEvent(buildCommandContext(), { eventId }),
    }).then((result) => {
      if (!result.ok) {
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      }
    });
    emitContractDomainEvent('schedule.event.deleted', 'event', eventId, {
      deletedAt: new Date().toISOString(),
    });
  }, [scheduleCommandAdapter]);
  
  /**
   * Bulk update events (replace entire array)
   */
  const bulkUpdateEvents = useCallback((newEvents: Event[]) => {
    setEvents(newEvents);
  }, []);
  
  return {
    events,
    loading: false,
    error: null,
    getEventsForDate,
    getEventsForMonth,
    updateEvent,
    addEvent,
    deleteEvent,
    bulkUpdateEvents
  };
}