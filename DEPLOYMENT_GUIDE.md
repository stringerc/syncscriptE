# 🚀 SyncScript Deployment Guide

## Quick Deployment Strategy

### **Option 1: Vercel + Render (Recommended)**

#### **Frontend Deployment (Vercel)**
1. **Connect GitHub Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `client/`

2. **Environment Variables**
   ```
   VITE_API_URL=https://your-render-backend-url.onrender.com/api
   ```

3. **Build Settings**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### **Backend Deployment (Render)**
1. **Connect GitHub Repository**
   - Go to [render.com](https://render.com)
   - Create new "Web Service"
   - Connect your GitHub repository
   - Set root directory to `server/`

2. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

3. **Build Settings**
   - Build Command: `npm run build`
   - Start Command: `npm start`

#### **Database Setup (Render PostgreSQL)**
1. Create PostgreSQL service on Render
2. Copy connection string to `DATABASE_URL`
3. Run migrations: `npx prisma migrate deploy`

---

### **Option 2: Railway (All-in-One)**

#### **Single Deployment**
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Add PostgreSQL service
4. Deploy both frontend and backend

#### **Environment Variables**
```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-super-secret-jwt-key-here
```

---

### **Option 3: Netlify + Supabase**

#### **Frontend (Netlify)**
1. Connect GitHub repository
2. Build command: `cd client && npm run build`
3. Publish directory: `client/dist`

#### **Backend (Supabase Edge Functions)**
1. Create Supabase project
2. Deploy functions to edge
3. Use Supabase database

---

## 🎯 **Recommended: Vercel + Render**

**Why this combination:**
- ✅ **Proven**: You've used this before successfully
- ✅ **Free**: Generous free tiers
- ✅ **Simple**: Minimal configuration needed
- ✅ **Reliable**: Both platforms are stable
- ✅ **Database**: Render includes PostgreSQL
- ✅ **Environment**: Easy variable management

## 🚀 **Quick Start Commands**

```bash
# 1. Prepare for deployment
git add .
git commit -m "Prepare for deployment"
git push origin main

# 2. Deploy to Vercel (frontend)
# - Go to vercel.com
# - Import repository
# - Set root to client/
# - Add environment variables

# 3. Deploy to Render (backend)
# - Go to render.com
# - Create web service
# - Set root to server/
# - Add PostgreSQL database
# - Add environment variables

# 4. Update frontend API URL
# - Update VITE_API_URL in Vercel
# - Redeploy frontend
```

## 🔧 **Troubleshooting**

### **Common Issues:**
1. **CORS Errors**: Add frontend URL to backend CORS settings
2. **Environment Variables**: Ensure all required vars are set
3. **Database**: Run migrations after deployment
4. **Build Errors**: Check Node.js version compatibility

### **Health Checks:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.onrender.com/api/health`
- Database: Check Render dashboard

## 📊 **Cost Comparison (Free Tiers)**

| Platform | Frontend | Backend | Database | Total |
|----------|----------|---------|----------|-------|
| Vercel + Render | Free | Free | Free | **$0** |
| Railway | Free | Free | Free | **$0** |
| Netlify + Supabase | Free | Free | Free | **$0** |

**Recommendation: Vercel + Render** for reliability and your previous success.
