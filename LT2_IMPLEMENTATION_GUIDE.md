# 🛡️ LT-2: Observability & Guardrails — Implementation Guide

**Launch Train:** 2  
**Goal:** Make failures visible and reversible  
**Time:** 1-2 days  
**Priority:** HIGH (production safety)  

---

## ✅ COMPLETED: Package Installation

- ✅ Frontend: `@sentry/react`, `@sentry/vite-plugin`
- ✅ Backend: `@sentry/node`, `@sentry/profiling-node`

---

## 📋 LT-2 CHECKLIST

### **1. Error Tracking (Sentry) — 2 hours**

#### **Step 1.1: Get Sentry Account (5 min)**
```bash
# Go to: https://sentry.io/signup/
# Create free account
# Create new project: "SyncScript Frontend"
# Create new project: "SyncScript Backend"
# Copy DSN for each
```

#### **Step 1.2: Configure Frontend Sentry (15 min)**

**File: `client/src/main.tsx`**
```typescript
import * as Sentry from "@sentry/react"

// Add BEFORE ReactDOM.createRoot
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD, // Only in production
})
```

**File: `client/.env.local`**
```bash
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
```

#### **Step 1.3: Configure Backend Sentry (15 min)**

**File: `server/src/index.ts` (top of file)**
```typescript
import * as Sentry from "@sentry/node"
import { ProfilingIntegration } from "@sentry/profiling-node"

// Add BEFORE any other imports
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})

// Add error handler middleware at the end (after all routes)
app.use(Sentry.Handlers.errorHandler())
```

**File: `server/.env`**
```bash
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
```

#### **Step 1.4: Test Error Tracking (5 min)**
```typescript
// Add test route
app.get('/debug-sentry', (req, res) => {
  throw new Error('Test Sentry error tracking')
})

// Visit: http://localhost:3001/debug-sentry
// Check Sentry dashboard for error
```

**Expected:** Error appears in Sentry within 30 seconds

---

### **2. Uptime Monitoring — 30 minutes**

#### **Step 2.1: Enhanced Health Check (10 min)**

**File: `server/src/routes/health.ts`** (create if doesn't exist)
```typescript
import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

router.get('/', async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`
    
    // Check OpenAI (optional)
    const openaiConfigured = !!process.env.OPENAI_API_KEY
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      database: 'connected',
      openai: openaiConfigured ? 'configured' : 'missing',
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    })
  }
})

export default router
```

#### **Step 2.2: Set Up UptimeRobot (15 min)**
```bash
# Go to: https://uptimerobot.com/
# Create free account
# Add HTTP(s) monitor:
#   - Name: SyncScript Backend
#   - URL: https://your-backend.onrender.com/health
#   - Interval: 5 minutes
#   - Alert contacts: Your email

# Add second monitor:
#   - Name: SyncScript Frontend
#   - URL: https://your-frontend.vercel.app
#   - Interval: 5 minutes
```

#### **Step 2.3: Status Page (5 min)**
```bash
# UptimeRobot > Status Pages
# Create public status page
# Add both monitors
# Get public URL: https://status.syncscript.io (custom domain optional)
```

**Expected:** Get email alerts if site goes down

---

### **3. Analytics Dashboard — 1 hour**

#### **Step 3.1: Create Analytics Queries (20 min)**

**File: `server/src/services/analyticsService.ts`** (enhance existing)
```typescript
// Add these methods to existing service

async getSuggestFunnel(startDate: Date, endDate: Date) {
  const shown = await prisma.analyticsEvent.count({
    where: {
      eventType: 'SUGGESTION_SHOWN',
      createdAt: { gte: startDate, lte: endDate }
    }
  })
  
  const accepted = await prisma.analyticsEvent.count({
    where: {
      eventType: 'SUGGESTION_ACCEPTED',
      createdAt: { gte: startDate, lte: endDate }
    }
  })
  
  return {
    shown,
    accepted,
    conversionRate: shown > 0 ? (accepted / shown * 100).toFixed(2) : 0
  }
}

async getTemplateApplyStats(days: number = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  
  const applies = await prisma.scriptApplication.groupBy({
    by: ['scriptId'],
    _count: true,
    where: { createdAt: { gte: since } },
    orderBy: { _count: { scriptId: 'desc' } },
    take: 10
  })
  
  return applies
}

async getPinnedUsageStats() {
  const pinned = await prisma.event.count({
    where: { isPinned: true }
  })
  
  const total = await prisma.event.count()
  
  return {
    pinnedCount: pinned,
    totalEvents: total,
    pinnedPercentage: total > 0 ? (pinned / total * 100).toFixed(2) : 0
  }
}
```

#### **Step 3.2: Wire Analytics Dashboard UI (40 min)**

**File: `client/src/pages/AnalyticsDashboardPage.tsx`** (enhance existing)
```typescript
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Zap, BookTemplate, Pin } from 'lucide-react'

