const mongoose = require('mongoose');

const KeywordAlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    keyword: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    platform: {
        type: String,
        enum: ['all', 'instagram', 'facebook', 'tiktok', 'youtube', 'twitter'],
        default: 'all'
    },
    enabled: {
        type: Boolean,
        default: true
    },
    matchCount: {
        type: Number,
        default: 0
    },
    // Store last N matches for quick display
    recentMatches: [{
        commentId: String,
        commentText: String,
        authorName: String,
        platform: String,
        postId: String,
        matchedAt: { type: Date, default: Date.now }
    }],
    notifications: [{
        commentId: String,
        commentText: { type: String, maxlength: 500 },
        authorName: String,
        platform: String,
        postId: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Indexes
KeywordAlertSchema.index({ userId: 1, enabled: 1 });
KeywordAlertSchema.index({ userId: 1, keyword: 1 }, { unique: true });
KeywordAlertSchema.index({ 'notifications.read': 1 });

module.exports = mongoose.model('KeywordAlert', KeywordAlertSchema);
