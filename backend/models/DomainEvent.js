const mongoose = require('mongoose');

const DomainEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    traceId: { type: String, index: true },
    aggregateType: { type: String, required: true, index: true },
    aggregateId: { type: String, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
        type: String,
        enum: ['pending', 'published', 'failed'],
        default: 'pending',
        index: true,
    },
    publishedAt: Date,
}, { timestamps: true });

DomainEventSchema.index({ eventType: 1, createdAt: -1 });
DomainEventSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('DomainEvent', DomainEventSchema);
