const express = require('express');
const auth = require('../middleware/auth');
const ShortLink = require('../models/ShortLink');

const router = express.Router();

// POST /api/links — Create a short link
router.post('/', auth, async (req, res) => {
    try {
        const { originalUrl, title, postId } = req.body;

        if (!originalUrl) {
            return res.status(400).json({ message: 'originalUrl is required' });
        }

        // Validate URL format
        try {
            new URL(originalUrl);
        } catch (_) {
            return res.status(400).json({ message: 'Invalid URL format' });
        }

        const link = new ShortLink({
            userId: req.user.id,
            originalUrl,
            title: title || '',
            postId: postId || null
        });

        await link.save();

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        res.status(201).json({
            ...link.toObject(),
            shortUrl: `${baseUrl}/l/${link.slug}`
        });
    } catch (error) {
        console.error('[LINKS] Create error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/links — List user's short links (paginated)
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const filter = { userId: req.user.id };

        const [links, total] = await Promise.all([
            ShortLink.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ShortLink.countDocuments(filter)
        ]);

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const enriched = links.map(l => ({
            ...l,
            shortUrl: `${baseUrl}/l/${l.slug}`
        }));

        res.json({
            links: enriched,
            pagination: { current: page, pages: Math.ceil(total / limit), total }
        });
    } catch (error) {
        console.error('[LINKS] List error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/links/:id/stats — Detailed click analytics for a link
router.get('/:id/stats', auth, async (req, res) => {
    try {
        const link = await ShortLink.findOne({
            _id: req.params.id,
            userId: req.user.id
        }).lean();

        if (!link) return res.status(404).json({ message: 'Link not found' });

        // Aggregate clicks by day for the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentClicks = (link.clickLog || []).filter(c => new Date(c.timestamp) >= thirtyDaysAgo);

        const clicksByDay = {};
        recentClicks.forEach(click => {
            const day = new Date(click.timestamp).toISOString().split('T')[0];
            clicksByDay[day] = (clicksByDay[day] || 0) + 1;
        });

        // Top referrers
        const referrerMap = {};
        (link.clickLog || []).forEach(click => {
            const ref = click.referrer || 'Direct';
            referrerMap[ref] = (referrerMap[ref] || 0) + 1;
        });
        const topReferrers = Object.entries(referrerMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([referrer, count]) => ({ referrer, count }));

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        res.json({
            link: { ...link, shortUrl: `${baseUrl}/l/${link.slug}` },
            totalClicks: link.clicks,
            clicksByDay,
            topReferrers,
            recentClickCount: recentClicks.length
        });
    } catch (error) {
        console.error('[LINKS] Stats error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/links/:id — Delete a short link
router.delete('/:id', auth, async (req, res) => {
    try {
        const link = await ShortLink.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!link) return res.status(404).json({ message: 'Link not found' });
        res.json({ message: 'Link deleted successfully' });
    } catch (error) {
        console.error('[LINKS] Delete error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
