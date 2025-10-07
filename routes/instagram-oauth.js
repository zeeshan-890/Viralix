const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Instagram App Credentials from environment
const IG_APP_ID = process.env.INSTAGRAM_APP_ID || '1494528788268258'; // fallback for local dev
const IG_APP_SECRET = process.env.INSTAGRAM_APP_SECRET; // MUST be set in .env
const IG_REDIRECT_URI = process.env.NODE_ENV === 'production'
    ? (process.env.INSTAGRAM_REDIRECT_URI || 'https://viralix-b3ff86cb412f.herokuapp.com/api/instagram-oauth/callback')
    : 'http://localhost:5000/api/instagram-oauth/callback';

// Instagram Business Login OAuth endpoints
const INSTAGRAM_OAUTH_URL = 'https://www.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

// Debug flag (set LOG_OAUTH_VERBOSE=1 to enable verbose logging)
const IG_OAUTH_DEBUG = process.env.LOG_OAUTH_VERBOSE === '1';

// Sign state token with HMAC
function signState(userId) {
    if (!IG_APP_SECRET) {
        throw new Error('INSTAGRAM_APP_SECRET is not configured');
    }
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(8).toString('hex');
    const data = `${userId}.${timestamp}.${nonce}`;
    const signature = crypto.createHmac('sha256', IG_APP_SECRET).update(data).digest('hex');
    return `${data}.${signature}`;
}

// Verify state token
function verifyState(state) {
    if (!IG_APP_SECRET) {
        throw new Error('INSTAGRAM_APP_SECRET is not configured');
    }
    const parts = state.split('.');
    if (parts.length !== 4) throw new Error('Invalid state format');

    const [userId, timestamp, nonce, signature] = parts;
    const data = `${userId}.${timestamp}.${nonce}`;
    const expectedSig = crypto.createHmac('sha256', IG_APP_SECRET).update(data).digest('hex');

    if (signature !== expectedSig) throw new Error('Invalid state signature');

    // Check if token is not older than 10 minutes
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 600000) throw new Error('State expired');

    return userId;
}

/**
 * Step 1: Initiate Instagram Business Login OAuth
 * GET /api/instagram-oauth/connect
 */
