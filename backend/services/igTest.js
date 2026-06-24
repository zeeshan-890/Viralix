const axios = require('axios');
const crypto = require('crypto');

// Isolated Instagram Publishing Test service.
// Uses pure "Instagram API with Instagram Login" (graph.instagram.com /
// api.instagram.com) — no Facebook Pages. Credentials are dedicated to this
// sandbox and never shared with the main Instagram integration.

const IG_TEST_APP_ID = process.env.IG_TEST_APP_ID;
const IG_TEST_APP_SECRET = process.env.IG_TEST_APP_SECRET;
const IG_TEST_REDIRECT_URI = process.env.IG_TEST_REDIRECT_URI;
const GRAPH_VERSION = process.env.IG_TEST_GRAPH_VERSION || 'v21.0';

const OAUTH_AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize';
const OAUTH_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const GRAPH_BASE = 'https://graph.instagram.com';

const SCOPES = 'instagram_business_basic,instagram_business_content_publish';

function buildGraphUrl(path) {
    return `${GRAPH_BASE}/${GRAPH_VERSION}${path}`;
}

// ─── Signed OAuth state (CSRF protection, carries userId) ───

function signState(userId) {
    if (!IG_TEST_APP_SECRET) throw new Error('IG_TEST_APP_SECRET is not configured');
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(8).toString('hex');
    const data = `${userId}.${timestamp}.${nonce}`;
    const signature = crypto.createHmac('sha256', IG_TEST_APP_SECRET).update(data).digest('hex');
    return `${data}.${signature}`;
}

function verifyState(state) {
    if (!IG_TEST_APP_SECRET) throw new Error('IG_TEST_APP_SECRET is not configured');
    const parts = String(state || '').split('.');
    if (parts.length !== 4) throw new Error('Invalid state format');
    const [userId, timestamp, nonce, signature] = parts;
    const data = `${userId}.${timestamp}.${nonce}`;
    const expectedSig = crypto.createHmac('sha256', IG_TEST_APP_SECRET).update(data).digest('hex');
    if (signature !== expectedSig) throw new Error('Invalid state signature');
    if (Date.now() - parseInt(timestamp, 10) > 600000) throw new Error('State expired');
    return userId;
}

// ─── OAuth ───

function buildAuthUrl(state) {
    if (!IG_TEST_APP_ID) throw new Error('IG_TEST_APP_ID is not configured');
    if (!IG_TEST_REDIRECT_URI) throw new Error('IG_TEST_REDIRECT_URI is not configured');
    return `${OAUTH_AUTHORIZE_URL}?` + new URLSearchParams({
        client_id: IG_TEST_APP_ID,
        redirect_uri: IG_TEST_REDIRECT_URI,
        response_type: 'code',
        scope: SCOPES,
        state
    });
}

async function exchangeCodeForToken(code) {
    const formData = new URLSearchParams({
        client_id: IG_TEST_APP_ID,
        client_secret: IG_TEST_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: IG_TEST_REDIRECT_URI,
        code
    });
    const { data } = await axios.post(OAUTH_TOKEN_URL, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    let shortLivedToken = data.access_token;
    let igUserId = data.user_id;
    // Some responses wrap the result in a data array.
    if (!shortLivedToken && Array.isArray(data.data) && data.data.length > 0) {
        shortLivedToken = data.data[0].access_token;
        igUserId = data.data[0].user_id;
    }
    if (!shortLivedToken || !igUserId) throw new Error('Failed to parse token from response');
    return { shortLivedToken, igUserId: String(igUserId) };
}

async function getLongLivedToken(shortLivedToken) {
    try {
        const { data } = await axios.get(`${GRAPH_BASE}/access_token`, {
            params: {
                grant_type: 'ig_exchange_token',
                client_secret: IG_TEST_APP_SECRET,
                access_token: shortLivedToken
            }
        });
        if (data.access_token) {
            return {
                accessToken: data.access_token,
                expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000)
            };
        }
    } catch (e) {
        console.warn('[igTest] Long-lived token exchange failed, using short-lived:', e.response?.data?.error?.message || e.message);
    }
    return { accessToken: shortLivedToken, expiresAt: new Date(Date.now() + 3600 * 1000) };
}

async function getProfile(igUserId, token) {
    try {
        const { data } = await axios.get(`${GRAPH_BASE}/${igUserId}`, {
            params: {
                fields: 'user_id,username,account_type,profile_picture_url',
                access_token: token
            }
        });
        return data;
    } catch (e) {
        console.warn('[igTest] Profile fetch failed:', e.response?.data?.error?.message || e.message);
        return { username: String(igUserId) };
    }
}

// ─── Publishing ───

// Create a media container. `payload` may include image_url, video_url,
// media_type, caption, alt_text, is_carousel_item, children, is_ai_generated.
async function createMediaContainer(igUserId, token, payload) {
    const { data } = await axios.post(buildGraphUrl(`/${igUserId}/media`), null, {
        params: { ...payload, access_token: token }
    });
    return data; // { id: <IG_CONTAINER_ID> }
}

async function getContainerStatus(containerId, token) {
    const { data } = await axios.get(buildGraphUrl(`/${containerId}`), {
        params: { fields: 'status_code', access_token: token }
    });
    return data.status_code; // EXPIRED | ERROR | FINISHED | IN_PROGRESS | PUBLISHED
}

// Poll a container until it is FINISHED (ready to publish). Recommended
// cadence: once per minute for up to 5 minutes (for video / reels).
async function waitForContainer(containerId, token, { intervalMs = 5000, maxAttempts = 60 } = {}) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const status = await getContainerStatus(containerId, token);
        if (status === 'FINISHED') return true;
        if (status === 'ERROR' || status === 'EXPIRED') {
            throw new Error(`Container ${containerId} status: ${status}`);
        }
        await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(`Container ${containerId} was not ready after ${maxAttempts} attempts`);
}

async function publishContainer(igUserId, token, creationId) {
    const { data } = await axios.post(buildGraphUrl(`/${igUserId}/media_publish`), null, {
        params: { creation_id: creationId, access_token: token }
    });
    return data; // { id: <IG_MEDIA_ID> }
}

async function getPublishingLimit(igUserId, token) {
    const { data } = await axios.get(buildGraphUrl(`/${igUserId}/content_publishing_limit`), {
        params: { fields: 'config,quota_usage', access_token: token }
    });
    return data;
}

module.exports = {
    GRAPH_VERSION,
    signState,
    verifyState,
    buildAuthUrl,
    exchangeCodeForToken,
    getLongLivedToken,
    getProfile,
    createMediaContainer,
    getContainerStatus,
    waitForContainer,
    publishContainer,
    getPublishingLimit,
};
