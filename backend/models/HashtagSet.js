const mongoose = require('mongoose');

const HashtagSetSchema = new mongoose.Schema({
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
    hashtags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    platform: {
        type: String,
        enum: ['all', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube'],
        default: 'all'
    },
    category: {
        type: String,
        trim: true,
        default: 'general'
    },
    usageCount: {
        type: Number,
        default: 0
    },
    // Performance tracking (updated when posts using this set publish)
    performance: {
        avgLikes: { type: Number, default: 0 },
        avgComments: { type: Number, default: 0 },
        avgReach: { type: Number, default: 0 },
        postsUsed: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

HashtagSetSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('HashtagSet', HashtagSetSchema);
