const mongoose = require('mongoose');

const AnalyticsOverviewSnapshotSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    periodKey: { type: String, required: true, default: '30d', index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    computedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

AnalyticsOverviewSnapshotSchema.index({ userId: 1, periodKey: 1 }, { unique: true });

module.exports = mongoose.model('AnalyticsOverviewSnapshot', AnalyticsOverviewSnapshotSchema);
