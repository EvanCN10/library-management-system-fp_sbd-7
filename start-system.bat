@echo off
echo Starting Library Management System (LMS7)
echo ========================================

echo.
echo 1. Starting Backend Server...
cd backend
start cmd /k "npm run dev"

echo.
echo 2. Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo 3. Starting Frontend Server...
cd ..
start cmd /k "npx http-server -p 8000"

echo.
echo 4. Opening browser...
timeout /t 3 /nobreak > nul
start http://localhost:8000/login.html

echo.
echo System started successfully!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:8000
echo.
pause