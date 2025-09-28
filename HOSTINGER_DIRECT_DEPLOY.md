# 🚀 SyncScript Hostinger Direct Deployment Guide

## Overview
Since you already have files in Hostinger, this guide assumes you're deploying directly to your Hostinger account without GitHub.

## Step 1: Upload SyncScript Files

### Upload the Deployment Package
1. **Go to Hostinger File Manager** (in your hPanel)
2. **Navigate to** `/public_html/`
3. **Create a new folder** called `syncscript` (if it doesn't exist)
4. **Upload** `syncscript-hostinger.tar.gz` to `/public_html/syncscript/`
5. **Extract** the tar.gz file directly in that folder

**Result:** You should have:
```
/public_html/syncscript/
├── client/
│   └── dist/          # Frontend files
└── server/            # Backend files
    ├── src/
    ├── package.json
    ├── .env.example
    └── ...
```

## Step 2: Configure Environment Variables

1. **Navigate to** `/public_html/syncscript/server/`
2. **Rename** `.env.example` to `.env`
3. **Edit** `.env` with your actual values:

```env
DATABASE_URL="mysql://your_db_user:your_db_password@your_db_host:your_db_port/your_db_name"
JWT_SECRET="YOUR_VERY_STRONG_JWT_SECRET"
OPENWEATHER_API_KEY="YOUR_OPENWEATHER_API_KEY"
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_REDIRECT_URI="https://www.thechristopherstringer.com/api/auth/google/callback"
FRONTEND_URL="https://www.thechristopherstringer.com"
SERVER_URL="https://www.thechristopherstringer.com/api"
EMAIL_HOST="smtp.your-email-provider.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@example.com"
EMAIL_PASS="your-email-password"
PLAID_CLIENT_ID="YOUR_PLAID_CLIENT_ID"
PLAID_SECRET="YOUR_PLAID_SECRET"
PLAID_ENV="production"
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="1000"
```

## Step 3: Set Up Node.js Application

1. **Go to Node.js section** in your Hostinger hPanel
2. **Create a new Node.js application:**
   - **Node.js Version:** 18.x or 20.x
   - **Application Folder:** `/public_html/syncscript/server`
   - **Application URL:** Your domain (`www.thechristopherstringer.com`)
   - **Application Startup File:** `dist/index.js`
3. **Click "Create"**
4. **Run "NPM Install"** when prompted
5. **Start the application**

## Step 4: Configure Web Server (Nginx/Apache)

You need to ensure your web server routes requests correctly:

### For Frontend (React App):
- Requests to `www.thechristopherstringer.com/syncscript` → serve files from `/public_html/syncscript/client/dist`

### For Backend (API):
- Requests to `www.thechristopherstringer.com/api` → proxy to your Node.js application

**This is usually handled automatically by Hostinger's Node.js setup, but you may need to configure it manually if it doesn't work.**

## Step 5: Run Database Migrations

1. **Connect via SSH** to your Hostinger account
2. **Navigate to backend directory:**
   ```bash
   cd /public_html/syncscript/server
   ```
3. **Run Prisma migrations:**
   ```bash
   npx prisma migrate deploy
   ```

## Step 6: Test Your Deployment

1. **Visit:** `https://www.thechristopherstringer.com/syncscript`
2. **Test API endpoints:** Try logging in, creating tasks, etc.
3. **Check logs** in hPanel if there are issues

## Troubleshooting

### If Frontend Doesn't Load:
- Check that files are in `/public_html/syncscript/client/dist/`
- Verify web server is serving static files from that location

### If API Doesn't Work:
- Check Node.js application is running
- Verify environment variables are set
- Check application logs in hPanel

### If Database Issues:
- Verify `DATABASE_URL` is correct
- Run `npx prisma migrate deploy` again
- Check database connection

## Next Steps

Once SyncScript is working at `www.thechristopherstringer.com/syncscript`, you can add the portfolio button using the files I created earlier.

## Files You Need

- ✅ `syncscript-hostinger.tar.gz` (already created)
- ✅ This guide
- 📝 Portfolio button files (for later)

**Your SyncScript will be live at:** `https://www.thechristopherstringer.com/syncscript`
