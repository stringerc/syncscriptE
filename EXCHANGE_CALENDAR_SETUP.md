# Exchange/Office 365 Calendar Setup Guide

This guide will walk you through setting up Exchange/Office 365 Calendar integration with SyncScript. Exchange/Office 365 uses the same Microsoft Graph API as Outlook, but with some specific configuration differences.

## 📋 Prerequisites

- Microsoft 365 Business or Enterprise account
- Admin access to Azure Active Directory (or ability to register applications)
- Exchange Online enabled for your organization

## 🔧 Step 1: Azure App Registration

### 1.1 Navigate to Azure Portal
1. Go to [portal.azure.com](https://portal.azure.com)
2. Sign in with your Microsoft 365 admin account
3. Search for "Azure Active Directory" in the search bar
4. Click on "Azure Active Directory" from the results

### 1.2 Register New Application
1. In the left sidebar, click **"App registrations"**
2. Click **"+ New registration"**
3. Fill in the application details:
   - **Name**: `SyncScript Exchange Calendar Integration`
   - **Supported account types**: Select **"Accounts in this organizational directory only"** (for single tenant) or **"Accounts in any organizational directory"** (for multi-tenant)
   - **Redirect URI**: 
     - Platform: **Web**
     - URI: `http://localhost:3000/auth/exchange/callback` (for development)
   - Click **"Register"**

### 1.3 Configure Application Properties
1. Note down the **Application (client) ID** - you'll need this for SyncScript
2. Click **"Certificates & secrets"** in the left sidebar
3. Click **"+ New client secret"**
4. Add a description: `SyncScript Exchange Integration Secret`
5. Set expiration: **24 months** (recommended)
6. Click **"Add"**
7. **IMPORTANT**: Copy the **Value** immediately - you won't be able to see it again
8. Note down the **Secret ID** as well

## 🔐 Step 2: Configure API Permissions

### 2.1 Add Microsoft Graph Permissions
1. Click **"API permissions"** in the left sidebar
2. Click **"+ Add a permission"**
3. Select **"Microsoft Graph"**
4. Choose **"Delegated permissions"**
5. Add the following permissions:
   - `Calendars.ReadWrite` - Read and write user calendars
   - `User.Read` - Sign in and read user profile
   - `offline_access` - Maintain access to data you have given it access to

### 2.2 Grant Admin Consent
1. Click **"Grant admin consent for [Your Organization]"**
2. Confirm the consent dialog
3. Verify all permissions show **"Granted for [Your Organization]"**

## 🌐 Step 3: Configure Redirect URIs

### 3.1 Add Production Redirect URIs
1. Click **"Authentication"** in the left sidebar
2. Under **"Redirect URIs"**, add these URIs:
   - `https://yourdomain.com/auth/exchange/callback` (replace with your production domain)
   - `https://your-app.vercel.app/auth/exchange/callback` (if using Vercel)
   - `https://your-app.netlify.app/auth/exchange/callback` (if using Netlify)

### 3.2 Configure Logout URLs (Optional)
1. Under **"Front-channel logout URL"**, add:
   - `https://yourdomain.com/auth/logout`
2. Under **"Post logout redirect URIs"**, add:
   - `https://yourdomain.com/auth`

### 3.3 Advanced Settings
1. Under **"Implicit grant and hybrid flows"**:
   - ✅ **Access tokens** (used for implicit flows)
   - ✅ **ID tokens** (used for implicit and hybrid flows)
2. Under **"Supported account types"**:
   - Select the appropriate option based on your needs

## ⚙️ Step 4: Configure SyncScript Environment

### 4.1 Server Environment Variables
Add these variables to your server's `.env` file:

```bash
# Exchange/Office 365 Calendar API
EXCHANGE_CLIENT_ID="your-exchange-client-id-here"
EXCHANGE_CLIENT_SECRET="your-exchange-client-secret-here"
EXCHANGE_REDIRECT_URI="http://localhost:3000/auth/exchange/callback"
```

### 4.2 Production Environment Variables
For production deployment, update the redirect URI:

```bash
# Production Exchange/Office 365 Calendar API
EXCHANGE_CLIENT_ID="your-exchange-client-id-here"
EXCHANGE_CLIENT_SECRET="your-exchange-client-secret-here"
EXCHANGE_REDIRECT_URI="https://yourdomain.com/auth/exchange/callback"
```

## 🔧 Step 5: Exchange-Specific Configuration

### 5.1 Exchange Online Requirements
Ensure your Exchange Online environment has:
- **Modern Authentication** enabled
- **OAuth 2.0** support enabled
- **Microsoft Graph API** access enabled

### 5.2 Tenant Configuration
If you're using a multi-tenant setup:
1. In Azure Portal, go to **"Azure Active Directory"**
2. Click **"Enterprise applications"**
3. Find your SyncScript application
4. Click **"Properties"**
5. Set **"Assignment required?"** to **"No"** (for multi-tenant) or **"Yes"** (for single tenant)

## 🧪 Step 6: Testing the Integration

### 6.1 Test Connection
1. Start your SyncScript server
2. Navigate to `http://localhost:3000/multi-calendar`
3. Click **"Connect Exchange/Office 365"**
4. You should be redirected to Microsoft's OAuth consent screen
5. Sign in with your Exchange/Office 365 account
6. Grant the requested permissions
7. You should be redirected back to SyncScript

### 6.2 Verify Calendar Access
1. After successful connection, check the Multi-Calendar page
2. Exchange/Office 365 should show as **"Connected"**
3. Try syncing events from your Exchange calendar
4. Verify events appear in SyncScript

## 🚨 Troubleshooting

### Common Issues

#### 1. "AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application"
**Solution**: Ensure the redirect URI in your environment variables exactly matches what's configured in Azure Portal.

#### 2. "AADSTS65001: The user or administrator has not consented to use the application"
**Solution**: 
- Ensure admin consent has been granted
- Check that all required permissions are added
- Verify the application is properly registered

#### 3. "AADSTS70011: The provided value for the 'scope' parameter is not valid"
**Solution**: This usually indicates incorrect permission scopes. Ensure you're using the correct Microsoft Graph permissions.

#### 4. Exchange Calendar Not Syncing
**Solutions**:
- Verify Exchange Online is enabled
- Check that Modern Authentication is enabled
- Ensure the user has appropriate Exchange licenses
- Verify the user has calendar permissions

### Debug Steps

1. **Check Azure Portal Logs**:
   - Go to Azure Portal → Azure Active Directory → Sign-ins
   - Look for failed authentication attempts
   - Check the error details

2. **Verify Environment Variables**:
   ```bash
   # Check if variables are loaded
   echo $EXCHANGE_CLIENT_ID
   echo $EXCHANGE_CLIENT_SECRET
   ```

3. **Test API Permissions**:
   - Use Microsoft Graph Explorer to test permissions
   - Go to [developer.microsoft.com/graph/graph-explorer](https://developer.microsoft.com/graph/graph-explorer)
   - Sign in with your Exchange account
   - Test calendar-related queries

## 🔒 Security Considerations

### 1. Client Secret Management
- Store client secrets securely
- Use environment variables, not hardcoded values
- Rotate secrets regularly (every 24 months)
- Use Azure Key Vault for production deployments

### 2. Redirect URI Security
- Only use HTTPS in production
- Validate redirect URIs on the server side
- Avoid wildcard redirect URIs

### 3. Permission Scope
- Use the principle of least privilege
- Only request necessary permissions
- Regularly review and audit permissions

## 📚 Additional Resources

- [Microsoft Graph Calendar API Documentation](https://docs.microsoft.com/en-us/graph/api/resources/calendar)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Exchange Online Modern Authentication](https://docs.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/enable-or-disable-modern-authentication-in-exchange-online)
- [Microsoft Graph Permissions Reference](https://docs.microsoft.com/en-us/graph/permissions-reference)

## 🆘 Support

If you encounter issues not covered in this guide:

1. Check the SyncScript server logs for detailed error messages
2. Review the Azure Portal audit logs
3. Test with Microsoft Graph Explorer
4. Verify your Exchange Online configuration
5. Contact your Microsoft 365 administrator if needed

---

**Next Steps**: After completing this setup, you can connect multiple Exchange/Office 365 accounts and sync events across all your calendars in SyncScript!