-- Persistent browser contexts per user.
--
-- Stores Playwright `storageState` JSON (cookies + localStorage + IndexedDB
-- entries) so the agent's headless Chromium remembers Gmail/GitHub/etc.
-- logins across runs.
--
-- Storage strategy:
--   - The actual `storageState` JSON (which contains plaintext cookie values)
--     lives in `vault.secrets` under name `browser_ctx_<user>_<host_or_default>`.
--     Encrypted at rest via supabase_vault (pgsodium-backed).
--   - This table holds non-sensitive metadata: which user, which hostnames,
--     last_used_at, byte size. Drives the "Connected sites" UI list.
--
-- We currently store ONE storageState per user (key = `default`). Per-host
-- splitting is a future optimization; the column is here to support that.

CREATE TABLE IF NOT EXISTS public.browser_contexts (
  user_id        UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  /** Hostnames whose cookies are stored — populated from storageState.cookies. */
  hostnames      TEXT[] NOT NULL DEFAULT '{}',
  /** Approx byte size of the encrypted blob; for "you've stored 12 KB of cookies" UX. */
  bytes          INT NOT NULL DEFAULT 0,
  /** Number of cookies (informational only, not authoritative). */
  cookie_count   INT NOT NULL DEFAULT 0,
  last_used_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.browser_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "browser_contexts_owner_select" ON public.browser_contexts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "browser_contexts_owner_delete" ON public.browser_contexts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- writes/upserts go through SECURITY DEFINER RPCs (service-role only) so the
-- vault entry stays in lockstep with the metadata row.

CREATE OR REPLACE FUNCTION public.touch_browser_contexts_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_browser_contexts_updated ON public.browser_contexts;
CREATE TRIGGER trg_browser_contexts_updated BEFORE UPDATE ON public.browser_contexts
  FOR EACH ROW EXECUTE FUNCTION public.touch_browser_contexts_updated_at();

-- ---------------------------------------------------------------------------
-- RPCs (service_role only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_save_browser_context(
  p_user_id      UUID,
  p_storage_json TEXT,
  p_hostnames    TEXT[],
  p_cookie_count INT DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  vault_name  TEXT := 'browser_ctx_' || p_user_id::text || '_default';
  payload_bytes INT;
BEGIN
  IF coalesce(p_storage_json, '') = '' THEN
    -- Empty storageState — clear any existing entry instead of inserting empty.
    DELETE FROM vault.secrets WHERE name = vault_name;
    DELETE FROM public.browser_contexts WHERE user_id = p_user_id;
    RETURN;
  END IF;

  payload_bytes := octet_length(p_storage_json);

  -- Rotate-in-place: vault doesn't support direct upsert, so we drop+create.
  DELETE FROM vault.secrets WHERE name = vault_name;
  PERFORM vault.create_secret(p_storage_json, vault_name, 'browser context for SyncScript Nexus Agent');

  INSERT INTO public.browser_contexts (user_id, hostnames, bytes, cookie_count, last_used_at)
       VALUES (p_user_id, coalesce(p_hostnames, '{}'), payload_bytes, coalesce(p_cookie_count, 0), now())
  ON CONFLICT (user_id) DO UPDATE
    SET hostnames    = EXCLUDED.hostnames,
        bytes        = EXCLUDED.bytes,
        cookie_count = EXCLUDED.cookie_count,
        last_used_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_load_browser_context(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  vault_name TEXT := 'browser_ctx_' || p_user_id::text || '_default';
  payload    TEXT;
BEGIN
  SELECT decrypted_secret INTO payload
    FROM vault.decrypted_secrets WHERE name = vault_name LIMIT 1;
  RETURN payload;
END;
$$;

/**
 * Drop the entire context (logout-equivalent across all sites). User-callable
 * via PostgREST RPC — RLS-equivalent enforced inside the function.
 */
CREATE OR REPLACE FUNCTION public.clear_browser_context()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  uid UUID := auth.uid();
  vault_name TEXT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'clear_browser_context: must be called from an authenticated context';
  END IF;
  vault_name := 'browser_ctx_' || uid::text || '_default';
  DELETE FROM vault.secrets WHERE name = vault_name;
  DELETE FROM public.browser_contexts WHERE user_id = uid;
END;
$$;

/**
 * Drop one site's cookies without losing the rest. Reads current storageState
 * from vault, filters out the host, writes back.
 */
CREATE OR REPLACE FUNCTION public.disconnect_browser_site(p_hostname TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  uid UUID := auth.uid();
  vault_name TEXT;
  payload TEXT;
  parsed  JSONB;
  filtered JSONB;
  remaining_hosts TEXT[];
  cookie_count_after INT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'disconnect_browser_site: must be called from an authenticated context';
  END IF;
  IF coalesce(p_hostname, '') = '' THEN
    RAISE EXCEPTION 'disconnect_browser_site: hostname required';
  END IF;

  vault_name := 'browser_ctx_' || uid::text || '_default';
  SELECT decrypted_secret INTO payload FROM vault.decrypted_secrets WHERE name = vault_name LIMIT 1;
  IF payload IS NULL THEN RETURN; END IF;

  parsed := payload::jsonb;

  -- storageState shape: { cookies: [{ name, value, domain, path, … }], origins: [{ origin, localStorage, sessionStorage }] }
  -- Filter cookies whose domain ends with p_hostname, and origins whose origin includes p_hostname.
  filtered := jsonb_set(
    parsed,
    '{cookies}',
    coalesce(
      (
        SELECT jsonb_agg(c)
          FROM jsonb_array_elements(coalesce(parsed -> 'cookies', '[]'::jsonb)) c
         WHERE NOT (lower(c ->> 'domain') = lower(p_hostname)
                 OR lower(c ->> 'domain') = '.' || lower(p_hostname)
                 OR lower(c ->> 'domain') LIKE '%.' || lower(p_hostname))
      ),
      '[]'::jsonb
    )
  );
  filtered := jsonb_set(
    filtered,
    '{origins}',
    coalesce(
      (
        SELECT jsonb_agg(o)
          FROM jsonb_array_elements(coalesce(filtered -> 'origins', '[]'::jsonb)) o
         WHERE position(lower(p_hostname) IN lower(o ->> 'origin')) = 0
      ),
      '[]'::jsonb
    )
  );

  -- Recompute hostnames + cookie_count from the filtered state.
  SELECT array_agg(DISTINCT trim(both '.' from lower(c ->> 'domain')))
       , count(*)
    INTO remaining_hosts, cookie_count_after
    FROM jsonb_array_elements(coalesce(filtered -> 'cookies', '[]'::jsonb)) c;

  IF cookie_count_after = 0 THEN
    DELETE FROM vault.secrets WHERE name = vault_name;
    DELETE FROM public.browser_contexts WHERE user_id = uid;
  ELSE
    DELETE FROM vault.secrets WHERE name = vault_name;
    PERFORM vault.create_secret(filtered::text, vault_name, 'browser context for SyncScript Nexus Agent');
    UPDATE public.browser_contexts
       SET hostnames    = coalesce(remaining_hosts, '{}'),
           bytes        = octet_length(filtered::text),
           cookie_count = cookie_count_after,
           last_used_at = now()
     WHERE user_id = uid;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_browser_context(UUID, TEXT, TEXT[], INT) FROM public;
REVOKE ALL ON FUNCTION public.admin_load_browser_context(UUID)                     FROM public;
GRANT  EXECUTE ON FUNCTION public.admin_save_browser_context(UUID, TEXT, TEXT[], INT) TO service_role;
GRANT  EXECUTE ON FUNCTION public.admin_load_browser_context(UUID)                     TO service_role;
GRANT  EXECUTE ON FUNCTION public.clear_browser_context()                              TO authenticated;
GRANT  EXECUTE ON FUNCTION public.disconnect_browser_site(TEXT)                        TO authenticated;
