# Retry launching `VM.Standard.A1.Flex` until capacity appears

Oracle often returns **Out of capacity** for free **Ampere A1** in **iad** (Ashburn). This script loops: try each **availability domain** in your env file, then **sleep**, repeat.

**Pay As You Go (PAYG):** If your tenancy is upgraded to **PAYG**, you still want **Always Free–eligible** A1 usage only (within **4 OCPU / 24 GB** Ampere total) so you are not charged for that compute. PAYG can help with provisioning friction but **does not guarantee** capacity—keep this retry loop for automation.

## Background daemon + Telegram (hourly + success)

Notifications are handled **inside** `retry-launch-a1.sh` (not separate system cron jobs):

- **Hourly (local clock):** With **`TELEGRAM_BOT_TOKEN`** + **`TELEGRAM_CHAT_ID`** in **`instance-launch.env`**, you get a DM at each **new local hour** with total failed attempts, cycle, and AD count. Set **`TELEGRAM_HOURLY_STATUS=0`** to turn that off.
- **On success:** When **`oci compute instance launch`** succeeds, a Telegram DM is sent with display name, AD, and instance OCID.

**Keep the retry loop running in the background** (from repo root, after **`env.local`** + **`instance-launch.env`** are filled):

```bash
npm run oracle:a1-retry:daemon
```

Log: **`/tmp/oracle-a1-retry.log`** · Stop: **`pkill -f retry-launch-a1.sh`**

Restart the daemon after **Mac reboot** or if the process dies (it does not survive sleep/reboot by itself).

**If you missed an hourly Telegram:** The script uses your **Mac’s local clock** and only sends while **`retry-launch-a1.sh` is running**. **Sleeping the Mac** pauses the loop—no heartbeats until it wakes. After a **code fix (empty hourly “last sent” seed)**, restart the daemon so you don’t skip the **whole hour** when the daemon **starts mid-hour** (older versions seeded “current hour” and skipped that hour’s DM). Failed Telegram sends append a line to **`/tmp/oracle-a1-telegram-failures.log`**.

### Optional: hourly watchdog (restart daemon if it stopped)

If you want a **system** schedule so the daemon comes back after a crash (still not a substitute for reboot), add a **user** crontab entry on your Mac (paths must match your machine):

```bash
crontab -e
```

Example (runs at minute 5 every hour; starts daemon only if nothing is running):

```cron
5 * * * * /usr/bin/pgrep -f 'retry-launch-a1[.]sh' >/dev/null || cd /Users/YOU/syncscript && /usr/bin/env PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" npm run oracle:a1-retry:daemon >>/tmp/oracle-a1-retry-watchdog.log 2>&1
```

Replace **`/Users/YOU/syncscript`** with your repo path. On Apple Silicon, Homebrew is often **`/opt/homebrew/bin`**. Check **`npm`** with **`command -v npm`** in Terminal and put that path in **`PATH`** if needed.

## Setup

1. **`oci` CLI works:** `oci os ns get`
2. Copy **`instance-launch.env.example`** → **`instance-launch.env`** (gitignored).
3. Fill:
   - **`COMPARTMENT_OCID`** — usually root compartment (same as tenancy for personal accounts).
   - **`SUBNET_OCID`** — **public subnet** OCID (Networking → Subnets → **public subnet-syncscript**).
   - **`IMAGE_OCID`** — Ubuntu **24.04** image that supports **AARCH64** / Ampere (pick in Console **Compute → Custom images** or list via `oci compute image list` and filter for **aarch64**).
   - **`AVAILABILITY_DOMAINS`** — exact strings (tenancy OCID = root compartment for listing ADs):
     ```bash
     TENANCY="$(awk -F= '/^[[:space:]]*tenancy[[:space:]]*=/{gsub(/ /,"",$2); print $2; exit}' ~/.oci/config)"
     oci iam availability-domain list --compartment-id "$TENANCY" --query 'data[*].name' --raw-output
     ```
     Or from Console: Instance create shows **AD-1 / AD-2 / AD-3** — use the **full** domain name (often like `…:US-ASHBURN-AD-1`). Paste **three** names, **space-separated**, in `instance-launch.env`.
   - **`SSH_PUBLIC_KEY_FILE`** — path to **one** `.pub` file (single key).

