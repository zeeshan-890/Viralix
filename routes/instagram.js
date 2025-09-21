const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { getIgUser, getIgFeed, getIgUserInsights, createMediaContainer, getContainerStatus, publishContainer } = require('../services/instagram');
const { getAllPages, enrichPagesWithInstagram } = require('../services/facebook');

const router = express.Router();

// Use Cloudinary URLs: publish by URL; uploads are handled via /api/upload/media
// No local disk writes here; client uploads first to Cloudinary, then sends image_url/video_url.

function getFbAndPages(user) {
    const fb = (user.socialAccounts || []).find(a => a.platform === 'facebook');
    return { fbToken: fb?.accessToken, pages: user?.settings?.facebookPages || [] };
}

function findPageByIg(pages, igUserId) {
    return (pages || []).find(p => String(p.instagramId || p.instagram_id) === String(igUserId));
}

// List IG accounts available (from connected pages)
router.get('/status', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        const { fbToken } = getFbAndPages(user.toObject());
        let pages = (user.settings?.facebookPages || []);
        let accounts = (pages || []).filter(p => p.instagramId).map(p => ({ igUserId: p.instagramId, pageId: p.id, pageName: p.name }));

        // Auto-refresh pages to capture instagramId if missing
        if ((!accounts || accounts.length === 0) && fbToken) {
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
                accounts = (pages || []).filter(p => p.instagramId).map(p => ({ igUserId: p.instagramId, pageId: p.id, pageName: p.name }));
            } catch (e) {
                // swallow and return empty if still none
            }
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
        const { fbToken, pages } = getFbAndPages(user);
        const page = findPageByIg(pages, req.params.igUserId);
        if (!page) return res.status(404).json({ message: 'IG not linked' });
        const feed = await getIgFeed(page.instagramId, fbToken, Math.min(parseInt(req.query.limit || '12', 10), 50));
        return res.json({ feed });
    } catch (e) {
        const status = e?.response?.status || 500;
        return res.status(status).json({ message: e?.response?.data?.error?.message || e.message });
    }
});

router.get('/accounts/:igUserId/insights', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();
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

// Publish by URL from Cloudinary
router.post('/accounts/:igUserId/publish-by-url', auth, async (req, res) => {
    try {
        const { mediaType, url, caption } = req.body || {};
        if (!url || !mediaType) return res.status(400).json({ message: 'mediaType and url required' });

        const user = await User.findById(req.user.id).lean();
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
