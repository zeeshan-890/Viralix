const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    // inbound = from follower/customer, outbound = our reply
    direction: {
        type: String,
        enum: ['inbound', 'outbound'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    // Platform-specific message/comment ID
    externalId: String,
    senderName: String,
    senderId: String,
    // Attachments (images, links, etc.)
    attachments: [{
        type: { type: String, enum: ['image', 'video', 'link', 'file'] },
        url: String,
        filename: String
    }],
    // AI-powered
    sentiment: {
        label: String,
        confidence: Number
    },
    // Was this an auto-reply?
    isAutoReply: {
        type: Boolean,
        default: false
    },
    // Read status
    readAt: Date
}, {
    timestamps: true
});

MessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
