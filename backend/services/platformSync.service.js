const AccountService = require('./account.service');
const PlatformContent = require('../models/PlatformContent');
const tiktokService = require('./tiktok');
const youtubeService = require('./youtube');
const User = require('../models/User');
const axios = require('axios');

const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

async function syncInstagram(userId, account) {
    const content = [];
    const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/${account.platformAccountId}/media`, {
        params: {
            fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
            limit: 50,
            access_token: account.accessToken,
        },
    });

    const media = response.data?.data || [];
    for (const item of media) {
        let viewCount = 0;
        if (item.media_type === 'VIDEO' || item.media_type === 'REEL') {
            try {
                const insightsRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${item.id}/insights`, {
                    params: { metric: 'views', access_token: account.accessToken },
                });
                const viewsData = insightsRes.data?.data?.find((m) => m.name === 'views');
                viewCount = viewsData?.values?.[0]?.value || 0;
            } catch (_) { /* ignore */ }
        }

        const doc = await PlatformContent.findOneAndUpdate(
            { userId, platform: 'instagram', platformContentId: item.id },
            {
                userId,
                platform: 'instagram',
                platformContentId: item.id,
                accountId: account.platformAccountId,
                title: item.caption?.substring(0, 100) || '',
                description: item.caption || '',
                thumbnail: item.thumbnail_url || item.media_url,
                mediaUrl: item.media_url,
                mediaType: item.media_type === 'VIDEO' ? 'video' : 'image',
                permalink: item.permalink,
                views: viewCount,
                likes: item.like_count || 0,
                comments: item.comments_count || 0,
                publishedAt: new Date(item.timestamp),
                lastSyncedAt: new Date(),
            },
            { upsert: true, new: true }
        );
        content.push(doc);
    }

    return { synced: content.length, content };
}

async function syncTikTok(userId, account) {
    const content = [];
    const videoData = await tiktokService.getVideoList(account.accessToken, 50, 0);
    const videos = videoData.videos || [];

    for (const video of videos) {
        const doc = await PlatformContent.findOneAndUpdate(
            { userId, platform: 'tiktok', platformContentId: video.id },
            {
                userId,
                platform: 'tiktok',
                platformContentId: video.id,
                accountId: account.platformAccountId,
                title: video.title || '',
                description: video.video_description || '',
                thumbnail: video.cover_image_url,
                mediaUrl: video.share_url,
                mediaType: 'video',
                permalink: video.share_url,
                views: video.view_count || 0,
                likes: video.like_count || 0,
                comments: video.comment_count || 0,
                shares: video.share_count || 0,
                publishedAt: new Date(video.create_time * 1000),
                lastSyncedAt: new Date(),
            },
            { upsert: true, new: true }
        );
        content.push(doc);
    }

    return { synced: content.length, content };
}

async function syncYouTube(userId, account) {
    const content = [];
    const videoData = await youtubeService.getMyVideos(account.accessToken, 50);
    const videos = videoData.videos || [];

    for (const video of videos) {
        const videoId = video.snippet?.resourceId?.videoId;
        if (!videoId) continue;
        const doc = await PlatformContent.findOneAndUpdate(
            { userId, platform: 'youtube', platformContentId: videoId },
            {
                userId,
                platform: 'youtube',
                platformContentId: videoId,
                accountId: account.platformAccountId,
                title: video.snippet?.title || '',
                description: video.snippet?.description || '',
                thumbnail: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url,
                mediaType: 'video',
                permalink: `https://youtube.com/watch?v=${videoId}`,
                views: parseInt(video.statistics?.viewCount || 0, 10),
                likes: parseInt(video.statistics?.likeCount || 0, 10),
                comments: parseInt(video.statistics?.commentCount || 0, 10),
                publishedAt: new Date(video.snippet?.publishedAt),
                lastSyncedAt: new Date(),
            },
            { upsert: true, new: true }
        );
        content.push(doc);
    }
    return { synced: content.length, content };
}

async function syncFacebook(userId) {
    const content = [];
    const user = await User.findById(userId);
    const pages = user?.settings?.facebookPages || [];
    for (const page of pages) {
        if (!page.id || !page.accessToken) continue;
        try {
            const response = await axios.get(`https://graph.facebook.com/v19.0/${page.id}/feed`, {
                params: {
                    fields: 'id,message,full_picture,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true)',
                    limit: 25,
                    access_token: page.accessToken,
                },
            });
            const posts = response.data?.data || [];
            for (const post of posts) {
                const doc = await PlatformContent.findOneAndUpdate(
                    { userId, platform: 'facebook', platformContentId: post.id },
                    {
                        userId,
                        platform: 'facebook',
                        platformContentId: post.id,
                        accountId: page.id,
                        title: post.message?.substring(0, 100) || '',
                        description: post.message || '',
                        thumbnail: post.full_picture,
                        mediaType: post.full_picture ? 'image' : 'text',
                        permalink: post.permalink_url,
                        likes: post.reactions?.summary?.total_count || 0,
                        comments: post.comments?.summary?.total_count || 0,
                        shares: post.shares?.count || 0,
                        publishedAt: new Date(post.created_time),
                        lastSyncedAt: new Date(),
                    },
                    { upsert: true, new: true }
                );
                content.push(doc);
            }
        } catch (_) { /* ignore page errors */ }
    }
    return { synced: content.length, content };
}

async function executePlatformSync(userId, platform) {
    const accounts = await AccountService.getAccountsWithTokens(userId);
    const byPlatform = {};
    let synced = 0;

    const targets = platform === 'all' ? ['instagram', 'tiktok', 'youtube', 'facebook'] : [platform];
    for (const p of targets) {
        if (p === 'facebook') {
            const result = await syncFacebook(userId);
            byPlatform.facebook = result;
            synced += result.synced || 0;
            continue;
        }
        const platformAccounts = accounts.filter((a) => a.platform === p);
        let merged = { synced: 0, content: [] };
        for (const account of platformAccounts) {
            let r = { synced: 0, content: [] };
            if (p === 'instagram') r = await syncInstagram(userId, account);
            if (p === 'tiktok') r = await syncTikTok(userId, account);
            if (p === 'youtube') r = await syncYouTube(userId, account);
            merged.synced += r.synced || 0;
            merged.content.push(...(r.content || []));
        }
        byPlatform[p] = merged;
        synced += merged.synced;
    }

    return { synced, byPlatform };
}

module.exports = {
    executePlatformSync,
};

