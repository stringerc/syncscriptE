# GitHub Pages Deployment Setup

This guide will help you deploy SyncScript frontend to GitHub Pages.

## 🚀 Quick Setup Steps

### Step 1: Enable GitHub Pages
1. Go to your repository: `https://github.com/stringerc/syncscriptE`
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

### Step 2: Add Repository Secrets
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

```
Name: VITE_API_URL
Value: https://your-railway-domain.railway.app
```

Replace `your-railway-domain` with your actual Railway domain.

### Step 3: Deploy
1. Push any change to the `main` branch
2. Go to **Actions** tab to watch the deployment
3. Once complete, your site will be available at:
   `https://stringerc.github.io/syncscriptE/`

## 🔧 Configuration Details

### Environment Variables
- **VITE_API_URL**: Points to your Railway backend
- **Base Path**: Set to `/syncscriptE/` for GitHub Pages

### Automatic Deployment
- Deploys on every push to `main` branch
- Uses GitHub Actions workflow
- Builds React app and deploys to GitHub Pages

## 🌐 URLs

- **Frontend**: `https://stringerc.github.io/syncscriptE/`
- **Backend**: `https://your-railway-domain.railway.app`

## 🔄 Updates

To update your deployment:
1. Make changes to your code
2. Push to `main` branch
3. GitHub Actions will automatically rebuild and deploy

## 🛠️ Troubleshooting

### Build Failures
- Check the **Actions** tab for error logs
- Ensure `VITE_API_URL` secret is set correctly
- Verify all dependencies are in `client/package.json`

### CORS Issues
- Make sure `FRONTEND_URL` is set in Railway to your GitHub Pages URL
- Update Google OAuth redirect URI if needed

### Custom Domain (Optional)
- Add `CUSTOM_DOMAIN` secret with your domain
- Configure DNS to point to GitHub Pages
