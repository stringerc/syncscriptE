-- Enable Supabase Realtime postgres_changes broadcasts on the existing
-- event_outbox table. The table already has an RLS policy
-- "event_outbox_read_own" that scopes SELECT to the row's user_id, so
-- adding it to supabase_realtime publishes only the rows the subscriber
-- can read — Supabase enforces RLS on Realtime broadcasts the same way it
-- does on regular SELECTs.
--
-- Why event_outbox specifically: every domain mutation already lands here
-- (task.created, task.updated, document.created, invoice.paid, etc.).
-- Subscribing the client to its own user_id rows gives multi-device sync
-- for free without a new "broadcast channel" table.

DO $$
BEGIN
  -- Idempotent: skip if already added.
  IF NOT EXISTS (
    SELECT 1
      FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'event_outbox'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.event_outbox';
  END IF;
END $$;

-- We DON'T add webhook_deliveries / agent_run_steps to the publication —
-- both already have direct subscriptions in the app code (`useAgentRunDetail`,
-- the dispatcher). Keep the publication minimal so postgres replication
-- traffic stays small.

COMMENT ON TABLE public.event_outbox IS
  'Authoritative domain event stream. Reads are RLS-scoped to user_id; subscribed via supabase_realtime for multi-device task/calendar sync.';
