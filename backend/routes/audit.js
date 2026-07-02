const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { cacheHeaders } = require('../middleware/cacheHeaders');
const AuditLog = require('../models/AuditLog');
const DomainEvent = require('../models/DomainEvent');
const { applyReadPreference, getModelForReads } = require('../utils/readDb');

const router = express.Router();

/**
 * GET /api/audit/logs
 * Admin-only audit trail query endpoint.
 */
router.get('/logs', auth, requireRole('admin'), cacheHeaders({ maxAge: 15, sMaxAge: 30, privateCache: true }), async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
        const filter = {};

        if (req.query.actorId) filter.actorId = req.query.actorId;
        if (req.query.userId) filter.userId = req.query.userId;
        if (req.query.action) filter.action = req.query.action;
        if (req.query.traceId) filter.traceId = req.query.traceId;
        if (req.query.resourceType) filter.resourceType = req.query.resourceType;

        if (req.query.since) {
            filter.createdAt = { $gte: new Date(req.query.since) };
        }

        const AuditLogRead = getModelForReads(AuditLog);
        const logs = await applyReadPreference(
            AuditLogRead.find(filter)
        )
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.json({
            count: logs.length,
            logs,
        });
    } catch {
        return res.status(500).json({ message: 'Failed to load audit logs' });
    }
});

/**
 * GET /api/audit/domain-events
 * Admin-only domain event query endpoint.
 */
router.get('/domain-events', auth, requireRole('admin'), cacheHeaders({ maxAge: 15, sMaxAge: 30, privateCache: true }), async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
        const filter = {};

        if (req.query.userId) filter.userId = req.query.userId;
        if (req.query.eventType) filter.eventType = req.query.eventType;
        if (req.query.traceId) filter.traceId = req.query.traceId;
        if (req.query.aggregateType) filter.aggregateType = req.query.aggregateType;
        if (req.query.status) filter.status = req.query.status;

        if (req.query.since) {
            filter.createdAt = { $gte: new Date(req.query.since) };
        }

        const DomainEventRead = getModelForReads(DomainEvent);
        const events = await applyReadPreference(
            DomainEventRead.find(filter)
        )
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.json({
            count: events.length,
            events,
        });
    } catch {
        return res.status(500).json({ message: 'Failed to load domain events' });
    }
});

module.exports = router;
