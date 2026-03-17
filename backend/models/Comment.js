const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    platform: {
        type: String,
        enum: ['instagram', 'facebook'],
        required: true
    },
    postId: {
        type: String,  // Platform-specific media/post ID
        required: true
    },
    commentId: {
        type: String,  // Platform-specific comment ID
        required: true,
        unique: true
    },
    text: {
        type: String,
        required: true
    },
    authorName: {
        type: String,
        default: 'Unknown'
    },
    authorId: {
        type: String
    },
    // AI Sentiment Analysis
    sentiment: {
        label: {
            type: String,
            enum: ['positive', 'negative', 'neutral'],
            default: 'neutral'
        },
        confidence: {
            type: Number,
            min: 0,
            max: 1,
            default: 0
        },
        isToxic: {
            type: Boolean,
            default: false
        },
        isUrgent: {
            type: Boolean,
            default: false
        }
    },
    processedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
commentSchema.index({ userId: 1, platform: 1, postId: 1 });
commentSchema.index({ 'sentiment.label': 1 });
commentSchema.index({ 'sentiment.isToxic': 1 });
commentSchema.index({ 'sentiment.isUrgent': 1 });
commentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
