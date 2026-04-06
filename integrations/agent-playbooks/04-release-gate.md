# Playbook 04 — Release gate

**Full:** `npm run release:gate`

**Engram-focused:** `npm run release:gate:engram` or `:strict` per `package.json`.

**CI:** `.github/workflows/ci.yml` runs `tsc` + `build`; does not deploy Vercel or Supabase.
