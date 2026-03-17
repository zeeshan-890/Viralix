const mongoose = require('mongoose');

const PlatformContentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    platform: {
        type: String,
        enum: ['instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'linkedin'],
        required: true,
        index: true
    },
    platformContentId: {
        type: String,
        required: true
    },
    accountId: {
        type: String,
        required: true
    },
    // Content info
    title: String,
    description: String,
    thumbnail: String,
    mediaUrl: String,
    mediaType: {
        type: String,
        enum: ['image', 'video', 'text', 'carousel'],
        default: 'image'
    },
    permalink: String,
    // Engagement metrics
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    // Timestamps
    publishedAt: Date,
    lastSyncedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for unique content per user
PlatformContentSchema.index({ userId: 1, platform: 1, platformContentId: 1 }, { unique: true });
// Index for querying by platform
PlatformContentSchema.index({ userId: 1, platform: 1, publishedAt: -1 });

module.exports = mongoose.model('PlatformContent', PlatformContentSchema);
