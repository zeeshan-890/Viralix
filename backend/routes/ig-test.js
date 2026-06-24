const express = require('express');
const auth = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');
const igTest = require('../services/igTest');
const IgTestAccount = require('../models/igtest/IgTestAccount');
const IgTestPublishLog = require('../models/igtest/IgTestPublishLog');

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const RETURN_PATH = '/dashboard/ig-test';

function redirectBack(res, params) {
    const qs = new URLSearchParams(params).toString();
    return res.redirect(`${CLIENT_URL}${RETURN_PATH}?${qs}`);
}

// GET /api/ig-test/connect — return the Instagram Business Login URL
router.get('/connect', auth, async (req, res) => {
    try {
        const state = igTest.signState(req.user.id);
        const authUrl = igTest.buildAuthUrl(state);
        res.json({ authUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/ig-test/callback — exchange code, store account (public, state-verified)
router.get('/callback', async (req, res) => {
    const { code, state, error, error_description } = req.query;
    if (error) return redirectBack(res, { error: error_description || error });
    if (!code || !state) return redirectBack(res, { error: 'missing_code_or_state' });

    try {
        const userId = igTest.verifyState(state);

        const { shortLivedToken, igUserId } = await igTest.exchangeCodeForToken(code);
        const { accessToken, expiresAt } = await igTest.getLongLivedToken(shortLivedToken);
        const profile = await igTest.getProfile(igUserId, accessToken);

        await IgTestAccount.findOneAndUpdate(
            { userId, igUserId },
            {
                userId,
                igUserId,
                username: profile.username || String(igUserId),
                accountType: profile.account_type,
                profilePictureUrl: profile.profile_picture_url,
                accessToken: encrypt(accessToken),
                tokenExpires: expiresAt,
                connectedAt: new Date(),
                lastUsed: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return redirectBack(res, { success: 'instagram_connected', username: profile.username || igUserId });
    } catch (err) {
        console.error('[igTest] callback error:', err.response?.data || err.message);
        const msg = err.response?.data?.error_message || err.response?.data?.error?.message || err.message;
        return redirectBack(res, { error: msg });
    }
});

// GET /api/ig-test/accounts — list this user's connected test accounts
router.get('/accounts', auth, async (req, res) => {
    try {
        const accounts = await IgTestAccount.find({ userId: req.user.id }).sort({ connectedAt: -1 });
        res.json({
            accounts: accounts.map((a) => ({
                id: a._id,
                igUserId: a.igUserId,
                username: a.username,
                accountType: a.accountType,
                profilePictureUrl: a.profilePictureUrl,
                connectedAt: a.connectedAt,
                tokenExpires: a.tokenExpires
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/ig-test/accounts/:id — disconnect a test account
router.delete('/accounts/:id', auth, async (req, res) => {
    try {
        await IgTestAccount.deleteOne({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Instagram test account disconnected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

async function loadAccountWithToken(userId, accountId) {
    const account = await IgTestAccount.findOne({ _id: accountId, userId }).select('+accessToken');
    if (!account) throw new Error('Account not found');
    const token = decrypt(account.accessToken);
    return { account, token };
}

// POST /api/ig-test/publish — publish image / reel / story / carousel
router.post('/publish', auth, async (req, res) => {
    const { accountId, mediaType, imageUrl, videoUrl, children, caption, altText, isAiGenerated } = req.body || {};

    let log;
    try {
        if (!accountId) throw new Error('accountId is required');
        const type = String(mediaType || '').toUpperCase();
        if (!['IMAGE', 'REELS', 'STORIES', 'CAROUSEL'].includes(type)) {
            throw new Error('mediaType must be IMAGE, REELS, STORIES, or CAROUSEL');
        }

        const { account, token } = await loadAccountWithToken(req.user.id, accountId);
        const igUserId = account.igUserId;

        const mediaUrls = [];
        if (type === 'CAROUSEL') {
            if (!Array.isArray(children) || children.length < 2) {
                throw new Error('CAROUSEL requires at least 2 children');
            }
            if (children.length > 10) throw new Error('CAROUSEL supports a maximum of 10 items');
        } else if (type === 'IMAGE') {
            if (!imageUrl) throw new Error('imageUrl is required for IMAGE');
            mediaUrls.push(imageUrl);
        } else {
            if (!videoUrl) throw new Error('videoUrl is required for REELS/STORIES');
            mediaUrls.push(videoUrl);
        }

        log = await IgTestPublishLog.create({
            userId: req.user.id,
            igUserId,
            mediaType: type,
            caption,
            mediaUrls,
            status: 'pending'
        });

        let creationId;

        if (type === 'CAROUSEL') {
            // 1. Create a child container for each item.
            const childIds = [];
            for (const child of children) {
                const isVideo = (child.type || '').toLowerCase() === 'video';
                const childPayload = { is_carousel_item: true };
                if (isVideo) {
                    childPayload.media_type = 'VIDEO';
                    childPayload.video_url = child.url;
                } else {
                    childPayload.image_url = child.url;
                    if (child.altText) childPayload.alt_text = child.altText;
                }
                const created = await igTest.createMediaContainer(igUserId, token, childPayload);
                await igTest.waitForContainer(created.id, token);
                childIds.push(created.id);
            }
            // 2. Create the carousel container referencing the children.
            const carouselPayload = {
                media_type: 'CAROUSEL',
                children: childIds.join(',')
            };
            if (caption) carouselPayload.caption = caption;
            if (isAiGenerated) carouselPayload.is_ai_generated = true;
            const carousel = await igTest.createMediaContainer(igUserId, token, carouselPayload);
            await igTest.waitForContainer(carousel.id, token);
            creationId = carousel.id;
            log.carouselChildren = childIds;
            log.mediaUrls = children.map((c) => c.url);
        } else {
            const payload = {};
            if (caption) payload.caption = caption;
            if (isAiGenerated) payload.is_ai_generated = true;

            if (type === 'IMAGE') {
                payload.image_url = imageUrl;
                if (altText) payload.alt_text = altText;
            } else {
                payload.media_type = type; // REELS or STORIES
                payload.video_url = videoUrl;
            }

            const container = await igTest.createMediaContainer(igUserId, token, payload);
            // Images are usually instant; videos/reels/stories need processing time.
            await igTest.waitForContainer(container.id, token);
            creationId = container.id;
        }

        log.containerId = creationId;
        await log.save();

        const published = await igTest.publishContainer(igUserId, token, creationId);

        log.publishedMediaId = published.id;
        log.status = 'published';
        await log.save();

        account.lastUsed = new Date();
        await account.save();

        res.json({ success: true, mediaId: published.id, containerId: creationId });
    } catch (error) {
        const msg = error.response?.data?.error?.message || error.response?.data?.error_message || error.message;
        if (log) {
            log.status = 'failed';
            log.error = msg;
            await log.save().catch(() => {});
        }
        console.error('[igTest] publish error:', error.response?.data || error.message);
        res.status(500).json({ message: msg });
    }
});

// GET /api/ig-test/publish-limit/:accountId — current rate-limit usage
router.get('/publish-limit/:accountId', auth, async (req, res) => {
    try {
        const { account, token } = await loadAccountWithToken(req.user.id, req.params.accountId);
        const data = await igTest.getPublishingLimit(account.igUserId, token);
        res.json(data);
    } catch (error) {
        const msg = error.response?.data?.error?.message || error.message;
        res.status(500).json({ message: msg });
    }
});

// GET /api/ig-test/logs — recent publish attempts
router.get('/logs', auth, async (req, res) => {
    try {
        const logs = await IgTestPublishLog.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
