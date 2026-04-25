-- Enhanced probe: joins net._http_response with net.http_request to show URL + headers.
DROP FUNCTION IF EXISTS public.admin_autonomy_probe();

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
                       'jobname', jobname, 'schedule', schedule, 'active', active
                     ) ORDER BY jobname), '[]'::jsonb)
        FROM cron.job
       WHERE jobname LIKE 'syncscript.%'
    ),
    'vault_names', (
      SELECT coalesce(jsonb_agg(name ORDER BY name), '[]'::jsonb)
        FROM vault.secrets WHERE name LIKE 'syncscript_%'
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
    'recent_cron_runs', (
      SELECT coalesce(jsonb_agg(row_json ORDER BY start_time DESC), '[]'::jsonb)
        FROM (
          SELECT r.start_time,
                 jsonb_build_object(
                   'jobname',        j.jobname,
                   'start_time',     r.start_time,
                   'end_time',       r.end_time,
                   'status',         r.status,
                   'return_message', left(coalesce(r.return_message, ''), 200)
                 ) AS row_json
            FROM cron.job_run_details r
            JOIN cron.job j USING (jobid)
           WHERE j.jobname LIKE 'syncscript.%'
           ORDER BY r.start_time DESC
           LIMIT 20
        ) x
    ),
    'recent_http_responses', (
      SELECT coalesce(jsonb_agg(row_json ORDER BY created DESC), '[]'::jsonb)
        FROM (
          SELECT resp.created,
                 jsonb_build_object(
                   'id',           resp.id,
                   'status_code',  resp.status_code,
                   'created',      resp.created,
                   'url',          req.url,
                   'method',       req.method,
                   'error_msg',    resp.error_msg,
                   'body_excerpt', left(coalesce(resp.content, ''), 200)
                 ) AS row_json
            FROM net._http_response resp
       LEFT JOIN net.http_request_queue req ON req.id = resp.id
           ORDER BY resp.created DESC
           LIMIT 12
        ) y
    ),
    'event_outbox_summary', jsonb_build_object(
      'total',          (SELECT count(*) FROM public.event_outbox),
      'pending_fanout', (SELECT count(*) FROM public.event_outbox WHERE fanout_at IS NULL),
      'completed',      (SELECT count(*) FROM public.event_outbox WHERE completed_at IS NOT NULL)
    ),
    'webhook_deliveries_summary', (
      SELECT coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
        FROM (SELECT status, count(*) AS n FROM public.webhook_deliveries GROUP BY status) z
    ),
    'webhook_subscriptions_count', (
      SELECT count(*) FROM public.webhook_subscriptions
    )
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_autonomy_probe()  FROM public;
GRANT  EXECUTE ON FUNCTION public.admin_autonomy_probe() TO service_role;
