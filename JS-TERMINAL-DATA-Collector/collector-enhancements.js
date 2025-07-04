// COMPLETE ENHANCEMENT MODULE - COPY EXACTLY AS-IS
// File: enhancements/collector-enhancements.js

const crypto = require('crypto');

/**
 * 1. PRECISE TIMING CAPTURE FOR PRNG ANALYSIS
 */
function capturePreciseRugEventTiming() {
    const now = Date.now();
    const hrTime = process.hrtime.bigint();
    const isoTime = new Date().toISOString();
    
    return {
        // Core timing data
        local_epoch_ms: now,
        local_epoch_us: Number(hrTime / 1000n),
        high_precision_ns: hrTime,
        iso_timestamp: isoTime,
        
        // Various timestamp formats for seed generation testing
        unix_timestamp: Math.floor(now / 1000),
        unix_timestamp_ms: now,
        
        // Formatted timestamps (common in gaming systems)
        yyyymmdd: isoTime.slice(0,10).replace(/-/g,''),
        hhmmss: isoTime.slice(11,19).replace(/:/g,''),
        yyyymmddhhmmss: isoTime.slice(0,19).replace(/[-:T]/g,''),
        
        // System performance data
        performance_now: performance.now(),
        
        // Collection metadata
        collector_version: "enhanced_v1.0",
        node_version: process.version,
        platform: process.platform
    };
}

/**
 * 2. ENHANCED GAME ANALYSIS WITH CROSS-GAME PATTERN DETECTION
 */
function enhancedGameAnalysis(events, gameId) {
    const analysis = {
        // Core metrics (preserved from original)
        eventTypes: {},
        totalTrades: 0,
        uniquePlayers: new Set(),
        priceRange: { min: Infinity, max: -Infinity },
        
        // Enhanced metrics for pattern detection
        peakMultiplier: 0,
        finalTick: 0,
        isInstarug: false,
        rugEventTiming: null,
        gameStateUpdates: 0,
        
        // New: Advanced metrics
        tickIntervals: [],
        priceProgression: [],
        tradingActivity: {
            buyOrders: 0,
            sellOrders: 0,
            volumeByTick: {},
            playerActivity: {}
        },
        
        // Timing irregularities
        timingMetrics: {
            avgTickInterval: 0,
            tickVariance: 0,
            suspiciousGaps: 0
        }
    };

    let lastTickTime = null;
    let gameStartTime = null;

    // Process all events
    for (const event of events) {
        const eventTime = new Date(event.timestamp);
        
        // Count event types
        analysis.eventTypes[event.eventType] = (analysis.eventTypes[event.eventType] || 0) + 1;

        if (event.eventType === 'gameStateUpdate') {
            analysis.gameStateUpdates++;
            const data = event.data;
            
            // Track game start
            if (!gameStartTime && data.active && data.tickCount === 0) {
                gameStartTime = eventTime;
            }
            
            // Track price progression
            if (data.price !== undefined) {
                analysis.priceRange.min = Math.min(analysis.priceRange.min, data.price);
                analysis.priceRange.max = Math.max(analysis.priceRange.max, data.price);
                analysis.peakMultiplier = Math.max(analysis.peakMultiplier, data.price);
                
                // Record price progression for volatility analysis
                analysis.priceProgression.push({
                    tick: data.tickCount,
                    price: data.price,
                    timestamp: event.timestamp
                });
            }
            
            // Track tick intervals for timing analysis
            if (data.tickCount !== undefined && lastTickTime) {
                const interval = eventTime - lastTickTime;
                analysis.tickIntervals.push(interval);
                
                // Flag suspicious timing gaps (>2 seconds between ticks)
                if (interval > 2000) {
                    analysis.timingMetrics.suspiciousGaps++;
                }
            }
            
            if (data.tickCount !== undefined) {
                analysis.finalTick = Math.max(analysis.finalTick, data.tickCount);
                lastTickTime = eventTime;
            }
            
            // Capture rug event timing
            if (data.gameHistory && Array.isArray(data.gameHistory)) {
                analysis.rugEventTiming = event.rugEventTiming || capturePreciseRugEventTiming();
                
                // Extract final stats from gameHistory
                const gameHistory = data.gameHistory[0];
                if (gameHistory) {
                    analysis.peakMultiplier = gameHistory.peakMultiplier || analysis.peakMultiplier;
                    analysis.finalTick = data.tickCount || analysis.finalTick;
                }
            }
        }
        
        // Enhanced trade analysis
        if (event.eventType === 'newTrade') {
            analysis.totalTrades++;
            analysis.uniquePlayers.add(event.data.playerId);
            
            const tick = event.data.tickIndex || 0;
            
            if (event.data.type === 'buy') {
                analysis.tradingActivity.buyOrders++;
            } else if (event.data.type === 'sell') {
                analysis.tradingActivity.sellOrders++;
            }
            
            // Track volume by tick
            if (!analysis.tradingActivity.volumeByTick[tick]) {
                analysis.tradingActivity.volumeByTick[tick] = 0;
            }
            analysis.tradingActivity.volumeByTick[tick] += event.data.qty || 0;
            
            // Track player activity
            const playerId = event.data.playerId;
            if (!analysis.tradingActivity.playerActivity[playerId]) {
                analysis.tradingActivity.playerActivity[playerId] = { trades: 0, volume: 0 };
            }
            analysis.tradingActivity.playerActivity[playerId].trades++;
            analysis.tradingActivity.playerActivity[playerId].volume += event.data.qty || 0;
        }
    }

    // Calculate derived metrics
    analysis.isInstarug = analysis.finalTick < 10;
    analysis.uniquePlayers = analysis.uniquePlayers.size;
    
    // Calculate timing metrics
    if (analysis.tickIntervals.length > 0) {
        const avgInterval = analysis.tickIntervals.reduce((a, b) => a + b, 0) / analysis.tickIntervals.length;
        analysis.timingMetrics.avgTickInterval = avgInterval;
        
        const variance = analysis.tickIntervals.reduce((acc, interval) => 
            acc + Math.pow(interval - avgInterval, 2), 0) / analysis.tickIntervals.length;
        analysis.timingMetrics.tickVariance = Math.sqrt(variance);
    }
    
    return analysis;
}

