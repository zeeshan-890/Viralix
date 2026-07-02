const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

/**
 * GET /api/audit/logs
 * Admin-only audit trail query endpoint.
 */
router.get('/logs', auth, requireRole('admin'), async (req, res) => {
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

        const logs = await AuditLog.find(filter)
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

module.exports = router;
