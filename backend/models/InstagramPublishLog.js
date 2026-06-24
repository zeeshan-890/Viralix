const mongoose = require('mongoose');

const InstagramPublishLogSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    igUserId: { type: String, required: true },
    mediaType: {
        type: String,
        enum: ['IMAGE', 'REELS', 'STORIES', 'CAROUSEL'],
        required: true
    },
    caption: String,
    mediaUrls: [String],
    containerId: String,
    carouselChildren: [String],
    publishedMediaId: String,
    status: {
        type: String,
        enum: ['pending', 'processing', 'published', 'failed'],
        default: 'pending'
    },
    error: String
}, { timestamps: true });

module.exports = mongoose.model('InstagramPublishLog', InstagramPublishLogSchema);
