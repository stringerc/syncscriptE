# 🔍 Monitoring Setup Guide

## Overview
This guide covers setting up error tracking (Sentry) and uptime monitoring (UptimeRobot) for SyncScript.

---

## 1. SENTRY ERROR TRACKING

### **Step 1: Create Sentry Account**
1. Go to https://sentry.io
2. Sign up (free tier is perfect for launch)
3. Create new project
   - **Platform**: Node.js (for backend)
   - **Project name**: SyncScript-Backend
   - Copy DSN (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)

4. Create second project
   - **Platform**: React
   - **Project name**: SyncScript-Frontend
   - Copy DSN

**Total time:** 5 minutes

---

### **Step 2: Backend Integration**

**Install Sentry SDK:**
```bash
cd /Users/Apple/syncscript/server
npm install @sentry/node @sentry/profiling-node
```

**Add to `server/src/index.ts` (at the very top):**
```typescript
import * as Sentry from '@sentry/node'
import { ProfilingIntegration } from '@sentry/profiling-node'

// Initialize Sentry FIRST (before any other imports)
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_BACKEND,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      new ProfilingIntegration(),
    ],
    tracesSampleRate: 0.1, // 10% of transactions
    profilesSampleRate: 0.1,
  })
}
```

**Add error handler middleware (before final error handler):**
```typescript
// After all routes, before error handler
app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())

// ... your routes ...

app.use(Sentry.Handlers.errorHandler())
```

**Add to `.env` and Render:**
```bash
SENTRY_DSN_BACKEND=https://YOUR_BACKEND_DSN@o123456.ingest.sentry.io/123456
```

**Total time:** 10 minutes

---

### **Step 3: Frontend Integration**

**Install Sentry SDK:**
```bash
cd /Users/Apple/syncscript/client
npm install @sentry/react
```

**Create `client/src/lib/sentry.ts`:**
```typescript
import * as Sentry from '@sentry/react'

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN_FRONTEND,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0, // Always record on error
    })
  }
}
```

**Update `client/src/main.tsx`:**
```typescript
import { initSentry } from './lib/sentry'

// Initialize Sentry first
initSentry()

// ... rest of your main.tsx
```

**Add to `.env.local` and Vercel:**
```bash
VITE_SENTRY_DSN_FRONTEND=https://YOUR_FRONTEND_DSN@o123456.ingest.sentry.io/654321
```

**Total time:** 10 minutes

---

### **Step 4: Test Sentry**

**Backend test:**
```bash
# In server/src/index.ts, add a test route temporarily
app.get('/sentry-test', () => {
  throw new Error('Sentry backend test!')
})

# Visit: http://localhost:3001/sentry-test
# Check Sentry dashboard for error
```

**Frontend test:**
```typescript
// In any component, temporarily add:
<button onClick={() => { throw new Error('Sentry frontend test!') }}>
  Test Sentry
</button>

// Click button, check Sentry dashboard
```

**Remove test code after verification!**

**Total time:** 5 minutes

---

## 2. UPTIMEROBOT MONITORING

### **Step 1: Create UptimeRobot Account**
1. Go to https://uptimerobot.com
2. Sign up (free tier: 50 monitors)
3. Verify email

**Total time:** 2 minutes

---

### **Step 2: Add Monitors**

**Monitor 1: Backend Health**
- **Monitor Type**: HTTP(s)
- **Friendly Name**: SyncScript Backend
- **URL**: `https://syncscripte.onrender.com/health`
- **Monitoring Interval**: 5 minutes
- **Alert When Down For**: 2 minutes
- **Create Monitor**

**Monitor 2: Frontend**
- **Monitor Type**: HTTP(s)
- **Friendly Name**: SyncScript Frontend  
- **URL**: `https://syncscript-e-qlwn.vercel.app/`
- **Monitoring Interval**: 5 minutes
- **Alert When Down For**: 2 minutes
- **Create Monitor**

**Monitor 3: Backend API Response Time**
- **Monitor Type**: HTTP(s)
- **Friendly Name**: SyncScript API Response
- **URL**: `https://syncscripte.onrender.com/api/health`
- **Monitoring Interval**: 5 minutes
- **Alert Contact**: Your email
- **Create Monitor**

**Total time:** 5 minutes

---

### **Step 3: Configure Alerts**

**Add Alert Contacts:**
1. Click "My Settings"
2. Click "Add Alert Contact"
3. **Type**: Email
4. **Email Address**: your@email.com
5. **Threshold**: Any downtime
6. Save

**Optional: Add Slack/Discord:**
- Generate webhook URL from Slack/Discord
- Add as webhook alert contact
- Get instant notifications!

**Total time:** 3 minutes

---

### **Step 4: Create Status Page (Optional)**

1. Click "Status Pages"
2. Click "Add Status Page"
3. **Friendly Name**: SyncScript Status
4. **Custom URL**: syncscript-status (or your choice)
5. **Monitors**: Select all 3 monitors
6. **Make Public**: Yes
7. Create

