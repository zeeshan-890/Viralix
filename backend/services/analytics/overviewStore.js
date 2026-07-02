const AnalyticsOverviewSnapshot = require('../../models/AnalyticsOverviewSnapshot');
const { computeAnalyticsOverview } = require('./computeOverview');
const { buildCacheKey, cacheGet, cacheSet, cacheDelByPrefix } = require('../../utils/cache');

const DEFAULT_PERIOD_KEY = '30d';
const OVERVIEW_CACHE_TTL_SEC = Number(process.env.ANALYTICS_OVERVIEW_CACHE_TTL_SEC || 180);

function overviewCacheKey(userId, periodKey = DEFAULT_PERIOD_KEY) {
    return buildCacheKey('analytics', 'overview', String(userId), periodKey);
}

async function getMaterializedOverview(userId, periodKey = DEFAULT_PERIOD_KEY) {
    const cached = await cacheGet(overviewCacheKey(userId, periodKey));
    if (cached) return { ...cached, source: 'cache' };

    const snapshot = await AnalyticsOverviewSnapshot.findOne({ userId, periodKey }).lean();
    if (snapshot?.payload) {
        await cacheSet(overviewCacheKey(userId, periodKey), snapshot.payload, OVERVIEW_CACHE_TTL_SEC);
        return { ...snapshot.payload, source: 'materialized', computedAt: snapshot.computedAt };
    }

    return null;
}

async function materializeAnalyticsOverview(userId, options = {}) {
    const periodKey = options.periodKey || DEFAULT_PERIOD_KEY;
    const payload = await computeAnalyticsOverview(userId, options);
    const computedAt = new Date();

    await AnalyticsOverviewSnapshot.findOneAndUpdate(
        { userId, periodKey },
        { payload, computedAt },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await cacheDelByPrefix(buildCacheKey('analytics', 'overview', String(userId)));
    await cacheSet(overviewCacheKey(userId, periodKey), payload, OVERVIEW_CACHE_TTL_SEC);

    return { periodKey, computedAt, payload };
}

module.exports = {
    DEFAULT_PERIOD_KEY,
    overviewCacheKey,
    getMaterializedOverview,
    materializeAnalyticsOverview,
};
