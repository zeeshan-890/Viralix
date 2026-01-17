const mongoose = require('mongoose');

const autoReplyRuleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    platform: {
        type: String,
        enum: ['instagram'],
        default: 'instagram'
    },
    postId: {
        type: String,  // Instagram media ID
        required: true,
        index: true
    },
    accountId: {
        type: String,  // Instagram account ID
        required: true
    },
    enabled: {
        type: Boolean,
        default: true
    },
    // Trigger configuration
    triggerType: {
        type: String,
        enum: ['keyword', 'any'],
        default: 'keyword'
    },
    keywords: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    // Who can trigger the auto-reply
    targetAudience: {
        type: String,
        enum: ['followers', 'anyone'],
        default: 'anyone'
    },
    // Reply content
    replyContent: {
        message: {
            type: String,
            required: true,
            maxlength: 1000
        },
        attachmentUrl: String,
        attachmentType: {
            type: String,
            enum: ['none', 'image', 'file', 'link'],
            default: 'none'
        },
        linkUrl: String,
        linkTitle: String
    },
    // Stats
    stats: {
        triggered: { type: Number, default: 0 },
        sent: { type: Number, default: 0 },
        failed: { type: Number, default: 0 }
    },
    // Track who already received DM (to avoid duplicates)
    respondedUsers: [{
        igUserId: String,
        respondedAt: Date
    }]
}, {
    timestamps: true
});

// Compound index for efficient lookups
autoReplyRuleSchema.index({ postId: 1, enabled: 1 });
autoReplyRuleSchema.index({ userId: 1, platform: 1 });

module.exports = mongoose.model('AutoReplyRule', autoReplyRuleSchema);
