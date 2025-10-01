#!/bin/bash

echo "🚀 ACTIVATING ENHANCED BUDGETING SYSTEM..."
echo ""

cd /Users/Apple/syncscript/server

echo "📊 Step 1: Generating Prisma Client..."
npx prisma generate

echo ""
echo "📊 Step 2: Creating Migration..."
npx prisma migrate dev --name add_enhanced_budgeting_system --skip-generate

echo ""
echo "📊 Step 3: Restarting Server..."
pkill -f "tsx watch" 2>/dev/null
sleep 2
npm run dev > server.log 2>&1 &

echo ""
echo "📊 Step 4: Waiting for server to start..."
sleep 3

echo ""
echo "✅ Server Status:"
tail -10 server.log

echo ""
echo "🎉 ENHANCED BUDGETING SYSTEM IS LIVE!"
echo "📱 Open: http://localhost:3000/financial"
echo ""

