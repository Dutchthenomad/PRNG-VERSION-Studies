#!/usr/bin/env node

/**
 * 🔧 JSON Format Fix Utility
 * 
 * This script fixes the JSON serialization in the enhanced collector
 * by removing the problematic .replace() call that creates invalid JSON.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 JSON FORMAT FIX UTILITY');
console.log('========================');

// Path to the enhanced collector file
const collectorPath = path.join(__dirname, 'enhanced_persistent_collector.js');

// Read the current file content
let content;
try {
    content = fs.readFileSync(collectorPath, 'utf8');
    console.log(`✅ Successfully read enhanced_persistent_collector.js (${content.length} bytes)`);
} catch (err) {
    console.error(`❌ Error reading file: ${err.message}`);
    process.exit(1);
}

// Create a backup of the current file
const backupPath = `${collectorPath}.bak.${Date.now()}`;
try {
    fs.writeFileSync(backupPath, content);
    console.log(`✅ Created backup at ${backupPath}`);
} catch (err) {
    console.error(`❌ Error creating backup: ${err.message}`);
    process.exit(1);
}

// Fix the JSON serialization issues
console.log('🔍 Searching for problematic JSON serialization patterns...');

// Pattern 1: Replace .replace(/"(\d+)":/g, "$1:") which creates invalid JSON
const invalidJsonPattern = /JSONStringifyWithBigInt\(gameData\)\.replace\(\/"\(\\d\+\)":\\g, "\$1:"\)/g;
let fixedContent = content.replace(invalidJsonPattern, 'JSONStringifyWithBigInt(gameData)');

// Pattern 2: Check for other instances of the same pattern
const otherInvalidPatterns = /\.replace\(\/"\(\\d\+\)":\\g, "\$1:"\)/g;
fixedContent = fixedContent.replace(otherInvalidPatterns, '');

// Check if any changes were made
if (content === fixedContent) {
    console.log('⚠️ No problematic patterns found in the code. No changes needed.');
    process.exit(0);
}

// Write the fixed content back to the file
try {
    fs.writeFileSync(collectorPath, fixedContent);
    console.log('✅ Successfully fixed JSON serialization issues!');
    console.log('✅ The collector will now produce valid JSON files.');
} catch (err) {
    console.error(`❌ Error writing fixed file: ${err.message}`);
    process.exit(1);
}

console.log('\n📋 Next Steps:');
console.log('1. Restart the collector using: .\\start-collector.ps1');
console.log('2. Verify that new game files are being created correctly');
console.log('3. Check that the game count matches the number of files created');
console.log('\n✨ Fix complete! The collector should now save all games properly.');
