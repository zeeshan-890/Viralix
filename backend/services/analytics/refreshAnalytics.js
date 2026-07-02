const Post = require('../../models/Post');
const User = require('../../models/User');
const AccountService = require('../account.service');
const { getPostMetrics } = require('../facebook');
const youtubeService = require('../youtube');
const tiktokService = require('../tiktok');

async function refreshAnalyticsForUser(userId) {
    const user = await User.findById(userId).lean();
    const connectedAccounts = await AccountService.getAccountsWithTokens(userId);

    const posts = await Post.find({ user: userId, 'platforms.status': 'published' })
        .sort({ updatedAt: -1 })
        .limit(50);

    let updatedCount = 0;
    for (const post of posts) {
        let changed = false;
        const nextPlatforms = [];

        for (const p of post.platforms) {
            if (p.status !== 'published') { nextPlatforms.push(p); continue; }
            const account = connectedAccounts.find((a) => a.platform === p.name && a.platformAccountId === p.accountId);

            try {
                if (p.name === 'facebook') {
                    const page = user?.settings?.facebookPages?.find((pg) => pg.id === p.accountId);
                    const token = page?.accessToken || page?.access_token || account?.accessToken;
                    if (token && p.postId) {
                        const metrics = await getPostMetrics(p.postId, token);
                        if (metrics) {
                            nextPlatforms.push({ ...p.toObject?.() || p, engagement: { ...p.engagement, ...metrics, lastUpdated: new Date() } });
                            changed = true;
                            continue;
                        }
                    }
                } else if (p.name === 'instagram') {
                    let token = account?.accessToken;
                    if (!token) {
                        const page = user?.settings?.facebookPages?.find((pg) => pg.instagramId === p.accountId);
                        token = page?.accessToken || page?.access_token;
                    }
                    if (token && p.postId) {
                        const axios = require('axios');
                        try {
                            const response = await axios.get(`https://graph.instagram.com/${p.postId}`, {
                                params: { fields: 'like_count,comments_count', access_token: token },
                            });
                            const media = response.data;
                            nextPlatforms.push({
                                ...p.toObject?.() || p,
                                engagement: {
                                    ...p.engagement,
                                    likes: media.like_count || 0,
                                    comments: media.comments_count || 0,
                                    lastUpdated: new Date(),
                                },
                            });
                            changed = true;
                            continue;
                        } catch (_) { /* ignore */ }
                    }
                } else if (p.name === 'youtube') {
                    if (account && account.accessToken && p.postId) {
                        const details = await youtubeService.getVideoDetails(account.accessToken, p.postId);
                        if (details && details.statistics) {
                            const stats = details.statistics;
                            nextPlatforms.push({
                                ...p.toObject?.() || p,
                                engagement: {
                                    ...p.engagement,
                                    views: parseInt(stats.viewCount || 0, 10),
                                    likes: parseInt(stats.likeCount || 0, 10),
                                    comments: parseInt(stats.commentCount || 0, 10),
                                    lastUpdated: new Date(),
                                },
                            });
                            changed = true;
                            continue;
                        }
                    }
                } else if (p.name === 'tiktok') {
                    if (account && account.accessToken && p.postId) {
                        const details = await tiktokService.queryVideos(account.accessToken, [p.postId]);
                        if (details && details.videos && details.videos.length > 0) {
                            const vid = details.videos[0];
                            nextPlatforms.push({
                                ...p.toObject?.() || p,
                                engagement: {
                                    ...p.engagement,
                                    views: vid.view_count || 0,
                                    likes: vid.like_count || 0,
                                    comments: vid.comment_count || 0,
                                    shares: vid.share_count || 0,
                                    lastUpdated: new Date(),
                                },
                            });
                            changed = true;
                            continue;
                        }
                    }
                }
            } catch (_) { /* best effort per platform */ }

            nextPlatforms.push(p);
        }

        if (changed) {
            post.platforms = nextPlatforms;
            await post.save();
            updatedCount++;
        }
    }

    return { updated: updatedCount };
}

module.exports = { refreshAnalyticsForUser };

