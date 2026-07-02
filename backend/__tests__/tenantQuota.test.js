jest.mock('../config/redis', () => {
    const store = new Map();
    const redis = {
        incr: jest.fn(async (key) => {
            const next = (store.get(key) || 0) + 1;
            store.set(key, next);
            return next;
        }),
        expire: jest.fn(async () => 1),
        ttl: jest.fn(async () => 120),
    };
    return { getRedisClient: () => redis };
});

const { checkTenantQuota } = require('../utils/tenantQuota');

describe('tenant quota', () => {
    test('allows requests under limit', async () => {
        const result = await checkTenantQuota('user-1', 'ai_minutely', { limit: 5, windowSec: 60 });
        expect(result.allowed).toBe(true);
        expect(result.count).toBe(1);
    });

    test('blocks requests above limit', async () => {
        for (let i = 0; i < 3; i++) {
            await checkTenantQuota('user-2', 'sync_hourly', { limit: 2, windowSec: 60 });
        }
        const blocked = await checkTenantQuota('user-2', 'sync_hourly', { limit: 2, windowSec: 60 });
        expect(blocked.allowed).toBe(false);
        expect(blocked.retryAfterSec).toBeGreaterThan(0);
    });
});
