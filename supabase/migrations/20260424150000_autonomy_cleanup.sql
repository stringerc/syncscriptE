-- Autonomy cleanup post-Stage-E.
--
-- Drops the one-time admin helpers used only for the end-to-end smoke, so the
-- project doesn't carry unused RPCs that inflate the attack surface. The
-- maintainer helpers (probe + vault seeder) remain — they're the operator
-- runbook interface and already scoped to service_role + specific names.
--
-- Does NOT drop: admin_autonomy_probe, admin_seed_syncscript_vault_secret.
-- Those stay for rotation + monitoring.

DROP FUNCTION IF EXISTS public.admin_emit_test_event(UUID, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.admin_upsert_test_subscription(UUID, TEXT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS public.admin_smoke_status(UUID);
