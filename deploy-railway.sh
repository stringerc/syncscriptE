#!/bin/bash

# Railway Deployment Helper Script
# This script helps you prepare for Railway deployment

echo "🚂 Railway Deployment Helper"
echo "============================"

echo "📋 Pre-deployment checklist:"
echo "1. ✅ Code pushed to GitHub"
echo "2. ✅ Railway configuration files created"
echo "3. ✅ Health check endpoints added"
echo "4. ✅ Environment variables template ready"
echo ""

echo "🎯 Next Steps:"
echo "1. Go to: https://railway.app"
echo "2. Sign up/login with GitHub"
echo "3. Click 'New Project'"
echo "4. Select 'Deploy from GitHub repo'"
echo "5. Choose: stringerc/syncscriptE"
echo "6. Click 'Deploy Now'"
echo ""

echo "🔧 Environment Variables to Add:"
echo "DATABASE_URL=file:./dev.db"
echo "JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long"
echo "OPENAI_API_KEY=sk-proj-your-openai-api-key-here"
echo "EMAIL_USER=your-gmail-address@gmail.com"
echo "EMAIL_APP_PASSWORD=your-gmail-app-password"
echo "GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com"
echo "GOOGLE_CLIENT_SECRET=your-google-client-secret"
echo "GOOGLE_REDIRECT_URI=https://your-railway-domain.railway.app/google-calendar"
echo "NODE_ENV=production"
echo "PORT=3001"
echo ""

echo "📖 For detailed instructions, see: RAILWAY_DEPLOYMENT.md"
echo ""

echo "🎉 Ready to deploy! Follow the steps above."
