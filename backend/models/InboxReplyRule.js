const mongoose = require('mongoose');

const InboxReplyRuleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: { type: String, required: true },
    type: {
        type: String,
        enum: ['comment_dm', 'dm_keyword', 'away', 'welcome'],
        required: true
    },
    platforms: [{ type: String }],
    enabled: { type: Boolean, default: true },
    triggerType: { type: String, enum: ['keyword', 'any'], default: 'keyword' },
    keywords: [{ type: String }],
    targetAudience: { type: String, default: 'anyone' },
    replyType: { type: String, enum: ['fixed', 'ai'], default: 'fixed' },
    replyMessage: { type: String, default: '' },
    aiTone: { type: String, default: 'friendly' },
    stats: {
        sent: { type: Number, default: 0 },
        failed: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

InboxReplyRuleSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('InboxReplyRule', InboxReplyRuleSchema);
