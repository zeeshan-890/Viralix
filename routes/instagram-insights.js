const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const User = require('../models/User');
const AccountService = require('../services/account.service');

const router = express.Router();
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

// Get detailed insights for a specific media post
router.get('/media/:mediaId/insights', auth, async (req, res) => {
    const { mediaId } = req.params;
    try {
        // Get user's Instagram accounts
        const accounts = await AccountService.getAccountsWithTokens(req.user.id);
        const igAccount = accounts.find(a => a.platform === 'instagram');

        if (!igAccount) {
            return res.status(404).json({ message: 'No Instagram account connected' });
        }

        // Fetch media details
        const mediaRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${mediaId}`, {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,username,owner',
                access_token: igAccount.accessToken
            }
        });

        const media = mediaRes.data;

        // Fetch insights based on media type
        let insights = {};
        try {
            // For Reels/Videos - try views metric first (newer API), then plays
            if (media.media_type === 'VIDEO' || media.media_type === 'REELS') {
                // Try the new 'views' metric first
                try {
                    const viewsRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${mediaId}/insights`, {
                        params: {
                            metric: 'views',
                            access_token: igAccount.accessToken
                        }
                    });
                    const viewsData = viewsRes.data?.data?.find(m => m.name === 'views');
                    if (viewsData) {
                        insights.views = viewsData.values?.[0]?.value || 0;
                    }
                } catch (e) {
                    // views metric may not be available, try plays
                }

                // Fallback to plays if views not available
                if (!insights.views) {
                    try {
                        const playsRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${mediaId}/insights`, {
                            params: {
                                metric: 'plays',
                                access_token: igAccount.accessToken
                            }
                        });
                        const playsData = playsRes.data?.data?.find(m => m.name === 'plays');
                        insights.plays = playsData?.values?.[0]?.value || 0;
                    } catch (e) { }
                }

                // Get other reel metrics
                try {
                    const reelRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${mediaId}/insights`, {
                        params: {
                            metric: 'reach,saved,shares,total_interactions',
                            access_token: igAccount.accessToken
                        }
                    });
                    (reelRes.data?.data || []).forEach(metric => {
                        insights[metric.name] = metric.values?.[0]?.value || 0;
                    });
                } catch (e) { }
            } else {
                // For images/carousels
                try {
                    const imgRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${mediaId}/insights`, {
                        params: {
                            metric: 'reach,saved,total_interactions',
                            access_token: igAccount.accessToken
                        }
                    });
                    (imgRes.data?.data || []).forEach(metric => {
                        insights[metric.name] = metric.values?.[0]?.value || 0;
                    });
                } catch (e) { }
            }
        } catch (e) {
            console.warn('[IG Insights] Error fetching insights:', e.response?.data?.error?.message || e.message);
        }

        // Fetch comments
        let comments = [];
        try {
            const commentsRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${mediaId}/comments`, {
                params: {
                    fields: 'id,text,username,timestamp,like_count,replies{id,text,username,timestamp,like_count}',
                    limit: 50,
                    access_token: igAccount.accessToken
                }
            });
            comments = commentsRes.data?.data || [];
        } catch (e) {
            console.warn('[IG Comments] Error:', e.response?.data?.error?.message || e.message);
        }

        res.json({
            media: {
                id: media.id,
                caption: media.caption,
                mediaType: media.media_type,
                mediaUrl: media.media_url,
                thumbnailUrl: media.thumbnail_url,
                permalink: media.permalink,
                timestamp: media.timestamp,
                username: media.username
            },
            engagement: {
                likes: media.like_count || 0,
                comments: media.comments_count || 0,
                reach: insights.reach || 0,
                saves: insights.saved || 0,
                shares: insights.shares || 0,
                views: insights.views || insights.plays || 0,
                plays: insights.plays || insights.views || 0,
                totalInteractions: insights.total_interactions || 0
            },
            comments,
            // Include raw insights for debugging
            rawInsights: insights
        });
    } catch (error) {
        console.error('[IG Media Insights] Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: error.response?.data?.error?.message || error.message
        });
    }
});

module.exports = router;