/**
 * 3. CROSS-GAME SEQUENCE TRACKER FOR PATTERN DETECTION
 */
class CrossGameSequenceTracker {
    constructor() {
        this.gameSequence = [];
        this.lastRugTime = null;
        this.hourlyGameCount = 0;
        this.currentHour = new Date().getHours();
        this.patternAlerts = [];
        
        // Pattern detection thresholds
        this.HIGH_MULTI_THRESHOLD = 50;
        this.INSTARUG_CLUSTER_THRESHOLD = 3;
        this.UNUSUAL_PEAK_THRESHOLD = 30;
    }
    
    trackNewGame(gameData) {
        const currentHour = new Date().getHours();
        
        // Reset hourly counter if hour changed
        if (this.currentHour !== currentHour) {
            this.hourlyGameCount = 0;
            this.currentHour = currentHour;
        }
        
        this.hourlyGameCount++;
        
        // Calculate time since last rug
        const timeSinceLastRug = this.lastRugTime ? 
            (Date.now() - this.lastRugTime) / 1000 : null;
        
        // Add sequence metadata
        if (!gameData.collectionMetadata) {
            gameData.collectionMetadata = {};
        }
        
        gameData.collectionMetadata.hourlyGameNumber = this.hourlyGameCount;
        gameData.collectionMetadata.timeSinceLastRug = timeSinceLastRug;
        gameData.collectionMetadata.sequencePosition = this.gameSequence.length + 1;
        
        // Track in sequence
        const gameInfo = {
            gameId: gameData.gameId,
            peakMultiplier: gameData.analysis.peakMultiplier,
            isInstarug: gameData.analysis.isInstarug,
            finalTick: gameData.analysis.finalTick,
            timestamp: Date.now(),
            sequenceNumber: this.gameSequence.length + 1
        };
        
        this.gameSequence.push(gameInfo);
        
        // Detect patterns
        this.detectPatterns(gameInfo);
        
        // Keep only last 100 games in memory for performance
        if (this.gameSequence.length > 100) {
            this.gameSequence.shift();
        }
        
        // Update last rug time
        this.lastRugTime = Date.now();
        
        return gameData;
    }
    
