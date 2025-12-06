#!/bin/bash

set -e

echo "Testing Docker builds for backend and frontend..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Backend Docker Build
echo -e "${YELLOW}Testing backend Docker build...${NC}"
cd backend
if docker build -t solana-backend-test:latest . > /tmp/backend-build.log 2>&1; then
    echo -e "${GREEN}✓ Backend Docker build successful!${NC}"
    BACKEND_SUCCESS=true
else
    echo -e "${RED}✗ Backend Docker build failed. Check /tmp/backend-build.log${NC}"
    cat /tmp/backend-build.log | tail -30
    BACKEND_SUCCESS=false
fi
cd ..

echo ""

# Test Frontend Docker Build
echo -e "${YELLOW}Testing frontend Docker build...${NC}"
# Build from root context with Dockerfile path
if docker build -f frontend/Dockerfile -t solana-frontend-test:latest . > /tmp/frontend-build.log 2>&1; then
    echo -e "${GREEN}✓ Frontend Docker build successful!${NC}"
    FRONTEND_SUCCESS=true
else
    echo -e "${RED}✗ Frontend Docker build failed. Check /tmp/frontend-build.log${NC}"
    cat /tmp/frontend-build.log | tail -30
    FRONTEND_SUCCESS=false
fi

echo ""
echo "=========================================="
if [ "$BACKEND_SUCCESS" = true ] && [ "$FRONTEND_SUCCESS" = true ]; then
    echo -e "${GREEN}All Docker builds passed!${NC}"
    echo ""
    echo "You can now test running the containers:"
    echo "  Backend:  docker run -p 4000:4000 -e SOLANA_RPC_URL=https://api.devnet.solana.com -e API_KEY=test-key-minimum-16-characters solana-backend-test:latest"
    echo "  Frontend: docker run -p 3000:3000 -e NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com -e NEXT_PUBLIC_BACKEND_URL=http://localhost:4000 solana-frontend-test:latest"
    exit 0
else
    echo -e "${RED}Some Docker builds failed. Please check the logs above.${NC}"
    exit 1
fi

