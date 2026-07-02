const mongoose = require('mongoose');

const PlatformSyncJobSchema = new mongoose.Schema({
    jobId: { type: String, required: true, unique: true, index: true },
    traceId: { type: String, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: ['instagram', 'tiktok', 'youtube', 'facebook', 'all'], required: true, index: true },
    status: {
        type: String,
        enum: ['queued', 'processing', 'completed', 'failed'],
        default: 'queued',
        index: true,
    },
    progress: { type: Number, default: 0 },
    result: {
        synced: { type: Number, default: 0 },
        byPlatform: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    logs: [{
        timestamp: { type: Date, default: Date.now },
        level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
        message: String,
    }],
    error: String,
    startedAt: Date,
    completedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('PlatformSyncJob', PlatformSyncJobSchema);

