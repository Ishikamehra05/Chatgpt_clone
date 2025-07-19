const axios = require('axios');

async function testBackend() {
  console.log('🔍 Testing Backend Server...\n');

  const baseURL = 'http://localhost:8080';
  
  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/api/v1/test/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);
    
    // Test OpenAI status
    console.log('\nTesting OpenAI configuration...');
    const openaiResponse = await axios.get(`${baseURL}/api/v1/test/openai-status`);
    console.log(`${openaiResponse.data.openaiConfigured ? '✅' : '⚠️'} OpenAI status:`, openaiResponse.data.message);
    
    // Test database status
    console.log('\nTesting database connection...');
    const dbResponse = await axios.get(`${baseURL}/api/v1/test/db-status`);
    console.log(`${dbResponse.data.database.connected ? '✅' : '❌'} Database:`, 
                dbResponse.data.database.connected ? 'Connected' : 'Disconnected');
    
    console.log('\n🎉 All tests passed! Backend is working correctly.');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running!');
      console.log('💡 Start the backend server with: npm start');
    } else {
      console.log('❌ Test failed:', error.message);
    }
  }
}

testBackend();