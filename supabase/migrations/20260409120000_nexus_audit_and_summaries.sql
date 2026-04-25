-- Nexus tool audit trail + optional post-call summaries (service-role insert from API)

CREATE TABLE IF NOT EXISTS public.nexus_tool_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  surface TEXT NOT NULL CHECK (surface IN ('voice', 'text', 'phone')),
  request_id TEXT,
  tool_name TEXT NOT NULL,
  ok BOOLEAN NOT NULL,
  detail JSONB,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_tool_audit_user_created
  ON public.nexus_tool_audit (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.nexus_call_session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  session_id TEXT,
  surface TEXT NOT NULL DEFAULT 'voice' CHECK (surface IN ('voice', 'text', 'phone')),
  summary_text TEXT,
  tool_trace JSONB,
  message_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_call_summaries_user_created
  ON public.nexus_call_session_summaries (user_id, created_at DESC);

ALTER TABLE public.nexus_tool_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_call_session_summaries ENABLE ROW LEVEL SECURITY;

-- Signed-in users can read their own audit rows (inserts are server-side only)
CREATE POLICY "Users read own nexus_tool_audit"
  ON public.nexus_tool_audit FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own nexus_call_session_summaries"
  ON public.nexus_call_session_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
