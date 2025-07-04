# 🎮 Enhanced PRNG Data Collector

[![Node.js](https://img.shields.io/badge/Node.js-16+-green)](https://nodejs.org)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-green)]()

## 📋 Overview

Enhanced data collection system for the rugs.fun gambling platform, designed to capture game data with microsecond-level precision and perform real-time pattern detection across games.

### 🎯 Key Features

- **Microsecond-level Timestamp Precision**: Capture exact timing of all game events
- **Cross-Game Pattern Detection**: Real-time analysis of patterns across multiple games
- **Zero Game Loss**: Resilient collection with auto-recovery mechanisms
- **Organized Data Storage**: Year/month/day/hour directory structure
- **Real-time Pattern Alerts**: Immediate notification of suspicious patterns
- **24/7 Operation**: Designed for continuous, unattended collection

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ (verified with v22.13.1)
- Required packages: socket.io-client, dotenv

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file with:

```
WEBSOCKET_URL=https://backend.rugs.fun
```

### Verification

Run the verification script to ensure your setup is correct:

```bash
node verification_script.js
```

### Running the Collector

For testing (3 games):
```bash
node enhanced_persistent_collector.js --target 3 --verbose
```

For production (10,000+ games):
```bash
node enhanced_persistent_collector.js --target 10000
```

## 📊 Data Collection

Collected data is stored in the `rugs-data/` directory with the following structure:

```
rugs-data/
├── YYYY/MM/DD/HH/
│   └── game-{id}.json
├── analytics/
├── complete-games/
└── pattern-alerts/
```

## 🔍 Enhanced Features

### Precise Timing Capture

Captures microsecond-level timestamps for all game events, enabling precise analysis of timing patterns in the PRNG algorithm.

### Cross-Game Sequence Tracking

Implements the `CrossGameSequenceTracker` class to detect patterns across multiple games, including:

- High Multiplier → Instarug correlations
- Instarug clusters
- Unusual peak multiplier distributions

### Enhanced Console Display

Provides real-time feedback on:

- System status and memory usage
- Collection statistics
- Recent game results
- Pattern alerts

## 📝 Implementation Notes

- Original collector functionality is preserved in `persistent_collector.js`
- Enhancements are modular in the `enhancements/` directory
- Pattern detection thresholds are configurable in the tracker class
- System designed for minimal resource usage during extended runs

## 🔒 Security & Privacy

- No personal identifiers are collected
- All data is stored locally only
- No external API calls beyond the WebSocket connection
