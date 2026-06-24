const mongoose = require('mongoose');
const axios = require('axios');
const PlatformContent = require('../../models/PlatformContent');
const AccountService = require('../account.service');
const tiktokService = require('../tiktok');

const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

function periodToStartDate(period) {
    const now = Date.now();
    switch (period) {
        case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
        case '90d': return new Date(now - 90 * 24 * 60 * 60 * 1000);
        case '1y': return new Date(now - 365 * 24 * 60 * 60 * 1000);
        case 'all': return null;
        default: return new Date(now - 30 * 24 * 60 * 60 * 1000);
    }
}

function engagementTotal(item) {
    return (item.likes || 0) + (item.comments || 0) + (item.shares || 0) + (item.saves || 0);
}

function engagementRate(views, engagement) {
    if (!views) return 0;
    return Math.round((engagement / views) * 10000) / 100;
}

function mapContentItem(item, platform) {
    const eng = engagementTotal(item);
    const views = item.views || 0;
    return {
        id: item.platformContentId,
        accountId: item.accountId,
        title: item.title || item.description?.slice(0, 80) || 'Untitled',
        description: item.description || '',
        thumbnail: item.thumbnail,
        mediaType: item.mediaType,
        permalink: item.permalink,
        publishedAt: item.publishedAt,
        lastSyncedAt: item.lastSyncedAt,
        metrics: {
            views,
            likes: item.likes || 0,
            comments: item.comments || 0,
            shares: item.shares || 0,
            saves: item.saves || 0,
            engagement: eng,
            engagementRate: engagementRate(views, eng),
            likeRate: engagementRate(views, item.likes || 0),
            commentRate: engagementRate(views, item.comments || 0),
            shareRate: engagementRate(views, item.shares || 0),
        },
        detailUrl: `/dashboard/platforms/${platform}/post/${item.platformContentId}`,
    };
}

async function fetchTikTokAccountMeta(account) {
    try {
        const userInfo = await tiktokService.getUserInfo(account.accessToken);
        const creatorInfo = await tiktokService.getCreatorInfo(account.accessToken);
        return {
            accountId: account.platformAccountId,
            accountName: account.accountName || userInfo?.display_name,
            avatarUrl: userInfo?.avatar_url || account.metadata?.avatarUrl,
            followers: userInfo?.follower_count || 0,
            following: userInfo?.following_count || 0,
            likes: userInfo?.likes_count || 0,
            videoCount: userInfo?.video_count || 0,
            maxVideoDurationSec: creatorInfo?.max_video_post_duration_sec || 60,
            postsRemainingToday: creatorInfo?.posts_remaining_today ?? null,
            isPrivateAccount: tiktokService.isPrivateTikTokAccount(creatorInfo?.privacy_level_options || []),
        };
    } catch (e) {
        return {
            accountId: account.platformAccountId,
            accountName: account.accountName,
            followers: 0,
            error: e.message,
        };
    }
}

async function fetchInstagramAccountMeta(account) {
    try {
        const profileRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${account.platformAccountId}`, {
            params: {
                fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count',
                access_token: account.accessToken,
            },
        });
        const profile = profileRes.data;
        let accountInsights = {};
        try {
            const insRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${account.platformAccountId}/insights`, {
                params: {
                    metric: 'reach,profile_views,accounts_engaged,total_interactions',
                    period: 'day',
                    access_token: account.accessToken,
                },
            });
            (insRes.data?.data || []).forEach((m) => {
                const vals = m.values || [];
                accountInsights[m.name] = vals.length ? vals[vals.length - 1].value : 0;
            });
        } catch {
            /* insights may require business account */
        }
        return {
            accountId: account.platformAccountId,
            accountName: profile.name || profile.username || account.accountName,
            username: profile.username,
            avatarUrl: profile.profile_picture_url,
            followers: profile.followers_count || 0,
            following: profile.follows_count || 0,
            mediaCount: profile.media_count || 0,
            accountInsights,
        };
    } catch (e) {
        return {
            accountId: account.platformAccountId,
            accountName: account.accountName,
            followers: 0,
            error: e.message,
        };
    }
}

