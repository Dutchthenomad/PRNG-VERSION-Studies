/**
 * 🎮 PRNG Collection Dashboard Client
 * 
 * Real-time dashboard for monitoring PRNG data collection
 * Handles Socket.IO connections, UI updates, and user interactions
 */

// Global variables
let socket = null;
let collectionChart = null;
let gameHistoryData = [];
let isAutoScrollEnabled = true;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeSocket();
    initializeChart();
    setupEventListeners();
    addLogEntry('system', 'Dashboard initialized');
});

/**
 * Initialize Socket.IO connection
 */
function initializeSocket() {
    socket = io();
    
    socket.on('connect', function() {
        addLogEntry('system', 'Connected to dashboard server');
        updateSystemStatus('connected');
        socket.emit('request-stats');
    });
    
    socket.on('disconnect', function() {
        addLogEntry('error', 'Disconnected from dashboard server');
        updateSystemStatus('disconnected');
    });
    
    socket.on('stats-update', function(stats) {
        updateStats(stats);
    });
    
    socket.on('file-added', function(data) {
        addLogEntry('success', `New file: ${data.path.split('/').pop()}`);
        updateStats(data.stats);
    });
    
    socket.on('file-changed', function(data) {
        addLogEntry('system', `File updated: ${data.path.split('/').pop()}`);
        updateStats(data.stats);
    });
    
    socket.on('collector-status', function(data) {
        const message = data.running ? 
            `Collector started (PID: ${data.pid})` : 
            `Collector stopped (Exit code: ${data.exitCode || 'N/A'})`;
        addLogEntry(data.running ? 'success' : 'warning', message);
        updateCollectorStatus(data.running, data.pid);
    });
    
    socket.on('collector-log', function(data) {
        const logType = data.type === 'stderr' ? 'error' : 'system';
        addLogEntry(logType, `Collector: ${data.message}`);
    });
    
    socket.on('connect_error', function(error) {
        addLogEntry('error', `Connection error: ${error.message}`);
        updateSystemStatus('error');
    });
}

/**
 * Initialize the collection progress chart
 */
function initializeChart() {
    const ctx = document.getElementById('collection-chart').getContext('2d');
    
    collectionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Games Collected',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            }
        }
    });
}

/**
 * Setup event listeners for user interactions
 */
function setupEventListeners() {
    // Start collector button
    document.getElementById('start-collector').addEventListener('click', function() {
        this.disabled = true;
        this.innerHTML = '<span>🔄 Starting...</span>';
        
        fetch('/api/collector/start', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                addLogEntry(data.success ? 'success' : 'error', data.message);
                updateControlStatus(data.message);
            })
            .catch(error => {
                addLogEntry('error', `Failed to start collector: ${error.message}`);
                updateControlStatus('Error starting collector');
            })
            .finally(() => {
                this.disabled = false;
                this.innerHTML = '<span>▶️ Start Collector</span>';
            });
    });
    
    // Stop collector button
    document.getElementById('stop-collector').addEventListener('click', function() {
        this.disabled = true;
        this.innerHTML = '<span>🔄 Stopping...</span>';
        
        fetch('/api/collector/stop', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                addLogEntry(data.success ? 'success' : 'error', data.message);
                updateControlStatus(data.message);
            })
            .catch(error => {
                addLogEntry('error', `Failed to stop collector: ${error.message}`);
                updateControlStatus('Error stopping collector');
            })
            .finally(() => {
                this.disabled = false;
                this.innerHTML = '<span>⏹️ Stop Collector</span>';
            });
    });
    
    // Refresh stats button
    document.getElementById('refresh-stats').addEventListener('click', function() {
        this.disabled = true;
        this.innerHTML = '<span>🔄 Refreshing...</span>';
        
        socket.emit('request-stats');
        loadRecentGames();
        
        setTimeout(() => {
            this.disabled = false;
            this.innerHTML = '<span>🔄 Refresh Stats</span>';
        }, 1000);
    });
    
    // Clear log button
    document.getElementById('clear-log').addEventListener('click', function() {
        const logContainer = document.getElementById('log-container');
        logContainer.innerHTML = '';
        addLogEntry('system', 'Log cleared');
    });
    
    // Auto-scroll checkbox
    document.getElementById('auto-scroll').addEventListener('change', function() {
        isAutoScrollEnabled = this.checked;
    });
}

/**
 * Update dashboard statistics
 */
