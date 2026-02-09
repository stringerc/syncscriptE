# 🚀 DEPLOY RESTAURANT API - STEP-BY-STEP GUIDE

**Deploy the Foursquare restaurant API to your Supabase edge functions**

---

## ✅ PRE-DEPLOYMENT CHECKLIST

Before deploying, verify:

- [x] Foursquare credentials added to Supabase secrets:
  - `FOURSQUARE_CLIENT_ID`
  - `FOURSQUARE_CLIENT_SECRET`
- [ ] Supabase CLI installed on your machine
- [ ] Logged into Supabase CLI
- [ ] Project linked to Supabase

---

## 📋 OPTION 1: DEPLOY VIA SUPABASE CLI (RECOMMENDED)

### Step 1: Verify Supabase CLI is Installed

```bash
# Check if Supabase CLI is installed
supabase --version

# If not installed, install it:
# macOS/Linux
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via npm
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
# Login to your Supabase account
supabase login

# Follow the browser prompt to authenticate
```

### Step 3: Link Your Project (if not already linked)

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Find your project ref in Supabase Dashboard > Settings > API
```

### Step 4: Deploy the Edge Function

```bash
# Deploy the server function
supabase functions deploy server

# This will upload and deploy /supabase/functions/server/
# Including the new restaurant-api.tsx file
```

### Step 5: Verify Deployment

```bash
# Check function logs
supabase functions logs server --tail

# You should see:
# ✅ Function deployed successfully
# ✅ Listening on port...
```

### Step 6: Test the API

```bash
# Test the restaurant search endpoint
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-57781ad9/restaurants/search \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7580,
    "longitude": -73.9855,
    "cuisine": "Italian",
    "maxBudget": 45,
    "radius": 5000,
    "limit": 10,
    "originalVibe": "romantic upscale dining"
  }'

# Expected response:
# {
#   "alternatives": [
#     {
#       "id": "fsq_...",
#       "name": "Trattoria Dell'Arte",
#       "cuisine": "Italian",
#       "priceRange": "$$$",
#       ...
#     }
#   ]
# }
```

---

## 📋 OPTION 2: DEPLOY VIA SUPABASE DASHBOARD (ALTERNATIVE)

### Step 1: Open Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **Edge Functions** in left sidebar

### Step 2: Verify Secrets

1. Click **Secrets** tab
2. Verify these exist:
   ```
   FOURSQUARE_CLIENT_ID = UJV3LJWJR4IKQTDKUR4WWKUVABOFHWALD5NL2U2CDGH0KQQZ
   FOURSQUARE_CLIENT_SECRET = FD1RR0X0WYSBUZQRHKHV3A0PA4MP4423I0LAMQ4SLI504SOF
   ```

### Step 3: Deploy via VS Code Extension (if using)

1. Install Supabase VS Code extension
2. Right-click on `/supabase/functions/server/`
3. Select "Deploy Function"
4. Confirm deployment

### Step 4: Manual Upload (Last Resort)

If CLI/extensions don't work:

1. In Supabase Dashboard → Edge Functions
2. Click "New Function" or "Update Function"
3. Copy entire contents of:
   - `/supabase/functions/server/index.tsx`
   - `/supabase/functions/server/restaurant-api.tsx`
   - `/supabase/functions/server/kv_store.tsx`
4. Paste into editor
5. Click "Deploy"

**Note:** This is tedious - CLI is much better!

---

## 🔍 TROUBLESHOOTING DEPLOYMENT

### Error: "supabase: command not found"

**Solution:** Install Supabase CLI (see Step 1 above)

### Error: "Not logged in"

**Solution:**
```bash
supabase login
```

### Error: "Project not linked"

**Solution:**
```bash
# Get your project ref from Supabase Dashboard > Settings > API
supabase link --project-ref YOUR_PROJECT_REF
```

### Error: "Function deployment failed"

**Check:**
1. Valid TypeScript syntax
2. No import errors
3. All dependencies available
4. Secrets properly set

**Debug:**
```bash
# View detailed error logs
supabase functions logs server

# Try deploying with verbose output
supabase functions deploy server --debug
```

### Error: "FOURSQUARE credentials not set"

**Solution:**
```bash
# Set secrets via CLI
supabase secrets set FOURSQUARE_CLIENT_ID=UJV3LJWJR4IKQTDKUR4WWKUVABOFHWALD5NL2U2CDGH0KQQZ
supabase secrets set FOURSQUARE_CLIENT_SECRET=FD1RR0X0WYSBUZQRHKHV3A0PA4MP4423I0LAMQ4SLI504SOF

# Or via Dashboard → Edge Functions → Secrets → Add Secret
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 1. Check Function Status

```bash
# List all functions
supabase functions list

# Should show:
# ✅ server - deployed - active
```

### 2. Test Restaurant Search

**From Browser Console:**
```javascript
// Replace with your actual project details
const projectId = 'YOUR_PROJECT_REF';
const anonKey = 'YOUR_ANON_KEY';

fetch(`https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/restaurants/search`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    latitude: 40.7580,
    longitude: -73.9855,
    cuisine: 'Italian',
    maxBudget: 45,
    radius: 5000,
    limit: 10,
    originalVibe: 'romantic upscale dining'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Success:', data))
.catch(err => console.error('❌ Error:', err));
```

