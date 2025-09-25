#!/bin/bash

echo "🚀 Preparing SyncScript for Render.com deployment..."

# Build the backend
echo "📦 Building backend..."
cd server
npm install
npm run build
npx prisma generate
cd ..

# Build the frontend
echo "📦 Building frontend..."
cd client
npm install
npm run build
cd ..

echo "✅ Build complete! Ready for Render deployment."
echo ""
echo "📋 Next steps:"
echo "1. Push this code to GitHub"
echo "2. Connect your GitHub repo to Render.com"
echo "3. Use the render.yaml file for automatic deployment"
echo ""
echo "🔗 Your app will be available at:"
echo "   Backend: https://syncscript-backend.onrender.com"
echo "   Frontend: https://syncscript-frontend.onrender.com"
