const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const HashtagSet = require('../models/HashtagSet');

const router = express.Router();

// Helper: ensure we always have an ObjectId for aggregation
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// ─────────────────────────────────────────────────────────────
//  HASHTAG PERFORMANCE ANALYTICS — mine user's own post data
// ─────────────────────────────────────────────────────────────

// GET /api/hashtag-research/performance — rank hashtags by engagement
router.get('/performance', auth, async (req, res) => {
    try {
        const { platform, limit = 30, sort = 'engagement' } = req.query;

        // Build match stage
        const match = {
            user: toObjectId(req.user.id),
            isPublished: true,
            hashtags: { $exists: true, $ne: [] }
        };
        if (platform) match['platforms.name'] = platform;

        // Aggregate: unwind hashtags, then compute per-hashtag engagement
        const pipeline = [
            { $match: match },
            { $unwind: '$hashtags' },
            {
                $group: {
                    _id: { $toLower: '$hashtags' },
                    postsUsed: { $sum: 1 },
                    totalLikes: { $sum: '$analytics.totalEngagement' },
                    totalReach: { $sum: '$analytics.totalReach' },
                    avgEngagementRate: { $avg: '$analytics.engagementRate' },
                    // Also compute from per-platform engagement
                    totalPlatformLikes: {
                        $sum: {
                            $reduce: {
                                input: '$platforms',
                                initialValue: 0,
                                in: { $add: ['$$value', { $ifNull: ['$$this.engagement.likes', 0] }] }
                            }
                        }
                    },
                    totalPlatformComments: {
                        $sum: {
                            $reduce: {
                                input: '$platforms',
                                initialValue: 0,
                                in: { $add: ['$$value', { $ifNull: ['$$this.engagement.comments', 0] }] }
                            }
                        }
                    },
                    totalPlatformShares: {
                        $sum: {
                            $reduce: {
                                input: '$platforms',
                                initialValue: 0,
                                in: { $add: ['$$value', { $ifNull: ['$$this.engagement.shares', 0] }] }
                            }
                        }
                    },
                    lastUsed: { $max: '$createdAt' }
                }
            },
            {
                $addFields: {
                    totalEngagement: { $add: ['$totalPlatformLikes', '$totalPlatformComments', '$totalPlatformShares'] },
                    avgLikes: { $cond: [{ $gt: ['$postsUsed', 0] }, { $divide: ['$totalPlatformLikes', '$postsUsed'] }, 0] },
                    avgComments: { $cond: [{ $gt: ['$postsUsed', 0] }, { $divide: ['$totalPlatformComments', '$postsUsed'] }, 0] },
                    // Composite score: weighted engagement per post
                    score: {
                        $cond: [{
                            $gt: ['$postsUsed', 0]
                        }, {
                            $divide: [
                                {
                                    $add: [
                                        { $multiply: ['$totalPlatformLikes', 1] },
                                        { $multiply: ['$totalPlatformComments', 3] },    // Comments weighted 3x
                                        { $multiply: ['$totalPlatformShares', 5] }       // Shares weighted 5x
                                    ]
                                },
                                '$postsUsed'
                            ]
                        }, 0]
                    }
                }
            },
            {
                $sort: sort === 'usage' ? { postsUsed: -1 } :
                    sort === 'recent' ? { lastUsed: -1 } :
                        { score: -1 }
            },
            { $limit: parseInt(limit) }
        ];

        const hashtags = await Post.aggregate(pipeline);

        // Tag each with a tier label
        const maxScore = hashtags[0]?.score || 1;
        hashtags.forEach(h => {
            const ratio = h.score / maxScore;
            h.tier = ratio >= 0.7 ? 'top' : ratio >= 0.3 ? 'mid' : 'low';
            h.hashtag = h._id;
        });

        res.json({ hashtags, total: hashtags.length });
    } catch (e) {
        console.error('[HashtagResearch] Performance error:', e.message);
        res.status(500).json({ message: 'Hashtag analysis failed' });
    }
});

