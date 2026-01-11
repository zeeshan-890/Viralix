const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const youtubeService = require('../services/youtube');
const AccountService = require('../services/account.service');

const router = express.Router();

// Environment variables
const YT_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YT_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YT_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5000/api/youtube-oauth/callback';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const STATE_SECRET = process.env.JWT_SECRET || 'youtube-state-secret';

// State token helpers
function generateState(userId) {
    const timestamp = Date.now();
    const payload = `${userId}.${timestamp}`;
    const signature = crypto.createHmac('sha256', STATE_SECRET).update(payload).digest('hex').slice(0, 16);
    return `${payload}.${signature}`;
}

function verifyState(state) {
    try {
        const parts = state.split('.');
        if (parts.length !== 3) return null;
        const [userId, timestamp, signature] = parts;
        if (Date.now() - parseInt(timestamp) > 15 * 60 * 1000) return null;
        const payload = `${userId}.${timestamp}`;
        const expected = crypto.createHmac('sha256', STATE_SECRET).update(payload).digest('hex').slice(0, 16);
        if (signature !== expected) return null;
        return userId;
    } catch {
        return null;
    }
}

// GET /connect
router.get('/connect', auth, async (req, res) => {
    try {
        if (!YT_CLIENT_ID || !YT_CLIENT_SECRET) {
            return res.status(500).json({ message: 'YouTube OAuth not configured' });
        }
        const state = generateState(req.user.id);
        const authUrl = youtubeService.generateAuthUrl(YT_CLIENT_ID, YT_REDIRECT_URI, state);
        res.json({ authUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /callback
router.get('/callback', async (req, res) => {
    const { code, state, error } = req.query;
    if (error) return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=${encodeURIComponent(error)}`);
    if (!code || !state) return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=missing_params`);

    try {
        const userId = verifyState(state);
        if (!userId) return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=invalid_state`);

        const tokenData = await youtubeService.exchangeCodeForToken(code, YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REDIRECT_URI);
        const channelInfo = await youtubeService.getChannelInfo(tokenData.access_token);
        const tokenExpires = new Date(Date.now() + (tokenData.expires_in * 1000));

        await AccountService.connectAccount(userId, {
            platform: 'youtube',
            accountId: channelInfo.id,
            name: channelInfo.title,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expires: tokenExpires,
            metadata: {
                thumbnailUrl: channelInfo.thumbnails?.default?.url,
                customUrl: channelInfo.customUrl
            }
        });

        res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?success=youtube_connected`);
    } catch (error) {
        console.error('[YouTube OAuth] Callback error:', error);
        res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=${encodeURIComponent(error.message)}`);
    }
});

// GET /status
router.get('/status', auth, async (req, res) => {
    try {
        const accounts = await AccountService.getAccounts(req.user.id);
        const youtubeAccounts = accounts.filter(acc => acc.platform === 'youtube');

        res.json({
            connected: youtubeAccounts.length > 0,
            accounts: youtubeAccounts.map(acc => ({
                accountId: acc.platformAccountId,
                accountName: acc.accountName,
                connectedAt: acc.connectedAt,
                tokenExpires: acc.tokenExpires
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /account/:accountId
router.get('/account/:accountId', auth, async (req, res) => {
    try {
        const account = await AccountService.getAccount(req.user.id, 'youtube', req.params.accountId);
        if (!account) return res.status(404).json({ message: 'YouTube account not found' });

        const channelInfo = await youtubeService.getChannelInfo(account.accessToken);
        res.json({
            accountId: account.platformAccountId,
            accountName: account.accountName,
            connectedAt: account.connectedAt,
            tokenExpires: account.tokenExpires,
            channel: channelInfo
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /disconnect/:accountId
router.delete('/disconnect/:accountId', auth, async (req, res) => {
    try {
        const account = await AccountService.getAccount(req.user.id, 'youtube', req.params.accountId);
        if (!account) return res.status(404).json({ message: 'YouTube account not found' });

        if (account.accessToken) {
            await youtubeService.revokeToken(account.accessToken);
        }

        await AccountService.disconnectAccount(req.user.id, account._id);
        res.json({ message: 'YouTube account disconnected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /refresh/:accountId
router.post('/refresh/:accountId', auth, async (req, res) => {
    try {
        const account = await AccountService.getAccount(req.user.id, 'youtube', req.params.accountId);
        if (!account) return res.status(404).json({ message: 'YouTube account not found' });
        if (!account.refreshToken) return res.status(400).json({ message: 'No refresh token available' });

        const tokenData = await youtubeService.refreshAccessToken(account.refreshToken, YT_CLIENT_ID, YT_CLIENT_SECRET);

        await AccountService.connectAccount(req.user.id, {
            platform: 'youtube',
            accountId: account.platformAccountId,
            name: account.accountName,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expires: new Date(Date.now() + (tokenData.expires_in * 1000)),
            metadata: account.metadata
        });

        res.json({ message: 'Token refreshed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /videos/:accountId
router.get('/videos/:accountId', auth, async (req, res) => {
    try {
        const account = await AccountService.getAccount(req.user.id, 'youtube', req.params.accountId);
        if (!account) return res.status(404).json({ message: 'YouTube account not found' });

        const maxResults = parseInt(req.query.maxResults) || 20;
        const videos = await youtubeService.getMyVideos(account.accessToken, maxResults);
        res.json(videos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /publish/:accountId
router.post('/publish/:accountId', auth, async (req, res) => {
    try {
        const account = await AccountService.getAccount(req.user.id, 'youtube', req.params.accountId);
        if (!account) return res.status(404).json({ message: 'YouTube account not found' });

        const { videoUrl, title, description, tags, privacyStatus, madeForKids } = req.body;
        if (!videoUrl) return res.status(400).json({ message: 'videoUrl is required' });

        const result = await youtubeService.uploadVideo(account.accessToken, videoUrl, {
            title: title || 'Uploaded via Viralix',
            description: description || '',
            tags: tags || [],
            privacyStatus: privacyStatus || 'private',
            madeForKids: madeForKids || false
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
