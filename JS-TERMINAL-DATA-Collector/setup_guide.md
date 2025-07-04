# 🎮 Rugs.fun Persistent Data Collector - Setup Guide

## 📋 Overview

This guide will help you set up and deploy the persistent data collector based on your proven game recorder. The collector is designed for continuous 24/7 operation to gather 10,000+ games for statistical analysis.

## 🔧 Prerequisites

### System Requirements
- **Node.js 16+** (tested with your existing recorder)
- **Ubuntu/Linux** environment (your laptop)
- **10+ GB free disk space** (for 10,000+ games)
- **Stable internet connection** (for WebSocket reliability)

### Dependencies
```bash
# Install required packages (same as your current recorder)
npm install socket.io-client dotenv
```

## 📁 Project Structure

Create this directory structure on your Ubuntu system:

```
rugs-collector/
├── persistent-collector.js      # Main collector script
├── package.json                 # Dependencies
├── .env                        # Environment variables
├── start-collector.sh          # Startup script
├── analysis-tools/             # Python analysis scripts (Phase 2)
├── rugs-data/                  # Data collection directory
│   ├── all-games.jsonl         # Master stream file
│   ├── 2025/                   # Year-based organization
│   │   └── 07/                 # Month
│   │       └── 01/             # Day
│   │           └── 14h/        # Hour
│   │               ├── game-*.json      # Individual games
│   │               └── games-stream.jsonl # Hourly stream
│   └── backups/                # Backup directory
└── logs/                       # System logs
```

## 🚀 Installation Steps

### Step 1: Create Project Directory
```bash
cd ~
mkdir rugs-collector
cd rugs-collector
```

### Step 2: Initialize Node.js Project
```bash
# Create package.json
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
    "socket.io-client": "^4.7.2",
    "dotenv": "^16.3.1"
  },
  "author": "Your Name",
  "license": "MIT"
}
EOF

# Install dependencies
npm install
```

### Step 3: Create Environment Configuration
```bash
# Create .env file
cat > .env << 'EOF'
# Rugs.fun Configuration
WEBSOCKET_URL=https://backend.rugs.fun
NODE_ENV=production

# Optional: Player tracking (if analyzing specific player)
PLAYER_ID=
RUGS_USERNAME=

# Collection Settings
OUTPUT_DIR=rugs-data
ENABLE_BACKUPS=true
VERBOSE=false
EOF
```

### Step 4: Copy the Collector Script
Copy the `persistent-collector.js` script from the artifact into your project directory.

### Step 5: Create Startup Script
```bash
# Create start-collector.sh
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

# Make it executable
chmod +x start-collector.sh
```

## 🎯 Usage Instructions

### Basic Collection (Infinite)
```bash
# Start continuous collection
./start-collector.sh

# Or directly with node
node persistent-collector.js
```

### Target-Based Collection
```bash
# Collect specific number of games
./start-collector.sh --target 10000

# Collect with verbose output
./start-collector.sh --target 1000 --verbose
```

### Custom Output Directory
```bash
# Use custom data directory
./start-collector.sh --output /path/to/data --target 5000
```

### Testing Setup
```bash
# Test with just 5 games and verbose output
./start-collector.sh --target 5 --verbose
```

## 📊 Understanding the Console Output

### Live Display Explanation
```
🎮 Rugs.fun Persistent Data Collector - LIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Games Collected: 1,247 (Continuous) | Uptime: 2h 14m
⏱️  Current Time: 2:32:15 PM | Current Hour: 2025/07/01/14h
🔄 Connection: ✅ Connected | Rug Events: 2,494 | Reconnects: 3
💾 Recording: ✅ Game 20250701-55b97a42

📋 Recent Games Completed:
[14:32:15] Game-1247: 55b97a42 | Peak: 3.84x | Ticks: 156 | ✅ Valid
[14:31:42] Game-1246: 44a8b291 | Peak: 1.23x | Ticks: 8   | ⚡ Instarug
[14:31:18] Game-1245: 33c7d412 | Peak: 12.7x | Ticks: 890 | ✅ Valid
```

### Status Indicators
- **✅ Valid** - Normal game completion
- **⚡ Instarug** - Game ended very early (< 10 ticks)
- **🚀 High Multi** - Peak multiplier > 50x
- **❌ Error** - Validation or processing error

## 🔍 Verifying Collection

### Check Data Files
```bash
# Verify data directory structure
ls -la rugs-data/

# Check recent games
ls -la rugs-data/2025/07/01/*/

# View latest game data
tail -n 1 rugs-data/all-games.jsonl | jq '.'

# Count total games collected
wc -l rugs-data/all-games.jsonl
```

### Monitor Collection Progress
```bash
# Watch collection in real-time (separate terminal)
watch -n 5 'ls rugs-data/2025/07/01/*/game-*.json | wc -l'

# Check hourly collection rate
ls rugs-data/2025/07/01/*/games-stream.jsonl | xargs wc -l
```

## 🛠️ Troubleshooting

### Common Issues

#### Connection Problems
```bash
# Check network connectivity
ping backend.rugs.fun

# Test WebSocket connection manually
curl -I https://backend.rugs.fun

# Check firewall settings
sudo ufw status
```

#### Permission Issues
```bash
# Fix directory permissions
chmod -R 755 rugs-data/
chmod +x start-collector.sh

# Check disk space
df -h
```

#### Missing Dependencies
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Update Node.js if needed
node --version  # Should be 16+
```

### Log Analysis
```bash
# View real-time logs (if you redirect output)
tail -f collector.log

