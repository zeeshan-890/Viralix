const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');

function shouldUseRedisStore() {
    return process.env.RATE_LIMIT_USE_REDIS !== '0';
}

function createRedisStore(prefix) {
    if (!shouldUseRedisStore()) return undefined;
    try {
        const redis = getRedisClient();
        return new RedisStore({
            prefix,
            sendCommand: (...args) => redis.call(...args),
        });
    } catch (error) {
        console.warn('[RateLimiter] Falling back to memory store:', error.message);
        return undefined;
    }
}

function createLimiter(options) {
    return rateLimit({
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.method === 'OPTIONS',
        ...options,
    });
}

const limiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    store: createRedisStore('rl:general:'),
    message: {
        status: 429,
        message: 'Too many requests, please try again later.',
    },
});

const authLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 50,
    store: createRedisStore('rl:auth:'),
    message: {
        status: 429,
        message: 'Too many login attempts, please try again later.',
    },
});

const aiLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 20,
    store: createRedisStore('rl:ai:'),
    message: {
        status: 429,
        message: 'Too many AI requests, please try again later.',
    },
});

module.exports = {
    limiter,
    authLimiter,
    aiLimiter,
    // exported for tests
    createRedisStore,
    shouldUseRedisStore,
};
