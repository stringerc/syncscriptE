-- Agent Mode foundation (Phase 1–5 schema, single migration).
--
-- Tables:
--   agent_runs             — one row per agent goal; lifecycle from queued→running→done/failed
--   agent_run_steps        — append-only timeline of thoughts, browser actions, tool calls, screenshots
--   agent_run_messages     — user mid-run interjections (voice utterances during a run)
--   automation_policies    — per-user Tier A/B/C/D + spend caps + site allow/deny
--   byok_keys              — per-user encrypted API keys (vault-backed) for self-supplied LLM providers
--   projects               — project namespace for tasks/goals/workstreams (Phase 1 ProjectOS filter)
--
-- Column adds:
--   tasks.project_id, goals.project_id, workstreams.project_id (nullable, indexed)
--
-- RPCs:
--   admin_seed_byok_key(p_provider, p_value, p_label?)
--                    — vault-backed BYOK insert (service-role only; user keys never seen)
--   claim_next_agent_run(lease_seconds, limit_n)
--                    — runner claim with FOR UPDATE SKIP LOCKED (mirrors concierge claim shape)
--   release_agent_run_claim(run_id)
--   record_agent_step(run_id, kind, payload, screenshot_b64?)
--   pending_agent_messages(run_id) — runner reads + marks applied
--   complete_agent_run(run_id, status, error_text?, total_cost_cents?)
--
-- All caps and tier defaults can be tuned at runtime via UPDATE on automation_policies; nothing here
-- forces a recompile to change.

-- ---------------------------------------------------------------------------
-- 1. projects (lightweight namespace)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT,
  archived    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects (user_id, archived);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_owner_all" ON public.projects FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. project_id columns on the existing tasks/goals/workstreams tables
--    Use IF NOT EXISTS so the migration is idempotent and tolerates schema variance.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks (project_id) WHERE project_id IS NOT NULL';
  END IF;
  IF to_regclass('public.goals') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_goals_project ON public.goals (project_id) WHERE project_id IS NOT NULL';
  END IF;
  IF to_regclass('public.workstreams') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.workstreams ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_workstreams_project ON public.workstreams (project_id) WHERE project_id IS NOT NULL';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. automation_policies (Tier A/B/C/D + caps + lists)
