const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/best-times — Smart "Best Time to Post" analysis
// Aggregates published posts by hour and day of week, calculates average engagement
router.get('/best-times', auth, async (req, res) => {
    try {
        const { platform, days = 90 } = req.query;
        const lookbackDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

        // Build match filter
        const matchFilter = {
            user: req.user._id || req.user.id,
            'platforms.status': 'published',
            createdAt: { $gte: lookbackDate }
        };

        // Platform-specific filter
        if (platform) {
            matchFilter['platforms.name'] = platform;
        }

        const pipeline = [
            { $match: matchFilter },

            // Unwind platforms to get per-platform data
            { $unwind: '$platforms' },

            // Only consider published platforms
            { $match: { 'platforms.status': 'published' } },

            // Apply platform filter after unwind if specified
            ...(platform ? [{ $match: { 'platforms.name': platform } }] : []),

            // Project the fields we need
            {
                $project: {
                    hour: {
                        $hour: {
                            $ifNull: ['$platforms.publishedAt', '$createdAt']
                        }
                    },
                    dayOfWeek: {
                        $dayOfWeek: {
                            $ifNull: ['$platforms.publishedAt', '$createdAt']
                        }
                    },
                    platform: '$platforms.name',
                    engagement: {
                        $add: [
                            { $ifNull: ['$platforms.engagement.likes', 0] },
                            { $ifNull: ['$platforms.engagement.comments', 0] },
                            { $ifNull: ['$platforms.engagement.shares', 0] }
                        ]
                    },
                    views: { $ifNull: ['$platforms.engagement.views', 0] }
                }
            },

            // Group by hour and day of week
            {
                $group: {
                    _id: { hour: '$hour', dayOfWeek: '$dayOfWeek' },
                    avgEngagement: { $avg: '$engagement' },
                    avgViews: { $avg: '$views' },
                    totalEngagement: { $sum: '$engagement' },
                    totalViews: { $sum: '$views' },
                    totalPosts: { $sum: 1 },
                    platforms: { $addToSet: '$platform' }
                }
            },

            // Sort by average engagement (highest first)
            { $sort: { avgEngagement: -1 } }
        ];

        const results = await Post.aggregate(pipeline);

        // Map day numbers to names (MongoDB: 1=Sunday, 2=Monday, ...)
        const dayNames = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const timeSlots = results.map(r => ({
            hour: r._id.hour,
            dayOfWeek: r._id.dayOfWeek,
            dayName: dayNames[r._id.dayOfWeek],
            timeLabel: `${r._id.hour.toString().padStart(2, '0')}:00`,
            avgEngagement: Math.round(r.avgEngagement * 100) / 100,
            avgViews: Math.round(r.avgViews * 100) / 100,
            totalEngagement: r.totalEngagement,
            totalViews: r.totalViews,
            totalPosts: r.totalPosts,
            platforms: r.platforms
        }));

        // Top 5 best time slots
        const topSlots = timeSlots.slice(0, 5);

        // Build heatmap data (7 days × 24 hours)
        const heatmap = {};
        for (let day = 1; day <= 7; day++) {
            heatmap[dayNames[day]] = {};
            for (let hour = 0; hour < 24; hour++) {
                heatmap[dayNames[day]][hour] = 0;
            }
        }
        timeSlots.forEach(slot => {
            if (heatmap[slot.dayName]) {
                heatmap[slot.dayName][slot.hour] = slot.avgEngagement;
            }
        });

        // Per-platform breakdown
        const platformBreakdown = {};
        for (const slot of results) {
            for (const p of slot.platforms) {
                if (!platformBreakdown[p]) {
                    platformBreakdown[p] = { topHour: null, topDay: null, bestEngagement: 0 };
                }
                if (slot.avgEngagement > platformBreakdown[p].bestEngagement) {
                    platformBreakdown[p] = {
                        topHour: `${slot._id.hour.toString().padStart(2, '0')}:00`,
                        topDay: dayNames[slot._id.dayOfWeek],
                        bestEngagement: Math.round(slot.avgEngagement * 100) / 100
                    };
                }
            }
        }

        res.json({
            topSlots,
            heatmap,
            platformBreakdown,
            totalAnalyzedPosts: results.reduce((sum, r) => sum + r.totalPosts, 0),
            lookbackDays: parseInt(days),
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('[ANALYTICS] /best-times error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
