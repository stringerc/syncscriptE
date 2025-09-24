# 🚂 Railway Deployment Guide for SyncScript

This guide will help you deploy SyncScript to Railway in just a few clicks!

## 🎯 Quick Deploy Steps

### Step 1: Go to Railway
1. **Visit**: [railway.app](https://railway.app)
2. **Sign up/Login** with your GitHub account
3. **Click**: "New Project"

### Step 2: Import Your Repository
1. **Select**: "Deploy from GitHub repo"
2. **Choose**: `stringerc/syncscriptE`
3. **Click**: "Deploy Now"

### Step 3: Configure Environment Variables
Railway will automatically detect your project structure. Now add these environment variables:

1. **Go to**: Project Settings → Variables
2. **Add these variables**:

```bash
# Database
DATABASE_URL=file:./dev.db

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
GOOGLE_REDIRECT_URI=https://your-railway-domain.railway.app/google-calendar

# Server Configuration
NODE_ENV=production
PORT=3001
```

### Step 4: Get Your Domain
1. **Go to**: Settings → Domains
2. **Copy**: Your Railway domain (e.g., `syncscript-production.railway.app`)
3. **Update**: `GOOGLE_REDIRECT_URI` with your actual domain

### Step 5: Deploy Frontend Separately
Since Railway is deploying the backend, you'll need to deploy the frontend separately:

**Option A: Vercel (Recommended for Frontend)**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `stringerc/syncscriptE`
3. Configure:
   - Framework: `Other`
   - Build Command: `npm run build`
   - Output Directory: `client/dist`
   - Root Directory: `./`
4. Add Environment Variable:
   ```
   VITE_API_URL=https://your-railway-domain.railway.app/api
   ```

**Option B: Railway (Full Stack)**
1. Create a second Railway project
2. Configure for frontend deployment
3. Set `VITE_API_URL` to your backend URL

## 🔧 Railway Configuration Files

I've created these files for you:

- **`railway.json`**: Railway deployment configuration
- **`nixpacks.toml`**: Build configuration
- **Health check endpoints**: `/health` and `/api/health`

## 📊 What Railway Will Do

✅ **Automatic Detection**: Detects Node.js project
✅ **Dependency Installation**: Runs `npm install`
✅ **Build Process**: Runs `npm run build`
✅ **Start Command**: Runs `npm run start`
✅ **Health Checks**: Monitors `/api/health` endpoint
✅ **Auto-Deploy**: Deploys on every GitHub push
✅ **Custom Domain**: Provides `.railway.app` domain
✅ **SSL Certificate**: Automatic HTTPS

## 🌍 After Deployment

### Backend (Railway)
- **URL**: `https://your-project.railway.app`
- **API**: `https://your-project.railway.app/api`
- **Health**: `https://your-project.railway.app/api/health`

### Frontend (Vercel)
- **URL**: `https://your-project.vercel.app`
- **API Connection**: Points to Railway backend

## 🔄 Automatic Deployments

Once set up:
- ✅ **Push to GitHub** → Automatic deployment
- ✅ **Environment variables** → Secure and encrypted
- ✅ **Custom domains** → Your own domain (optional)
- ✅ **Monitoring** → Built-in logs and metrics

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Railway logs
   - Verify all dependencies in `package.json`

2. **Environment Variables**:
   - Ensure all required variables are set
   - Check for typos in variable names

3. **Database Issues**:
   - Railway provides PostgreSQL by default
   - Update `DATABASE_URL` to Railway's PostgreSQL URL

4. **API Connection**:
   - Verify `VITE_API_URL` points to Railway backend
   - Check CORS settings if needed

## 📞 Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Project Logs**: Available in Railway dashboard

---

**🎉 That's it!** Your SyncScript app will be live on Railway in minutes!

## 🚀 Quick Start Checklist

- [ ] Sign up for Railway with GitHub
- [ ] Import `stringerc/syncscriptE` repository
- [ ] Add all environment variables
- [ ] Wait for deployment to complete
- [ ] Copy Railway domain
- [ ] Deploy frontend to Vercel with Railway API URL
- [ ] Update Google OAuth redirect URI
- [ ] Test your live application!

**Your SyncScript will be live at: `https://your-project.railway.app`** 🎉
