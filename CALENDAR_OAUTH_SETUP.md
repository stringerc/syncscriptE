# 📅 Calendar OAuth Setup Guide

**Complete guide to set up Google, Outlook, and Apple Calendar OAuth**

---

## 🎯 Current Issue

**Error:** `redirect_uri_mismatch` for Google Calendar

**Cause:** The redirect URI in your Google Cloud Console doesn't match what SyncScript is sending.

---

## 🔧 SOLUTION 1: Fix Google Calendar (Quickest)

### **Step 1: Update Google Cloud Console**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   ```
   http://localhost:3000/google-callback
   ```
4. Click "Save"
5. Wait 5 minutes for changes to propagate

### **Step 2: Test**
1. Refresh SyncScript
2. Go to Calendar Sync page
3. Click "Connect Google Calendar"
4. Should work now! ✅

---

## 🚀 SOLUTION 2: Set Up All Three Providers

### **🔵 GOOGLE CALENDAR**

**Already have credentials, just need to fix redirect URI**

**In `/server/.env`:**
```bash
GOOGLE_CLIENT_ID=your_existing_client_id
GOOGLE_CLIENT_SECRET=your_existing_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/google-callback
```

**In Google Cloud Console:**
- Add authorized redirect URI: `http://localhost:3000/google-callback`

---

### **🟦 OUTLOOK CALENDAR** ⭐ NEW!

**Step 1: Get Microsoft App Registration**

1. Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
2. Click "New registration"
3. Name: "SyncScript"
4. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
5. Redirect URI: 
   - Platform: Web
   - URI: `http://localhost:3000/outlook-callback`
6. Click "Register"

**Step 2: Get Credentials**

1. Note the "Application (client) ID" → This is your `MICROSOFT_CLIENT_ID`
2. Click "Certificates & secrets"
3. Click "New client secret"
4. Description: "SyncScript"
5. Expires: 24 months
6. Click "Add"
7. **Copy the Value immediately** → This is your `MICROSOFT_CLIENT_SECRET`

**Step 3: Set Permissions**

1. Click "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Select "Delegated permissions"
5. Add:
   - `Calendars.ReadWrite`
   - `Calendars.ReadWrite.Shared`
   - `User.Read`
6. Click "Grant admin consent"

**Step 4: Add to .env**

```bash
MICROSOFT_CLIENT_ID=your_application_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret_value
MICROSOFT_REDIRECT_URI=http://localhost:3000/outlook-callback
```

---

### **⚫ APPLE CALENDAR (Sign in with Apple)** ⭐ NEW!

**Step 1: Apple Developer Account**

1. Go to: https://developer.apple.com/account/resources/identifiers/list/serviceId
2. Click "+" to create new identifier
3. Select "Services IDs"
4. Continue

**Step 2: Configure Service ID**

1. Description: "SyncScript"
2. Identifier: `com.syncscript.signin` (must be unique)
3. Enable "Sign in with Apple"
4. Click "Configure"

**Step 3: Set Domains and Redirect URIs**

1. Domains: `localhost` (for dev) or your production domain
2. Return URLs: `http://localhost:3000/apple-callback`
3. Save

**Step 4: Get Credentials**

1. Note your Service ID → This is `APPLE_CLIENT_ID`
2. Create a Key for Sign in with Apple
3. Download the .p8 key file
4. Convert to client secret (complex - see Apple docs)

**Step 5: Add to .env**

```bash
APPLE_CLIENT_ID=com.syncscript.signin
APPLE_TEAM_ID=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_CLIENT_SECRET=your_generated_secret
APPLE_REDIRECT_URI=http://localhost:3000/apple-callback
```

**Note:** Apple OAuth is more complex due to JWT signing requirements.

---

## 🎯 RECOMMENDED APPROACH FOR LAUNCH FRIDAY

### **Option A: Fix Google Only (Fastest - 5 minutes)**

1. Update Google Cloud redirect URI
2. Wait 5 minutes
3. Test connection
4. Keep Outlook & Apple as "Coming Soon"

### **Option B: Quick Multi-Calendar Display (Current)**

**What you have now:**
- ✅ Beautiful 3-provider card UI
- ✅ Professional appearance
- ✅ Shows future vision
- ⚠️ Requires OAuth setup for each
- 🔒 Outlook & Apple backend ready, just need credentials

**For launch:**
- Keep the UI as-is (looks great!)
- Fix Google redirect URI
- Add setup instructions in docs
- Launch with Google working
- Add Outlook/Apple post-launch

---

## 📦 QUICK FIX PACKAGE

I've created:
- ✅ `OutlookCalendarService` - Full OAuth flow
- ✅ `AppleCalendarService` - Full OAuth flow  
- ✅ `/api/calendar-auth/*` routes - All 3 providers
- ✅ Frontend updated - Fetches all 3 auth URLs
- ✅ Smart error handling - Shows setup requirements

**What works NOW:**
- All 3 provider cards display
- Attempts to fetch auth URLs
- Shows helpful messages if not configured
- Google ready once redirect URI fixed
- Outlook ready once credentials added
- Apple ready once credentials added

---

## ⚡ IMMEDIATE FIX

**To fix Google Calendar right now:**

```bash
# Option 1: Update in Google Cloud Console
# Go to console.cloud.google.com/apis/credentials
# Edit your OAuth client
# Add: http://localhost:3000/google-callback
# Save and wait 5 min

# Option 2: Use existing callback URL
# Update .env to match what's in Google Console
cd /Users/Apple/syncscript/server
# Edit .env: GOOGLE_REDIRECT_URI=<your_existing_redirect_uri>
pkill -f "tsx watch"
npm run dev &
```

---

## 📊 WHAT'S READY

**Infrastructure:** ✅ 100% Complete
- Outlook OAuth service
- Apple OAuth service
- Unified auth routes
- Frontend integration
- Multi-provider support

**Needs:** Environment variables per provider

**Files Created:**
1. `/server/src/services/outlookCalendarService.ts`
2. `/server/src/services/appleCalendarServiceEnhanced.ts`
3. `/server/src/routes/calendarAuth.ts`
4. Updated: `GoogleCalendarPage.tsx` with multi-provider auth

---

**The infrastructure is ready! Just need OAuth credentials for each provider you want to enable.** 🚀

**For Launch Friday: Focus on fixing Google redirect URI first, then add others later!**

