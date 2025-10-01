# 📅 Google Calendar Setup Guide

**Quick guide to enable Google Calendar integration in SyncScript**

---

## 🎯 Issue

The Calendar Sync page shows Google, Outlook, and Apple calendar cards, but:
- ✅ Cards display correctly
- ❌ Google Calendar connection requires OAuth setup
- 🔒 Outlook & Apple are "Coming Soon" (not implemented yet)

---

## 🔧 Solution

### **Option 1: For Development/Testing (Recommended)**

**Use the existing Google Calendar integration:**

The page currently has a dual setup:
1. **Top section**: 3 provider cards (Google, Outlook, Apple) - **Visual only for now**
2. **Bottom section**: "Advanced Sync Settings" - **Fully functional** if you have Google connected

**To connect Google Calendar:**
1. Scroll down past the 3 cards
2. You'll see "Advanced Sync Settings" section
3. Click "Connect Google Calendar" there
4. That uses the existing working OAuth flow

### **Option 2: Set Up Google OAuth (Production)**

If you want the top provider cards to work:

**1. Get Google Cloud Credentials:**
```bash
# Go to: https://console.cloud.google.com/
# Create a new project or select existing
# Enable Google Calendar API
# Create OAuth 2.0 credentials
# Download client_secret.json
```

**2. Add to Environment Variables:**
```bash
# In /server/.env file:
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/google-callback
```

**3. Restart Server:**
```bash
cd /Users/Apple/syncscript/server
pkill -f "tsx watch"
npm run dev &
```

**4. Test:**
- Refresh browser
- Go to Calendar Sync
- Click "Connect Google Calendar" on the provider card
- Should redirect to Google OAuth

---

## 📊 Current Status

### **What's Working:**
✅ Calendar Sync page displays 3 providers  
✅ Shows connection status per provider  
✅ Advanced sync settings for Google (if already connected)  
✅ Backend OAuth flow exists  
✅ `/google-calendar/auth-url` endpoint works  

### **What Needs Setup:**
⚠️ Google OAuth credentials in .env  
⚠️ Outlook integration (not built yet)  
⚠️ Apple calendar integration (not built yet)  

---

## 🎯 Recommended Approach for Now

**For Launch Friday:**

1. **Keep the 3-card display** (looks professional, shows future vision)
2. **Google**: Show "Setup Required" message if not configured
3. **Outlook & Apple**: Keep as "Coming Soon"
4. **Use existing Google integration** in Advanced Settings section (it works!)

**This gives you:**
- ✅ Professional multi-provider UI
- ✅ Working Google Calendar sync (via Advanced Settings)
- ✅ Clear messaging about what's available
- ✅ Room to add Outlook/Apple later

---

## 🚀 Quick Fix for Better UX

I can update the page to:
1. Show a clearer message if Google OAuth isn't set up
2. Make the "Advanced Settings" section more prominent
3. Add a "Setup Guide" link to help configure Google OAuth

Would you like me to make these improvements?

---

## 💡 Alternative: Simplify for Launch

If Google OAuth setup is too complex for now:

**Option A:** Hide the 3-card provider section until OAuth is configured  
**Option B:** Keep cards but make it clear they're "Preview" features  
**Option C:** Focus on the working Advanced Settings section  

**What would you prefer?** 🤔
