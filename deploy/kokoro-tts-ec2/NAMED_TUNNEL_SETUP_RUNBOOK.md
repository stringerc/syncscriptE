# Named Cloudflare tunnel + EC2 Kokoro → stable `KOKORO_TTS_URL` (production)

Use this when you want **Cortana/Kokoro 24/7** with a **hostname that does not change** when `cloudflared` restarts on the server. Your Mac can be off; Vercel calls the tunnel origin from the cloud.

**Prereqs:** A domain on **Cloudflare DNS** (the zone must be in the same Cloudflare account where you create the tunnel). An **Ubuntu EC2** (e.g. `3.148.233.23` or a new instance) with outbound internet and **Docker Engine + Compose v2**.

---

## Part A — Cloudflare (one-time, ~10 minutes)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Zero Trust**.
2. **Networks** → **Tunnels** → **Create a tunnel**.
3. Name it (e.g. `syncscript-kokoro`) → choose **Docker** (or “Cloudflared”) → **copy the tunnel token** (long string). You will paste it into EC2 `.env` as `CLOUDFLARE_TUNNEL_TOKEN`.
4. Still in the tunnel UI → **Public hostname** → **Add**:
   - **Subdomain / domain:** e.g. `kokoro` + `yourdomain.com` → full host `kokoro.yourdomain.com`  
     (Or use a dedicated subdomain under `syncscript.app` if that zone is on Cloudflare.)
   - **Service type:** HTTP  
   - **URL:** `http://localhost:8880`  
     This matches `docker-compose.yml`: `cloudflared-named` uses `network_mode: service:kokoro`, so the connector reaches Kokoro on the same network namespace as port 8880.
5. **Save**. Note the full public URL you will use everywhere: **`https://kokoro.yourdomain.com`** (no trailing slash).

Reference: [Cloudflare Tunnel — Docker install](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local/local-management/create-tunnel/).

---

## Part B — EC2: install Docker (once per instance)

On the instance (Ubuntu):

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl git
# Install Docker Engine + Compose plugin — follow current Docker docs for Ubuntu
sudo usermod -aG docker "$USER"
# log out/in so docker works without sudo, or use sudo docker for first run
```

---

## Part C — Copy this folder to EC2

From your **laptop** (repo root):

```bash
rsync -avz --delete deploy/kokoro-tts-ec2/ ubuntu@YOUR_EC2_IP:/opt/kokoro-tts-ec2/
```

Adjust user/host if you use `ec2-user` or a different path. Ensure `/opt/kokoro-tts-ec2` exists and is writable:

```bash
ssh ubuntu@YOUR_EC2_IP 'sudo mkdir -p /opt/kokoro-tts-ec2 && sudo chown -R ubuntu:ubuntu /opt/kokoro-tts-ec2'
```

---

## Part D — Token + start stack on EC2

On EC2:

```bash
cd /opt/kokoro-tts-ec2
cp env.example .env
nano .env   # set CLOUDFLARE_TUNNEL_TOKEN=<paste from Part A>
```

Run the bundled script (validates token presence, starts **named-tunnel** profile):

```bash
bash scripts/on-ec2-start-named-tunnel.sh
```

Or manually:

```bash
docker compose --profile named-tunnel up -d --build
docker compose logs -f kokoro
```

First boot downloads ~340MB models; wait until `curl -sS http://127.0.0.1:8880/health` returns OK (can take a few minutes).

---

## Part E — Verify from the public internet

From **any** machine (not only EC2):

```bash
curl -sS 'https://kokoro.yourdomain.com/health'
```

You want a successful response (e.g. contains `healthy`). If this fails, fix Cloudflare hostname → `localhost:8880`, tunnel token, or wait for Kokoro healthcheck.

---

## Part F — Point Vercel at the stable origin

On a machine with **Vercel CLI** linked to the SyncScript project (repo root):

```bash
./deploy/kokoro-tts-ec2/scripts/update-vercel-kokoro-url.sh 'https://kokoro.yourdomain.com' --all-environments
vercel deploy --prod --yes
```

Use your **actual** hostname from Part A (no trailing slash).

---

## Part G — Verify production

```bash
curl -sS 'https://www.syncscript.app/api/ai/tts?probe=1'
npm run verify:kokoro:env:post
```

Expect **`kokoroUpstreamReachable: true`**.

---

## Part H — Boot persistence (recommended)

```bash
sudo cp /opt/kokoro-tts-ec2/systemd/kokoro-tts.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now kokoro-tts.service
```

The unit runs `docker compose --profile named-tunnel up -d --build` on boot.

---

## Optional: second origin

If you run a backup Kokoro elsewhere, set **`KOKORO_TTS_FALLBACK_URL`** in Vercel to that base URL (same `/v1/audio/speech` API). See `api/ai/tts.ts`.

---

## Record for the team

Update **`MEMORY.md`** § AWS EC2 — replace the `https://________________` placeholder with your **named** `https://kokoro…` origin so the next session does not point prod at a dead `*.trycloudflare.com` again.
