const express = require('express');
const auth = require('../middleware/auth');
const KeywordAlert = require('../models/KeywordAlert');

const router = express.Router();

// GET /api/keyword-alerts — list all alerts for user
router.get('/', auth, async (req, res) => {
    try {
        const alerts = await KeywordAlert.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ alerts });
    } catch (e) {
        console.error('[KeywordAlerts] List error:', e.message);
        res.status(500).json({ message: 'Failed to load alerts' });
    }
});

// POST /api/keyword-alerts — create new keyword alert
router.post('/', auth, async (req, res) => {
    try {
        const { keyword, platform = 'all' } = req.body;
        if (!keyword || keyword.trim().length < 2) {
            return res.status(400).json({ message: 'Keyword must be at least 2 characters' });
        }

        // Check duplicate
        const existing = await KeywordAlert.findOne({
            userId: req.user.id,
            keyword: keyword.trim().toLowerCase()
        });
        if (existing) {
            return res.status(409).json({ message: 'You already have an alert for this keyword' });
        }

        const alert = new KeywordAlert({
            userId: req.user.id,
            keyword: keyword.trim().toLowerCase(),
            platform
        });
        await alert.save();
        res.status(201).json(alert);
    } catch (e) {
        console.error('[KeywordAlerts] Create error:', e.message);
        res.status(500).json({ message: 'Failed to create alert' });
    }
});

// PATCH /api/keyword-alerts/:id/toggle — enable/disable
router.patch('/:id/toggle', auth, async (req, res) => {
    try {
        const alert = await KeywordAlert.findOne({ _id: req.params.id, userId: req.user.id });
        if (!alert) return res.status(404).json({ message: 'Alert not found' });

        alert.enabled = !alert.enabled;
        await alert.save();
        res.json(alert);
    } catch (e) {
        res.status(500).json({ message: 'Toggle failed' });
    }
});

// DELETE /api/keyword-alerts/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const alert = await KeywordAlert.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!alert) return res.status(404).json({ message: 'Alert not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

// GET /api/keyword-alerts/notifications — all unread notifications
router.get('/notifications', auth, async (req, res) => {
    try {
        const alerts = await KeywordAlert.find({ userId: req.user.id })
            .select('keyword notifications')
            .lean();

        const allNotifications = [];
        for (const alert of alerts) {
            for (const n of alert.notifications || []) {
                allNotifications.push({
                    ...n,
                    keyword: alert.keyword,
                    alertId: alert._id
                });
            }
        }
        // Sort by date, newest first
        allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const unreadCount = allNotifications.filter(n => !n.read).length;

        res.json({
            notifications: allNotifications.slice(0, 50),
            unreadCount,
            total: allNotifications.length
        });
    } catch (e) {
        console.error('[KeywordAlerts] Notifications error:', e.message);
        res.status(500).json({ message: 'Failed to load notifications' });
    }
});

// PATCH /api/keyword-alerts/notifications/read-all — mark all as read
router.patch('/notifications/read-all', auth, async (req, res) => {
    try {
        await KeywordAlert.updateMany(
            { userId: req.user.id },
            { $set: { 'notifications.$[].read': true } }
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: 'Mark read failed' });
    }
});

/**
 * Utility: Check a comment against all keyword alerts for a user.
 * Called from webhook handlers. Not an HTTP route.
 */
async function checkKeywordAlerts({ userId, commentText, commentId, authorName, platform, postId }) {
    if (!userId || !commentText) return;

    try {
        const alerts = await KeywordAlert.find({ userId, enabled: true });
        const textLower = commentText.toLowerCase();

        for (const alert of alerts) {
            // Platform filter
            if (alert.platform !== 'all' && alert.platform !== platform) continue;

            if (textLower.includes(alert.keyword)) {
                alert.matchCount += 1;

                const matchData = {
                    commentId,
                    commentText: commentText.substring(0, 500),
                    authorName,
                    platform,
                    postId,
                    matchedAt: new Date()
                };

                // Keep last 20 recent matches
                alert.recentMatches.push(matchData);
                if (alert.recentMatches.length > 20) {
                    alert.recentMatches = alert.recentMatches.slice(-20);
                }

                // Add notification
                alert.notifications.push({
                    commentId,
                    commentText: commentText.substring(0, 500),
                    authorName,
                    platform,
                    postId,
                    read: false,
                    createdAt: new Date()
                });

                // Cap notifications at 100
                if (alert.notifications.length > 100) {
                    alert.notifications = alert.notifications.slice(-100);
                }

                await alert.save();
                console.log(`[KeywordAlert] "${alert.keyword}" matched in comment by ${authorName}`);
            }
        }
    } catch (e) {
        console.error('[KeywordAlert] Check error:', e.message);
    }
}

// Export both router and utility
router.checkKeywordAlerts = checkKeywordAlerts;
module.exports = router;