**Share link:** `https://stats.uptimerobot.com/YOUR_CUSTOM_URL`

**Total time:** 3 minutes

---

## 3. HEALTH CHECK ENDPOINT

Your backend already has `/health` - let's enhance it:

**Update `server/src/index.ts`:**
```typescript
app.get('/health', async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: '1.0.0'
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    })
  }
})
```

---

## 4. DEPLOYMENT ENVIRONMENT VARIABLES

### **Render (Backend):**
1. Go to Render dashboard
2. Select your service
3. Click "Environment"
4. Add:
   ```
   SENTRY_DSN_BACKEND=https://xxx@xxx.ingest.sentry.io/xxx
   ```
5. Save changes (will trigger redeploy)

### **Vercel (Frontend):**
1. Go to Vercel dashboard
2. Select your project
3. Click "Settings" → "Environment Variables"
4. Add:
   ```
   VITE_SENTRY_DSN_FRONTEND=https://xxx@xxx.ingest.sentry.io/xxx
   ```
5. Redeploy frontend

---

## 5. VERIFICATION CHECKLIST

After setup, verify:

### **Sentry:**
- [ ] Backend project created
- [ ] Frontend project created
- [ ] Both DSNs added to env vars
- [ ] Sentry initialized in both apps
- [ ] Test error sent to both (then removed)
- [ ] Errors appear in Sentry dashboard
- [ ] Email alerts configured

### **UptimeRobot:**
- [ ] Account created
- [ ] Backend monitor added
- [ ] Frontend monitor added
- [ ] API monitor added
- [ ] Email alerts configured
- [ ] Status page created (optional)
- [ ] All monitors showing "Up"

### **Health Check:**
- [ ] `/health` endpoint returns 200
- [ ] Database check works
- [ ] Uptime displayed

---

## 6. WHAT TO MONITOR AFTER LAUNCH

### **Sentry Dashboard (Daily):**
- **Errors:** Any new errors?
- **Performance:** Slow transactions?
- **Users Affected:** How many users hit errors?
- **Trends:** Errors increasing?

### **UptimeRobot Dashboard (Weekly):**
- **Uptime %:** Should be >99.5%
- **Response Time:** Should be <500ms
- **Downtime Incidents:** Investigate any
- **Monthly Report:** Review trends

### **Key Metrics:**
- Error rate: <1% of requests
- Uptime: >99.5%
- Response time: <500ms (p95)
- Recovery time: <5 minutes

---

## 7. ALERT RESPONSE PLAN

### **When You Get an Alert:**

**Downtime Alert (UptimeRobot):**
1. Check Render/Vercel dashboard
2. Look for deploy failures
3. Check recent commits
4. Rollback if needed
5. Investigate logs

**Error Alert (Sentry):**
1. Open Sentry issue
2. Check stack trace
3. Identify affected users
4. Assess severity (P0-P3)
5. Fix if critical, queue if minor

**High Error Rate:**
1. Check recent deploys
2. Rollback to last known good
3. Investigate in staging
4. Deploy fix
5. Monitor for 1 hour

---

## 8. QUICK REFERENCE

### **Sentry URLs:**
- Dashboard: https://sentry.io/organizations/YOUR_ORG/issues/
- Backend project: https://sentry.io/organizations/YOUR_ORG/projects/syncscript-backend/
- Frontend project: https://sentry.io/organizations/YOUR_ORG/projects/syncscript-frontend/

### **UptimeRobot URLs:**
- Dashboard: https://uptimerobot.com/dashboard
- Status page: https://stats.uptimerobot.com/YOUR_URL

### **Health Checks:**
- Backend: https://syncscripte.onrender.com/health
- Frontend: https://syncscript-e-qlwn.vercel.app/

---

## TOTAL SETUP TIME: 43 minutes

- Sentry account + projects: 5 min
- Backend integration: 10 min
- Frontend integration: 10 min
- Testing: 5 min
- UptimeRobot account: 2 min
- Add monitors: 5 min
- Configure alerts: 3 min
- Status page: 3 min

---

## DONE! 🎉

Your app is now fully monitored:
- ✅ Errors tracked in Sentry
- ✅ Uptime monitored 24/7
- ✅ Alerts configured
- ✅ Health checks working
- ✅ Status page public

**You'll sleep well knowing you'll get alerted immediately if anything breaks!** 😴

---

## BONUS: SLACK INTEGRATION

Want alerts in Slack?

1. **Sentry → Slack:**
   - Sentry settings → Integrations
   - Add Slack
   - Choose channel (#alerts)
   - Configure notification rules

2. **UptimeRobot → Slack:**
   - UptimeRobot → My Settings
   - Add Alert Contact → Webhook
   - Use Slack incoming webhook URL
   - Test notification

**Time:** 5 minutes  
**Value:** Immediate team visibility
