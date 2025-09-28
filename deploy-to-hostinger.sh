#!/bin/bash

# SyncScript Hostinger Deployment Script
echo "🚀 Preparing SyncScript for Hostinger deployment..."

# Build the frontend
echo "📦 Building frontend..."
cd client
npm run build
cd ..

# Create production package
echo "📁 Creating deployment package..."
tar -czf syncscript-hostinger.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=client/dist \
  --exclude=*.log \
  --exclude=.env \
  --exclude=.DS_Store \
  client \
  server \
  package.json \
  package-lock.json \
  README.md \
  HOSTINGER_SETUP.md

echo "✅ Deployment package created: syncscript-hostinger.tar.gz"
echo ""
echo "📋 Next steps:"
echo "1. Upload syncscript-hostinger.tar.gz to Hostinger"
echo "2. Extract in /public_html/syncscript/"
echo "3. Follow HOSTINGER_SETUP.md instructions"
echo "4. Add SyncScript link to your portfolio header"
echo ""
echo "🔗 Portfolio link to add:"
echo '<a href="https://www.thechristopherstringer.com/syncscript" class="syncscript-link">SyncScript</a>'
