const mongoose = require('mongoose');
const { getIgTestConnection } = require('../../config/igTestDb');

const IgTestPublishLogSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    igUserId: {
        type: String,
        required: true
    },
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
        enum: ['pending', 'published', 'failed'],
        default: 'pending'
    },
    error: String
}, {
    timestamps: true
});

const connection = getIgTestConnection();

module.exports = connection
    ? connection.model('IgTestPublishLog', IgTestPublishLogSchema)
    : mongoose.model('IgTestPublishLog', IgTestPublishLogSchema);
