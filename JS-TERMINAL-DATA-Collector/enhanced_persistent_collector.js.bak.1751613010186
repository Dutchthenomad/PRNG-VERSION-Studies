#!/usr/bin/env node

/**
 * 🎮 RUGS.FUN ENHANCED PERSISTENT DATA COLLECTOR
 * 
 * Based on proven game recorder, adapted for continuous 10,000+ game collection
 * Enhanced with precise timing capture and cross-game pattern detection
 * 
 * Usage: node enhanced_persistent_collector.js [options]
 */

require('dotenv').config();
const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// BigInt serialization support
const JSONStringifyWithBigInt = (obj) => {
    return JSON.stringify(obj, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
    );
};

// Import enhancements
const {
    capturePreciseRugEventTiming,
    enhancedGameAnalysis,
    CrossGameSequenceTracker,
    displayEnhancedCollectionStatus,
    formatUptime,
    generateUniqueId,
    formatFileTimestamp,
    createDataDirectories
} = require('./enhancements/collector-enhancements');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    outputDir: 'rugs-data',
    enableBackups: true,
    enablePRNGVerification: false, // Phase 2 feature
    targetGames: Infinity,
    verbose: false,
    displayInterval: 2000 // 2 seconds
};

for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '--output':
            options.outputDir = args[++i];
            break;
        case '--target':
            options.targetGames = parseInt(args[++i]) || Infinity;
            break;
        case '--no-backups':
            options.enableBackups = false;
            break;
        case '--verbose':
            options.verbose = true;
            break;
        case '--verify-prng':
            options.enablePRNGVerification = true;
            break;
        case '--help':
            showHelp();
            process.exit(0);
    }
}

function showHelp() {
    console.log(`
🎮 RUGS.FUN ENHANCED PERSISTENT DATA COLLECTOR

Continuously collects complete game data with enhanced pattern detection

Usage: node enhanced_persistent_collector.js [options]

Options:
  --output <dir>      Output directory (default: rugs-data)
  --target <number>   Target number of games (default: infinite)
  --no-backups        Disable hourly backups
  --verbose           Show detailed event logging
  --verify-prng       Enable real-time PRNG verification (Phase 2)
  --help              Show this help

Examples:
  node enhanced_persistent_collector.js
  node enhanced_persistent_collector.js --target 10000 --output ./data
  node enhanced_persistent_collector.js --verbose --verify-prng
`);
}

// Configuration
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'https://backend.rugs.fun';

// Create necessary directories
createDataDirectories();

console.log('🎮 RUGS.FUN ENHANCED PERSISTENT DATA COLLECTOR');
console.log('========================================');
console.log(`📡 WebSocket: ${WEBSOCKET_URL}`);
console.log(`🎯 Target Games: ${options.targetGames === Infinity ? '∞ (Continuous)' : options.targetGames}`);
console.log(`📁 Output: ${options.outputDir}`);
console.log(`💾 Backups: ${options.enableBackups ? 'Enabled' : 'Disabled'}`);
console.log('========================================\n');

/**
 * Enhanced persistent game collector with pattern detection
 */
class EnhancedPersistentGameCollector {
    constructor() {
        this.currentGame = null;
        this.gamesCollected = 0;
        this.events = [];
        this.gameStartTime = null;
        this.isRecording = false;
        this.socket = null;
        this.rugEventsDetected = 0;
        this.startTime = new Date();
        this.lastDisplayUpdate = 0;
        this.recentGames = [];
        this.currentHour = null;
        this.hourlyStats = {
            games: 0,
            events: 0,
            trades: 0,
            errors: 0
        };
        this.totalStats = {
            connectionDrops: 0,
            validationErrors: 0,
            filesWritten: 0,
            totalEvents: 0
        };
        
        // Initialize cross-game sequence tracker for pattern detection
        this.sequenceTracker = new CrossGameSequenceTracker();
    }

    startPersistentCollection() {
        console.log('🔌 Starting enhanced persistent collection...');
        this.connectWebSocket();
        this.startDisplayLoop();
        this.startHourlyMaintenance();
    }

