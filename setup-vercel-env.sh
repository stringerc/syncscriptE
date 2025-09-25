#!/bin/bash

echo "Setting up Vercel environment variables..."

# Set up basic environment variables for Vercel
npx vercel env add DATABASE_URL production <<< "file:./dev.db"
npx vercel env add JWT_SECRET production <<< "your-super-secret-jwt-key-change-this-in-production"
npx vercel env add NODE_ENV production <<< "production"
npx vercel env add FRONTEND_URL production <<< "https://stringerc.github.io/syncscriptE"

echo "Environment variables set up. You can add more as needed:"
echo "- OPENAI_API_KEY (for AI features)"
echo "- EMAIL_USER (for email verification)"
echo "- EMAIL_APP_PASSWORD (for email verification)"

echo "Redeploying with new environment variables..."
npx vercel --prod
