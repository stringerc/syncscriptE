# EC2 Kokoro + Cloudflare + Vercel — recovery runbook

**First-time stable production (named tunnel):** use **[NAMED_TUNNEL_SETUP_RUNBOOK.md](./NAMED_TUNNEL_SETUP_RUNBOOK.md)** — this file is for **recovery** when something already deployed breaks.

Use this when **`GET https://www.syncscript.app/api/ai/tts?probe=1`** returns **`kokoroUpstreamReachable: false`** or the Kokoro hostname **does not resolve**.

## Typical failure

| Symptom | Cause |
|--------|--------|
| `*.trycloudflare.com` **NXDOMAIN** | Quick Tunnel hostname expired. |
| `kokoroConfigured: true` but probe **false** | **`KOKORO_TTS_URL`** points at a dead origin. |

## Get the public HTTPS origin

### Cloudflare (no SSH)

**Zero Trust** → **Networks** → **Tunnels** → your EC2 tunnel → **Public hostnames** → copy **HTTPS** origin. Confirm: `curl -sS 'https://ORIGIN/health'`.

### SSH (when port 22 is allowed for your IP)

```bash
ssh -i ~/.ssh/syncscript-ec2.pem ubuntu@3.148.233.23
cd /opt/kokoro-tts-ec2
curl -sS http://127.0.0.1:8880/health
sudo docker compose logs cloudflared-named --tail 80
# quick tunnel: sudo docker compose logs cloudflared-quick --tail 80
```

## Point Vercel

```bash
./deploy/kokoro-tts-ec2/scripts/update-vercel-kokoro-url.sh 'https://YOUR_ORIGIN' --all-environments
vercel deploy --prod --yes
```

After changing **`KOKORO_TTS_URL`**, **redeploy production** (or push to Git). Until a new build runs, **`GET /api/ai/tts`** may still show the **previous** `kokoroDirectOrigin`.

## Verify

```bash
curl -sS 'https://www.syncscript.app/api/ai/tts?probe=1'
npm run verify:tts:production:post
```

See also **`README.md`** in this folder for full Docker + named-tunnel setup.
