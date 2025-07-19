// Simple in-memory rate limiter
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.windowMs = 60000; // 1 minute window
    this.maxRequests = 10; // Max 10 requests per minute per user
  }

  isAllowed(userId = 'anonymous') {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    // Check if under limit
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(userId, validRequests);
    
    return true;
  }

  getTimeUntilReset(userId = 'anonymous') {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    if (userRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...userRequests);
    const timeUntilReset = this.windowMs - (now - oldestRequest);
    
    return Math.max(0, Math.ceil(timeUntilReset / 1000)); // Return seconds
  }

  getRemainingRequests(userId = 'anonymous') {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

module.exports = new RateLimiter();