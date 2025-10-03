# Exchange/Office 365 Calendar - Production Deployment Guide

## 🚀 Production Deployment Checklist

### ✅ Pre-Deployment Requirements

- [ ] Microsoft 365 Business or Enterprise subscription
- [ ] Azure Active Directory admin access
- [ ] Production domain with SSL certificate
- [ ] Exchange Online enabled for your organization
- [ ] Modern Authentication enabled

### ✅ Azure Portal Configuration

#### 1. Update App Registration
1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Find your SyncScript Exchange application
4. Click **"Authentication"**

#### 2. Configure Production Redirect URIs
Add these production URIs:
```
https://yourdomain.com/auth/exchange/callback
https://your-app.vercel.app/auth/exchange/callback
https://your-app.netlify.app/auth/exchange/callback
https://your-app.railway.app/auth/exchange/callback
```

#### 3. Configure Logout URLs
- **Front-channel logout URL**: `https://yourdomain.com/auth/logout`
- **Post logout redirect URIs**: `https://yourdomain.com/auth`

#### 4. Update Supported Account Types
- **Single tenant**: "Accounts in this organizational directory only"
- **Multi-tenant**: "Accounts in any organizational directory"

### ✅ Environment Variables

#### Production Server Environment
```bash
# Exchange/Office 365 Calendar API - Production
EXCHANGE_CLIENT_ID="your-production-client-id"
EXCHANGE_CLIENT_SECRET="your-production-client-secret"
EXCHANGE_REDIRECT_URI="https://yourdomain.com/auth/exchange/callback"

# Optional: Multi-tenant configuration
EXCHANGE_TENANT_ID="your-tenant-id"  # For single tenant
EXCHANGE_TENANT_ID="common"          # For multi-tenant
```

#### Frontend Environment Variables
```bash
# Client-side configuration (if needed)
VITE_EXCHANGE_CLIENT_ID="your-production-client-id"
VITE_EXCHANGE_REDIRECT_URI="https://yourdomain.com/auth/exchange/callback"
```

### ✅ Security Configuration

#### 1. Client Secret Management
- [ ] Use Azure Key Vault for production secrets
- [ ] Rotate client secrets every 24 months
- [ ] Never commit secrets to version control
- [ ] Use environment-specific secrets

#### 2. HTTPS Requirements
- [ ] All redirect URIs must use HTTPS
- [ ] SSL certificate must be valid
- [ ] Enable HSTS headers
- [ ] Use secure cookie settings

#### 3. CORS Configuration
```typescript
// Server CORS configuration
const corsOptions = {
  origin: [
    'https://yourdomain.com',
    'https://your-app.vercel.app',
    'https://your-app.netlify.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### ✅ Exchange Online Configuration

#### 1. Enable Modern Authentication
```powershell
# Connect to Exchange Online PowerShell
Connect-ExchangeOnline

# Enable Modern Authentication
Set-OrganizationConfig -OAuth2ClientProfileEnabled $true

# Disable legacy authentication (optional)
Set-CASMailbox -Identity user@domain.com -SmtpClientAuthenticationDisabled $true
```

#### 2. Configure Calendar Sharing Policies
```powershell
# Create calendar sharing policy
New-SharingPolicy -Name "SyncScript Calendar Sharing" -Domains "yourdomain.com:CalendarSharingFreeBusyDetail"

# Assign policy to users
Set-Mailbox -Identity user@domain.com -SharingPolicy "SyncScript Calendar Sharing"
```

#### 3. Verify Exchange Online Features
- [ ] Exchange Online is enabled
- [ ] Calendar sharing is allowed
- [ ] Modern Authentication is enabled
- [ ] OAuth 2.0 is supported

### ✅ Database Configuration

#### 1. Production Database Setup
```bash
# Update database URL for production
DATABASE_URL="postgresql://username:password@host:port/database"

