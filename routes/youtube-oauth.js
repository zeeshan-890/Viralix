const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const youtubeService = require('../services/youtube');

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

        // Check timestamp (15 min expiry)
        if (Date.now() - parseInt(timestamp) > 15 * 60 * 1000) return null;

        // Verify signature
        const payload = `${userId}.${timestamp}`;
        const expected = crypto.createHmac('sha256', STATE_SECRET).update(payload).digest('hex').slice(0, 16);
        if (signature !== expected) return null;

        return userId;
    } catch {
        return null;
    }
}

// Debug endpoint
router.get('/connect/debug', (req, res) => {
    res.json({
        environment: {
            node_env: process.env.NODE_ENV,
            has_client_id: !!YT_CLIENT_ID,
            has_client_secret: !!YT_CLIENT_SECRET,
            redirect_uri: YT_REDIRECT_URI,
            scopes: youtubeService.YOUTUBE_SCOPES
        }
    });
});

/**
 * GET /connect
 * Generate YouTube OAuth authorization URL
 */
router.get('/connect', auth, async (req, res) => {
    try {
        if (!YT_CLIENT_ID || !YT_CLIENT_SECRET) {
            console.error('[YouTube OAuth] Missing credentials');
            return res.status(500).json({ message: 'YouTube OAuth not configured' });
        }

        const state = generateState(req.user.id);
        const authUrl = youtubeService.generateAuthUrl(YT_CLIENT_ID, YT_REDIRECT_URI, state);

        console.log('[YouTube OAuth] Generated auth URL for user:', req.user.id);
        res.json({ authUrl });
    } catch (error) {
        console.error('[YouTube OAuth] Connect error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * GET /callback
 * Handle OAuth callback from Google
 */
router.get('/callback', async (req, res) => {
    const { code, state, error } = req.query;
    console.log('[YouTube OAuth] Callback received:', { hasCode: !!code, hasState: !!state, error });

    if (error) {
        console.error('[YouTube OAuth] Error from Google:', error);
        return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
        return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=missing_params`);
    }

    try {
        // Verify state and extract userId
        const userId = verifyState(state);
        if (!userId) {
            console.error('[YouTube OAuth] Invalid or expired state');
            return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=invalid_state`);
        }

        const user = await User.findById(userId);
        if (!user) {
            console.error('[YouTube OAuth] User not found:', userId);
            return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=user_not_found`);
        }

        // Exchange code for tokens
        const tokenData = await youtubeService.exchangeCodeForToken(
            code,
            YT_CLIENT_ID,
            YT_CLIENT_SECRET,
            YT_REDIRECT_URI
        );

        // Get channel info
        const channelInfo = await youtubeService.getChannelInfo(tokenData.access_token);

        // Calculate token expiration
        const tokenExpires = new Date(Date.now() + (tokenData.expires_in * 1000));

        // Check if this channel is already connected
        const existingIndex = user.socialAccounts.findIndex(
            acc => acc.platform === 'youtube' && acc.accountId === channelInfo.id
        );

        const accountData = {
            platform: 'youtube',
            accountId: channelInfo.id,
            accountName: channelInfo.title,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpires: tokenExpires,
            isActive: true,
            connectedAt: new Date()
        };

        if (existingIndex >= 0) {
            user.socialAccounts[existingIndex] = {
                ...user.socialAccounts[existingIndex].toObject(),
                ...accountData
            };
            console.log('[YouTube OAuth] Updated existing channel:', accountData.accountName);
        } else {
            user.socialAccounts.push(accountData);
            console.log('[YouTube OAuth] Added new channel:', accountData.accountName);
        }

        await user.save();

        console.log('[YouTube OAuth] Successfully connected:', accountData.accountName);
        res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?success=youtube_connected`);

    } catch (error) {
        console.error('[YouTube OAuth] Callback error:', error);
        res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=${encodeURIComponent(error.message)}`);
    }
});

/**
 * GET /status
 * Get YouTube connection status for current user
 */
router.get('/status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const youtubeAccounts = (user.socialAccounts || [])
            .filter(acc => acc.platform === 'youtube' && acc.isActive)
            .map(acc => ({
                accountId: acc.accountId,
                accountName: acc.accountName,
                connectedAt: acc.connectedAt,
                tokenExpires: acc.tokenExpires
            }));

        res.json({
            connected: youtubeAccounts.length > 0,
            accounts: youtubeAccounts
        });
    } catch (error) {
        console.error('[YouTube OAuth] Status error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * GET /account/:accountId
 * Get detailed info for a YouTube channel
 */
router.get('/account/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const account = (user.socialAccounts || []).find(
            acc => acc.platform === 'youtube' && acc.accountId === req.params.accountId
        );

        if (!account) {
            return res.status(404).json({ message: 'YouTube account not found' });
        }

        // Get fresh channel info
        const channelInfo = await youtubeService.getChannelInfo(account.accessToken);

        res.json({
            accountId: account.accountId,
            accountName: account.accountName,
            connectedAt: account.connectedAt,
            tokenExpires: account.tokenExpires,
            channel: channelInfo
        });
    } catch (error) {
        console.error('[YouTube OAuth] Account error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * DELETE /disconnect/:accountId
 * Disconnect a YouTube channel
 */
router.delete('/disconnect/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const accountIndex = (user.socialAccounts || []).findIndex(
            acc => acc.platform === 'youtube' && acc.accountId === req.params.accountId
        );

        if (accountIndex < 0) {
            return res.status(404).json({ message: 'YouTube account not found' });
        }

        const account = user.socialAccounts[accountIndex];

        // Revoke token
        if (account.accessToken) {
            await youtubeService.revokeToken(account.accessToken);
        }

        // Remove from array
        user.socialAccounts.splice(accountIndex, 1);
        await user.save();

        console.log('[YouTube OAuth] Disconnected:', account.accountName);
        res.json({ message: 'YouTube account disconnected' });
    } catch (error) {
        console.error('[YouTube OAuth] Disconnect error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * POST /refresh/:accountId
 * Refresh access token for a YouTube channel
 */
router.post('/refresh/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const account = (user.socialAccounts || []).find(
            acc => acc.platform === 'youtube' && acc.accountId === req.params.accountId
        );

        if (!account) {
            return res.status(404).json({ message: 'YouTube account not found' });
        }

        if (!account.refreshToken) {
            return res.status(400).json({ message: 'No refresh token available' });
        }

        const tokenData = await youtubeService.refreshAccessToken(
            account.refreshToken,
            YT_CLIENT_ID,
            YT_CLIENT_SECRET
        );

        account.accessToken = tokenData.access_token;
        if (tokenData.refresh_token) {
            account.refreshToken = tokenData.refresh_token;
        }
        account.tokenExpires = new Date(Date.now() + (tokenData.expires_in * 1000));

        user.markModified('socialAccounts');
        await user.save();

        console.log('[YouTube OAuth] Token refreshed for:', account.accountName);
        res.json({ message: 'Token refreshed', tokenExpires: account.tokenExpires });
    } catch (error) {
        console.error('[YouTube OAuth] Refresh error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * GET /videos/:accountId
 * Get user's YouTube videos
 */
router.get('/videos/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const account = (user.socialAccounts || []).find(
            acc => acc.platform === 'youtube' && acc.accountId === req.params.accountId
        );

        if (!account) {
            return res.status(404).json({ message: 'YouTube account not found' });
        }

        const maxResults = parseInt(req.query.maxResults) || 20;
        const videos = await youtubeService.getMyVideos(account.accessToken, maxResults);

        res.json(videos);
    } catch (error) {
        console.error('[YouTube OAuth] Videos error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * POST /publish/:accountId
 * Upload a video to YouTube
 */
router.post('/publish/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const account = (user.socialAccounts || []).find(
            acc => acc.platform === 'youtube' && acc.accountId === req.params.accountId
        );

        if (!account) {
            return res.status(404).json({ message: 'YouTube account not found' });
        }

        const { videoUrl, title, description, tags, privacyStatus, madeForKids } = req.body;

        if (!videoUrl) {
            return res.status(400).json({ message: 'videoUrl is required' });
        }

        const result = await youtubeService.uploadVideo(account.accessToken, videoUrl, {
            title: title || 'Uploaded via Viralix',
            description: description || '',
            tags: tags || [],
            privacyStatus: privacyStatus || 'private',
            madeForKids: madeForKids || false
        });

        console.log('[YouTube OAuth] Video published:', result.videoId);
        res.json(result);
    } catch (error) {
        console.error('[YouTube OAuth] Publish error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
