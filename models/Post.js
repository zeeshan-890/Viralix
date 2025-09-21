const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    platforms: [{
        name: {
            type: String,
            enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'],
            required: true
        },
        accountId: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['scheduled', 'published', 'failed', 'draft'],
            default: 'draft'
        },
        postId: String, // Platform-specific post ID
        publishedAt: Date,
        errorMessage: String,
        engagement: {
            likes: { type: Number, default: 0 },
            comments: { type: Number, default: 0 },
            shares: { type: Number, default: 0 },
            views: { type: Number, default: 0 },
            clicks: { type: Number, default: 0 },
            lastUpdated: { type: Date, default: Date.now }
        }
    }],
    media: [{
        type: {
            type: String,
            enum: ['image', 'video', 'gif'],
            required: true
        },
        url: {
            type: String,
            required: true
        },
        filename: String,
        size: Number,
        mimetype: String,
        alt: String
    }],
    hashtags: [String],
    mentions: [String],
    scheduledDate: Date,
    isScheduled: {
        type: Boolean,
        default: false
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    isDraft: {
        type: Boolean,
        default: true
    },
    analytics: {
        totalReach: { type: Number, default: 0 },
        totalEngagement: { type: Number, default: 0 },
        engagementRate: { type: Number, default: 0 },
        clickThroughRate: { type: Number, default: 0 },
        costPerClick: { type: Number, default: 0 },
        roi: { type: Number, default: 0 }
    },
    aiGenerated: {
        type: Boolean,
        default: false
    },
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template'
    },
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign'
    }
}, {
    timestamps: true
});

// Indexes for performance
PostSchema.index({ user: 1, createdAt: -1 });
PostSchema.index({ scheduledDate: 1 });
PostSchema.index({ 'platforms.status': 1 });
PostSchema.index({ hashtags: 1 });

module.exports = mongoose.model('Post', PostSchema);
