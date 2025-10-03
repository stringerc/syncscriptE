# Microsoft Azure Calendar Integration Troubleshooting Guide

## 🚨 Common Error Messages & Solutions

### Authentication Errors

#### `AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application`

**What it means:** The redirect URI in your request doesn't match what's configured in Azure Portal.

**Solutions:**
1. **Check Azure Portal Configuration**
   ```
   Azure Portal → App Registrations → Your App → Authentication
   Verify redirect URI is exactly: http://localhost:3000/auth/outlook/callback
   ```

2. **Check Environment Variables**
   ```bash
   # In server/.env
   OUTLOOK_REDIRECT_URI="http://localhost:3000/auth/outlook/callback"
   ```

3. **Common Mistakes**
   - Using `https` instead of `http` for localhost
   - Extra trailing slash: `/callback/` instead of `/callback`
   - Wrong port number
   - Missing `/auth/outlook/` path

#### `AADSTS65001: The user or administrator has not consented to use the application`

**What it means:** The required permissions haven't been granted.

**Solutions:**
1. **Grant Admin Consent**
   ```
   Azure Portal → App Registrations → Your App → API Permissions
   Click "Grant admin consent for [Your Organization]"
   ```

2. **Verify Required Permissions**
   ```
   Required permissions:
   ✅ Calendars.ReadWrite (Delegated)
   ✅ offline_access (Delegated)
   ✅ User.Read (Delegated)
   ```

3. **Try Different Account**
   - Use a personal Microsoft account instead of work account
   - Or vice versa, depending on your app registration settings

#### `AADSTS70011: The provided value for the 'scope' parameter is not valid`

**What it means:** The OAuth scope in the request is incorrect.

**Solutions:**
1. **Check Scope Format**
   ```javascript
   // Correct scope format
   const scope = 'https://graph.microsoft.com/Calendars.ReadWrite offline_access';
   ```

2. **Verify Scope in Code**
   Check `server/src/routes/outlookCalendar.ts` line ~45:
   ```typescript
   scope: 'https://graph.microsoft.com/Calendars.ReadWrite offline_access'
   ```

#### `AADSTS90014: The required field 'scope' is missing from the request`

**What it means:** The OAuth request is missing the scope parameter.

**Solutions:**
1. **Check Token Exchange Request**
   Verify the token exchange includes scope parameter
2. **Update OAuth Configuration**
   Ensure scope is included in all OAuth requests

### Token Errors

#### `Invalid client secret`

**What it means:** The client secret is incorrect or expired.

**Solutions:**
1. **Regenerate Client Secret**
   ```
   Azure Portal → App Registrations → Your App → Certificates & secrets
   Click "New client secret"
   Copy the value immediately
   ```

2. **Update Environment Variable**
   ```bash
   # Update server/.env
   OUTLOOK_CLIENT_SECRET="new-secret-value"
   ```

3. **Restart Server**
   ```bash
   cd server
   npm run dev
   ```

#### `AADSTS7000215: Invalid client secret is provided`

**What it means:** The client secret format is invalid.

**Solutions:**
1. **Check Secret Format**
   - Should be a long string of characters
   - No spaces or special characters at the beginning/end
   - Copy directly from Azure Portal

2. **Verify Environment Variable**
   ```bash
   echo $OUTLOOK_CLIENT_SECRET
   # Should show the secret value without quotes
   ```

### Permission Errors

#### `Insufficient privileges to complete the operation`

**What it means:** The app doesn't have the required permissions.

**Solutions:**
1. **Check API Permissions**
   ```
   Azure Portal → App Registrations → Your App → API Permissions
   Ensure these are present and granted:
   - Calendars.ReadWrite
   - offline_access
   - User.Read
   ```

2. **Grant Admin Consent**
   Click "Grant admin consent" button

3. **Verify Permission Status**
   All permissions should show "Granted" status

#### `Access denied. You do not have permission to perform this action`

**What it means:** The user account doesn't have calendar access.

**Solutions:**
1. **Check User Account Type**
   - Personal Microsoft accounts work best
   - Some organizational accounts may have restrictions

2. **Verify Calendar Access**
   - User must have a calendar in Outlook
   - Calendar must be accessible via Microsoft Graph

### Network & Configuration Errors

#### `ECONNREFUSED` or `Network Error`

