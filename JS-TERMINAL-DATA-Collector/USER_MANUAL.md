# 🎮 PRNG Data Collection System - User Manual

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Quick Start Guide](#quick-start-guide)
3. [Directory Structure](#directory-structure)
4. [Starting the System](#starting-the-system)
5. [Monitoring Collection](#monitoring-collection)
6. [Stopping the System](#stopping-the-system)
7. [Data Management](#data-management)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Operations](#advanced-operations)

---

## 🎯 System Overview

This system collects PRNG (Pseudo-Random Number Generator) data from rugs.fun for statistical analysis and machine learning research. The system consists of:

- **Data Collector**: Node.js application that connects to rugs.fun WebSocket
- **Real-time Dashboard**: Web interface for monitoring collection progress
- **File Storage**: Hierarchical data storage system on your Windows desktop

### Target Goal
Collect **10,000+ games** for statistical significance in PRNG analysis.

---

## ⚡ Quick Start Guide

### 1. Open WSL Terminal
```bash
# From Windows, open WSL (Ubuntu)
wsl
```

### 2. Navigate to Project Directory
```bash
cd /mnt/c/Users/nomad/OneDrive/Desktop/PRNG-VERSION-Studies/JS-TERMINAL-DATA-Collector
```

### 3. Start the Dashboard
```bash
nohup node dashboard/server.js > dashboard.log 2>&1 &
```

### 4. Open Dashboard in Browser
Navigate to: `http://172.20.159.11:3000` (or check your WSL IP with `hostname -I`)

### 5. Start Collection
Click the **"▶️ Start Collector"** button in the dashboard

---

## 📁 Directory Structure

### Project Root
```
/mnt/c/Users/nomad/OneDrive/Desktop/PRNG-VERSION-Studies/JS-TERMINAL-DATA-Collector/
├── enhanced_persistent_collector.js    # Main collector script
├── dashboard/                          # Real-time monitoring dashboard
│   ├── server.js                      # Dashboard server
│   └── public/                        # Web interface files
├── rugs-data/                         # Data storage directory
│   ├── all-games.jsonl               # Consolidated game data
│   ├── 2025/07/05/05h/               # Hourly game files
│   └── analytics/                     # Analysis results
├── start-dashboard.sh                 # Dashboard startup script
└── USER_MANUAL.md                     # This manual
```

### Windows Path Equivalent
```
C:\Users\nomad\OneDrive\Desktop\PRNG-VERSION-Studies\JS-TERMINAL-DATA-Collector\
```

---

## 🚀 Starting the System

### Method 1: Dashboard Control (Recommended)

1. **Open WSL Terminal**
   ```bash
   wsl
   ```

2. **Navigate to Project**
   ```bash
   cd /mnt/c/Users/nomad/OneDrive/Desktop/PRNG-VERSION-Studies/JS-TERMINAL-DATA-Collector
   ```

3. **Start Dashboard Server**
   ```bash
   # Start in background
   nohup node dashboard/server.js > dashboard.log 2>&1 &
   
   # Verify it's running
   ps aux | grep "node dashboard" | grep -v grep
   ```

4. **Access Dashboard**
   - Get your WSL IP: `hostname -I`
   - Open browser: `http://[WSL_IP]:3000`
   - Example: `http://172.20.159.11:3000`

5. **Start Collection**
   - Click **"▶️ Start Collector"** button
   - Monitor status in "System Health" section

### Method 2: Direct Command Line

1. **Navigate to Project**
   ```bash
   cd /mnt/c/Users/nomad/OneDrive/Desktop/PRNG-VERSION-Studies/JS-TERMINAL-DATA-Collector
   ```

2. **Start Collector Directly**
   ```bash
   # Start in background
   nohup node enhanced_persistent_collector.js > collector.log 2>&1 &
   
   # Or start in foreground (press Ctrl+C to stop)
   node enhanced_persistent_collector.js
   ```

---

## 📊 Monitoring Collection

### Dashboard Features

**Access URL**: `http://[WSL_IP]:3000`

1. **Collection Statistics**
   - Games collected count
   - Total files created
   - Data size in MB
   - Collection rate (games/hour)
   - Progress toward 10,000 games target

2. **System Health**
   - Collector process status (Running/Stopped)
   - Process ID (PID)
   - Last collection timestamp
   - System uptime

3. **Process Control**
   - Start/Stop collector buttons
   - Refresh statistics
   - Real-time status updates

4. **Recent Games**
   - List of latest collected games
   - Game details (duration, multiplier, rug status)

5. **Live System Log**
   - Real-time collector output
   - Error messages and warnings
   - Connection status updates

### Command Line Monitoring

```bash
# Check if collector is running
ps aux | grep enhanced_persistent_collector | grep -v grep

# View live collector logs
tail -f collector.log

# View live dashboard logs
tail -f dashboard.log

# Check data collection progress
wc -l rugs-data/all-games.jsonl

# Check disk usage
du -sh rugs-data/
```

---

## ⏹️ Stopping the System

### Method 1: Dashboard Control

1. **Open Dashboard**: `http://[WSL_IP]:3000`
2. **Click Stop Button**: "⏹️ Stop Collector"
3. **Verify Status**: Check "System Health" shows "Stopped"

### Method 2: Command Line

```bash
# Find collector process
ps aux | grep enhanced_persistent_collector | grep -v grep

# Stop collector (replace [PID] with actual process ID)
kill [PID]

# Force stop if needed
kill -9 [PID]

# Stop dashboard server
ps aux | grep "node dashboard" | grep -v grep
kill [DASHBOARD_PID]
```

### Method 3: Stop All Processes

```bash
# Stop all collector processes
pkill -f enhanced_persistent_collector

# Stop all dashboard processes
pkill -f "node dashboard"

# Verify everything stopped
ps aux | grep -E "(enhanced_persistent_collector|node dashboard)" | grep -v grep
```

---

## 💾 Data Management

### Data Storage Locations

**WSL Path**:
```
/mnt/c/Users/nomad/OneDrive/Desktop/PRNG-VERSION-Studies/JS-TERMINAL-DATA-Collector/rugs-data/
```

**Windows Path**:
```
C:\Users\nomad\OneDrive\Desktop\PRNG-VERSION-Studies\JS-TERMINAL-DATA-Collector\rugs-data\
```

### File Structure

```
rugs-data/
├── all-games.jsonl                    # Main data file (one line per game)
├── 2025/                             # Year folder
│   └── 07/                           # Month folder
│       └── 05/                       # Day folder
│           └── 05h/                  # Hour folder
│               ├── game-*.json       # Individual game files
│               └── games-stream.jsonl # Hourly stream
├── analytics/                        # Analysis results
├── backups/                          # Automatic backups
└── pattern-alerts/                   # Pattern detection alerts
```

### Data Backup

```bash
# Manual backup
cp -r rugs-data/ rugs-data-backup-$(date +%Y%m%d)

# Check backup size
du -sh rugs-data-backup-*

# Archive backup
tar -czf rugs-data-backup-$(date +%Y%m%d).tar.gz rugs-data/
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Cannot access dashboard at localhost:3000"

**Solution**:
```bash
# Get WSL IP address
hostname -I

# Use WSL IP instead of localhost
# Example: http://172.20.159.11:3000
```

#### 2. "Collector not starting"

**Diagnostic Steps**:
```bash
# Check if already running
ps aux | grep enhanced_persistent_collector | grep -v grep

# Check for port conflicts
ss -tlnp | grep :3000

# View error logs
cat dashboard.log
cat collector.log

# Check dependencies
node --version
npm list
```

#### 3. "No games being collected"

**Diagnostic Steps**:
```bash
# Check collector connection status
tail -f collector.log | grep -E "(Connected|Error|Rug event)"

# Verify WebSocket connection
curl -I https://backend.rugs.fun

# Check if data directory is writable
touch rugs-data/test.txt && rm rugs-data/test.txt
```

#### 4. "Dashboard shows old data"

**Solutions**:
```bash
# Refresh browser (Ctrl+F5)
# Or restart dashboard
pkill -f "node dashboard"
nohup node dashboard/server.js > dashboard.log 2>&1 &
```

### Log Locations

```bash
# Dashboard logs
tail -f dashboard.log

# Collector logs (if running from command line)
tail -f collector.log

# System logs
journalctl -f
```

---

## ⚙️ Advanced Operations

### Custom Configuration

#### Start with Specific Target

```bash
# Collect exactly 100 games
node enhanced_persistent_collector.js --target 100

# Verbose output
node enhanced_persistent_collector.js --verbose

# Custom output directory
node enhanced_persistent_collector.js --output custom-data
```

#### Dashboard on Different Port

```bash
# Set custom port
PORT=8080 node dashboard/server.js
```

### Performance Monitoring

```bash
# Monitor system resources
htop

# Check disk space
df -h

# Monitor network connections
ss -tuln | grep ESTABLISHED

# Watch file creation in real-time
watch -n 1 'ls -la rugs-data/2025/*/
```

### Maintenance Tasks

#### Clean Old Logs

```bash
# Rotate logs (keep last 7 days)
find . -name "*.log" -mtime +7 -delete

# Archive old data
tar -czf archive-$(date +%Y%m).tar.gz rugs-data/2025/01/
```

#### Health Check Script

```bash
# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "=== PRNG System Health Check ==="
echo "Collector Running: $(ps aux | grep enhanced_persistent_collector | grep -v grep | wc -l)"
echo "Dashboard Running: $(ps aux | grep "node dashboard" | grep -v grep | wc -l)"
echo "Games Collected: $(wc -l < rugs-data/all-games.jsonl)"
echo "Data Size: $(du -sh rugs-data/ | cut -f1)"
echo "Last Collection: $(stat -c %y rugs-data/all-games.jsonl)"
EOF

chmod +x health-check.sh
./health-check.sh
```

---

## 📞 Support Information

### System Requirements
- **OS**: Windows with WSL (Ubuntu)
- **Node.js**: v16+ (currently using v22.13.1)
- **RAM**: Minimum 1GB available
- **Disk**: 10GB+ free space recommended
- **Network**: Stable internet connection

### File Locations Quick Reference

| Component | WSL Path | Windows Path |
|-----------|----------|--------------|
| Project Root | `/mnt/c/Users/nomad/OneDrive/Desktop/PRNG-VERSION-Studies/JS-TERMINAL-DATA-Collector/` | `C:\Users\nomad\OneDrive\Desktop\PRNG-VERSION-Studies\JS-TERMINAL-DATA-Collector\` |
| Data Storage | `/mnt/c/.../rugs-data/` | `C:\...\rugs-data\` |
| Dashboard | `http://[WSL_IP]:3000` | Access from Windows browser |

### Emergency Stop

```bash
# Nuclear option - stop everything
pkill -f "enhanced_persistent_collector"
pkill -f "node dashboard"
```

---

## 📈 Success Metrics

- **Target**: 10,000+ games collected
- **Data Quality**: 100% rug event capture
- **System Uptime**: 99%+ availability
- **File Integrity**: All games saved with complete data

---

*Last Updated: 2025-07-05*
*System Version: Enhanced PRNG Collector v1.0*