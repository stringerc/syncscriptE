#!/bin/bash

echo "🚀 Starting Enhanced Budgeting System Migration..."
echo ""

cd /Users/Apple/syncscript/server

echo "📊 Step 1: Generating Prisma Client..."
npx prisma generate

echo ""
echo "📊 Step 2: Creating Migration..."
npx prisma migrate dev --name add_enhanced_budgeting_system

echo ""
echo "✅ Migration complete!"
echo "🎉 Enhanced budgeting database is ready!"

