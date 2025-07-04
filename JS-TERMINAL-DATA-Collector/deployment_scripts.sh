#!/bin/bash

# 🎮 RUGS.FUN PERSISTENT COLLECTOR - ENVIRONMENT SETUP SCRIPT
# 
# This script sets up the complete environment for data collection and analysis
# Run on Ubuntu system: ./setup-environment.sh

set -e  # Exit on any error

echo "🎮 RUGS.FUN PERSISTENT COLLECTOR SETUP"
echo "======================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Ubuntu/Debian
if [[ ! -f /etc/os-release ]] || ! grep -q "ubuntu\|debian" /etc/os-release; then
    print_warning "This script is designed for Ubuntu/Debian systems"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if running as root (we don't want that)
if [[ $EUID -eq 0 ]]; then
    print_error "This script should not be run as root"
    print_error "Run as your regular user account"
    exit 1
fi

print_status "Starting environment setup..."

# Update system packages
print_status "Updating system packages..."
sudo apt-get update

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed: $(node --version)"
else
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 16 ]]; then
        print_warning "Node.js version is too old ($(node --version)). Need 16+"
        print_status "Updating Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    print_success "Node.js is ready: $(node --version)"
fi

# Install Python 3 if not present
if ! command -v python3 &> /dev/null; then
    print_status "Installing Python 3..."
    sudo apt-get install -y python3 python3-pip python3-venv
    print_success "Python 3 installed: $(python3 --version)"
else
    print_success "Python 3 is ready: $(python3 --version)"
fi

# Install additional system dependencies
print_status "Installing system dependencies..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    htop \
    screen \
    jq \
    unzip \
    build-essential

# Create project directory
PROJECT_DIR="$HOME/rugs-collector"
print_status "Creating project directory: $PROJECT_DIR"

if [[ -d "$PROJECT_DIR" ]]; then
    print_warning "Project directory already exists"
    read -p "Remove and recreate? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_DIR"
        print_status "Removed existing directory"
    else
        print_status "Using existing directory"
    fi
fi

mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Create directory structure
print_status "Creating directory structure..."
mkdir -p {rugs-data,logs,analysis-tools,scripts,backups}
mkdir -p rugs-data/{backups/hourly,analysis}

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
if [[ ! -f package.json ]]; then
    # Create package.json (this would be copied from artifacts)
    cat > package.json << 'EOF'
{
  "name": "rugs-persistent-collector",
  "version": "1.0.0",
  "description": "Persistent data collector for rugs.fun statistical analysis",
  "main": "persistent-collector.js",
  "scripts": {
    "start": "node persistent-collector.js",
    "collect": "node persistent-collector.js --target 10000",
    "test": "node persistent-collector.js --target 5 --verbose"
  },
  "dependencies": {
    "socket.io-client": "^4.7.5",
    "dotenv": "^16.3.1"
  },
  "keywords": ["rugs.fun", "data-collection", "websocket"],
  "author": "Data Science Team",
  "license": "MIT"
}
EOF
fi

npm install
print_success "Node.js dependencies installed"

# Set up Python virtual environment
print_status "Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
cat > requirements.txt << 'EOF'
pandas>=2.0.0
numpy>=1.24.0
scipy>=1.10.0
scikit-learn>=1.3.0
matplotlib>=3.7.0
seaborn>=0.12.0
jsonlines>=4.0.0
cryptography>=41.0.0
jupyter>=1.0.0
EOF

pip install --upgrade pip
pip install -r requirements.txt
print_success "Python dependencies installed"

# Create environment file
print_status "Creating environment configuration..."
cat > .env << 'EOF'
# Rugs.fun Configuration
WEBSOCKET_URL=https://backend.rugs.fun
NODE_ENV=production

# Collection Settings
OUTPUT_DIR=rugs-data
ENABLE_BACKUPS=true
VERBOSE=false

# Optional: Player tracking
PLAYER_ID=
RUGS_USERNAME=
EOF

# Create startup script
print_status "Creating startup scripts..."
cat > start-collector.sh << 'EOF'
#!/bin/bash

# Rugs.fun Persistent Collector Startup Script

echo "🎮 Starting Rugs.fun Persistent Data Collector"
echo "=============================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create data directory if it doesn't exist
mkdir -p rugs-data/backups/hourly

# Start the collector with error recovery
echo "🚀 Starting persistent collection..."
echo "📁 Data will be saved to: $(pwd)/rugs-data"
echo "⏹️  Press Ctrl+C to stop collection gracefully"
echo ""

# Run with automatic restart on failure
while true; do
    node persistent-collector.js "$@"
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ Collection completed successfully"
        break
    else
        echo "⚠️  Collector stopped with exit code $exit_code"
        echo "🔄 Restarting in 10 seconds..."
        sleep 10
    fi
