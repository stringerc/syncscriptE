-- Server-tracked onboarding progress so Tier 0 A "the server thinks every
-- user is first-time forever" stops being true. Backs the existing client
-- API at `src/components/onboarding/checklist-tracking.ts`. RLS-scoped to
-- `auth.uid()`; localStorage stays as a write-through cache for instant UI.

CREATE TABLE IF NOT EXISTS public.user_onboarding_progress (
  user_id      UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  -- Per-step booleans. Keys: task | goal | event | energy | ai | profile.
  steps        JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Set once when ALL six steps land. Used for funnel + retention analytics.
  completed_at TIMESTAMPTZ,
  -- First-energy-log signal that previously had nowhere to live.
  first_energy_log_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'user_onboarding_progress'
       AND policyname = 'user_onboarding_progress_self'
  ) THEN
    CREATE POLICY user_onboarding_progress_self
      ON public.user_onboarding_progress
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.user_onboarding_progress_touch()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  -- Auto-stamp completed_at when the user first hits all six steps.
  IF NEW.completed_at IS NULL AND
     NEW.steps ? 'task' AND NEW.steps ? 'goal' AND NEW.steps ? 'event' AND
     NEW.steps ? 'energy' AND NEW.steps ? 'ai' AND NEW.steps ? 'profile' AND
     (NEW.steps->>'task')::boolean AND
     (NEW.steps->>'goal')::boolean AND
     (NEW.steps->>'event')::boolean AND
     (NEW.steps->>'energy')::boolean AND
     (NEW.steps->>'ai')::boolean AND
     (NEW.steps->>'profile')::boolean THEN
    NEW.completed_at := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS user_onboarding_progress_touch_trg ON public.user_onboarding_progress;
CREATE TRIGGER user_onboarding_progress_touch_trg
  BEFORE INSERT OR UPDATE ON public.user_onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.user_onboarding_progress_touch();

-- Add this table to the realtime publication so the OnboardingChecklist
-- updates instantly across tabs without a refetch.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'user_onboarding_progress'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_onboarding_progress';
  END IF;
END $$;

COMMENT ON TABLE public.user_onboarding_progress IS
  'Authoritative onboarding state per user. Replaces localStorage-only checklist tracking. RLS-scoped to auth.uid().';
