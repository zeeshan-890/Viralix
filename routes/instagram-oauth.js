const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User'); // Still needed for middleware? Auth middleware attaches req.user
const AccountService = require('../services/account.service');

const router = express.Router();

// Instagram App Credentials
const IG_APP_ID = process.env.INSTAGRAM_APP_ID || '1494528788268258';
const IG_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const IG_REDIRECT_URI = process.env.NODE_ENV === 'production'
    ? (process.env.INSTAGRAM_REDIRECT_URI || 'https://viralix-b3ff86cb412f.herokuapp.com/api/instagram-oauth/callback')
    : 'http://localhost:5000/api/instagram-oauth/callback';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const INSTAGRAM_OAUTH_URL = 'https://www.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

function signState(userId) {
    if (!IG_APP_SECRET) throw new Error('INSTAGRAM_APP_SECRET is not configured');
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(8).toString('hex');
    const data = `${userId}.${timestamp}.${nonce}`;
    const signature = crypto.createHmac('sha256', IG_APP_SECRET).update(data).digest('hex');
    return `${data}.${signature}`;
}

function verifyState(state) {
    if (!IG_APP_SECRET) throw new Error('INSTAGRAM_APP_SECRET is not configured');
    const parts = state.split('.');
    if (parts.length !== 4) throw new Error('Invalid state format');
    const [userId, timestamp, nonce, signature] = parts;
    const data = `${userId}.${timestamp}.${nonce}`;
    const expectedSig = crypto.createHmac('sha256', IG_APP_SECRET).update(data).digest('hex');
    if (signature !== expectedSig) throw new Error('Invalid state signature');
    if (Date.now() - parseInt(timestamp, 10) > 600000) throw new Error('State expired');
    return userId;
}

// GET /connect
router.get('/connect', auth, async (req, res) => {
    try {
        const state = signState(req.user.id);
        const authUrl = `${INSTAGRAM_OAUTH_URL}?` + new URLSearchParams({
            client_id: IG_APP_ID,
            redirect_uri: IG_REDIRECT_URI,
            scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments',
            response_type: 'code',
            state: state
        });
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

        // Exchange code
        const formData = new URLSearchParams({
            client_id: IG_APP_ID,
            client_secret: IG_APP_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: IG_REDIRECT_URI,
            code: code
        });
        const tokenResponse = await axios.post(INSTAGRAM_TOKEN_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // Parse token
        let shortLivedToken = tokenResponse.data.access_token;
        let igUserId = tokenResponse.data.user_id;

        if (!shortLivedToken && Array.isArray(tokenResponse.data.data) && tokenResponse.data.data.length > 0) {
            shortLivedToken = tokenResponse.data.data[0].access_token;
            igUserId = tokenResponse.data.data[0].user_id;
        }

        if (!shortLivedToken || !igUserId) throw new Error('Failed to parse token from response');

        // Exchange for long-lived
        let longLivedToken = shortLivedToken;
        let tokenExpiry = new Date(Date.now() + (3600 * 1000));

        try {
            const longLivedResponse = await axios.get(`${INSTAGRAM_GRAPH_URL}/access_token`, {
                params: {
                    grant_type: 'ig_exchange_token',
                    client_secret: IG_APP_SECRET,
                    access_token: shortLivedToken
                }
            });
            if (longLivedResponse.data.access_token && longLivedResponse.data.expires_in) {
                longLivedToken = longLivedResponse.data.access_token;
                tokenExpiry = new Date(Date.now() + longLivedResponse.data.expires_in * 1000);
            }
        } catch (e) {
            console.warn('Long-lived token exchange failed, using short-lived');
        }

        // Get details
        let profile = {};
        try {
            const profileRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/${igUserId}`, {
                params: {
                    fields: 'id,username,account_type,media_count,followers_count,follows_count,profile_picture_url,name',
                    access_token: longLivedToken
                }
            });
            profile = profileRes.data;
        } catch (e) {
            console.warn('Profile fetch failed');
            profile = { username: igUserId };
        }

        await AccountService.connectAccount(userId, {
            platform: 'instagram',
            accountId: igUserId,
            name: profile.username || String(igUserId),
            accessToken: longLivedToken,
            expires: tokenExpiry,
            metadata: {
                username: profile.username,
                name: profile.name,
                profilePicture: profile.profile_picture_url,
                accountType: profile.account_type,
                followersCount: profile.followers_count,
                followsCount: profile.follows_count,
                mediaCount: profile.media_count
            }
        });

        res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?success=instagram_connected&username=${profile.username}`);
    } catch (error) {
        console.error('Instagram callback error:', error);
        res.redirect(`${CLIENT_URL}/dashboard/connect-accounts?error=${encodeURIComponent(error.message)}`);
    }
});

// GET /status
router.get('/status', auth, async (req, res) => {
    try {
        const accounts = await AccountService.getAccounts(req.user.id);
        const igAccounts = accounts.filter(acc => acc.platform === 'instagram');
        res.json({
            connected: igAccounts.length > 0,
            accounts: igAccounts.map(acc => ({
                accountId: acc.platformAccountId,
                username: acc.metadata?.username || acc.accountName,
                accountType: acc.metadata?.accountType || 'BUSINESS',
                connectedAt: acc.connectedAt,
                tokenExpiry: acc.tokenExpires,
                profilePicture: acc.metadata?.profilePicture,
                name: acc.metadata?.name
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /disconnect/:accountId
router.delete('/disconnect/:accountId', auth, async (req, res) => {
    try {
        const account = await AccountService.getAccount(req.user.id, 'instagram', req.params.accountId);
        if (account) {
            await AccountService.disconnectAccount(req.user.id, account._id);
        }
        res.json({ message: 'Instagram account disconnected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
