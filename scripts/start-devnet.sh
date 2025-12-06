#!/bin/bash

# Start application with Devnet configuration
# This script starts backend and frontend services connected to Solana Devnet

set -e

echo "Starting application with Devnet configuration..."
echo ""

# Check if environment files exist
if [ ! -f "backend/.env" ]; then
    echo "ERROR: backend/.env not found"
    echo "Copy backend/env.template to backend/.env and configure it"
    exit 1
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "ERROR: frontend/.env.local not found"
    echo "Copy frontend/env.template to frontend/.env.local and configure it"
    exit 1
fi

# Verify dependencies are installed
echo "Checking dependencies..."
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && pnpm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && pnpm install && cd ..
fi

echo ""
echo "Starting services..."
echo ""
echo "Backend will run on: http://localhost:4000"
echo "Frontend will run on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start backend in background
echo "Starting backend service..."
cd backend
pnpm dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend application..."
cd frontend
pnpm dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "Services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Logs:"
echo "  Backend: tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "Open http://localhost:3000 in your browser"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "Services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for processes
wait

