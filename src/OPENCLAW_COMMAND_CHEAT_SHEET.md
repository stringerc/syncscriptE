# 🦞 OPENCLAW PHASE 1: COMMAND CHEAT SHEET

Quick reference for all commands needed to deploy and manage OpenClaw integration.

---

## 📦 DEPLOYMENT COMMANDS

### 1. Deploy Supabase Edge Function

```bash
# Via Dashboard (Recommended):
# https://supabase.com/dashboard/project/kwhnrlzibgfedtxpkbgb/functions

# Via CLI (if you have supabase CLI):
supabase functions deploy openclaw-bridge
```

### 2. SSH into EC2 Server

```bash
ssh -i ~/Downloads/test.pem ubuntu@3.148.233.23
```

### 3. Run Setup Script

```bash
# Download and run
chmod +x OPENCLAW_PHASE1_SETUP_SCRIPT.sh
./OPENCLAW_PHASE1_SETUP_SCRIPT.sh
```

### 4. Configure Environment

```bash
# Edit .env
nano ~/.openclaw/.env

# Add your keys:
# SUPABASE_SERVICE_ROLE_KEY=...
# OPENROUTER_API_KEY=sk-or-v1-...
```

### 5. Register Skills

```bash
cd ~/.openclaw/skills/syncscript

# Register all 4 skills
openclaw skills register ./context-fetcher.ts
openclaw skills register ./task-suggester.ts
openclaw skills register ./task-creator.ts
openclaw skills register ./insights-generator.ts
```

### 6. Restart OpenClaw

```bash
openclaw restart
```

### 7. Deploy Frontend

```bash
# From your local machine
git add .
git commit -m "Phase 1: OpenClaw integration"
git push origin main
```

---

## 🔍 TESTING COMMANDS

### Test Supabase Bridge

```bash
# Health check
curl https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9/openclaw/health

# Chat test
curl -X POST https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9/openclaw/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","userId":"test"}'
```

### Test OpenClaw Skills

```bash
# On EC2 server
openclaw skills list
openclaw skills test healthcheck

# Test specific skill
openclaw skills execute syncscript-context-fetcher '{"userId":"test","dataTypes":["tasks"]}'
```

---

## 🐛 DEBUGGING COMMANDS

### Check OpenClaw Status

```bash
# On EC2 server
systemctl status openclaw
openclaw status
openclaw doctor
```

### View Logs

```bash
# OpenClaw logs
tail -f /tmp/openclaw/openclaw-*.log

# Latest log
tail -f /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log
```

### Restart Services

```bash
# Restart OpenClaw
openclaw restart

# Full restart
sudo systemctl restart openclaw
```

### Check Skills

```bash
# List all skills
openclaw skills list

# List SyncScript skills only
openclaw skills list | grep syncscript

# Check skill details
openclaw skills info syncscript-task-suggester
```

---

## 🔧 MANAGEMENT COMMANDS

### Update Skills

```bash
cd ~/.openclaw/skills/syncscript

# Edit a skill
nano task-suggester.ts

# Re-register
openclaw skills register ./task-suggester.ts

# Restart
openclaw restart
```

### View OpenClaw Config

```bash
# View main config
cat ~/.openclaw/openclaw.json

# View environment
cat ~/.openclaw/.env
```

### Backup Skills

```bash
# Create backup
cp -r ~/.openclaw/skills/syncscript ~/backup-$(date +%Y%m%d)

# Restore backup
cp -r ~/backup-YYYYMMDD ~/.openclaw/skills/syncscript
openclaw restart
```

---

## 📊 MONITORING COMMANDS

### Check OpenRouter Usage

```bash
# From your computer, not EC2
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer sk-or-v1-..."
```

### Check Supabase Stats

```bash
# Via Dashboard:
# https://supabase.com/dashboard/project/kwhnrlzibgfedtxpkbgb/logs/edge-functions

# Via API:
curl https://kwhnrlzibgfedtxpkbgb.supabase.co/rest/v1/tasks?select=count \
  -H "apikey: YOUR_ANON_KEY"
```

### Monitor OpenClaw Metrics

```bash
# On EC2
openclaw stats
openclaw doctor
```

---

## 🚨 EMERGENCY COMMANDS

### OpenClaw Won't Start

