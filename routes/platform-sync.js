const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const AccountService = require('../services/account.service');
const PlatformContent = require('../models/PlatformContent');
const tiktokService = require('../services/tiktok');
const youtubeService = require('../services/youtube');
const axios = require('axios');

const router = express.Router();

const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

// Sync all platforms for a user
router.post('/sync-all', auth, async (req, res) => {
    try {
        const accounts = await AccountService.getAccountsWithTokens(req.user.id);
        const results = { instagram: null, tiktok: null, youtube: null, facebook: null };

        for (const account of accounts) {
            try {
                if (account.platform === 'instagram') {
                    results.instagram = await syncInstagram(req.user.id, account);
                } else if (account.platform === 'tiktok') {
                    results.tiktok = await syncTikTok(req.user.id, account);
                } else if (account.platform === 'youtube') {
                    results.youtube = await syncYouTube(req.user.id, account);
                } else if (account.platform === 'facebook') {
                    results.facebook = await syncFacebook(req.user.id, account);
                }
            } catch (e) {
                console.warn(`[Sync] Failed to sync ${account.platform}:`, e.message);
                results[account.platform] = { error: e.message };
            }
        }

        res.json({ success: true, results });
    } catch (error) {
        console.error('[Sync] Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Sync specific platform
router.post('/sync/:platform', auth, async (req, res) => {
    const { platform } = req.params;
    try {
        const accounts = await AccountService.getAccountsWithTokens(req.user.id);
        const platformAccounts = accounts.filter(a => a.platform === platform);

        if (platformAccounts.length === 0) {
            return res.status(404).json({ message: `No ${platform} accounts connected` });
        }

        let result = { synced: 0, content: [] };

        for (const account of platformAccounts) {
            try {
                let syncResult;
                if (platform === 'instagram') {
                    syncResult = await syncInstagram(req.user.id, account);
                } else if (platform === 'tiktok') {
                    syncResult = await syncTikTok(req.user.id, account);
                } else if (platform === 'youtube') {
                    syncResult = await syncYouTube(req.user.id, account);
                } else if (platform === 'facebook') {
                    syncResult = await syncFacebook(req.user.id, account);
                }
                if (syncResult) {
                    result.synced += syncResult.synced || 0;
                    result.content.push(...(syncResult.content || []));
                }
            } catch (e) {
                console.warn(`[Sync] ${platform} account ${account.platformAccountId}:`, e.message);
            }
        }

        res.json({ success: true, ...result });
    } catch (error) {
        console.error('[Sync] Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get synced content for platform
router.get('/content/:platform', auth, async (req, res) => {
    const { platform } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    try {
        const content = await PlatformContent.find({
            userId: req.user.id,
            platform: platform
        })
            .sort({ publishedAt: -1 })
            .limit(limit)
            .lean();

        // Calculate totals
        const totals = await PlatformContent.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.user.id), platform } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: '$views' },
                    totalLikes: { $sum: '$likes' },
                    totalComments: { $sum: '$comments' },
                    totalShares: { $sum: '$shares' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            content,
            metrics: totals[0] || { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, count: 0 }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Instagram sync helper
async function syncInstagram(userId, account) {
    const content = [];
    try {
        // Fetch media from Instagram - include video_views for Reels
        const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/${account.platformAccountId}/media`, {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
                limit: 50,
                access_token: account.accessToken
            }
        });

        const media = response.data?.data || [];

        for (const item of media) {
            // For video content, try to get insights for views
            let viewCount = 0;
            // Instagram returns 'VIDEO' for videos and 'REEL' for reels (not 'REELS')
            if (item.media_type === 'VIDEO' || item.media_type === 'REEL') {
                try {
                    // Try 'views' metric first (newer API), fallback to 'plays'
                    const insightsRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${item.id}/insights`, {
                        params: {
                            metric: 'views',
                            access_token: account.accessToken
                        }
                    });
                    const viewsData = insightsRes.data?.data?.find(m => m.name === 'views');
                    viewCount = viewsData?.values?.[0]?.value || 0;
                } catch (e) {
                    // Fallback to 'plays' metric
                    try {
                        const playsRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${item.id}/insights`, {
                            params: {
                                metric: 'plays',
                                access_token: account.accessToken
                            }
                        });
                        const playsData = playsRes.data?.data?.find(m => m.name === 'plays');
                        viewCount = playsData?.values?.[0]?.value || 0;
                    } catch (e2) {
                        // Insights may not be available
                        console.log(`[Instagram Sync] Could not fetch views for ${item.id}: ${e2.response?.data?.error?.message || e2.message}`);
                    }
                }
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
                    lastSyncedAt: new Date()
                },
                { upsert: true, new: true }
            );
            content.push(doc);
        }

        // Update account follower count
        try {
            const profileRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${account.platformAccountId}`, {
                params: {
                    fields: 'followers_count',
                    access_token: account.accessToken
                }
            });
            if (profileRes.data?.followers_count) {
                await AccountService.updateAccountMetadata(userId, account._id, {
                    followerCount: profileRes.data.followers_count
                });
            }
        } catch (e) { }

        return { synced: content.length, content };
    } catch (error) {
        console.error('[Sync Instagram]', error.message);
        throw error;
    }
}

// TikTok sync helper
async function syncTikTok(userId, account) {
    const content = [];
    try {
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
                    lastSyncedAt: new Date()
                },
                { upsert: true, new: true }
            );
            content.push(doc);
        }

        return { synced: content.length, content };
    } catch (error) {
        console.error('[Sync TikTok]', error.message);
        throw error;
    }
}

// YouTube sync helper
async function syncYouTube(userId, account) {
    const content = [];
    try {
        let videoData;
        try {
            videoData = await youtubeService.getMyVideos(account.accessToken, 50);
        } catch (error) {
            // Check if error is 401 Unauthorized and we have a refresh token
            if (error.response?.status === 401 && account.refreshToken) {
                console.log('[Sync YouTube] Token expired, refreshing...');
                try {
                    const tokens = await youtubeService.refreshAccessToken(
                        account.refreshToken,
                        process.env.GOOGLE_CLIENT_ID,
                        process.env.GOOGLE_CLIENT_SECRET
                    );

                    // Update account with new tokens
                    await AccountService.connectAccount(userId, {
                        platform: 'youtube',
                        accountId: account.platformAccountId,
                        name: account.accountName,
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token || account.refreshToken,
                        expires: new Date(Date.now() + (tokens.expires_in * 1000)),
                        metadata: account.metadata || {}
                    });

                    // Retry with new token
                    videoData = await youtubeService.getMyVideos(tokens.access_token, 50);
                } catch (refreshError) {
                    console.error('[Sync YouTube] Token refresh failed:', refreshError.message);
                    throw error; // Throw original error if refresh fails
                }
            } else {
                throw error;
            }
        }

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
                    views: parseInt(video.statistics?.viewCount || 0),
                    likes: parseInt(video.statistics?.likeCount || 0),
                    comments: parseInt(video.statistics?.commentCount || 0),
                    publishedAt: new Date(video.snippet?.publishedAt),
                    lastSyncedAt: new Date()
                },
                { upsert: true, new: true }
            );
            content.push(doc);
        }

        // Update subscriber count
        try {
            const channelInfo = await youtubeService.getChannelInfo(account.accessToken);
            if (channelInfo?.subscriberCount) {
                await AccountService.updateAccountMetadata(userId, account._id, {
                    followerCount: parseInt(channelInfo.subscriberCount)
                });
            }
        } catch (e) { }

        return { synced: content.length, content };
    } catch (error) {
        console.error('[Sync YouTube]', error.message);
        throw error;
    }
}

// Facebook sync helper
async function syncFacebook(userId, account) {
    const content = [];
    try {
        // Get the user's Facebook Pages from settings (each page has its own access token)
        const User = require('../models/User');
        const user = await User.findById(userId);
        const pages = user?.settings?.facebookPages || [];

        if (pages.length === 0) {
            console.log('[Sync Facebook] No Facebook Pages found for user');
            return { synced: 0, content: [] };
        }

        console.log(`[Sync Facebook] Found ${pages.length} pages:`, JSON.stringify(pages.map(p => ({ id: p.id, name: p.name, hasToken: !!p.accessToken })), null, 2));

        for (const page of pages) {
            if (!page.id || !page.accessToken) {
                console.log(`[Sync Facebook] Skipping page without ID or token: ${page.name}`);
                continue;
            }

            try {
                console.log(`[Sync Facebook] Fetching feed for page: ${page.name} (${page.id})`);

                // Fetch feed for this specific page using its Page Access Token
                const response = await axios.get(`https://graph.facebook.com/v19.0/${page.id}/feed`, {
                    params: {
                        fields: 'id,message,full_picture,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true)',
                        limit: 25,
                        access_token: page.accessToken
                    }
                });

                console.log(`[Sync Facebook] Raw API response for ${page.name}:`, JSON.stringify(response.data, null, 2));

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
                            lastSyncedAt: new Date()
                        },
                        { upsert: true, new: true }
                    );
                    content.push(doc);
                }

                console.log(`[Sync Facebook] Synced ${posts.length} posts from page: ${page.name}`);
            } catch (pageError) {
                console.error(`[Sync Facebook] Error syncing page ${page.name}:`, pageError.response?.data?.error?.message || pageError.message);
            }
        }

        return { synced: content.length, content };
    } catch (error) {
        console.error('[Sync Facebook]', error.message);
        throw error;
    }
}

module.exports = router;
