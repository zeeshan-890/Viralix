const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const { getRedisClient } = require('../config/redis'); // Use our existing redis connection if possible

// Fallback to memory store if Redis is not available or disconnected
// But since we set up Redis in Phase 1, we should try to use it for distributed limiting.
// However, rate-limit-redis requires a specific client interface. 
// For simplicity in this "quick win" phase, we'll start with MemoryStore 
// but design it to be easily switchable.

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 429,
        message: 'Too many requests, please try again later.'
    }
});

// Stricter limit for auth routes (login/signup)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login attempts per hour
    message: {
        status: 429,
        message: 'Too many login attempts, please try again later.'
    }
});

module.exports = { limiter, authLimiter };
