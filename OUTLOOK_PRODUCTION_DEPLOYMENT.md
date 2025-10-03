# Microsoft Azure Calendar Integration - Production Deployment Guide

## 🚀 Production Setup Checklist

### 1. Azure App Registration Updates

#### Update Redirect URIs for Production
```
Azure Portal → App Registrations → Your App → Authentication
Add production redirect URI:
https://yourdomain.com/auth/outlook/callback
```

#### Configure Production Settings
```
Authentication Tab:
✅ Supported account types: Personal Microsoft accounts
✅ Redirect URIs: 
   - https://yourdomain.com/auth/outlook/callback
   - http://localhost:3000/auth/outlook/callback (for testing)
✅ Allow public client flows: No
✅ Advanced settings: Use recommended settings
```

### 2. Environment Variables for Production

#### Server Environment Variables
```env
# Production Outlook Calendar API
OUTLOOK_CLIENT_ID="your-production-client-id"
OUTLOOK_CLIENT_SECRET="your-production-client-secret"
OUTLOOK_REDIRECT_URI="https://yourdomain.com/auth/outlook/callback"

# Optional: Different settings for different environments
NODE_ENV="production"
```

#### Frontend Environment Variables (if needed)
```env
# client/.env.production
VITE_OUTLOOK_CLIENT_ID="your-production-client-id"
VITE_OUTLOOK_REDIRECT_URI="https://yourdomain.com/auth/outlook/callback"
```

### 3. Security Configuration

#### Azure App Registration Security
```
Certificates & Secrets:
✅ Use separate client secrets for dev/prod
✅ Set appropriate expiration (12-24 months)
✅ Document secret rotation schedule

API Permissions:
✅ Only request necessary permissions
✅ Grant admin consent for production
✅ Regular permission audits

Authentication:
✅ Disable public client flows
✅ Use HTTPS redirect URIs only
✅ Implement proper CORS settings
```

#### SyncScript Security
```typescript
// server/src/index.ts - CORS Configuration
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'http://localhost:3000' // For development
  ],
  credentials: true
}));

// Helmet Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://graph.microsoft.com", "https://login.microsoftonline.com"],
    },
  },
}));
```

## 🔧 Deployment Platforms

### Vercel Deployment

#### 1. Environment Variables Setup
```bash
# Add to Vercel dashboard or CLI
vercel env add OUTLOOK_CLIENT_ID
vercel env add OUTLOOK_CLIENT_SECRET  
vercel env add OUTLOOK_REDIRECT_URI
```

#### 2. Update Redirect URIs
```
Azure Portal → Your App → Authentication
Add: https://your-app.vercel.app/auth/outlook/callback
```

#### 3. Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ],
  "env": {
    "OUTLOOK_CLIENT_ID": "@outlook-client-id",
    "OUTLOOK_CLIENT_SECRET": "@outlook-client-secret",
    "OUTLOOK_REDIRECT_URI": "@outlook-redirect-uri"
  }
}
```

### Railway Deployment

#### 1. Environment Variables
```bash
# Railway CLI
railway variables set OUTLOOK_CLIENT_ID=your-client-id
railway variables set OUTLOOK_CLIENT_SECRET=your-client-secret
railway variables set OUTLOOK_REDIRECT_URI=https://your-app.railway.app/auth/outlook/callback
```

#### 2. Update Azure Redirect URI
```
Azure Portal → Your App → Authentication
Add: https://your-app.railway.app/auth/outlook/callback
```

### Render Deployment

#### 1. Environment Variables
```yaml
# render.yaml
services:
  - type: web
    name: syncscript-backend
    envVars:
      - key: OUTLOOK_CLIENT_ID
        value: your-client-id
      - key: OUTLOOK_CLIENT_SECRET
        value: your-client-secret
      - key: OUTLOOK_REDIRECT_URI
        value: https://your-app.onrender.com/auth/outlook/callback
