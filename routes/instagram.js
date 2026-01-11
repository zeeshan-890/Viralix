const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { getIgUser, getIgFeed, getIgUserInsights, createMediaContainer, getContainerStatus, publishContainer } = require('../services/instagram');
const { getAllPages, enrichPagesWithInstagram } = require('../services/facebook');

const router = express.Router();

// Use Cloudinary URLs: publish by URL; uploads are handled via /api/upload/media
// No local disk writes here; client uploads first to Cloudinary, then sends image_url/video_url.

const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

function getFbAndPages(user) {
    const fb = (user.socialAccounts || []).find(a => a.platform === 'facebook');
    return { fbToken: fb?.accessToken, pages: user?.settings?.facebookPages || [] };
}

function findPageByIg(pages, igUserId) {
    return (pages || []).find(p => String(p.instagramId || p.instagram_id) === String(igUserId));
}

// Get direct Instagram OAuth accounts (new method)
function getDirectInstagramAccounts(user) {
    return (user.socialAccounts || []).filter(acc =>
        acc.platform === 'instagram' && acc.isActive && acc.accessToken
    );
}

// List IG accounts available (supports both Facebook-linked and Direct OAuth)
router.get('/status', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        const accounts = [];

        // Method 1: Direct Instagram OAuth accounts (new)
        const directAccounts = getDirectInstagramAccounts(user.toObject());
        for (const acc of directAccounts) {
            accounts.push({
                igUserId: acc.accountId,
                accountId: acc.accountId, // Added for upload page compatibility
                username: acc.accountName || acc.username,
                pageName: acc.accountName || acc.username, // For frontend compatibility
                method: 'direct_oauth',
                accountType: acc.accountType || 'BUSINESS',
                connectedAt: acc.connectedAt
            });
        }

        // Method 2: Facebook-linked Instagram accounts (legacy)
        const { fbToken } = getFbAndPages(user.toObject());
        let pages = (user.settings?.facebookPages || []);
        const fbLinkedAccounts = (pages || []).filter(p => p.instagramId).map(p => ({
            igUserId: p.instagramId,
            accountId: p.instagramId, // Added for upload page compatibility
            pageId: p.id,
            pageName: p.name,
            username: p.name, // For consistency with direct OAuth
            method: 'facebook_linked'
        }));

        // Auto-refresh pages to capture instagramId if missing
        if (fbLinkedAccounts.length === 0 && fbToken) {
            try {
                let raw = await getAllPages(fbToken);
                raw = await enrichPagesWithInstagram(raw);
                const normalized = (raw || []).map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    accessToken: p.access_token || p.accessToken,
                    instagramId: p.instagramId || p.instagram_business_account?.id || p.connected_instagram_account?.id || null,
                }));
                user.settings = user.settings || {};
                user.settings.facebookPages = normalized;
                user.markModified('settings');
                await user.save();
                pages = normalized;
                const refreshedAccounts = (pages || []).filter(p => p.instagramId).map(p => ({
                    igUserId: p.instagramId,
                    accountId: p.instagramId, // Added for upload page compatibility
                    pageId: p.id,
                    pageName: p.name,
                    username: p.name, // For consistency with direct OAuth
                    method: 'facebook_linked'
                }));
                accounts.push(...refreshedAccounts);
            } catch (e) {
                // swallow and continue
            }
        } else {
            accounts.push(...fbLinkedAccounts);
        }

        res.set('Cache-Control', 'no-store');
        return res.json({ accounts });
    } catch (e) {
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data?.error?.message || e.message });
    }
});

router.get('/accounts/:igUserId/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();

        // Check if it's a direct OAuth account first
        const directAccount = (user.socialAccounts || []).find(acc =>
            acc.platform === 'instagram' &&
            acc.accountId === req.params.igUserId &&
            acc.isActive
        );

        if (directAccount) {
            // Use direct Instagram Graph API
            try {
                const profileResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${req.params.igUserId}`, {
                    params: {
                        fields: 'id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count',
                        access_token: directAccount.accessToken
                    }
                });
                return res.json({ profile: profileResponse.data });
            } catch (err) {
                console.error('Instagram direct profile fetch error:', err.response?.data || err.message);
                return res.status(err.response?.status || 500).json({
                    message: err.response?.data?.error?.message || err.message
                });
            }
        }

        // Fallback to Facebook-linked method
        const { fbToken, pages } = getFbAndPages(user);
        const page = findPageByIg(pages, req.params.igUserId);
        if (!page) return res.status(404).json({ message: 'IG not linked' });
        const profile = await getIgUser(page.instagramId, fbToken);
        return res.json({ profile });
    } catch (e) {
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data?.error?.message || e.message });
    }
});

router.get('/accounts/:igUserId/feed', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();
        const limit = Math.min(parseInt(req.query.limit || '12', 10), 50);

        // Check if it's a direct OAuth account first
        const directAccount = (user.socialAccounts || []).find(acc =>
            acc.platform === 'instagram' &&
            acc.accountId === req.params.igUserId &&
            acc.isActive
        );

        if (directAccount) {
            // Use direct Instagram Graph API
            try {
                const feedResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${req.params.igUserId}/media`, {
                    params: {
                        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,like_count,comments_count',
                        limit: limit,
                        access_token: directAccount.accessToken
                    }
                });
                return res.json({ feed: feedResponse.data.data || [] });
            } catch (err) {
                console.error('Instagram direct feed fetch error:', err.response?.data || err.message);
                return res.status(err.response?.status || 500).json({
                    message: err.response?.data?.error?.message || err.message
                });
            }
        }

        // Fallback to Facebook-linked method
        const { fbToken, pages } = getFbAndPages(user);
        const page = findPageByIg(pages, req.params.igUserId);
        if (!page) return res.status(404).json({ message: 'IG not linked' });
        const feed = await getIgFeed(page.instagramId, fbToken, limit);
        return res.json({ feed });
    } catch (e) {
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data?.error?.message || e.message });
    }
});

