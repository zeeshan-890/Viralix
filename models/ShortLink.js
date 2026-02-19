const mongoose = require('mongoose');
const crypto = require('crypto');

const shortLinkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto.randomBytes(4).toString('base64url').slice(0, 8)
    },
    originalUrl: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        trim: true,
        default: ''
    },
    clicks: {
        type: Number,
        default: 0
    },
    clickLog: [{
        timestamp: { type: Date, default: Date.now },
        referrer: String,
        userAgent: String,
        ip: String
    }],
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
shortLinkSchema.index({ slug: 1 }, { unique: true });
shortLinkSchema.index({ userId: 1, createdAt: -1 });
shortLinkSchema.index({ postId: 1 });

module.exports = mongoose.model('ShortLink', shortLinkSchema);
