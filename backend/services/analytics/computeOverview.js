const Post = require('../../models/Post');
const User = require('../../models/User');
const AccountService = require('../account.service');
const { getPageInsights } = require('../facebook');
const youtubeService = require('../youtube');

async function computeAnalyticsOverview(userId, options = {}) {
    const startDate = options.startDate
        ? new Date(options.startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options.endDate ? new Date(options.endDate) : new Date();

    const posts = await Post.find({
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalPosts = posts.length;
    const publishedPosts = posts.filter((p) => p.isPublished).length;
    const scheduledPosts = posts.filter((p) => p.isScheduled).length;
    const draftPosts = posts.filter((p) => p.isDraft).length;
    const failedPosts = posts.filter((p) => (p.platforms || []).some((pl) => pl.status === 'failed')).length;

    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalViews = 0;
    let totalReach = 0;
    let totalEngagement = 0;

    posts.forEach((post) => {
        post.platforms.forEach((platform) => {
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

    let totalFollowers = 0;
    const connectedAccounts = await AccountService.getAccountsWithTokens(userId);
    const user = await User.findById(userId).lean();

    for (const account of connectedAccounts) {
        try {
            if (account.platform === 'youtube' && account.accessToken) {
                const channelInfo = await youtubeService.getChannelInfo(account.accessToken);
                if (channelInfo.subscriberCount) {
                    totalFollowers += parseInt(channelInfo.subscriberCount, 10);
                }
            } else if (account.platform === 'tiktok') {
                if (account.followerCount) totalFollowers += account.followerCount;
            } else if (account.platform === 'instagram') {
                try {
                    const axios = require('axios');
                    const response = await axios.get(`https://graph.instagram.com/${account.platformAccountId}`, {
                        params: { fields: 'followers_count', access_token: account.accessToken },
                    });
                    totalFollowers += response.data?.followers_count || 0;
                } catch { /* ignore */ }
            }
        } catch { /* ignore */ }
    }

    const pages = user?.settings?.facebookPages || [];
    for (const pg of pages) {
        const token = pg.accessToken || pg.access_token;
        if (!token) continue;
        try {
            const ins = await getPageInsights(pg.id, token, 'page_fans');
            const fansSeries = Array.isArray(ins) ? ins.find((x) => x.name === 'page_fans')?.values : [];
            const fans = Array.isArray(fansSeries) && fansSeries.length
                ? (fansSeries[fansSeries.length - 1].value || 0)
                : 0;
            totalFollowers += fans;
        } catch { /* ignore */ }

        if (pg.instagramId && token) {
            try {
                const ig = await require('../instagram').getIgUser(pg.instagramId, token);
                totalFollowers += ig?.followers_count || 0;
            } catch { /* ignore */ }
        }
    }

    const engagementRate = totalViews > 0
        ? ((totalLikes + totalComments + totalShares) / totalViews * 100)
        : 0;

    const platformBreakdown = {};
    const accountBreakdown = {};

    const ensureBucket = (bucket) => {
        if (!bucket.engagement) {
            bucket.engagement = { likes: 0, comments: 0, shares: 0, views: 0 };
        }
        return bucket;
    };

    const addPlatformStats = (bucket, platform) => {
        const b = ensureBucket(bucket);
        b.posts++;
        b[platform.status]++;
        if (platform.engagement) {
            b.engagement.likes += platform.engagement.likes || 0;
            b.engagement.comments += platform.engagement.comments || 0;
            b.engagement.shares += platform.engagement.shares || 0;
            b.engagement.views += platform.engagement.views || 0;
        }
    };

    posts.forEach((post) => {
        post.platforms.forEach((platform) => {
            if (!platformBreakdown[platform.name]) {
                platformBreakdown[platform.name] = {
                    posts: 0,
                    published: 0,
                    scheduled: 0,
                    draft: 0,
                    failed: 0,
                    engagement: { likes: 0, comments: 0, shares: 0, views: 0 },
                };
            }
            addPlatformStats(platformBreakdown[platform.name], platform);

            const accKey = `${platform.name}:${platform.accountId}`;
            if (!accountBreakdown[accKey]) {
                accountBreakdown[accKey] = {
                    platform: platform.name,
                    accountId: platform.accountId,
                    posts: 0,
                    published: 0,
                    scheduled: 0,
                    draft: 0,
                    failed: 0,
                    engagement: { likes: 0, comments: 0, shares: 0, views: 0 },
                };
            }
            addPlatformStats(accountBreakdown[accKey], platform);
        });
    });

    return {
        overview: {
            totalPosts,
            publishedPosts,
            scheduledPosts,
            draftPosts,
            failedPosts,
            totalLikes,
            totalComments,
            totalShares,
            totalViews,
            totalReach,
            totalFollowers,
            totalEngagement,
            engagementRate: Math.round(engagementRate * 100) / 100,
        },
        platformBreakdown,
        accountBreakdown,
        dateRange: { startDate, endDate },
    };
}

module.exports = { computeAnalyticsOverview };
