#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting SyncScript server..."

# Generate Prisma client if needed (should already be done in Docker build)
echo "📦 Ensuring Prisma client is ready..."
npx prisma generate

# Initialize database schema first
echo "🗄️ Setting up database schema..."
npx prisma db push --accept-data-loss --skip-generate

echo "✅ Database schema ready"

# Start the server
echo "🌟 Starting server..."
exec node dist/index.js