# Search for errors
grep "ERROR\|❌" collector.log

# Count connection drops
grep "Disconnected\|Reconnected" collector.log | wc -l
```

## 🔧 Configuration Options

### Environment Variables (.env)
```bash
# WebSocket URL (should not need changing)
WEBSOCKET_URL=https://backend.rugs.fun

# Collection settings
OUTPUT_DIR=rugs-data           # Data directory
ENABLE_BACKUPS=true           # Hourly backups
VERBOSE=false                 # Detailed logging

# Player tracking (optional)
PLAYER_ID=did:privy:abc123   # Track specific player
RUGS_USERNAME=your_username   # Your username
```

### Command Line Options
```bash
--output <dir>      # Output directory
--target <number>   # Target number of games
--no-backups       # Disable hourly backups
--verbose          # Enable detailed logging
--verify-prng      # Enable PRNG verification (Phase 2)
--help             # Show help
```

## 🚨 Error Recovery

### Automatic Recovery Features
- **Auto-reconnection** on WebSocket drops
- **Graceful shutdown** on Ctrl+C
- **Error logging** without stopping collection
- **Automatic restart** via startup script

### Manual Recovery
```bash
# If collector stops unexpectedly
./start-collector.sh

# Resume from specific count (check all-games.jsonl)
current_count=$(wc -l < rugs-data/all-games.jsonl)
echo "Resuming from game $current_count"
./start-collector.sh

# Clean restart (careful - will lose current game)
pkill -f persistent-collector
./start-collector.sh
```

## 🎯 Deployment for 24/7 Collection

### Using systemd (Recommended)
```bash
# Create systemd service
sudo tee /etc/systemd/system/rugs-collector.service > /dev/null <<EOF
[Unit]
Description=Rugs.fun Persistent Data Collector
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/rugs-collector
ExecStart=$HOME/rugs-collector/start-collector.sh --target 10000
Restart=always
RestartSec=10
StandardOutput=append:$HOME/rugs-collector/logs/collector.log
StandardError=append:$HOME/rugs-collector/logs/error.log

[Install]
WantedBy=multi-user.target
EOF

# Create logs directory
mkdir -p logs

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable rugs-collector
sudo systemctl start rugs-collector

# Check status
sudo systemctl status rugs-collector

# View logs
sudo journalctl -u rugs-collector -f
```

### Using screen (Alternative)
```bash
# Start in detached screen session
screen -dmS rugs-collector ./start-collector.sh --target 10000

# Reattach to session
screen -r rugs-collector

# Detach: Ctrl+A, D
```

## 📈 Monitoring Collection Health

### Real-time Monitoring
```bash
# Check collection progress
watch -n 10 'echo "Games: $(wc -l < rugs-data/all-games.jsonl)"'

# Monitor system resources
htop

# Check disk usage
du -sh rugs-data/
```

### Daily Health Checks
```bash
# Create daily check script
cat > check-health.sh << 'EOF'
#!/bin/bash
echo "🔍 Daily Health Check - $(date)"
echo "=================================="

# Count games
total_games=$(wc -l < rugs-data/all-games.jsonl)
echo "📊 Total Games: $total_games"

# Check recent activity (last hour)
recent_files=$(find rugs-data -name "game-*.json" -mmin -60 | wc -l)
echo "🕐 Games Last Hour: $recent_files"

# Disk usage
disk_usage=$(du -sh rugs-data/ | cut -f1)
echo "💾 Disk Usage: $disk_usage"

# Check if collector is running
if pgrep -f "persistent-collector" > /dev/null; then
    echo "🔄 Collector Status: ✅ Running"
else
    echo "🔄 Collector Status: ❌ Stopped"
fi

echo "=================================="
EOF

chmod +x check-health.sh

# Run daily check
./check-health.sh

# Add to crontab for automatic daily checks
echo "0 8 * * * cd $HOME/rugs-collector && ./check-health.sh >> logs/daily-health.log" | crontab -
```

## 🎯 Success Metrics

### Target Metrics for 10,000 Games
- **Collection Rate**: 20-50 games per hour (varies by game activity)
- **Uptime**: 99%+ (minimal disconnections)
- **Data Quality**: 100% game completion capture
- **File Integrity**: All JSON files valid and parseable
- **Timing Accuracy**: Precise rug event timing captured

### Expected Timeline
- **10,000 games**: 7-14 days of continuous collection
- **File size**: ~2-5 GB total data
- **Hourly files**: 20-50 games per hour directory
- **Network usage**: ~10-50 MB per hour

## 📋 Next Steps

### Phase 1: Basic Collection (Days 1-3)
1. **Setup and test** with 5-10 games
2. **Verify data quality** and file structure  
3. **Deploy for continuous collection**
4. **Monitor for 24+ hours** to ensure stability

### Phase 2: Analysis Preparation (Days 4-7)
1. **Create Python analysis tools** to read collected data
2. **Implement PRNG verification** scripts
3. **Develop statistical analysis** pipeline
4. **Begin cross-game correlation** studies

### Phase 3: Advanced Analysis (Week 2+)
1. **ML pattern detection** on collected data
2. **Real-time prediction** system development
3. **Advanced timing analysis** and seed correlation
4. **Final report generation** with findings

---

## 🆘 Support

If you encounter issues:

1. **Check the console output** for error messages
2. **Verify network connectivity** to rugs.fun
3. **Check disk space** and permissions
4. **Review logs** for connection issues
5. **Test with smaller target** (--target 5) first

The collector is based on your proven game recorder, so most issues will be environmental rather than code-related.