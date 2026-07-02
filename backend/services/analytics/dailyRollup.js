const AnalyticsDailyRollup = require('../../models/AnalyticsDailyRollup');

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

module.exports = {
    todayDateKey,
    upsertDailyRollup,
};
