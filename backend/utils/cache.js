const { getRedisClient } = require('../config/redis');

const CACHE_ENABLED = process.env.CACHE_ENABLED !== '0';
const DEFAULT_TTL_SEC = Number(process.env.CACHE_DEFAULT_TTL_SEC || 120);

function isCacheEnabled() {
    return CACHE_ENABLED;
}

function buildCacheKey(...parts) {
    return parts.filter((part) => part !== undefined && part !== null && part !== '').join(':');
}

async function cacheGet(key) {
    if (!CACHE_ENABLED || !key) return null;
    try {
        const raw = await getRedisClient().get(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

async function cacheSet(key, value, ttlSec = DEFAULT_TTL_SEC) {
    if (!CACHE_ENABLED || !key) return false;
    try {
        await getRedisClient().set(key, JSON.stringify(value), 'EX', ttlSec);
        return true;
    } catch {
        return false;
    }
}

async function cacheDel(key) {
    if (!CACHE_ENABLED || !key) return false;
    try {
        await getRedisClient().del(key);
        return true;
    } catch {
        return false;
    }
}

async function cacheDelByPrefix(prefix) {
    if (!CACHE_ENABLED || !prefix) return 0;
    try {
        const redis = getRedisClient();
        let cursor = '0';
        let deleted = 0;
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                deleted += await redis.del(...keys);
            }
        } while (cursor !== '0');
        return deleted;
    } catch {
        return 0;
    }
}

module.exports = {
    isCacheEnabled,
    buildCacheKey,
    cacheGet,
    cacheSet,
    cacheDel,
    cacheDelByPrefix,
    DEFAULT_TTL_SEC,
};
