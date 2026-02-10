# 🦞 OPENCLAW PHASE 1: DEPLOYMENT & TESTING GUIDE

**Status**: Ready to deploy  
**Expected Time**: 2-3 hours  
**Date**: February 10, 2026

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ What We've Built

**Backend (Supabase Edge Function)**:
- ✅ `/supabase/functions/server/openclaw-bridge.tsx` - API bridge
- ✅ Registered in `/supabase/functions/server/index.tsx`
- ✅ Routes: chat, suggestions, insights, tasks, etc.

**Frontend (React Context)**:
- ✅ Updated `/contexts/OpenClawContext.tsx` to use Supabase bridge
- ✅ Updated `/utils/openclaw-client.ts` for production mode
- ✅ Existing AI components ready to use

**OpenClaw Skills (EC2 Server)**:
- ✅ Setup script: `/OPENCLAW_PHASE1_SETUP_SCRIPT.sh`
- ✅ 4 custom skills ready to install

---

## 🚀 DEPLOYMENT STEPS

### STEP 1: Deploy Supabase Edge Function (5 minutes)

**Option A: Via Supabase Dashboard** (Recommended)

1. Go to https://supabase.com/dashboard/project/kwhnrlzibgfedtxpkbgb/functions

2. Click "Create a new function"

3. Name: `openclaw-bridge`

4. Copy contents of `/supabase/functions/server/openclaw-bridge.tsx`

5. Deploy

6. Test health endpoint:
   ```bash
   curl https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9/openclaw/health
   ```

**Option B: Via CLI**

```bash
# If you have Supabase CLI installed
supabase functions deploy openclaw-bridge
```

---

### STEP 2: Set Up OpenClaw Skills on EC2 (15 minutes)

**SSH into EC2 server**:

```bash
ssh -i ~/Downloads/test.pem ubuntu@3.148.233.23
```

**Download setup script** (one of these methods):

```bash
# Method 1: If you have the repo
cd /path/to/syncscript
chmod +x OPENCLAW_PHASE1_SETUP_SCRIPT.sh
./OPENCLAW_PHASE1_SETUP_SCRIPT.sh

# Method 2: Create script manually
nano setup-openclaw.sh
# Paste the script contents from OPENCLAW_PHASE1_SETUP_SCRIPT.sh
chmod +x setup-openclaw.sh
./setup-openclaw.sh
```

**The script will**:
- Create `~/.openclaw/skills/syncscript/` directory
- Create 4 skill files (context-fetcher, task-suggester, task-creator, insights-generator)
- Create `.env` file template

---

### STEP 3: Configure Environment Variables (5 minutes)

**Edit the .env file**:

```bash
nano ~/.openclaw/.env
```

**Add your credentials**:

```bash
# Supabase Configuration
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-key

# OpenRouter Configuration (already set)
OPENROUTER_API_KEY=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
```

**Get your Supabase Service Role Key**:
1. Go to https://supabase.com/dashboard/project/kwhnrlzibgfedtxpkbgb/settings/api
2. Copy "service_role" key (NOT anon key!)

---

### STEP 4: Register Skills with OpenClaw (10 minutes)

**Register each skill**:

```bash
cd ~/.openclaw/skills/syncscript

# Register skills
openclaw skills register ./context-fetcher.ts
openclaw skills register ./task-suggester.ts
openclaw skills register ./task-creator.ts
openclaw skills register ./insights-generator.ts
```

**Verify skills are registered**:

```bash
openclaw skills list
```

You should see:
```
✓ syncscript-context-fetcher
✓ syncscript-task-suggester
✓ syncscript-task-creator
✓ syncscript-insights-generator
```

**Restart OpenClaw**:

```bash
openclaw restart
```

---

### STEP 5: Test OpenClaw Skills (15 minutes)

**Test each skill individually**:

```bash
# Test 1: Health check
openclaw skills test healthcheck

# Test 2: Context fetcher (replace with real user ID)
openclaw skills execute syncscript-context-fetcher '{
  "userId": "test-user-id",
  "dataTypes": ["tasks", "goals"],
  "timeRange": "week"
}'

# Test 3: Task suggester
openclaw skills execute syncscript-task-suggester '{
  "userContext": {
    "tasks": [],
    "goals": []
  },
  "count": 3
}'
```

**Expected output**: Each command should return JSON with `success: true`

---

### STEP 6: Test Supabase Bridge (10 minutes)

**Test from your computer** (not EC2):

```bash
# Test 1: Health check
curl https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9/openclaw/health

# Expected response:
# {"success":true,"openclawStatus":"connected","data":{...}}

# Test 2: Chat
curl -X POST \
  https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9/openclaw/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, can you help me?",
    "userId": "test-user"
  }'

# Expected response:
# {"success":true,"data":{"message":{"role":"assistant","content":"..."}}}
```

---

### STEP 7: Deploy Frontend to Vercel (5 minutes)

**Push changes to GitHub**:

```bash
git add .
git commit -m "Phase 1: OpenClaw integration with Supabase bridge"
git push origin main
```

