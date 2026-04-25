-- Autonomy heartbeat (pg_cron + pg_net).
--
-- Turns on five SyncScript cron loops using Supabase's native scheduler + HTTP
-- worker. Every URL targeted here already exists (Vercel or Edge); this file
-- only gives them a heartbeat and a concurrency-safe claim RPC.
--
-- Secrets are read from Supabase Vault at cron run time — populate BEFORE enabling:
--   select vault.create_secret(
--     '<paste CRON_SECRET from Vercel>',
--     'syncscript_cron_secret',
--     'Vercel Bearer CRON_SECRET for /api/cron/* endpoints');
--   select vault.create_secret(
--     '<paste NEXUS_PHONE_EDGE_SECRET>',
--     'syncscript_nexus_edge_secret',
--     'x-nexus-internal-secret for Supabase Edge internal/* endpoints');
--
-- Pause / resume any loop without a redeploy:
--   update cron.job set active = false where jobname = 'syncscript.concierge.tick';
--   update cron.job set active = true  where jobname = 'syncscript.concierge.tick';
--
-- Remove:
--   select cron.unschedule('syncscript.concierge.tick');

-- ---------------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA cron TO postgres;

-- ---------------------------------------------------------------------------
-- 2. Concurrency claim for the concierge tick
--    `playbook_runs.claimed_at` + `claim_next_playbook_runs` let many tick
--    invocations coexist safely. `FOR UPDATE SKIP LOCKED` means each row is
--    owned by exactly one tick for the lease window; a crashed worker's claim
--    expires after `lease_seconds` and is retaken on the next tick.
-- ---------------------------------------------------------------------------
ALTER TABLE public.playbook_runs
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_playbook_runs_claim_candidates
  ON public.playbook_runs (updated_at)
  WHERE status IN ('running', 'waiting');

CREATE OR REPLACE FUNCTION public.claim_next_playbook_runs(
  lease_seconds INT DEFAULT 120,
  limit_n INT DEFAULT 30
)
RETURNS SETOF public.playbook_runs
LANGUAGE SQL
AS $$
  UPDATE public.playbook_runs AS r
     SET claimed_at = now()
   WHERE r.id IN (
           SELECT id
             FROM public.playbook_runs
            WHERE status IN ('running', 'waiting')
              AND (claimed_at IS NULL
                   OR claimed_at < now() - make_interval(secs => lease_seconds))
            ORDER BY updated_at ASC
            LIMIT limit_n
            FOR UPDATE SKIP LOCKED
         )
  RETURNING r.*;
$$;

CREATE OR REPLACE FUNCTION public.release_playbook_run_claim(run_id UUID)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE public.playbook_runs SET claimed_at = NULL WHERE id = run_id;
$$;

GRANT EXECUTE ON FUNCTION public.claim_next_playbook_runs(INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_playbook_run_claim(UUID)    TO service_role;

-- ---------------------------------------------------------------------------
-- 3. HTTP helper — vault-backed headers, one place to audit.
--    SECURITY DEFINER so cron jobs can read the decrypted secret without the
--    cron role having its own grants against vault.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.syncscript_autonomy_post(
  url TEXT,
  secret_name TEXT,           -- row in vault.decrypted_secrets
  auth_scheme TEXT DEFAULT 'Bearer',      -- 'Bearer' for Vercel; 'x-nexus-internal-secret' for Edge
  body JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  secret_value TEXT;
  headers      JSONB := jsonb_build_object('Content-Type', 'application/json');
  req_id       BIGINT;
BEGIN
  SELECT decrypted_secret INTO secret_value
    FROM vault.decrypted_secrets
   WHERE name = secret_name
   LIMIT 1;

  IF secret_value IS NULL THEN
    RAISE NOTICE 'syncscript_autonomy_post: secret % not found; skipping %', secret_name, url;
    RETURN NULL;
  END IF;

  IF auth_scheme = 'x-nexus-internal-secret' THEN
    headers := headers || jsonb_build_object('x-nexus-internal-secret', secret_value);
  ELSE
    headers := headers || jsonb_build_object('Authorization', auth_scheme || ' ' || secret_value);
  END IF;

  SELECT net.http_post(url := url, headers := headers, body := body) INTO req_id;
  RETURN req_id;
END;
$$;

REVOKE ALL ON FUNCTION public.syncscript_autonomy_post(TEXT, TEXT, TEXT, JSONB) FROM public;
GRANT EXECUTE ON FUNCTION public.syncscript_autonomy_post(TEXT, TEXT, TEXT, JSONB) TO postgres;

-- ---------------------------------------------------------------------------
-- 4. Cron schedules
--    Unschedule-if-exists lets this migration be re-run safely.
-- ---------------------------------------------------------------------------
DO $$
DECLARE j RECORD;
BEGIN
  FOR j IN SELECT jobname FROM cron.job WHERE jobname LIKE 'syncscript.%'
  LOOP
    PERFORM cron.unschedule(j.jobname);
  END LOOP;
END $$;

-- 4a. Concierge engine — heartbeat.
SELECT cron.schedule(
  'syncscript.concierge.tick',
  '* * * * *',
  $sql$
  SELECT public.syncscript_autonomy_post(
    'https://www.syncscript.app/api/cron/concierge-playbook-tick',
    'syncscript_cron_secret',
    'Bearer'
  );
  $sql$
);

-- 4b. Phone queue — collection calls, wake-ups, proposal calls.
SELECT cron.schedule(
  'syncscript.phone.dispatch',
  '*/2 * * * *',
  $sql$
  SELECT public.syncscript_autonomy_post(
    'https://www.syncscript.app/api/cron/phone-dispatch',
    'syncscript_cron_secret',
    'Bearer'
  );
  $sql$
);

-- 4c. Inbound email → proposal / task promotion.
SELECT cron.schedule(
  'syncscript.process-emails',
  '*/5 * * * *',
  $sql$
  SELECT public.syncscript_autonomy_post(
    'https://www.syncscript.app/api/cron/process-emails',
    'syncscript_cron_secret',
    'Bearer'
  );
  $sql$
);

-- 4d. TTS SLO probe (replaces GH Actions probe cadence).
SELECT cron.schedule(
  'syncscript.tts.slo',
  '*/10 * * * *',
  $sql$
  SELECT public.syncscript_autonomy_post(
    'https://www.syncscript.app/api/cron/tts-slo',
    'syncscript_cron_secret',
    'Bearer'
  );
  $sql$
);

-- 4e. Proactive detectors (silent-struggle / at-risk / celebrations) —
--     Edge endpoint gated by `x-nexus-internal-secret`, not Vercel CRON_SECRET.
--     Kept at 15 min so admin detections stay responsive without LLM pressure.
SELECT cron.schedule(
  'syncscript.proactive.detect',
  '*/15 * * * *',
  $sql$
  SELECT public.syncscript_autonomy_post(
    (SELECT coalesce(current_setting('app.supabase_edge_base', true),
                     'https://kwhnrlzibgfedtxpkbgb.functions.supabase.co')
      || '/make-server-57781ad9/admin/detect/all'),
    'syncscript_nexus_edge_secret',
    'x-nexus-internal-secret'
  );
  $sql$
);
