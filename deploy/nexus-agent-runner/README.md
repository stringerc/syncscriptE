# Nexus Agent Runner

The browser-driving agent worker for SyncScript Nexus Agent Mode. Runs as a single Docker container on the Oracle Cloud Always-Free VM (the same host as the Kokoro TTS fallback).

## How it fits

```
Vercel /api/agent/start  ──>  agent_runs row (Postgres)
                                       │
                                       ▼  (poll every 5s)
                       ┌──────────────────────────────────┐
                       │  Oracle Agent Runner (this dir)  │
                       │   • Playwright Chromium pool ×4  │
                       │   • Vision LLM via NVIDIA / BYOK │
                       │   • SyncScript tools through     │
                       │     existing /phone/nexus-execute│
                       │   • Encrypted browser_contexts   │
                       │     (Gmail/etc cookies persist)  │
                       └──────────────────────────────────┘
```

Image is built automatically by **GitHub Actions** on every push to `main` that touches this folder. You don't build locally — you `docker pull` on the VM.

## How you “see” the browser today vs a native window

| Mode | What you see | Where it runs |
|------|----------------|---------------|
| **Default (headless)** | Live JPEG stream + timeline in the dashboard (**`AgentLiveCanvas`** → WebSocket `/v1/runs/:id/live`, CDP `Page.startScreencast`) plus per-step screenshots in Postgres. Same pattern as Browserbase / Operator-style products — not a separate OS Chrome window. | Oracle Docker |
| **Headed (`AGENT_RUNNER_HEADED=1`)** | A **real Chromium window** on the runner host (Mac with display, or Linux with X11/VNC and `DISPLAY` set). Still get dashboard screencast if the network path is up. | Dev machine or GUI-capable VM |

Set in **`env.example`**: `AGENT_RUNNER_HEADED`, optional `AGENT_RUNNER_SLOW_MO_MS`. **Do not** enable headed inside default Oracle Docker unless you have injected a display stack (e.g. Xvfb + x11vnc); it will fail without `DISPLAY`.

## Deploy in five commands

Once Cloudflare-tunnel + GHCR access are set up, future updates are 5 minutes total.

### One-time setup (first install on the Oracle VM)

```bash
# 1. SSH to the VM (the same one running Kokoro)
ssh ubuntu@<your-oracle-ip>

# 2. Drop the env file (template in deploy/nexus-agent-runner/env.example)
sudo mkdir -p /opt/nexus-agent-runner
sudo nano /opt/nexus-agent-runner/.env
# Required keys (see env.example):
#   SUPABASE_URL              = https://kwhnrlzibgfedtxpkbgb.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY = (same as on Vercel)
#   NVIDIA_API_KEY            = (same as on Vercel)
#   NEXUS_PHONE_EDGE_SECRET   = (same as on Vercel)
#   AGENT_RUNNER_TOKEN        = (same as on Vercel — must match for /v1/runs/start auth)
#   AGENT_RUNNER_PORT         = 18790
#   AGENT_RUNNER_MAX_CONCURRENCY = 4

# 3. Log in to GHCR so docker pull works (one-time; PAT with read:packages scope)
echo "$GITHUB_PAT" | sudo docker login ghcr.io -u <your-gh-username> --password-stdin

# 4. Run the bringup script — pulls the latest image, replaces the container, health-probes
curl -fsSL https://raw.githubusercontent.com/stringerc/syncscriptE/main/deploy/nexus-agent-runner/bringup.sh \
  | sudo bash

# 5. Add a Cloudflare Tunnel ingress entry so https://nexus-agent-runner.syncscript.app
#    routes to localhost:18790 — edit ~/.cloudflared/config.yml on the VM:
#
#    ingress:
#      - hostname: nexus-agent-runner.syncscript.app
#        service: http://localhost:18790
#      - service: http_status:404
#
#    Then: sudo cloudflared service restart
```

### Future updates (~30 seconds)

```bash
sudo /opt/nexus-agent-runner/bringup.sh
```

Pulls the latest image (auto-built by GitHub Actions on every merge to `main`), replaces the container, and health-probes. Idempotent. Safe to schedule via cron at 04:00 daily.

### Verify from your laptop

```bash
# After Cloudflare DNS propagates:
curl https://nexus-agent-runner.syncscript.app/v1/health
# → {"ok":true,"started_at":"...","active_runs":0,"max_concurrency":4}

# Or run the contract smoke from the repo:
node scripts/verify-agent-runner-live.mjs
```

### See a real Chromium window on **your** screen (local Mac)

Deploying the Vercel app does **not** open Chrome on your desktop — the runner lives on the VM (headless) or you run it locally. To prove headed Playwright works on your machine (same engine as the runner):

```bash
cd /path/to/syncscript
npx playwright install chromium   # once
npm run verify:headed-browser     # opens a visible window ~5s, then exits
```

Skip the window (CI / SSH without display): `VERIFY_HEADED_SKIP=1 npm run verify:headed-browser`.  
Headless but still assert navigation: `VERIFY_HEADED_HEADLESS=1 npm run verify:headed-browser`.

After you merge runner changes, **re-pull the Docker image on Oracle** (`sudo /opt/nexus-agent-runner/bringup.sh`). Set `AGENT_RUNNER_HEADED=1` only where `DISPLAY` exists — not in default Docker on Oracle.

### End-to-end live stream in the app (production-shaped)

Needs `SUPABASE_SERVICE_ROLE_KEY`, `AGENT_RUNNER_TOKEN`, and a reachable runner URL (from `runner_endpoints` or `AGENT_RUNNER_BASE_URL`):

```bash
node scripts/smoke-agent-live-screencast.mjs
```

Expect binary WebSocket frames while the run executes; that is what **`AgentLiveCanvas`** consumes in the dashboard.

### Vercel side

Two env vars (one-time):

```bash
vercel env add AGENT_RUNNER_BASE_URL production    # value: https://nexus-agent-runner.syncscript.app
vercel env add AGENT_RUNNER_TOKEN production       # value: same as your VM's AGENT_RUNNER_TOKEN
vercel deploy --prod --yes
```

Without these, `/api/agent/start` still inserts the run row and the runner picks it up via 5s poll. The env vars just give us the synchronous "start now" hint that shaves a few seconds off the first response.

## Operational commands

```bash
# Tail logs:
sudo docker logs -f nexus-agent-runner

# Health summary:
curl http://localhost:18790/v1/health

# Pause everyone's agent runs without touching the VM (admin SQL):
update automation_policies set agent_paused = true, paused_reason = 'maintenance';

# Quick restart (no image pull):
sudo docker restart nexus-agent-runner

# Stop entirely (queue piles up; resume by starting again):
sudo docker stop nexus-agent-runner
```

## What the runner does NOT do

- **Captcha solving** — when it hits one, it sets `status='waiting_user'` with `pause_reason='captcha'` and the UI shows an Approve/Decline + a future "Take control" button.
- **Banking, healthcare, .gov sites** — blocked by `automation_policies.blocked_sites` in the DB, not in code. Edit per-user via Settings → Agent.
- **Aggressive bot evasion** — Oracle datacenter IP. Sites with hard anti-automation (LinkedIn, Twitter/X) will fail; we log it and tell the user.

## Cost

$0 / month if you stick with NVIDIA NIM free tier and Oracle Always-Free VM. BYOK users pay their own LLM costs — keys live encrypted in Supabase Vault per user.
