# Exchange/Office 365 Calendar - Quick Setup

## 🚀 Quick Start Checklist

### ✅ Azure App Registration
- [ ] Go to [portal.azure.com](https://portal.azure.com)
- [ ] Azure Active Directory → App registrations → New registration
- [ ] Name: `SyncScript Exchange Integration`
- [ ] Redirect URI: `http://localhost:3000/auth/exchange/callback`
- [ ] Copy **Application (client) ID**

### ✅ Client Secret
- [ ] Certificates & secrets → New client secret
- [ ] Description: `SyncScript Exchange Secret`
- [ ] Expiration: 24 months
- [ ] **Copy the Value immediately** (you won't see it again)

### ✅ API Permissions
- [ ] API permissions → Add permission → Microsoft Graph → Delegated
- [ ] Add permissions:
  - [ ] `Calendars.ReadWrite`
  - [ ] `User.Read`
  - [ ] `offline_access`
- [ ] Grant admin consent

### ✅ Environment Variables
Add to your `.env` file:
```bash
EXCHANGE_CLIENT_ID="your-client-id-here"
EXCHANGE_CLIENT_SECRET="your-client-secret-here"
EXCHANGE_REDIRECT_URI="http://localhost:3000/auth/exchange/callback"
```

### ✅ Test Connection
- [ ] Start SyncScript server
- [ ] Go to Multi-Calendar page
- [ ] Click "Connect Exchange/Office 365"
- [ ] Sign in and grant permissions
- [ ] Verify "Connected" status

## 🔧 Production Setup

### Redirect URIs to Add:
```
https://yourdomain.com/auth/exchange/callback
https://your-app.vercel.app/auth/exchange/callback
https://your-app.netlify.app/auth/exchange/callback
```

### Environment Variables:
```bash
EXCHANGE_REDIRECT_URI="https://yourdomain.com/auth/exchange/callback"
```

## 🚨 Common Issues

| Error | Solution |
|-------|----------|
| `AADSTS50011: Reply URL mismatch` | Check redirect URI matches exactly |
| `AADSTS65001: No consent` | Grant admin consent in Azure Portal |
| `AADSTS70011: Invalid scope` | Verify API permissions are correct |
| Calendar not syncing | Check Exchange Online is enabled |

## 📞 Need Help?

1. Check server logs for detailed errors
2. Verify Azure Portal configuration
3. Test with [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer)
4. Contact Microsoft 365 admin if needed

---

**Time to complete**: ~15 minutes  
**Difficulty**: Intermediate  
**Requirements**: Microsoft 365 admin access
