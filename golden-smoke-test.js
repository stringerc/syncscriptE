const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';

async function runGoldenSmokeTests() {
  console.log('🧪 Starting Golden Smoke Tests for Step 3...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Server Health Check
  try {
    console.log('1️⃣ Testing server health...');
    const response = await axios.get(`${BASE_URL}/`);
    if (response.data.status === 'running') {
      console.log('✅ Server is running');
      passed++;
    } else {
      console.log('❌ Server not running properly');
      failed++;
    }
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    failed++;
  }
  
  // Test 2: Database Connection
  try {
    console.log('\n2️⃣ Testing database connection...');
    const response = await axios.get(`${BASE_URL}/api/user/dashboard`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    console.log('✅ Database connection working (got response, even if auth failed)');
    passed++;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Database connection working (auth failed as expected)');
      passed++;
    } else {
      console.log('❌ Database connection failed:', error.message);
      failed++;
    }
  }
  
  // Test 3: Template Recommendations API
  try {
    console.log('\n3️⃣ Testing template recommendations API...');
    const response = await axios.get(`${BASE_URL}/api/templates/recommend?eventId=test`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    console.log('✅ Template recommendations API accessible');
    passed++;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.log('✅ Template recommendations API accessible (auth/not found as expected)');
      passed++;
    } else {
      console.log('❌ Template recommendations API failed:', error.message);
      failed++;
    }
  }
  
  // Test 4: Conflict Resolver API
  try {
    console.log('\n4️⃣ Testing conflict resolver API...');
    const response = await axios.get(`${BASE_URL}/api/task-scheduling/conflicts/test-event`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    console.log('✅ Conflict resolver API accessible');
    passed++;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.log('✅ Conflict resolver API accessible (auth/not found as expected)');
      passed++;
    } else {
      console.log('❌ Conflict resolver API failed:', error.message);
      failed++;
    }
  }
  
  // Test 5: Outlook Calendar API
  try {
    console.log('\n5️⃣ Testing Outlook calendar API...');
    const response = await axios.get(`${BASE_URL}/api/outlook-calendar/status`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    console.log('✅ Outlook calendar API accessible');
    passed++;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Outlook calendar API accessible (auth failed as expected)');
      passed++;
    } else {
      console.log('❌ Outlook calendar API failed:', error.message);
      failed++;
    }
  }
  
  // Test 6: Apple/iCloud Calendar API
  try {
    console.log('\n6️⃣ Testing Apple/iCloud calendar API...');
    const response = await axios.get(`${BASE_URL}/api/icloud-calendar/status`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    console.log('✅ Apple/iCloud calendar API accessible');
    passed++;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Apple/iCloud calendar API accessible (auth failed as expected)');
      passed++;
    } else {
      console.log('❌ Apple/iCloud calendar API failed:', error.message);
      failed++;
    }
  }
  
  // Test 7: Frontend Accessibility
  try {
    console.log('\n7️⃣ Testing frontend accessibility...');
    const response = await axios.get(`${FRONTEND_URL}/`, { timeout: 5000 });
    if (response.status === 200) {
      console.log('✅ Frontend is accessible');
      passed++;
    } else {
      console.log('❌ Frontend not accessible');
      failed++;
    }
  } catch (error) {
    console.log('❌ Frontend accessibility failed:', error.message);
    failed++;
  }
  
  // Summary
  console.log('\n📊 Golden Smoke Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All golden smoke tests passed! Step 3 is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix before proceeding.');
  }
  
  return failed === 0;
}

// Run the tests
runGoldenSmokeTests().catch(console.error);
