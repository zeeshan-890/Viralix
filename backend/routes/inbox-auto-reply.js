const express = require('express');
const auth = require('../middleware/auth');
const InboxReplySettings = require('../models/InboxReplySettings');
const InboxReplyRule = require('../models/InboxReplyRule');

const router = express.Router();

function toSettingsResponse(doc) {
    const obj = doc.toObject ? doc.toObject() : doc;
    const { userId, __v, ...rest } = obj;
    return rest;
}

// GET /api/inbox/auto-reply/settings
router.get('/settings', auth, async (req, res) => {
    try {
        const doc = await InboxReplySettings.getOrCreate(req.user.id);
        res.json(toSettingsResponse(doc));
    } catch (e) {
        console.error('[AutoReply] Get settings error:', e.message);
        res.status(500).json({ message: 'Failed to load settings' });
    }
});

// PATCH /api/inbox/auto-reply/settings
router.patch('/settings', auth, async (req, res) => {
    try {
        const doc = await InboxReplySettings.getOrCreate(req.user.id);
        const allowed = [
            'aiEnabled', 'aiMode', 'defaultTone', 'businessHoursOnly',
            'businessHours', 'confidenceThreshold', 'includeContext',
            'signOff', 'autoReplyEnabled'
        ];
        for (const key of allowed) {
            if (req.body[key] !== undefined) doc[key] = req.body[key];
        }
        await doc.save();
        res.json(toSettingsResponse(doc));
    } catch (e) {
        console.error('[AutoReply] Update settings error:', e.message);
        res.status(500).json({ message: 'Failed to save settings' });
    }
});

// GET /api/inbox/auto-reply/rules
router.get('/rules', auth, async (req, res) => {
    try {
        const rules = await InboxReplyRule.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ rules });
    } catch (e) {
        console.error('[AutoReply] List rules error:', e.message);
        res.status(500).json({ message: 'Failed to load rules' });
    }
});

// POST /api/inbox/auto-reply/rules
router.post('/rules', auth, async (req, res) => {
    try {
        const rule = await InboxReplyRule.create({
            userId: req.user.id,
            enabled: true,
            stats: { sent: 0, failed: 0 },
            keywords: [],
            platforms: ['instagram'],
            triggerType: 'keyword',
            replyType: 'fixed',
            targetAudience: 'anyone',
            ...req.body
        });
        res.status(201).json({ rule });
    } catch (e) {
        console.error('[AutoReply] Create rule error:', e.message);
        res.status(500).json({ message: 'Failed to create rule' });
    }
});

// PUT /api/inbox/auto-reply/rules/:id
router.put('/rules/:id', auth, async (req, res) => {
    try {
        const rule = await InboxReplyRule.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!rule) return res.status(404).json({ message: 'Rule not found' });
        res.json({ rule });
    } catch (e) {
        console.error('[AutoReply] Update rule error:', e.message);
        res.status(500).json({ message: 'Failed to update rule' });
    }
});

// DELETE /api/inbox/auto-reply/rules/:id
router.delete('/rules/:id', auth, async (req, res) => {
    try {
        const result = await InboxReplyRule.deleteOne({
            _id: req.params.id,
            userId: req.user.id
        });
        if (!result.deletedCount) return res.status(404).json({ message: 'Rule not found' });
        res.json({ success: true });
    } catch (e) {
        console.error('[AutoReply] Delete rule error:', e.message);
        res.status(500).json({ message: 'Failed to delete rule' });
    }
});

// PATCH /api/inbox/auto-reply/rules/:id/toggle
router.patch('/rules/:id/toggle', auth, async (req, res) => {
    try {
        const rule = await InboxReplyRule.findOne({
            _id: req.params.id,
            userId: req.user.id
        });
        if (!rule) return res.status(404).json({ message: 'Rule not found' });
        rule.enabled = !rule.enabled;
        await rule.save();
        res.json({ rule });
    } catch (e) {
        console.error('[AutoReply] Toggle rule error:', e.message);
        res.status(500).json({ message: 'Failed to toggle rule' });
    }
});

module.exports = router;
