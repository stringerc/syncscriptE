-- Event outbox + per-user outbound webhook subscriptions (Gap #1).
-- Enables SyncScript to act as an event source that user-configured n8n / Make /
-- Zapier workflows can subscribe to on a per-user basis — without a redeploy.
--
-- Design constraints:
-- * Outbox owns event ordering + idempotency (no double-emit if a tool retries).
-- * Fanout is explicit (one row per subscription per event) so retries / DLQ
--   are per-subscriber, not per-event.
-- * Dispatcher claims rows with FOR UPDATE SKIP LOCKED so multiple workers /
--   pg_cron overlaps cannot double-deliver.
-- * RLS lets users manage their own subscriptions + read their own delivery
--   history; service_role reserved for the Edge dispatcher.

-- ---------------------------------------------------------------------------
-- 1. event_outbox — append-only log of events that happened inside SyncScript.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_outbox (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,
  /** Idempotency: (user_id, event_type, event_key) — if set, duplicate inserts are dropped silently via ON CONFLICT. */
  event_key    TEXT,
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  /** Set by fanout step; NULL => not yet exploded into webhook_deliveries. */
  fanout_at    TIMESTAMPTZ,
  /** Set when every delivery is terminal (delivered / dlq) or there are no subscribers. */
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_event_outbox_pending_fanout
  ON public.event_outbox (created_at)
  WHERE fanout_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_event_outbox_user_type
  ON public.event_outbox (user_id, event_type, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_outbox_idempotency
  ON public.event_outbox (user_id, event_type, event_key)
  WHERE event_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. webhook_subscriptions — per-user URLs to fan events out to.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  label                TEXT,
  url                  TEXT NOT NULL CHECK (url ~ '^https?://'),
  /** HMAC-SHA256 key, base64/hex, never returned to client after creation. */
  secret               TEXT NOT NULL,
  /** Empty array = deliver every event. Otherwise must include the event_type. */
  event_types          TEXT[] NOT NULL DEFAULT '{}',
  active               BOOLEAN NOT NULL DEFAULT true,
  consecutive_failures INT NOT NULL DEFAULT 0,
  disabled_reason      TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_delivery_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_subs_user_active
  ON public.webhook_subscriptions (user_id)
  WHERE active;

-- ---------------------------------------------------------------------------
-- 3. webhook_deliveries — per-subscription-per-event attempt ledger.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id        UUID NOT NULL REFERENCES public.webhook_subscriptions (id) ON DELETE CASCADE,
  event_id               UUID NOT NULL REFERENCES public.event_outbox (id) ON DELETE CASCADE,
  status                 TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'failed', 'dlq')),
  attempt                INT  NOT NULL DEFAULT 0,
  next_attempt_at        TIMESTAMPTZ,
  response_status        INT,
  response_body_excerpt  TEXT,
  last_error             TEXT,
  claimed_at             TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_due
  ON public.webhook_deliveries (next_attempt_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event
  ON public.webhook_deliveries (event_id);

-- ---------------------------------------------------------------------------
-- 4. updated_at touches
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_webhook_delivery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_webhook_deliveries_updated ON public.webhook_deliveries;
CREATE TRIGGER trg_webhook_deliveries_updated
  BEFORE UPDATE ON public.webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.touch_webhook_delivery_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Fanout + claim RPCs (service_role only; dispatcher calls these)
-- ---------------------------------------------------------------------------

/**
 * Fanout: expands outbox events into webhook_deliveries rows.
 * Returns count of events exploded. Skips rows currently locked by another
 * worker, so safe to run concurrently.
 */
CREATE OR REPLACE FUNCTION public.fanout_event_outbox(batch_n INT DEFAULT 50)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ev            RECORD;
  sub_count     INT;
  exploded_count INT := 0;
BEGIN
  FOR ev IN
    SELECT id, user_id, event_type
      FROM public.event_outbox
     WHERE fanout_at IS NULL
     ORDER BY created_at ASC
     LIMIT batch_n
     FOR UPDATE SKIP LOCKED
  LOOP
    INSERT INTO public.webhook_deliveries (subscription_id, event_id, status, next_attempt_at)
    SELECT s.id, ev.id, 'pending', now()
      FROM public.webhook_subscriptions s
     WHERE s.active
       AND s.user_id = ev.user_id
       AND (cardinality(s.event_types) = 0 OR ev.event_type = ANY (s.event_types))
    ON CONFLICT (subscription_id, event_id) DO NOTHING;

    GET DIAGNOSTICS sub_count = ROW_COUNT;

    UPDATE public.event_outbox
       SET fanout_at    = now(),
           completed_at = CASE WHEN sub_count = 0 THEN now() ELSE completed_at END
     WHERE id = ev.id;

    exploded_count := exploded_count + 1;
  END LOOP;

  RETURN exploded_count;
END;
$$;

/**
 * Claim due deliveries: atomically leases rows for the dispatcher.
 * claimed_at prevents overlapping workers from double-POSTing. Stale claims
 * expire after `lease_seconds` so a crashed worker's rows are retried.
 */
CREATE OR REPLACE FUNCTION public.claim_due_webhook_deliveries(
  lease_seconds INT DEFAULT 60,
  limit_n INT DEFAULT 50
)
RETURNS SETOF public.webhook_deliveries
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.webhook_deliveries AS d
     SET claimed_at = now()
   WHERE d.id IN (
           SELECT id
             FROM public.webhook_deliveries
            WHERE status = 'pending'
              AND (next_attempt_at IS NULL OR next_attempt_at <= now())
              AND (claimed_at IS NULL
                   OR claimed_at < now() - make_interval(secs => lease_seconds))
            ORDER BY next_attempt_at ASC NULLS FIRST
            LIMIT limit_n
            FOR UPDATE SKIP LOCKED
         )
  RETURNING d.*;
$$;

/**
 * finalize_webhook_delivery — callers pass their TRUE intent for `p_status`:
 *   'delivered' — terminal success; counter resets.
 *   'failed'    — attempt failed but we will retry; delivery row stays 'pending'
 *                 with the supplied next_attempt_at. Subscription counter is
 *                 NOT bumped here — that would auto-disable far too aggressively
 *                 under exponential-retry churn.
 *   'dlq'       — terminal failure after exhausting attempts; counter bumps and
 *                 the subscription auto-disables at 20 DLQ'd events.
 *
 * The delivery row's `status` column is derived from `p_status` in-RPC so
 * callers don't have to do status-mapping gymnastics (previous version had a
 * dead `ELSIF p_status = 'failed'` branch because the dispatcher passed
 * 'pending' — counters never ticked during retries).
 */
CREATE OR REPLACE FUNCTION public.finalize_webhook_delivery(
  p_delivery_id UUID,
  p_status TEXT,
  p_attempt INT,
  p_response_status INT,
  p_response_body_excerpt TEXT,
  p_last_error TEXT,
  p_next_attempt_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_id          UUID;
  ev_id           UUID;
  row_status      TEXT;
  new_counter     INT;
  current_counter INT;
BEGIN
  IF p_status NOT IN ('delivered', 'failed', 'dlq') THEN
    RAISE EXCEPTION 'finalize_webhook_delivery: invalid p_status %', p_status;
  END IF;

  -- The delivery row's literal status is NOT the caller's semantic status:
  -- 'failed' retries must keep the row 'pending' so the dispatcher re-claims it.
  row_status := CASE p_status
                  WHEN 'delivered' THEN 'delivered'
                  WHEN 'failed'    THEN 'pending'
                  WHEN 'dlq'       THEN 'dlq'
                END;

  UPDATE public.webhook_deliveries
     SET status                = row_status,
         attempt               = p_attempt,
         response_status       = p_response_status,
         response_body_excerpt = left(coalesce(p_response_body_excerpt, ''), 1000),
         last_error            = left(coalesce(p_last_error, ''), 2000),
         next_attempt_at       = p_next_attempt_at,
         claimed_at            = NULL,
         updated_at            = now()
   WHERE id = p_delivery_id
   RETURNING subscription_id, event_id INTO sub_id, ev_id;

  IF p_status = 'delivered' THEN
    UPDATE public.webhook_subscriptions
       SET last_delivery_at     = now(),
           consecutive_failures = 0
     WHERE id = sub_id;
  ELSIF p_status = 'dlq' THEN
    SELECT consecutive_failures INTO current_counter
      FROM public.webhook_subscriptions WHERE id = sub_id;
    new_counter := coalesce(current_counter, 0) + 1;
    UPDATE public.webhook_subscriptions
       SET consecutive_failures = new_counter,
           active               = CASE WHEN new_counter >= 20 THEN false ELSE active END,
           disabled_reason      = CASE WHEN new_counter >= 20 THEN 'auto_disabled_after_repeated_dlq' ELSE disabled_reason END
     WHERE id = sub_id;
  END IF;
  -- 'failed' deliberately updates no subscription fields.

  -- Mark the event complete only when every delivery for it is terminal.
  IF ev_id IS NOT NULL THEN
    UPDATE public.event_outbox
       SET completed_at = now()
     WHERE id = ev_id
       AND NOT EXISTS (
         SELECT 1 FROM public.webhook_deliveries
          WHERE event_id = ev_id AND status = 'pending'
       );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.fanout_event_outbox(INT)                             FROM public;
REVOKE ALL ON FUNCTION public.claim_due_webhook_deliveries(INT, INT)               FROM public;
REVOKE ALL ON FUNCTION public.finalize_webhook_delivery(UUID, TEXT, INT, INT, TEXT, TEXT, TIMESTAMPTZ) FROM public;
GRANT  EXECUTE ON FUNCTION public.fanout_event_outbox(INT)                             TO service_role;
GRANT  EXECUTE ON FUNCTION public.claim_due_webhook_deliveries(INT, INT)               TO service_role;
GRANT  EXECUTE ON FUNCTION public.finalize_webhook_delivery(UUID, TEXT, INT, INT, TEXT, TEXT, TIMESTAMPTZ) TO service_role;

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.event_outbox           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_outbox_read_own"
  ON public.event_outbox FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "webhook_subs_read_own"
  ON public.webhook_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "webhook_subs_insert_own"
  ON public.webhook_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "webhook_subs_update_own"
  ON public.webhook_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "webhook_subs_delete_own"
  ON public.webhook_subscriptions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "webhook_deliveries_read_own"
  ON public.webhook_deliveries FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.webhook_subscriptions s
       WHERE s.id = webhook_deliveries.subscription_id AND s.user_id = auth.uid()
    )
  );
