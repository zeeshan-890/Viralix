jest.mock('express-rate-limit', () => jest.fn((opts) => ({ __opts: opts })));
jest.mock('rate-limit-redis', () => jest.fn(function RedisStore(opts) { this.opts = opts; }));
jest.mock('../config/redis', () => ({
    getRedisClient: jest.fn(() => ({ call: jest.fn() })),
}));

describe('rate limiter config', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        delete process.env.RATE_LIMIT_USE_REDIS;
    });

    test('creates three limiter tiers with Redis store', () => {
        const mod = require('../middleware/rateLimiter');
        const rateLimit = require('express-rate-limit');
        const RedisStore = require('rate-limit-redis');
        expect(mod.limiter.__opts.max).toBe(100);
        expect(mod.authLimiter.__opts.max).toBe(50);
        expect(mod.aiLimiter.__opts.max).toBe(20);
        expect(RedisStore).toHaveBeenCalledTimes(3);
        expect(rateLimit).toHaveBeenCalledTimes(3);
    });

    test('uses distinct redis prefixes', () => {
        require('../middleware/rateLimiter');
        const RedisStore = require('rate-limit-redis');
        const calls = RedisStore.mock.calls.map((c) => c[0].prefix);
        expect(calls).toEqual(['rl:general:', 'rl:auth:', 'rl:ai:']);
    });

    test('falls back to memory when redis is disabled', () => {
        process.env.RATE_LIMIT_USE_REDIS = '0';
        const mod = require('../middleware/rateLimiter');
        expect(mod.limiter.__opts.store).toBeUndefined();
        expect(mod.authLimiter.__opts.store).toBeUndefined();
        expect(mod.aiLimiter.__opts.store).toBeUndefined();
    });
});