// GET /api/hashtag-research/suggest — AI-powered suggestions
router.get('/suggest', auth, async (req, res) => {
    try {
        const { topic, platform = 'instagram', count = 15 } = req.query;
        if (!topic) return res.status(400).json({ message: 'topic query param is required' });

        let aiHashtags = [];
        try {
            const { suggestHashtags } = require('../services/ai');
            aiHashtags = await suggestHashtags({ topic, platform, count: parseInt(count) });
        } catch (aiErr) {
            console.warn('[HashtagResearch] AI suggest fallback:', aiErr.message);
        }

        const escapedTopic = topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Also find user's own top-performing hashtags related to the topic
        const relatedFromPosts = await Post.aggregate([
            {
                $match: {
                    user: toObjectId(req.user.id),
                    isPublished: true,
                    $or: [
                        { title: { $regex: escapedTopic, $options: 'i' } },
                        { content: { $regex: escapedTopic, $options: 'i' } }
                    ],
                    hashtags: { $exists: true, $ne: [] }
                }
            },
            { $unwind: '$hashtags' },
            {
                $group: {
                    _id: { $toLower: '$hashtags' },
                    count: { $sum: 1 },
                    avgEngagement: {
                        $avg: {
                            $reduce: {
                                input: '$platforms',
                                initialValue: 0,
                                in: { $add: ['$$value', { $ifNull: ['$$this.engagement.likes', 0] }] }
                            }
                        }
                    }
                }
            },
            { $sort: { avgEngagement: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            aiSuggestions: aiHashtags,
            fromYourPosts: relatedFromPosts.map(h => ({
                hashtag: h._id,
                usedCount: h.count,
                avgEngagement: Math.round(h.avgEngagement || 0)
            }))
        });
    } catch (e) {
        console.error('[HashtagResearch] Suggest error:', e.message);
        res.status(500).json({ message: 'Suggest failed' });
    }
});

// ─────────────────────────────────────────────────────────────
//  HASHTAG SETS — saved, reusable hashtag groups
// ─────────────────────────────────────────────────────────────

// GET /api/hashtag-research/sets — list saved sets
router.get('/sets', auth, async (req, res) => {
    try {
        const sets = await HashtagSet.find({ userId: req.user.id })
            .sort({ updatedAt: -1 })
            .lean();
        res.json({ sets });
    } catch (e) {
        res.status(500).json({ message: 'Failed to load sets' });
    }
});

// POST /api/hashtag-research/sets — create a new set
router.post('/sets', auth, async (req, res) => {
    try {
        const { name, hashtags, platform, category } = req.body;
        if (!name || !hashtags?.length) {
            return res.status(400).json({ message: 'name and hashtags are required' });
        }

        const count = await HashtagSet.countDocuments({ userId: req.user.id });
        if (count >= 50) {
            return res.status(400).json({ message: 'Max 50 hashtag sets. Delete old ones first.' });
        }

        const cleaned = hashtags.map(h => h.toLowerCase().replace(/^#/, '').trim()).filter(Boolean);
        const set = new HashtagSet({
            userId: req.user.id,
            name: name.trim(),
            hashtags: [...new Set(cleaned)], // deduplicate
            platform: platform || 'all',
            category: category || 'general'
        });
        await set.save();

        res.status(201).json({ set });
    } catch (e) {
        console.error('[HashtagResearch] Set create error:', e.message);
        res.status(500).json({ message: 'Create failed' });
    }
});

// PATCH /api/hashtag-research/sets/:id — update a set
router.patch('/sets/:id', auth, async (req, res) => {
    try {
        const { name, hashtags, platform, category } = req.body;
        const update = {};
        if (name) update.name = name.trim();
        if (platform) update.platform = platform;
        if (category) update.category = category.trim();
        if (hashtags) {
            update.hashtags = [...new Set(
                hashtags.map(h => h.toLowerCase().replace(/^#/, '').trim()).filter(Boolean)
            )];
        }

        const set = await HashtagSet.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            update,
            { new: true }
        );
        if (!set) return res.status(404).json({ message: 'Not found' });
        res.json({ set });
    } catch (e) {
        res.status(500).json({ message: 'Update failed' });
    }
});

// DELETE /api/hashtag-research/sets/:id — delete a set
router.delete('/sets/:id', auth, async (req, res) => {
    try {
        const result = await HashtagSet.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });
        if (!result) return res.status(404).json({ message: 'Not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

// POST /api/hashtag-research/sets/:id/copy — copy hashtags to clipboard-ready format
router.post('/sets/:id/copy', auth, async (req, res) => {
    try {
        const set = await HashtagSet.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $inc: { usageCount: 1 } },
            { new: true }
        );
        if (!set) return res.status(404).json({ message: 'Not found' });

        const formatted = set.hashtags.map(h => `#${h}`).join(' ');
        res.json({ formatted, count: set.hashtags.length });
    } catch (e) {
        res.status(500).json({ message: 'Copy failed' });
    }
});

// ─────────────────────────────────────────────────────────────
//  HASHTAG TRENDS — trending from user's recent usage patterns
// ─────────────────────────────────────────────────────────────

// GET /api/hashtag-research/trending — hashtags trending up in user's ecosystem
router.get('/trending', auth, async (req, res) => {
    try {
        const { days = 14 } = req.query;
        const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
        const midpoint = new Date(Date.now() - (parseInt(days) / 2) * 24 * 60 * 60 * 1000);

        // Compare first half vs second half of period
        const [firstHalf, secondHalf] = await Promise.all([
            Post.aggregate([
                { $match: { user: toObjectId(req.user.id), createdAt: { $gte: since, $lt: midpoint }, hashtags: { $ne: [] } } },
                { $unwind: '$hashtags' },
                { $group: { _id: { $toLower: '$hashtags' }, count: { $sum: 1 } } }
            ]),
            Post.aggregate([
                { $match: { user: toObjectId(req.user.id), createdAt: { $gte: midpoint }, hashtags: { $ne: [] } } },
                { $unwind: '$hashtags' },
                { $group: { _id: { $toLower: '$hashtags' }, count: { $sum: 1 } } }
            ])
        ]);

        const firstMap = Object.fromEntries(firstHalf.map(h => [h._id, h.count]));
        const secondMap = Object.fromEntries(secondHalf.map(h => [h._id, h.count]));

        // Calculate trend direction
        const allTags = new Set([...Object.keys(firstMap), ...Object.keys(secondMap)]);
        const trends = [];
        for (const tag of allTags) {
            const before = firstMap[tag] || 0;
            const after = secondMap[tag] || 0;
            const change = after - before;
            trends.push({
                hashtag: tag,
                before,
                after,
                change,
                direction: change > 0 ? 'rising' : change < 0 ? 'falling' : 'stable',
                isNew: before === 0 && after > 0
            });
        }

        trends.sort((a, b) => b.change - a.change);

        res.json({
            period: `${days} days`,
            rising: trends.filter(t => t.direction === 'rising').slice(0, 10),
            newlyUsed: trends.filter(t => t.isNew).slice(0, 10),
            falling: trends.filter(t => t.direction === 'falling').slice(0, 10)
        });
    } catch (e) {
        console.error('[HashtagResearch] Trending error:', e.message);
        res.status(500).json({ message: 'Trends failed' });
    }
});

module.exports = router;
