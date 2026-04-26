# Docker Desktop + Engram (why it felt “slow” and how to fix it)

## What was going wrong

1. **Docker API not responding** — `docker info`, `docker compose`, and even `curl` to the Docker socket could **hang or time out**. That is almost always a **wedged or starting Docker Desktop** VM, not your Compose files.
2. **Starting the full stack** — `docker compose up --build` without service names also builds **frontend (playground)** and pulls **Prometheus/Grafana**. That is heavier than needed for API smoke tests.
3. **Grafana SMTP warnings** — Compose warns when `GRAFANA_SMTP_*` are unset. `integrations/engram-overrides/dot-env.ci` now includes empty placeholders so logs are quieter.

## Fix Docker Desktop first

1. **Restart Docker Desktop** (menu bar whale → **Restart**), or quit and open **Docker** again.
2. Wait until the whale is steady (not “Docker Desktop starting…”).
3. Verify:

```bash
docker run --rm hello-world
```

4. If `~/.docker/run/docker.sock` exists but `docker info` still reports **Cannot connect to the Docker daemon**, run **`docker desktop start`** in Terminal (often fixes a stale socket / UI running without the engine).

If **`docker run hello-world`** hangs or errors, fix Docker before Engram.

## Recommended: minimal stack (db + redis + app only)

From the repo root:

```bash
npm run setup:engram:minimal
```

This runs `integrations/engram-up-minimal.sh`, which:

- Applies `engram-overrides` (same as CI)
- Runs `docker compose up -d --build db redis app` only (skips playground build, Grafana, Prometheus)

Then open `http://127.0.0.1:8000/docs`.

## Full stack (optional)

If you need Grafana/Prometheus/playground:

```bash
cd integrations/engram_translator
docker compose up -d --build
```

## macOS performance tips

- **Resources**: Docker Desktop → Settings → Resources — give enough **CPU/RAM** (4+ GB RAM for Postgres + app).
- **VirtioFS** (Settings → General): often faster bind mounts than osxfs for large trees.
- **Avoid** running other heavy VMs at the same time.

## Supabase Edge `engramStatus: degraded`

Edge calls `ENGRAM_BASE_URL` (your public HTTPS URL, e.g. Cloudflare Quick Tunnel). If **local :8000** returns errors through the tunnel, health shows **degraded**. Fix **local Engram first** (`curl -sf http://127.0.0.1:8000/`), then re-check the tunnel and Edge.
