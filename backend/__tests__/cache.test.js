jest.mock('../config/redis', () => {
    const store = new Map();
    const redis = {
        get: jest.fn(async (key) => store.get(key) || null),
        set: jest.fn(async (key, value, _ex, ttl) => {
            store.set(key, value);
            return 'OK';
        }),
        del: jest.fn(async (...keys) => {
            keys.forEach((key) => store.delete(key));
            return keys.length;
        }),
        scan: jest.fn(async () => ['0', []]),
    };
    return { getRedisClient: () => redis };
});

const { buildCacheKey, cacheGet, cacheSet, cacheDel } = require('../utils/cache');

describe('cache utility', () => {
    test('builds stable cache keys', () => {
        expect(buildCacheKey('analytics', 'overview', 'user-1')).toBe('analytics:overview:user-1');
    });

    test('stores and reads JSON values', async () => {
        const key = buildCacheKey('test', 'value');
        await cacheSet(key, { ok: true }, 60);
        const value = await cacheGet(key);
        expect(value).toEqual({ ok: true });
    });

    test('deletes cached values', async () => {
        const key = buildCacheKey('test', 'delete');
        await cacheSet(key, { ok: true }, 60);
        await cacheDel(key);
        const value = await cacheGet(key);
        expect(value).toBeNull();
    });
});
