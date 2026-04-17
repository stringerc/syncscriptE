# Playbook 02 — Kokoro / Nexus TTS recovery

**Diagnose:** `GET https://www.syncscript.app/api/ai/tts` and `GET …/api/ai/tts?probe=1` → want `kokoroUpstreamReachable: true`.

**Usual fix:** Live `KOKORO_TTS_URL` on Vercel (no trailing slash) + **prod redeploy** after env change. Stable path: EC2 + named tunnel — **`deploy/kokoro-tts-ec2/NAMED_TUNNEL_SETUP_RUNBOOK.md`** (full checklist), `deploy/kokoro-tts-ec2/README.md`, `VERCEL_EC2_RECOVERY_RUNBOOK.md`, `MEMORY.md`.
