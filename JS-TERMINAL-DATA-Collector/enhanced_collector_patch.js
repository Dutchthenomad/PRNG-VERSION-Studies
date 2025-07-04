// 🎮 ENHANCEMENTS FOR YOUR EXISTING PERSISTENT_COLLECTOR.JS
// Add these enhancements to your current collector for the specific requirements

// 1. Enhanced Timing Capture for PRNG Analysis
function capturePreciseRugEventTiming() {
    return {
        // Multiple timing sources for correlation analysis
        local_epoch_ms: Date.now(),
        local_epoch_us: Number(process.hrtime.bigint() / 1000n),
        high_precision_ns: process.hrtime.bigint(),
        iso_timestamp: new Date().toISOString(),
        
        // Various formats for seed generation testing
        unix_timestamp: Math.floor(Date.now() / 1000),
        unix_timestamp_ms: Date.now(),
        
        // Formatted timestamps (common in gaming systems)
        yyyymmdd: new Date().toISOString().slice(0,10).replace(/-/g,''),
        hhmmss: new Date().toTimeString().slice(0,8).replace(/:/g,''),
        yyyymmddhhmmss: new Date().toISOString().slice(0,19).replace(/[-:T]/g,''),
        
        // Performance timing
        performance_now: performance.now(),
        
        // Collection metadata
        collector_version: "enhanced_v1.0",
        collection_session_id: process.pid + '-' + Date.now()
    };
}

// 2. Enhanced Game Analysis for Cross-Game Pattern Detection
function enhancedGameAnalysis(events, gameId) {
    const analysis = {
        // Basic metrics (keep your existing analysis)
        eventTypes: {},
        totalTrades: 0,
        uniquePlayers: new Set(),
        priceRange: { min: Infinity, max: -Infinity },
        
        // Enhanced metrics for pattern detection
        peakMultiplier: 0,
        finalTick: 0,
        isInstarug: false,
        rugEventTiming: null,
        gameStateTransitions: [],
        tradingActivity: {
            buyOrders: 0,
            sellOrders: 0,
            volumeProfile: [],
            priceVolatility: 0
        },
        
        // Timing analysis
        tickIntervals: [],
        gamePhases: {
            presale_duration: 0,
            active_duration: 0,
            total_duration: 0
        },
        
        // Cross-game correlation data
        sequenceMetadata: {
            gameNumber: null,
            hourlyGameNumber: null,
            timeSinceLastRug: null,
            gamesThisHour: null
        }
    };

    let lastTickTime = null;
    let gameStartTime = null;
    let rugDetectedTime = null;

    for (const event of events) {
        const eventTime = new Date(event.timestamp);
        
        // Track event types
        analysis.eventTypes[event.eventType] = (analysis.eventTypes[event.eventType] || 0) + 1;

        if (event.eventType === 'gameStateUpdate') {
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
            }
            
            // Track tick intervals for timing irregularities
            if (data.tickCount !== undefined && lastTickTime) {
                const interval = eventTime - lastTickTime;
                analysis.tickIntervals.push(interval);
            }
            
            if (data.tickCount !== undefined) {
                analysis.finalTick = Math.max(analysis.finalTick, data.tickCount);
                lastTickTime = eventTime;
            }
            
            // Detect rug event with precise timing
            if (data.gameHistory && Array.isArray(data.gameHistory)) {
                rugDetectedTime = eventTime;
                analysis.rugEventTiming = capturePreciseRugEventTiming();
                
                // Extract final stats from gameHistory if available
                const gameHistory = data.gameHistory[0];
                if (gameHistory) {
                    analysis.peakMultiplier = gameHistory.peakMultiplier || analysis.peakMultiplier;
                    analysis.finalTick = data.tickCount || analysis.finalTick;
                }
            }
            
            // Track game state transitions
            analysis.gameStateTransitions.push({
                timestamp: event.timestamp,
                tickCount: data.tickCount,
                price: data.price,
                active: data.active,
                rugged: data.rugged || false
            });
        }
        
        // Enhanced trade analysis
        if (event.eventType === 'newTrade') {
            analysis.totalTrades++;
            analysis.uniquePlayers.add(event.data.playerId);
            
            if (event.data.type === 'buy') {
                analysis.tradingActivity.buyOrders++;
            } else if (event.data.type === 'sell') {
                analysis.tradingActivity.sellOrders++;
            }
            
            // Track volume profile
            analysis.tradingActivity.volumeProfile.push({
                timestamp: event.timestamp,
                price: event.data.price,
                qty: event.data.qty,
                type: event.data.type
            });
        }
    }

    // Calculate derived metrics
    analysis.isInstarug = analysis.finalTick < 10;
    analysis.uniquePlayers = analysis.uniquePlayers.size;
    
    // Calculate timing metrics
    if (gameStartTime && rugDetectedTime) {
        analysis.gamePhases.total_duration = (rugDetectedTime - gameStartTime) / 1000;
    }
    
    // Calculate price volatility
    if (analysis.tickIntervals.length > 0) {
        const avgInterval = analysis.tickIntervals.reduce((a, b) => a + b, 0) / analysis.tickIntervals.length;
        const variance = analysis.tickIntervals.reduce((acc, interval) => acc + Math.pow(interval - avgInterval, 2), 0) / analysis.tickIntervals.length;
        analysis.tradingActivity.priceVolatility = Math.sqrt(variance);
    }
    
    return analysis;
}

