#!/bin/bash

# SyncScript GitHub Pages Deployment Script
echo "🚀 Deploying SyncScript to GitHub Pages..."

# Build the frontend
echo "📦 Building frontend..."
cd client
npm run build

# Copy built files to a temporary directory
echo "📁 Preparing files for deployment..."
cd ..
mkdir -p deploy
cp -r client/dist/* deploy/

# Create a simple index.html redirect for the root
echo '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SyncScript - AI-Powered Life Management</title>
    <meta http-equiv="refresh" content="0; url=/syncscriptE/">
</head>
<body>
    <p>Redirecting to <a href="/syncscriptE/">SyncScript</a>...</p>
</body>
</html>' > deploy/index.html

echo "✅ Deployment files ready in ./deploy directory"
echo "📋 Next steps:"
echo "1. Copy the contents of ./deploy to your GitHub Pages repository"
echo "2. Or manually upload the files to your GitHub Pages site"
echo "3. Your site will be available at: https://stringerc.github.io/syncscriptE/"