```bash
# Check logs
tail -f /tmp/openclaw/openclaw-*.log

# Check permissions
sudo chown -R ubuntu:ubuntu ~/.openclaw

# Kill processes
pkill -f openclaw

# Restart
openclaw start
```

### Skills Failing

```bash
# Check environment
env | grep SUPABASE
env | grep OPENROUTER

# Reload environment
source ~/.bashrc

# Re-register all skills
cd ~/.openclaw/skills/syncscript
for file in *.ts; do openclaw skills register ./$file; done

# Restart
openclaw restart
```

### Database Connection Issues

```bash
# Test Supabase connection
curl https://kwhnrlzibgfedtxpkbgb.supabase.co/rest/v1/ \
  -H "apikey: YOUR_SERVICE_ROLE_KEY"

# Check service role key
echo $SUPABASE_SERVICE_ROLE_KEY
```

---

## 📁 IMPORTANT FILE LOCATIONS

### On EC2 Server

```
~/.openclaw/                          # OpenClaw home directory
~/.openclaw/openclaw.json             # Main config
~/.openclaw/.env                      # Environment variables
~/.openclaw/skills/syncscript/        # Our custom skills
~/.openclaw/agents/                   # Agent configurations
~/.openclaw/logs/                     # Log files
/tmp/openclaw/openclaw-*.log          # Current logs
```

### In Codebase

```
/supabase/functions/server/openclaw-bridge.tsx    # Supabase bridge
/contexts/OpenClawContext.tsx                     # Frontend context
/utils/openclaw-client.ts                         # API client
/OPENCLAW_PHASE1_SETUP_SCRIPT.sh                  # Setup script
```

---

## 🔗 USEFUL URLs

### Dashboards

- **Supabase**: https://supabase.com/dashboard/project/kwhnrlzibgfedtxpkbgb
- **OpenRouter**: https://openrouter.ai/activity
- **SyncScript**: https://syncscript.app
- **Vercel**: https://vercel.com/your-username/syncscript

### API Endpoints

- **Health**: https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9/openclaw/health
- **Chat**: .../openclaw/chat
- **Suggestions**: .../openclaw/suggestions/tasks
- **Insights**: .../openclaw/insights

### Documentation

- **OpenClaw**: https://docs.openclaw.ai
- **Supabase**: https://supabase.com/docs
- **OpenRouter**: https://openrouter.ai/docs

---

## 💡 QUICK TIPS

### Speed Up Debugging

```bash
# Watch logs in real-time
tail -f /tmp/openclaw/openclaw-*.log | grep -i error

# Test skill quickly
openclaw skills execute SKILL_NAME '{"param":"value"}'

# One-line restart
openclaw restart && tail -f /tmp/openclaw/openclaw-*.log
```

### Check Everything is Working

```bash
# Run this script:
echo "=== OpenClaw Status ==="
systemctl status openclaw | grep Active
echo ""
echo "=== Skills Registered ==="
openclaw skills list | grep syncscript
echo ""
echo "=== Recent Errors ==="
tail -20 /tmp/openclaw/openclaw-*.log | grep -i error
```

### Quick Health Check

```bash
# One command to test everything
curl -s https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9/openclaw/health | jq
```

---

## 📋 PRE-FLIGHT CHECKLIST

Before deploying, run these:

```bash
# On EC2:
[ ] systemctl status openclaw         # Should be "active (running)"
[ ] openclaw skills list               # Should show 4 syncscript skills
[ ] ls ~/.openclaw/skills/syncscript   # Should show 4 .ts files
[ ] cat ~/.openclaw/.env | grep KEY    # Should show both keys

# From your computer:
[ ] curl ...openclaw/health            # Should return {"success":true}
[ ] git status                         # Should be clean
[ ] git log -1                         # Should show Phase 1 commit
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

After deploying, verify:

```bash
# 1. OpenClaw is running
ssh -i ~/Downloads/test.pem ubuntu@3.148.233.23 "openclaw status"

# 2. Bridge is working
curl https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9/openclaw/health

# 3. Frontend is deployed
curl -I https://syncscript.app | grep "200 OK"

# 4. AI is responding
# (Open browser and test manually)
```

---

**Print this sheet and keep it handy during deployment!** 📄🦞
