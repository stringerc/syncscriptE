-- Concierge playbooks (§4 nexus-concierge-playbooks) — definitions, runs, I/O, audit

CREATE TABLE IF NOT EXISTS public.playbook_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  definition JSONB NOT NULL DEFAULT '{}'::jsonb,
  max_tier INT NOT NULL DEFAULT 2 CHECK (max_tier >= 0 AND max_tier <= 4),
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT playbook_definitions_system_or_owner CHECK (
    is_system = true OR created_by IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_playbook_definitions_created_by ON public.playbook_definitions (created_by);

CREATE TABLE IF NOT EXISTS public.playbook_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbook_definitions (id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'waiting', 'completed', 'failed', 'cancelled')),
  correlation_id TEXT NOT NULL UNIQUE,
  current_step_id TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbook_runs_user ON public.playbook_runs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playbook_runs_status ON public.playbook_runs (status) WHERE status IN ('running', 'waiting');

CREATE TABLE IF NOT EXISTS public.playbook_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.playbook_runs (id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'in_progress', 'done', 'failed', 'skipped')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT,
  evidence_ref TEXT,
  UNIQUE (run_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_playbook_steps_run ON public.playbook_steps (run_id);

CREATE TABLE IF NOT EXISTS public.third_party_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.playbook_runs (id) ON DELETE CASCADE,
  step_id TEXT NOT NULL DEFAULT '',
  to_e164 TEXT NOT NULL,
  twilio_call_sid TEXT,
  template_id TEXT NOT NULL,
  template_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('queued', 'ringing', 'completed', 'failed')),
  recording_url TEXT,
  duration_sec INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_third_party_calls_run ON public.third_party_calls (run_id);
CREATE INDEX IF NOT EXISTS idx_third_party_calls_sid ON public.third_party_calls (twilio_call_sid) WHERE twilio_call_sid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_third_party_calls_run_step ON public.third_party_calls (run_id, step_id);

CREATE TABLE IF NOT EXISTS public.email_expectations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.playbook_runs (id) ON DELETE CASCADE,
  match_mode TEXT NOT NULL CHECK (match_mode IN ('subject_token', 'reply_to', 'header')),
  pattern TEXT NOT NULL,
  timeout_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'matched', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_expectations_run ON public.email_expectations (run_id);
CREATE INDEX IF NOT EXISTS idx_email_expectations_open ON public.email_expectations (status) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS public.confirmation_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.playbook_runs (id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('email', 'human')),
  raw_hash TEXT NOT NULL,
  extracted JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_confirmation_evidence_run ON public.confirmation_evidence (run_id);

CREATE TABLE IF NOT EXISTS public.playbook_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbook_audit_entity ON public.playbook_audit_events (entity, created_at DESC);

-- updated_at touch
CREATE OR REPLACE FUNCTION public.touch_playbook_run_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_playbook_runs_updated ON public.playbook_runs;
CREATE TRIGGER trg_playbook_runs_updated
  BEFORE UPDATE ON public.playbook_runs
  FOR EACH ROW EXECUTE FUNCTION public.touch_playbook_run_updated_at();

DROP TRIGGER IF EXISTS trg_third_party_calls_updated ON public.third_party_calls;
CREATE TRIGGER trg_third_party_calls_updated
  BEFORE UPDATE ON public.third_party_calls
  FOR EACH ROW EXECUTE FUNCTION public.touch_playbook_run_updated_at();

-- RLS
ALTER TABLE public.playbook_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.third_party_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_expectations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmation_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playbook_definitions_select_own_or_system"
  ON public.playbook_definitions FOR SELECT TO authenticated
  USING (is_system OR created_by = auth.uid());

CREATE POLICY "playbook_definitions_insert_own"
  ON public.playbook_definitions FOR INSERT TO authenticated
  WITH CHECK (NOT is_system AND created_by = auth.uid());

CREATE POLICY "playbook_definitions_update_own"
  ON public.playbook_definitions FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "playbook_runs_all_own"
  ON public.playbook_runs FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "playbook_steps_via_run"
  ON public.playbook_steps FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.playbook_runs r WHERE r.id = playbook_steps.run_id AND r.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.playbook_runs r WHERE r.id = playbook_steps.run_id AND r.user_id = auth.uid())
  );

CREATE POLICY "third_party_calls_via_run"
  ON public.third_party_calls FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.playbook_runs r WHERE r.id = third_party_calls.run_id AND r.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.playbook_runs r WHERE r.id = third_party_calls.run_id AND r.user_id = auth.uid())
  );

CREATE POLICY "email_expectations_via_run"
  ON public.email_expectations FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.playbook_runs r WHERE r.id = email_expectations.run_id AND r.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.playbook_runs r WHERE r.id = email_expectations.run_id AND r.user_id = auth.uid())
  );

CREATE POLICY "confirmation_evidence_via_run"
  ON public.confirmation_evidence FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.playbook_runs r WHERE r.id = confirmation_evidence.run_id AND r.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.playbook_runs r WHERE r.id = confirmation_evidence.run_id AND r.user_id = auth.uid())
  );

-- Audit: users may read their trail (entity_id = run id)
CREATE POLICY "playbook_audit_read_via_run"
  ON public.playbook_audit_events FOR SELECT TO authenticated
  USING (
    entity = 'playbook_run' AND EXISTS (
      SELECT 1 FROM public.playbook_runs r WHERE r.id = entity_id AND r.user_id = auth.uid()
    )
  );

-- Seed system playbooks (no auth owner)
INSERT INTO public.playbook_definitions (slug, name, version, definition, max_tier, is_system, created_by)
VALUES
  (
    'concierge_demo_v1',
    'Concierge demo (task + scripted third-party call)',
    1,
    '{"version":1,"inputs":[{"id":"venue_phone","type":"e164","required":false}],"steps":[{"id":"s1","type":"nexus_tool","tool":"create_task","map":{"title":"Concierge playbook task"}},{"id":"s2","type":"third_party_call","template_id":"venue_reservation_v1","requires_tier":3}],"on_failure":{"type":"create_task","title":"Playbook failed — concierge"}}'::jsonb,
    3,
    true,
    NULL
  ),
  (
    'concierge_email_smoke_v1',
    'Concierge email wait smoke',
    1,
    '{"version":1,"inputs":[],"steps":[{"id":"e1","type":"nexus_tool","tool":"create_task","map":{"title":"Email playbook started"}},{"id":"e2","type":"wait_email","expectation_id":"e2","timeout_hours":72}],"on_failure":{"type":"create_task","title":"Playbook email wait expired"}}'::jsonb,
    2,
    true,
    NULL
  )
ON CONFLICT (slug) DO NOTHING;