router.get('/accounts/:igUserId/insights', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();

        // Check if it's a direct OAuth account first
        const directAccount = (user.socialAccounts || []).find(acc =>
            acc.platform === 'instagram' &&
            acc.accountId === req.params.igUserId &&
            acc.isActive
        );

        if (directAccount) {
            // Use direct Instagram Graph API for insights
            try {
                const insightsResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${req.params.igUserId}/insights`, {
                    params: {
                        metric: 'follower_count,impressions,reach,profile_views',
                        period: 'day',
                        access_token: directAccount.accessToken
                    }
                });
                return res.json({ insights: insightsResponse.data.data || [] });
            } catch (err) {
                console.error('Instagram direct insights fetch error:', err.response?.data || err.message);
                return res.status(err.response?.status || 500).json({
                    message: err.response?.data?.error?.message || err.message
                });
            }
        }

        // Fallback to Facebook-linked method
        const { fbToken, pages } = getFbAndPages(user);
        const page = findPageByIg(pages, req.params.igUserId);
        if (!page) return res.status(404).json({ message: 'IG not linked' });
        const insights = await getIgUserInsights(page.instagramId, fbToken);
        return res.json({ insights });
    } catch (e) {
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data?.error?.message || e.message });
    }
});

// Publish by URL from Cloudinary (supports both methods)
router.post('/accounts/:igUserId/publish-by-url', auth, async (req, res) => {
    try {
        const { mediaType, url, caption } = req.body || {};
        if (!url || !mediaType) return res.status(400).json({ message: 'mediaType and url required' });

        const user = await User.findById(req.user.id).lean();

        // Check if it's a direct OAuth account first
        const directAccount = (user.socialAccounts || []).find(acc =>
            acc.platform === 'instagram' &&
            acc.accountId === req.params.igUserId &&
            acc.isActive
        );

        if (directAccount) {
            // Use direct Instagram Graph API for publishing
            try {
                // Step 1: Create media container
                const containerPayload = mediaType === 'VIDEO'
                    ? { media_type: 'REELS', video_url: url, caption }
                    : { image_url: url, caption };

                const createResponse = await axios.post(
                    `${INSTAGRAM_GRAPH_URL}/${req.params.igUserId}/media`,
                    null,
                    {
                        params: {
                            ...containerPayload,
                            access_token: directAccount.accessToken
                        }
                    }
                );

                const creationId = createResponse.data.id;
                console.log('[Instagram Direct] Media container created:', creationId);

                // Step 2: Poll container status
                let status = 'IN_PROGRESS';
                const started = Date.now();
                while (status === 'IN_PROGRESS' && Date.now() - started < 120000) {
                    await new Promise(r => setTimeout(r, 2500));
                    const statusResponse = await axios.get(
                        `${INSTAGRAM_GRAPH_URL}/${creationId}`,
                        {
                            params: {
                                fields: 'status_code',
                                access_token: directAccount.accessToken
                            }
                        }
                    );
                    status = statusResponse.data.status_code === 'FINISHED' ? 'FINISHED' : 'IN_PROGRESS';
                }

                if (status !== 'FINISHED') {
                    return res.status(502).json({ message: `Container status: ${status}` });
                }

                // Step 3: Publish the container
                const publishResponse = await axios.post(
                    `${INSTAGRAM_GRAPH_URL}/${req.params.igUserId}/media_publish`,
                    null,
                    {
                        params: {
                            creation_id: creationId,
                            access_token: directAccount.accessToken
                        }
                    }
                );

                console.log('[Instagram Direct] Media published:', publishResponse.data.id);
                return res.json({ ok: true, mediaId: publishResponse.data.id });

            } catch (err) {
                console.error('Instagram direct publish error:', err.response?.data || err.message);
                return res.status(err.response?.status || 500).json({
                    message: err.response?.data?.error?.message || err.message
                });
            }
        }

        // Fallback to Facebook-linked method
        const { fbToken, pages } = getFbAndPages(user);
        const page = findPageByIg(pages, req.params.igUserId);
        if (!page) return res.status(404).json({ message: 'IG not linked' });

        const payload = mediaType === 'VIDEO' ? { media_type: 'REELS', video_url: url, caption } : { image_url: url, caption };
        let creationId;
        try {
            const result = await createMediaContainer(page.instagramId, fbToken, payload);
            creationId = result.id;
        } catch (err) {
            console.error('Instagram createMediaContainer error:', err?.response?.data || err.message);
            return res.status(err?.response?.status || 500).json({ message: err?.response?.data?.error?.message || err.message });
        }

        // Poll until finished (max ~2 minutes)
        let status = 'IN_PROGRESS';
        const started = Date.now();
        while (status === 'IN_PROGRESS' && Date.now() - started < 120000) {
            await new Promise(r => setTimeout(r, 2500));
            status = await getContainerStatus(creationId, fbToken);
        }
        if (status !== 'FINISHED') return res.status(502).json({ message: `Container status: ${status}` });

        try {
            const { id: mediaId } = await publishContainer(page.instagramId, fbToken, creationId);
            return res.json({ ok: true, mediaId });
        } catch (err) {
            console.error('Instagram publishContainer error:', err?.response?.data || err.message);
            return res.status(err?.response?.status || 500).json({ message: err?.response?.data?.error?.message || err.message });
        }
    } catch (e) {
        console.error('Instagram publish-by-url route error:', e?.response?.data || e.message);
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data?.error?.message || e.message });
    }
});

module.exports = router;
