# Oracle Cloud — SyncScript always-on stack (replaces suspended AWS EC2)

**Fast path:** **`deploy/oracle/QUICKSTART.md`** — fingerprint, `env.local`, npm scripts (`npm run oracle:quickstart`).

**A1 “out of capacity”:** **`deploy/oracle/RETRY_A1_LAUNCH.md`** + **`scripts/retry-launch-a1.sh`** (loop until a slot appears). After **`~/.oci/config`** works, **`npm run oracle:instance-launch:populate`** fills **subnet + availability domains** in **`instance-launch.env`** from your tenancy / existing instance VNIC.

**Background retry + log:** With **`deploy/oracle/env.local`** filled (no placeholders) and **`instance-launch.env`** complete, run **`npm run oracle:a1-retry:daemon`** — writes **`~/.oci/config`**, runs **`oci os ns get`**, then **`nohup`** retry to **`/tmp/oracle-a1-retry.log`** (see script header for **`pkill`** / **`tail`**). **Pay As You Go:** still keep A1 within **Always Free** limits; set **budgets/alerts**. With **`TELEGRAM_*`** in **`instance-launch.env`**, you get **hourly** status DMs plus a DM **when an instance is created** (details in **`RETRY_A1_LAUNCH.md`**). Restart the daemon after **Mac reboot**; optional **cron** watchdog in that doc.

This folder documents how to run **Kokoro TTS**, **OpenClaw** (`:18789`), **Hermes executor** (`:18880` — real task/calendar via Edge; **`install-stack-services.sh`** enables **`hermes-executor.service`**), and optional **Engram** on **Oracle Cloud Infrastructure (OCI) Always Free** Ampere A1, with **health keepalive** so services are probed regularly.

**We cannot provision your tenancy from Cursor.** Complete the **Console** or **OCI CLI** steps on your machine. **Never commit API private keys** — see **`SECURITY.md`**.

---

## 1) Security first

- If you **pasted API key paths or OCIDs in chat**, **rotate** the API key in **Oracle Console → Identity → Users → your user → API keys** and delete the old key.
- Keep **`*.pem`** in **`~/.oci/`**, mode **`600`**, and add **`~/.oci/`** to **`.gitignore`** locally if you copy configs around.

---

## 2) What “Always Free” means (expectations)

