#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting SyncScript server..."

# Generate Prisma client if needed
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema (this will create tables if they don't exist)
echo "🗄️ Setting up database schema..."
npx prisma db push --accept-data-loss

# Start the server
echo "🌟 Starting server..."
node dist/index.js
