#!/usr/bin/env node

/**
 * 🎮 PRNG COLLECTION DASHBOARD SERVER
 * 
 * Real-time monitoring dashboard for rugs.fun data collection
 * Monitors file system, process health, and collection statistics
 * 
 * Features:
 * - Real-time file system monitoring
 * - Collection statistics and progress tracking
 * - Process monitoring and control
 * - WebSocket updates for live dashboard
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

// Configuration
const PORT = process.env.PORT || 3000;
const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'rugs-data');
const COLLECTOR_SCRIPT = path.join(PROJECT_ROOT, 'enhanced_persistent_collector.js');

// Initialize Express app and Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Global state tracking
let collectionStats = {
    totalGames: 0,
    totalFiles: 0,
    totalSizeMB: 0,
    lastCollectionTime: null,
    collectionRate: 0,
    isCollectorRunning: false,
    collectorPID: null,
    startTime: new Date()
};

let collectorProcess = null;

/**
 * Get current collection statistics
 */
function getCollectionStats() {
    try {
        const stats = {
            totalGames: 0,
            totalFiles: 0,
            totalSizeMB: 0,
            lastCollectionTime: null,
            collectionRate: 0,
            isCollectorRunning: false,
            collectorPID: null,
            uptime: Math.floor((Date.now() - collectionStats.startTime.getTime()) / 1000)
        };

        // Check if data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            return stats;
        }

        // Count games from all-games.jsonl
        const allGamesFile = path.join(DATA_DIR, 'all-games.jsonl');
        if (fs.existsSync(allGamesFile)) {
            const content = fs.readFileSync(allGamesFile, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());
            stats.totalGames = lines.length;
            
            const fileStats = fs.statSync(allGamesFile);
            stats.totalSizeMB = Math.round(fileStats.size / 1024 / 1024 * 100) / 100;
            stats.lastCollectionTime = fileStats.mtime.toISOString();
        }

        // Count total files
        const countFiles = (dir) => {
            let count = 0;
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);
                    if (stat.isDirectory()) {
                        count += countFiles(filePath);
                    } else if (file.endsWith('.json') || file.endsWith('.jsonl')) {
                        count++;
                    }
                }
            }
            return count;
        };

        stats.totalFiles = countFiles(DATA_DIR);

        // Check if collector is running
        exec('ps aux | grep enhanced_persistent_collector | grep -v grep', (error, stdout) => {
            if (!error && stdout.trim()) {
                const lines = stdout.trim().split('\n');
                if (lines.length > 0) {
                    const pidMatch = lines[0].match(/\s+(\d+)\s+/);
                    if (pidMatch) {
                        stats.isCollectorRunning = true;
                        stats.collectorPID = parseInt(pidMatch[1]);
                    }
                }
            }
            
            // Update global stats
            const previousGames = collectionStats.totalGames;
            collectionStats = { ...collectionStats, ...stats };
            
            // Calculate collection rate (games per hour)
            if (previousGames > 0 && stats.totalGames > previousGames) {
                const timeDiff = (Date.now() - collectionStats.lastUpdate) / 1000 / 3600; // hours
                const gamesDiff = stats.totalGames - previousGames;
                collectionStats.collectionRate = Math.round(gamesDiff / timeDiff * 100) / 100;
            }
            
            collectionStats.lastUpdate = Date.now();
        });

        return stats;
    } catch (error) {
        console.error('Error getting collection stats:', error);
        return collectionStats;
    }
}

/**
 * Start the collector process
 */
