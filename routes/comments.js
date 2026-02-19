const express = require('express');
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');

const router = express.Router();

// GET /api/comments/sentiment-summary — Aggregate sentiment breakdown
router.get('/sentiment-summary', auth, async (req, res) => {
    try {
        const { days = 30, platform } = req.query;
        const lookbackDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

        const matchFilter = {
            userId: req.user._id || req.user.id,
            createdAt: { $gte: lookbackDate }
        };
        if (platform) matchFilter.platform = platform;

        const pipeline = [
            { $match: matchFilter },
            {
                $group: {
                    _id: '$sentiment.label',
                    count: { $sum: 1 },
                    avgConfidence: { $avg: '$sentiment.confidence' }
                }
            }
        ];

        const results = await Comment.aggregate(pipeline);

        const total = results.reduce((sum, r) => sum + r.count, 0);
        const summary = {
            total,
            positive: 0,
            negative: 0,
            neutral: 0,
            positivePercent: 0,
            negativePercent: 0,
            neutralPercent: 0
        };

        results.forEach(r => {
            summary[r._id] = r.count;
            summary[`${r._id}Percent`] = total > 0 ? Math.round((r.count / total) * 100) : 0;
        });

        // Count toxic and urgent
        const toxicCount = await Comment.countDocuments({ ...matchFilter, 'sentiment.isToxic': true });
        const urgentCount = await Comment.countDocuments({ ...matchFilter, 'sentiment.isUrgent': true });

        summary.toxic = toxicCount;
        summary.urgent = urgentCount;
        summary.lookbackDays = parseInt(days);

        res.json(summary);
    } catch (error) {
        console.error('[COMMENTS] sentiment-summary error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/comments/recent — Recent comments with sentiment (paginated)
router.get('/recent', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const { platform, sentiment } = req.query;

        const filter = { userId: req.user._id || req.user.id };
        if (platform) filter.platform = platform;
        if (sentiment) filter['sentiment.label'] = sentiment;

        const [comments, total] = await Promise.all([
            Comment.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Comment.countDocuments(filter)
        ]);

        res.json({
            comments,
            pagination: { current: page, pages: Math.ceil(total / limit), total }
        });
    } catch (error) {
        console.error('[COMMENTS] recent error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/comments/urgent — Urgent or toxic comments requiring attention
router.get('/urgent', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const filter = {
            userId: req.user._id || req.user.id,
            $or: [
                { 'sentiment.isToxic': true },
                { 'sentiment.isUrgent': true }
            ]
        };

        const [comments, total] = await Promise.all([
            Comment.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Comment.countDocuments(filter)
        ]);

        res.json({
            comments,
            pagination: { current: page, pages: Math.ceil(total / limit), total }
        });
    } catch (error) {
        console.error('[COMMENTS] urgent error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
