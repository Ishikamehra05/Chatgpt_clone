const rateLimiter = require('./rateLimiter');

// Retry mechanism with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on certain errors
      if (error.status === 401 || error.status === 403 || error.status === 400) {
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      
      console.log(`OpenAI API attempt ${attempt} failed, retrying in ${delay}ms...`);
      console.log(`Error: ${error.status} - ${error.message}`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Enhanced OpenAI API call wrapper
async function callOpenAI(openai, apiCall, userId = 'anonymous') {
  // Check rate limit first
  if (!rateLimiter.isAllowed(userId)) {
    const resetTime = rateLimiter.getTimeUntilReset(userId);
    throw new Error(`Rate limit exceeded. Please wait ${resetTime} seconds before trying again.`);
  }

  // Make the API call with retry logic
  return await retryWithBackoff(apiCall, 3, 1000);
}

// Get user-friendly error message
function getErrorMessage(error) {
  if (error.status === 429) {
    return "Too many requests. Please wait a moment and try again. Consider upgrading your OpenAI plan for higher limits.";
  }
  
  if (error.status === 401) {
    return "Invalid OpenAI API key. Please check your API key in the .env file.";
  }
  
  if (error.status === 402) {
    return "OpenAI API quota exceeded. Please add credits to your OpenAI account.";
  }
  
  if (error.status === 403) {
    return "Access forbidden. Your API key may not have permission for this operation.";
  }
  
  if (error.status === 500) {
    return "OpenAI server error. Please try again later.";
  }
  
  if (error.message?.includes('Rate limit')) {
    return error.message;
  }
  
  return `OpenAI API error: ${error.message || 'Unknown error'}`;
}

module.exports = {
  callOpenAI,
  retryWithBackoff,
  getErrorMessage,
  rateLimiter
};