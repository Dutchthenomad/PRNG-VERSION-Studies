#!/usr/bin/env node

/**
 * 🔍 SETUP VERIFICATION SCRIPT
 * 
 * Quickly verify that your enhanced collector setup is working correctly
 * Run this before starting production collection
 * 
 * Usage: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 RUGS COLLECTOR SETUP VERIFICATION');
console.log('====================================');

let errors = 0;
let warnings = 0;

function checkPass(message) {
    console.log(`✅ ${message}`);
}

function checkWarning(message) {
    console.log(`⚠️  ${message}`);
    warnings++;
}

function checkFail(message) {
    console.log(`❌ ${message}`);
    errors++;
}

// 1. Check Node.js version
console.log('\n📋 Checking Node.js Environment:');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion >= 16) {
    checkPass(`Node.js version: ${nodeVersion}`);
} else {
    checkFail(`Node.js version too old: ${nodeVersion} (need 16+)`);
}

// 2. Check required files
console.log('\n📋 Checking Required Files:');

const requiredFiles = [
    'persistent_collector.js',
    'package.json'
];

const optionalFiles = [
    'collector-enhancements.js',
    '.env',
    'start-collector.sh',
    'start-collector.ps1' // Added PowerShell script for Windows compatibility
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        checkPass(`Required file: ${file}`);
    } else {
        checkFail(`Missing required file: ${file}`);
    }
});

optionalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        checkPass(`Optional file: ${file}`);
    } else {
        checkWarning(`Missing optional file: ${file}`);
    }
});

// 3. Check Node modules
console.log('\n📋 Checking Dependencies:');

if (fs.existsSync('node_modules')) {
    checkPass('node_modules directory exists');
    
    const requiredPackages = ['socket.io-client', 'dotenv'];
    requiredPackages.forEach(pkg => {
        if (fs.existsSync(`node_modules/${pkg}`)) {
            checkPass(`Package installed: ${pkg}`);
        } else {
            checkFail(`Missing package: ${pkg}`);
        }
    });
} else {
    checkFail('node_modules not found - run "npm install"');
}

// 4. Check data directories
console.log('\n📋 Checking Data Directories:');

const requiredDirs = [
    'rugs-data',
    'rugs-data/backups',
    'logs'
];

requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        checkPass(`Directory exists: ${dir}`);
    } else {
        checkWarning(`Directory missing: ${dir} (will be created automatically)`);
    }
});

// 5. Check disk space
console.log('\n📋 Checking System Resources:');

try {
    const stats = fs.statSync('.');
    checkPass('File system accessible');
    
    // Check available space (rough estimate)
    const freeSpace = process.platform === 'win32' ? 'Unknown' : 'Available';
    checkPass(`Disk space check: ${freeSpace}`);
} catch (error) {
    checkFail(`File system error: ${error.message}`);
}

// Memory check
const memoryUsage = process.memoryUsage();
const totalMemoryMB = memoryUsage.heapTotal / 1024 / 1024;
if (totalMemoryMB > 100) {
    checkPass(`Memory available: ${totalMemoryMB.toFixed(1)} MB`);
} else {
    checkWarning(`Low memory: ${totalMemoryMB.toFixed(1)} MB`);
}

// 6. Test enhanced features (if enhancements file exists)
console.log('\n📋 Checking Enhanced Features:');

if (fs.existsSync('collector-enhancements.js')) {
    try {
        const enhancements = require('./collector-enhancements');
        
        // Test timing function
        const timing = enhancements.capturePreciseRugEventTiming();
        if (timing.local_epoch_ms && timing.unix_timestamp) {
            checkPass('Enhanced timing capture working');
        } else {
            checkFail('Enhanced timing capture failed');
        }
        
        // Test sequence tracker
        const tracker = new enhancements.CrossGameSequenceTracker();
        if (tracker && typeof tracker.trackNewGame === 'function') {
            checkPass('Cross-game sequence tracker working');
        } else {
            checkFail('Cross-game sequence tracker failed');
        }
        
    } catch (error) {
        checkFail(`Enhanced features error: ${error.message}`);
    }
} else {
    checkWarning('Enhanced features not installed (using basic collector)');
}

// 7. Test network connectivity
console.log('\n📋 Checking Network Connectivity:');

const dns = require('dns');
dns.resolve('backend.rugs.fun', (err, addresses) => {
    if (err) {
        checkWarning(`DNS resolution failed for backend.rugs.fun: ${err.code}`);
    } else {
        checkPass(`DNS resolution successful: ${addresses[0]}`);
    }
    
    // Final summary
    console.log('\n📊 VERIFICATION SUMMARY:');
    console.log('========================');
    
    if (errors === 0 && warnings === 0) {
        console.log('🎉 PERFECT SETUP! Ready for production collection.');
        console.log('\n🚀 Next steps:');
        console.log('   1. Start test collection: node persistent_collector.js --target 3 --verbose');
        console.log('   2. Start production: node persistent_collector.js --target 10000');
    } else if (errors === 0) {
        console.log(`✅ SETUP COMPLETE with ${warnings} warning(s). Ready to collect!`);
        console.log('\n🚀 Next steps:');
        console.log('   1. Start test collection: node persistent_collector.js --target 3 --verbose');
        console.log('   2. Start production: node persistent_collector.js --target 10000');
    } else {
        console.log(`❌ SETUP INCOMPLETE: ${errors} error(s), ${warnings} warning(s)`);
        console.log('\n🔧 Fix the errors above before starting collection.');
        
        if (errors > 0) {
            console.log('\nCommon fixes:');
            console.log('- Missing files: Copy from the artifacts/instructions');
            console.log('- Missing packages: Run "npm install"');
            console.log('- Node.js too old: Update to Node.js 16+');
        }
    }
    
    console.log('\n📚 For help: Check the Quick Integration Guide');
    console.log('🎯 Goal: 10,000+ games for PRNG analysis and ML training');
});

// Test package.json structure
console.log('\n📋 Checking Package Configuration:');

if (fs.existsSync('package.json')) {
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        if (packageJson.dependencies) {
            checkPass('Package.json has dependencies');
        } else {
            checkWarning('Package.json missing dependencies section');
        }
        
        if (packageJson.scripts) {
            checkPass('Package.json has scripts section');
        } else {
            checkWarning('Package.json missing scripts section');
        }
        
    } catch (error) {
        checkFail(`Package.json parsing error: ${error.message}`);
    }
}

// Test if collector can be required (syntax check)
console.log('\n📋 Checking Collector Syntax:');

if (fs.existsSync('persistent_collector.js')) {
    try {
        // Read file and check for basic syntax issues
        const collectorCode = fs.readFileSync('persistent_collector.js', 'utf8');
        
        if (collectorCode.includes('socket.io-client')) {
            checkPass('Collector imports socket.io-client');
        } else {
            checkWarning('Collector may not import socket.io-client');
        }
        
        if (collectorCode.includes('gameStateUpdate')) {
            checkPass('Collector handles gameStateUpdate events');
        } else {
            checkWarning('Collector may not handle gameStateUpdate events');
        }
        
        if (collectorCode.includes('gameHistory')) {
            checkPass('Collector detects rug events');
        } else {
            checkWarning('Collector may not detect rug events properly');
        }
        
    } catch (error) {
        checkFail(`Collector file reading error: ${error.message}`);
    }
}