```

#### 2. Update Azure Redirect URI
```
Azure Portal → Your App → Authentication
Add: https://your-app.onrender.com/auth/outlook/callback
```

## 🔒 Production Security Checklist

### Azure App Registration
- [ ] Separate app registration for production
- [ ] Different client secrets for dev/prod
- [ ] HTTPS redirect URIs only
- [ ] Minimal required permissions
- [ ] Admin consent granted
- [ ] Regular secret rotation schedule
- [ ] Public client flows disabled

### SyncScript Application
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] CSP headers implemented
- [ ] Rate limiting enabled
- [ ] Error handling doesn't expose secrets
- [ ] Logging doesn't include sensitive data
- [ ] HTTPS enforced
- [ ] Token refresh implemented

### Database Security
- [ ] Calendar integration tokens encrypted
- [ ] Regular token cleanup
- [ ] Access logging enabled
- [ ] Backup strategy implemented

## 🧪 Production Testing

### 1. Pre-Deployment Testing
```bash
# Test with production environment variables
NODE_ENV=production npm run dev

# Test OAuth flow
curl -X GET "https://yourdomain.com/api/outlook-calendar/auth-url" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Post-Deployment Verification
```bash
# Test calendar connection
curl -X GET "https://yourdomain.com/api/multi-calendar/providers" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test event fetching
curl -X GET "https://yourdomain.com/api/multi-calendar/events" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. User Acceptance Testing
- [ ] Users can connect Outlook calendars
- [ ] Events sync correctly
- [ ] Token refresh works automatically
- [ ] Error handling is user-friendly
- [ ] Performance is acceptable

## 📊 Monitoring & Maintenance

### 1. Application Monitoring
```typescript
// Add monitoring to server/src/routes/outlookCalendar.ts
router.post('/auth/callback', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // ... existing code ...
    
    // Log successful authentication
    logger.info('Outlook OAuth success', {
      userId: req.user!.id,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // Log authentication failures
    logger.error('Outlook OAuth failure', {
      userId: req.user!.id,
      error: error.message,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));
```

### 2. Token Management
```typescript
// Add token expiration monitoring
const checkTokenExpiration = async () => {
  const expiringTokens = await prisma.calendarIntegration.findMany({
    where: {
      provider: 'outlook',
      isActive: true,
      expiresAt: {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    }
  });
  
  for (const integration of expiringTokens) {
    try {
      await refreshOutlookToken(integration);
      logger.info('Token refreshed successfully', { integrationId: integration.id });
    } catch (error) {
      logger.error('Token refresh failed', { integrationId: integration.id, error: error.message });
    }
  }
};

// Run daily
setInterval(checkTokenExpiration, 24 * 60 * 60 * 1000);
```

### 3. Error Tracking
```typescript
// Add error tracking
import { logger } from '../utils/logger';

const trackOutlookError = (error: any, context: any) => {
  logger.error('Outlook API Error', {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
  
  // Send to external monitoring service (e.g., Sentry)
  // Sentry.captureException(error, { extra: context });
};
```

## 🔄 Maintenance Schedule

### Daily
- [ ] Check application logs for errors
- [ ] Monitor token refresh success rate
- [ ] Verify API rate limits not exceeded

### Weekly
- [ ] Review authentication success rates
- [ ] Check for expired tokens
- [ ] Monitor performance metrics

### Monthly
- [ ] Audit API permissions
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Test disaster recovery procedures

### Quarterly
- [ ] Rotate client secrets
- [ ] Security audit
- [ ] Performance optimization review
- [ ] User feedback analysis

## 🚨 Incident Response

### Common Production Issues

#### 1. Token Expiration Mass Failure
```typescript
// Emergency token refresh script
const emergencyTokenRefresh = async () => {
  const integrations = await prisma.calendarIntegration.findMany({
    where: { provider: 'outlook', isActive: true }
  });
  
  for (const integration of integrations) {
    try {
      await refreshOutlookToken(integration);
    } catch (error) {
      // Disable integration if refresh fails
      await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: { isActive: false }
      });
    }
  }
};
```

#### 2. Azure API Rate Limiting
```typescript
// Implement exponential backoff
const callMicrosoftGraphWithRetry = async (url: string, options: any, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios(url, options);
    } catch (error) {
      if (error.response?.status === 429 && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};
```

#### 3. Service Outage Response
```typescript
// Graceful degradation
const getCalendarEventsWithFallback = async (userId: string) => {
  try {
    return await getOutlookEvents(userId);
  } catch (error) {
    logger.error('Outlook service unavailable', { userId, error: error.message });
    
    // Return cached events or empty array
    return await getCachedEvents(userId) || [];
  }
};
```

---

**Remember:** Production deployment requires careful planning, testing, and monitoring. Always test thoroughly in a staging environment before deploying to production!
