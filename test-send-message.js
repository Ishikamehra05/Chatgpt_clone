const axios = require('axios');

async function testSendMessage() {
  console.log('🧪 Testing Send Message Functionality...\n');

  const baseURL = 'http://localhost:8080';
  let sessionId = null;
  
  try {
    // Step 1: Test OpenAI configuration
    console.log('1. Testing OpenAI configuration...');
    const openaiResponse = await axios.get(`${baseURL}/api/v1/test/openai-status`);
    console.log(`${openaiResponse.data.openaiConfigured ? '✅' : '❌'} OpenAI:`, openaiResponse.data.message);
    
    if (!openaiResponse.data.openaiConfigured) {
      console.log('❌ OpenAI not configured. Please set your API key in .env file.');
      return;
    }
    
    // Step 2: Create a chat session
    console.log('\n2. Creating chat session...');
    const sessionResponse = await axios.post(`${baseURL}/api/v1/openai/chat/session`);
    sessionId = sessionResponse.data.data.sessionId;
    console.log('✅ Session created:', sessionId);
    
    // Step 3: Send a test message
    console.log('\n3. Sending test message...');
    const messageData = {
      message: "Hello! This is a test message. Please respond with a simple greeting.",
      sessionId: sessionId
    };
    
    const chatResponse = await axios.post(`${baseURL}/api/v1/openai/chat`, messageData);
    console.log('✅ Message sent successfully!');
    console.log('📝 AI Response:', chatResponse.data.data.message.substring(0, 100) + '...');
    console.log('🔢 Tokens used:', chatResponse.data.data.tokens);
    
    console.log('\n🎉 All tests passed! Message sending is working.');
    
  } catch (error) {
    console.log('\n❌ Test failed!');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server is not running. Start it with: npm start');
    } else if (error.response) {
      console.log('📋 Error details:');
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data.error || error.response.data.message);
      
      // Specific error handling
      if (error.response.status === 500 && error.response.data.error?.includes('OpenAI')) {
        console.log('\n💡 Possible solutions:');
        console.log('   1. Check your OpenAI API key in .env file');
        console.log('   2. Verify you have credits in your OpenAI account');
        console.log('   3. Make sure the API key is valid and active');
      }
    } else {
      console.log('   Error:', error.message);
    }
    
    // Cleanup: Delete test session if created
    if (sessionId) {
      try {
        await axios.delete(`${baseURL}/api/v1/openai/chat/session/${sessionId}`);
        console.log('🧹 Test session cleaned up');
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }
}

testSendMessage();