--    Tier A: read-only browsing (default for new users)
--    Tier B: read + scoped writes (resource lib, draft email, create_task)
--    Tier C: full writes with per-action approval modal on destructive matches
--    Tier D: full autonomy with site whitelist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_policies (
  user_id                     UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  tier                        TEXT NOT NULL DEFAULT 'A' CHECK (tier IN ('A', 'B', 'C', 'D')),
  daily_run_cap               INT  NOT NULL DEFAULT 5,
  daily_step_cap              INT  NOT NULL DEFAULT 150,
  daily_cost_cents_cap        INT  NOT NULL DEFAULT 50,
  per_run_step_cap            INT  NOT NULL DEFAULT 25,
  per_run_cost_cents_cap      INT  NOT NULL DEFAULT 10,
  /** Sites the user has pre-approved — Tier-D grants full autonomy here only. */
  trusted_sites               TEXT[] NOT NULL DEFAULT '{}',
  /** Sites the agent will refuse to operate on regardless of tier. Banking, gov, etc. */
  blocked_sites               TEXT[] NOT NULL DEFAULT ARRAY['*.gov', 'chase.com', 'bankofamerica.com', 'wellsfargo.com']::TEXT[],
  /** Quick global pause without changing tier. */
  agent_paused                BOOLEAN NOT NULL DEFAULT false,
  paused_reason               TEXT,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_policies_owner_all" ON public.automation_policies FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. byok_keys (per-user encrypted LLM provider keys)
--    Keys themselves live in vault.secrets under name `byok_<user>_<provider>`.
--    This table just tracks metadata so the user can list/delete without re-pasting.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.byok_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  provider        TEXT NOT NULL CHECK (provider IN (
                    'openrouter', 'gemini', 'openai', 'anthropic',
                    'groq', 'xai', 'mistral', 'ollama', 'custom_openai_compat'
                  )),
  default_model   TEXT,
  label           TEXT,
  /** Last 4 chars of the original key — purely for "is this the right key?" UX. */
  last4           TEXT,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at      TIMESTAMPTZ,
  /** Custom endpoint URL when provider=custom_openai_compat or ollama. */
  endpoint_url    TEXT,
  /** Daily $ cap on this key, enforced by adapter. NULL = no cap. */
  daily_cents_cap INT,
  daily_cents_spent INT NOT NULL DEFAULT 0,
  daily_reset_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 day'),
  UNIQUE (user_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_byok_user_active ON public.byok_keys (user_id) WHERE active;

ALTER TABLE public.byok_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "byok_keys_owner_select" ON public.byok_keys FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "byok_keys_owner_update" ON public.byok_keys FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "byok_keys_owner_delete" ON public.byok_keys FOR DELETE TO authenticated
  USING (user_id = auth.uid());
-- INSERT only via the SECURITY DEFINER helper below — keeps the actual key value out of client SQL.

-- ---------------------------------------------------------------------------
-- 5. agent_runs (one row per goal)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  project_id               UUID REFERENCES public.projects (id) ON DELETE SET NULL,
  goal_text                TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'queued'
                             CHECK (status IN ('queued', 'running', 'waiting_user', 'paused', 'done', 'failed', 'cancelled')),
  /** Snapshot of which provider+model is driving this run. Free tier = nvidia/<model>. */
  provider                 TEXT,
  model                    TEXT,
  /** Computer-use bias: free-tier general models vs specialized Anthropic CU. */
  uses_specialized_cu      BOOLEAN NOT NULL DEFAULT false,
  /** Browser session handle — Browserbase ID, or "oracle:<host>:<port>:<session>" for self-hosted. */
  browser_session_id       TEXT,
  /** Snapshot of the policy at run-start so changes mid-run can't unblock destructive actions. */
  tier_at_start            TEXT,
  steps_executed           INT NOT NULL DEFAULT 0,
  total_cost_cents         INT NOT NULL DEFAULT 0,
  /** When the agent has paused waiting for user approval / take-control. */
  pause_reason             TEXT,
  cancel_requested         BOOLEAN NOT NULL DEFAULT false,
  error_text               TEXT,
  /** Final summary for UI (what the agent did, sites visited, things created). */
  summary                  TEXT,
  /** Lease for runner concurrency safety — same pattern as concierge claim. */
  claimed_at               TIMESTAMPTZ,
  started_at               TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_recent ON public.agent_runs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_active ON public.agent_runs (status) WHERE status IN ('queued', 'running', 'waiting_user', 'paused');
CREATE INDEX IF NOT EXISTS idx_agent_runs_project ON public.agent_runs (project_id) WHERE project_id IS NOT NULL;

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_runs_owner_select" ON public.agent_runs FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "agent_runs_owner_insert" ON public.agent_runs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "agent_runs_owner_update" ON public.agent_runs FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. agent_run_steps (append-only timeline)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_run_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES public.agent_runs (id) ON DELETE CASCADE,
  step_index      INT  NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN (
                    'thought', 'browser_action', 'tool_call', 'screenshot',
                    'user_interjection', 'agent_message', 'approval_request', 'error'
                  )),
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  /** Base64 PNG for screenshot kind, or external URL once we move to storage. */
  screenshot_b64  TEXT,
  /** Approximate cost cents for this step (LLM tokens + browser time fraction). */
  cost_cents      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, step_index)
);
CREATE INDEX IF NOT EXISTS idx_agent_run_steps_run ON public.agent_run_steps (run_id, step_index);

ALTER TABLE public.agent_run_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_run_steps_via_run" ON public.agent_run_steps FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = agent_run_steps.run_id AND r.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 7. agent_run_messages (user mid-run interjections; runner reads queue)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_run_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID NOT NULL REFERENCES public.agent_runs (id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'agent', 'system')),
  content     TEXT NOT NULL,
  applied_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_run_messages_run ON public.agent_run_messages (run_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_run_messages_unapplied ON public.agent_run_messages (run_id, created_at)
  WHERE applied_at IS NULL;

ALTER TABLE public.agent_run_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_run_messages_owner_select" ON public.agent_run_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = agent_run_messages.run_id AND r.user_id = auth.uid())
  );
CREATE POLICY "agent_run_messages_owner_insert" ON public.agent_run_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.agent_runs r WHERE r.id = agent_run_messages.run_id AND r.user_id = auth.uid())
    AND role = 'user'
  );

-- ---------------------------------------------------------------------------
-- 8. updated_at touches
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_agent_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_agent_runs_updated ON public.agent_runs;
CREATE TRIGGER trg_agent_runs_updated BEFORE UPDATE ON public.agent_runs
  FOR EACH ROW EXECUTE FUNCTION public.touch_agent_runs_updated_at();

DROP TRIGGER IF EXISTS trg_projects_updated ON public.projects;
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_agent_runs_updated_at();

DROP TRIGGER IF EXISTS trg_automation_policies_updated ON public.automation_policies;
CREATE TRIGGER trg_automation_policies_updated BEFORE UPDATE ON public.automation_policies
  FOR EACH ROW EXECUTE FUNCTION public.touch_agent_runs_updated_at();

