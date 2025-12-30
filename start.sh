#!/bin/bash
# Development startup script for TechNexus

echo "🚀 Starting TechNexus Development Environment"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Start backend
echo "📦 Starting backend server..."
cd backend
npm install --silent
npm run dev &
BACKEND_PID=$!
echo "✅ Backend running (PID: $BACKEND_PID) on http://localhost:5000"
echo ""

# Start frontend
echo "🎨 Starting frontend development server..."
cd ../frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend running on http://localhost:3000"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 TechNexus is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Trap Ctrl+C to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

# Wait for both processes
wait