- **Ampere A1 (`VM.Standard.A1.Flex`)**: Within [published OCPU/GB-hour limits](https://docs.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm), eligible usage is **$0**. You may still need a **payment method** for account verification.
- **Provisioning**: You may see **“Out of host capacity”** — try another **availability domain**, retry later, or follow Oracle’s docs (same link).
- **Idle resources**: Oracle documents policies for **underutilized** resources. **Real traffic** (your app + tunnels) plus the included **`keepalive`** script (light probes + tiny CPU) is a common pattern; re-read current Oracle terms periodically.
- **“Optimal capacity”** for Always Free means: **right-size one A1** (e.g. 3–4 OCPUs for Kokoro + Node services), **avoid** running duplicate heavy stacks, **monitor** RAM (`free -h`) and **swap**.

---

## 3) What this repo needs from you (collect before CLI)

| Value | Where to find it |
|-------|------------------|
| **Tenancy OCID** | Administration → Tenancy details |
| **User OCID** | Identity → Users → your user |
| **API key fingerprint** | Shown when you add the **public** key, or run `deploy/oracle/scripts/compute-api-key-fingerprint.sh` on your **public** `.pem` |
| **Region** | **US East (Ashburn)** → CLI identifier **`us-ashburn-1`** (home region is fixed long-term) |
| **Identity Domain OCID** (optional) | Shown under **Identity → Domains** — used for **domain**-scoped IAM/SSO; **classic API key** auth for `oci` CLI usually needs **user + tenancy + fingerprint + region** only |
| **Compartment OCID** | Often root compartment for personal tenancies |
| **VNIC / subnet** | After you create a VCN (wizard “Start VCN wizard”) |

**Do not commit OCIDs or keys to git.** Use **`deploy/oracle/env.local`** (gitignored) locally.

---

## 4) OCI CLI on your Mac

```bash
brew install oci-cli
mkdir -p ~/.oci
chmod 700 ~/.oci
cp /path/to/your-api-key.pem ~/.oci/oci_api_key.pem
chmod 600 ~/.oci/oci_api_key.pem
```

### Option A — Config from **`env.local`** (recommended)

```bash
cp deploy/oracle/env.local.example deploy/oracle/env.local
nano deploy/oracle/env.local   # tenancy, user, fingerprint, OCI_REGION=us-ashburn-1, OCI_KEY_FILE=...
bash deploy/oracle/scripts/generate-oci-config.sh
bash deploy/oracle/scripts/oci-verify-connection.sh
```

### Option B — Hand-edit **`~/.oci/config`**

Copy **`oci-config.template`** to **`~/.oci/config`**, fill **user**, **tenancy**, **fingerprint**, **region** = **`us-ashburn-1`**, **key_file**.

### MCP / Cursor

There is **no Oracle MCP** wired in this workspace by default — provisioning is **OCI Console** or **`oci`** on **your** machine.

Test:

```bash
oci iam region list
oci os ns get
```

---

## 5) Create the VM (Console — recommended first time)

**VCN form help (CIDR, DNS, where “A1” is):** **`VCN_AND_COMPUTE_CONSOLE.md`**.

1. **Networking → Virtual cloud networks** → create VCN (include public subnet + Internet Gateway).
2. **Compute → Instances → Create instance**
   - **Image**: Ubuntu 22.04 or 24.04 **aarch64**
   - **Shape**: **VM.Standard.A1.Flex** — assign **OCPU/RAM** within Always Free caps (e.g. **4 OCPU / 24 GB** if available in your region).
   - **Network**: public subnet, assign **public IPv4**
   - **SSH key**: your laptop’s `ssh-ed25519` or RSA public key
3. Note the **instance public IP**.

---

## 6) Bootstrap the server

From your laptop (repo root):

```bash
rsync -avz --exclude node_modules --exclude .git ./ ubuntu@INSTANCE_IP:/opt/syncscript/
ssh ubuntu@INSTANCE_IP
sudo bash /opt/syncscript/deploy/oracle/vm/bootstrap-ampere.sh
```

If the repo was copied **after** the first bootstrap run:

```bash
sudo cp /opt/syncscript/deploy/oracle/scripts/keepalive-light-load.sh /usr/local/bin/syncscript-keepalive.sh
sudo chmod +x /usr/local/bin/syncscript-keepalive.sh
sudo cp /opt/syncscript/deploy/oracle/systemd/syncscript-keepalive.service /etc/systemd/system/
sudo cp /opt/syncscript/deploy/oracle/systemd/syncscript-keepalive.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now syncscript-keepalive.timer
```

---

## 7) Kokoro + Cloudflare (production TTS)

Same as AWS path — on the **Oracle VM**:

```bash
cd /opt/syncscript/deploy/kokoro-tts-ec2
cp env.example .env
nano .env   # CLOUDFLARE_TUNNEL_TOKEN + see NAMED_TUNNEL_SETUP_RUNBOOK.md
docker compose --profile named-tunnel up -d --build
```

In **Cloudflare Zero Trust**, public hostname → **`http://localhost:8880`**.

On your laptop (Vercel linked):

```bash
./deploy/kokoro-tts-ec2/scripts/update-vercel-kokoro-url.sh 'https://kokoro.yourdomain.com' --all-environments
vercel deploy --prod --yes
```

---

## 8) OpenClaw (always-on gateway)

OpenClaw listens on **`18789`** by default. On the server, install **Node 22+** and **`openclaw`**, then ensure **`gateway.mode=local`** in **`~/.openclaw/openclaw.json`** (see **`deploy/oracle/vm/ensure-openclaw-gateway-config.sh`** — runs **`openclaw config set gateway.mode local`**, idempotent). Use **`--bind loopback`** (not `127.0.0.1`). Expose via **Cloudflare Tunnel** to `http://127.0.0.1:18789`.

Example **unit sketch** (adjust paths):

```ini
[Service]
ExecStart=/usr/bin/env NODE_ENV=production /home/ubuntu/.nvm/versions/node/v22.x.x/bin/openclaw gateway run --port 18789 --bind loopback
Restart=always
```

Point **`OPENCLAW_BASE_URL`** at the **public HTTPS** origin Supabase / Edge expect (see **`supabase/functions/.../openclaw-bridge.tsx`** and **`MEMORY.md`**).

---

## 9) Hermes executor (port 18880)

**Production (Oracle):** **`deploy/oracle/systemd/hermes-executor.service`** — runs **`integrations/hermes-executor-server.mjs`** with **`SYNCSCRIPT_EDGE_BASE`** pointing at your Supabase **`make-server-57781ad9`** URL. The executor calls the **same** Edge routes as the app (`PUT /tasks/:id`, `POST /calendar/hold` with optional **`provider`**: `auto` \| `google` \| `outlook`, and with **`provider: auto`** optional **`targets`** / user **`hold-preferences`**). **Hermes Edge bridge forwards the user JWT** to this process — see **`integrations/HERMES.md`**.

Set **Supabase `HERMES_BASE_URL`** to the **HTTPS tunnel** origin for **`127.0.0.1:18880`** (see **`integrations/HERMES_STABLE_TUNNEL.md`**).

**Local dev / stub:** **`npm run hermes:mock`** (`hermes-mock-server.mjs`) when you only need the contract without Edge side effects.

---

## 10) Engram (optional)

If you use Engram on the same host: **`integrations/engram_translator`** Docker Compose on **`:8000`**, tunnel separately, set **`ENGRAM_BASE_URL`** per **`integrations/ENGRAM_OPENCLAW.md`**.

Adjust **`keepalive-light-load.sh`**:

```bash
export ENGRAM_URL=http://127.0.0.1:8000/health
```

---

## 11) Keepalive (timer)

- **Service**: `syncscript-keepalive.service` — runs **`keepalive-light-load.sh`**
- **Timer**: every **5 minutes** — `syncscript-keepalive.timer`

Check:

```bash
systemctl status syncscript-keepalive.timer
journalctl -u syncscript-keepalive.service -n 30 --no-pager
```

---

## 12) Verify Always Free usage (CLI)

With **`oci`** configured:

```bash
oci limits value list --compartment-id "$(oci iam compartment list --all --query 'data[0].id' --raw-output)" --query "data[?service=='compute']" 2>/dev/null | head
```

Use the [Oracle cost/usage UI](https://www.oracle.com/cloud/cost-management/) to confirm **$0** for Always Free-eligible resources.

---

## 13) What was **not** automated here

- Creating **VCN**, **security lists** (SSH **22** from your IP, **optional** 80/443 if not using tunnels only)
- **OCI CLI one-shot instance launch** (image OCIDs vary by region)
- **Cloudflare** tunnel tokens and DNS for **OpenClaw / Hermes / Kokoro** — three hostnames or one tunnel with multiple hostnames

Use **`deploy/kokoro-tts-ec2/NAMED_TUNNEL_SETUP_RUNBOOK.md`** for Kokoro; mirror the same tunnel pattern for other services.

---

## Fingerprint helper

```bash
bash deploy/oracle/scripts/compute-api-key-fingerprint.sh /path/to/public_key.pem
```

Must match the fingerprint shown in Oracle when the key was registered.

---

## 14) Vercel `/api/cron/*` pings from this VM (free)

Use **`VERCEL_CRON_PING.md`** + **`scripts/vercel-cron-ping.sh`** to trigger **`phone-dispatch`** (or other jobs) on a **sub-daily** schedule without **Vercel Pro**. Minimal disk; uses **`CRON_SECRET`** + **`APP_BASE_URL`**.
