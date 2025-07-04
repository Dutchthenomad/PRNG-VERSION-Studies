#!/usr/bin/env node

/**
 * 🔧 RUGS.FUN BIGINT SERIALIZATION FIX
 * 
 * This script fixes the BigInt serialization error in the enhanced collector
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 RUGS.FUN BIGINT SERIALIZATION FIX');
console.log('========================================');

// Path to the enhanced collector file
const collectorPath = path.resolve('./enhanced_persistent_collector.js');
console.log(`📁 Target file: ${collectorPath}`);

// Read the collector file
let collectorCode;
try {
    collectorCode = fs.readFileSync(collectorPath, 'utf8');
    console.log('✅ Successfully read collector file');
} catch (error) {
    console.error(`❌ Error reading collector file: ${error.message}`);
    process.exit(1);
}

// 1. Add BigInt serialization function
console.log('\n🔍 Adding BigInt serialization support...');

// Check if BigInt serialization is already added
if (collectorCode.includes('// BigInt serialization support')) {
    console.log('ℹ️ BigInt serialization already added');
} else {
    // Add BigInt serialization after the imports
    const importSection = 'const crypto = require(\'crypto\');\n';
    const bigIntSerializationCode = `
// BigInt serialization support
const JSONStringifyWithBigInt = (obj) => {
    return JSON.stringify(obj, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
    );
};
`;
    
    collectorCode = collectorCode.replace(importSection, importSection + bigIntSerializationCode);
    console.log('✅ Added BigInt serialization function');
}

// 2. Replace JSON.stringify with JSONStringifyWithBigInt in saveGameData method
console.log('\n🔧 Updating JSON serialization in saveGameData method...');

// Find the saveGameData method
const saveGameDataStart = collectorCode.indexOf('saveGameData(gameData)');
if (saveGameDataStart === -1) {
    console.error('❌ Could not find saveGameData method');
    process.exit(1);
}

// Replace JSON.stringify with JSONStringifyWithBigInt
const originalCode = [
    'fs.writeFileSync(gameFile, JSON.stringify(gameData, null, 2));',
    'fs.appendFileSync(streamFile, JSON.stringify(gameData) + \'\\n\');',
    'fs.appendFileSync(masterStream, JSON.stringify(gameData) + \'\\n\');',
    'fs.writeFileSync(alertsFile, JSON.stringify(recentPatterns, null, 2));'
];

const replacementCode = [
    'fs.writeFileSync(gameFile, JSONStringifyWithBigInt(gameData).replace(/"(\\d+)":/g, "$1:"));\'',
    'fs.appendFileSync(streamFile, JSONStringifyWithBigInt(gameData) + \'\\n\');',
    'fs.appendFileSync(masterStream, JSONStringifyWithBigInt(gameData) + \'\\n\');',
    'fs.writeFileSync(alertsFile, JSONStringifyWithBigInt(recentPatterns).replace(/"(\\d+)":/g, "$1:"));'
];

let replacementsMade = 0;
for (let i = 0; i < originalCode.length; i++) {
    if (collectorCode.includes(originalCode[i])) {
        collectorCode = collectorCode.replace(originalCode[i], replacementCode[i]);
        replacementsMade++;
    }
}

console.log(`✅ Updated ${replacementsMade} JSON serialization calls`);

// 3. Save the updated collector file
console.log('\n💾 Saving updated collector file...');
try {
    // Create a backup of the original file
    const backupPath = `${collectorPath}.bak`;
    fs.writeFileSync(backupPath, fs.readFileSync(collectorPath));
    console.log(`✅ Created backup at ${backupPath}`);
    
    // Write the updated file
    fs.writeFileSync(collectorPath, collectorCode);
    console.log(`✅ Successfully updated ${collectorPath}`);
    
    console.log('\n🎉 BIGINT SERIALIZATION FIX COMPLETE!');
    console.log('The collector should now be able to save game data with BigInt values.');
    console.log('\nTo test the fix, run the collector again:');
    console.log('.\\start-collector.ps1 -test');
} catch (error) {
    console.error(`❌ Error saving updated collector: ${error.message}`);
    process.exit(1);
}
