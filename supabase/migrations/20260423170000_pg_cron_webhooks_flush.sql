-- Autonomy heartbeat: flush outbound webhook queue every minute.
--
-- Depends on:
--   - 20260423150000_pg_cron_autonomy.sql (enables pg_cron/pg_net, ships syncscript_autonomy_post helper)
--   - 20260423160000_event_outbox_and_webhooks.sql (tables + fanout/claim/finalize RPCs)
--
-- Vault secret `syncscript_nexus_edge_secret` must already exist
-- (set when the first autonomy migration was applied).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'syncscript.webhooks.flush') THEN
    PERFORM cron.unschedule('syncscript.webhooks.flush');
  END IF;
END $$;

SELECT cron.schedule(
  'syncscript.webhooks.flush',
  '* * * * *',
  $sql$
  SELECT public.syncscript_autonomy_post(
    (SELECT coalesce(current_setting('app.supabase_edge_base', true),
                     'https://kwhnrlzibgfedtxpkbgb.functions.supabase.co')
      || '/make-server-57781ad9/internal/webhooks/flush'),
    'syncscript_nexus_edge_secret',
    'x-nexus-internal-secret'
  );
  $sql$
);
