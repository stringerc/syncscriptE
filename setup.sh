#!/bin/bash

# SyncScript Setup Script
echo "🚀 Setting up SyncScript - AI-Powered Life Management System"
echo "=========================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Create environment files
echo "⚙️  Setting up environment files..."

# Server environment
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    echo "✅ Created server/.env file"
    echo "⚠️  Please update server/.env with your actual API keys and database URL"
else
    echo "✅ server/.env already exists"
fi

# Client environment
if [ ! -f "client/.env" ]; then
    cp client/env.example client/.env
    echo "✅ Created client/.env file"
else
    echo "✅ client/.env already exists"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
cd server
npx prisma generate
cd ..

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. 📝 Update your environment files:"
echo "   - server/.env (add your API keys and database URL)"
echo "   - client/.env (update API URL if needed)"
echo ""
echo "2. 🗄️  Set up your database:"
echo "   - Install PostgreSQL"
echo "   - Create a database"
echo "   - Update DATABASE_URL in server/.env"
echo "   - Run: cd server && npx prisma db push"
echo ""
echo "3. 🚀 Start the development servers:"
echo "   npm run dev"
echo ""
echo "4. 🌐 Open your browser to:"
echo "   http://localhost:3000"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "Happy coding! 🎯"