    detectPatterns(currentGame) {
        if (this.gameSequence.length < 2) return;
        
        const recent = this.gameSequence.slice(-5); // Last 5 games
        const previous = this.gameSequence[this.gameSequence.length - 2]; // Previous game
        
        // Pattern 1: High Multiplier → Instarug
        if (previous.peakMultiplier > this.HIGH_MULTI_THRESHOLD && currentGame.isInstarug) {
            this.patternAlerts.push({
                type: 'HIGH_MULTI_TO_INSTARUG',
                severity: 'HIGH',
                data: {
                    prevPeak: previous.peakMultiplier,
                    currentTicks: currentGame.finalTick,
                    games: [previous.gameId, currentGame.gameId]
                },
                timestamp: Date.now()
            });
        }
        
        // Pattern 2: Instarug Clusters
        const recentInstarugs = recent.filter(g => g.isInstarug).length;
        if (recentInstarugs >= this.INSTARUG_CLUSTER_THRESHOLD) {
            this.patternAlerts.push({
                type: 'INSTARUG_CLUSTER',
                severity: 'MEDIUM',
                data: {
                    clusterSize: recentInstarugs,
                    recentGames: recent.map(g => ({ gameId: g.gameId, isInstarug: g.isInstarug }))
                },
                timestamp: Date.now()
            });
        }
        
        // Pattern 3: Unusual Peak Distribution
        if (recent.length >= 5) {
            const avgPeak = recent.reduce((sum, g) => sum + g.peakMultiplier, 0) / recent.length;
            if (avgPeak > this.UNUSUAL_PEAK_THRESHOLD) {
                this.patternAlerts.push({
                    type: 'UNUSUAL_PEAK_DISTRIBUTION',
                    severity: 'LOW',
                    data: {
                        avgPeak: avgPeak,
                        peaks: recent.map(g => g.peakMultiplier)
                    },
                    timestamp: Date.now()
                });
            }
        }
        
        // Keep only recent alerts (last 50)
        if (this.patternAlerts.length > 50) {
            this.patternAlerts = this.patternAlerts.slice(-50);
        }
    }
    
    getRecentPatterns() {
        // Return alerts from last 5 minutes
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        return this.patternAlerts.filter(alert => alert.timestamp > fiveMinutesAgo);
    }
    
    getSequenceStats() {
        if (this.gameSequence.length === 0) return null;
        
        const recent10 = this.gameSequence.slice(-10);
        
        return {
            totalGames: this.gameSequence.length,
            recentInstarugRate: recent10.filter(g => g.isInstarug).length / recent10.length,
            avgRecentPeak: recent10.reduce((sum, g) => sum + g.peakMultiplier, 0) / recent10.length,
            alertsCount: this.patternAlerts.length
        };
    }
}

/**
 * 4. ENHANCED CONSOLE DISPLAY WITH PATTERN ALERTS
 */