**Vercel will auto-deploy**:
- Monitor deployment at https://vercel.com/your-username/syncscript
- Wait for deployment to complete (~2 minutes)

---

### STEP 8: Test End-to-End Integration (30 minutes)

**Open SyncScript**: https://syncscript.app

**Test 1: AI Assistant Chat**

1. Navigate to AI Assistant page
2. Send message: "What tasks should I focus on today?"
3. Expected: AI responds with suggestions based on your data

**Test 2: Task Suggestions**

1. Navigate to Dashboard
2. Look for AI Suggestions card
3. Click "Generate Suggestions"
4. Expected: 3-5 task suggestions appear

**Test 3: AI Insights**

1. Navigate to Analytics page
2. Look for AI Insights panel
3. Expected: Insights about productivity, energy, goals

**Test 4: Create Task via AI**

1. In AI Assistant chat
2. Send: "Create a task to review project proposal, high priority, due Friday"
3. Expected: Task created and appears in your task list

---

## 🐛 TROUBLESHOOTING

### Problem: "OpenClaw not connected"

**Solution**:

```bash
# On EC2 server
systemctl status openclaw

# If not running:
openclaw start

# Check logs:
tail -f /tmp/openclaw/openclaw-*.log
```

### Problem: "SUPABASE_SERVICE_ROLE_KEY not configured"

**Solution**:

```bash
# On EC2 server
nano ~/.openclaw/.env

# Add your key, then:
openclaw restart
```

### Problem: Skills not registered

**Solution**:

```bash
cd ~/.openclaw/skills/syncscript
openclaw skills list
openclaw skills register ./context-fetcher.ts
# Repeat for other skills
```

### Problem: "Failed to fetch" errors in browser console

**Solution**:

1. Check Supabase Edge Function is deployed
2. Check CORS configuration in openclaw-bridge.tsx
3. Verify browser can reach: https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9/openclaw/health

### Problem: AI responses are empty or error

**Solution**:

1. Check OpenRouter API key is valid
2. Check DeepSeek model is accessible:
   ```bash
   curl https://openrouter.ai/api/v1/models \
     -H "Authorization: Bearer YOUR_KEY"
   ```
3. Check OpenClaw logs:
   ```bash
   tail -f /tmp/openclaw/openclaw-*.log
   ```

---

## 📊 SUCCESS CRITERIA

After deployment, verify these work:

- [ ] OpenClaw server is running on EC2
- [ ] 4 custom skills are registered
- [ ] Supabase bridge health check returns 200
- [ ] Frontend can chat with AI assistant
- [ ] Task suggestions are generated
- [ ] Tasks can be created via AI
- [ ] AI insights are displayed
- [ ] Response time < 5 seconds
- [ ] No console errors in browser

---

## 💰 COST MONITORING

**Monitor costs after 24 hours**:

1. **OpenRouter Usage**:
   - Go to https://openrouter.ai/activity
   - Check tokens used & cost
   - Expected: ~$0.50-$2.00 per day initially

2. **Supabase Usage**:
   - Go to https://supabase.com/dashboard/project/kwhnrlzibgfedtxpkbgb/settings/billing
   - Check database requests
   - Expected: Well within free tier

3. **EC2 Costs**:
   - Already running (no additional cost)

---

## 🎯 NEXT STEPS (After Phase 1)

Once Phase 1 is working:

**Phase 2: Autonomous Actions** (Week 2)
- Planner Agent (schedule optimization)
- Executor Agent (automated task creation)
- Energy-based scheduling

**Phase 3: Advanced Features** (Week 3-4)
- Emotional intelligence
- Crisis management
- Predictive planning

**Phase 4: Code Maintenance** (Week 5-6)
- Guardian Agent (bug detection)
- Optimizer Agent (performance)
- Self-healing architecture

---

## 📞 SUPPORT

If you encounter issues:

1. **Check logs**:
   - EC2: `tail -f /tmp/openclaw/openclaw-*.log`
   - Supabase: Dashboard → Edge Functions → openclaw-bridge → Logs
   - Browser: Console (F12)

2. **Check status**:
   - EC2: `systemctl status openclaw`
   - Supabase: https://status.supabase.com
   - OpenRouter: https://openrouter.ai/activity

3. **Review documentation**:
   - OpenClaw: https://docs.openclaw.ai
   - Supabase: https://supabase.com/docs
   - OpenRouter: https://openrouter.ai/docs

---

## ✅ DEPLOYMENT COMPLETE!

Once all tests pass, you have:

✅ **Working AI Assistant** in SyncScript  
✅ **Task Suggestions** powered by DeepSeek  
✅ **AI Insights** for productivity  
✅ **Natural Language Task Creation**  
✅ **Ultra-low cost** ($0.20/user/month)  
✅ **Scalable architecture** (Supabase bridge)

**You're now lightyears ahead of the competition! 🦞🚀**

---

## 📝 DEPLOYMENT LOG

**Date**: __________  
**Deployed by**: __________  
**Status**: __________ (Success / Needs Fixes)  

**Notes**:
- 
- 
- 

**Issues Encountered**:
- 
- 
- 

**Fixes Applied**:
- 
- 
- 
