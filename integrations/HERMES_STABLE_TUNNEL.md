# Hermes — stable public URL (production-style)

Quick Tunnels (`*.trycloudflare.com`) rotate when `cloudflared` restarts. For a **fixed** hostname that Supabase can keep in `HERMES_BASE_URL`, use one of these patterns.

## Option A — Named Cloudflare Tunnel (recommended)

You need a hostname on a zone in Cloudflare DNS (e.g. `hermes.exec.example.com`).

1. Install [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) on the machine that runs the Hermes process (mock, real executor, or reverse proxy to it).

2. Login and create a tunnel:
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create syncscript-hermes
   ```

3. Note the tunnel **UUID** from the output. Add a **config file** (often `~/.cloudflared/config.yml`):

   ```yaml
   tunnel: <TUNNEL_UUID>
   credentials-file: /Users/you/.cloudflared/<TUNNEL_UUID>.json

   ingress:
     - hostname: hermes.exec.example.com
       service: http://127.0.0.1:18880
     - service: http_status:404
   ```

4. In the Cloudflare dashboard: **Networks → Tunnels →** your tunnel → assign the **public hostname** `hermes.exec.example.com` (or use `cloudflared tunnel route dns` per Cloudflare docs).

5. Run the tunnel (long-lived process or systemd):
   ```bash
   cloudflared tunnel run syncscript-hermes
   ```

6. Point Supabase at the stable origin (no trailing path):
   ```bash
   export HERMES_BASE_URL_TARGET=https://hermes.exec.example.com
   npm run bringup:hermes:target
   ```
   (Same as `npm run bringup:hermes:tunnel` with that env set.) That updates the secret, redeploys Edge, and probes `/hermes/health`. It does **not** start Quick Tunnel or the mock.

   Or run mock + tunnel from one machine:
   ```bash
   HERMES_NAMED_TUNNEL=syncscript-hermes HERMES_PUBLIC_BASE_URL=https://hermes.exec.example.com npm run bringup:hermes:tunnel
   ```

7. Verify:
   ```bash
   ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL=1 HERMES_REQUIRE_CONNECTED=1 npm run verify:hermes:edge-live
   ```

## Option B — EC2 / VPS with a normal TLS certificate

Run the Hermes HTTP server (or mock) on the instance, terminate TLS with nginx/Caddy, and set:

```bash
HERMES_BASE_URL_TARGET=https://hermes.yourdomain.com npm run bringup:hermes:tunnel
```

Ensure `GET /health` or `GET /healthz` returns **200** on the public URL so the Edge bridge can reach upstream liveness.

## TLS and Edge

`hermes-bridge` calls `HERMES_BASE_URL` from Supabase Edge. Use a **valid HTTPS** URL; self-signed certs will fail unless you terminate TLS at a proxy with a public CA certificate.
