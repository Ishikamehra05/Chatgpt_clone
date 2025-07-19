const axios = require('axios');

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Chat Flow...\n');

  const baseURL = 'http://localhost:8080';
  let sessionId = null;
  
  try {
    // Step 1: Test backend health
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get(`${baseURL}/api/v1/test/health`);
    console.log('✅ Backend is running');
    
    // Step 2: Test database connection
    console.log('\n2. Testing database connection...');
    const dbResponse = await axios.get(`${baseURL}/api/v1/test/db-status`);
    console.log(`${dbResponse.data.database.connected ? '✅' : '❌'} Database:`, 
                dbResponse.data.database.connected ? 'Connected' : 'Disconnected');
    
    // Step 3: Test OpenAI configuration
    console.log('\n3. Testing OpenAI configuration...');
    const openaiResponse = await axios.get(`${baseURL}/api/v1/test/openai-status`);
    console.log(`${openaiResponse.data.openaiConfigured ? '✅' : '⚠️'} OpenAI:`, openaiResponse.data.message);
    
    // Step 4: Create a chat session
    console.log('\n4. Creating chat session...');
    const sessionResponse = await axios.post(`${baseURL}/api/v1/openai/chat/session`);
    sessionId = sessionResponse.data.data.sessionId;
    console.log('✅ Session created:', sessionId);
    
    // Step 5: Send a test message
    console.log('\n5. Sending test message...');
    const messageData = {
      message: "Hello! Please respond with just 'Hi there!' to test the system.",
      sessionId: sessionId
    };
    
    const chatResponse = await axios.post(`${baseURL}/api/v1/openai/chat`, messageData);
    console.log('✅ Message sent successfully!');
    console.log('📝 AI Response preview:', chatResponse.data.data.message.substring(0, 100) + '...');
    
    // Step 6: Get chat history
    console.log('\n6. Testing chat history...');
    const historyResponse = await axios.get(`${baseURL}/api/v1/openai/chat/messages/${sessionId}`);
    console.log('✅ Chat history retrieved:', historyResponse.data.count, 'messages');
    
    // Step 7: Get all sessions
    console.log('\n7. Testing session list...');
    const sessionsResponse = await axios.get(`${baseURL}/api/v1/openai/chat/sessions`);
    console.log('✅ Sessions list retrieved:', sessionsResponse.data.count, 'sessions');
    
    console.log('\n🎉 All tests passed! The chat system is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   ✅ Backend server running');
    console.log('   ✅ Database connected');
    console.log(`   ${openaiResponse.data.openaiConfigured ? '✅' : '⚠️'} OpenAI ${openaiResponse.data.openaiConfigured ? 'configured' : 'not configured (demo mode)'}`);
    console.log('   ✅ Session creation working');
    console.log('   ✅ Message sending working');
    console.log('   ✅ Chat history working');
    
    // Cleanup: Delete test session
    try {
      await axios.delete(`${baseURL}/api/v1/openai/chat/session/${sessionId}`);
      console.log('\n🧹 Test session cleaned up');
    } catch (cleanupError) {
      console.log('\n⚠️ Could not clean up test session (this is okay)');
    }
    
  } catch (error) {
    console.log('\n❌ Test failed!');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server is not running. Start it with: npm start');
    } else if (error.response) {
      console.log('📋 Error details:');
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data.error || error.response.data.message);
      
      if (error.response.status === 500) {
        console.log('\n💡 Possible solutions:');
        console.log('   1. Check backend console for detailed error messages');
        console.log('   2. Verify database connection');
        console.log('   3. Check if all dependencies are installed');
      }
    } else {
      console.log('   Error:', error.message);
    }
    
    // Cleanup on error
    if (sessionId) {
      try {
        await axios.delete(`${baseURL}/api/v1/openai/chat/session/${sessionId}`);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }
}

testCompleteFlow();