function updateStats(stats) {
    // Update main statistics
    document.getElementById('total-games').textContent = stats.totalGames || 0;
    document.getElementById('total-files').textContent = stats.totalFiles || 0;
    document.getElementById('data-size').textContent = `${stats.totalSizeMB || 0} MB`;
    document.getElementById('collection-rate').textContent = `${stats.collectionRate || 0}/hr`;
    
    // Update progress bar
    const progressPercentage = Math.min((stats.totalGames / 10000) * 100, 100);
    document.getElementById('games-progress').style.width = `${progressPercentage}%`;
    document.getElementById('games-progress-text').textContent = `${progressPercentage.toFixed(1)}%`;
    
    // Update collector status
    updateCollectorStatus(stats.isCollectorRunning, stats.collectorPID);
    
    // Update last collection time
    const lastCollection = stats.lastCollectionTime ? 
        new Date(stats.lastCollectionTime).toLocaleString() : 'Never';
    document.getElementById('last-collection').textContent = lastCollection;
    
    // Update uptime
    const uptime = stats.uptime ? formatUptime(stats.uptime) : 'Unknown';
    document.getElementById('uptime').textContent = uptime;
    
    // Update chart
    updateChart(stats.totalGames);
    
    // Update system status
    updateSystemStatus(stats.isCollectorRunning ? 'collecting' : 'idle');
}

/**
 * Update collector status indicators
 */
function updateCollectorStatus(isRunning, pid) {
    const indicator = document.getElementById('collector-indicator');
    const text = document.getElementById('collector-text');
    const pidElement = document.getElementById('collector-pid');
    
    if (isRunning) {
        indicator.className = 'status-indicator status-running';
        text.textContent = 'Running';
        pidElement.textContent = pid || 'Unknown';
    } else {
        indicator.className = 'status-indicator status-stopped';
        text.textContent = 'Stopped';
        pidElement.textContent = '-';
    }
}

/**
 * Update system status in header
 */
function updateSystemStatus(status) {
    const statusElement = document.getElementById('system-status');
    statusElement.className = `stat-value status-${status}`;
    
    switch (status) {
        case 'connected':
            statusElement.textContent = 'Connected';
            break;
        case 'collecting':
            statusElement.textContent = 'Collecting';
            break;
        case 'idle':
            statusElement.textContent = 'Idle';
            break;
        case 'disconnected':
            statusElement.textContent = 'Disconnected';
            break;
        case 'error':
            statusElement.textContent = 'Error';
            break;
        default:
            statusElement.textContent = 'Unknown';
    }
}

/**
 * Update control status message
 */
function updateControlStatus(message) {
    const statusElement = document.getElementById('control-status');
    statusElement.textContent = message;
    
    // Clear status after 5 seconds
    setTimeout(() => {
        statusElement.textContent = '';
    }, 5000);
}

/**
 * Update the collection progress chart
 */
function updateChart(totalGames) {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString();
    
    // Add new data point
    gameHistoryData.push({
        time: timeLabel,
        games: totalGames
    });
    
    // Keep only last 20 data points
    if (gameHistoryData.length > 20) {
        gameHistoryData.shift();
    }
    
    // Update chart
    collectionChart.data.labels = gameHistoryData.map(d => d.time);
    collectionChart.data.datasets[0].data = gameHistoryData.map(d => d.games);
    collectionChart.update('none');
}

/**
 * Add entry to the live log
 */
function addLogEntry(type, message) {
    const logContainer = document.getElementById('log-container');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-message">${message}</span>
    `;
    
    logContainer.appendChild(entry);
    
    // Auto-scroll if enabled
    if (isAutoScrollEnabled) {
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    // Limit log entries to 100
    const entries = logContainer.querySelectorAll('.log-entry');
    if (entries.length > 100) {
        entries[0].remove();
    }
}

/**
 * Load recent games data
 */
function loadRecentGames() {
    fetch('/api/recent-games')
        .then(response => response.json())
        .then(games => {
            const container = document.getElementById('recent-games');
            
            if (games.length === 0) {
                container.innerHTML = '<div class="loading">No games collected yet</div>';
                return;
            }
            
            container.innerHTML = games.map(game => `
                <div class="game-item">
                    <div class="game-info">
                        <div class="game-id">${game.gameId}</div>
                        <div class="game-details">
                            Duration: ${game.duration}s | Events: ${game.totalEvents} | 
                            ${new Date(game.recordingEnd).toLocaleString()}
                        </div>
                    </div>
                    <div class="game-stats">
                        <div class="game-multiplier">${game.peakMultiplier.toFixed(2)}x</div>
                        <div class="game-status">
                            ${game.isInstarug ? '⚡ Instarug' : game.reason}
                        </div>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => {
            console.error('Error loading recent games:', error);
            document.getElementById('recent-games').innerHTML = 
                '<div class="loading">Error loading games</div>';
        });
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Load recent games on page load
setTimeout(() => {
    loadRecentGames();
}, 1000);

// Refresh recent games every 30 seconds
setInterval(() => {
    loadRecentGames();
}, 30000);