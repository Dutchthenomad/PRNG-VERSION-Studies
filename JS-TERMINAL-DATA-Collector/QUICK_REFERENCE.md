# 🚀 PRNG System - Quick Reference Card

## 💨 One-Minute Startup

```bash
# 1. Open WSL
wsl

# 2. Go to project
cd /mnt/c/Users/nomad/OneDrive/Desktop/PRNG-VERSION-Studies/JS-TERMINAL-DATA-Collector

# 3. Start dashboard
nohup node dashboard/server.js > dashboard.log 2>&1 &

# 4. Get IP and open browser
hostname -I
# Open: http://[IP]:3000

# 5. Click "Start Collector" in dashboard
```

## 🔍 Essential Commands

### Status Checks
```bash
# Is collector running?
ps aux | grep enhanced_persistent_collector | grep -v grep

# Is dashboard running?
ps aux | grep "node dashboard" | grep -v grep

# How many games collected?
wc -l rugs-data/all-games.jsonl

# Data size
du -sh rugs-data/
```

### Emergency Stop
```bash
# Stop everything
pkill -f enhanced_persistent_collector
pkill -f "node dashboard"
```

### View Logs
```bash
# Dashboard logs
tail -f dashboard.log

# Collector logs (live)
tail -f collector.log
```

## 📁 Important Paths

| What | WSL Path | Windows Path |
|------|----------|--------------|
| **Project** | `/mnt/c/Users/nomad/OneDrive/Desktop/PRNG-VERSION-Studies/JS-TERMINAL-DATA-Collector/` | `C:\Users\nomad\OneDrive\Desktop\PRNG-VERSION-Studies\JS-TERMINAL-DATA-Collector\` |
| **Data** | `./rugs-data/` | `rugs-data\` folder on desktop |
| **Dashboard** | `http://[WSL_IP]:3000` | Open in Windows browser |

## 🎯 Dashboard Access

1. **Get WSL IP**: `hostname -I`
2. **Open Browser**: `http://[IP]:3000`
3. **Common IPs**: 
   - `http://172.20.159.11:3000`
   - `http://localhost:3000` (sometimes works)

## ⚡ Restart Everything

```bash
# Kill all processes
pkill -f enhanced_persistent_collector
pkill -f "node dashboard"

# Wait 2 seconds
sleep 2

# Restart dashboard
nohup node dashboard/server.js > dashboard.log 2>&1 &

# Start collector via dashboard web interface
```

## 📊 Health Check One-Liner

```bash
echo "Collector: $(ps aux | grep enhanced_persistent_collector | grep -v grep | wc -l) | Dashboard: $(ps aux | grep 'node dashboard' | grep -v grep | wc -l) | Games: $(wc -l < rugs-data/all-games.jsonl) | Size: $(du -sh rugs-data/ | cut -f1)"
```

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Can't access dashboard** | Use WSL IP: `hostname -I` |
| **Collector won't start** | Check logs: `tail dashboard.log` |
| **No games collecting** | Wait for rug events (games to end) |
| **Dashboard shows old data** | Refresh browser (Ctrl+F5) |

---
*Keep this card handy for quick system operations!*