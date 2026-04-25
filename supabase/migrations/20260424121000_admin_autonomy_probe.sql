-- Read-only diagnostic RPC for Stage A/C verification.
-- Returns a JSONB snapshot of extensions, cron jobs, vault secret names (not values),
-- table existence, and pg_net delivery stats. service_role only.
CREATE OR REPLACE FUNCTION public.admin_autonomy_probe()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault, net, cron
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'extensions', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('name', extname, 'version', extversion) ORDER BY extname), '[]'::jsonb)
        FROM pg_extension
       WHERE extname IN ('pg_cron', 'pg_net', 'pgcrypto', 'pgsodium', 'supabase_vault')
    ),
    'cron_jobs', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
                       'jobname', jobname,
                       'schedule', schedule,
                       'active',   active
                     ) ORDER BY jobname), '[]'::jsonb)
        FROM cron.job
       WHERE jobname LIKE 'syncscript.%'
    ),
    'vault_names', (
      SELECT coalesce(jsonb_agg(name ORDER BY name), '[]'::jsonb)
        FROM vault.secrets
       WHERE name LIKE 'syncscript_%'
    ),
    'tables_exist', jsonb_build_object(
      'playbook_runs',         to_regclass('public.playbook_runs')         IS NOT NULL,
      'event_outbox',          to_regclass('public.event_outbox')          IS NOT NULL,
      'webhook_subscriptions', to_regclass('public.webhook_subscriptions') IS NOT NULL,
      'webhook_deliveries',    to_regclass('public.webhook_deliveries')    IS NOT NULL
    ),
    'rpcs_exist', jsonb_build_object(
      'claim_next_playbook_runs',     (SELECT count(*) > 0 FROM pg_proc WHERE proname = 'claim_next_playbook_runs'),
      'fanout_event_outbox',          (SELECT count(*) > 0 FROM pg_proc WHERE proname = 'fanout_event_outbox'),
      'claim_due_webhook_deliveries', (SELECT count(*) > 0 FROM pg_proc WHERE proname = 'claim_due_webhook_deliveries'),
      'finalize_webhook_delivery',    (SELECT count(*) > 0 FROM pg_proc WHERE proname = 'finalize_webhook_delivery'),
      'syncscript_autonomy_post',     (SELECT count(*) > 0 FROM pg_proc WHERE proname = 'syncscript_autonomy_post')
    ),
    'net_http_responses_recent', (
      SELECT coalesce(jsonb_agg(row_json ORDER BY created DESC), '[]'::jsonb)
        FROM (
          SELECT created,
                 jsonb_build_object(
                   'id',           id,
                   'status_code',  status_code,
                   'created',      created,
                   'error_msg',    error_msg,
                   'content_type', content_type
                 ) AS row_json
            FROM net._http_response
           ORDER BY created DESC
           LIMIT 10
        ) recent
    ),
    'queued_http_requests', (
      SELECT count(*) FROM net.http_request_queue
    )
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_autonomy_probe()  FROM public;
GRANT  EXECUTE ON FUNCTION public.admin_autonomy_probe() TO service_role;
