#!/bin/bash

echo "🚀 Starting all services for Library Management System..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check and start MySQL
echo "📊 Checking MySQL..."
if command_exists mysql; then
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl start mysql
        echo "✅ MySQL started (Linux)"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start mysql
        echo "✅ MySQL started (Mac)"
    fi
else
    echo "❌ MySQL not found. Please install MySQL first."
fi

# Check and start MongoDB
echo "🍃 Checking MongoDB..."
if command_exists mongod; then
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl start mongod
        echo "✅ MongoDB started (Linux)"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start mongodb/brew/mongodb-community
        echo "✅ MongoDB started (Mac)"
    fi
else
    echo "❌ MongoDB not found. Please install MongoDB first."
fi

echo "🔍 Checking service status..."
node check-services.js
