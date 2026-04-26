-- Runner endpoint registry — tunnel URLs are ephemeral; this table is the
-- source of truth that gets read at request time so Vercel always points at
-- the current upstream. Rows are written by the Oracle watchdog
-- (`scripts/watchdog-tunnel-url.sh`) using the service-role key.

CREATE TABLE IF NOT EXISTS public.runner_endpoints (
  name        TEXT PRIMARY KEY,
  url         TEXT NOT NULL,
  notes       TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.runner_endpoints ENABLE ROW LEVEL SECURITY;

-- service_role only — Vercel /api/agent and the Oracle watchdog both use the
-- service key. There is no anon/auth use case for this table.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'runner_endpoints'
       AND policyname = 'runner_endpoints_service_role'
  ) THEN
    CREATE POLICY runner_endpoints_service_role
      ON public.runner_endpoints
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- updated_at maintained by trigger so reads can sort newest first.
CREATE OR REPLACE FUNCTION public.runner_endpoints_touch()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS runner_endpoints_touch_trg ON public.runner_endpoints;
CREATE TRIGGER runner_endpoints_touch_trg
  BEFORE UPDATE ON public.runner_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.runner_endpoints_touch();

-- Seed with the agent runner placeholder so first read doesn't 404. The
-- Oracle watchdog will overwrite this on its next tick.
INSERT INTO public.runner_endpoints (name, url, notes)
VALUES ('agent_runner', '', 'Filled by oracle watchdog — do not hand-edit')
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE public.runner_endpoints IS
  'Authoritative runner upstream URL registry. Auto-updated by Oracle watchdog when the cloudflared quick-tunnel URL changes. Vercel /api/agent reads from here at request time.';
