const mongoose = require('mongoose');

const AnalyticsDailyRollupSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    metrics: {
        totalPosts: { type: Number, default: 0 },
        publishedPosts: { type: Number, default: 0 },
        scheduledPosts: { type: Number, default: 0 },
        totalViews: { type: Number, default: 0 },
        totalLikes: { type: Number, default: 0 },
        totalComments: { type: Number, default: 0 },
        totalShares: { type: Number, default: 0 },
        totalEngagement: { type: Number, default: 0 },
        engagementRate: { type: Number, default: 0 },
    },
    platformBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    computedAt: { type: Date, default: Date.now },
}, { timestamps: true });

AnalyticsDailyRollupSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
AnalyticsDailyRollupSchema.index({ userId: 1, dateKey: -1 });

module.exports = mongoose.model('AnalyticsDailyRollup', AnalyticsDailyRollupSchema);