router.get('/connect', auth, async (req, res) => {
    try {
        const state = signState(req.user.id);

        // Instagram Business Login OAuth with new scope values
        const authUrl = `${INSTAGRAM_OAUTH_URL}?` + new URLSearchParams({
            client_id: IG_APP_ID,
            redirect_uri: IG_REDIRECT_URI,
            scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments',
            response_type: 'code',
            state: state
        });

        if (IG_OAUTH_DEBUG || req.query.debug === '1') {
            console.log('[IG Business Login][DEBUG] Constructed parameters:', {
                client_id: IG_APP_ID,
                has_secret: !!IG_APP_SECRET,
                redirect_uri: IG_REDIRECT_URI,
                scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments',
                response_type: 'code',
                state_sample: state.split('.').slice(0, 3).join('.') + '.<sig>'
            });
        } else {
            console.log('[IG Business Login] Auth URL generated');
        }

        // If debug query param provided, return detailed JSON instead of just URL
        if (req.query.debug === '1') {
            return res.json({
                message: 'Debug info for Instagram Business Login connect',
                authUrl,
                params: {
                    client_id: IG_APP_ID,
                    redirect_uri: IG_REDIRECT_URI,
                    scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments',
                    response_type: 'code',
                    state
                },
                troubleshooting: {
                    ensure_redirect_uri_matches_dashboard: IG_REDIRECT_URI,
                    dashboard_path: 'App Dashboard > Instagram > API setup with Instagram login > Business login settings > OAuth redirect URIs',
                    note: 'Redirect URI must match exactly (scheme, host, port, path, trailing slash)'
                }
            });
        }

        res.json({ authUrl });
    } catch (error) {
        console.error('Instagram Business Login initiation error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Explicit debug endpoint (no auth to allow front-end pre-check; still safe as it does not expose secrets)
router.get('/connect/debug', async (req, res) => {
    try {
        const sampleState = 'debug.' + Date.now() + '.xxxxxxxx.' + (IG_APP_SECRET ? 'sig_present' : 'no_secret');
        res.json({
            environment: {
                node_env: process.env.NODE_ENV,
                has_instagram_app_id: !!IG_APP_ID,
                instagram_app_id: IG_APP_ID,
                has_instagram_secret: !!IG_APP_SECRET,
                redirect_uri: IG_REDIRECT_URI
            },
            oauth: {
                authorize_base: INSTAGRAM_OAUTH_URL,
                token_url: INSTAGRAM_TOKEN_URL,
                graph_base: INSTAGRAM_GRAPH_URL,
                scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments'
            },
            sample_authorize_url: `${INSTAGRAM_OAUTH_URL}?client_id=${encodeURIComponent(IG_APP_ID)}&redirect_uri=${encodeURIComponent(IG_REDIRECT_URI)}&scope=${encodeURIComponent('instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments')}&response_type=code&state=${encodeURIComponent(sampleState)}`,
            common_issues: [
                'Redirect URI mismatch (most common). Must match EXACT entry in dashboard.',
                'Using Meta App ID instead of Instagram App ID for Business Login.',
                'Trailing slash difference in redirect URI.',
                'HTTP vs HTTPS mismatch.',
                'Not added product: Instagram > API setup with Instagram login in App Dashboard.',
                'Scopes not enabled / not granted (less likely for initial redirect).'
            ]
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Active authorize URL checker - attempts request to Instagram and reports status (diagnostic only)
router.get('/authorize/check', async (req, res) => {
    const testState = 'diag.' + Date.now();
    const scope = 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments';
    const url = `${INSTAGRAM_OAUTH_URL}?client_id=${encodeURIComponent(IG_APP_ID)}&redirect_uri=${encodeURIComponent(IG_REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${encodeURIComponent(testState)}`;
    try {
        const response = await axios.get(url, {
            // We want to SEE redirects, but axios follows them automatically; emulate by disallowing
            maxRedirects: 0,
            validateStatus: () => true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Diagnostic Check)'
            }
        });

        const limitedBody = (response.data && typeof response.data === 'string') ? response.data.slice(0, 500) : undefined;

        res.json({
            tested_url: url,
            status: response.status,
            location_header: response.headers?.location,
            note: response.status === 302 ? '302 indicates redirect to login/consent (GOOD). If you are seeing an error in browser but 302 here, issue may be browser cache or dashboard mismatch).' : (response.status === 400 ? '400 usually indicates parameter issue (likely redirect_uri mismatch or invalid scope).' : 'Review status.'),
            snippet: limitedBody,
            headers: {
                'cache-control': response.headers['cache-control'],
                'content-type': response.headers['content-type']
            }
        });
    } catch (err) {
        res.status(500).json({
            message: 'Authorize check failed',
            error: err.response?.data || err.message
        });
    }
});

/**
 * Step 2: OAuth Callback (public route - no auth middleware)
 * GET /api/instagram-oauth/callback
 */
router.get('/callback', async (req, res) => {
    const { code, state, error, error_reason, error_description } = req.query;

    // Log callback for debugging
    console.log('[IG Business Login] Callback received:', {
        hasCode: !!code,
        hasState: !!state,
        error: error || 'none',
        timestamp: new Date().toISOString()
    });

    // Handle OAuth errors
    if (error) {
        console.error('Instagram Business Login error:', error, error_reason, error_description);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/connect-accounts?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code || !state) {
        console.error('[IG Business Login] Missing code or state');
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/connect-accounts?error=missing_code_or_state`);
    }

    try {
        // Verify state and extract userId
        const userId = verifyState(state);
        const user = await User.findById(userId);
        if (!user) {
            console.error('[IG Business Login] User not found:', userId);
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/connect-accounts?error=user_not_found`);
        }

        console.log('[IG Business Login] Exchanging code for access token for user:', user.email);

        // Step 2: Exchange authorization code for short-lived access token
        if (!IG_APP_SECRET) {
            throw new Error('Server missing INSTAGRAM_APP_SECRET');
        }

        const formData = new URLSearchParams({
            client_id: IG_APP_ID,
            client_secret: IG_APP_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: IG_REDIRECT_URI,
            code: code
        });

        let tokenResponse;
        try {
            tokenResponse = await axios.post(INSTAGRAM_TOKEN_URL, formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
        } catch (tokenErr) {
            const raw = tokenErr.response?.data || tokenErr.message;
            console.error('[IG Business Login] Token exchange failed:', raw);
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/connect-accounts?error=${encodeURIComponent('token_exchange_failed')}`);
        }

        console.log('[IG Business Login] Raw token response:', tokenResponse.data);

        // Response can be either flat { access_token, user_id } OR { data: [ { access_token, user_id, permissions } ] }
        let shortLivedToken = tokenResponse.data.access_token;
        let igUserId = tokenResponse.data.user_id;
        let permissions = tokenResponse.data.permissions;

        if (!shortLivedToken && Array.isArray(tokenResponse.data.data) && tokenResponse.data.data.length) {
            const first = tokenResponse.data.data[0];
            shortLivedToken = first.access_token;
            igUserId = first.user_id;
            permissions = first.permissions;
        }

        if (!shortLivedToken || !igUserId) {
            throw new Error('Failed to parse short-lived token or user id from response');
        }

        console.log('[IG Business Login] Got short-lived token, exchanging for long-lived token...');

        // Step 3: Exchange short-lived token for long-lived token (valid for 60 days)
        let longLivedResponse;
        try {
            longLivedResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/access_token`, {
                params: {
                    grant_type: 'ig_exchange_token',
                    client_secret: IG_APP_SECRET,
                    access_token: shortLivedToken
                }
            });
        } catch (llErr) {
            console.error('[IG Business Login] Long-lived token exchange failed:', llErr.response?.data || llErr.message);
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/connect-accounts?error=${encodeURIComponent('long_lived_token_failed')}`);
        }

        console.log('[IG Business Login] Long-lived token response:', longLivedResponse.data);

        const { access_token: longLivedToken, expires_in } = longLivedResponse.data;
        const tokenExpiry = new Date(Date.now() + expires_in * 1000);

        // Get Instagram account details
        console.log('[IG Business Login] Fetching account details...');
        let profileResponse;
        try {
            profileResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${igUserId}`, {
                params: {
                    // 'name' & 'profile_picture_url' may not always be returned; handle gracefully
                    fields: 'id,username,account_type,media_count,followers_count,follows_count,profile_picture_url,name',
                    access_token: longLivedToken
                }
            });
        } catch (pErr) {
            console.error('[IG Business Login] Profile fetch failed:', pErr.response?.data || pErr.message);
            // Attempt minimal fallback (only id/username)
            profileResponse = { data: { id: igUserId, username: igUserId, account_type: 'BUSINESS' } };
        }

        console.log('[IG Business Login] Profile response:', profileResponse.data);

        const profile = profileResponse.data;

        // Save Instagram account to user's socialAccounts
        user.socialAccounts = user.socialAccounts || [];

        const existingIndex = user.socialAccounts.findIndex(acc =>
            acc.platform === 'instagram' && acc.accountId === igUserId
        );

        const instagramAccountData = {
            platform: 'instagram',
            accountId: igUserId,
            accountName: profile.username || String(igUserId), // Required by User schema
            accessToken: longLivedToken,
            tokenExpires: tokenExpiry, // Match schema field name
            isActive: true,
            connectedAt: new Date(),
            // Extra fields (not in base schema but stored in MongoDB)
            username: profile.username || String(igUserId),
            name: profile.name || profile.username || null,
            profilePicture: profile.profile_picture_url || null,
            accountType: profile.account_type || 'BUSINESS',
            followersCount: profile.followers_count || null,
            followsCount: profile.follows_count || null,
            mediaCount: profile.media_count || null,
            permissions: permissions
        };

        if (existingIndex >= 0) {
            user.socialAccounts[existingIndex] = instagramAccountData;
            console.log('[IG Business Login] Updated existing account');
        } else {
            user.socialAccounts.push(instagramAccountData);
            console.log('[IG Business Login] Added new account');
        }

        user.markModified('socialAccounts');
        await user.save();

        console.log('[IG Business Login] Account saved successfully');

        // Redirect to success page
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/connect-accounts?success=instagram_connected&username=${profile.username}`);
    } catch (error) {
        console.error('Instagram Business Login callback error:', error.response?.data || error.message);
        const errorMsg = error.response?.data?.error_message || error.response?.data?.error?.message || error.message;
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/connect-accounts?error=${encodeURIComponent(errorMsg)}`);
    }
});

/**
 * Manual token exchange (recovery endpoint for when callback was blocked)
 * POST /api/instagram-oauth/exchange-code
 * Body: { code, state }
 */
router.post('/exchange-code', auth, async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ message: 'Authorization code is required' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('[IG Business Login][Manual] Exchanging code for user:', user.email);

        if (!IG_APP_SECRET) {
            throw new Error('Server missing INSTAGRAM_APP_SECRET');
        }

        const formData = new URLSearchParams({
            client_id: IG_APP_ID,
            client_secret: IG_APP_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: IG_REDIRECT_URI,
            code: code
        });

        let tokenResponse;
        try {
            tokenResponse = await axios.post(INSTAGRAM_TOKEN_URL, formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
        } catch (tokenErr) {
            const raw = tokenErr.response?.data || tokenErr.message;
            console.error('[IG Business Login][Manual] Token exchange failed:', raw);
            return res.status(400).json({ message: 'Token exchange failed', error: raw });
        }

        console.log('[IG Business Login][Manual] Token response:', tokenResponse.data);

        let shortLivedToken = tokenResponse.data.access_token;
        let igUserId = tokenResponse.data.user_id;
        let permissions = tokenResponse.data.permissions;

        if (!shortLivedToken && Array.isArray(tokenResponse.data.data) && tokenResponse.data.data.length) {
            const first = tokenResponse.data.data[0];
            shortLivedToken = first.access_token;
            igUserId = first.user_id;
            permissions = first.permissions;
        }

        if (!shortLivedToken || !igUserId) {
            throw new Error('Failed to parse short-lived token or user id from response');
        }

        console.log('[IG Business Login][Manual] Exchanging for long-lived token...');

        let longLivedResponse;
        try {
            longLivedResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/access_token`, {
                params: {
                    grant_type: 'ig_exchange_token',
                    client_secret: IG_APP_SECRET,
                    access_token: shortLivedToken
                }
            });
        } catch (llErr) {
            console.error('[IG Business Login][Manual] Long-lived token exchange failed:', llErr.response?.data || llErr.message);
            return res.status(400).json({ message: 'Long-lived token exchange failed', error: llErr.response?.data });
        }

        const { access_token: longLivedToken, expires_in } = longLivedResponse.data;
        const tokenExpiry = new Date(Date.now() + expires_in * 1000);

        console.log('[IG Business Login][Manual] Fetching profile...');
        let profileResponse;
        try {
            profileResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${igUserId}`, {
                params: {
                    fields: 'id,username,account_type,media_count,followers_count,follows_count,profile_picture_url,name',
                    access_token: longLivedToken
                }
            });
        } catch (pErr) {
            console.error('[IG Business Login][Manual] Profile fetch failed:', pErr.response?.data || pErr.message);
            profileResponse = { data: { id: igUserId, username: igUserId, account_type: 'BUSINESS' } };
        }

        const profile = profileResponse.data;

        user.socialAccounts = user.socialAccounts || [];

        const existingIndex = user.socialAccounts.findIndex(acc =>
            acc.platform === 'instagram' && acc.accountId === igUserId
        );

        const instagramAccountData = {
            platform: 'instagram',
            accountId: igUserId,
            accountName: profile.username || String(igUserId), // Required by User schema
            accessToken: longLivedToken,
            tokenExpires: tokenExpiry, // Match schema field name
            isActive: true,
            connectedAt: new Date(),
            // Extra fields (not in base schema but stored in MongoDB)
            username: profile.username || String(igUserId),
            name: profile.name || profile.username || null,
            profilePicture: profile.profile_picture_url || null,
            accountType: profile.account_type || 'BUSINESS',
            followersCount: profile.followers_count || null,
            followsCount: profile.follows_count || null,
            mediaCount: profile.media_count || null,
            permissions: permissions
        };

        if (existingIndex >= 0) {
            user.socialAccounts[existingIndex] = instagramAccountData;
            console.log('[IG Business Login][Manual] Updated existing account');
        } else {
            user.socialAccounts.push(instagramAccountData);
            console.log('[IG Business Login][Manual] Added new account');
        }

        user.markModified('socialAccounts');
        await user.save();

        console.log('[IG Business Login][Manual] Account saved successfully');

        res.json({
            success: true,
            message: 'Instagram account connected successfully',
            account: {
                username: profile.username,
                accountType: profile.account_type,
                connectedAt: instagramAccountData.connectedAt
            }
        });
    } catch (error) {
        console.error('[IG Business Login][Manual] Error:', error.response?.data || error.message);
        res.status(500).json({
            message: error.response?.data?.error_message || error.response?.data?.error?.message || error.message
        });
    }
});

/**
 * Get Instagram account status
 * GET /api/instagram-oauth/status
 */
router.get('/status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const igAccounts = (user.socialAccounts || []).filter(acc =>
            acc.platform === 'instagram' && acc.isActive !== false
        );

        console.log('[IG Status] Found', igAccounts.length, 'Instagram accounts for user:', user.email);

        res.json({
            connected: igAccounts.length > 0,
            accounts: igAccounts.map(acc => ({
                accountId: acc.accountId,
                username: acc.accountName || acc.username, // accountName is schema field, username is extra
                accountType: acc.accountType || 'BUSINESS',
                connectedAt: acc.connectedAt,
                tokenExpiry: acc.tokenExpires, // Match schema field name
                profilePicture: acc.profilePicture,
                name: acc.name
            }))
        });
    } catch (error) {
        console.error('Instagram status error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Disconnect Instagram account
 * DELETE /api/instagram-oauth/disconnect/:accountId
 */
router.delete('/disconnect/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.socialAccounts = (user.socialAccounts || []).filter(acc =>
            !(acc.platform === 'instagram' && acc.accountId === req.params.accountId)
        );

        user.markModified('socialAccounts');
        await user.save();

        res.json({ message: 'Instagram account disconnected' });
    } catch (error) {
        console.error('Instagram disconnect error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * Get user profile
 * GET /api/instagram-oauth/profile/:accountId
 */
router.get('/profile/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const igAccount = (user.socialAccounts || []).find(acc =>
            acc.platform === 'instagram' && acc.accountId === req.params.accountId
        );

        if (!igAccount) {
            return res.status(404).json({ message: 'Instagram account not found' });
        }

        // Refresh token if needed (within 7 days of expiry)
        const daysUntilExpiry = (new Date(igAccount.tokenExpiry) - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry < 7) {
            try {
                const refreshResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/refresh_access_token`, {
                    params: {
                        grant_type: 'ig_refresh_token',
                        access_token: igAccount.accessToken
                    }
                });

                igAccount.accessToken = refreshResponse.data.access_token;
                igAccount.tokenExpiry = new Date(Date.now() + refreshResponse.data.expires_in * 1000);
                user.markModified('socialAccounts');
                await user.save();
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
            }
        }

        const profileResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${req.params.accountId}`, {
            params: {
                fields: 'id,username,account_type,media_count',
                access_token: igAccount.accessToken
            }
        });

        res.json({ profile: profileResponse.data });
    } catch (error) {
        console.error('Instagram profile error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: error.response?.data?.error?.message || error.message
        });
    }
});

/**
 * Get user's media
 * GET /api/instagram-oauth/media/:accountId
 */
router.get('/media/:accountId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const igAccount = (user.socialAccounts || []).find(acc =>
            acc.platform === 'instagram' && acc.accountId === req.params.accountId
        );

        if (!igAccount) {
            return res.status(404).json({ message: 'Instagram account not found' });
        }

        const limit = Math.min(parseInt(req.query.limit || '25', 10), 100);

        const mediaResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/${req.params.accountId}/media`, {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username',
                limit: limit,
                access_token: igAccount.accessToken
            }
        });

        res.json({ media: mediaResponse.data.data || [] });
    } catch (error) {
        console.error('Instagram media error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: error.response?.data?.error?.message || error.message
        });
    }
});

module.exports = router;
