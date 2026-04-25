-- Admin-only RPC to seed (and rotate) the two SyncScript vault secrets.
--
-- Scoped by `p_name` check so it CANNOT be used to dump arbitrary secrets or
-- write to any vault entry other than the two SyncScript autonomy seeds.
-- Service-role-only; never exposed to anon/authenticated/public.

CREATE OR REPLACE FUNCTION public.admin_seed_syncscript_vault_secret(
  p_name        TEXT,
  p_value       TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  new_id UUID;
BEGIN
  IF p_name NOT IN ('syncscript_cron_secret', 'syncscript_nexus_edge_secret') THEN
    RAISE EXCEPTION 'admin_seed_syncscript_vault_secret: refused for name "%"; only syncscript_cron_secret / syncscript_nexus_edge_secret are allowed.', p_name;
  END IF;

  IF coalesce(p_value, '') = '' THEN
    RAISE EXCEPTION 'admin_seed_syncscript_vault_secret: p_value must be non-empty';
  END IF;

  -- Idempotent rotation: drop any existing entry with the same name, then insert.
  DELETE FROM vault.secrets WHERE name = p_name;
  SELECT vault.create_secret(p_value, p_name, coalesce(p_description, '')) INTO new_id;
  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_seed_syncscript_vault_secret(TEXT, TEXT, TEXT) FROM public;
GRANT  EXECUTE ON FUNCTION public.admin_seed_syncscript_vault_secret(TEXT, TEXT, TEXT) TO service_role;
