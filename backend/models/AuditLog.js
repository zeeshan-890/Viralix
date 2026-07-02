const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
        type: String,
        required: true,
        index: true,
    },
    resourceType: { type: String, index: true },
    resourceId: { type: String, index: true },
    traceId: { type: String, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: String,
}, { timestamps: true });

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, action: 1, createdAt: -1 });
AuditLogSchema.index({ traceId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, resourceType: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
