const mongoose = require('mongoose');

const WebhookEventSchema = new mongoose.Schema({
    platform: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    processedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

WebhookEventSchema.index({ platform: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('WebhookEvent', WebhookEventSchema);