export function AnalyticsDashboardPage() {
  // Fetch funnels
  const { data: suggestFunnel } = useQuery({
    queryKey: ['analytics-suggest-funnel'],
    queryFn: async () => {
      const response = await api.get('/analytics/funnel/suggestions')
      return response.data
    }
  })
  
  const { data: templateStats } = useQuery({
    queryKey: ['analytics-templates'],
    queryFn: async () => {
      const response = await api.get('/analytics/templates')
      return response.data
    }
  })
  
  const { data: pinnedStats } = useQuery({
    queryKey: ['analytics-pinned'],
    queryFn: async () => {
      const response = await api.get('/analytics/pinned')
      return response.data
    }
  })

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Suggestion Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {suggestFunnel?.data?.conversionRate || 0}%
            </div>
            <p className="text-sm text-muted-foreground">
              {suggestFunnel?.data?.accepted || 0} / {suggestFunnel?.data?.shown || 0} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookTemplate className="w-5 h-5" />
              Template Applies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {templateStats?.data?.totalApplies || 0}
            </div>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pin className="w-5 h-5" />
              Pinned Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {pinnedStats?.data?.pinnedPercentage || 0}%
            </div>
            <p className="text-sm text-muted-foreground">
              {pinnedStats?.data?.pinnedCount || 0} pinned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* More charts... */}
    </div>
  )
}
```

---

### **4. Kill Switches — 30 minutes**

#### **Step 4.1: Verify Feature Flag Infrastructure (10 min)**

**Test Each Flag:**
```bash
# Get your auth token
TOKEN="your-token-here"

# Test disabling Google Calendar
curl -X PUT http://localhost:3001/api/feature-flags/flags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"googleCalendar": false}'

# Verify: Google Calendar tab should hide or show disabled state
# Verify: No calendar sync operations occur

# Test disabling AI
curl -X PUT http://localhost:3001/api/feature-flags/flags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"askAI": false}'

# Verify: AI suggestions don't show
# Verify: Ask AI button disabled
```

#### **Step 4.2: Add Provider-Level Kill Switches (20 min)**

**File: `server/src/middleware/providerGuard.ts`** (create new)
```typescript
import { Request, Response, NextFunction } from 'express'
import { featureFlagService } from '../services/featureFlagService'

export const googleCalendarGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId
  if (!userId) return next()
  
  const flags = await featureFlagService.getFeatureFlagsForUser(userId)
  
  if (!flags.googleCalendar) {
    return res.status(403).json({
      success: false,
      error: 'Google Calendar integration is currently disabled'
    })
  }
  
  next()
}

export const outlookGuard = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId
  if (!userId) return next()
  
  const flags = await featureFlagService.getFeatureFlagsForUser(userId)
  
  if (!flags.outlookCalendar) {
    return res.status(403).json({
      success: false,
      error: 'Outlook Calendar integration is currently disabled'
    })
  }
  
  next()
}
```

**Apply to routes:**
```typescript
// In googleCalendar.ts
import { googleCalendarGuard } from '../middleware/providerGuard'

router.post('/sync', auth, googleCalendarGuard, async (req, res) => {
  // ... existing code
})
```

---

### **5. Idempotency Audit — 30 minutes**

#### **Step 5.1: Verify Calendar Write Idempotency (15 min)**

**Check: `server/src/routes/googleCalendar.ts`**
```typescript
// Confirm these endpoints use idempotencyMiddleware
router.post('/sync', auth, idempotencyMiddleware, googleCalendarGuard, ...)
router.post('/events', auth, idempotencyMiddleware, ...)
router.put('/events/:id', auth, idempotencyMiddleware, ...)
```

**Check: `server/src/services/googleCalendarHardenedService.ts`**
```typescript
// Confirm write operations generate unique keys
const idempotencyKey = `gcal-sync-${userId}-${eventId}-${Date.now()}`
```

#### **Step 5.2: Verify Script Apply Idempotency (15 min)**

**Check: `server/src/routes/scripts.ts`**
```typescript
// Confirm template apply uses idempotency
router.post('/:scriptId/apply', auth, idempotencyMiddleware, ...)
```

**Check: `server/src/services/scriptsService.ts`**
```typescript
// Confirm check for existing application
const existing = await prisma.scriptApplication.findFirst({
  where: { scriptId, eventId, userId }
})

if (existing) {
  // Return existing result, don't create duplicate
}
```

---

### **6. Runbook Documentation — 1 hour**

**File: `RUNBOOK.md`** (create)

See full runbook below ⬇️

---

## 🎯 Quick Start (30 Minutes)

### **Minimal LT-2 for Today:**

1. **Add Sentry DSNs to .env** (5 min)
2. **Initialize Sentry in main.tsx** (5 min)
3. **Initialize Sentry in server index.ts** (5 min)
4. **Test error tracking** (5 min)
5. **Set up UptimeRobot monitors** (10 min)

**Result:** Basic monitoring operational

---

## 📊 Success Criteria

### **LT-2 Done When:**
- [x] Sentry packages installed
- [ ] Sentry configured (frontend + backend)
- [ ] Test error appears in Sentry dashboard
- [ ] UptimeRobot monitoring both URLs
- [ ] Alert email received when test outage triggered
- [ ] Analytics dashboard shows funnels
- [ ] Feature flags verified (turn off → feature stops)
- [ ] Idempotency confirmed (re-apply → no duplicate)
- [ ] Runbook created

---

## 🚀 Current Status

**Completed:**
- ✅ Sentry packages installed
- ✅ Infrastructure ready

**Next:**
- Add Sentry DSNs
- Initialize Sentry
- Test error tracking
- Set up monitoring
- Create runbook

**Estimated Remaining Time:** 2-3 hours

---

**Ready to continue? I can help you set up Sentry configuration next!** 🛡️
