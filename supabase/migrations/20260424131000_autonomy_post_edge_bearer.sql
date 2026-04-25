-- syncscript_autonomy_post: if the target URL is a Supabase Edge function
-- (host contains "functions.supabase.co" or ".supabase.co/functions/v1/"),
-- ALSO include `Authorization: Bearer <anon>` from vault — the Edge gateway
-- 401s any request without that header regardless of our x-nexus-internal-secret.
--
-- Behavior is additive: Vercel /api/cron/* calls keep passing ONLY
-- `Authorization: Bearer <cron_secret>`. Edge calls now pass BOTH our internal
-- secret header AND the required platform Bearer.
DROP FUNCTION IF EXISTS public.syncscript_autonomy_post(TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.syncscript_autonomy_post(
  url         TEXT,
  secret_name TEXT,
  auth_scheme TEXT DEFAULT 'Bearer',
  body        JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  secret_value TEXT;
  anon_value   TEXT;
  headers      JSONB := jsonb_build_object('Content-Type', 'application/json');
  is_edge      BOOLEAN := position('functions.supabase.co' IN url) > 0
                       OR position('.supabase.co/functions/v1/' IN url) > 0;
  req_id       BIGINT;
BEGIN
  SELECT decrypted_secret INTO secret_value
    FROM vault.decrypted_secrets
   WHERE name = secret_name
   LIMIT 1;

  IF secret_value IS NULL THEN
    RAISE NOTICE 'syncscript_autonomy_post: secret % not found; skipping %', secret_name, url;
    RETURN NULL;
  END IF;

  -- Application-level auth (ours).
  IF auth_scheme = 'x-nexus-internal-secret' THEN
    headers := headers || jsonb_build_object('x-nexus-internal-secret', secret_value);
  ELSE
    headers := headers || jsonb_build_object('Authorization', auth_scheme || ' ' || secret_value);
  END IF;

  -- Platform-level auth (Supabase Edge default gate): add only for Edge URLs
  -- and only when we didn't already set Authorization above.
  IF is_edge AND NOT (headers ? 'Authorization') THEN
    SELECT decrypted_secret INTO anon_value
      FROM vault.decrypted_secrets
     WHERE name = 'syncscript_supabase_anon_key'
     LIMIT 1;
    IF anon_value IS NOT NULL THEN
      headers := headers || jsonb_build_object('Authorization', 'Bearer ' || anon_value);
    ELSE
      RAISE NOTICE 'syncscript_autonomy_post: Edge URL % but syncscript_supabase_anon_key not in vault; Edge gateway will 401', url;
    END IF;
  END IF;

  SELECT net.http_post(url := url, headers := headers, body := body) INTO req_id;
  RETURN req_id;
END;
$$;

REVOKE ALL ON FUNCTION public.syncscript_autonomy_post(TEXT, TEXT, TEXT, JSONB) FROM public;
GRANT  EXECUTE ON FUNCTION public.syncscript_autonomy_post(TEXT, TEXT, TEXT, JSONB) TO postgres;
