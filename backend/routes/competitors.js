const express = require('express');
const auth = require('../middleware/auth');
const Competitor = require('../models/Competitor');

const router = express.Router();

// GET /api/competitors — list tracked competitors
router.get('/', auth, async (req, res) => {
    try {
        const competitors = await Competitor.find({ userId: req.user.id })
            .select('-snapshots')  // Exclude full snapshot history for listing
            .sort({ createdAt: -1 })
            .lean();
        res.json({ competitors });
    } catch (e) {
        res.status(500).json({ message: 'Failed to load competitors' });
    }
});

// POST /api/competitors — add a competitor to track
router.post('/', auth, async (req, res) => {
    try {
        const { name, platform, handle } = req.body;
        if (!name || !platform || !handle) {
            return res.status(400).json({ message: 'name, platform, and handle are required' });
        }

        // Check limit (max 10 competitors per user)
        const count = await Competitor.countDocuments({ userId: req.user.id });
        if (count >= 10) {
            return res.status(400).json({ message: 'Max 10 competitors tracked. Remove one first.' });
        }

        // Check for duplicates
        const existing = await Competitor.findOne({
            userId: req.user.id,
            platform,
            handle: handle.toLowerCase().replace('@', '')
        });
        if (existing) {
            return res.status(409).json({ message: 'Already tracking this competitor' });
        }

        const competitor = new Competitor({
            userId: req.user.id,
            name,
            platform,
            handle: handle.toLowerCase().replace('@', '')
        });
        await competitor.save();

        res.status(201).json({ competitor });
    } catch (e) {
        console.error('[Competitor] Create error:', e.message);
        res.status(500).json({ message: 'Add failed' });
    }
});

// PATCH /api/competitors/:id/toggle — enable/disable competitor
router.patch('/:id/toggle', auth, async (req, res) => {
    try {
        const competitor = await Competitor.findOne({ _id: req.params.id, userId: req.user.id });
        if (!competitor) return res.status(404).json({ message: 'Not found' });
        competitor.enabled = !competitor.enabled;
        await competitor.save();
        res.json({ enabled: competitor.enabled });
    } catch (e) {
        res.status(500).json({ message: 'Toggle failed' });
    }
});

