#!/bin/bash

# 🚀 PRNG DATA COLLECTION - WSL ENVIRONMENT OPTIMIZATION
# Run this in your WSL terminal to create the optimal environment

echo "🎯 PRNG Data Collection - WSL Environment Setup"
echo "================================================"

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install essential development tools
echo "🔧 Installing development tools..."
sudo apt install -y \
    curl \
    wget \
    git \
    htop \
    jq \
    tree \
    unzip \
    build-essential \
    python3-pip \
    python3-venv

# 3. Install Node.js LTS (if not already installed)
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# 4. Install Python data science packages globally
echo "🐍 Setting up Python environment..."
pip3 install --user \
    pandas \
    numpy \
    matplotlib \
    seaborn \
    scipy \
    scikit-learn \
    jupyter \
    jsonlines

# 5. Create project workspace structure
echo "📁 Creating optimal workspace structure..."

# Navigate to your collector directory
cd /mnt/c/Users/nomad/OneDrive/Desktop/PRNG-VERSION-Studies/JS-TERMINAL-DATA-Collector

# Create additional directories for dashboard and monitoring
mkdir -p {dashboard,monitoring,logs,scripts,docs}

# Create WSL-specific scripts directory
mkdir -p wsl-scripts

# 6. Create WSL optimization configurations
echo "⚙️ Creating WSL optimization configs..."

# Create .wslconfig in Windows user directory (if it doesn't exist)
cat > /mnt/c/Users/nomad/.wslconfig << 'EOF'
[wsl2]
memory=4GB
processors=2
swap=1GB
localhostForwarding=true
EOF

# 7. Create environment variables for the project
echo "🌍 Setting up environment variables..."

cat >> ~/.bashrc << 'EOF'

# PRNG Data Collection Project Environment
export PRNG_PROJECT_ROOT="/mnt/c/Users/nomad/OneDrive/Desktop/PRNG-VERSION-Studies/JS-TERMINAL-DATA-Collector"
export PRNG_DATA_DIR="$PRNG_PROJECT_ROOT/rugs-data"
export PRNG_DASHBOARD_PORT=3000
export PRNG_API_PORT=3001

# Aliases for quick navigation
alias prng='cd $PRNG_PROJECT_ROOT'
alias prng-data='cd $PRNG_DATA_DIR'
alias prng-logs='cd $PRNG_PROJECT_ROOT/logs'
alias prng-status='node $PRNG_PROJECT_ROOT/scripts/check-status.js'

# Quick collector commands
alias start-collector='cd $PRNG_PROJECT_ROOT && node enhanced_persistent_collector.js'
alias stop-collector='pkill -f enhanced_persistent_collector'
alias collector-status='ps aux | grep enhanced_persistent_collector'

EOF

# 8. Create performance monitoring script
cat > wsl-scripts/monitor-performance.sh << 'EOF'
#!/bin/bash
echo "🔍 PRNG Collection System Performance Monitor"
echo "============================================="
echo "Time: $(date)"
echo "Uptime: $(uptime -p)"
echo ""
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage (Project Directory):"
du -sh $PRNG_PROJECT_ROOT
echo ""
echo "Collector Process:"
ps aux | grep enhanced_persistent_collector | grep -v grep || echo "No collector running"
echo ""
echo "Recent Game Files:"
find $PRNG_DATA_DIR -name "game-*.json" -mmin -60 | wc -l | xargs echo "Games in last hour:"
echo ""
echo "Total Games Collected:"
if [ -f "$PRNG_DATA_DIR/all-games.jsonl" ]; then
    wc -l < $PRNG_DATA_DIR/all-games.jsonl | xargs echo "Total games:"
else
    echo "No games collected yet"
fi
EOF

chmod +x wsl-scripts/monitor-performance.sh

# 9. Create project status check script
cat > scripts/check-status.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 PRNG Data Collection Status Check');
console.log('====================================');

const projectRoot = process.env.PRNG_PROJECT_ROOT || process.cwd();
const dataDir = path.join(projectRoot, 'rugs-data');

// Check if collector is running
const { exec } = require('child_process');
exec('ps aux | grep enhanced_persistent_collector | grep -v grep', (error, stdout) => {
    if (stdout.trim()) {
        console.log('✅ Collector Status: RUNNING');
        console.log(`   Process: ${stdout.trim().split(/\s+/)[1]}`);
    } else {
        console.log('❌ Collector Status: STOPPED');
    }
});

// Check data collection stats
if (fs.existsSync(path.join(dataDir, 'all-games.jsonl'))) {
    const content = fs.readFileSync(path.join(dataDir, 'all-games.jsonl'), 'utf8');
    const gameCount = content.trim().split('\n').filter(line => line.trim()).length;
    console.log(`📊 Games Collected: ${gameCount}`);
    
    // Check data size
    const stats = fs.statSync(path.join(dataDir, 'all-games.jsonl'));
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`💾 Data Size: ${sizeMB} MB`);
    
    // Check last collection time
    console.log(`🕒 Last Modified: ${stats.mtime.toLocaleString()}`);
} else {
    console.log('📊 Games Collected: 0 (no data file found)');
}

// Check disk space
const { execSync } = require('child_process');
try {
    const diskUsage = execSync('df -h . | tail -1', { encoding: 'utf8' });
    const available = diskUsage.split(/\s+/)[3];
    console.log(`💿 Available Space: ${available}`);
} catch (e) {
    console.log('💿 Available Space: Unable to check');
}

console.log('\n🔧 Quick Commands:');
console.log('   prng              - Go to project directory');
console.log('   start-collector   - Start data collection');
console.log('   prng-status       - Run this status check');
console.log('   ./wsl-scripts/monitor-performance.sh - Full system monitor');
EOF

chmod +x scripts/check-status.js

# 10. Install dashboard dependencies
echo "📦 Installing dashboard dependencies..."
npm install --save \
    express \
    socket.io \
    chokidar \
    cors \
    ws

# 11. Source the new environment
echo "🔄 Reloading environment..."
source ~/.bashrc

echo ""
echo "🎉 WSL Environment Setup Complete!"
echo "=================================="
echo ""
echo "✅ Development tools installed"
echo "✅ Node.js and Python environments ready"
echo "✅ Project aliases and shortcuts configured"
echo "✅ Performance monitoring scripts created"
echo "✅ Dashboard dependencies installed"
echo ""
echo "🚀 Quick Start Commands:"
echo "   prng                 # Navigate to project"
echo "   prng-status          # Check system status"
echo "   start-collector      # Start data collection"
echo ""
echo "📋 Next Steps:"
echo "1. Restart your WSL terminal to load new environment"
echo "2. Run 'prng-status' to check current system state"
echo "3. Ready to build the monitoring dashboard!"
echo ""
echo "🔗 Your collector directory: $PRNG_PROJECT_ROOT"
echo "📊 Your data directory: $PRNG_DATA_DIR"