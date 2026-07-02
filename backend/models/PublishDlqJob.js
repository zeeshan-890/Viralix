const mongoose = require('mongoose');

const PublishDlqJobSchema = new mongoose.Schema({
    dlqJobId: { type: String, required: true, unique: true, index: true },
    publishJobId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    queueJobId: String,
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    error: String,
    status: {
        type: String,
        enum: ['dead_lettered', 'replayed', 'replay_failed'],
        default: 'dead_lettered',
        index: true,
    },
    replayedAt: Date,
}, { timestamps: true });

PublishDlqJobSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('PublishDlqJob', PublishDlqJobSchema);
