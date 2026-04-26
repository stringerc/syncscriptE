# Oracle VM → Vercel cron pings (free, no Vercel Pro)

**Vercel Hobby** only allows **daily** cron schedules in `vercel.json`. For **sub-daily** triggers (e.g. `phone-dispatch` every 15 minutes so queued calls are not hours late), use a **cron job on your Oracle VM** that `curl`s the same routes Vercel would hit.

## Security

- Set **`CRON_SECRET`** in Vercel project env and **use the same value** in a root-only file on the VM (e.g. `/etc/syncscript/cron.env`, `chmod 600`).
- Without `CRON_SECRET`, `/api/cron/*` may accept unauthenticated requests — **set the secret in production**.

## Script

- **`deploy/oracle/scripts/vercel-cron-ping.sh`** — `curl` with `Authorization: Bearer $CRON_SECRET`.
- Env: **`APP_BASE_URL`** (default `https://www.syncscript.app`), **`CRON_SECRET`**.

Example:

```bash
chmod +x deploy/oracle/scripts/vercel-cron-ping.sh
export CRON_SECRET='your-secret'
export APP_BASE_URL='https://www.syncscript.app'
./deploy/oracle/scripts/vercel-cron-ping.sh phone-dispatch
```

## Disk / scale

- A shell script + `curl` uses **negligible** disk (no large logs unless you redirect huge output).
- Oracle **Always Free** limits are mostly **CPU/RAM/OCPU** — this pattern avoids **GitHub Actions** minute caps and avoids **Vercel Pro** for scheduling frequency.

## Which jobs to ping externally

| Job | When to ping often |
|-----|---------------------|
| **`phone-dispatch`** | If you use scheduled outbound / invoice collection — e.g. every **5–15 min**. |
| **`tts-slo`** | Optional TTS probe + pre-warm (if you enable `TTS_CRON_PREWARM`). |
| Others | Usually fine **once daily** via Vercel only. |

## Twilio: only one number works when dialing

This is almost always **Twilio account type**, not SyncScript code:

1. **Trial accounts** can only call **verified** destination numbers. Add numbers in **Twilio Console → Phone Numbers → Verified Caller IDs** (or upgrade to a **paid** account).
2. **Voice geographic permissions**: Twilio Console → **Voice → Settings → Geo Permissions** — enable countries you dial.
3. **Format**: Use **E.164** (`+15551234567`).

No application change fixes trial restrictions; upgrading Twilio + permissions does.