-- ---------------------------------------------------------------------------
-- 9. RPCs — runner-side (service_role only)
-- ---------------------------------------------------------------------------

/** Atomically claim N due agent runs. Lease prevents two runners from grabbing same row. */
CREATE OR REPLACE FUNCTION public.claim_next_agent_runs(
  lease_seconds INT DEFAULT 300,
  limit_n INT DEFAULT 4
)
RETURNS SETOF public.agent_runs
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.agent_runs r
     SET claimed_at = now(),
         status     = CASE WHEN status = 'queued' THEN 'running' ELSE status END,
         started_at = COALESCE(r.started_at, now())
   WHERE r.id IN (
           SELECT id FROM public.agent_runs
            WHERE status IN ('queued', 'paused', 'waiting_user')
              AND cancel_requested = false
              AND (claimed_at IS NULL OR claimed_at < now() - make_interval(secs => lease_seconds))
            ORDER BY created_at ASC
            LIMIT limit_n
            FOR UPDATE SKIP LOCKED
         )
  RETURNING r.*;
$$;

CREATE OR REPLACE FUNCTION public.release_agent_run_claim(p_run_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.agent_runs SET claimed_at = NULL WHERE id = p_run_id;
$$;

CREATE OR REPLACE FUNCTION public.record_agent_step(
  p_run_id          UUID,
  p_kind            TEXT,
  p_payload         JSONB,
  p_screenshot_b64  TEXT DEFAULT NULL,
  p_cost_cents      INT DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_index INT;
  new_id UUID;
BEGIN
  SELECT COALESCE(MAX(step_index), -1) + 1 INTO next_index
    FROM public.agent_run_steps WHERE run_id = p_run_id;

  INSERT INTO public.agent_run_steps (run_id, step_index, kind, payload, screenshot_b64, cost_cents)
    VALUES (p_run_id, next_index, p_kind, p_payload, p_screenshot_b64, p_cost_cents)
  RETURNING id INTO new_id;

  UPDATE public.agent_runs
     SET steps_executed   = steps_executed + 1,
         total_cost_cents = total_cost_cents + p_cost_cents,
         updated_at       = now()
   WHERE id = p_run_id;

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.pending_agent_messages(p_run_id UUID)
RETURNS SETOF public.agent_run_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    UPDATE public.agent_run_messages
       SET applied_at = now()
     WHERE run_id = p_run_id AND applied_at IS NULL
     RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_agent_run(
  p_run_id            UUID,
  p_status            TEXT,
  p_summary           TEXT DEFAULT NULL,
  p_error_text        TEXT DEFAULT NULL,
  p_total_cost_cents  INT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('done', 'failed', 'cancelled', 'paused', 'waiting_user') THEN
    RAISE EXCEPTION 'complete_agent_run: invalid status %', p_status;
  END IF;

  UPDATE public.agent_runs
     SET status            = p_status,
         summary           = COALESCE(p_summary, summary),
         error_text        = COALESCE(p_error_text, error_text),
         total_cost_cents  = COALESCE(p_total_cost_cents, total_cost_cents),
         completed_at      = CASE WHEN p_status IN ('done', 'failed', 'cancelled') THEN now() ELSE completed_at END,
         claimed_at        = NULL
   WHERE id = p_run_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_next_agent_runs(INT, INT)         FROM public;
REVOKE ALL ON FUNCTION public.release_agent_run_claim(UUID)           FROM public;
REVOKE ALL ON FUNCTION public.record_agent_step(UUID, TEXT, JSONB, TEXT, INT) FROM public;
REVOKE ALL ON FUNCTION public.pending_agent_messages(UUID)            FROM public;
REVOKE ALL ON FUNCTION public.complete_agent_run(UUID, TEXT, TEXT, TEXT, INT) FROM public;
GRANT  EXECUTE ON FUNCTION public.claim_next_agent_runs(INT, INT)         TO service_role;
GRANT  EXECUTE ON FUNCTION public.release_agent_run_claim(UUID)           TO service_role;
GRANT  EXECUTE ON FUNCTION public.record_agent_step(UUID, TEXT, JSONB, TEXT, INT) TO service_role;
GRANT  EXECUTE ON FUNCTION public.pending_agent_messages(UUID)            TO service_role;
GRANT  EXECUTE ON FUNCTION public.complete_agent_run(UUID, TEXT, TEXT, TEXT, INT) TO service_role;

-- ---------------------------------------------------------------------------
-- 10. BYOK key seed/rotate RPC — vault-backed, service_role only
--    Stores the actual key in vault.secrets under name `byok_<user>_<provider>`,
--    upserts the metadata row in byok_keys with last4 + label.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_seed_byok_key(
  p_user_id        UUID,
  p_provider       TEXT,
  p_value          TEXT,
  p_label          TEXT DEFAULT NULL,
  p_default_model  TEXT DEFAULT NULL,
  p_endpoint_url   TEXT DEFAULT NULL,
  p_daily_cents_cap INT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  vault_name TEXT;
  vault_id   UUID;
  row_id     UUID;
  last4_extracted TEXT;
BEGIN
  IF p_provider NOT IN ('openrouter','gemini','openai','anthropic','groq','xai','mistral','ollama','custom_openai_compat') THEN
    RAISE EXCEPTION 'admin_seed_byok_key: unknown provider %', p_provider;
  END IF;
  IF coalesce(p_value, '') = '' THEN
    RAISE EXCEPTION 'admin_seed_byok_key: p_value must be non-empty';
  END IF;

  vault_name := 'byok_' || p_user_id::text || '_' || p_provider;

  -- Rotate-in-place: drop old then insert new
  DELETE FROM vault.secrets WHERE name = vault_name;
  SELECT vault.create_secret(p_value, vault_name, COALESCE('BYOK ' || p_provider, '')) INTO vault_id;

  last4_extracted := right(p_value, 4);

  INSERT INTO public.byok_keys (
    user_id, provider, default_model, label, last4, endpoint_url, daily_cents_cap
  ) VALUES (
    p_user_id, p_provider, p_default_model, p_label, last4_extracted, p_endpoint_url, p_daily_cents_cap
  )
  ON CONFLICT (user_id, provider) DO UPDATE
    SET default_model     = EXCLUDED.default_model,
        label             = EXCLUDED.label,
        last4             = EXCLUDED.last4,
        endpoint_url      = EXCLUDED.endpoint_url,
        daily_cents_cap   = EXCLUDED.daily_cents_cap,
        active            = true,
        rotated_at        = now()
  RETURNING id INTO row_id;

  RETURN row_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_seed_byok_key(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INT) FROM public;
GRANT  EXECUTE ON FUNCTION public.admin_seed_byok_key(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INT) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_read_byok_key(
  p_user_id    UUID,
  p_provider   TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  vault_name  TEXT := 'byok_' || p_user_id::text || '_' || p_provider;
  secret_text TEXT;
BEGIN
  SELECT decrypted_secret INTO secret_text
    FROM vault.decrypted_secrets WHERE name = vault_name LIMIT 1;
  RETURN secret_text;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_read_byok_key(UUID, TEXT) FROM public;
GRANT  EXECUTE ON FUNCTION public.admin_read_byok_key(UUID, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- 11. Quota helper — checks daily_run_cap + cost cap before allowing new run
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_agent_run_quota(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  policy public.automation_policies;
  runs_today INT;
  cost_today INT;
BEGIN
  SELECT * INTO policy FROM public.automation_policies WHERE user_id = p_user_id;

  -- Auto-create with defaults if missing
  IF NOT FOUND THEN
    INSERT INTO public.automation_policies (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING * INTO policy;
    IF policy IS NULL THEN
      SELECT * INTO policy FROM public.automation_policies WHERE user_id = p_user_id;
    END IF;
  END IF;

  IF policy.agent_paused THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'agent_paused', 'detail', policy.paused_reason);
  END IF;

  SELECT count(*) INTO runs_today
    FROM public.agent_runs
   WHERE user_id = p_user_id
     AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

  SELECT COALESCE(SUM(total_cost_cents), 0) INTO cost_today
    FROM public.agent_runs
   WHERE user_id = p_user_id
     AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

  IF runs_today >= policy.daily_run_cap THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'daily_run_cap', 'cap', policy.daily_run_cap);
  END IF;
  IF cost_today >= policy.daily_cost_cents_cap THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'daily_cost_cap', 'cap_cents', policy.daily_cost_cents_cap);
  END IF;

  RETURN jsonb_build_object(
    'allowed',         true,
    'tier',            policy.tier,
    'per_run_step_cap',policy.per_run_step_cap,
    'per_run_cost_cap',policy.per_run_cost_cents_cap,
    'runs_remaining',  policy.daily_run_cap - runs_today,
    'cost_remaining_cents', policy.daily_cost_cents_cap - cost_today,
    'trusted_sites',   policy.trusted_sites,
    'blocked_sites',   policy.blocked_sites
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_agent_run_quota(UUID) FROM public;
GRANT  EXECUTE ON FUNCTION public.check_agent_run_quota(UUID) TO service_role, authenticated;