### 3. Test from SyncScript App

1. Open SyncScript dashboard
2. Click + button on calendar card
3. Select "Dining/Restaurant"
4. Enter:
   - Restaurant: "Test Restaurant"
   - Price: $55
   - Budget: $45
5. Click "Find Budget-Friendly Alternatives"
6. **Expected:** Modal opens with real Foursquare results!

### 4. Monitor Logs

```bash
# Watch live logs
supabase functions logs server --tail

# Look for:
# ✅ "Found X restaurants from Foursquare"
# ✅ "Returning X restaurant alternatives"
```

---

## 🎯 QUICK DEPLOYMENT COMMANDS

**For experienced users, here's the quick version:**

```bash
# 1. Login (if not already)
supabase login

# 2. Link project (if not already)
supabase link --project-ref YOUR_PROJECT_REF

# 3. Set secrets (if not already via dashboard)
supabase secrets set FOURSQUARE_CLIENT_ID=UJV3LJWJR4IKQTDKUR4WWKUVABOFHWALD5NL2U2CDGH0KQQZ
supabase secrets set FOURSQUARE_CLIENT_SECRET=FD1RR0X0WYSBUZQRHKHV3A0PA4MP4423I0LAMQ4SLI504SOF

# 4. Deploy
supabase functions deploy server

# 5. Test
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-57781ad9/restaurants/search \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"latitude":40.7580,"longitude":-73.9855,"cuisine":"Italian","maxBudget":45}'

# 6. Watch logs
supabase functions logs server --tail
```

---

## 📊 DEPLOYMENT VERIFICATION CHECKLIST

After deployment, verify:

- [ ] Function shows as "deployed" in Supabase dashboard
- [ ] No errors in deployment logs
- [ ] Secrets are set correctly
- [ ] Test API call returns restaurant data
- [ ] SyncScript app can create restaurant events
- [ ] "Find Alternatives" button works
- [ ] Alternatives modal shows real Foursquare data
- [ ] Reservation links are present
- [ ] Budget calculations are correct

---

## 🚨 COMMON ISSUES & FIXES

### Issue: "TypeError: fetch is not defined"

**Cause:** Deno environment issue

**Fix:** Already handled in code - uses built-in Deno fetch

### Issue: "CORS error"

**Cause:** Missing CORS headers

**Fix:** Already handled - server has `cors({ origin: '*' })`

### Issue: "401 Unauthorized from Foursquare"

**Cause:** Invalid API keys

**Fix:**
1. Verify keys in Supabase secrets
2. Check they match Foursquare dashboard
3. Regenerate keys if needed

### Issue: "No results returned"

**Possible causes:**
1. Location has no restaurants (try NYC coords: 40.7580, -73.9855)
2. Cuisine too specific (try "Restaurant" or "Italian")
3. Budget too low (try $50+)

**Debug:**
```bash
# Check logs for Foursquare response
supabase functions logs server --tail

# Look for:
# "Foursquare API error: ..."
# "Found 0 restaurants from Foursquare"
```

---

## 🎉 SUCCESS INDICATORS

**You'll know it's working when you see:**

✅ **In Deployment Logs:**
```
✅ Function deployed successfully
✅ Listening on port 8000
```

✅ **In Runtime Logs:**
```
✅ Found 8 restaurants from Foursquare
✅ Returning 8 restaurant alternatives
```

✅ **In SyncScript App:**
- "Find Alternatives" button works
- Modal shows real restaurant names
- Prices are accurate
- Reservation links present
- Can select alternative
- Event creates successfully

---

## 📞 NEED HELP?

### Resources

1. **Supabase CLI Docs:** https://supabase.com/docs/guides/cli
2. **Edge Functions Docs:** https://supabase.com/docs/guides/functions
3. **Foursquare API Docs:** https://developer.foursquare.com/docs

### Debug Commands

```bash
# Check Supabase status
supabase status

# List functions
supabase functions list

# View function details
supabase functions inspect server

# Delete and redeploy (if needed)
supabase functions delete server
supabase functions deploy server

# Check secrets
supabase secrets list
```

---

## 🔄 REDEPLOYMENT

**If you make changes to the code:**

```bash
# Simple redeploy
supabase functions deploy server

# The function will automatically restart with new code
# No need to delete first
```

**If you change secrets:**

```bash
# Update secret
supabase secrets set FOURSQUARE_CLIENT_ID=NEW_VALUE

# Restart function
supabase functions deploy server
```

---

## ✨ NEXT STEPS AFTER DEPLOYMENT

1. ✅ Test restaurant search in app
2. ✅ Monitor API usage in Foursquare dashboard
3. ✅ Track success metrics (alternatives selected, etc.)
4. ✅ Set up monitoring/alerts for errors
5. ✅ Consider caching popular venues (future)

---

**🎊 Ready to deploy! Follow Option 1 (CLI) for the best experience.**

*Deployment Guide v1.0*
*Last Updated: February 8, 2026*
