# Nexus Agent Runner — Oracle bring-up runbook

Image is published, Vercel env vars are set. This document is the **paste-ready** sequence to bring the Oracle box online. Everything else has been automated.

| Piece | Status |
|---|---|
| GHCR image `ghcr.io/stringerc/syncscript-nexus-agent-runner:latest` | ✅ Built (multi-arch: amd64 + arm64 — Oracle Always-Free is ARM) |
| GitHub Action `agent-runner-image.yml` rebuilds on every push to `main` touching `deploy/nexus-agent-runner/**` | ✅ Wired |
| Vercel `AGENT_RUNNER_BASE_URL` = `https://nexus-agent-runner.syncscript.app` (production) | ✅ Set |
| Vercel `AGENT_RUNNER_TOKEN` = same value as `NEXUS_PHONE_EDGE_SECRET` | ✅ Set |
| Live-verify workflow `agent-runner-live.yml` (nightly + after image build) | ✅ Wired (soft-fail until ready, set repo var `AGENT_RUNNER_LIVE_VERIFY=1` to make strict) |

---

## Step 1 — SSH to Oracle, drop env

```bash
ssh ubuntu@<your-oracle-ip>
sudo mkdir -p /opt/nexus-agent-runner
sudo tee /opt/nexus-agent-runner/.env >/dev/null <<'EOF'
SUPABASE_URL=https://kwhnrlzibgfedtxpkbgb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<paste from Vercel: vercel env pull then look at SUPABASE_SERVICE_ROLE_KEY>
NVIDIA_API_KEY=<paste from Vercel: NVIDIA_API_KEY>
NEXUS_PHONE_EDGE_SECRET=<paste from Vercel: NEXUS_PHONE_EDGE_SECRET>
AGENT_RUNNER_TOKEN=<same value as NEXUS_PHONE_EDGE_SECRET>
AGENT_RUNNER_PORT=18790
AGENT_RUNNER_MAX_CONCURRENCY=4
AGENT_RUNNER_BROWSER_TIMEOUT_MS=120000
AGENT_RUNNER_POLL_INTERVAL_MS=5000
AGENT_RUNNER_HEARTBEAT_LEASE_SECONDS=300
EOF
sudo chmod 600 /opt/nexus-agent-runner/.env
```

> **How to grab Vercel values fast** (run on your laptop, not Oracle):
> ```bash
> cd ~/syncscript
> vercel env pull .env.runner.tmp
> grep -E '^(SUPABASE_SERVICE_ROLE_KEY|NVIDIA_API_KEY|NEXUS_PHONE_EDGE_SECRET)=' .env.runner.tmp
> # paste those three values into the heredoc above on Oracle, then:
> rm .env.runner.tmp
> ```

---

## Step 2 — One-line install + run (idempotent)

```bash
# Log into GHCR once (PAT with read:packages — public images don't strictly need this, but rate limits are higher)
echo "$GITHUB_PAT" | sudo docker login ghcr.io -u stringerc --password-stdin

# Install Docker if not already (Oracle Ubuntu 22.04):
# curl -fsSL https://get.docker.com | sudo bash

# Pull + run + health-probe:
curl -fsSL https://raw.githubusercontent.com/stringerc/syncscriptE/main/deploy/nexus-agent-runner/bringup.sh \
  | sudo bash
```

You should see:

```
[bringup] pulling ghcr.io/stringerc/syncscript-nexus-agent-runner:latest
[bringup] starting container on :18790
[bringup] waiting for health probe…
[bringup] health OK after 4s
  {"ok":true,"started_at":"2026-04-25T22:56:00Z","active_runs":0,"max_concurrency":4}
[bringup] container is up. logs: docker logs -f nexus-agent-runner
```

Future updates are also one line (the script self-installs):

```bash
sudo /opt/nexus-agent-runner/bringup.sh
```

---

## Step 3 — Cloudflare Tunnel ingress

You already have a tunnel for SyncScript. Edit `~/.cloudflared/config.yml` on the **Oracle VM** (or wherever `cloudflared` runs) and **add** this rule **above** the catch-all `service: http_status:404`:

```yaml
ingress:
  # ── ADD THIS ─────────────────────────────────────────────────
  - hostname: nexus-agent-runner.syncscript.app
    service: http://localhost:18790
    originRequest:
      connectTimeout: 30s
      keepAliveTimeout: 90s
      noHappyEyeballs: true
  # ── existing rules below this line, untouched ────────────────
  - service: http_status:404
```

Then create the DNS record (one time):

```bash
cloudflared tunnel route dns <your-tunnel-name-or-uuid> nexus-agent-runner.syncscript.app
sudo systemctl restart cloudflared
```

Verify from your laptop:

```bash
curl -fsS https://nexus-agent-runner.syncscript.app/v1/health
# → {"ok":true,"started_at":"...","active_runs":0,"max_concurrency":4}
```

---

## Step 4 — Verify end-to-end

On your laptop (we already set the env var; this just re-confirms):

```bash
cd ~/syncscript
AGENT_RUNNER_BASE_URL=https://nexus-agent-runner.syncscript.app \
AGENT_RUNNER_LIVE_VERIFY=1 \
node scripts/verify-agent-runner-live.mjs
# → ok — active_runs=0 max_concurrency=4 since=...
```

Or just kick the GitHub workflow:

```bash
gh workflow run agent-runner-live.yml
gh run watch
```

When it goes green, set the repo variable so future runs are strict:

```bash
gh variable set AGENT_RUNNER_LIVE_VERIFY -b "1"
```

---

## How the system reacts before/after the runner is up

| State | What happens |
|---|---|
| **Runner offline** (no Oracle yet) | App AI page detects agent intent → shows "Agent runner offline — try again in a minute" toast, no run created. Vercel function still returns clean 503. |
| **Runner online, no jobs** | `agent_runs` poller (Oracle) sleeps; `/v1/health` returns `active_runs: 0`. |
| **User asks `@agent find me 3 articles…`** | Vercel inserts row in `agent_runs`, hands off to runner via `/v1/runs/start`. Runner claims via `claim_next_agent_runs` RPC, opens Playwright, screenshots → NVIDIA NIM → action loop. Realtime channel `agent-run:<id>` streams steps to the UI. |
| **User has BYOK Anthropic key** | Settings → Agent → BYOK adds row to `byok_keys` (encrypted in vault). Vercel dispatcher resolves provider on each run; runner uses Anthropic Sonnet 4 instead of NVIDIA NIM. |

---

## Quick rollback / debug

```bash
# Stop runner
sudo docker stop nexus-agent-runner

# Tail logs
sudo docker logs -f nexus-agent-runner --tail 200

# Show health
curl -s http://127.0.0.1:18790/v1/health | jq

# Verify image is current sha
sudo docker inspect nexus-agent-runner --format '{{.Image}}'
```

If you ever rotate `AGENT_RUNNER_TOKEN`, update both:
1. `/opt/nexus-agent-runner/.env` on Oracle  
2. `vercel env add AGENT_RUNNER_TOKEN production` (overwrite)

Then `sudo /opt/nexus-agent-runner/bringup.sh` and `vercel deploy --prod --yes`.
