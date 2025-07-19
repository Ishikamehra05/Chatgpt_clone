const rateLimiter = require('../utils/rateLimiter');

const rateLimitMiddleware = (req, res, next) => {
  const userId = req.user?.userId || req.ip || 'anonymous';
  
  // Add rate limit info to headers
  const remaining = rateLimiter.getRemainingRequests(userId);
  const resetTime = rateLimiter.getTimeUntilReset(userId);
  
  res.setHeader('X-RateLimit-Limit', '10');
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', resetTime.toString());
  
  next();
};

module.exports = rateLimitMiddleware;