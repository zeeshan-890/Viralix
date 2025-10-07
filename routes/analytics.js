const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { getPageInsights, getPostMetrics } = require('../services/facebook');
const { getIgUserInsights, getIgFeed, getIgMediaInsights } = require('../services/instagram');

const router = express.Router();

// GET /api/analytics/overview - Dashboard overview stats
router.get('/overview', auth, async (req, res) => {
    const _t0 = Date.now();
    // Debug: incoming request context
    try {
        console.log('[ANALYTICS] /overview start', {
            method: req.method,
            path: req.originalUrl,
            userId: req.user?.id,
            origin: req.headers?.origin,
            referer: req.headers?.referer,
            hasCookie: !!req.headers?.cookie,
            clientUrlEnv: process.env.CLIENT_URL,
            nodeEnv: process.env.NODE_ENV,
            time: new Date().toISOString(),
        });
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

        const posts = await Post.find({
            user: req.user.id,
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Calculate aggregated metrics
        const totalPosts = posts.length;
        const publishedPosts = posts.filter(p => p.isPublished).length;
        const scheduledPosts = posts.filter(p => p.isScheduled).length;
        const draftPosts = posts.filter(p => p.isDraft).length;

        // Aggregate engagement metrics from platforms
        let totalLikes = 0;
        let totalComments = 0;
        let totalShares = 0;
        let totalViews = 0;
        let totalReach = 0;
        let totalEngagement = 0;

        posts.forEach(post => {
            post.platforms.forEach(platform => {
                if (platform.engagement) {
                    totalLikes += platform.engagement.likes || 0;
                    totalComments += platform.engagement.comments || 0;
                    totalShares += platform.engagement.shares || 0;
                    totalViews += platform.engagement.views || 0;
                }
            });
            totalReach += post.analytics.totalReach || 0;
            totalEngagement += post.analytics.totalEngagement || 0;
        });

        // Optionally enrich followers (best effort)
        let totalFollowers = 0;
        try {
            const user = await User.findById(req.user.id).lean();
            
            // Direct Instagram OAuth accounts
            const directInstagramAccounts = user?.socialAccounts?.filter(
                acc => acc.platform === 'instagram' && acc.isActive && acc.accessToken
            ) || [];
            
            for (const igAccount of directInstagramAccounts) {
                try {
                    const axios = require('axios');
                    const response = await axios.get(`https://graph.instagram.com/${igAccount.accountId}`, {
                        params: {
                            fields: 'followers_count',
                            access_token: igAccount.accessToken
                        }
                    });
                    totalFollowers += response.data?.followers_count || 0;
                } catch (_) { /* ignore */ }
            }
            
            // Facebook-linked accounts
            const pages = user?.settings?.facebookPages || [];
            // Facebook: page fans via getPageInsights('page_fans') latest value
            for (const pg of pages) {
                const token = pg.accessToken || pg.access_token;
                if (!token) continue;
                try {
                    const ins = await getPageInsights(pg.id, token, 'page_fans');
                    const fansSeries = Array.isArray(ins) ? ins.find(x => x.name === 'page_fans')?.values : [];
                    const fans = Array.isArray(fansSeries) && fansSeries.length ? (fansSeries[fansSeries.length - 1].value || 0) : 0;
                    totalFollowers += fans;
                } catch (_) { /* ignore */ }
                // Instagram: followers_count from IG user (Facebook-linked)
                if (pg.instagramId && token) {
                    try {
                        const ig = await require('../services/instagram').getIgUser(pg.instagramId, token);
                        totalFollowers += ig?.followers_count || 0;
                    } catch (_) { /* ignore */ }
                }
            }
        } catch (_) { /* ignore */ }

        // Calculate engagement rate (based on platform engagement views)
        const engagementRate = totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews * 100) : 0;

        // Platform breakdown
        const platformBreakdown = {};
        posts.forEach(post => {
            post.platforms.forEach(platform => {
                if (!platformBreakdown[platform.name]) {
                    platformBreakdown[platform.name] = {
                        posts: 0,
                        published: 0,
                        scheduled: 0,
                        draft: 0,
                        failed: 0,
                        engagement: { likes: 0, comments: 0, shares: 0, views: 0 }
                    };
                }
                platformBreakdown[platform.name].posts++;
                platformBreakdown[platform.name][platform.status]++;
                if (platform.engagement) {
                    platformBreakdown[platform.name].engagement.likes += platform.engagement.likes || 0;
                    platformBreakdown[platform.name].engagement.comments += platform.engagement.comments || 0;
                    platformBreakdown[platform.name].engagement.shares += platform.engagement.shares || 0;
                    platformBreakdown[platform.name].engagement.views += platform.engagement.views || 0;
                }
            });
        });

        const payload = {
            overview: {
                totalPosts,
                publishedPosts,
                scheduledPosts,
                draftPosts,
                totalViews,
                totalLikes,
                totalComments,
                totalShares,
                totalReach,
                totalFollowers,
                totalEngagement,
                engagementRate: Math.round(engagementRate * 100) / 100
            },
            platformBreakdown,
            dateRange: { startDate, endDate }
        };
        console.log('[ANALYTICS] /overview done', {
            userId: req.user?.id,
            totals: payload.overview,
            platforms: Object.keys(platformBreakdown || {}),
            ms: Date.now() - _t0,
        });
        res.json(payload);
    } catch (error) {
        console.error('[ANALYTICS] /overview error', {
            message: error?.message,
            stack: error?.stack,
            userId: req.user?.id,
            method: req.method,
            path: req.originalUrl,
            origin: req.headers?.origin,
        });
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/analytics/refresh - Fetch latest metrics from platforms and update stored engagement
router.post('/refresh', auth, async (req, res) => {
    const _t0 = Date.now();
    try {
        console.log('[ANALYTICS] /refresh start', {
            method: req.method,
            path: req.originalUrl,
            userId: req.user?.id,
            origin: req.headers?.origin,
            time: new Date().toISOString(),
        });
        const user = await User.findById(req.user.id).lean();
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        // Pull recently published posts (limit to last 50 to avoid heavy loads)
        const posts = await Post.find({ user: req.user.id, 'platforms.status': 'published' })
            .sort({ updatedAt: -1 })
            .limit(50);

        let updatedCount = 0;
        for (const post of posts) {
            let changed = false;
            const nextPlatforms = [];
            for (const p of post.platforms) {
                if (p.status !== 'published') { nextPlatforms.push(p); continue; }

                if (p.name === 'facebook') {
                    // Resolve page token by accountId (pageId)
                    const page = user?.settings?.facebookPages?.find(pg => pg.id === p.accountId);
                    const token = page?.accessToken || page?.access_token;
                    // For FB, postId may be like "<pageId>_<postId>"; we stored that in p.postId if available
                    if (token && p.postId) {
                        try {
                            const metrics = await getPostMetrics(p.postId, token);
                            nextPlatforms.push({ ...p.toObject?.() || p, engagement: { ...p.engagement, ...metrics, lastUpdated: new Date() } });
                            changed = true;
                            continue;
                        } catch (_) { /* fallback to keep as-is */ }
                    }
                    nextPlatforms.push(p);
                } else if (p.name === 'instagram') {
                    // Instagram: Check for direct OAuth account first, then fall back to Facebook-linked
                    let token = null;
                    
                    // Try direct OAuth account
                    const directAccount = user?.socialAccounts?.find(
                        acc => acc.platform === 'instagram' && acc.accountId === p.accountId && acc.isActive && acc.accessToken
                    );
                    
                    if (directAccount) {
                        token = directAccount.accessToken;
                    } else {
                        // Fall back to Facebook-linked account
                        const page = user?.settings?.facebookPages?.find(pg => pg.instagramId === p.accountId);
                        token = page?.accessToken || page?.access_token;
                    }
                    
                    if (token && p.accountId) {
                        try {
                            let media = null;
                            if (p.postId) {
                                try {
                                    const axios = require('axios');
                                    const response = await axios.get(`https://graph.instagram.com/${p.postId}`, {
                                        params: {
                                            fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,media_product_type',
                                            access_token: token
                                        }
                                    });
                                    media = response.data;
                                } catch { /* fallback to feed */ }
                            }
                            if (!media) {
                                const axios = require('axios');
                                const feedResponse = await axios.get(`https://graph.instagram.com/${p.accountId}/media`, {
                                    params: {
                                        fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,media_product_type',
                                        limit: 25,
                                        access_token: token
                                    }
                                });
                                const feed = feedResponse.data?.data || [];
                                media = (p.postId && feed.find(m => m.id === p.postId)) || feed[0];
                            }
                            if (media) {
                                const likes = media.like_count || 0;
                                const comments = media.comments_count || 0;
                                let views = 0;
                                try {
                                    const productType = media.media_product_type || media.media_type;
                                    let requestedMetrics = 'views,reach';
                                    
                                    const axios = require('axios');
                                    const insightsResponse = await axios.get(`https://graph.instagram.com/${media.id}/insights`, {
                                        params: {
                                            metric: requestedMetrics,
                                            access_token: token
                                        }
                                    });
                                    const insights = insightsResponse.data?.data || [];
                                    
                                    console.log('[IG] Insights for media', media.id, {
                                        productType,
                                        requestedMetrics,
                                        metrics: insights.map(m => ({ name: m.name, value: m.values?.[0]?.value }))
                                    });
                                    
                                    for (const m of insights) {
                                        const val = m.values?.[0]?.value || 0;
                                        if (m.name === 'views') views = Math.max(views, val);
                                        if (m.name === 'reach') views = Math.max(views, val, views);
                                    }
                                    
                                    console.log('[IG] Computed views', { mediaId: media.id, productType, views });
                                } catch (e) {
                                    // ignore insights errors
                                }
                                nextPlatforms.push({ ...p.toObject?.() || p, engagement: { ...p.engagement, likes, comments, shares: p.engagement?.shares || 0, views, lastUpdated: new Date() } });
                                changed = true;
                                continue;
                            }
                        } catch (_) { /* keep as-is if fails */ }
                    }
                    nextPlatforms.push(p);
                } else {
                    nextPlatforms.push(p);
                }
            }
            if (changed) {
                post.platforms = nextPlatforms;
                await post.save();
                updatedCount++;
            }
        }

        const resp = { ok: true, updated: updatedCount };
        console.log('[ANALYTICS] /refresh done', { userId: req.user?.id, scanned: posts.length, updated: updatedCount, ms: Date.now() - _t0 });
        return res.json(resp);
    } catch (e) {
        console.error('Analytics refresh error:', e.message, { userId: req.user?.id, path: req.originalUrl });
        return res.status(500).json({ message: 'Failed to refresh analytics' });
    }
});

// GET /api/analytics/performance - time series based on stored engagement
router.get('/performance', auth, async (req, res) => {
    try {
        const { period = '30d', platform } = req.query;
        let startDate;
        switch (period) {
            case '7d': startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); break;
            case '90d': startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); break;
            case '1y': startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); break;
            case '30d':
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
        console.error('Analytics performance error:', e.message);
        return res.status(500).json({ message: 'Failed to load performance analytics' });
    }
});

// GET /api/analytics/platform/:platform - Platform-specific analytics
router.get('/platform/:platform', auth, async (req, res) => {
    try {
        const { platform } = req.params;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const posts = await Post.find({
            user: req.user.id,
            'platforms.name': platform
        }).sort({ createdAt: -1 }).limit(50);

        let insights = null;

        if (platform === 'facebook') {
            // Get Facebook page insights if available
            const defaultPageId = user.settings?.facebookDefaultPageId;
            if (defaultPageId) {
                const page = user.settings?.facebookPages?.find(p => p.id === defaultPageId);
                if (page?.accessToken) {
                    try {
                        insights = await getPageInsights(page.id, page.accessToken);
                    } catch (err) {
                        console.log('Failed to fetch Facebook insights:', err.message);
                    }
                }
            }
        } else if (platform === 'instagram') {
            // Get Instagram insights if available
            // First check for direct OAuth account
            const directAccount = user.socialAccounts?.find(
                acc => acc.platform === 'instagram' && acc.isActive && acc.accessToken
            );
            
            if (directAccount) {
                try {
                    const axios = require('axios');
                    const response = await axios.get(`https://graph.instagram.com/${directAccount.accountId}/insights`, {
                        params: {
                            metric: 'follower_count,impressions,reach,profile_views',
                            period: 'day',
                            access_token: directAccount.accessToken
                        }
                    });
                    insights = response.data?.data || [];
                } catch (err) {
                    console.log('Failed to fetch Instagram insights (direct OAuth):', err.message);
                }
            } else {
                // Fall back to Facebook-linked account
                const igAccount = user.settings?.facebookPages?.find(p => p.instagramId);
                if (igAccount?.instagramId && igAccount.accessToken) {
                    try {
                        insights = await getIgUserInsights(igAccount.instagramId, igAccount.accessToken);
                    } catch (err) {
                        console.log('Failed to fetch Instagram insights (Facebook-linked):', err.message);
                    }
                }
            }
        }

        // Calculate platform-specific metrics
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
            insights: insights || [],
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/analytics/content-performance - Top performing content
router.get('/content-performance', auth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const topPosts = await Post.find({
            user: req.user.id,
            isPublished: true
        })
            .sort({ 'analytics.totalEngagement': -1 })
            .limit(limit);

        // Calculate performance scores for each post
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
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
//             post.platforms.forEach(platform => {
//                 const engagement = platform.engagement || {};
//                 metrics.engagement.totalLikes += engagement.likes || 0;
//                 metrics.engagement.totalComments += engagement.comments || 0;
//                 metrics.engagement.totalShares += engagement.shares || 0;
//                 metrics.engagement.totalViews += engagement.views || 0;
//             });

//             metrics.engagement.totalReach += post.analytics?.totalReach || 0;
//         });

//         // Calculate platform breakdown
//         posts.forEach(post => {
//             post.platforms.forEach(platform => {
//                 if (!metrics.platforms[platform.name]) {
//                     metrics.platforms[platform.name] = {
//                         posts: 0,
//                         published: 0,
//                         engagement: {
//                             likes: 0,
//                             comments: 0,
//                             shares: 0,
//                             views: 0
//                         }
//                     };
//                 }

//                 metrics.platforms[platform.name].posts++;
//                 if (platform.status === 'published') {
//                     metrics.platforms[platform.name].published++;
//                 }

//                 const engagement = platform.engagement || {};
//                 metrics.platforms[platform.name].engagement.likes += engagement.likes || 0;
//                 metrics.platforms[platform.name].engagement.comments += engagement.comments || 0;
//                 metrics.platforms[platform.name].engagement.shares += engagement.shares || 0;
//                 metrics.platforms[platform.name].engagement.views += engagement.views || 0;
//             });
//         });

//         // Calculate timeline data (daily aggregation)
//         const timelineMap = {};
//         posts.forEach(post => {
//             const date = post.createdAt.toISOString().split('T')[0];
//             if (!timelineMap[date]) {
//                 timelineMap[date] = {
//                     date,
//                     posts: 0,
//                     published: 0,
//                     engagement: 0
//                 };
//             }
//             timelineMap[date].posts++;
//             if (post.isPublished) {
//                 timelineMap[date].published++;
//                 timelineMap[date].engagement += post.analytics?.totalEngagement || 0;
//             }
//         });

//         metrics.timeline = Object.values(timelineMap).sort((a, b) => new Date(a.date) - new Date(b.date));

//         // Calculate average engagement rate
//         const publishedPosts = posts.filter(p => p.isPublished);
//         if (publishedPosts.length > 0) {
//             const totalEngagementRate = publishedPosts.reduce((sum, p) => sum + (p.analytics?.engagementRate || 0), 0);
//             metrics.engagement.averageEngagementRate = totalEngagementRate / publishedPosts.length;
//         }

//         res.json(metrics);
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   GET /api/analytics/posts/:id
// // @desc    Get detailed analytics for a specific post
// // @access  Private
// router.get('/posts/:id', auth, async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);

//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }

//         if (post.user.toString() !== req.user.id) {
//             return res.status(401).json({ message: 'Not authorized' });
//         }

//         // Detailed analytics for the post
//         const analytics = {
//             post: {
//                 id: post._id,
//                 title: post.title,
//                 createdAt: post.createdAt,
//                 publishedAt: post.platforms.find(p => p.publishedAt)?.publishedAt,
//                 platforms: post.platforms.length
//             },
//             engagement: {
//                 total: {
//                     likes: 0,
//                     comments: 0,
//                     shares: 0,
//                     views: 0,
//                     clicks: 0
//                 },
//                 byPlatform: {}
//             },
//             performance: {
//                 reach: post.analytics?.totalReach || 0,
//                 engagementRate: post.analytics?.engagementRate || 0,
//                 clickThroughRate: post.analytics?.clickThroughRate || 0,
//                 costPerClick: post.analytics?.costPerClick || 0,
//                 roi: post.analytics?.roi || 0
//             }
//         };

//         // Calculate engagement by platform
//         post.platforms.forEach(platform => {
//             const engagement = platform.engagement || {};

//             analytics.engagement.total.likes += engagement.likes || 0;
//             analytics.engagement.total.comments += engagement.comments || 0;
//             analytics.engagement.total.shares += engagement.shares || 0;
//             analytics.engagement.total.views += engagement.views || 0;
//             analytics.engagement.total.clicks += engagement.clicks || 0;

//             analytics.engagement.byPlatform[platform.name] = {
//                 status: platform.status,
//                 publishedAt: platform.publishedAt,
//                 engagement: engagement
//             };
//         });

//         res.json(analytics);
//     } catch (error) {
//         console.error(error.message);
//         if (error.kind === 'ObjectId') {
//             return res.status(404).json({ message: 'Post not found' });
//         }
//         res.status(500).send('Server error');
//     }
// });

// // @route   GET /api/analytics/performance
// // @desc    Get performance metrics over time
// // @access  Private
// router.get('/performance', auth, async (req, res) => {
//     try {
//         const { period = '30d', platform } = req.query;

//         // Calculate date range based on period
//         let startDate;
//         switch (period) {
//             case '7d':
//                 startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
//                 break;
//             case '30d':
//                 startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//                 break;
//             case '90d':
//                 startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
//                 break;
//             case '1y':
//                 startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
//                 break;
//             default:
//                 startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//         }

//         const filter = {
//             user: req.user.id,
//             isPublished: true,
//             createdAt: { $gte: startDate }
//         };

//         if (platform) {
//             filter['platforms.name'] = platform;
//         }

//         const posts = await Post.find(filter).sort({ createdAt: 1 });

//         // Group by time intervals
//         const groupBy = period === '1y' ? 'month' : 'day';
//         const performanceData = {};

//         posts.forEach(post => {
//             let key;
//             if (groupBy === 'month') {
//                 key = post.createdAt.toISOString().substring(0, 7); // YYYY-MM
//             } else {
//                 key = post.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
//             }

//             if (!performanceData[key]) {
//                 performanceData[key] = {
//                     date: key,
//                     posts: 0,
//                     reach: 0,
//                     engagement: 0,
//                     clicks: 0,
//                     impressions: 0
//                 };
//             }

//             performanceData[key].posts++;
//             performanceData[key].reach += post.analytics?.totalReach || 0;
//             performanceData[key].engagement += post.analytics?.totalEngagement || 0;

//             post.platforms.forEach(platform => {
//                 const engagement = platform.engagement || {};
//                 performanceData[key].clicks += engagement.clicks || 0;
//                 performanceData[key].impressions += engagement.views || 0;
//             });
//         });

//         const timeline = Object.values(performanceData).sort((a, b) => new Date(a.date) - new Date(b.date));

//         res.json({
//             period,
//             platform: platform || 'all',
//             timeline
//         });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// // @route   GET /api/analytics/top-posts
// // @desc    Get top performing posts
// // @access  Private
// router.get('/top-posts', auth, async (req, res) => {
//     try {
//         const { limit = 10, sortBy = 'engagement' } = req.query;

//         const posts = await Post.find({
//             user: req.user.id,
//             isPublished: true
//         }).sort({
//             [`analytics.total${sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}`]: -1
//         }).limit(parseInt(limit));

//         const topPosts = posts.map(post => ({
//             id: post._id,
//             title: post.title,
//             content: post.content.substring(0, 100) + '...',
//             platforms: post.platforms.map(p => p.name),
//             createdAt: post.createdAt,
//             analytics: post.analytics,
//             totalEngagement: post.platforms.reduce((sum, p) => {
//                 const eng = p.engagement || {};
//                 return sum + (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
//             }, 0)
//         }));

//         res.json(topPosts);
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Server error');
//     }
// });

// module.exports = router;