function displayEnhancedCollectionStatus(stats, sequenceTracker) {
    console.clear();
    
    const uptime = formatUptime(stats.startTime);
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100;
    
    // Header
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎮 RUGS.FUN ENHANCED DATA COLLECTOR v1.0');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // System Status
    console.log(`📊 SYSTEM STATUS: ${stats.connectionStatus}`);
    console.log(`⏱️  Uptime: ${uptime}`);
    console.log(`💾 Memory: ${heapUsedMB}MB / ${heapTotalMB}MB`);
    console.log(`🕒 Current Time: ${new Date().toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Collection Stats
    console.log(`📈 COLLECTION STATS:`);
    console.log(`🎯 Games Collected: ${stats.gamesCollected}`);
    
    // Sequence Stats
    const seqStats = sequenceTracker ? sequenceTracker.getSequenceStats() : null;
    if (seqStats) {
        console.log(`🔄 Recent Instarug Rate: ${(seqStats.recentInstarugRate * 100).toFixed(1)}%`);
        console.log(`📊 Avg Recent Peak: ${seqStats.avgRecentPeak.toFixed(2)}x`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Recent Games
    console.log('🎲 RECENT GAMES:');
    if (stats.recentGames && stats.recentGames.length > 0) {
        const recentGames = stats.recentGames.slice(-5); // Last 5 games
        
        recentGames.forEach((game, i) => {
            const gameTime = new Date(game.timestamp).toLocaleTimeString();
            const peakMulti = game.analysis ? game.analysis.peakMultiplier.toFixed(2) : 'N/A';
            const instarug = game.analysis && game.analysis.isInstarug ? '⚡ INSTARUG!' : '';
            
            console.log(`   ${i+1}. Game ${game.gameId} @ ${gameTime} - Peak: ${peakMulti}x ${instarug}`);
        });
    } else {
        console.log('   No games collected yet...');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Pattern Alerts
    console.log('⚠️  PATTERN ALERTS:');
    if (sequenceTracker) {
        const recentPatterns = sequenceTracker.getRecentPatterns();
        
        if (recentPatterns.length > 0) {
            recentPatterns.slice(-3).forEach((alert, i) => { // Show last 3 alerts
                const alertTime = new Date(alert.timestamp).toLocaleTimeString();
                let severity = '';
                
                if (alert.severity === 'HIGH') severity = '🔴';
                else if (alert.severity === 'MEDIUM') severity = '🟠';
                else severity = '🟡';
                
                console.log(`   ${severity} [${alertTime}] ${alert.type}`);
                
                // Show alert details based on type
                if (alert.type === 'HIGH_MULTI_TO_INSTARUG') {
                    console.log(`      Previous game: ${alert.data.prevPeak}x → Current: ${alert.data.currentTicks} ticks`);
                } else if (alert.type === 'INSTARUG_CLUSTER') {
                    console.log(`      ${alert.data.clusterSize} instarugs in last 5 games`);
                } else if (alert.type === 'UNUSUAL_PEAK_DISTRIBUTION') {
                    console.log(`      Avg peak: ${alert.data.avgPeak.toFixed(2)}x (threshold: ${sequenceTracker.UNUSUAL_PEAK_THRESHOLD}x)`);
                }
            });
        } else {
            console.log('   No pattern alerts detected yet...');
        }
    } else {
        console.log('   Pattern detection not initialized...');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Press Ctrl+C to stop collection gracefully');
}

/**
 * 5. UTILITY FUNCTIONS
 */
function formatUptime(startTime) {
    const uptime = Date.now() - startTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function generateUniqueId() {
    return crypto.randomBytes(8).toString('hex');
}

function formatFileTimestamp() {
    const now = new Date();
    return now.toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .split('.')[0];
}

function createDataDirectories() {
    const fs = require('fs');
    const path = require('path');
    
    const dirs = [
        './rugs-data',
        './rugs-data/complete-games',
        './rugs-data/pattern-alerts',
        './rugs-data/analytics'
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
}

// Export all enhancement functions
module.exports = {
    capturePreciseRugEventTiming,
    enhancedGameAnalysis,
    CrossGameSequenceTracker,
    displayEnhancedCollectionStatus,
    formatUptime,
    generateUniqueId,
    formatFileTimestamp,
    createDataDirectories
};
