# 🚀 Vercel Deployment Guide for SyncScript Backend

This guide will help you deploy the SyncScript backend to Vercel as an alternative to Railway.

## 🎯 Why Vercel?

- ✅ **More Reliable**: Better Node.js support and build detection
- ✅ **Faster Deployments**: Optimized build process
- ✅ **Better Logs**: Clearer error messages and debugging
- ✅ **Automatic HTTPS**: Built-in SSL certificates
- ✅ **Edge Functions**: Global CDN distribution
- ✅ **Easy Environment Variables**: Simple configuration

## 🚀 Quick Deploy Steps

### Step 1: Go to Vercel
1. **Visit**: [vercel.com](https://vercel.com)
2. **Sign up/Login** with your GitHub account
3. **Click**: "New Project"

### Step 2: Import Your Repository
1. **Select**: `stringerc/syncscriptE`
2. **Configure**:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./server` (IMPORTANT!)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install && npx prisma generate`

### Step 3: Configure Environment Variables
Go to **Settings** → **Environment Variables** and add:

```bash
# Database (Use Railway PostgreSQL or Vercel Postgres)
DATABASE_URL=postgresql://postgres:password@hostname:port/database

# Authentication
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long

# OpenAI API
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Email Service (Gmail SMTP)
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password

# Google Calendar API
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-vercel-domain.vercel.app/google-calendar

# Weather API
OPENWEATHER_API_KEY=65b1431375043f5b84bffa4976e5781b

# Plaid API
PLAID_CLIENT_ID=68af6e15d275380025927fe9
PLAID_SECRET=4dfa431d33...
PLAID_ENVIRONMENT=sandbox

# Server Configuration
NODE_ENV=production
PORT=3001
```

### Step 4: Deploy
1. **Click**: "Deploy"
2. **Wait**: ~2-3 minutes for build to complete
3. **Copy**: Your Vercel domain (e.g., `syncscript-backend.vercel.app`)

### Step 5: Update Frontend
The frontend is already configured to use Vercel! It will automatically detect:
- **GitHub Pages**: Uses `https://syncscript-backend.vercel.app/api`
- **Local Development**: Uses `http://localhost:3001/api`

## 🔧 Vercel Configuration Files

I've created these files for you:

- **`vercel.json`**: Main Vercel configuration
- **`server/vercel.json`**: Server-specific configuration
- **`.vercelignore`**: Files to exclude from deployment

## 📊 What Vercel Will Do

✅ **Automatic Detection**: Detects Node.js project in `/server` directory
✅ **Dependency Installation**: Runs `npm install` and `npx prisma generate`
✅ **Build Process**: Runs `npm run build` (TypeScript compilation)
✅ **Start Command**: Runs `npm start` (serves `dist/index.js`)
✅ **Health Checks**: Monitors `/api/health` endpoint
✅ **Auto-Deploy**: Deploys on every GitHub push
✅ **Custom Domain**: Provides `.vercel.app` domain
✅ **SSL Certificate**: Automatic HTTPS

## 🌍 After Deployment

### Backend (Vercel)
- **URL**: `https://your-project.vercel.app`
- **API**: `https://your-project.vercel.app/api`
- **Health**: `https://your-project.vercel.app/api/health`

### Frontend (GitHub Pages)
- **URL**: `https://stringerc.github.io/syncscriptE`
- **API Connection**: Points to Vercel backend automatically

## 🔄 Automatic Deployments

Once set up:
- ✅ **Push to GitHub** → Automatic deployment
- ✅ **Environment variables** → Secure and encrypted
- ✅ **Custom domains** → Your own domain (optional)
- ✅ **Monitoring** → Built-in logs and metrics

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Vercel logs in dashboard
   - Verify `server/package.json` has correct scripts
   - Ensure TypeScript compiles without errors

2. **Environment Variables**:
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify database connection string

3. **Database Issues**:
   - Use Railway PostgreSQL or Vercel Postgres
   - Update `DATABASE_URL` to correct database URL
   - Run `npx prisma db push` if needed

4. **API Connection**:
   - Frontend automatically detects Vercel backend
   - Check CORS settings if needed
   - Verify domain is correct

## 📞 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Discord**: [vercel.com/chat](https://vercel.com/chat)
- **Project Logs**: Available in Vercel dashboard

---

## 🚀 Quick Start Checklist

- [ ] Sign up for Vercel with GitHub
- [ ] Import `stringerc/syncscriptE` repository
- [ ] Set Root Directory to `./server`
- [ ] Add all environment variables
- [ ] Deploy and wait for completion
- [ ] Copy Vercel domain
- [ ] Test GitHub Pages frontend
- [ ] Update Google OAuth redirect URI
- [ ] Test your live application!

**Your SyncScript will be live at: `https://your-project.vercel.app`** 🎉

## 🔄 Migration from Railway

If you're migrating from Railway:

1. **Keep Railway Database**: Use the same PostgreSQL URL
2. **Update Environment Variables**: Copy from Railway to Vercel
3. **Test Deployment**: Verify all endpoints work
4. **Update Frontend**: Already configured for Vercel!
5. **Update OAuth**: Change redirect URI to Vercel domain

**The frontend will automatically switch to Vercel when deployed!** ✨