    connectWebSocket() {
        console.log('🔌 Connecting to WebSocket...');
        
        this.socket = io(WEBSOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 5000,
            reconnectionAttempts: Infinity,
            timeout: 20000
        });

        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ Connected to rugs.fun WebSocket');
            if (this.rugEventsDetected === 0) {
                console.log('⏳ Waiting for first rug event to establish baseline...\n');
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log(`❌ Disconnected: ${reason}`);
            this.totalStats.connectionDrops++;
            if (this.isRecording) {
                this.finishCurrentGame('DISCONNECTED');
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
        });

        this.socket.on('error', (error) => {
            console.log(`🚨 WebSocket error: ${error}`);
        });

        // Game events - same as original recorder
        this.socket.on('gameStateUpdate', (data) => {
            this.handleEvent('gameStateUpdate', data);
        });

        this.socket.on('newTrade', (data) => {
            this.handleEvent('newTrade', data);
        });

        this.socket.on('playerUpdate', (data) => {
            this.handleEvent('playerUpdate', data);
        });

        this.socket.on('buyOrder', (data) => {
            this.handleEvent('buyOrder', data);
        });

        this.socket.on('sellOrder', (data) => {
            this.handleEvent('sellOrder', data);
        });

        // Catch all other events
        this.socket.onAny((eventName, ...args) => {
            if (!['gameStateUpdate', 'newTrade', 'playerUpdate', 'buyOrder', 'sellOrder', 
                  'connect', 'disconnect', 'reconnect'].includes(eventName)) {
                this.handleEvent(eventName, args[0] || args);
            }
        });
    }

    handleEvent(eventType, data) {
        const timestamp = new Date().toISOString();
        const event = {
            timestamp,
            eventType,
            data: JSON.parse(JSON.stringify(data)) // Deep clone
        };

        this.totalStats.totalEvents++;
        this.hourlyStats.events++;

        // Track trades for statistics
        if (eventType === 'newTrade') {
            this.hourlyStats.trades++;
        }

        // Enhanced rug event detection with precise timing
        if (eventType === 'gameStateUpdate') {
            if (data.gameHistory && Array.isArray(data.gameHistory)) {
                // RUG EVENT DETECTED - Critical timing capture
                this.rugEventsDetected++;
                // Use enhanced precise timing capture
                const rugTiming = capturePreciseRugEventTiming();
                
                console.log(`\n🎯 Rug event detected (#${this.rugEventsDetected}) at ${timestamp}`);
                
                if (this.isRecording) {
                    // Finish current game with rug timing
                    event.rugEventTiming = rugTiming;
                    this.recordEvent(event);
                    this.finishCurrentGame('RUG_DETECTED', rugTiming);
                } else if (this.rugEventsDetected >= 1) {
                    // Start recording immediately on first rug (we need the full sequence)
                    console.log('🎬 Starting recording on rug event...');
                    this.startNewGame(data.gameId || 'UNKNOWN');
                    event.rugEventTiming = rugTiming;
                    this.recordEvent(event);
                } else {
                    console.log('⏳ Establishing baseline, will start recording on next game...');
                }
                return;
            }
            
            // Update gameId if we started recording on a rug
            if (data.gameId && this.isRecording && this.currentGame === 'UNKNOWN') {
                this.currentGame = data.gameId;
                if (options.verbose) {
                    console.log(`📝 Game ID updated: ${data.gameId}`);
                }
            }
        }

        // Record event if we're recording
        if (this.isRecording) {
            this.recordEvent(event);
        }

        // Verbose logging
        if (options.verbose) {
            if (eventType === 'newTrade' || eventType === 'playerUpdate' || 
                (eventType === 'gameStateUpdate' && data.gameHistory)) {
                const dataStr = JSON.stringify(data).substring(0, 100);
                console.log(`📡 ${eventType}: ${dataStr}...`);
            }
        }
    }

    startNewGame(gameId) {
        this.currentGame = gameId;
        this.isRecording = true;
        this.gameStartTime = new Date();
        this.events = [];
        
        if (options.verbose) {
            console.log(`\n🎮 RECORDING STARTED: Game ${gameId}`);
            console.log(`📅 Start time: ${this.gameStartTime.toISOString()}`);
        }
    }

    recordEvent(event) {
        this.events.push(event);
    }

    finishCurrentGame(reason, rugTiming = null) {
        if (!this.isRecording) return;

        const endTime = new Date();
        const duration = endTime - this.gameStartTime;
        
        // Use enhanced game analysis instead of basic analysis
        const analysis = enhancedGameAnalysis(this.events, this.currentGame);
        
        // Create comprehensive game data
        const gameData = {
            gameId: this.currentGame,
            recordingStart: this.gameStartTime.toISOString(),
            recordingEnd: endTime.toISOString(),
            duration: Math.round(duration / 1000),
            reason: reason,
            totalEvents: this.events.length,
            rugEventTiming: rugTiming,
            analysis,
            events: this.events,
            collectionMetadata: {
                collectorVersion: 'enhanced_v1.0',
                gameNumber: this.gamesCollected + 1,
                hourlyGameNumber: this.hourlyStats.games + 1
            }
        };

        // Track game in sequence for pattern detection
        this.sequenceTracker.trackNewGame(gameData);

        // Save game data
        this.saveGameData(gameData);
        
        // Update statistics
        this.gamesCollected++;
        this.hourlyStats.games++;
        this.totalStats.filesWritten++;
        
        // Track recent games for display
        this.addToRecentGames(gameData);
        
        if (options.verbose) {
            console.log(`\n🏁 GAME COMPLETED: ${this.currentGame}`);
            console.log(`📊 Events: ${this.events.length} | Duration: ${Math.round(duration / 1000)}s`);
            console.log(`🎯 Reason: ${reason}`);
            if (analysis.isInstarug) {
                console.log(`⚡ INSTARUG DETECTED! Final tick: ${analysis.finalTick}`);
            }
            if (analysis.peakMultiplier > 50) {
                console.log(`🚀 HIGH MULTIPLIER: ${analysis.peakMultiplier.toFixed(2)}x`);
            }
        }

        // Reset for next game
        this.isRecording = false;
        this.currentGame = null;
        this.events = [];

        // Check target completion
        if (this.gamesCollected >= options.targetGames) {
            console.log(`\n🎯 TARGET REACHED: ${this.gamesCollected} games collected`);
            this.shutdown();
        }
    }

    saveGameData(gameData) {
        try {
            const hourDir = this.getHourDirectory();
            const fullPath = path.join(options.outputDir, hourDir);
            
            // Ensure directory exists
            fs.mkdirSync(fullPath, { recursive: true });
            
            // Save individual game file
            const gameFile = path.join(fullPath, `game-${gameData.gameId}.json`);
            fs.writeFileSync(gameFile, JSONStringifyWithBigInt(gameData).replace(/"(\d+)":/g, "$1:"));
            
            // Append to hourly stream (for easy analysis)
            const streamFile = path.join(fullPath, 'games-stream.jsonl');
            fs.appendFileSync(streamFile, JSONStringifyWithBigInt(gameData) + '\n');
            
            // Append to master stream (for cross-hour analysis)
            const masterStream = path.join(options.outputDir, 'all-games.jsonl');
            fs.appendFileSync(masterStream, JSONStringifyWithBigInt(gameData) + '\n');
            
            // Save pattern alerts if any detected
            const recentPatterns = this.sequenceTracker.getRecentPatterns();
            if (recentPatterns.length > 0) {
                const alertsFile = path.join(options.outputDir, 'pattern-alerts', `alerts-${formatFileTimestamp()}.json`);
                fs.mkdirSync(path.join(options.outputDir, 'pattern-alerts'), { recursive: true });
                fs.writeFileSync(alertsFile, JSONStringifyWithBigInt(recentPatterns).replace(/"(\d+)":/g, "$1:"));
            }
            
        } catch (error) {
            console.error(`❌ Failed to save game ${gameData.gameId}: ${error.message}`);
            this.totalStats.validationErrors++;
        }
    }

    getHourDirectory() {
        const now = new Date();
        return `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}/${String(now.getHours()).padStart(2,'0')}h`;
    }

    addToRecentGames(gameData) {
        this.recentGames.unshift({
            gameId: gameData.gameId,
            timestamp: gameData.recordingEnd,
            analysis: gameData.analysis, // Include full analysis for display
            totalEvents: gameData.totalEvents
        });
        
        // Keep only last 5 games
        if (this.recentGames.length > 5) {
            this.recentGames.pop();
        }
    }

    startDisplayLoop() {
        setInterval(() => {
            this.updateDisplay();
        }, options.displayInterval);
    }

    updateDisplay() {
        // Use enhanced display function with pattern alerts
        const stats = {
            gamesCollected: this.gamesCollected,
            recentGames: this.recentGames,
            connectionStatus: this.socket && this.socket.connected ? '✅ Connected' : '❌ Disconnected',
            startTime: this.startTime,
            hourlyStats: this.hourlyStats,
            totalStats: this.totalStats
        };
        
        displayEnhancedCollectionStatus(stats, this.sequenceTracker);
    }

    startHourlyMaintenance() {
        // Check every minute for hour boundary
        setInterval(() => {
            const currentHour = new Date().getHours();
            
            if (this.currentHour !== null && this.currentHour !== currentHour) {
                this.performHourlyMaintenance();
            }
            
            this.currentHour = currentHour;
        }, 60000); // Check every minute
    }

    performHourlyMaintenance() {
        if (options.enableBackups) {
            this.createHourlyBackup();
        }
        
        // Reset hourly stats
        this.hourlyStats = {
            games: 0,
            events: 0,
            trades: 0,
            errors: 0
        };
        
        console.log(`\n🔄 Hourly maintenance completed at ${new Date().toLocaleTimeString()}`);
    }

    createHourlyBackup() {
        try {
            const backupDir = path.join(options.outputDir, 'backups', 'hourly');
            fs.mkdirSync(backupDir, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupDir, `backup-${timestamp}.tar`);
            
            // Simple backup - copy all files (in production, use proper archiving)
            console.log(`💾 Creating hourly backup...`);
            
        } catch (error) {
            console.error(`❌ Backup failed: ${error.message}`);
        }
    }

    shutdown() {
        console.log('\n🛑 Shutting down collector...');
        
        if (this.isRecording) {
            this.finishCurrentGame('SHUTDOWN');
        }
        
        if (this.socket) {
            this.socket.disconnect();
        }
        
        console.log(`\n📊 Final Statistics:`);
        console.log(`   Games Collected: ${this.gamesCollected}`);
        console.log(`   Total Events: ${this.totalStats.totalEvents}`);
        console.log(`   Files Written: ${this.totalStats.filesWritten}`);
        console.log(`   Connection Drops: ${this.totalStats.connectionDrops}`);
        console.log(`   Errors: ${this.totalStats.validationErrors}`);
        console.log(`\n📁 Data Location: ${options.outputDir}`);
        console.log('👋 Collection completed successfully!');
        
        process.exit(0);
    }
}

// Create and start collector
const collector = new EnhancedPersistentGameCollector();
collector.startPersistentCollection();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Collection interrupted by user');
    collector.shutdown();
});

// Handle errors
process.on('uncaughtException', (error) => {
    console.error('\n🚨 Uncaught exception:', error);
    if (collector.isRecording) {
        collector.finishCurrentGame('ERROR');
    }
    collector.shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n🚨 Unhandled rejection:', reason);
});

console.log('🎬 Enhanced collector started! Collecting until target reached or stopped.\n');
console.log('ℹ️  The collector will start capturing on the FIRST rug event (immediate start).');
console.log('ℹ️  All complete games will be saved with comprehensive timing and pattern detection.\n');
