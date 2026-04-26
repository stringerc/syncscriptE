-- Tier A is "read-only browsing" — practically useless for real tasks (no clicks,
-- no form fills). After live testing (run c2340e4b: 10/10 click attempts blocked
-- by tier_A_disallows), bump default to Tier B (read + click + scoped writes;
-- destructive actions still need approval at Tier C). Also raise per-run cost
-- cap from 10¢ → 50¢ because each LLM call is ~1¢ and 10¢ runs out before any
-- meaningful work happens.

ALTER TABLE public.automation_policies
  ALTER COLUMN tier SET DEFAULT 'B';

ALTER TABLE public.automation_policies
  ALTER COLUMN per_run_cost_cents_cap SET DEFAULT 50;

ALTER TABLE public.automation_policies
  ALTER COLUMN per_run_step_cap SET DEFAULT 40;

ALTER TABLE public.automation_policies
  ALTER COLUMN daily_cost_cents_cap SET DEFAULT 200;

-- Backfill existing rows that are still on Tier A defaults — only update users
-- who haven't customized their tier (still 'A' AND still default 10¢ cap).
-- Anyone who manually picked Tier A stays on Tier A.
UPDATE public.automation_policies
   SET tier = 'B',
       per_run_cost_cents_cap = 50,
       per_run_step_cap = 40,
       daily_cost_cents_cap = 200
 WHERE tier = 'A'
   AND per_run_cost_cents_cap = 10
   AND per_run_step_cap = 25
   AND daily_cost_cents_cap = 50;

COMMENT ON COLUMN public.automation_policies.tier IS
  'A=read-only (almost no real-world tasks work); B=read+click+scoped-writes (default); C=full writes with per-action approval; D=full autonomy on trusted sites only';
