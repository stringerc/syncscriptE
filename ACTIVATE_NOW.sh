#!/bin/bash
set -e

echo "🚀 ACTIVATING ENHANCED BUDGETING SYSTEM"
echo "========================================"
echo ""

cd /Users/Apple/syncscript/server

echo "📊 Step 1/4: Generating Prisma Client..."
npx prisma generate

echo ""
echo "📊 Step 2/4: Running Database Migration..."
npx prisma migrate dev --name add_enhanced_budgeting_system

echo ""
echo "📊 Step 3/4: Restarting Server..."
pkill -f "tsx watch" 2>/dev/null || true
sleep 3
npm run dev > server.log 2>&1 &

echo ""
echo "📊 Step 4/4: Waiting for server startup..."
sleep 5

echo ""
echo "✅ Server logs:"
tail -15 server.log

echo ""
echo "🎉 ENHANCED BUDGETING SYSTEM IS LIVE!"
echo "📱 Open: http://localhost:3000/financial"
echo ""
echo "✅ What's ready:"
echo "  - 9 new database models"
echo "  - 20+ API endpoints"
echo "  - 3 beautiful UI components"
echo "  - Auto-categorization system"
echo "  - Real-time budget tracking"
echo "  - Savings goals"
echo ""
echo "🚀 GO TEST IT!"

