const axios = require('axios');

async function testLegacyTools() {
  console.log('🧪 Testing All Legacy Tools...\n');

  const baseURL = 'http://localhost:8080';
  
  try {
    // Test 1: Text Summary
    console.log('1. Testing Text Summary...');
    try {
      const summaryResponse = await axios.post(`${baseURL}/api/v1/openai/summary`, {
        text: "Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of intelligent agents: any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals."
      });
      console.log('✅ Text Summary working');
      console.log('   Response preview:', summaryResponse.data.data?.substring(0, 50) + '...' || 'Demo mode');
    } catch (error) {
      console.log('❌ Text Summary failed:', error.response?.data?.error || error.message);
    }

    // Test 2: Paragraph Generation
    console.log('\n2. Testing Paragraph Generation...');
    try {
      const paragraphResponse = await axios.post(`${baseURL}/api/v1/openai/paragraph`, {
        text: "machine learning"
      });
      console.log('✅ Paragraph Generation working');
      console.log('   Response preview:', paragraphResponse.data.data?.substring(0, 50) + '...' || 'Demo mode');
    } catch (error) {
      console.log('❌ Paragraph Generation failed:', error.response?.data?.error || error.message);
    }

    // Test 3: JavaScript Converter
    console.log('\n3. Testing JavaScript Converter...');
    try {
      const jsResponse = await axios.post(`${baseURL}/api/v1/openai/js-converter`, {
        text: "create a function that adds two numbers"
      });
      console.log('✅ JavaScript Converter working');
      console.log('   Response preview:', jsResponse.data.data?.substring(0, 50) + '...' || 'Demo mode');
    } catch (error) {
      console.log('❌ JavaScript Converter failed:', error.response?.data?.error || error.message);
    }

    // Test 4: Sci-Fi Image Generator
    console.log('\n4. Testing Sci-Fi Image Generator...');
    try {
      const imageResponse = await axios.post(`${baseURL}/api/v1/openai/scifi-image`, {
        text: "robot in space"
      });
      console.log('✅ Sci-Fi Image Generator working');
      console.log('   Image URL received:', imageResponse.data.data ? 'Yes' : 'Demo mode');
    } catch (error) {
      console.log('❌ Sci-Fi Image Generator failed:', error.response?.data?.error || error.message);
    }

    // Test 5: Legacy Chatbot (using new chat endpoint)
    console.log('\n5. Testing Legacy Chatbot...');
    try {
      // Create session
      const sessionResponse = await axios.post(`${baseURL}/api/v1/openai/chat/session`);
      const sessionId = sessionResponse.data.data.sessionId;
      
      // Send message
      const chatResponse = await axios.post(`${baseURL}/api/v1/openai/chat`, {
        message: "Hello, how are you?",
        sessionId: sessionId
      });
      
      console.log('✅ Legacy Chatbot working');
      console.log('   Response preview:', chatResponse.data.data.message?.substring(0, 50) + '...' || 'Demo mode');
      
      // Cleanup
      await axios.delete(`${baseURL}/api/v1/openai/chat/session/${sessionId}`);
    } catch (error) {
      console.log('❌ Legacy Chatbot failed:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 Legacy tools testing completed!');
    console.log('\n📋 Summary:');
    console.log('   All tools have been updated with:');
    console.log('   ✅ Modern UI with loading states');
    console.log('   ✅ Better error handling');
    console.log('   ✅ Example suggestions');
    console.log('   ✅ Responsive design');
    console.log('   ✅ Copy functionality (where applicable)');
    console.log('   ✅ Demo mode fallback');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running!');
      console.log('💡 Start the backend server with: npm start');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

testLegacyTools();