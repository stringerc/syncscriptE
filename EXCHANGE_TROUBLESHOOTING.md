# Exchange/Office 365 Calendar Troubleshooting Guide

## 🚨 Common Error Messages & Solutions

### Authentication Errors

#### `AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application`

**Cause**: Redirect URI mismatch between SyncScript and Azure Portal

**Solution**:
1. Check your `.env` file:
   ```bash
   EXCHANGE_REDIRECT_URI="http://localhost:3000/auth/exchange/callback"
   ```
2. Verify in Azure Portal → App Registration → Authentication → Redirect URIs
3. Ensure exact match (including protocol, port, and path)
4. For production, update both environment variable and Azure Portal

#### `AADSTS65001: The user or administrator has not consented to use the application`

**Cause**: Missing admin consent or insufficient permissions

**Solution**:
1. Go to Azure Portal → App Registration → API permissions
2. Ensure these permissions are added:
   - `Calendars.ReadWrite`
   - `User.Read`
   - `offline_access`
3. Click "Grant admin consent for [Your Organization]"
4. Verify all permissions show "Granted"

#### `AADSTS70011: The provided value for the 'scope' parameter is not valid`

**Cause**: Incorrect permission scopes in the OAuth request

**Solution**:
1. Check the Exchange service implementation
2. Verify scopes match the permissions configured in Azure Portal
3. Ensure no typos in permission names

### Connection Issues

#### Exchange Calendar Shows "Not Connected" After Successful OAuth

**Cause**: Database or API configuration issue

**Solution**:
1. Check server logs for errors during connection
2. Verify database has the integration record:
   ```sql
   SELECT * FROM calendar_integrations WHERE provider = 'exchange';
   ```
3. Ensure the Exchange service is properly initialized
4. Check that the OAuth callback is processing correctly

#### `Error fetching Exchange events: Request failed with status code 401`

**Cause**: Invalid or expired access token

**Solution**:
1. Check if the access token is valid
2. Verify the refresh token mechanism is working
3. Ensure the Exchange service can refresh tokens
4. Check Microsoft Graph API quotas and limits

#### `Error fetching Exchange events: Request failed with status code 403`

**Cause**: Insufficient permissions or API access denied

**Solution**:
1. Verify `Calendars.ReadWrite` permission is granted
2. Check if the user has Exchange Online license
3. Ensure Modern Authentication is enabled
4. Verify the user has calendar access permissions

### Calendar Sync Issues

#### Events Not Appearing in SyncScript

**Cause**: Multiple possible issues

**Solutions**:
1. **Check Calendar Permissions**:
   - Verify user has access to the calendar
   - Check if calendar is shared properly
   - Ensure calendar is not private/hidden

2. **Verify API Calls**:
   - Check server logs for successful API calls
   - Verify Microsoft Graph API responses
   - Test with Graph Explorer

3. **Check Date Range**:
   - Ensure events are within the requested time range
   - Verify timezone handling
   - Check for date format issues

#### Duplicate Events or Missing Events

**Cause**: Sync logic or API response handling issues

**Solution**:
1. Check the event deduplication logic
2. Verify how events are being processed
3. Ensure proper error handling for failed API calls
4. Check for timezone conversion issues

### Exchange-Specific Issues

#### `Exchange Online is not enabled for this user`

**Cause**: User doesn't have Exchange Online license

**Solution**:
1. Assign Exchange Online license to the user
2. Wait for license propagation (can take up to 24 hours)
3. Verify in Microsoft 365 admin center

#### `Modern Authentication is not enabled`

**Cause**: Legacy authentication is still enabled

**Solution**:
1. Enable Modern Authentication in Exchange Online:
   ```powershell
   Set-OrganizationConfig -OAuth2ClientProfileEnabled $true
   ```
2. Disable legacy authentication:
   ```powershell
   Set-CASMailbox -Identity user@domain.com -SmtpClientAuthenticationDisabled $true
   ```

#### `Calendar sharing permissions are insufficient`

**Cause**: User doesn't have proper calendar sharing rights

