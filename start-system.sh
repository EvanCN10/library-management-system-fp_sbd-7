#!/bin/bash

echo "Starting Library Management System (LMS7)"
echo "========================================"

echo ""
echo "1. Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!

echo ""
echo "2. Waiting for backend to start..."
sleep 5

echo ""
echo "3. Starting Frontend Server..."
cd ..
npx http-server -p 8000 &
FRONTEND_PID=$!

echo ""
echo "4. Waiting for frontend to start..."
sleep 3

echo ""
echo "5. Opening browser..."
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:8000/login.html
elif command -v open > /dev/null; then
    open http://localhost:8000/login.html
fi

echo ""
echo "System started successfully!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait