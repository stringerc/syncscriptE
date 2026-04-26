# Deployment (SyncScript) — tracked pointer

The repo’s root **`docs/`** directory is **gitignored**, so deployment checklists live **here** and under **`integrations/agent-playbooks/`**.

| What | Where |
|------|--------|
| **Edge function deploy + verify** | `integrations/agent-playbooks/01-supabase-edge-deploy.md` |
| **Vercel / frontend** | `vercel.json`, `api/**`; manual: Vercel dashboard or `vercel deploy --prod` |
| **Release gate (local)** | `integrations/agent-playbooks/04-release-gate.md`, `npm run release:gate` |
| **Kokoro / TTS EC2** | `deploy/kokoro-tts-ec2/README.md`, `deploy/kokoro-tts-ec2/VERCEL_EC2_RECOVERY_RUNBOOK.md` |
| **Oracle Cloud (Always Free — Kokoro + OpenClaw + Hermes VM)** | **`deploy/oracle/QUICKSTART.md`**, **`deploy/oracle/VCN_AND_COMPUTE_CONSOLE.md`** (VCN CIDR + A1 shape), **`deploy/oracle/README.md`**, **`deploy/oracle/SECURITY.md`**, **`deploy/oracle/MCP-NOTES.md`** (no OCI MCP in-repo) |
| **CI** | `.github/workflows/ci.yml` |

**Handoff:** Curated ops context stays in **`MEMORY.md`** (local, gitignored) — sync decisions there after infra changes.
