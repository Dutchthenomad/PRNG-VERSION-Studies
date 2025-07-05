#!/bin/bash

# 🎮 PRNG Collection Dashboard Startup Script
# Starts the real-time monitoring dashboard

echo "🎮 Starting PRNG Collection Dashboard..."
echo "========================================"

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Get the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Project directory: $PROJECT_DIR"

# Start the dashboard server
echo "🚀 Starting dashboard server..."
echo "🌐 Dashboard will be available at:"
echo "   - http://localhost:3000 (Local)"
echo "   - http://127.0.0.1:3000 (Local)"

# Try to get WSL IP if in WSL
if grep -q microsoft /proc/version; then
    WSL_IP=$(hostname -I | awk '{print $1}')
    echo "   - http://${WSL_IP}:3000 (WSL IP)"
fi

echo ""
echo "🔧 Press Ctrl+C to stop the dashboard"
echo "----------------------------------------"

# Start the server
cd "$PROJECT_DIR"
node dashboard/server.js