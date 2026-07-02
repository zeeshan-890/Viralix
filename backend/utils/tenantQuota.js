const { getRedisClient } = require('../config/redis');
const { buildCacheKey } = require('./cache');

const DEFAULT_QUOTAS = {
    publish_daily: Number(process.env.TENANT_QUOTA_PUBLISH_DAILY || 200),
    sync_hourly: Number(process.env.TENANT_QUOTA_SYNC_HOURLY || 24),
    analytics_refresh_hourly: Number(process.env.TENANT_QUOTA_ANALYTICS_REFRESH_HOURLY || 12),
    ai_minutely: Number(process.env.TENANT_QUOTA_AI_MINUTELY || 20),
};

const WINDOW_SEC = {
    publish_daily: 24 * 60 * 60,
    sync_hourly: 60 * 60,
    analytics_refresh_hourly: 60 * 60,
    ai_minutely: 60,
};

function quotaKey(userId, bucket) {
    return buildCacheKey('tenant-quota', bucket, String(userId));
}

async function checkTenantQuota(userId, bucket, options = {}) {
    const limit = options.limit ?? DEFAULT_QUOTAS[bucket];
    const windowSec = options.windowSec ?? WINDOW_SEC[bucket];
    if (!limit || !windowSec) {
        return { allowed: true, bucket, count: 0, limit: null };
    }

    try {
        const redis = getRedisClient();
        const key = quotaKey(userId, bucket);
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, windowSec);
        }

        if (count > limit) {
            const retryAfterSec = await redis.ttl(key);
            return {
                allowed: false,
                bucket,
                count,
                limit,
                retryAfterSec: retryAfterSec > 0 ? retryAfterSec : windowSec,
            };
        }

        return { allowed: true, bucket, count, limit };
    } catch {
        // Fail open if Redis is unavailable so core flows still work.
        return { allowed: true, bucket, count: 0, limit, degraded: true };
    }
}

module.exports = {
    checkTenantQuota,
    DEFAULT_QUOTAS,
    WINDOW_SEC,
};