4. Run:

```bash
bash deploy/oracle/scripts/retry-launch-a1.sh
```

Tune **`RETRY_INTERVAL_SEC`** (default **300**) and **`MAX_CYCLES`** (**0** = unlimited until success or Ctrl+C).

### HTTP 500 + `InternalError` in the CLI output

The API sometimes returns **`"status": 500`** and **`"code": "InternalError"`** with **`"message": "Out of host capacity."`** — that is **still** “no A1 capacity right now,” not a broken subnet or image. The retry script treats it as retryable and moves to the next AD / next cycle. If you see a **different** `message`, fix OCIDs, permissions, or shape config as usual.

## Fast path — subnet + availability domains (no local `~/.oci/config` yet)

You may have the **subnet name** on the instance page (e.g. `subnet-20260413-2348`). The retry script needs the **subnet OCID**, which looks like **`ocid1.subnet.oc1.iad…`** — **not** `ocid1.recoveryservicesubnet…`, and **not** the instance OCID.

1. **Subnet OCID (Console):** **Networking → Virtual cloud networks** → your VCN → **Subnets** → open the subnet → copy **OCID** under *Subnet information*.

2. **Availability domains (recommendation):** Put **every** AD name Oracle returns for your tenancy in **home region** (`iad`), **space-separated**, in order (e.g. AD-1, AD-2, AD-3). The retry script **tries each AD once per cycle** before sleeping — more ADs = better odds when one pool is full. You **cannot** guess the strings (they include a tenancy-specific prefix); list them with authenticated `oci` or **OCI Cloud Shell** (logged into the same tenancy):

```bash
# In OCI Cloud Shell (browser), tenancy is usually in $OCI_TENANCY_OCID:
oci iam availability-domain list --compartment-id "$OCI_TENANCY_OCID" --query 'data[*].name' --raw-output
```

Paste the three names into **`AVAILABILITY_DOMAINS="…"`** (space-separated, quotes as in `instance-launch.env.example`).

**Subnet from your existing instance (Cloud Shell)** — if the A1 instance will use the **same** VCN/subnet as your current VM:

```bash
oci compute instance list-vnics \
  --instance-id "ocid1.instance.oc1.iad.anuwcljt57onejqcnf5cmqu3telv2jmaqvectrpzfcniwodofnsvkboq6sjq" \
  --query 'data[0]."subnet-id"' --raw-output
```

Copy the output into **`SUBNET_OCID=`** (must start with **`ocid1.subnet.`**).

When local **`~/.oci/config`** works, you can instead run **`npm run oracle:instance-launch:populate`** from the repo (same result).

## Telegram when it works (optional)

Set **`TELEGRAM_BOT_TOKEN`** and **`TELEGRAM_CHAT_ID`** in **`instance-launch.env`** (both required; leave unset to skip). On a successful **`oci compute instance launch`**, the script sends you a short DM with display name, AD, and instance OCID.

1. In Telegram, talk to **@BotFather** → **`/newbot`** → copy the **token**.
2. Open the new bot in Telegram and send any message.
3. Visit `https://api.telegram.org/bot<TOKEN>/getUpdates` (paste your real token) and read **`result[0].message.chat.id`** — that is **`TELEGRAM_CHAT_ID`**.

Do not commit tokens; **`instance-launch.env`** is gitignored.

## Once an instance exists

The VM **stays** until you **terminate** it. Reboots persist the disk. **Your Mac being on 24/7 does not affect** the Oracle VM — it runs in Oracle’s datacenter.

Oracle may **reclaim** resources that stay **severely idle** per their policies; normal services (Docker, tunnels, light keepalive) are the usual mitigation. See current **[Always Free](https://docs.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)** docs.

## Billing

If the tenancy is **Pay As You Go**, set **budgets/alerts** in **Billing & Cost Management** so accidental paid usage is visible. This script only launches **`VM.Standard.A1.Flex`** — stay within **[Always Free](https://docs.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)** Ampere caps so eligible usage stays **$0**; PAYG does not remove the need to right-size and monitor.
