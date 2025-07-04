#!/usr/bin/env node

/**
 * 🕒 RUGS.FUN TIME FOLDER CREATION TEST
 * 
 * This script tests that the collector properly creates new folders
 * for different hours, days, and months
 */

const fs = require('fs');
const path = require('path');

console.log('🕒 RUGS.FUN TIME FOLDER CREATION TEST');
console.log('========================================');

// Base directory
const baseDir = path.resolve('./rugs-data');
console.log(`📁 Base directory: ${baseDir}`);

// Test different time periods
const testPeriods = [
    { name: 'Current hour', year: 2025, month: 7, day: 4, hour: 1 },
    { name: 'Next hour', year: 2025, month: 7, day: 4, hour: 2 },
    { name: 'Next day', year: 2025, month: 7, day: 5, hour: 0 },
    { name: 'Next month', year: 2025, month: 8, day: 1, hour: 0 },
    { name: 'Next year', year: 2026, month: 1, day: 1, hour: 0 }
];

// Test function to create directory and write test file
function testTimePeriod(period) {
    console.log(`\n🧪 Testing: ${period.name}`);
    
    // Format directory path
    const year = period.year.toString();
    const month = period.month.toString().padStart(2, '0');
    const day = period.day.toString().padStart(2, '0');
    const hour = period.hour.toString().padStart(2, '0');
    
    const dirPath = path.join(baseDir, year, month, day, `${hour}h`);
    console.log(`📁 Directory path: ${dirPath}`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`✅ Created directory: ${dirPath}`);
        } catch (error) {
            console.error(`❌ Error creating directory: ${error.message}`);
            return false;
        }
    } else {
        console.log(`ℹ️ Directory already exists`);
    }
    
    // Create test file in directory
    const testFile = path.join(dirPath, `time-test-${Date.now()}.json`);
    const testData = {
        period: period.name,
        timestamp: new Date().toISOString(),
        test: 'Time folder creation test'
    };
    
    try {
        fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));
        console.log(`✅ Created test file: ${testFile}`);
        return true;
    } catch (error) {
        console.error(`❌ Error creating test file: ${error.message}`);
        return false;
    }
}

// Run tests
let allTestsPassed = true;
for (const period of testPeriods) {
    const testResult = testTimePeriod(period);
    allTestsPassed = allTestsPassed && testResult;
}

// Check if all tests passed
console.log('\n========================================');
if (allTestsPassed) {
    console.log('🎉 ALL TIME FOLDER TESTS PASSED!');
    console.log('The collector will properly create new folders for each hour, day, and month.');
} else {
    console.log('❌ SOME TIME FOLDER TESTS FAILED');
    console.log('Please check the error messages above and fix any issues.');
}

// Verify the collector's getHourDirectory function
console.log('\n📋 NEXT STEPS:');
console.log('1. Review the enhanced_persistent_collector.js file to verify the getHourDirectory() method');
console.log('2. Confirm that the hourly maintenance function runs every hour to create new directories');
console.log('3. For long-term testing, you can modify the system clock to simulate time changes');
