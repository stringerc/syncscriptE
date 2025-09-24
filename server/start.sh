#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting SyncScript server..."

# Generate Prisma client if needed (should already be done in Docker build)
echo "📦 Ensuring Prisma client is ready..."
npx prisma generate

# Start the server immediately (health check will pass)
echo "🌟 Starting server..."
node dist/index.js &

# Store the server PID
SERVER_PID=$!

# Initialize database in background
echo "🗄️ Setting up database schema in background..."
npx prisma db push --accept-data-loss --skip-generate &
DB_PID=$!

# Wait for server to be ready
sleep 5

# Check if server is still running
if ! kill -0 $SERVER_PID 2>/dev/null; then
  echo "❌ Server failed to start"
  exit 1
fi

echo "✅ Server started successfully (PID: $SERVER_PID)"
echo "🔄 Database initialization running in background (PID: $DB_PID)"

# Wait for both processes
wait $SERVER_PID $DB_PID