// DELETE /api/competitors/:id — remove competitor
router.delete('/:id', auth, async (req, res) => {
    try {
        const result = await Competitor.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });
        if (!result) return res.status(404).json({ message: 'Not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

// POST /api/competitors/:id/snapshot — take a manual snapshot
// In production this would call Instagram Graph API for public business accounts
// For now, it accepts manual data or generates simulated data
router.post('/:id/snapshot', auth, async (req, res) => {
    try {
        const competitor = await Competitor.findOne({
            _id: req.params.id,
            userId: req.user.id
        });
        if (!competitor) return res.status(404).json({ message: 'Not found' });

        // Accept manual data or use provided metrics
        const {
            followers, following, posts,
            engagementRate, avgLikes, avgComments
        } = req.body;

        const snapshot = {
            date: new Date(),
            followers: Number(followers) || competitor.latestMetrics?.followers || 0,
            following: Number(following) || competitor.latestMetrics?.following || 0,
            posts: Number(posts) || competitor.latestMetrics?.posts || 0,
            engagementRate: Number(engagementRate) || competitor.latestMetrics?.engagementRate || 0,
            avgLikes: Number(avgLikes) || competitor.latestMetrics?.avgLikes || 0,
            avgComments: Number(avgComments) || competitor.latestMetrics?.avgComments || 0
        };

        competitor.snapshots.push(snapshot);

        // Keep max 365 daily snapshots (1 year)
        if (competitor.snapshots.length > 365) {
            competitor.snapshots = competitor.snapshots.slice(-365);
        }

        // Update latest metrics
        competitor.latestMetrics = {
            followers: snapshot.followers,
            following: snapshot.following,
            posts: snapshot.posts,
            engagementRate: snapshot.engagementRate,
            avgLikes: snapshot.avgLikes,
            avgComments: snapshot.avgComments
        };

        // Calculate growth rates
        const snapshots = competitor.snapshots;
        if (snapshots.length >= 2) {
            const latest = snapshots[snapshots.length - 1];
            const dayAgo = snapshots.find(s =>
                new Date(s.date) <= new Date(Date.now() - 24 * 60 * 60 * 1000)
            ) || snapshots[snapshots.length - 2];

            const weekAgo = snapshots.find(s =>
                new Date(s.date) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            );

            const monthAgo = snapshots.find(s =>
                new Date(s.date) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            );

            const calcGrowth = (current, previous) => {
                if (!previous || !previous.followers) return 0;
                return ((current.followers - previous.followers) / previous.followers * 100).toFixed(2);
            };

            competitor.growth = {
                daily: parseFloat(calcGrowth(latest, dayAgo)),
                weekly: weekAgo ? parseFloat(calcGrowth(latest, weekAgo)) : 0,
                monthly: monthAgo ? parseFloat(calcGrowth(latest, monthAgo)) : 0
            };
        }

        competitor.lastSnapshotAt = new Date();
        await competitor.save();

        res.json({ message: 'Snapshot taken', snapshot, growth: competitor.growth });
    } catch (e) {
        console.error('[Competitor] Snapshot error:', e.message);
        res.status(500).json({ message: 'Snapshot failed' });
    }
});

// GET /api/competitors/:id/history — get snapshot history for graphs
router.get('/:id/history', auth, async (req, res) => {
    try {
        const competitor = await Competitor.findOne({
            _id: req.params.id,
            userId: req.user.id
        }).select('name handle platform snapshots growth latestMetrics');

        if (!competitor) return res.status(404).json({ message: 'Not found' });

        const { days = 30 } = req.query;
        const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
        const filteredSnapshots = competitor.snapshots.filter(s => new Date(s.date) >= since);

        res.json({
            competitor: {
                name: competitor.name,
                handle: competitor.handle,
                platform: competitor.platform,
                latestMetrics: competitor.latestMetrics,
                growth: competitor.growth
            },
            snapshots: filteredSnapshots
        });
    } catch (e) {
        res.status(500).json({ message: 'History failed' });
    }
});

// GET /api/competitors/compare — compare your account vs competitors
router.get('/compare', auth, async (req, res) => {
    try {
        const competitors = await Competitor.find({ userId: req.user.id, enabled: true })
            .select('name handle platform latestMetrics growth')
            .lean();

        // Get user's own metrics from analytics (if available)
        let userMetrics = null;
        try {
            const Analytics = require('../models/Analytics');
            const analytics = await Analytics.findOne({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
            if (analytics) {
                userMetrics = {
                    name: 'You',
                    followers: analytics.overview?.totalFollowers || 0,
                    engagementRate: analytics.overview?.engagementRate || 0,
                    totalLikes: analytics.overview?.totalLikes || 0
                };
            }
        } catch (_) { }

        // Generate comparison insights
        const insights = [];
        for (const comp of competitors) {
            if (userMetrics && comp.latestMetrics?.followers) {
                const followerDiff = userMetrics.followers - comp.latestMetrics.followers;
                if (followerDiff > 0) {
                    insights.push(`You have ${Math.abs(followerDiff).toLocaleString()} more followers than ${comp.name}`);
                } else if (followerDiff < 0) {
                    insights.push(`${comp.name} has ${Math.abs(followerDiff).toLocaleString()} more followers than you`);
                }

                if (comp.growth?.weekly && userMetrics) {
                    insights.push(`${comp.name} is growing at ${comp.growth.weekly}% weekly`);
                }
            }
        }

        res.json({ userMetrics, competitors, insights });
    } catch (e) {
        res.status(500).json({ message: 'Compare failed' });
    }
});

module.exports = router;
