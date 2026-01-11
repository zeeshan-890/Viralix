const mongoose = require('mongoose');

const PublishJobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    platforms: [{
        name: { type: String, required: true },
        accountId: { type: String, required: true },
        accountName: String,
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'retrying'],
            default: 'pending'
        },
        platformPostId: String,
        error: String
    }],
    content: {
        title: String,
        body: String,
        media: [{
            url: String,
            type: { type: String, enum: ['image', 'video', 'gif'] },
            publicId: String
        }]
    },
    status: {
        type: String,
        enum: ['queued', 'processing', 'completed', 'partially_failed', 'failed'],
        default: 'queued'
    },
    progress: {
        type: Number,
        default: 0
    },
    logs: [{
        timestamp: { type: Date, default: Date.now },
        level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
        message: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    error: String
});

module.exports = mongoose.model('PublishJob', PublishJobSchema);