async function buildDeepAnalytics(userId, platform, { period = '30d', accountId } = {}) {
    if (!['tiktok', 'instagram'].includes(platform)) {
        throw new Error('Unsupported platform');
    }

    const startDate = periodToStartDate(period);
    const match = {
        userId: new mongoose.Types.ObjectId(userId),
        platform,
    };
    if (accountId) match.accountId = accountId;

    let content = await PlatformContent.find(match).sort({ publishedAt: -1 }).lean();
    if (startDate) {
        content = content.filter((c) => !c.publishedAt || new Date(c.publishedAt) >= startDate);
    }

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalSaves = 0;
    const byAccount = {};
    const byMediaType = {};
    const timeline = {};

    for (const item of content) {
        totalViews += item.views || 0;
        totalLikes += item.likes || 0;
        totalComments += item.comments || 0;
        totalShares += item.shares || 0;
        totalSaves += item.saves || 0;

        const accKey = item.accountId || 'unknown';
        if (!byAccount[accKey]) {
            byAccount[accKey] = { accountId: accKey, posts: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, engagement: 0 };
        }
        byAccount[accKey].posts += 1;
        byAccount[accKey].views += item.views || 0;
        byAccount[accKey].likes += item.likes || 0;
        byAccount[accKey].comments += item.comments || 0;
        byAccount[accKey].shares += item.shares || 0;
        byAccount[accKey].saves += item.saves || 0;
        byAccount[accKey].engagement += engagementTotal(item);

        const mt = item.mediaType || 'unknown';
        if (!byMediaType[mt]) {
            byMediaType[mt] = { type: mt, count: 0, views: 0, likes: 0, engagement: 0 };
        }
        byMediaType[mt].count += 1;
        byMediaType[mt].views += item.views || 0;
        byMediaType[mt].likes += item.likes || 0;
        byMediaType[mt].engagement += engagementTotal(item);

        if (item.publishedAt) {
            const day = new Date(item.publishedAt).toISOString().split('T')[0];
            if (!timeline[day]) {
                timeline[day] = { date: day, views: 0, likes: 0, comments: 0, shares: 0, engagement: 0, posts: 0 };
            }
            timeline[day].views += item.views || 0;
            timeline[day].likes += item.likes || 0;
            timeline[day].comments += item.comments || 0;
            timeline[day].shares += item.shares || 0;
            timeline[day].engagement += engagementTotal(item);
            timeline[day].posts += 1;
        }
    }

    const totalEngagement = totalLikes + totalComments + totalShares + totalSaves;
    const postCount = content.length;

    const mapped = content.map((c) => mapContentItem(c, platform));
    const topByViews = [...mapped].sort((a, b) => b.metrics.views - a.metrics.views).slice(0, 10);
    const topByEngagement = [...mapped].sort((a, b) => b.metrics.engagement - a.metrics.engagement).slice(0, 10);
    const topByEngagementRate = [...mapped]
        .filter((p) => p.metrics.views >= 100)
        .sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate)
        .slice(0, 10);

    const accounts = await AccountService.getAccountsWithTokens(userId);
    const platformAccounts = accounts.filter((a) => a.platform === platform);
    const accountMeta = [];
    for (const acc of platformAccounts) {
        if (accountId && acc.platformAccountId !== accountId) continue;
        const meta = platform === 'tiktok'
            ? await fetchTikTokAccountMeta(acc)
            : await fetchInstagramAccountMeta(acc);
        const stats = byAccount[acc.platformAccountId];
        accountMeta.push({
            ...meta,
            contentStats: stats || { posts: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, engagement: 0 },
            avgViewsPerPost: stats?.posts ? Math.round(stats.views / stats.posts) : 0,
            avgEngagementPerPost: stats?.posts ? Math.round(stats.engagement / stats.posts) : 0,
        });
    }

    return {
        platform,
        period,
        accountId: accountId || null,
        generatedAt: new Date(),
        summary: {
            totalPosts: postCount,
            totalViews,
            totalLikes,
            totalComments,
            totalShares,
            totalSaves,
            totalEngagement,
            engagementRate: engagementRate(totalViews, totalEngagement),
            avgViewsPerPost: postCount ? Math.round(totalViews / postCount) : 0,
            avgLikesPerPost: postCount ? Math.round(totalLikes / postCount) : 0,
            avgCommentsPerPost: postCount ? Math.round(totalComments / postCount) : 0,
            avgEngagementPerPost: postCount ? Math.round(totalEngagement / postCount) : 0,
            likeToViewRatio: engagementRate(totalViews, totalLikes),
            commentToViewRatio: engagementRate(totalViews, totalComments),
            shareToViewRatio: engagementRate(totalViews, totalShares),
        },
        accounts: accountMeta,
        accountBreakdown: Object.values(byAccount),
        mediaTypeBreakdown: Object.values(byMediaType),
        timeline: Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date)),
        topPosts: {
            byViews: topByViews,
            byEngagement: topByEngagement,
            byEngagementRate: topByEngagementRate,
        },
        allPosts: mapped,
    };
}

module.exports = { buildDeepAnalytics };
