const AnalyticsDailyRollup = require('../../models/AnalyticsDailyRollup');
const { applyReadPreference, getModelForReads } = require('../../utils/readDb');
const { todayDateKey } = require('./dailyRollup');
const { log } = require('../../utils/logger');

const ANALYTICS_TRENDS_BACKEND = (process.env.ANALYTICS_TRENDS_BACKEND || 'mongo').toLowerCase();

async function fetchTrendsFromMongo(userId, days) {
    const safeDays = Math.min(Math.max(parseInt(days, 10) || 90, 7), 365);
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - safeDays);
    const startKey = todayDateKey(startDate);

    const RollupModel = getModelForReads(AnalyticsDailyRollup);
    const rollups = await applyReadPreference(
        RollupModel.find({
            userId,
            dateKey: { $gte: startKey },
        })
    )
        .sort({ dateKey: 1 })
        .lean();

    return {
        days: safeDays,
        timeline: rollups.map((row) => ({
            date: row.dateKey,
            metrics: row.metrics,
            platformBreakdown: row.platformBreakdown,
        })),
        source: 'rollup',
        backend: 'mongo',
    };
}

async function fetchTrendsFromExternal(userId, days) {
    const endpoint = process.env.ANALYTICS_TRENDS_EXTERNAL_URL;
    if (!endpoint) {
        log('warn', 'analytics trends external backend not configured; falling back to mongo', {
            userId: String(userId),
        });
        return fetchTrendsFromMongo(userId, days);
    }

    // Placeholder for ClickHouse/BigQuery HTTP adapter — keeps API contract stable.
    log('info', 'analytics trends external backend requested but not implemented; using mongo', {
        userId: String(userId),
        endpoint,
    });
    return fetchTrendsFromMongo(userId, days);
}

async function getAnalyticsTrends(userId, days = 90) {
    if (ANALYTICS_TRENDS_BACKEND === 'external') {
        return fetchTrendsFromExternal(userId, days);
    }
    return fetchTrendsFromMongo(userId, days);
}

function mapRollupTimelineToPerformance(timeline, platform) {
    return timeline.map((row) => {
        if (!platform) {
            return {
                date: row.date,
                views: row.metrics?.totalViews || 0,
                engagement: row.metrics?.totalEngagement || 0,
                posts: row.metrics?.publishedPosts || 0,
            };
        }

        const breakdown = row.platformBreakdown?.[platform];
        if (!breakdown) {
            return { date: row.date, views: 0, engagement: 0, posts: 0 };
        }

        const engagement = breakdown.engagement || {};
        return {
            date: row.date,
            views: engagement.views || 0,
            engagement: (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0),
            posts: breakdown.published || 0,
        };
    });
}

function periodToDays(period) {
    switch (period) {
        case '7d': return 7;
        case '90d': return 90;
        case '1y': return 365;
        default: return 30;
    }
}

function shouldUseRollupForPerformance(period) {
    if (process.env.ANALYTICS_TRENDS_USE_ROLLUP === '0') return false;
    return period === '90d' || period === '1y';
}

module.exports = {
    getAnalyticsTrends,
    mapRollupTimelineToPerformance,
    periodToDays,
    shouldUseRollupForPerformance,
    ANALYTICS_TRENDS_BACKEND,
};
