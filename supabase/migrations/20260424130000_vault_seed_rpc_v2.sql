-- Extend the scoped vault seeder to also allow the anon key, which the
-- autonomy helper needs to satisfy Supabase Edge's default Bearer-token gate
-- when pg_cron hits `…/functions.supabase.co/make-server-57781ad9/internal/*`.
DROP FUNCTION IF EXISTS public.admin_seed_syncscript_vault_secret(TEXT, TEXT, TEXT);

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
  IF p_name NOT IN (
    'syncscript_cron_secret',
    'syncscript_nexus_edge_secret',
    'syncscript_supabase_anon_key'
  ) THEN
    RAISE EXCEPTION 'admin_seed_syncscript_vault_secret: refused for name "%"; allowed: syncscript_cron_secret / syncscript_nexus_edge_secret / syncscript_supabase_anon_key.', p_name;
  END IF;

  IF coalesce(p_value, '') = '' THEN
    RAISE EXCEPTION 'admin_seed_syncscript_vault_secret: p_value must be non-empty';
  END IF;

  DELETE FROM vault.secrets WHERE name = p_name;
  SELECT vault.create_secret(p_value, p_name, coalesce(p_description, '')) INTO new_id;
  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_seed_syncscript_vault_secret(TEXT, TEXT, TEXT) FROM public;
GRANT  EXECUTE ON FUNCTION public.admin_seed_syncscript_vault_secret(TEXT, TEXT, TEXT) TO service_role;