function startCollector() {
    if (collectorProcess) {
        console.log('Collector already running');
        return false;
    }

    try {
        console.log('Starting collector process...');
        collectorProcess = spawn('node', [COLLECTOR_SCRIPT], {
            cwd: PROJECT_ROOT,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        collectorProcess.stdout.on('data', (data) => {
            console.log(`Collector: ${data.toString().trim()}`);
            io.emit('collector-log', { 
                type: 'stdout', 
                message: data.toString().trim(),
                timestamp: new Date().toISOString()
            });
        });

        collectorProcess.stderr.on('data', (data) => {
            console.error(`Collector Error: ${data.toString().trim()}`);
            io.emit('collector-log', { 
                type: 'stderr', 
                message: data.toString().trim(),
                timestamp: new Date().toISOString()
            });
        });

        collectorProcess.on('close', (code) => {
            console.log(`Collector process exited with code ${code}`);
            collectorProcess = null;
            io.emit('collector-status', { 
                running: false, 
                pid: null,
                exitCode: code,
                timestamp: new Date().toISOString()
            });
        });

        io.emit('collector-status', { 
            running: true, 
            pid: collectorProcess.pid,
            timestamp: new Date().toISOString()
        });

        return true;
    } catch (error) {
        console.error('Error starting collector:', error);
        collectorProcess = null;
        return false;
    }
}

/**
 * Stop the collector process
 */
function stopCollector() {
    if (!collectorProcess) {
        console.log('No collector process to stop');
        return false;
    }

    try {
        console.log('Stopping collector process...');
        collectorProcess.kill('SIGTERM');
        
        // Force kill after 5 seconds if still running
        setTimeout(() => {
            if (collectorProcess) {
                collectorProcess.kill('SIGKILL');
            }
        }, 5000);

        return true;
    } catch (error) {
        console.error('Error stopping collector:', error);
        return false;
    }
}

// API Routes
app.get('/api/stats', (req, res) => {
    res.json(getCollectionStats());
});

app.post('/api/collector/start', (req, res) => {
    const success = startCollector();
    res.json({ success, message: success ? 'Collector started' : 'Failed to start collector' });
});

app.post('/api/collector/stop', (req, res) => {
    const success = stopCollector();
    res.json({ success, message: success ? 'Collector stopped' : 'Failed to stop collector' });
});

app.get('/api/recent-games', (req, res) => {
    try {
        const allGamesFile = path.join(DATA_DIR, 'all-games.jsonl');
        if (!fs.existsSync(allGamesFile)) {
            return res.json([]);
        }

        const content = fs.readFileSync(allGamesFile, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        // Get last 10 games
        const recentGames = lines.slice(-10).map(line => {
            try {
                const game = JSON.parse(line);
                return {
                    gameId: game.gameId,
                    recordingEnd: game.recordingEnd,
                    duration: game.duration,
                    reason: game.reason,
                    totalEvents: game.totalEvents,
                    peakMultiplier: game.analysis?.peakMultiplier || 0,
                    isInstarug: game.analysis?.isInstarug || false
                };
            } catch (e) {
                return null;
            }
        }).filter(Boolean);

        res.json(recentGames);
    } catch (error) {
        console.error('Error getting recent games:', error);
        res.status(500).json({ error: 'Failed to get recent games' });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Dashboard client connected');
    
    // Send initial stats
    socket.emit('stats-update', getCollectionStats());
    
    socket.on('disconnect', () => {
        console.log('Dashboard client disconnected');
    });

    socket.on('request-stats', () => {
        socket.emit('stats-update', getCollectionStats());
    });
});

// File system watcher for real-time updates
const watcher = chokidar.watch(DATA_DIR, {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true
});

watcher.on('add', (filePath) => {
    console.log(`New file detected: ${filePath}`);
    const stats = getCollectionStats();
    io.emit('stats-update', stats);
    io.emit('file-added', { 
        path: filePath, 
        timestamp: new Date().toISOString(),
        stats
    });
});

watcher.on('change', (filePath) => {
    console.log(`File changed: ${filePath}`);
    const stats = getCollectionStats();
    io.emit('stats-update', stats);
    io.emit('file-changed', { 
        path: filePath, 
        timestamp: new Date().toISOString(),
        stats
    });
});

// Periodic stats update
setInterval(() => {
    const stats = getCollectionStats();
    io.emit('stats-update', stats);
}, 5000); // Update every 5 seconds

// Start server
server.listen(PORT, () => {
    console.log('\n🎮 PRNG Collection Dashboard Server Started');
    console.log('==========================================');
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📊 Monitoring data directory: ${DATA_DIR}`);
    console.log(`🔧 Collector script: ${COLLECTOR_SCRIPT}`);
    console.log(`🎯 Project root: ${PROJECT_ROOT}`);
    console.log('');
    
    // Initial stats check
    const initialStats = getCollectionStats();
    console.log(`📈 Current Stats:`);
    console.log(`   Games Collected: ${initialStats.totalGames}`);
    console.log(`   Total Files: ${initialStats.totalFiles}`);
    console.log(`   Data Size: ${initialStats.totalSizeMB} MB`);
    console.log(`   Collector Running: ${initialStats.isCollectorRunning ? 'Yes' : 'No'}`);
    console.log('');
    console.log('🚀 Dashboard ready for monitoring!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down dashboard server...');
    
    if (collectorProcess) {
        collectorProcess.kill('SIGTERM');
    }
    
    watcher.close();
    server.close(() => {
        console.log('Dashboard server stopped');
        process.exit(0);
    });
});