# 🎮 PRNG Version Studies - Cryptocurrency Gambling Analysis

[![GitHub](https://img.shields.io/badge/GitHub-Private%20Repository-red)](https://github.com/Dutchthenomad/PRNG-VERSION-Studies)
[![Status](https://img.shields.io/badge/Status-Ready%20for%20Execution-green)](https://github.com/Dutchthenomad/PRNG-VERSION-Studies)
[![Python](https://img.shields.io/badge/Python-3.8+-blue)](https://python.org)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green)](https://nodejs.org)

## 📋 Project Overview

Comprehensive reverse engineering study of PRNG algorithms in cryptocurrency gambling systems, specifically targeting **Rugs.fun** platform analysis and pattern detection.

### 🎯 Research Objectives

- **Statistical Analysis** of PRNG patterns and biases using NIST STS, Dieharder, TestU01
- **Real-time Data Collection** from Rugs.fun WebSocket with microsecond precision
- **Multi-layered System Analysis** (provably fair surface + hidden meta-algorithms)
- **ML-based Pattern Detection** for cross-game correlations and treasury protection
- **Meta-Algorithm Detection** for player classification and retention systems

### 🔬 Key Research Focus

- Time-based seed generation pattern analysis
- Cross-game correlation analysis (High Multi → Instarug hypothesis)
- Treasury protection meta-algorithms
- Player behavioral profiling systems
- Statistical significance testing with 10,000+ game samples

## 🏗️ Project Structure

```
PRNG-VERSION-Studies/
├── 📁 DOCS-first-day/                    # Research documentation
│   ├── PRNG_reverseEngineering_analysis.md
│   ├── prng_reverse_engineering_plan.md
│   └── comprehensive_rugs_analysis_report.md
├── 📁 JS-TERMINAL-DATA-Collector/        # Enhanced data collection system
│   ├── persistent_collector.js           # Proven WebSocket collector
│   ├── enhanced_collector_patch.js       # Real-time pattern detection
│   ├── complete_implementation_guide.md  # Zero-context execution guide
│   └── verification_script.js            # Setup validation
├── 📁 charting docs/                     # Visualization and analysis
├── 📁 version-examples/                  # PRNG version comparisons (v1, v2, v3)
├── seed_analysis_code.py                 # Main Python analyzer
└── 📁 rugs-UI-screenshots/              # Platform documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 16+** for data collection
- **Python 3.8+** for statistical analysis
- **Stable internet connection** for WebSocket data collection
- **~3GB storage** for 10,000+ enhanced games

### 1. Clone Repository

```bash
git clone https://github.com/Dutchthenomad/PRNG-VERSION-Studies.git
cd PRNG-VERSION-Studies
```

### 2. Setup Data Collection System

```bash
cd JS-TERMINAL-DATA-Collector
npm install
node verification_script.js  # Verify setup
```

### 3. Run Enhanced Collector

```bash
# Test with 5 games first
node persistent_collector.js --target 5 --verbose

# Production collection (10,000+ games)
node persistent_collector.js --target 10000
```

### 4. Statistical Analysis

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run PRNG analysis
python seed_analysis_code.py
```

## 📊 Data Collection Features

### Enhanced Collector Capabilities

- **Microsecond Timing Precision** for rug event analysis
- **Real-time Pattern Detection** with console alerts
- **Cross-game Sequence Tracking** for ML training data
- **24/7 Operation** with auto-recovery and error handling
- **Comprehensive Metadata** capture for statistical analysis

### Pattern Detection Algorithms

- High Multiplier → Instarug correlation detection
- Instarug cluster analysis for unusual groupings
- Time-based seed generation pattern analysis
- Statistical significance testing with confidence thresholds

## 🔬 Analysis Framework

### Statistical Testing Suite

- **NIST Statistical Test Suite** for bitstream analysis
- **Dieharder** battery for comprehensive randomness testing
- **TestU01** for unique bias detection
- **Custom Domain Tests** for gambling-specific patterns

### Sample Requirements

- **Statistical Randomness**: 10,000+ game outcomes
- **Pattern Detection**: 8,192+ sequential games
- **Meta-algorithm Detection**: 2,000+ games with metadata
- **Time-based Analysis**: 1,000+ games with precise timestamps

## 🎯 Current Status

### ✅ Completed
- [x] Enhanced data collection system with pattern detection
- [x] Complete implementation guide (zero-context execution)
- [x] Statistical analysis framework design
- [x] PRNG version comparison analysis (v1, v2, v3)
- [x] Comprehensive project documentation

### 🔄 In Progress
- [ ] Production data collection (Target: 10,000+ games)
- [ ] Real-time pattern detection validation
- [ ] ML model training for meta-algorithm detection

### 📈 Expected Timeline
- **Week 1**: 1,000+ games collected with enhanced metadata
- **Week 2-3**: 10,000+ games for comprehensive analysis
- **Week 4**: Statistical significance testing and pattern validation

## 🔒 Security & Privacy

- **Private Repository** for sensitive research
- **No Raw Data Commits** (data excluded via .gitignore)
- **Environment Variables** for API keys and credentials
- **Anonymized Analysis** results only

## 📚 Documentation

- **[Git Workflow](GIT_WORKFLOW.md)** - Version control best practices
- **[Implementation Guide](JS-TERMINAL-DATA-Collector/complete_implementation_guide.md)** - Step-by-step execution
- **[Analysis Documentation](DOCS-first-day/)** - Research methodology and findings

## 🤝 Contributing

This is a private research project. Follow the [Git Workflow](GIT_WORKFLOW.md) for all contributions:

1. Create feature branch from `develop`
2. Follow conventional commit messages
3. Include tests and documentation
4. Submit pull request for review

## 📄 License

Private research project - All rights reserved.

## 📞 Contact

For questions about this research project, please contact the repository owner.

---

**⚠️ Disclaimer**: This research is for educational and analytical purposes only. All data collection follows platform terms of service and applicable laws.
