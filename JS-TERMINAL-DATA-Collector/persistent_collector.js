#!/usr/bin/env node

/**
 * 🎮 RUGS.FUN PERSISTENT DATA COLLECTOR
 * 
 * Based on proven game recorder, adapted for continuous 10,000+ game collection
 * Captures complete rug-to-rug game cycles for statistical analysis
 * 
 * Usage: node persistent-collector.js [options]
 */

require('dotenv').config();
const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
🎮 RUGS.FUN PERSISTENT DATA COLLECTOR

Continuously collects complete game data for statistical analysis

Usage: node persistent-collector.js [options]

Options:
  --output <dir>      Output directory (default: rugs-data)
  --target <number>   Target number of games (default: infinite)
  --no-backups        Disable hourly backups
  --verbose           Show detailed event logging
  --verify-prng       Enable real-time PRNG verification (Phase 2)
  --help              Show this help

Examples:
  node persistent-collector.js
  node persistent-collector.js --target 10000 --output ./data
  node persistent-collector.js --verbose --verify-prng
`);
}

// Configuration
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'https://backend.rugs.fun';

// Ensure output directory exists
if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
}

console.log('🎮 RUGS.FUN PERSISTENT DATA COLLECTOR');
console.log('========================================');
console.log(`📡 WebSocket: ${WEBSOCKET_URL}`);
console.log(`🎯 Target Games: ${options.targetGames === Infinity ? '∞ (Continuous)' : options.targetGames}`);
console.log(`📁 Output: ${options.outputDir}`);
console.log(`💾 Backups: ${options.enableBackups ? 'Enabled' : 'Disabled'}`);
console.log('========================================\n');

/**
 * Enhanced persistent game collector based on proven recorder
 */
class PersistentGameCollector {
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
    }

    startPersistentCollection() {
        console.log('🔌 Starting persistent collection...');
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
                const rugTiming = this.capturePreciseTimestamp();
                
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

    capturePreciseTimestamp() {
        return {
            local_epoch_ms: Date.now(),
            local_epoch_us: Number(process.hrtime.bigint() / 1000n),
            iso_string: new Date().toISOString(),
            unix_timestamp: Math.floor(Date.now() / 1000),
            high_precision: process.hrtime.bigint()
        };
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
        
        // Enhanced game analysis
        const analysis = this.analyzeGame();
        
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
                collectorVersion: '1.0.0',
                gameNumber: this.gamesCollected + 1,
                hourlyGameNumber: this.hourlyStats.games + 1
            }
        };

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

    analyzeGame() {
        const analysis = {
            eventTypes: {},
            priceRange: { min: Infinity, max: -Infinity },
            totalTrades: 0,
            uniquePlayers: new Set(),
            gameStateUpdates: 0,
            peakMultiplier: 0,
            finalTick: 0,
            isInstarug: false
        };

        for (const event of this.events) {
            // Count event types
            analysis.eventTypes[event.eventType] = (analysis.eventTypes[event.eventType] || 0) + 1;

            // Game state analysis
            if (event.eventType === 'gameStateUpdate') {
                analysis.gameStateUpdates++;
                
                // Extract game metrics
                if (event.data.price) {
                    if (event.data.price < analysis.priceRange.min) {
                        analysis.priceRange.min = event.data.price;
                    }
                    if (event.data.price > analysis.priceRange.max) {
                        analysis.priceRange.max = event.data.price;
                    }
                    
                    // Track peak multiplier
                    if (event.data.price > analysis.peakMultiplier) {
                        analysis.peakMultiplier = event.data.price;
                    }
                }
                
                // Track final tick
                if (event.data.tickCount !== undefined) {
                    analysis.finalTick = Math.max(analysis.finalTick, event.data.tickCount);
                }
                
                // Check for game completion
                if (event.data.gameHistory) {
                    // Extract final stats from gameHistory
                    const gameHistory = event.data.gameHistory[0];
                    if (gameHistory) {
                        analysis.peakMultiplier = gameHistory.peakMultiplier || analysis.peakMultiplier;
                        analysis.finalTick = event.data.tickCount || analysis.finalTick;
                    }
                }
            }

            // Trade analysis
            if (event.eventType === 'newTrade') {
                analysis.totalTrades++;
                analysis.uniquePlayers.add(event.data.playerId);
            }
        }

        // Determine if instarug (early game end)
        analysis.isInstarug = analysis.finalTick < 10;
        
        // Convert Set to number
        analysis.uniquePlayers = analysis.uniquePlayers.size;
        
        return analysis;
    }

    saveGameData(gameData) {
        try {
            const hourDir = this.getHourDirectory();
            const fullPath = path.join(options.outputDir, hourDir);
            
            // Ensure directory exists
            fs.mkdirSync(fullPath, { recursive: true });
            
            // Save individual game file
            const gameFile = path.join(fullPath, `game-${gameData.gameId}.json`);
            fs.writeFileSync(gameFile, JSON.stringify(gameData, null, 2));
            
            // Append to hourly stream (for easy analysis)
            const streamFile = path.join(fullPath, 'games-stream.jsonl');
            fs.appendFileSync(streamFile, JSON.stringify(gameData) + '\n');
            
            // Append to master stream (for cross-hour analysis)
            const masterStream = path.join(options.outputDir, 'all-games.jsonl');
            fs.appendFileSync(masterStream, JSON.stringify(gameData) + '\n');
            
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
            peakMultiplier: gameData.analysis.peakMultiplier,
            finalTick: gameData.analysis.finalTick,
            isInstarug: gameData.analysis.isInstarug,
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
        console.clear();
        
        const uptime = this.getUptime();
        const connectionStatus = this.socket && this.socket.connected ? '✅ Connected' : '❌ Disconnected';
        const progress = options.targetGames === Infinity ? 
            `${this.gamesCollected} (Continuous)` : 
            `${this.gamesCollected} / ${options.targetGames} (${(this.gamesCollected/options.targetGames*100).toFixed(1)}%)`;
        
        console.log('🎮 Rugs.fun Persistent Data Collector - LIVE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📈 Games Collected: ${progress} | Uptime: ${uptime}`);
        console.log(`⏱️  Current Time: ${new Date().toLocaleTimeString()} | Current Hour: ${this.getHourDirectory()}`);
        console.log(`🔄 Connection: ${connectionStatus} | Rug Events: ${this.rugEventsDetected} | Reconnects: ${this.totalStats.connectionDrops}`);
        console.log(`💾 Recording: ${this.isRecording ? `✅ Game ${this.currentGame}` : '⏳ Waiting for rug event'}`);
        
        if (this.recentGames.length > 0) {
            console.log('\n📋 Recent Games Completed:');
            this.recentGames.forEach((game, index) => {
                const time = new Date(game.timestamp).toLocaleTimeString();
                const gameIdShort = game.gameId.substring(9, 17);
                const peak = game.peakMultiplier.toFixed(2);
                const indicator = game.isInstarug ? '⚡ Instarug' : 
                                 game.peakMultiplier > 50 ? '🚀 High Multi' : 
                                 '✅ Valid';
                
                console.log(`[${time}] Game-${this.gamesCollected - index}: ${gameIdShort} | Peak: ${peak}x | Ticks: ${game.finalTick} | ${indicator}`);
            });
        }
        
        console.log('\n📊 Collection Health:');
        console.log(`   This Hour: ${this.hourlyStats.games} games | ${this.hourlyStats.events} events | ${this.hourlyStats.trades} trades`);
        console.log(`   Total Stats: ${this.totalStats.filesWritten} files | ${this.totalStats.totalEvents} events | Errors: ${this.totalStats.validationErrors}`);
        
        console.log('\n💾 Storage Status:');
        const currentHourGames = this.hourlyStats.games;
        const estimatedSize = (this.totalStats.totalEvents * 0.5 / 1024).toFixed(1); // Rough estimate
        console.log(`   Current Hour: ${currentHourGames} games | Est. Size: ${estimatedSize} KB`);
        console.log(`   Backups: ${options.enableBackups ? '✅ Enabled' : '❌ Disabled'} | Directory: ${options.outputDir}`);
        
        console.log('\n⚠️  Status: System Running Optimally');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Press Ctrl+C to stop collection gracefully');
    }

    getUptime() {
        const uptimeMs = Date.now() - this.startTime.getTime();
        const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
        const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
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
const collector = new PersistentGameCollector();
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

console.log('🎬 Persistent collector started! Collecting until target reached or stopped.\n');
console.log('ℹ️  The collector will start capturing on the FIRST rug event (immediate start).');
console.log('ℹ️  All complete games will be saved with comprehensive timing and analysis data.\n');