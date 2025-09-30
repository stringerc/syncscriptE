# 🛡️ SyncScript Operations Runbook

**Last Updated:** September 30, 2025  
**Version:** 1.0  
**Audience:** DevOps, Support, Incident Response  

---

## 🚨 INCIDENT RESPONSE

### **If Production is Down:**

1. **Check Health Endpoints**
   ```bash
   curl https://your-backend.onrender.com/health
   curl https://your-frontend.vercel.app
   ```

2. **Check Render Dashboard**
   - Go to: https://dashboard.render.com
   - Check service status
   - View logs for errors
   - Check for deploys in progress

3. **Check Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Check deployment status
   - View function logs
   - Check for build failures

4. **Roll Back if Needed**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main
   
   # Or redeploy previous version in Render/Vercel UI
   ```

5. **Enable Maintenance Mode** (if needed)
   ```typescript
   // Set feature flag globally
   MAINTENANCE_MODE=true
   
   // Shows maintenance page to all users
   ```

---

## 🎛️ FEATURE FLAGS

### **Flag Names & Purpose:**

| Flag | Purpose | Default | Kill Switch For |
|------|---------|---------|-----------------|
| `askAI` | AI suggestions & search | `false` | OpenAI API issues |
| `focusLock` | Focus Lock feature | `false` | Challenge system |
| `mic` | Speech-to-text | `false` | Web Speech API |
| `calendars` | All calendar features | `true` | Calendar sync |
| `googleCalendar` | Google Calendar sync | `true` | Google API issues |
| `outlookCalendar` | Outlook sync | `false` | Microsoft Graph issues |
| `appleCalendar` | Apple ICS sync | `false` | ICS parsing issues |
| `templates` | Script/Template system | `true` | Template bugs |
| `templates_gallery` | Public gallery | `false` | Gallery issues |
| `templates_recommendations` | Smart recommendations | `false` | Recommendation bugs |
| `pinnedEvents` | Pinned rail | `true` | Pinned system |
| `priorityHierarchy` | Auto-priority | `false` | Priority bugs |
| `friends_core` | Friends system | `false` | Friends bugs |
| `friends_visibility` | Privacy controls | `false` | Privacy issues |
| `sharescript_core` | Collaboration | `false` | Project bugs |
| `energyHUD` | Energy display | `true` | Energy system |
| `energyGraph` | Energy graph | `true` | Graph rendering |

### **How to Toggle Flags:**

**Global (All Users):**
```bash
# In server/.env
FEATURE_FLAG_DEFAULT_ASK_AI=false

# Restart server
```

**Per User:**
```bash
TOKEN="user-token"

curl -X PUT http://localhost:3001/api/feature-flags/flags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "askAI": false,
    "googleCalendar": false
  }'
```

**Admin (Any User):**
```bash
ADMIN_TOKEN="admin-token"

curl -X PUT http://localhost:3001/api/feature-flags/admin/USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "askAI": false
  }'
```

---

## 🔄 ROLLBACK PROCEDURES

### **Full Rollback (Nuclear Option):**
```bash
# 1. Find last good commit
git log --oneline -10

# 2. Revert to it
git reset --hard COMMIT_HASH
git push origin main --force

# 3. Redeploy
# Render: Auto-deploys from git
# Vercel: Auto-deploys from git
```

### **Feature Rollback (Surgical):**
```bash
# Disable feature flag immediately
# Update via API or database

# Database direct:
psql $DATABASE_URL
UPDATE user_feature_flags SET ask_ai = false;
```

### **Database Rollback:**
```bash
# If schema change causes issues
cd server
npx prisma migrate reset  # DANGER: Deletes data
# Or
npx prisma db push --force-reset  # DANGER: Deletes data

# Better: Have database backups!
```

---

## 📊 DASHBOARDS & MONITORING

### **Sentry (Error Tracking):**
- **Frontend:** https://sentry.io/organizations/YOUR_ORG/projects/syncscript-frontend
- **Backend:** https://sentry.io/organizations/YOUR_ORG/projects/syncscript-backend
- **Alerts:** Email + Slack (configure in Sentry)

### **UptimeRobot (Uptime):**
- **Dashboard:** https://uptimerobot.com/dashboard
- **Status Page:** https://stats.uptimerobot.com/YOUR_ID (public)
- **Alerts:** Email when down >5min

### **Render (Backend Hosting):**
- **Dashboard:** https://dashboard.render.com
- **Logs:** Real-time logs in UI
- **Metrics:** CPU, Memory, Network

### **Vercel (Frontend Hosting):**
- **Dashboard:** https://vercel.com/dashboard
- **Logs:** Function logs in UI
- **Analytics:** Web vitals, performance

### **Analytics Dashboard (In-App):**
- **URL:** https://your-app.vercel.app/admin/analytics
- **Auth:** Admin users only
- **Metrics:** Funnels, engagement, feature usage

---

## 🔑 ENVIRONMENT VARIABLES

### **Critical Variables (Must Set):**

**Backend (.env):**
```bash
# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=your-secret-here

