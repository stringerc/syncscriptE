-- Service-role-only helpers for Stage E end-to-end smoke.
-- Lets the smoke script emit a test event + create/toggle a test subscription
-- without opening direct DB access or shipping another long-lived debug route.

-- Emit a synthetic event (bypasses the Vercel tool path).
CREATE OR REPLACE FUNCTION public.admin_emit_test_event(
  p_user_id     UUID,
  p_event_type  TEXT DEFAULT 'task.created',
  p_event_key   TEXT DEFAULT NULL,
  p_payload     JSONB DEFAULT '{"smoke":"hello"}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id UUID;
BEGIN
  INSERT INTO public.event_outbox (user_id, event_type, event_key, payload)
       VALUES (p_user_id, p_event_type, p_event_key, p_payload)
    RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- Fetch or create a webhook subscription row. Generates a 32-byte hex secret
-- when p_secret is NULL. Idempotent on (user_id, url).
CREATE OR REPLACE FUNCTION public.admin_upsert_test_subscription(
  p_user_id     UUID,
  p_url         TEXT,
  p_label       TEXT DEFAULT 'e2e smoke',
  p_event_types TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS TABLE(sub_id UUID, secret TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id UUID;
  existing_secret TEXT;
BEGIN
  SELECT id, ws.secret INTO existing_id, existing_secret
    FROM public.webhook_subscriptions ws
   WHERE ws.user_id = p_user_id AND ws.url = p_url
   LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE public.webhook_subscriptions
       SET active = true, event_types = p_event_types, label = p_label,
           consecutive_failures = 0, disabled_reason = NULL
     WHERE id = existing_id;
    sub_id := existing_id;
    secret := existing_secret;
    RETURN NEXT;
    RETURN;
  END IF;

  DECLARE new_secret TEXT := encode(extensions.gen_random_bytes(32), 'hex');
  BEGIN
    INSERT INTO public.webhook_subscriptions (user_id, label, url, secret, event_types, active)
         VALUES (p_user_id, p_label, p_url, new_secret, p_event_types, true)
      RETURNING id INTO sub_id;
    secret := new_secret;
    RETURN NEXT;
  END;
END;
$$;

-- Tight summary for the smoke script poll loop.
CREATE OR REPLACE FUNCTION public.admin_smoke_status(p_event_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'event', (
      SELECT jsonb_build_object(
               'id',           id,
               'event_type',   event_type,
               'fanout_at',    fanout_at,
               'completed_at', completed_at,
               'created_at',   created_at
             )
        FROM public.event_outbox
       WHERE id = p_event_id
    ),
    'deliveries', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
                       'id',                    id,
                       'status',                status,
                       'attempt',               attempt,
                       'response_status',       response_status,
                       'response_body_excerpt', response_body_excerpt,
                       'last_error',            left(coalesce(last_error, ''), 200),
                       'next_attempt_at',       next_attempt_at
                     ) ORDER BY created_at), '[]'::jsonb)
        FROM public.webhook_deliveries
       WHERE event_id = p_event_id
    )
  );
$$;

REVOKE ALL ON FUNCTION public.admin_emit_test_event(UUID, TEXT, TEXT, JSONB)              FROM public;
REVOKE ALL ON FUNCTION public.admin_upsert_test_subscription(UUID, TEXT, TEXT, TEXT[])    FROM public;
REVOKE ALL ON FUNCTION public.admin_smoke_status(UUID)                                     FROM public;
GRANT  EXECUTE ON FUNCTION public.admin_emit_test_event(UUID, TEXT, TEXT, JSONB)           TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_upsert_test_subscription(UUID, TEXT, TEXT, TEXT[]) TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_smoke_status(UUID)                                 TO service_role;
