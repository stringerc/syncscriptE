#!/bin/bash

# ══════════════════════════════════════════════════════════════════════════════
# SUPABASE EDGE FUNCTION DEPLOYMENT SCRIPT
# Deploys the restaurant API with Foursquare integration
# ══════════════════════════════════════════════════════════════════════════════

echo "🚀 SyncScript Restaurant API Deployment"
echo "════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
echo "1️⃣  Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo ""
    echo "Install it with:"
    echo "  macOS/Linux: brew install supabase/tap/supabase"
    echo "  Windows: scoop install supabase"
    echo "  npm: npm install -g supabase"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Supabase CLI found: $(supabase --version)${NC}"
echo ""

# Check if logged in
echo "2️⃣  Checking Supabase login..."
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Supabase${NC}"
    echo ""
    echo "Please login first:"
    echo "  supabase login"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Logged in to Supabase${NC}"
echo ""

# Check if project is linked
echo "3️⃣  Checking project link..."
if [ ! -f .supabase/config.toml ]; then
    echo -e "${YELLOW}⚠️  Project not linked${NC}"
    echo ""
    read -p "Enter your Supabase project ref (from Dashboard > Settings > API): " PROJECT_REF
    echo ""
    echo "Linking project..."
    supabase link --project-ref "$PROJECT_REF"
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to link project${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Project linked${NC}"
else
    echo -e "${GREEN}✅ Project already linked${NC}"
fi
echo ""

# Verify secrets
echo "4️⃣  Checking Foursquare API secrets..."
echo -e "${YELLOW}⚠️  Make sure you've added these secrets in Supabase Dashboard:${NC}"
echo "   - FOURSQUARE_CLIENT_ID"
echo "   - FOURSQUARE_CLIENT_SECRET"
echo ""
read -p "Have you added the Foursquare secrets? (y/n): " SECRETS_CONFIRMED
if [ "$SECRETS_CONFIRMED" != "y" ]; then
    echo ""
    echo -e "${YELLOW}Please add secrets first:${NC}"
    echo "1. Go to Supabase Dashboard"
    echo "2. Navigate to Edge Functions > Secrets"
    echo "3. Add:"
    echo "   FOURSQUARE_CLIENT_ID = UJV3LJWJR4IKQTDKUR4WWKUVABOFHWALD5NL2U2CDGH0KQQZ"
    echo "   FOURSQUARE_CLIENT_SECRET = FD1RR0X0WYSBUZQRHKHV3A0PA4MP4423I0LAMQ4SLI504SOF"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Secrets confirmed${NC}"
echo ""

# Deploy function
echo "5️⃣  Deploying edge function..."
echo "This may take 30-60 seconds..."
echo ""
supabase functions deploy server

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check the error message above"
    echo "2. Verify your code syntax"
    echo "3. Ensure all files exist in /supabase/functions/server/"
    echo "4. Try: supabase functions deploy server --debug"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""

# Test the deployment
echo "6️⃣  Testing restaurant API..."
echo ""
read -p "Would you like to test the API now? (y/n): " TEST_API
if [ "$TEST_API" = "y" ]; then
    echo ""
    echo "Opening function logs in a new terminal..."
    echo "Watch for: '✅ Found X restaurants from Foursquare'"
    echo ""
    
    # Open logs in background
    supabase functions logs server --tail &
    LOG_PID=$!
    
    echo ""
    echo "Logs are streaming above."
    echo "Press Ctrl+C to stop when done testing."
    echo ""
    
    # Wait for user
    wait $LOG_PID
fi

echo ""
echo "════════════════════════════════════════"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Open your SyncScript app"
echo "2. Click + button on calendar card"
echo "3. Select 'Dining/Restaurant'"
echo "4. Enter price > budget"
echo "5. Click 'Find Alternatives'"
echo "6. See REAL Foursquare results! 🎊"
echo ""
echo "Monitoring:"
echo "  View logs: supabase functions logs server --tail"
echo "  List functions: supabase functions list"
echo ""
echo "Documentation:"
echo "  Full guide: /DEPLOY_RESTAURANT_API.md"
echo "  User guide: /QUICK_EVENT_CREATION_GUIDE.md"
echo ""