# OpenAI (for AI features)
OPENAI_API_KEY=sk-proj-...

# Weather
OPENWEATHERMAP_API_KEY=your-key

# Google Calendar
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-frontend.vercel.app/google-callback

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Sentry
SENTRY_DSN=https://...@sentry.io/...

# URLs
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_URL=https://your-backend.onrender.com
```

**Frontend (.env.local):**
```bash
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SENTRY_DSN=https://...@sentry.io/...
```

---

## 🐛 COMMON ISSUES & FIXES

### **Issue: Backend Returns 502/503**
**Cause:** Database connection lost or server crash  
**Fix:**
```bash
# Check Render logs
# Restart service in Render dashboard
# Check DATABASE_URL is correct
```

### **Issue: CORS Errors**
**Cause:** Frontend URL not in CORS allowlist  
**Fix:**
```typescript
// server/src/index.ts
const allowedOrigins = [
  'https://your-new-domain.vercel.app',  // Add this
  ...
]
```

### **Issue: "Invalid or expired token"**
**Cause:** JWT secret changed or token expired  
**Fix:**
```bash
# Users need to log in again
# Or extend JWT expiry in auth.ts
```

### **Issue: Google Calendar Sync Fails**
**Cause:** Token expired or API quota exceeded  
**Fix:**
```bash
# Check Google Cloud Console quotas
# Refresh user's OAuth token
# Or disable via flag temporarily
```

### **Issue: High Error Rate in Sentry**
**Cause:** New bug in recent deploy  
**Fix:**
```bash
# Rollback to previous commit
git revert HEAD
git push origin main

# Or disable problematic feature via flag
```

---

## 📈 PERFORMANCE MONITORING

### **Key Metrics to Watch:**

1. **API Response Time**
   - Target: p95 < 500ms
   - Check in Render metrics

2. **Database Query Time**
   - Target: p95 < 100ms
   - Use Prisma logging

3. **Error Rate**
   - Target: < 1% of requests
   - Check in Sentry

4. **Uptime**
   - Target: > 99.9%
   - Check in UptimeRobot

5. **User Engagement**
   - DAU/MAU ratio
   - Feature adoption rates
   - Check in Analytics Dashboard

---

## 🔧 MAINTENANCE TASKS

### **Daily:**
- [ ] Check Sentry for new errors
- [ ] Review Uptime Robot status
- [ ] Check Render/Vercel health

### **Weekly:**
- [ ] Review analytics dashboard
- [ ] Check database size growth
- [ ] Review feature flag usage
- [ ] Update dependencies (`npm audit`)

### **Monthly:**
- [ ] Database backup verification
- [ ] Security audit
- [ ] Performance review
- [ ] Cost optimization review

---

## 🆘 EMERGENCY CONTACTS

**On-Call Engineer:** Your Name  
**Email:** your-email@example.com  
**Phone:** Your Phone  

**Escalation:**
- Database issues → Database admin
- OpenAI issues → Check status.openai.com
- Google API issues → Check status.cloud.google.com

---

## 📚 USEFUL COMMANDS

### **Check Production Health:**
```bash
# Backend
curl https://your-backend.onrender.com/health

# Frontend  
curl https://your-frontend.vercel.app

# Database connection
psql $DATABASE_URL -c "SELECT 1;"
```

### **View Real-Time Logs:**
```bash
# Render (backend)
# Use web UI or Render CLI

# Vercel (frontend)
vercel logs your-deployment-url

# Local testing
cd server && npm run dev
cd client && npm run dev
```

### **Database Operations:**
```bash
# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20250930.sql

# Run migrations
cd server && npx prisma migrate deploy

# Reset (DANGER)
npx prisma migrate reset
```

### **Deploy:**
```bash
# Both auto-deploy on git push
git add -A
git commit -m "Fix: description"
git push origin main

# Render: Auto-deploys backend
# Vercel: Auto-deploys frontend
```

---

## 🎯 SLA & TARGETS

### **Uptime:**
- **Target:** 99.9% (43 minutes downtime/month)
- **Measurement:** UptimeRobot
- **Current:** TBD

### **Response Time:**
- **Target:** p95 < 500ms
- **Measurement:** Sentry Performance
- **Current:** TBD

### **Error Rate:**
- **Target:** < 1% of requests
- **Measurement:** Sentry Errors
- **Current:** TBD

### **Database:**
- **Target:** p95 query < 100ms
- **Measurement:** Prisma logging
- **Current:** TBD

---

## 🎊 YOU'RE COVERED!

This runbook gives you:
- ✅ Incident response procedures
- ✅ Feature flag reference
- ✅ Rollback instructions
- ✅ Monitoring dashboards
- ✅ Common issue fixes
- ✅ Maintenance schedules
- ✅ Emergency contacts
- ✅ Useful commands

**Print this and keep it handy during launch!** 📖

---

**Next:** Complete Sentry setup, then you're 100% ready! 🚀
