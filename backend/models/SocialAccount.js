const mongoose = require('mongoose');

const SocialAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    platform: {
        type: String,
        enum: ['facebook', 'instagram', 'tiktok', 'youtube', 'twitter', 'linkedin'],
        required: true
    },
    platformAccountId: {
        type: String,
        required: true
    },
    accountName: {
        type: String,
        required: true
    },
    // In a real production app, these should be encrypted
    accessToken: {
        type: String,
        required: true,
        select: false // Do not return by default
    },
    refreshToken: {
        type: String,
        select: false
    },
    tokenExpires: Date,
    avatarUrl: String,
    profileUrl: String,
    followerCount: Number,

    // Platform specific data (e.g. page category, channel ID)
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },

    isActive: {
        type: Boolean,
        default: true
    },
    lastUsed: Date,
    connectedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for unique accounts per user
SocialAccountSchema.index({ userId: 1, platform: 1, platformAccountId: 1 }, { unique: true });

module.exports = mongoose.model('SocialAccount', SocialAccountSchema);
