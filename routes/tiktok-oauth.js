const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');
const tiktokService = require('../services/tiktok');

const router = express.Router();

// TikTok OAuth Configuration
const TT_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TT_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TT_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'http://localhost:5000/api/tiktok-oauth/callback';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Debug flag
const TT_DEBUG = process.env.LOG_OAUTH_VERBOSE === '1';

/**
 * Sign state token with HMAC for CSRF protection
 */
function signState(userId) {
    const payload = `${userId}.${Date.now()}`;
    const signature = crypto
        .createHmac('sha256', TT_CLIENT_SECRET || 'fallback-secret')
        .update(payload)
        .digest('hex')
        .slice(0, 16);
    return `${payload}.${signature}`;
}

/**
 * Verify state token
 */
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

    // Check if state is not too old (30 minutes)
    const stateAge = Date.now() - parseInt(timestamp);
    if (stateAge > 30 * 60 * 1000) return null;

    return userId;
}

/**
 * Step 1: Initiate TikTok OAuth
 * GET /api/tiktok-oauth/connect
 */
router.get('/connect', auth, async (req, res) => {
    try {
        if (!TT_CLIENT_KEY) {
            return res.status(500).json({
                message: 'TikTok integration not configured. Please set TIKTOK_CLIENT_KEY in environment.'
            });
        }

        const state = signState(req.user.id);
        const authUrl = tiktokService.generateAuthUrl(TT_CLIENT_KEY, TT_REDIRECT_URI, state);

        if (TT_DEBUG) {
            console.log('[TikTok OAuth] Auth URL generated for user:', req.user.id);
            console.log('[TikTok OAuth] Redirect URI:', TT_REDIRECT_URI);
        }

        res.json({ authUrl });
    } catch (error) {
        console.error('[TikTok OAuth] Connect error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Debug endpoint for troubleshooting
 * GET /api/tiktok-oauth/connect/debug
 */
router.get('/connect/debug', async (req, res) => {
    res.json({
        environment: {
            node_env: process.env.NODE_ENV,
            has_client_key: !!TT_CLIENT_KEY,
            has_client_secret: !!TT_CLIENT_SECRET,
            redirect_uri: TT_REDIRECT_URI,
            scopes: tiktokService.TIKTOK_SCOPES
        },
        common_issues: [
            'Redirect URI must match exactly in TikTok Developer Portal',
            'App must have Content Posting API product enabled',
            'Scopes must be approved in app settings',
            'App must be in Live mode for production use'
        ]
    });
});

/**
 * Step 2: OAuth Callback
 * GET /api/tiktok-oauth/callback
 */
router.get('/callback', async (req, res) => {
    const { code, state, error, error_description } = req.query;

    console.log('[TikTok OAuth] Callback received:', {
        hasCode: !!code,
        hasState: !!state,
        error: error || null
    });

    // Handle OAuth errors
    if (error) {
        console.error('[TikTok OAuth] Error from TikTok:', error, error_description);
        return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code || !state) {
        console.error('[TikTok OAuth] Missing code or state');
        return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=missing_code_or_state`);
    }

    try {
        // Verify state and extract userId
        const userId = verifyState(state);
        if (!userId) {
            console.error('[TikTok OAuth] Invalid or expired state');
            return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=invalid_state`);
        }

        const user = await User.findById(userId);
        if (!user) {
            console.error('[TikTok OAuth] User not found:', userId);
            return res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=user_not_found`);
        }

        // Exchange code for tokens
        const tokenData = await tiktokService.exchangeCodeForToken(
            code,
            TT_CLIENT_KEY,
            TT_CLIENT_SECRET,
            TT_REDIRECT_URI
        );

        // Get user info (may return null if scope not available)
        const userInfo = await tiktokService.getUserInfo(tokenData.access_token);

        // Calculate token expiration
        const tokenExpires = new Date(Date.now() + (tokenData.expires_in * 1000));

        // Check if this account is already connected
        const existingIndex = user.socialAccounts.findIndex(
            acc => acc.platform === 'tiktok' && acc.accountId === tokenData.open_id
        );

        // Build account name with fallback
        const accountName = userInfo?.display_name || userInfo?.username || `TikTok User ${tokenData.open_id.slice(-8)}`;

        const accountData = {
            platform: 'tiktok',
            accountId: tokenData.open_id,
            accountName: accountName,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpires: tokenExpires,
            isActive: true,
            connectedAt: new Date()
        };

        if (existingIndex >= 0) {
            // Update existing account
            user.socialAccounts[existingIndex] = {
                ...user.socialAccounts[existingIndex].toObject(),
                ...accountData
            };
            console.log('[TikTok OAuth] Updated existing account:', accountData.accountName);
        } else {
            // Add new account
            user.socialAccounts.push(accountData);
            console.log('[TikTok OAuth] Added new account:', accountData.accountName);
        }

        await user.save();

        console.log('[TikTok OAuth] Successfully connected:', accountData.accountName);
        res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?success=tiktok_connected`);

    } catch (error) {
        console.error('[TikTok OAuth] Callback error:', error);
        res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=${encodeURIComponent(error.message)}`);
    }
});

/**
 * Get TikTok connection status
 * GET /api/tiktok-oauth/status
 */
router.get('/status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const tiktokAccounts = user.socialAccounts.filter(
            acc => acc.platform === 'tiktok' && acc.isActive
        );

        // Map to safe response (no tokens)
        const accounts = tiktokAccounts.map(acc => ({
            accountId: acc.accountId,
            accountName: acc.accountName,
            connectedAt: acc.connectedAt,
            tokenExpires: acc.tokenExpires,
            isExpired: acc.tokenExpires && new Date(acc.tokenExpires) < new Date()
        }));

        res.json({
            connected: accounts.length > 0,
            accounts
        });
    } catch (error) {
        console.error('[TikTok OAuth] Status error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Get detailed account info with profile data
 * GET /api/tiktok-oauth/account/:accountId
 */
router.get('/account/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const account = user.socialAccounts.find(
            acc => acc.platform === 'tiktok' && acc.accountId === req.params.accountId
        );

        if (!account) {
            return res.status(404).json({ message: 'TikTok account not found' });
        }

        // Get fresh user info from TikTok
        const userInfo = await tiktokService.getUserInfo(account.accessToken);

        res.json({
            accountId: account.accountId,
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
        console.error('[TikTok OAuth] Get account error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Refresh access token
 * POST /api/tiktok-oauth/refresh/:accountId
 */
router.post('/refresh/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const accountIndex = user.socialAccounts.findIndex(
            acc => acc.platform === 'tiktok' && acc.accountId === req.params.accountId
        );

        if (accountIndex < 0) {
            return res.status(404).json({ message: 'TikTok account not found' });
        }

        const account = user.socialAccounts[accountIndex];

        if (!account.refreshToken) {
            return res.status(400).json({ message: 'No refresh token available. Please reconnect.' });
        }

        // Refresh the token
        const tokenData = await tiktokService.refreshAccessToken(
            account.refreshToken,
            TT_CLIENT_KEY,
            TT_CLIENT_SECRET
        );

        // Update account with new tokens
        user.socialAccounts[accountIndex].accessToken = tokenData.access_token;
        if (tokenData.refresh_token) {
            user.socialAccounts[accountIndex].refreshToken = tokenData.refresh_token;
        }
        user.socialAccounts[accountIndex].tokenExpires = new Date(Date.now() + (tokenData.expires_in * 1000));

        await user.save();

        console.log('[TikTok OAuth] Token refreshed for:', account.accountName);
        res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
        console.error('[TikTok OAuth] Refresh error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Disconnect TikTok account
 * DELETE /api/tiktok-oauth/disconnect/:accountId
 */
router.delete('/disconnect/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const accountIndex = user.socialAccounts.findIndex(
            acc => acc.platform === 'tiktok' && acc.accountId === req.params.accountId
        );

        if (accountIndex < 0) {
            return res.status(404).json({ message: 'TikTok account not found' });
        }

        const account = user.socialAccounts[accountIndex];

        // Try to revoke token on TikTok's side
        try {
            await tiktokService.revokeToken(account.accessToken, TT_CLIENT_KEY, TT_CLIENT_SECRET);
        } catch (revokeError) {
            console.warn('[TikTok OAuth] Token revocation failed, continuing with local removal');
        }

        // Remove from user's accounts
        user.socialAccounts.splice(accountIndex, 1);
        await user.save();

        console.log('[TikTok OAuth] Account disconnected:', account.accountName);
        res.json({ message: 'TikTok account disconnected successfully' });
    } catch (error) {
        console.error('[TikTok OAuth] Disconnect error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Get user's TikTok videos (for analytics)
 * GET /api/tiktok-oauth/videos/:accountId
 */
router.get('/videos/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const account = user.socialAccounts.find(
            acc => acc.platform === 'tiktok' && acc.accountId === req.params.accountId
        );

        if (!account) {
            return res.status(404).json({ message: 'TikTok account not found' });
        }

        const cursor = parseInt(req.query.cursor) || 0;
        const maxCount = parseInt(req.query.limit) || 20;

        const videoData = await tiktokService.getVideoList(account.accessToken, maxCount, cursor);

        res.json({
            videos: videoData.videos || [],
            cursor: videoData.cursor,
            hasMore: videoData.has_more
        });
    } catch (error) {
        console.error('[TikTok OAuth] Get videos error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Publish video to TikTok
 * POST /api/tiktok-oauth/publish/:accountId
 */
router.post('/publish/:accountId', auth, async (req, res) => {
    try {
        const { videoUrl, caption, privacyLevel, disableComment, disableDuet, disableStitch, useInbox } = req.body;

        if (!videoUrl) {
            return res.status(400).json({ message: 'Video URL is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const account = user.socialAccounts.find(
            acc => acc.platform === 'tiktok' && acc.accountId === req.params.accountId
        );

        if (!account) {
            return res.status(404).json({ message: 'TikTok account not found' });
        }

        let result;

        if (useInbox) {
            // Send to user's TikTok inbox for manual posting
            result = await tiktokService.initializeInboxVideoUpload(account.accessToken, videoUrl);
        } else {
            // Direct publish with settings
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
            uploadUrl: result.upload_url // Only for FILE_UPLOAD method
        });
    } catch (error) {
        console.error('[TikTok OAuth] Publish error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Check publish status
 * GET /api/tiktok-oauth/publish-status/:accountId/:publishId
 */
router.get('/publish-status/:accountId/:publishId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const account = user.socialAccounts.find(
            acc => acc.platform === 'tiktok' && acc.accountId === req.params.accountId
        );

        if (!account) {
            return res.status(404).json({ message: 'TikTok account not found' });
        }

        const status = await tiktokService.getPublishStatus(account.accessToken, req.params.publishId);

        res.json(status);
    } catch (error) {
        console.error('[TikTok OAuth] Publish status error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
