const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simple test to verify cron lock functionality
async function testCronLock() {
  console.log('🧪 Testing Cron Lock Service...');
  
  const testJobName = 'test-job-' + Date.now();
  
  try {
    // Test 1: Acquire lock
    console.log('1️⃣ Testing lock acquisition...');
    const { acquireCronLock } = require('../../src/services/cronLockService.ts');
    
    const lock = await acquireCronLock(testJobName, 5);
    if (lock) {
      console.log('✅ Lock acquired successfully:', lock.id);
    } else {
      console.log('❌ Failed to acquire lock');
      return false;
    }
    
    // Test 2: Try to acquire same lock again (should fail)
    console.log('2️⃣ Testing duplicate lock prevention...');
    const duplicateLock = await acquireCronLock(testJobName, 5);
    if (duplicateLock === null) {
      console.log('✅ Duplicate lock correctly prevented');
    } else {
      console.log('❌ Duplicate lock was allowed (should not happen)');
      return false;
    }
    
    // Test 3: Release lock
    console.log('3️⃣ Testing lock release...');
    const { releaseCronLock } = require('../../src/services/cronLockService.ts');
    
    const released = await releaseCronLock(lock.id);
    if (released) {
      console.log('✅ Lock released successfully');
    } else {
      console.log('❌ Failed to release lock');
      return false;
    }
    
    // Test 4: Acquire lock after release (should succeed)
    console.log('4️⃣ Testing lock acquisition after release...');
    const newLock = await acquireCronLock(testJobName, 5);
    if (newLock) {
      console.log('✅ New lock acquired after release');
      
      // Test 5: Verify column names are camelCase (before releasing)
      console.log('5️⃣ Testing camelCase column names...');
      const dbLock = await prisma.cronLock.findFirst({
        where: { jobName: testJobName }
      });
      
      if (dbLock && dbLock.jobName && dbLock.lockedAt && dbLock.expiresAt) {
        console.log('✅ Database uses camelCase columns correctly');
        console.log('   - jobName:', dbLock.jobName);
        console.log('   - lockedAt:', dbLock.lockedAt);
        console.log('   - expiresAt:', dbLock.expiresAt);
      } else {
        console.log('❌ Database column names issue detected');
        console.log('   - dbLock:', dbLock);
        return false;
      }
      
      await releaseCronLock(newLock.id);
    } else {
      console.log('❌ Failed to acquire lock after release');
      return false;
    }
    
    console.log('🎉 All cron lock tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  } finally {
    // Cleanup
    await prisma.cronLock.deleteMany({
      where: { jobName: testJobName }
    });
  }
}

// Run the test
if (require.main === module) {
  testCronLock().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testCronLock };
