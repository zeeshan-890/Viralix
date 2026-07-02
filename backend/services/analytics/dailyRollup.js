const AnalyticsDailyRollup = require('../../models/AnalyticsDailyRollup');
const { applyReadPreference, getModelForReads } = require('../../utils/readDb');

function todayDateKey(date = new Date()) {
    return date.toISOString().split('T')[0];
}

async function upsertDailyRollup(userId, overviewPayload, date = new Date()) {
    const dateKey = todayDateKey(date);
    const overview = overviewPayload?.overview || {};

    const doc = await AnalyticsDailyRollup.findOneAndUpdate(
        { userId, dateKey },
        {
            metrics: {
                totalPosts: overview.totalPosts || 0,
                publishedPosts: overview.publishedPosts || 0,
                scheduledPosts: overview.scheduledPosts || 0,
                totalViews: overview.totalViews || 0,
                totalLikes: overview.totalLikes || 0,
                totalComments: overview.totalComments || 0,
                totalShares: overview.totalShares || 0,
                totalEngagement: overview.totalEngagement || 0,
                engagementRate: overview.engagementRate || 0,
            },
            platformBreakdown: overviewPayload?.platformBreakdown || {},
            computedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return doc;
}

async function getAnalyticsTrends(userId, days = 90) {
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
    };
}

module.exports = {
    todayDateKey,
    upsertDailyRollup,
    getAnalyticsTrends,
};
