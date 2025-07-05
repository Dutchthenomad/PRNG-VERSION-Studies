# 🎯 PRNG DATA COLLECTION PROJECT - CONTEXT FRAMEWORK

## **CORE PROJECT IDENTITY**
- **Primary Goal**: ML data collection for rugs.fun PRNG analysis
- **Current Status**: 7 games collected, 13 files, 7.8MB data
- **Target**: 10,000+ games for statistical significance
- **Technology Stack**: Node.js collector + Python analysis + Web dashboard

## **SYSTEM ARCHITECTURE CONSTRAINTS**
```
Windows Desktop
└── WSL (Ubuntu)
    ├── JS-TERMINAL-DATA-Collector/ (Primary workspace)
    │   ├── enhanced_persistent_collector.js
    │   ├── collector-enhancements.js  
    │   ├── rugs-data/ (7 games, 13 files, 7.8MB)
    │   └── analysis_tools.py
    └── Dashboard Application (To be built)
```

## **ABSOLUTE PROJECT BOUNDARIES**

### ✅ ALWAYS IN SCOPE
- **Data Collection**: Enhancing the existing collector system
- **Real-time Monitoring**: Dashboard for collection health/progress
- **PRNG Analysis**: Statistical analysis of collected games
- **Pattern Detection**: Cross-game correlation analysis
- **WSL Integration**: Optimizing for Windows+WSL environment

### ❌ NEVER IN SCOPE  
- **Game Development**: Not building gambling games
- **Financial Trading**: Not creating trading bots
- **User Authentication**: Not building user login systems
- **Blockchain/Crypto**: Not developing cryptocurrency features
- **Mobile Apps**: Desktop/web interface only

## **TECHNICAL CONSTRAINTS**

### **Environment Requirements**
- **OS**: Windows with WSL (Ubuntu)
- **Runtime**: Node.js 16+ (currently v22.13.1)
- **Data Format**: JSON/JSONL files in rugs-data/
- **Real-time**: WebSocket connections to rugs.fun

### **Data Schema Compliance**
```json
{
  "gameId": "string",
  "analysis": {
    "peakMultiplier": "number",
    "isInstarug": "boolean",
    "rugEventTiming": "object"
  },
  "collectionMetadata": {
    "gameNumber": "number",
    "hourlyGameNumber": "number"
  }
}
```

## **ANTI-HALLUCINATION CHECKPOINTS**

### **Before Any Code Generation:**
1. ✅ Does this enhance the existing collector system?
2. ✅ Does this improve data collection/analysis?
3. ✅ Is this compatible with WSL environment?
4. ✅ Does this use the established data format?

### **Red Flags - Stop and Clarify:**
- 🚩 Requests to build new gambling mechanics
- 🚩 Suggestions for completely different tech stacks
- 🚩 Proposals that ignore existing data structure
- 🚩 Recommendations that break WSL compatibility

## **CURRENT PROJECT STATE**

### **Completed Systems**
- ✅ Enhanced persistent collector (not currently running)
- ✅ Cross-game pattern detection
- ✅ Precise timing capture for PRNG analysis
- ✅ Hierarchical data storage (Year/Month/Day/Hour)
- ✅ Python analysis tools framework

### **Next Phase Requirements**
- 🎯 Real-time dashboard for collection monitoring
- 🎯 Process health monitoring and restart capabilities
- 🎯 Live visualization of collection progress
- 🎯 Alert system for data collection issues

## **COMMUNICATION PROTOCOL**

### **When Suggesting Solutions:**
1. **Reference Existing Code**: Always build on current collector system
2. **Specify File Locations**: Use exact paths in WSL environment
3. **Maintain Data Format**: Preserve existing JSON structure
4. **WSL Compatibility**: Ensure all solutions work in WSL context

### **Required Context Validation:**
Before implementing any feature, confirm:
- "This enhances the existing PRNG data collection system"
- "This maintains compatibility with the current data structure"
- "This works within the Windows+WSL environment"
- "This supports the goal of analyzing 10,000+ games"

## **PROJECT SUCCESS METRICS**
- **Data Collection**: 10,000+ valid games collected
- **Data Quality**: 100% rug event capture with precise timing
- **System Uptime**: 99%+ collector availability
- **Analysis Ready**: Statistical significance for ML training
- **Dashboard Utility**: Real-time monitoring and alerts

---

**This framework ensures all AI responses stay focused on the core PRNG analysis project while building optimal tooling for the Windows+WSL environment.**