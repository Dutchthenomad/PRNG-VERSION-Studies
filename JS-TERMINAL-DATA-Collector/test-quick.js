try {
    const {
        capturePreciseRugEventTiming,
        CrossGameSequenceTracker
    } = require('./enhancements/collector-enhancements');
    
    console.log('✅ Enhancement module loaded successfully');
    
    // Test timing capture
    const timing = capturePreciseRugEventTiming();
    console.log('✅ Timing test - Has microsecond precision:', !!timing.local_epoch_us);
    
    // Test sequence tracker
    const tracker = new CrossGameSequenceTracker();
    console.log('✅ Sequence tracker created successfully');
    
    console.log('\n🎉 Basic enhancement tests passed!');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nFile locations to check:');
    console.log('- enhancements/collector-enhancements.js');
    console.log('- Make sure the file path is correct');
}
