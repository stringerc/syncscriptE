#!/bin/bash

# SyncScript Deployment Script
# This script helps you deploy SyncScript to Vercel

echo "🚀 SyncScript Deployment Helper"
echo "================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

echo "📋 Pre-deployment checklist:"
echo "1. ✅ Code pushed to GitHub"
echo "2. ✅ Environment variables ready"
echo "3. ✅ Database configured"
echo ""

read -p "Are you ready to deploy? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting deployment..."
    
    # Deploy to Vercel
    vercel --prod
    
    echo ""
    echo "🎉 Deployment complete!"
    echo "📝 Don't forget to:"
    echo "   - Update environment variables in Vercel dashboard"
    echo "   - Update GOOGLE_REDIRECT_URI with your new domain"
    echo "   - Test all functionality"
    echo ""
    echo "📊 Monitor your deployment at: https://vercel.com/dashboard"
else
    echo "❌ Deployment cancelled"
    echo "💡 Run this script again when you're ready!"
fi
