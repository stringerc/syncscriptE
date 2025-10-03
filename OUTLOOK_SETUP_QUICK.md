# Quick Reference: Microsoft Azure Calendar Setup

## 🚀 Quick Setup Checklist

### 1. Azure Portal Setup (5 minutes)
```
1. Go to https://portal.azure.com
2. Search "Azure Active Directory" → "App registrations" → "New registration"
3. Name: "SyncScript Calendar Integration"
4. Account types: "Personal Microsoft accounts"
5. Redirect URI: http://localhost:3000/auth/outlook/callback
6. Click "Register"
```

### 2. API Permissions (2 minutes)
```
1. Go to "API permissions" → "Add a permission"
2. Select "Microsoft Graph" → "Delegated permissions"
3. Add: Calendars.ReadWrite, offline_access, User.Read
4. Click "Grant admin consent"
```

### 3. Client Secret (2 minutes)
```
1. Go to "Certificates & secrets" → "New client secret"
2. Description: "SyncScript Secret"
3. Expires: 24 months
4. Copy the secret value (save immediately!)
```

### 4. Environment Variables (1 minute)
```env
# Add to server/.env
OUTLOOK_CLIENT_ID="your-client-id-from-overview"
OUTLOOK_CLIENT_SECRET="your-secret-value"
OUTLOOK_REDIRECT_URI="http://localhost:3000/auth/outlook/callback"
```

### 5. Test Integration (2 minutes)
```
1. Restart server: npm run dev
2. Go to http://localhost:3000/multi-calendar
3. Click "Connect Outlook Calendar"
4. Sign in with Microsoft account
5. Verify "Connected" status
```

## 🔧 Common Issues & Solutions

| Error | Solution |
|-------|----------|
| `AADSTS50011: Reply URL mismatch` | Check redirect URI matches exactly in Azure Portal |
| `AADSTS65001: No consent` | Grant admin consent for API permissions |
| `AADSTS70011: Invalid scope` | Verify scope includes Calendars.ReadWrite |
| `Invalid client secret` | Regenerate secret and update .env |

## 📋 Required Azure Settings

### App Registration Details
- **Name**: SyncScript Calendar Integration
- **Account Types**: Personal Microsoft accounts
- **Redirect URIs**: 
  - Development: `http://localhost:3000/auth/outlook/callback`
  - Production: `https://yourdomain.com/auth/outlook/callback`

### API Permissions
- `Calendars.ReadWrite` (Delegated)
- `offline_access` (Delegated) 
- `User.Read` (Delegated)

### Authentication Settings
- **Allow public client flows**: No
- **Supported account types**: Personal Microsoft accounts

## 🧪 Testing Commands

```bash
# Test auth URL endpoint
curl -X GET "http://localhost:3001/api/outlook-calendar/auth-url" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test multi-calendar providers
curl -X GET "http://localhost:3001/api/multi-calendar/providers" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test events from all providers
curl -X GET "http://localhost:3001/api/multi-calendar/events" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Notes

- Never commit `.env` files
- Use different secrets for dev/prod
- Rotate secrets every 6-12 months
- Only add necessary redirect URIs
- Use HTTPS in production

## 📞 Support Resources

- [Azure AD Troubleshooting](https://docs.microsoft.com/en-us/azure/active-directory/develop/troubleshooting)
- [Microsoft Graph API Status](https://status.office.com/)
- [OAuth 2.0 Error Codes](https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes)

---

**Total Setup Time**: ~12 minutes  
**Difficulty**: Beginner  
**Prerequisites**: Microsoft account, Azure Portal access
