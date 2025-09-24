# 🚀 SyncScript Deployment Guide

This guide will help you deploy SyncScript to production using Vercel.

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be pushed to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Environment Variables**: Prepare your production environment variables

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

**Pros:**
- ✅ Automatic deployments from GitHub
- ✅ Free tier with generous limits
- ✅ Built-in SSL certificates
- ✅ Global CDN
- ✅ Easy environment variable management

**Steps:**
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository: `stringerc/syncscriptE`
4. Configure build settings (auto-detected)
5. Add environment variables
6. Deploy!

### Option 2: Railway

**Pros:**
- ✅ Built-in database support
- ✅ Easy environment setup
- ✅ Automatic deployments

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Connect GitHub account
3. Create new project from repository
4. Add environment variables
5. Deploy!

### Option 3: Render

**Pros:**
- ✅ Free tier available
- ✅ Separate services for frontend/backend
- ✅ Built-in SSL

**Steps:**
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Configure build and start commands
5. Add environment variables
6. Deploy!

## 🔧 Environment Variables

You'll need to set these environment variables in your deployment platform:

### Required Variables:
```bash
# Database
DATABASE_URL=your_production_database_url

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Email Service
EMAIL_USER=your_gmail_address
EMAIL_APP_PASSWORD=your_gmail_app_password

# Google Calendar API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/google-calendar
```

### Optional Variables:
```bash
# API Configuration
NODE_ENV=production
PORT=3001
```

## 📁 Project Structure for Deployment

```
syncscript/
├── client/          # React frontend
├── server/           # Node.js backend
├── vercel.json       # Vercel configuration
├── package.json      # Root package.json
└── DEPLOYMENT.md     # This file
```

## 🚀 Quick Deploy with Vercel

1. **Visit Vercel**: Go to [vercel.com/new](https://vercel.com/new)
2. **Import Project**: Click "Import Git Repository"
3. **Select Repository**: Choose `stringerc/syncscriptE`
4. **Configure Project**:
   - Framework Preset: `Other`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `client/dist`
5. **Add Environment Variables**: Copy from your `.env` file
6. **Deploy**: Click "Deploy"

## 🔄 Automatic Deployments

Once deployed, Vercel will automatically:
- ✅ Deploy on every push to `main` branch
- ✅ Create preview deployments for pull requests
- ✅ Provide you with a custom domain
- ✅ Handle SSL certificates automatically

## 🌍 Custom Domain (Optional)

1. **Buy Domain**: Purchase from any domain registrar
2. **Add to Vercel**: Go to Project Settings → Domains
3. **Configure DNS**: Point your domain to Vercel
4. **Update Environment**: Update `GOOGLE_REDIRECT_URI` with your domain

## 📊 Monitoring & Analytics

Vercel provides built-in:
- 📈 Performance analytics
- 🔍 Function logs
- 📊 Usage statistics
- 🚨 Error monitoring

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check environment variables
   - Verify build commands
   - Review function logs

2. **Database Connection**:
   - Ensure `DATABASE_URL` is correct
   - Check database permissions
   - Verify network access

3. **API Errors**:
   - Check all environment variables
   - Verify API keys are valid
   - Review server logs

## 📞 Support

If you encounter issues:
1. Check Vercel's documentation
2. Review function logs in Vercel dashboard
3. Check GitHub issues
4. Contact support

---

**🎉 Congratulations!** Your SyncScript app will be live on the web!
