const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    platform: {
        type: String,
        enum: ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube'],
        required: true
    },
    // ID of the person on the other end (their platform user ID)
    participantId: {
        type: String,
        required: true
    },
    participantName: {
        type: String,
        default: 'Unknown'
    },
    participantAvatar: String,
    // What started the conversation
    type: {
        type: String,
        enum: ['comment', 'dm', 'mention', 'reply'],
        default: 'comment'
    },
    // Link to the post if it's a comment thread
    postId: String,
    postTitle: String,
    // Quick access
    lastMessage: {
        text: String,
        direction: { type: String, enum: ['inbound', 'outbound'] },
        timestamp: Date
    },
    unreadCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'archived', 'snoozed'],
        default: 'open'
    },
    labels: [String],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Sentiment from the latest inbound message
    sentiment: {
        label: String,
        confidence: Number
    }
}, {
    timestamps: true
});

ConversationSchema.index({ userId: 1, status: 1, updatedAt: -1 });
ConversationSchema.index({ userId: 1, platform: 1 });
ConversationSchema.index({ participantId: 1, platform: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
