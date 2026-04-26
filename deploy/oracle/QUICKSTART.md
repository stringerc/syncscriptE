# Oracle CLI — quick start (on your Mac)

## Do I have your fingerprint or private key?

**No.** Those exist only on **your** machine. This repo never stores them.

- **Fingerprint:** derive from your **public** API key PEM (the one uploaded in Oracle Console):

  ```bash
  bash deploy/oracle/scripts/compute-api-key-fingerprint.sh /path/to/your_public_key.pem
  ```

  The output must **match** the fingerprint shown in **Identity → Users → API keys**.

- **Private key:** keep at e.g. `~/.oci/oci_api_key.pem` (`chmod 600`). Put the **absolute path** in `deploy/oracle/env.local` as `OCI_KEY_FILE=`.

## One-time setup (npm)

From **repo root**:

```bash
npm run oracle:env:copy-example
# Edit deploy/oracle/env.local — tenancy OCID, user OCID, fingerprint, OCI_REGION=us-ashburn-1, OCI_KEY_FILE
npm run oracle:config:generate
npm run oracle:config:verify
```

Equivalent shell-only flow:

```bash
cp deploy/oracle/env.local.example deploy/oracle/env.local
nano deploy/oracle/env.local
bash deploy/oracle/scripts/generate-oci-config.sh
bash deploy/oracle/scripts/oci-verify-connection.sh
```

Then: **Console** → **VCN** (add IPv4 CIDR e.g. `10.0.0.0/16`) → **instance with shape `VM.Standard.A1.Flex`** (that’s “A1”) → **rsync** repo to VM → **`deploy/oracle/README.md`** §5–11. **Detailed clicks:** **`deploy/oracle/VCN_AND_COMPUTE_CONSOLE.md`**.

---

## Nexus voice “everywhere” — already in the app

Landing voice and dashboard AI tab both use **`POST /api/ai/tts`** (Kokoro `cortana` preset) when synthesis runs. **No extra app feature** is required for “any device” — you need:

1. **Vercel** `KOKORO_TTS_URL` → a **public HTTPS** Kokoro origin (Oracle VM + Cloudflare named tunnel).
2. **Probe OK:** `https://www.syncscript.app/api/ai/tts?probe=1` → `kokoroUpstreamReachable: true`.

That is **ops**, not a missing React route. After Kokoro is up, run `npm run verify:kokoro:env:post`.