# Run migrations
npx prisma migrate deploy
npx prisma generate
```

#### 2. Calendar Integration Schema
Ensure the database schema supports Exchange:
```sql
-- Verify calendar_integrations table has exchange provider
SELECT DISTINCT provider FROM calendar_integrations;
-- Should include: google, outlook, exchange, icloud
```

### ✅ Monitoring & Logging

#### 1. Application Monitoring
```typescript
// Add Exchange-specific logging
logger.info('Exchange Calendar API call', {
  userId,
  operation: 'getEvents',
  timestamp: new Date().toISOString()
});
```

#### 2. Error Tracking
```typescript
// Track Exchange-specific errors
if (error.code?.includes('AADSTS')) {
  logger.error('Exchange Authentication Error', {
    errorCode: error.code,
    errorMessage: error.message,
    userId,
    timestamp: new Date().toISOString()
  });
}
```

#### 3. Performance Monitoring
- [ ] Monitor API response times
- [ ] Track token refresh frequency
- [ ] Monitor calendar sync success rates
- [ ] Set up alerts for failed authentications

### ✅ Testing Production Deployment

#### 1. Pre-Production Testing
```bash
# Test Exchange endpoints
curl -X GET "https://yourdomain.com/api/exchange-calendar/events" \
     -H "Authorization: Bearer YOUR_TOKEN"

# Test OAuth flow
curl -X GET "https://yourdomain.com/api/exchange-calendar/auth-url"
```

#### 2. User Acceptance Testing
- [ ] Test Exchange OAuth flow with real users
- [ ] Verify calendar event synchronization
- [ ] Test with different Exchange account types
- [ ] Verify error handling and user feedback

#### 3. Load Testing
- [ ] Test with multiple concurrent users
- [ ] Verify Microsoft Graph API rate limits
- [ ] Test token refresh under load
- [ ] Monitor database performance

### ✅ Deployment Platforms

#### Vercel Deployment
```json
// vercel.json
{
  "env": {
    "EXCHANGE_CLIENT_ID": "@exchange-client-id",
    "EXCHANGE_CLIENT_SECRET": "@exchange-client-secret",
    "EXCHANGE_REDIRECT_URI": "https://your-app.vercel.app/auth/exchange/callback"
  }
}
```

#### Netlify Deployment
```toml
# netlify.toml
[build.environment]
  EXCHANGE_CLIENT_ID = "your-client-id"
  EXCHANGE_CLIENT_SECRET = "your-client-secret"
  EXCHANGE_REDIRECT_URI = "https://your-app.netlify.app/auth/exchange/callback"
```

#### Railway Deployment
```bash
# Set environment variables
railway variables set EXCHANGE_CLIENT_ID=your-client-id
railway variables set EXCHANGE_CLIENT_SECRET=your-client-secret
railway variables set EXCHANGE_REDIRECT_URI=https://your-app.railway.app/auth/exchange/callback
```

### ✅ Post-Deployment Verification

#### 1. Health Checks
```bash
# Test Exchange service health
curl -X GET "https://yourdomain.com/api/health/exchange"

# Expected response
{
  "status": "healthy",
  "exchange": {
    "status": "connected",
    "lastSync": "2025-10-02T10:30:00Z"
  }
}
```

#### 2. Integration Tests
- [ ] Test Exchange OAuth flow end-to-end
- [ ] Verify calendar event synchronization
- [ ] Test error handling and recovery
- [ ] Verify token refresh mechanism

#### 3. User Documentation
- [ ] Update user documentation with Exchange setup
- [ ] Create troubleshooting guides for users
- [ ] Document any Exchange-specific limitations
- [ ] Provide support contact information

### ✅ Maintenance & Updates

#### 1. Regular Maintenance Tasks
- [ ] Monitor Microsoft Graph API changes
- [ ] Update client secrets before expiration
- [ ] Review and update permissions as needed
- [ ] Monitor Exchange Online configuration changes

#### 2. Security Updates
- [ ] Regularly review Azure AD app permissions
- [ ] Monitor for security advisories
- [ ] Update dependencies and libraries
- [ ] Review access logs and audit trails

#### 3. Performance Optimization
- [ ] Monitor API usage and optimize calls
- [ ] Implement caching where appropriate
- [ ] Optimize database queries
- [ ] Review and improve error handling

## 🚨 Production Issues & Solutions

### Common Production Issues

#### 1. Token Expiration in Production
**Solution**: Implement robust token refresh with retry logic

#### 2. Rate Limiting from Microsoft Graph
**Solution**: Implement exponential backoff and request queuing

#### 3. Multi-Tenant Authentication Issues
**Solution**: Properly configure tenant-specific redirect URIs

#### 4. Calendar Sync Failures
**Solution**: Implement comprehensive error handling and user notifications

---

**Deployment Time**: ~2-4 hours  
**Complexity**: Advanced  
**Requirements**: Azure AD admin, Exchange Online admin, Production domain

**Next Steps**: After successful deployment, monitor the integration and gather user feedback for continuous improvement.
