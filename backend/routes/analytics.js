const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { cacheHeaders } = require('../middleware/cacheHeaders');
const { buildDeepAnalytics } = require('../services/analytics/platformDeepAnalytics');
const { computeAnalyticsOverview } = require('../services/analytics/computeOverview');
const { getMaterializedOverview } = require('../services/analytics/overviewStore');
const { log, withTrace, serializeError } = require('../utils/logger');
const analyticsRefreshQueue = require('../services/queue/analyticsRefresh.queue');
const AnalyticsRefreshJob = require('../models/AnalyticsRefreshJob');
const { refreshAnalyticsForUser } = require('../services/analytics/refreshAnalytics');
const { materializeAnalyticsOverview } = require('../services/analytics/overviewStore');
const { getAnalyticsTrends } = require('../services/analytics/dailyRollup');
const { rejectWhenQueueBacklogged } = require('../utils/queueAdmission');
const { enforceTenantQuota } = require('../middleware/tenantQuota');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// GET /api/analytics/overview - Dashboard overview stats
router.get('/overview', auth, cacheHeaders({ maxAge: 30, sMaxAge: 120, privateCache: true }), async (req, res) => {
    try {
        const hasCustomRange = Boolean(req.query.startDate || req.query.endDate);
        if (!hasCustomRange) {
            const materialized = await getMaterializedOverview(req.user.id);
            if (materialized) {
                const { source, computedAt, ...payload } = materialized;
                return res.json({ ...payload, source, computedAt: computedAt || null });
            }
        }

        const payload = await computeAnalyticsOverview(req.user.id, {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        });
        return res.json({ ...payload, source: 'live' });
    } catch (error) {
        log('error', 'analytics overview failed', withTrace({
            userId: req.user?.id,
            error: serializeError(error),
        }, req.traceId));
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/analytics/trends - long-range rollup timeline (analytical read model)
router.get('/trends', auth, cacheHeaders({ maxAge: 60, sMaxAge: 300, privateCache: true }), async (req, res) => {
    try {
        const days = req.query.days || 90;
        const data = await getAnalyticsTrends(req.user.id, days);
        return res.json(data);
    } catch (error) {
        log('error', 'analytics trends failed', withTrace({
            userId: req.user?.id,
            error: serializeError(error),
        }, req.traceId));
        return res.status(500).json({ message: 'Failed to load analytics trends' });
    }
});

// POST /api/analytics/refresh - Fetch latest metrics from platforms
router.post('/refresh', auth, enforceTenantQuota('analytics_refresh_hourly'), async (req, res) => {
    try {
        if (req.query.sync === '1') {
            const result = await refreshAnalyticsForUser(req.user.id);
            await materializeAnalyticsOverview(req.user.id);
            return res.json({ ok: true, mode: 'sync', updated: result.updated });
        }

        const admission = await rejectWhenQueueBacklogged(analyticsRefreshQueue, {
            waitingLimit: Number(process.env.ANALYTICS_REFRESH_QUEUE_WAITING_LIMIT || 200),
            delayedLimit: Number(process.env.ANALYTICS_REFRESH_QUEUE_DELAYED_LIMIT || 200),
        });
        if (admission.shouldReject) {
            return res.status(429).json({
                message: 'Analytics refresh queue is busy. Please try again shortly.',
                queue: admission.counts,
            });
        }

        const refreshJobId = uuidv4();
        await new AnalyticsRefreshJob({
            jobId: refreshJobId,
            traceId: req.traceId,
            userId: req.user.id,
            status: 'queued',
            logs: [{ level: 'info', message: 'Queued analytics refresh' }],
        }).save();

        await analyticsRefreshQueue.add({
            refreshJobId,
            userId: req.user.id,
            traceId: req.traceId,
        });

        return res.json({ ok: true, mode: 'async', jobId: refreshJobId, status: 'queued' });
    } catch (e) {
        log('error', 'analytics refresh failed', withTrace({
            userId: req.user?.id,
            error: serializeError(e),
        }, req.traceId));
        return res.status(500).json({ message: 'Failed to refresh analytics' });
    }
});

router.get('/refresh/:jobId', auth, async (req, res) => {
    try {
        const job = await AnalyticsRefreshJob.findOne({
            jobId: req.params.jobId,
            userId: req.user.id,
        }).lean();
        if (!job) return res.status(404).json({ message: 'Refresh job not found' });
        return res.json({
            jobId: job.jobId,
            traceId: job.traceId || null,
            status: job.status,
            progress: job.progress || 0,
            result: job.result || null,
            error: job.error || null,
            startedAt: job.startedAt || null,
            completedAt: job.completedAt || null,
            updatedAt: job.updatedAt,
        });
    } catch {
        return res.status(500).json({ message: 'Failed to load refresh job status' });
    }
});

// GET /api/analytics/platform/:platform
router.get('/platform/:platform', auth, async (req, res) => {
    try {
        const { platform } = req.params;
        const posts = await Post.find({
            user: req.user.id,
            'platforms.name': platform
        }).sort({ createdAt: -1 }).limit(50);

        let insights = [];
        // Optional: Fetch platform specific insights (like daily reach) if API supports it easily
        // For now, we rely on the Post data aggregation, as platform-level insights require different APIs

        // Calculate platform-specific metrics from POSTS
        const platformPosts = posts.filter(p => p.platforms.some(pl => pl.name === platform));
        const platformMetrics = {
            totalPosts: platformPosts.length,
            published: platformPosts.filter(p => p.platforms.some(pl => pl.name === platform && pl.status === 'published')).length,
            scheduled: platformPosts.filter(p => p.platforms.some(pl => pl.name === platform && pl.status === 'scheduled')).length,
            failed: platformPosts.filter(p => p.platforms.some(pl => pl.name === platform && pl.status === 'failed')).length
        };

        res.json({
            platform,
            metrics: platformMetrics,
            posts: platformPosts,
            insights: insights, // Placeholder
            lastUpdated: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/analytics/content-performance - Top performing content
router.get('/content-performance', auth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const topPosts = await Post.find({ user: req.user.id, isPublished: true })
            .sort({ 'analytics.totalEngagement': -1 })
            .limit(limit);

        const performanceData = topPosts.map(post => {
            let totalEngagement = 0;
            let totalViews = 0;
            let totalLikes = 0;
            let totalComments = 0;
            let platformCount = 0;

            post.platforms.forEach(platform => {
                if (platform.status === 'published' && platform.engagement) {
                    const likes = platform.engagement.likes || 0;
                    const comments = platform.engagement.comments || 0;
                    const shares = platform.engagement.shares || 0;
                    totalEngagement += likes + comments + shares;
                    totalViews += platform.engagement.views || 0;
                    totalLikes += likes;
                    totalComments += comments;
                    platformCount++;
                }
            });

            const engagementRate = totalViews > 0 ? (totalEngagement / totalViews * 100) : 0;

            return {
                id: post._id,
                title: post.title,
                content: post.content.substring(0, 100) + '...',
                platforms: post.platforms.map(p => ({ name: p.name, status: p.status })),
                publishedAt: post.platforms.find(p => p.publishedAt)?.publishedAt,
                metrics: {
                    totalEngagement,
                    totalViews,
                    totalLikes,
                    totalComments,
                    engagementRate: Math.round(engagementRate * 100) / 100,
                    platformCount
                },
                media: post.media
            };
        });

        res.json({
            topPerformingPosts: performanceData,
            generatedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/analytics/deep/:platform — TikTok & Instagram native content analytics
router.get('/deep/:platform', auth, async (req, res) => {
    try {
        const { platform } = req.params;
        const { period = '30d', accountId } = req.query;
        const data = await buildDeepAnalytics(req.user.id, platform, { period, accountId });
        res.json(data);
    } catch (error) {
        log('error', 'analytics deep failed', withTrace({
            userId: req.user?.id,
            platform: req.params?.platform,
            error: serializeError(error),
        }, req.traceId));
        if (error.message === 'Unsupported platform') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to load platform analytics' });
    }
});

router.get('/performance', auth, async (req, res) => {
    try {
        const { period = '30d', platform } = req.query;
        let startDate;
        switch (period) {
            case '7d': startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); break;
            case '90d': startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); break;
            case '1y': startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); break;
            default: startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        const filter = { user: req.user.id, createdAt: { $gte: startDate } };
        if (platform) filter['platforms.name'] = platform;
        const posts = await Post.find(filter).sort({ createdAt: 1 });

        const dayKey = (d) => d.toISOString().split('T')[0];
        const timeline = {};
        for (const post of posts) {
            const key = dayKey(post.createdAt);
            if (!timeline[key]) timeline[key] = { date: key, views: 0, engagement: 0, posts: 0 };
            let views = 0, engagement = 0;
            for (const p of post.platforms) {
                if (!platform || p.name === platform) {
                    const e = p.engagement || {};
                    views += e.views || 0;
                    engagement += (e.likes || 0) + (e.comments || 0) + (e.shares || 0);
                }
            }
            timeline[key].views += views;
            timeline[key].engagement += engagement;
            timeline[key].posts += 1;
        }
        return res.json({ period, platform: platform || 'all', timeline: Object.values(timeline) });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to load performance analytics' });
    }
});

module.exports = router;
