# 🚀 DEPLOY NOW - FASTEST METHOD

**Get your restaurant API live in 2 minutes!**

---

## ⚡ SUPER QUICK DEPLOYMENT

### Option A: Use the Deployment Script (EASIEST!)

**macOS/Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```bash
deploy.bat
```

**The script will:**
1. ✅ Check if Supabase CLI is installed
2. ✅ Verify you're logged in
3. ✅ Link your project (if needed)
4. ✅ Confirm secrets are set
5. ✅ Deploy the function
6. ✅ Test the deployment
7. 🎉 Done!

---

## ⚡ MANUAL DEPLOYMENT (2 COMMANDS)

If scripts don't work, use these 2 commands:

```bash
# 1. Login (if not already)
supabase login

# 2. Deploy
supabase functions deploy server
```

That's it! ✅

---

## 🔍 VERIFY IT'S WORKING

### In Your Terminal:
```bash
# Watch the logs
supabase functions logs server --tail

# You should see:
# ✅ Function deployed successfully
# ✅ Listening on port...
```

### In Your SyncScript App:

1. **Open dashboard**
2. **Click + button** on calendar card (top right)
3. **Select "Dining/Restaurant"**
4. **Enter:**
   - Restaurant: "Test"
   - Price: $55
   - Budget: $45
5. **Click "Find Alternatives"**
6. **Expected:** Modal opens with REAL Foursquare restaurants! 🎉

If you see real restaurant names, prices, and reservation links → **IT'S WORKING!** ✅

---

## 🐛 QUICK FIXES

### "supabase: command not found"

**Install Supabase CLI:**

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```bash
scoop install supabase
```

**Any OS (via npm):**
```bash
npm install -g supabase
```

### "Not logged in"

```bash
supabase login
# Opens browser to authenticate
```

### "Project not linked"

```bash
# Get project ref from Supabase Dashboard > Settings > API
supabase link --project-ref YOUR_PROJECT_REF
```

### "Deployment failed"

**Check:**
1. Are secrets set in Supabase Dashboard?
2. Is code syntax valid?
3. Try with debug: `supabase functions deploy server --debug`

---

## ✅ SUCCESS CHECKLIST

After deployment:

- [ ] Terminal shows "✅ Function deployed successfully"
- [ ] No errors in logs
- [ ] Can open SyncScript app
- [ ] Can click + button on calendar
- [ ] Can select "Dining/Restaurant"
- [ ] "Find Alternatives" button appears when over budget
- [ ] Clicking it shows REAL restaurant names
- [ ] Restaurants have prices, ratings, links
- [ ] Can select an alternative
- [ ] Form auto-fills
- [ ] Can create event

**If ALL checked** → **FULLY WORKING!** 🎊

---

## 📞 STILL STUCK?

### Check These:

1. **Secrets set?**
   - Supabase Dashboard → Edge Functions → Secrets
   - FOURSQUARE_CLIENT_ID = UJV3LJWJR4IKQTDKUR4WWKUVABOFHWALD5NL2U2CDGH0KQQZ
   - FOURSQUARE_CLIENT_SECRET = FD1RR0X0WYSBUZQRHKHV3A0PA4MP4423I0LAMQ4SLI504SOF

2. **Function deployed?**
   ```bash
   supabase functions list
   # Should show: server - deployed - active
   ```

3. **Logs clean?**
   ```bash
   supabase functions logs server
   # Should NOT show errors
   ```

### Read Full Guide:

See `/DEPLOY_RESTAURANT_API.md` for comprehensive troubleshooting.

---

## 🎉 THAT'S IT!

**Two commands, 2 minutes, done!**

```bash
supabase login
supabase functions deploy server
```

Now go create a restaurant event with budget alternatives! 🍽️💰

---

*Quick Deploy Guide v1.0*
*Last Updated: February 8, 2026*
