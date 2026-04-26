/**
 * User-scoped realtime event bus. Subscribes to public.event_outbox via
 * Supabase Realtime postgres_changes (RLS-scoped to user_id) and:
 *
 *   1. Invalidates relevant React Query caches when matching events arrive.
 *   2. Re-emits the existing `syncscript:task-*` CustomEvents on `window`
 *      so any already-listening component picks them up across devices,
 *      not just within the same browser tab.
 *
 * This unlocks Linear-style multi-device sync without touching protected
 * AuthContext / TasksContext code paths — both surfaces (query invalidate +
 * window event) match patterns already in the codebase.
 *
 * Mount once near the App root, inside <AuthProvider>.
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { usePageVisibility } from './usePageVisibility';

interface OutboxRow {
  id: string;
  user_id: string;
  event_type: string;
  event_key: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

const QUERY_INVALIDATIONS: Record<string, string[][]> = {
  // event_type → list of query keys to invalidate
  'task.created':                [['tasks'], ['tasks-counts']],
  'task.updated':                [['tasks'], ['tasks-counts']],
  'task.completed':              [['tasks'], ['tasks-counts'], ['gamification']],
  'note.created':                [['tasks']],
  'event.created':               [['calendar-events']],
  'event.proposed':              [['calendar-events']],
  'document.created':            [['documents']],
  'document.updated':            [['documents']],
  'invoice.sent':                [['invoices']],
  'invoice.paid':                [['invoices']],
  'invoice.overdue':             [['invoices']],
  'playbook.run.started':        [['playbook-runs']],
  'playbook.run.step.completed': [['playbook-runs']],
  'playbook.run.succeeded':      [['playbook-runs']],
  'playbook.run.failed':         [['playbook-runs']],
};

const WINDOW_EVENT_FANOUT: Record<string, string> = {
  // event_type → CustomEvent name dispatched on `window`
  'task.completed': 'syncscript:task-completed',
  'task.updated':   'syncscript:task-assignees-updated',
};

export function UserRealtimeBus(): null {
  const { user } = useAuth();
  const { visible } = usePageVisibility();
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    // While the tab is hidden, don't hold a Realtime channel — Supabase keeps
    // sockets open and routes postgres_changes even when the user can't see
    // anything change. On visibility return, this effect re-runs and reopens
    // the channel; the user re-syncs via React Query refetchOnWindowFocus.
    if (!visible) {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch { /* ignore */ }
        channelRef.current = null;
      }
      return;
    }
    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch { /* ignore */ }
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`user-bus:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_outbox',
          filter: `user_id=eq.${user.id}`,
        },
        (msg) => {
          const row = msg.new as OutboxRow;
          if (!row?.event_type) return;

          // Invalidate relevant query caches
          const keys = QUERY_INVALIDATIONS[row.event_type] || [];
          for (const k of keys) qc.invalidateQueries({ queryKey: k });

          // Re-broadcast as a window CustomEvent so existing in-tab
          // listeners (AgentProgressContext, etc.) handle multi-device events
          // without code changes.
          const winEvent = WINDOW_EVENT_FANOUT[row.event_type];
          if (winEvent) {
            try {
              window.dispatchEvent(new CustomEvent(winEvent, {
                detail: {
                  source: 'realtime',
                  eventType: row.event_type,
                  payload: row.payload || {},
                  emittedAt: row.created_at,
                },
              }));
            } catch { /* ignore */ }
          }
        },
      )
      .subscribe();
    channelRef.current = channel;

    return () => {
      try { supabase.removeChannel(channel); } catch { /* ignore */ }
      channelRef.current = null;
    };
  }, [user?.id, qc, visible]);

  return null;
}
