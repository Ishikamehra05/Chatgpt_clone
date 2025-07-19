const axios = require('axios');

async function testChatSession() {
  console.log('🧪 Testing Chat Session Creation...\n');

  const baseURL = 'http://localhost:8080';
  
  try {
    // Test backend health
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get(`${baseURL}/api/v1/test/health`);
    console.log('✅ Backend is running:', healthResponse.data.message);
    
    // Test database connection
    console.log('\n2. Testing database connection...');
    const dbResponse = await axios.get(`${baseURL}/api/v1/test/db-status`);
    console.log(`${dbResponse.data.database.connected ? '✅' : '❌'} Database:`, 
                dbResponse.data.database.connected ? 'Connected' : 'Disconnected');
    
    // Test chat session creation
    console.log('\n3. Testing chat session creation...');
    const sessionResponse = await axios.post(`${baseURL}/api/v1/openai/chat/session`);
    console.log('✅ Chat session created:', sessionResponse.data.data.sessionId);
    
    // Test getting sessions
    console.log('\n4. Testing get sessions...');
    const sessionsResponse = await axios.get(`${baseURL}/api/v1/openai/chat/sessions`);
    console.log('✅ Sessions retrieved:', sessionsResponse.data.count, 'sessions found');
    
    console.log('\n🎉 All tests passed! Chat functionality is working.');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running!');
      console.log('💡 Start the backend server with: npm start');
    } else if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Test failed:', error.message);
    }
  }
}

testChatSession();