**What it means:** Can't connect to Microsoft's servers.

**Solutions:**
1. **Check Internet Connection**
2. **Verify Microsoft Graph Status**
   - Visit [https://status.office.com/](https://status.office.com/)
3. **Check Firewall Settings**
   - Ensure outbound HTTPS connections are allowed

#### `CERT_HAS_EXPIRED` or SSL Errors

**What it means:** Certificate issues with Microsoft's servers.

**Solutions:**
1. **Update Node.js**
   ```bash
   node --version
   # Should be 16+ for proper certificate handling
   ```

2. **Clear Certificate Cache**
   ```bash
   npm cache clean --force
   ```

## 🔍 Debugging Steps

### Step 1: Enable Detailed Logging

Add to `server/src/routes/outlookCalendar.ts`:
```typescript
// Add after line 1
import { logger } from '../utils/logger';

// Add detailed logging in getTokensFromCode function
logger.info('Outlook token exchange request', {
  clientId: clientId,
  redirectUri: redirectUri,
  codeLength: code.length
});
```

### Step 2: Test Individual Components

1. **Test Auth URL Generation**
   ```bash
   curl -X GET "http://localhost:3001/api/outlook-calendar/auth-url" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Test Token Exchange**
   ```bash
   curl -X POST "http://localhost:3001/api/outlook-calendar/auth/callback" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        -d '{"code":"YOUR_AUTH_CODE"}'
   ```

### Step 3: Check Server Logs

```bash
cd server
npm run dev
# Look for error messages in the console
```

### Step 4: Verify Environment Variables

```bash
# Check if variables are loaded
cd server
node -e "require('dotenv').config(); console.log(process.env.OUTLOOK_CLIENT_ID)"
```

## 🛠️ Advanced Troubleshooting

### Check Azure App Registration Settings

1. **Authentication Tab**
   ```
   ✅ Supported account types: Personal Microsoft accounts
   ✅ Redirect URIs: http://localhost:3000/auth/outlook/callback
   ✅ Allow public client flows: No
   ```

2. **API Permissions Tab**
   ```
   ✅ Microsoft Graph
     - Calendars.ReadWrite (Delegated) - Granted
     - offline_access (Delegated) - Granted  
     - User.Read (Delegated) - Granted
   ```

3. **Certificates & Secrets Tab**
   ```
   ✅ Client secrets: At least one active secret
   ✅ Secret expiration: Not expired
   ```

### Test with Microsoft Graph Explorer

1. Go to [https://developer.microsoft.com/en-us/graph/graph-explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. Sign in with the same Microsoft account
3. Test calendar API calls:
   ```
   GET https://graph.microsoft.com/v1.0/me/events
   ```

### Verify OAuth Flow Manually

1. **Generate Auth URL**
   ```javascript
   const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
     `client_id=${OUTLOOK_CLIENT_ID}&` +
     `response_type=code&` +
     `redirect_uri=${encodeURIComponent('http://localhost:3000/auth/outlook/callback')}&` +
     `scope=${encodeURIComponent('https://graph.microsoft.com/Calendars.ReadWrite offline_access')}&` +
     `response_mode=query`;
   ```

2. **Test Token Exchange**
   ```bash
   curl -X POST "https://login.microsoftonline.com/common/oauth2/v2.0/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "client_id=YOUR_CLIENT_ID&client_secret=YOUR_SECRET&code=YOUR_CODE&redirect_uri=http://localhost:3000/auth/outlook/callback&grant_type=authorization_code&scope=https://graph.microsoft.com/Calendars.ReadWrite offline_access"
   ```

## 📞 Getting Help

### Microsoft Support Resources
- [Azure AD Troubleshooting Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/troubleshooting)
- [Microsoft Graph API Status](https://status.office.com/)
- [OAuth 2.0 Error Codes Reference](https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes)

### SyncScript Debugging
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a fresh Azure app registration
4. Try with a different Microsoft account

### Community Support
- [Microsoft Graph Community](https://techcommunity.microsoft.com/t5/microsoft-365-developer/ct-p/Microsoft365Developer)
- [Azure AD Developer Community](https://techcommunity.microsoft.com/t5/azure-active-directory/ct-p/AzureAD)

---

**Remember:** Most issues are related to configuration mismatches between Azure Portal and your environment variables. Double-check all settings match exactly!