done
EOF

chmod +x start-collector.sh

# Create analysis script
cat > analyze-data.sh << 'EOF'
#!/bin/bash

# Rugs.fun Data Analysis Script

echo "📊 RUGS.FUN DATA ANALYSIS"
echo "========================="

# Activate Python virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Python virtual environment activated"
else
    echo "❌ Python virtual environment not found"
    echo "Run setup-environment.sh first"
    exit 1
fi

# Check if analysis tools exist
if [ ! -f "analysis-tools.py" ]; then
    echo "❌ analysis-tools.py not found"
    echo "Please copy the analysis tools to this directory"
    exit 1
fi

# Run analysis
python analysis-tools.py "$@"
EOF

chmod +x analyze-data.sh

# Create system health check script
cat > check-health.sh << 'EOF'
#!/bin/bash

echo "🔍 RUGS COLLECTOR HEALTH CHECK - $(date)"
echo "========================================"

# Check if collector is running
if pgrep -f "persistent-collector" > /dev/null; then
    echo "🔄 Collector Status: ✅ Running"
    echo "   PID: $(pgrep -f 'persistent-collector')"
else
    echo "🔄 Collector Status: ❌ Stopped"
fi

# Count collected games
if [ -f "rugs-data/all-games.jsonl" ]; then
    total_games=$(wc -l < rugs-data/all-games.jsonl)
    echo "📊 Total Games: $total_games"
    
    # Check recent activity (last hour)
    recent_files=$(find rugs-data -name "game-*.json" -mmin -60 | wc -l)
    echo "🕐 Games Last Hour: $recent_files"
else
    echo "📊 Total Games: 0 (no data file found)"
fi

# Disk usage
if [ -d "rugs-data" ]; then
    disk_usage=$(du -sh rugs-data/ | cut -f1)
    echo "💾 Disk Usage: $disk_usage"
fi

# Available disk space
available_space=$(df -h . | awk 'NR==2 {print $4}')
echo "💿 Available Space: $available_space"

# System resources
echo "🖥️  System Load: $(uptime | awk -F'load average:' '{print $2}')"

# Memory usage
memory_usage=$(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
echo "🧠 Memory Usage: $memory_usage"

# Check log files
if [ -d "logs" ]; then
    log_count=$(ls logs/*.log 2>/dev/null | wc -l)
    echo "📝 Log Files: $log_count"
fi

echo "========================================"

# Check for issues
issues=0

# Check if collector should be running but isn't
if [ ! -f "rugs-data/all-games.jsonl" ] && ! pgrep -f "persistent-collector" > /dev/null; then
    echo "⚠️  Issue: Collector not running and no data collected"
    issues=$((issues + 1))
fi

# Check disk space (warn if less than 1GB)
available_mb=$(df . | awk 'NR==2 {print $4}')
if [ $available_mb -lt 1048576 ]; then  # Less than 1GB in KB
    echo "⚠️  Issue: Low disk space (less than 1GB available)"
    issues=$((issues + 1))
fi

if [ $issues -eq 0 ]; then
    echo "✅ No issues detected"
else
    echo "❌ $issues issue(s) detected"
fi
EOF

chmod +x check-health.sh

# Create systemd service file (optional)
print_status "Creating systemd service template..."
cat > rugs-collector.service << EOF
[Unit]
Description=Rugs.fun Persistent Data Collector
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/start-collector.sh --target 10000
Restart=always
RestartSec=10
StandardOutput=append:$PROJECT_DIR/logs/collector.log
StandardError=append:$PROJECT_DIR/logs/error.log

[Install]
WantedBy=multi-user.target
EOF

print_success "Environment setup completed!"

echo ""
echo "📋 NEXT STEPS:"
echo "=============="
echo "1. Copy the following files to $PROJECT_DIR:"
echo "   - persistent-collector.js (main collector script)"
echo "   - analysis-tools.py (Python analysis tools)"
echo ""
echo "2. Test the setup:"
echo "   cd $PROJECT_DIR"
echo "   ./start-collector.sh --target 3 --verbose"
echo ""
echo "3. Start production collection:"
echo "   ./start-collector.sh --target 10000"
echo ""
echo "4. Monitor collection:"
echo "   ./check-health.sh"
echo ""
echo "5. Analyze data:"
echo "   ./analyze-data.sh --full-analysis"
echo ""
echo "6. (Optional) Install as system service:"
echo "   sudo cp rugs-collector.service /etc/systemd/system/"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable rugs-collector"
echo "   sudo systemctl start rugs-collector"
echo ""
print_success "Setup complete! Project directory: $PROJECT_DIR"