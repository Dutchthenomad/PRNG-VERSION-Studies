#!/usr/bin/env node

/**
 * 🔧 RUGS.FUN DATA STORAGE FIX UTILITY
 * 
 * This script checks and fixes data storage issues in the Enhanced PRNG Data Collector
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 RUGS.FUN DATA STORAGE FIX UTILITY');
console.log('========================================');

// 1. Check base directories
const baseDir = path.resolve('./rugs-data');
console.log(`📁 Checking base directory: ${baseDir}`);

if (!fs.existsSync(baseDir)) {
    console.log('❌ Base directory does not exist. Creating it...');
    fs.mkdirSync(baseDir, { recursive: true });
} else {
    console.log('✅ Base directory exists');
}

// 2. Create required subdirectories
const requiredDirs = [
    'complete-games',
    'pattern-alerts',
    'analytics',
    'backups',
    path.join('2025', '07', '04', '01h')
];

requiredDirs.forEach(dir => {
    const fullPath = path.join(baseDir, dir);
    console.log(`📁 Checking directory: ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`❌ Directory does not exist. Creating it...`);
        fs.mkdirSync(fullPath, { recursive: true });
    } else {
        console.log('✅ Directory exists');
    }
});

// 3. Check write permissions
console.log('\n🔒 Checking write permissions...');

try {
    // Test write to main directory
    const testFile = path.join(baseDir, 'write-test.txt');
    fs.writeFileSync(testFile, 'Test write access');
    console.log(`✅ Successfully wrote to ${testFile}`);
    
    // Test write to hourly directory
    const hourlyTestFile = path.join(baseDir, '2025', '07', '04', '01h', 'write-test.txt');
    fs.writeFileSync(hourlyTestFile, 'Test write access');
    console.log(`✅ Successfully wrote to ${hourlyTestFile}`);
    
    // Test write to complete-games directory
    const completeGamesTestFile = path.join(baseDir, 'complete-games', 'write-test.txt');
    fs.writeFileSync(completeGamesTestFile, 'Test write access');
    console.log(`✅ Successfully wrote to ${completeGamesTestFile}`);
    
    // Clean up test files
    fs.unlinkSync(testFile);
    fs.unlinkSync(hourlyTestFile);
    fs.unlinkSync(completeGamesTestFile);
    console.log('✅ Test files cleaned up');
} catch (error) {
    console.error(`❌ Write permission error: ${error.message}`);
    console.log('\n🔧 Attempting to fix permissions...');
    
    if (os.platform() === 'win32') {
        console.log('Windows detected. Please run the following command in an Administrator PowerShell:');
        console.log(`icacls "${baseDir}" /grant "${os.userInfo().username}:(OI)(CI)F" /T`);
    } else {
        console.log('Unix-like system detected. Please run the following command:');
        console.log(`chmod -R 755 "${baseDir}"`);
    }
}

// 4. Create a test game file
console.log('\n📝 Creating a test game file...');

const testGameData = {
    gameId: 'test-game-' + Date.now(),
    recordingStart: new Date().toISOString(),
    recordingEnd: new Date().toISOString(),
    duration: 10,
    reason: 'test',
    totalEvents: 5,
    analysis: {
        peakMultiplier: 2.5,
        isInstarug: false
    },
    events: [
        { eventType: 'test', timestamp: new Date().toISOString(), data: {} }
    ]
};

try {
    // Save to hourly directory
    const hourlyDir = path.join(baseDir, '2025', '07', '04', '01h');
    const gameFile = path.join(hourlyDir, `game-${testGameData.gameId}.json`);
    fs.writeFileSync(gameFile, JSON.stringify(testGameData, null, 2));
    console.log(`✅ Successfully wrote test game to ${gameFile}`);
    
    // Save to complete-games directory
    const completeGameFile = path.join(baseDir, 'complete-games', `game-${testGameData.gameId}.json`);
    fs.writeFileSync(completeGameFile, JSON.stringify(testGameData, null, 2));
    console.log(`✅ Successfully wrote test game to ${completeGameFile}`);
    
    // Append to all-games.jsonl
    const masterStream = path.join(baseDir, 'all-games.jsonl');
    fs.appendFileSync(masterStream, JSON.stringify(testGameData) + '\n');
    console.log(`✅ Successfully appended to ${masterStream}`);
    
    console.log('\n🎉 DATA STORAGE FIX COMPLETE!');
    console.log('The collector should now be able to save game data properly.');
} catch (error) {
    console.error(`❌ Error creating test game files: ${error.message}`);
    console.log('Please check the error message and fix manually.');
}
