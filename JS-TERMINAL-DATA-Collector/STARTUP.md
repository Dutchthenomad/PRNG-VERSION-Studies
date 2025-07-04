# 🚀 Enhanced PRNG Data Collector - Startup Guide

This guide provides step-by-step instructions for starting and operating the Enhanced PRNG Data Collector system for rugs.fun.

## 📋 Prerequisites

- Node.js v16+ installed (current system has v22.13.1)
- Required npm packages installed (socket.io-client, dotenv)
- Internet connection to access rugs.fun WebSocket

## 🔧 Step-by-Step Startup Process

### 1. Navigate to the Correct Directory

```powershell
# Open PowerShell and navigate to the project directory
cd C:\Users\nomad\OneDrive\Desktop\PRNG-VERSION-Studies\JS-TERMINAL-DATA-Collector
```

### 2. Verify System Setup (Optional but Recommended)

```powershell
# Run the verification script to ensure everything is set up correctly
node verification_script.js
```

You should see a "SETUP COMPLETE" message with possibly some minor warnings.

### 3. Start the Collector

#### Option A: Standard Collection (10,000 games)

```powershell
# Start the collector with default settings (10,000 games)
.\start-collector.ps1
```

#### Option B: Test Collection (3 games with verbose output)

```powershell
# Start a test collection of just 3 games with verbose output
.\start-collector.ps1 -test
```

#### Option C: Custom Collection

```powershell
# Start with custom parameters
.\start-collector.ps1 -target 5000 -verbose
```

### 4. Monitor Collection Progress

The collector displays real-time information in the console:
- System status and uptime
- Memory usage
- Games collected
- Recent game statistics
- Pattern alerts

### 5. Stopping the Collector

```powershell
# Press Ctrl+C in the terminal to gracefully stop collection
```

The collector will finish any in-progress games and provide final statistics before shutting down.

## 📁 Data Storage Locations

- **Raw Game Data**: `rugs-data/YYYY/MM/DD/HHh/`
- **Complete Games**: `rugs-data/complete-games/`
- **Pattern Alerts**: `rugs-data/pattern-alerts/`
- **Analytics**: `rugs-data/analytics/`
- **Backups**: `rugs-data/backups/`
- **Logs**: `logs/`

## 🔍 Verification and Testing

### Quick Enhancement Module Test

```powershell
# Test that the enhancement module loads correctly
node test-quick.js
```

### Full System Assessment

```powershell
# View the complete system assessment guide
notepad verification-testing\system_assessment_guide.md
```

## ⚠️ Troubleshooting

### Connection Issues

If the collector cannot connect to rugs.fun:
1. Check your internet connection
2. Verify the WebSocket URL in the `.env` file
3. Restart the collector

### Data Storage Issues

If data isn't being saved properly:
1. Check disk space
2. Verify write permissions to the `rugs-data` directory
3. Look for error messages in the console output

### Process Termination

If the collector process needs to be forcefully terminated:

```powershell
# Find and kill the collector process
Get-Process -Name node | Where-Object { $_.CommandLine -like '*enhanced_persistent_collector.js*' } | Stop-Process -Force
```

## 📊 Data Analysis

After collecting sufficient data, you can analyze it using:

```powershell
# Navigate to the analysis tools directory
cd ..\analysis-tools

# Run the analysis script (if available)
python analyze_prng_data.py
```

## 🔄 Updating the System

To update the collector after pulling new changes from GitHub:

```powershell
# Pull latest changes
git pull

# Install any new dependencies
npm install

# Run verification
node verification_script.js
```

---

For detailed information about the Enhanced PRNG Data Collector, please refer to the `README.md` file.