**Solution**:
1. Check calendar permissions in Outlook:
   - Right-click calendar → Properties → Permissions
   - Ensure proper sharing levels
2. Verify in Exchange Admin Center
3. Check for organizational policies restricting calendar access

## 🔍 Debugging Steps

### 1. Enable Detailed Logging

Add to your server configuration:
```typescript
// Enable debug logging for Exchange service
process.env.DEBUG = 'exchange:*';
```

### 2. Test with Microsoft Graph Explorer

1. Go to [developer.microsoft.com/graph/graph-explorer](https://developer.microsoft.com/graph/graph-explorer)
2. Sign in with your Exchange account
3. Test these queries:
   ```
   GET https://graph.microsoft.com/v1.0/me/calendars
   GET https://graph.microsoft.com/v1.0/me/events
   ```

### 3. Check Azure Portal Logs

1. Go to Azure Portal → Azure Active Directory → Sign-ins
2. Filter by your application
3. Look for failed sign-ins
4. Check error details and recommendations

### 4. Verify Exchange Configuration

```powershell
# Check Modern Authentication status
Get-OrganizationConfig | Select OAuth2ClientProfileEnabled

# Check user's Exchange Online status
Get-Mailbox -Identity user@domain.com | Select DisplayName, PrimarySmtpAddress, ExchangeVersion
```

## 🛠️ Advanced Troubleshooting

### Token Refresh Issues

If tokens are expiring frequently:

1. **Check Token Expiration**:
   ```typescript
   console.log('Token expires at:', new Date(credentials.expiresAt));
   console.log('Current time:', new Date());
   ```

2. **Implement Proper Refresh Logic**:
   ```typescript
   if (credentials.expiresAt && new Date() > new Date(credentials.expiresAt)) {
     // Refresh token
     const newCredentials = await exchangeService.refreshToken();
   }
   ```

### Rate Limiting

If you're hitting Microsoft Graph rate limits:

1. **Implement Exponential Backoff**:
   ```typescript
   const delay = Math.pow(2, retryCount) * 1000;
   await new Promise(resolve => setTimeout(resolve, delay));
   ```

2. **Batch API Calls**:
   ```typescript
   // Use batch requests for multiple operations
   const batchRequest = {
     requests: [
       { id: "1", method: "GET", url: "/me/calendars" },
       { id: "2", method: "GET", url: "/me/events" }
     ]
   };
   ```

### Multi-Tenant Issues

For multi-tenant deployments:

1. **Verify Tenant Configuration**:
   - Check if application is properly configured for multi-tenant
   - Verify tenant-specific redirect URIs
   - Ensure proper consent flow

2. **Handle Tenant-Specific Errors**:
   ```typescript
   if (error.code === 'AADSTS50020') {
     // User account from external identity provider
     // Handle external identity provider authentication
   }
   ```

## 📞 Getting Help

### Microsoft Support Resources

1. **Microsoft Graph API Support**:
   - [Microsoft Graph Community](https://techcommunity.microsoft.com/t5/microsoft-graph/ct-p/MicrosoftGraph)
   - [Stack Overflow - microsoft-graph](https://stackoverflow.com/questions/tagged/microsoft-graph)

2. **Exchange Online Support**:
   - [Microsoft 365 Admin Center](https://admin.microsoft.com)
   - [Exchange Online PowerShell](https://docs.microsoft.com/powershell/exchange/exchange-online-powershell)

### SyncScript-Specific Issues

1. **Check Server Logs**:
   ```bash
   # View real-time logs
   tail -f server/logs/server.log
   ```

2. **Database Inspection**:
   ```bash
   # Check calendar integrations
   npx prisma studio
   ```

3. **API Testing**:
   ```bash
   # Test Exchange endpoints
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        "http://localhost:3001/api/exchange-calendar/events"
   ```

---

**Remember**: Most Exchange/Office 365 issues are related to permissions, authentication, or configuration. Start with the Azure Portal configuration and work your way through the troubleshooting steps systematically.
