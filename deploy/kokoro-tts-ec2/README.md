# Kokoro TTS on EC2 (SyncScript production)

**Production (stable hostname, not your laptop):** follow **[NAMED_TUNNEL_SETUP_RUNBOOK.md](./NAMED_TUNNEL_SETUP_RUNBOOK.md)** end-to-end — Cloudflare named tunnel → EC2 `docker compose --profile named-tunnel` → `KOKORO_TTS_URL` on Vercel. On the server, after `.env` has `CLOUDFLARE_TUNNEL_TOKEN`: `bash scripts/on-ec2-start-named-tunnel.sh`.

**Recovery / Vercel URL drift:** see **[VERCEL_EC2_RECOVERY_RUNBOOK.md](./VERCEL_EC2_RECOVERY_RUNBOOK.md)** (probe fails, dead `*.trycloudflare.com`, SSH + Cloudflare dashboard).

This stack replaces a **laptop + ephemeral `trycloudflare.com` URL** with **EC2 + Docker + a stable public URL**.

## Why this shape

| Approach | URL stability | Ops |
|----------|----------------|-----|
| Quick Tunnel (`*.trycloudflare.com`) | Changes on restart | OK for dev |
| **Named Cloudflare Tunnel** + DNS | **Stable** | **Recommended** |
| Raw public IP + Nginx | Stable | You manage TLS + firewall |

SyncScript’s Vercel function (`api/ai/tts`) calls `KOKORO_TTS_URL` + `/v1/audio/speech`. This container serves that API and maps SyncScript voice ids (`cortana`, `nexus`, …) to ONNX voices (`server.py`).

## EC2 sizing

- **Minimum**: `t3.small` (2 vCPU, 2GB) — ONNX inference is CPU-heavy; first synthesis after boot is slow.
- **Comfortable**: `t3.medium` or larger.
- **ARM (Graviton)**: Usually works; build images on the same arch or use `docker buildx` for `linux/arm64`.

## One-time: Cloudflare named tunnel

1. Cloudflare dashboard → **Zero Trust** → **Networks** → **Tunnels** → **Create a tunnel**.
2. Choose **Docker**, copy the **`TUNNEL_TOKEN`**.
3. Under the tunnel → **Public hostname**:
   - **Subdomain**: e.g. `kokoro` (full host e.g. `kokoro.yourdomain.com` on your zone).
   - **Service type**: HTTP
   - **URL**: `http://localhost:8880`  
     (Correct because `cloudflared` uses `network_mode: service:kokoro` in Compose — same network namespace as the app.)

Official reference: [Cloudflare Tunnel — Docker](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local/local-management/create-tunnel/).

## EC2 setup (Ubuntu 22.04+)

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl git
# Install Docker Engine + Compose plugin (see Docker docs for your distro)
sudo mkdir -p /opt/kokoro-tts-ec2
sudo chown "$USER:$USER" /opt/kokoro-tts-ec2
cd /opt/kokoro-tts-ec2
# Copy this folder from the repo (rsync/scp/git sparse checkout)
```

From your laptop (repo root):

```bash
rsync -avz deploy/kokoro-tts-ec2/ ec2-user@YOUR_EC2:/opt/kokoro-tts-ec2/
```

On EC2:

```bash
cd /opt/kokoro-tts-ec2
cp env.example .env
nano .env   # paste CLOUDFLARE_TUNNEL_TOKEN=...
```

### Build on Apple silicon for `amd64` EC2

```bash
export DOCKER_DEFAULT_PLATFORM=linux/amd64
docker compose build
```

### Start (production — named tunnel)

```bash
docker compose --profile named-tunnel up -d --build
docker compose logs -f kokoro
```

First boot downloads ~340MB of models; healthcheck allows up to **3 minutes** before marking healthy.

### Optional: quick tunnel only (dev / smoke)

```bash
docker compose --profile quick-tunnel up -d --build
docker compose logs -f cloudflared-quick
# Copy https://….trycloudflare.com from logs → Vercel KOKORO_TTS_URL (no trailing slash)
```

## Point Vercel at the tunnel

Set **Production** env (no path suffix; no trailing slash):

```text
KOKORO_TTS_URL=https://kokoro.yourdomain.com
```

From a machine with the linked Vercel project:

```bash
./deploy/kokoro-tts-ec2/scripts/update-vercel-kokoro-url.sh https://kokoro.yourdomain.com
```

Then redeploy SyncScript on Vercel (or wait for the next deployment) and run:

```bash
npm run verify:tts:production:post
```

## systemd (auto-start on boot)

```bash
sudo cp /opt/kokoro-tts-ec2/systemd/kokoro-tts.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now kokoro-tts.service
```

Edit `WorkingDirectory` in the unit if you did not use `/opt/kokoro-tts-ec2`.

## Security notes

- Compose publishes Kokoro as **`127.0.0.1:8880:8880`** on the host so it is **not** open to the public internet; only Cloudflare reaches it via the tunnel.
- Optional: add **Cloudflare Access** policies on the public hostname if you want zero unauthenticated hits (Vercel still calls it server-side; configure service tokens / bypass rules as needed).

## Sync with `mission-control/tts-server`

`server.py` in this folder is the same app as `mission-control/tts-server/server.py` (voice aliases included). If you change one, copy to the other or treat **this deploy folder** as the source of truth for EC2.
