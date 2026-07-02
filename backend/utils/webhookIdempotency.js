const WebhookEvent = require('../models/WebhookEvent');
const { buildCacheKey, cacheGet, cacheSet } = require('./cache');

const WEBHOOK_DEDUPE_TTL_SEC = Number(process.env.WEBHOOK_IDEMPOTENCY_TTL_SEC || 86400);

function webhookDedupeCacheKey(platform, eventId) {
    return buildCacheKey('webhook', 'dedupe', platform, eventId);
}

/**
 * Claim a webhook event exactly once.
 * Redis provides fast dedupe; Mongo unique index is the durable source of truth.
 */
async function claimWebhookEvent(platform, eventId, metadata = {}) {
    if (!platform || !eventId) return false;

    const cacheKey = webhookDedupeCacheKey(platform, eventId);
    const cached = await cacheGet(cacheKey);
    if (cached?.claimed) return false;

    try {
        await WebhookEvent.create({
            platform,
            eventId,
            metadata,
            processedAt: new Date(),
        });
        await cacheSet(cacheKey, { claimed: true }, WEBHOOK_DEDUPE_TTL_SEC);
        return true;
    } catch (error) {
        if (error?.code === 11000) {
            await cacheSet(cacheKey, { claimed: true }, WEBHOOK_DEDUPE_TTL_SEC);
            return false;
        }
        throw error;
    }
}

module.exports = {
    claimWebhookEvent,
    webhookDedupeCacheKey,
    WEBHOOK_DEDUPE_TTL_SEC,
};
