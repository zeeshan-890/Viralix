const mongoose = require('mongoose');

const CompetitorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    platform: {
        type: String,
        enum: ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube'],
        required: true
    },
    handle: {
        type: String,
        required: true,
        trim: true
    },
    // Profile data (latest)
    profilePicture: String,
    bio: String,
    // Daily snapshots for growth tracking
    snapshots: [{
        date: { type: Date, default: Date.now },
        followers: { type: Number, default: 0 },
        following: { type: Number, default: 0 },
        posts: { type: Number, default: 0 },
        engagementRate: { type: Number, default: 0 },
        avgLikes: { type: Number, default: 0 },
        avgComments: { type: Number, default: 0 }
    }],
    // Latest metrics for quick access
    latestMetrics: {
        followers: { type: Number, default: 0 },
        following: { type: Number, default: 0 },
        posts: { type: Number, default: 0 },
        engagementRate: { type: Number, default: 0 },
        avgLikes: { type: Number, default: 0 },
        avgComments: { type: Number, default: 0 }
    },
    // Growth rates (computed from snapshots)
    growth: {
        daily: { type: Number, default: 0 },
        weekly: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 }
    },
    lastSnapshotAt: Date,
    enabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

CompetitorSchema.index({ userId: 1, platform: 1 });
CompetitorSchema.index({ userId: 1 });

module.exports = mongoose.model('Competitor', CompetitorSchema);
