@echo off
echo 🚀 Starting all services for Library Management System...

echo 📊 Starting MySQL...
net start MySQL80
if %errorlevel% neq 0 (
    echo ❌ Failed to start MySQL. Try running as Administrator.
) else (
    echo ✅ MySQL started successfully
)

echo 🍃 Starting MongoDB...
net start MongoDB
if %errorlevel% neq 0 (
    echo ❌ Failed to start MongoDB. Try running as Administrator.
) else (
    echo ✅ MongoDB started successfully
)

echo 🔍 Checking service status...
node check-services.js

pause