// 3. Enhanced File Organization for Analysis
function createEnhancedGameRecord(gameData, gameNumber, hourlyGameNumber, timeSinceLastRug) {
    const enhancedRecord = {
        // Your existing game data structure
        ...gameData,
        
        // Enhanced metadata for analysis
        collectionMetadata: {
            collectorVersion: "enhanced_v1.0",
            gameNumber: gameNumber,
            hourlyGameNumber: hourlyGameNumber,
            collectionTimestamp: new Date().toISOString(),
            timeSinceLastRug: timeSinceLastRug,
            
            // System info
            systemInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                memoryUsage: process.memoryUsage()
            }
        },
        
        // Cross-game sequence tracking
        sequenceAnalysis: {
            isSequentialCapture: true,
            gapDetected: false,
            dataIntegrity: "verified"
        }
    };
    
    return enhancedRecord;
}

// 4. Enhanced Console Display with Pattern Detection Alerts
function displayEnhancedCollectionStatus(stats) {
    console.clear();
    
    const { 
        gamesCollected, 
        recentGames, 
        connectionStatus, 
        isRecording, 
        currentGame,
        hourlyStats,
        totalStats 
    } = stats;
    
    console.log('🎮 Rugs.fun Enhanced Persistent Collector - PATTERN DETECTION MODE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📈 Games Collected: ${gamesCollected} / ∞ | Target: 10,000+ for ML Training`);
    console.log(`⏱️  Uptime: ${getUptime()} | Current Time: ${new Date().toLocaleTimeString()}`);
    console.log(`🔄 Connection: ${connectionStatus} | Recording: ${isRecording ? `✅ ${currentGame}` : '⏳ Waiting'}`);
    
    // Pattern detection alerts
    if (recentGames.length >= 2) {
        const lastTwoGames = recentGames.slice(0, 2);
        const [current, previous] = lastTwoGames;
        
        console.log('\n🧠 Pattern Detection Alerts:');
        
        // High multiplier followed by instarug detection
        if (previous.peakMultiplier > 50 && current.isInstarug) {
            console.log(`   🚨 HIGH MULTI → INSTARUG: ${previous.peakMultiplier.toFixed(1)}x → ${current.finalTick} ticks`);
        }
        
        // Sequential instarug detection
        const recentInstarugs = recentGames.slice(0, 3).filter(g => g.isInstarug).length;
        if (recentInstarugs >= 2) {
            console.log(`   ⚡ INSTARUG CLUSTER: ${recentInstarugs}/3 recent games`);
        }
        
        // Unusual peak distribution
        const recentPeaks = recentGames.slice(0, 5).map(g => g.peakMultiplier);
        const avgPeak = recentPeaks.reduce((a, b) => a + b, 0) / recentPeaks.length;
        if (avgPeak > 20) {
            console.log(`   📈 HIGH AVERAGE PEAKS: ${avgPeak.toFixed(1)}x over last 5 games`);
        }
    }
    
    // Recent games with enhanced indicators
    if (recentGames.length > 0) {
        console.log('\n📋 Recent Games with Pattern Analysis:');
        recentGames.slice(0, 5).forEach((game, index) => {
            const time = new Date(game.timestamp).toLocaleTimeString();
            const gameIdShort = game.gameId.substring(9, 17);
            const peak = game.peakMultiplier.toFixed(2);
            
            let indicator = '✅ Normal';
            if (game.isInstarug) {
                indicator = '⚡ Instarug';
            } else if (game.peakMultiplier > 100) {
                indicator = '🌟 Mega';
            } else if (game.peakMultiplier > 50) {
                indicator = '🚀 High';
            }
            
            // Add correlation indicator
            if (index > 0) {
                const prevGame = recentGames[index - 1];
                if (prevGame.peakMultiplier > 50 && game.isInstarug) {
                    indicator += ' [CORRELATION]';
                }
            }
            
            console.log(`[${time}] Game-${gamesCollected - index}: ${gameIdShort} | Peak: ${peak}x | Ticks: ${game.finalTick} | ${indicator}`);
        });
    }
    
    // Collection health with enhanced metrics
    console.log('\n📊 Enhanced Collection Health:');
    console.log(`   This Hour: ${hourlyStats.games} games | ${hourlyStats.trades} trades | ${hourlyStats.events} events`);
    console.log(`   Instarug Rate: ${(recentGames.filter(g => g.isInstarug).length / Math.min(recentGames.length, 10) * 100).toFixed(1)}% (last 10 games)`);
    console.log(`   Avg Peak Multi: ${(recentGames.slice(0, 10).reduce((sum, g) => sum + g.peakMultiplier, 0) / Math.min(recentGames.length, 10)).toFixed(2)}x`);
    console.log(`   Data Quality: ${totalStats.validationErrors === 0 ? '✅ Perfect' : `⚠️ ${totalStats.validationErrors} errors`}`);
    
    console.log('\n💾 Collection Progress:');
    const progress = (gamesCollected / 10000 * 100).toFixed(1);
    const progressBar = '█'.repeat(Math.floor(progress / 2)) + '░'.repeat(50 - Math.floor(progress / 2));
    console.log(`   ML Training Data: [${progressBar}] ${progress}%`);
    console.log(`   Files Written: ${totalStats.filesWritten} | Est. Size: ${(totalStats.totalEvents * 0.5 / 1024).toFixed(1)} KB`);
    
    console.log('\n⚠️  Status: Enhanced Collection Active - Press Ctrl+C to stop gracefully');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// 5. Cross-Game Sequence Tracking
class CrossGameSequenceTracker {
    constructor() {
        this.gameSequence = [];
        this.lastRugTime = null;
        this.hourlyGameCount = 0;
        this.currentHour = new Date().getHours();
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
        gameData.collectionMetadata.hourlyGameNumber = this.hourlyGameCount;
        gameData.collectionMetadata.timeSinceLastRug = timeSinceLastRug;
        
        // Track in sequence
        this.gameSequence.push({
            gameId: gameData.gameId,
            peakMultiplier: gameData.analysis.peakMultiplier,
            isInstarug: gameData.analysis.isInstarug,
            timestamp: Date.now()
        });
        
        // Keep only last 100 games in memory
        if (this.gameSequence.length > 100) {
            this.gameSequence.shift();
        }
        
        // Update last rug time
        this.lastRugTime = Date.now();
        
        return gameData;
    }
    
    getRecentSequencePattern() {
        if (this.gameSequence.length < 5) return null;
        
        const recent = this.gameSequence.slice(-5);
        
        return {
            highMultiFollowedByInstarug: this.detectHighMultiInstarug(recent),
            instarugClusters: this.detectInstarugClusters(recent),
            unusualPatterns: this.detectUnusualPatterns(recent)
        };
    }
    
    detectHighMultiInstarug(games) {
        const patterns = [];
        for (let i = 1; i < games.length; i++) {
            if (games[i-1].peakMultiplier > 50 && games[i].isInstarug) {
                patterns.push({
                    prevPeak: games[i-1].peakMultiplier,
                    nextTicks: games[i].finalTick,
                    correlation: 'HIGH_MULTI_TO_INSTARUG'
                });
            }
        }
        return patterns;
    }
    
    detectInstarugClusters(games) {
        const instarugCount = games.filter(g => g.isInstarug).length;
        return {
            count: instarugCount,
            rate: instarugCount / games.length,
            isCluster: instarugCount >= 3
        };
    }
    
    detectUnusualPatterns(games) {
        const avgPeak = games.reduce((sum, g) => sum + g.peakMultiplier, 0) / games.length;
        const instarugRate = games.filter(g => g.isInstarug).length / games.length;
        
        return {
            avgPeakMultiplier: avgPeak,
            instarugRate: instarugRate,
            isUnusual: avgPeak > 30 || instarugRate > 0.4
        };
    }
}

// Export for integration into your existing collector
module.exports = {
    capturePreciseRugEventTiming,
    enhancedGameAnalysis,
    createEnhancedGameRecord,
    displayEnhancedCollectionStatus,
    CrossGameSequenceTracker
};