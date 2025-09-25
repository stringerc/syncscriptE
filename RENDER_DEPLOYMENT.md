# 🚀 SyncScript Deployment on Render.com

This guide will help you deploy SyncScript to Render.com in just a few steps.

## 📋 Prerequisites

1. **GitHub Account** - Your code needs to be on GitHub
2. **Render.com Account** - Sign up at [render.com](https://render.com)
3. **Domain** (optional) - You can use Render's free subdomain

## 🎯 Step-by-Step Deployment

### Step 1: Push to GitHub

```bash
# Make sure all your changes are committed
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository

### Step 3: Deploy Backend (Web Service)

1. **Click "New +"** → **"Web Service"**
2. **Connect your repository**: Select your SyncScript repo
3. **Configure the service**:
   - **Name**: `syncscript-backend`
   - **Root Directory**: Leave empty (it will use the root)
   - **Build Command**: `cd server && npm install && npm run build && npx prisma generate`
   - **Start Command**: `cd server && npx prisma db push && npm start`
   - **Node Version**: `18` (or latest)

4. **Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=your-super-secret-jwt-key
   FRONTEND_URL=https://syncscript-frontend.onrender.com
   OPENAI_API_KEY=your-openai-key
   EMAIL_USER=your-email
   EMAIL_APP_PASSWORD=your-app-password
   PLAID_CLIENT_ID=your-plaid-client-id
   PLAID_SECRET=your-plaid-secret
   PLAID_ENVIRONMENT=sandbox
   ```

5. **Click "Create Web Service"**

### Step 4: Create Database

1. **Click "New +"** → **"PostgreSQL"**
2. **Configure**:
   - **Name**: `syncscript-db`
   - **Database**: `syncscript`
   - **User**: `syncscript`
   - **Region**: Choose closest to you

3. **Click "Create Database"**
4. **Copy the connection string** and update your backend environment variables

### Step 5: Deploy Frontend (Static Site)

1. **Click "New +"** → **"Static Site"**
2. **Configure**:
   - **Name**: `syncscript-frontend`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`

3. **Environment Variables**:
   ```
   VITE_API_URL=https://syncscript-backend.onrender.com/api
   ```

4. **Click "Create Static Site"**

### Step 6: Update Backend Environment

1. Go to your backend service
2. **Settings** → **Environment**
3. **Update FRONTEND_URL** to match your frontend URL
4. **Update DATABASE_URL** with the PostgreSQL connection string

## 🔧 Environment Variables Reference

### Backend (Web Service)
```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://syncscript-frontend.onrender.com
OPENAI_API_KEY=sk-your-openai-api-key
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret-key
PLAID_ENVIRONMENT=sandbox
```

### Frontend (Static Site)
```env
VITE_API_URL=https://syncscript-backend.onrender.com/api
```

## 🌐 Your URLs

After deployment, your app will be available at:
- **Frontend**: `https://syncscript-frontend.onrender.com`
- **Backend**: `https://syncscript-backend.onrender.com`
- **Database**: Managed by Render (internal connection)

## 🔍 Troubleshooting

### Backend Issues
- **Build fails**: Check Node version (use 18)
- **Database connection fails**: Verify DATABASE_URL format
- **Port issues**: Render automatically sets PORT environment variable

### Frontend Issues
- **API calls fail**: Check VITE_API_URL environment variable
- **Build fails**: Ensure all dependencies are in package.json

### Common Commands
```bash
# Check backend logs
# Go to your backend service → Logs

# Check frontend logs  
# Go to your frontend service → Logs

# Restart services
# Go to service → Settings → Restart
```

## 🚀 Automatic Deployments

Render will automatically deploy when you push to your main branch. No manual deployment needed!

## 💰 Pricing

- **Free Tier**: 
  - 750 hours/month (enough for personal use)
  - Sleeps after 15 minutes of inactivity
  - PostgreSQL database included
- **Paid Plans**: Start at $7/month for always-on service

## 🎉 You're Done!

Your SyncScript app is now live on Render.com! 

**Test your deployment:**
1. Visit your frontend URL
2. Try to register a new account
3. Test the login functionality
4. Check if all features work

## 🔄 Updates

To update your app:
1. Make changes locally
2. Commit and push to GitHub
3. Render automatically redeploys
4. Your app is updated in minutes!

---

**Need help?** Check Render's documentation or contact support.
