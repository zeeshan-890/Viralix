const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');
const tiktokService = require('../services/tiktok');
const AccountService = require('../services/account.service');

const router = express.Router();

// TikTok OAuth Configuration
const TT_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TT_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TT_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'http://localhost:5000/api/tiktok-oauth/callback';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const TT_DEBUG = process.env.LOG_OAUTH_VERBOSE === '1';

function signState(userId) {
    const payload = `${userId}.${Date.now()}`;
    const signature = crypto
        .createHmac('sha256', TT_CLIENT_SECRET || 'fallback-secret')
        .update(payload)
        .digest('hex')
        .slice(0, 16);
    return `${payload}.${signature}`;
}

function verifyState(state) {
    const parts = state.split('.');
    if (parts.length !== 3) return null;
    const [userId, timestamp, signature] = parts;
    const payload = `${userId}.${timestamp}`;
    const expectedSig = crypto
        .createHmac('sha256', TT_CLIENT_SECRET || 'fallback-secret')
        .update(payload)
        .digest('hex')
        .slice(0, 16);
    if (signature !== expectedSig) return null;
    if (Date.now() - parseInt(timestamp) > 30 * 60 * 1000) return null;
    return userId;
}

// GET /connect
router.get('/connect', auth, async (req, res) => {
    try {
        if (!TT_CLIENT_KEY) return res.status(500).json({ message: 'TikTok integration not configured.' });
        const state = signState(req.user.id);
        const authUrl = tiktokService.generateAuthUrl(TT_CLIENT_KEY, TT_REDIRECT_URI, state);
        if (TT_DEBUG) console.log('[TikTok OAuth] Auth URL:', authUrl);
        res.json({ authUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /callback
router.get('/callback', async (req, res) => {
    const { code, state, error, error_description } = req.query;
    if (error) return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=${encodeURIComponent(error_description || error)}`);
    if (!code || !state) return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=missing_code_or_state`);

    try {
        const userId = verifyState(state);
        if (!userId) return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=invalid_state`);

        const tokenData = await tiktokService.exchangeCodeForToken(code, TT_CLIENT_KEY, TT_CLIENT_SECRET, TT_REDIRECT_URI);
        const userInfo = await tiktokService.getUserInfo(tokenData.access_token);
        const tokenExpires = new Date(Date.now() + (tokenData.expires_in * 1000));
        const accountName = userInfo?.display_name || userInfo?.username || `TikTok User ${tokenData.open_id.slice(-8)}`;

        await AccountService.connectAccount(userId, {
            platform: 'tiktok',
            accountId: tokenData.open_id,
            name: accountName,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expires: tokenExpires,
            metadata: {
                username: userInfo.username,
                avatarUrl: userInfo.avatar_url,
                followerCount: userInfo.follower_count
            }
        });

        res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?success=tiktok_connected`);
    } catch (error) {
        console.error('[TikTok OAuth] Callback error:', error);
        res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=${encodeURIComponent(error.message)}`);
    }
});

// GET /status
router.get('/status', auth, async (req, res) => {
    try {
        const accounts = await AccountService.getAccounts(req.user.id);
        const tiktokAccounts = accounts.filter(acc => acc.platform === 'tiktok');
        res.json({
            connected: tiktokAccounts.length > 0,
            accounts: tiktokAccounts.map(acc => ({
                accountId: acc.platformAccountId,
                accountName: acc.accountName,
                connectedAt: acc.connectedAt,
                tokenExpires: acc.tokenExpires,
                isExpired: acc.tokenExpires && new Date(acc.tokenExpires) < new Date()
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /account/:accountId
router.get('/account/:accountId', auth, async (req, res) => {
    try {
        const account = await AccountService.getAccount(req.user.id, 'tiktok', req.params.accountId);
        if (!account) return res.status(404).json({ message: 'TikTok account not found' });

        const userInfo = await tiktokService.getUserInfo(account.accessToken);
        res.json({
            accountId: account.platformAccountId,
            accountName: account.accountName,
            connectedAt: account.connectedAt,
            profile: {
                displayName: userInfo.display_name,
                username: userInfo.username,
                avatarUrl: userInfo.avatar_url,
                followerCount: userInfo.follower_count,
                followingCount: userInfo.following_count,
                likesCount: userInfo.likes_count,
                videoCount: userInfo.video_count
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /refresh/:accountId
router.post('/refresh/:accountId', auth, async (req, res) => {
    try {
        const account = await AccountService.getAccount(req.user.id, 'tiktok', req.params.accountId);
        if (!account) return res.status(404).json({ message: 'TikTok account not found' });
        if (!account.refreshToken) return res.status(400).json({ message: 'No refresh token available' });

        const tokenData = await tiktokService.refreshAccessToken(account.refreshToken, TT_CLIENT_KEY, TT_CLIENT_SECRET);

        await AccountService.connectAccount(req.user.id, {
            platform: 'tiktok',
            accountId: account.platformAccountId,
            name: account.accountName,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expires: new Date(Date.now() + (tokenData.expires_in * 1000)),
            metadata: account.metadata
        });

        res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /disconnect/:accountId
router.delete('/disconnect/:accountId', auth, async (req, res) => {
    try {
        const account = await AccountService.getAccount(req.user.id, 'tiktok', req.params.accountId);
        if (!account) return res.status(404).json({ message: 'TikTok account not found' });

        try {
            await tiktokService.revokeToken(account.accessToken, TT_CLIENT_KEY, TT_CLIENT_SECRET);
        } catch (e) {
            console.warn('[TikTok OAuth] Token revocation failed:', e.message);
        }

        await AccountService.disconnectAccount(req.user.id, account._id);
        res.json({ message: 'TikTok account disconnected successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /videos/:accountId
router.get('/videos/:accountId', auth, async (req, res) => {
    try {
        const account = await AccountService.getAccount(req.user.id, 'tiktok', req.params.accountId);
        if (!account) return res.status(404).json({ message: 'TikTok account not found' });

        const cursor = parseInt(req.query.cursor) || 0;
        const maxCount = parseInt(req.query.limit) || 20;
        const videoData = await tiktokService.getVideoList(account.accessToken, maxCount, cursor);

        res.json({
            videos: videoData.videos || [],
            cursor: videoData.cursor,
            hasMore: videoData.has_more
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /publish/:accountId
router.post('/publish/:accountId', auth, async (req, res) => {
    try {
        const { videoUrl, caption, privacyLevel, disableComment, disableDuet, disableStitch, useInbox } = req.body;
        if (!videoUrl) return res.status(400).json({ message: 'Video URL is required' });

        const account = await AccountService.getAccount(req.user.id, 'tiktok', req.params.accountId);
        if (!account) return res.status(404).json({ message: 'TikTok account not found' });

        let result;
        if (useInbox) {
            result = await tiktokService.initializeInboxVideoUpload(account.accessToken, videoUrl);
        } else {
            result = await tiktokService.initializeVideoUploadFromUrl(account.accessToken, videoUrl, {
                caption: caption || '',
                privacy_level: privacyLevel || 'SELF_ONLY',
                disable_comment: disableComment || false,
                disable_duet: disableDuet || false,
                disable_stitch: disableStitch || false
            });
        }

        res.json({
            message: useInbox ? 'Video sent to TikTok inbox' : 'Video publish initiated',
            publishId: result.publish_id,
            uploadUrl: result.upload_url
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /publish-status/:accountId/:publishId
router.get('/publish-status/:accountId/:publishId', auth, async (req, res) => {
    try {
        const account = await AccountService.getAccount(req.user.id, 'tiktok', req.params.accountId);
        if (!account) return res.status(404).json({ message: 'TikTok account not found' });

        const status = await tiktokService.getPublishStatus(account.accessToken, req.params.publishId);
        res.json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
