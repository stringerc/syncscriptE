# Microsoft Azure Calendar Integration Setup Guide

This guide will walk you through setting up Microsoft Azure App Registration to enable Outlook Calendar integration in SyncScript.

## 📋 Prerequisites

- Microsoft Azure account (free tier is sufficient)
- Access to Azure Portal
- SyncScript application running locally or deployed

## 🚀 Step-by-Step Setup

### Step 1: Create Azure App Registration

1. **Navigate to Azure Portal**
   - Go to [https://portal.azure.com](https://portal.azure.com)
   - Sign in with your Microsoft account

2. **Access Azure Active Directory**
   - In the Azure Portal search bar, type "Azure Active Directory"
   - Click on "Azure Active Directory" from the results

3. **Create App Registration**
   - In the left sidebar, click "App registrations"
   - Click "New registration" button

4. **Configure App Registration**
   ```
   Name: SyncScript Calendar Integration
   Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   Redirect URI: 
     - Platform: Web
     - URI: http://localhost:3000/auth/outlook/callback
   ```

5. **Click "Register"**

### Step 2: Configure API Permissions

1. **Navigate to API Permissions**
   - In your app registration, click "API permissions" in the left sidebar
   - Click "Add a permission"

2. **Add Microsoft Graph Permissions**
   - Select "Microsoft Graph"
   - Choose "Delegated permissions"
   - Add the following permissions:
     ```
     ✅ Calendars.ReadWrite
     ✅ offline_access
     ✅ User.Read
     ```

3. **Grant Admin Consent** (if needed)
   - Click "Grant admin consent for [Your Organization]"
   - Confirm the action

### Step 3: Generate Client Secret

1. **Navigate to Certificates & Secrets**
   - In your app registration, click "Certificates & secrets" in the left sidebar
   - Click "New client secret"

2. **Create Client Secret**
   ```
   Description: SyncScript Calendar Integration Secret
   Expires: 24 months (recommended)
   ```

3. **Copy the Secret Value**
   - ⚠️ **IMPORTANT**: Copy the secret value immediately - it won't be shown again
   - Save it securely for the next step

### Step 4: Get Application (Client) ID

1. **Navigate to Overview**
   - In your app registration, click "Overview" in the left sidebar
   - Copy the "Application (client) ID" value

### Step 5: Configure SyncScript Environment Variables

1. **Update Server Environment Variables**
   Add these variables to your `server/.env` file:

   ```env
   # Microsoft Outlook Calendar API
   OUTLOOK_CLIENT_ID="your-application-client-id-here"
   OUTLOOK_CLIENT_SECRET="your-client-secret-value-here"
   OUTLOOK_REDIRECT_URI="http://localhost:3000/auth/outlook/callback"
   ```

2. **For Production Deployment**
   Update the redirect URI for your production domain:
   ```env
   OUTLOOK_REDIRECT_URI="https://yourdomain.com/auth/outlook/callback"
   ```

### Step 6: Update Azure App Registration for Production

1. **Add Production Redirect URI**
   - In Azure Portal, go to your app registration
   - Click "Authentication" in the left sidebar
   - Click "Add URI" under "Redirect URIs"
   - Add your production callback URL:
     ```
     https://yourdomain.com/auth/outlook/callback
     ```

2. **Update App Registration Settings**
   - In "Authentication", scroll down to "Advanced settings"
   - Set "Allow public client flows" to "No" (recommended for security)

## 🔧 Testing the Integration

### Step 1: Start SyncScript Server
```bash
cd server
npm run dev
```

### Step 2: Test Outlook Connection
1. Navigate to `http://localhost:3000/multi-calendar`
2. Click "Connect Outlook Calendar"
3. You should be redirected to Microsoft login
4. After authentication, you'll be redirected back to SyncScript
5. Check that Outlook shows as "Connected" in the UI

### Step 3: Verify Calendar Events
1. Go to the Calendar page
2. You should see events from both Google and Outlook calendars
3. Test creating, updating, and deleting events

## 🚨 Troubleshooting

### Common Issues

#### 1. "AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application"

**Solution:**
- Check that the redirect URI in your `.env` file exactly matches the one in Azure Portal
- Ensure there are no trailing slashes or extra characters
- For localhost, use `http://localhost:3000/auth/outlook/callback` (not `https`)

#### 2. "AADSTS65001: The user or administrator has not consented to use the application"

**Solution:**
- Ensure you've granted admin consent for the API permissions
- Try logging in with a different Microsoft account
- Check that the permissions are correctly configured

#### 3. "AADSTS70011: The provided value for the 'scope' parameter is not valid"

**Solution:**
- Verify that the scope in the OAuth request includes the correct permissions
- Check that `Calendars.ReadWrite` and `offline_access` are included

#### 4. "Invalid client secret"

**Solution:**
- Regenerate the client secret in Azure Portal
- Update the `OUTLOOK_CLIENT_SECRET` in your `.env` file
- Restart the SyncScript server

### Debug Steps

1. **Check Server Logs**
   ```bash
   cd server
   npm run dev
   ```
   Look for any error messages related to Outlook authentication

2. **Verify Environment Variables**
   ```bash
   echo $OUTLOOK_CLIENT_ID
   echo $OUTLOOK_CLIENT_SECRET
   echo $OUTLOOK_REDIRECT_URI
   ```

3. **Test API Endpoints**
   ```bash
   curl -X GET "http://localhost:3001/api/outlook-calendar/auth-url" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use different client secrets for development and production
- Rotate client secrets regularly (every 6-12 months)

### 2. Redirect URIs
- Only add necessary redirect URIs
- Use HTTPS in production
- Avoid wildcard redirect URIs

### 3. Permissions
- Only request necessary permissions
- Use the principle of least privilege
- Regularly review and audit permissions

### 4. Token Management
- Implement proper token refresh logic
- Store tokens securely
- Implement token expiration handling

## 📚 Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [OAuth 2.0 Authorization Code Flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Microsoft Graph Calendar API](https://docs.microsoft.com/en-us/graph/api/resources/calendar)

## 🆘 Support

If you encounter issues not covered in this guide:

1. Check the [Microsoft Graph API Status](https://status.office.com/)
2. Review the [Azure AD Troubleshooting Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/troubleshooting)
3. Check SyncScript server logs for detailed error messages
4. Verify your Azure app registration configuration

## ✅ Verification Checklist

- [ ] Azure App Registration created
- [ ] API permissions configured (Calendars.ReadWrite, offline_access, User.Read)
- [ ] Client secret generated and saved
- [ ] Environment variables configured
- [ ] Redirect URIs set up for both development and production
- [ ] SyncScript server restarted with new environment variables
- [ ] Outlook connection tested successfully
- [ ] Calendar events syncing properly
- [ ] Token refresh working correctly

---

**Next Steps:** Once Outlook integration is working, you can proceed to set up iCloud Calendar integration or add additional calendar providers.
