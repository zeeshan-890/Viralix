const AuditLog = require('../models/AuditLog');
const { log } = require('./logger');

async function recordAuditEvent({
    actorId,
    userId,
    action,
    resourceType,
    resourceId,
    traceId,
    metadata = {},
    ip,
}) {
    try {
        await AuditLog.create({
            actorId,
            userId: userId || actorId,
            action,
            resourceType,
            resourceId,
            traceId,
            metadata,
            ip,
        });
    } catch (error) {
        log('warn', 'audit event write failed', {
            action,
            actorId: String(actorId || ''),
            error: error.message,
        });
    }
}

module.exports = { recordAuditEvent };
