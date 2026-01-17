const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();
const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v19.0';

// Get detailed insights for a specific Facebook post
router.get('/post/:postId/insights', auth, async (req, res) => {
    const { postId } = req.params;
    try {
        // Get user's Facebook Pages
        const user = await User.findById(req.user.id);
        const pages = user?.settings?.facebookPages || [];

        if (pages.length === 0) {
            return res.status(404).json({ message: 'No Facebook Pages connected' });
        }

        // Extract Page ID from post ID (format: pageId_postId)
        const pageId = postId.split('_')[0];
        const page = pages.find(p => p.id === pageId);

        if (!page || !page.accessToken) {
            return res.status(404).json({ message: 'Page not found or no access token' });
        }

        console.log(`[FB Insights] Fetching insights for post ${postId} from page ${page.name}`);

        // Fetch post details
        const postRes = await axios.get(`${FACEBOOK_GRAPH_URL}/${postId}`, {
            params: {
                fields: 'id,message,full_picture,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true),attachments{media,type,url,subattachments}',
                access_token: page.accessToken
            }
        });

        const post = postRes.data;
        console.log(`[FB Insights] Post data fetched:`, JSON.stringify(post, null, 2));

        // Fetch post insights
        let insights = {};
        try {
            const insightsRes = await axios.get(`${FACEBOOK_GRAPH_URL}/${postId}/insights`, {
                params: {
                    metric: 'post_impressions,post_impressions_unique,post_engaged_users,post_clicks,post_reactions_by_type_total',
                    access_token: page.accessToken
                }
            });
            console.log(`[FB Insights] Insights response:`, JSON.stringify(insightsRes.data, null, 2));

            (insightsRes.data?.data || []).forEach(metric => {
                insights[metric.name] = metric.values?.[0]?.value || 0;
            });
        } catch (e) {
            console.warn('[FB Insights] Error fetching insights:', e.response?.data?.error?.message || e.message);
            // Insights might not be available for all posts (e.g., too new, or unpublished)
        }

        // Fetch comments
        let comments = [];
        try {
            const commentsRes = await axios.get(`${FACEBOOK_GRAPH_URL}/${postId}/comments`, {
                params: {
                    fields: 'id,message,from{id,name,picture},created_time,like_count,comment_count,attachment',
                    limit: 50,
                    access_token: page.accessToken
                }
            });
            comments = commentsRes.data?.data || [];
            console.log(`[FB Insights] Fetched ${comments.length} comments`);
        } catch (e) {
            console.warn('[FB Comments] Error:', e.response?.data?.error?.message || e.message);
        }

        // Get video views if applicable
        let videoViews = 0;
        if (post.attachments?.data?.[0]?.type === 'video_inline' || post.permalink_url?.includes('/reel/')) {
            try {
                // For videos, try to get video views from the video object
                const attachmentId = post.attachments?.data?.[0]?.media?.id;
                if (attachmentId) {
                    const videoRes = await axios.get(`${FACEBOOK_GRAPH_URL}/${attachmentId}`, {
                        params: {
                            fields: 'views',
                            access_token: page.accessToken
                        }
                    });
                    videoViews = videoRes.data?.views || 0;
                }
            } catch (e) {
                console.warn('[FB Video Views] Error:', e.response?.data?.error?.message || e.message);
            }
        }

        // Determine media type
        const attachmentType = post.attachments?.data?.[0]?.type;
        let mediaType = 'text';
        if (attachmentType?.includes('video') || post.permalink_url?.includes('/reel/')) {
            mediaType = 'video';
        } else if (attachmentType?.includes('photo') || post.full_picture) {
            mediaType = 'image';
        }

        res.json({
            post: {
                id: post.id,
                message: post.message,
                picture: post.full_picture,
                permalink: post.permalink_url,
                createdTime: post.created_time,
                mediaType: mediaType,
                isReel: post.permalink_url?.includes('/reel/')
            },
            engagement: {
                reactions: post.reactions?.summary?.total_count || 0,
                comments: post.comments?.summary?.total_count || 0,
                shares: post.shares?.count || 0,
                impressions: insights.post_impressions || 0,
                reach: insights.post_impressions_unique || 0,
                engagement: insights.post_engaged_users || 0,
                clicks: insights.post_clicks || 0,
                videoViews: videoViews,
                reactionsByType: insights.post_reactions_by_type_total || {}
            },
            comments: comments.map(c => ({
                id: c.id,
                message: c.message,
                author: c.from?.name,
                authorId: c.from?.id,
                authorPicture: c.from?.picture?.data?.url,
                createdTime: c.created_time,
                likeCount: c.like_count || 0,
                replyCount: c.comment_count || 0
            })),
            rawInsights: insights
        });
    } catch (error) {
        console.error('[FB Post Insights] Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: error.response?.data?.error?.message || error.message
        });
    }
});

module.exports = router;
