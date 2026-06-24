const axios = require('axios');
const crypto = require('crypto');

// Isolated Instagram Publishing Test service.
// Uses pure "Instagram API with Instagram Login" (graph.instagram.com /
// api.instagram.com) — no Facebook Pages. Credentials are dedicated to this
// sandbox and never shared with the main Instagram integration.

// Fall back to the existing Instagram credentials when the dedicated
// IG_TEST_* vars are not configured.
const IG_TEST_APP_ID = process.env.IG_TEST_APP_ID
    || process.env.INSTAGRAM_APP_ID
    || process.env.INSTAGRAM_CLIENT_ID;
const IG_TEST_APP_SECRET = process.env.IG_TEST_APP_SECRET
    || process.env.INSTAGRAM_APP_SECRET
    || process.env.INSTAGRAM_CLIENT_SECRET;
const IG_TEST_REDIRECT_URI = process.env.IG_TEST_REDIRECT_URI?.trim();
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

async function getMeProfile(token) {
    const { data } = await axios.get(buildGraphUrl('/me'), {
        params: {
            fields: 'user_id,username,account_type,profile_picture_url',
            access_token: token
        }
    });
    return data;
}

async function getProfile(igUserId, token) {
    try {
        return await getMeProfile(token);
    } catch (e) {
        console.warn('[igTest] /me profile fetch failed, falling back to user id:', e.response?.data?.error?.message || e.message);
    }
    try {
        const { data } = await axios.get(buildGraphUrl(`/${igUserId}`), {
            params: {
                fields: 'user_id,username,account_type,profile_picture_url',
                access_token: token
            }
        });
        return data;
    } catch (e) {
        console.warn('[igTest] Profile fetch failed:', e.response?.data?.error?.message || e.message);
        return { user_id: igUserId, username: String(igUserId) };
    }
}

function formatIgApiError(error) {
    const igError = error?.response?.data?.error;
    const code = igError?.code;
    const message = igError?.message || error?.message || 'Instagram API request failed';

    if (code === 10) {
        return [
            'Instagram publishing is not permitted for this app/token.',
            'In Meta Developer Console: use "API setup with Instagram login", enable instagram_business_content_publish,',
            'add your Instagram account under App Roles → Instagram Testers, then disconnect and reconnect here.',
        ].join(' ');
    }
    if (code === 190) {
        return 'Instagram token expired or invalid. Disconnect and reconnect the test account.';
    }
    return message;
}

async function postGraph(paths, token, params) {
    let lastErr;
    for (const path of paths) {
        try {
            const { data } = await axios.post(buildGraphUrl(path), null, {
                params: { ...params, access_token: token }
            });
            return data;
        } catch (error) {
            lastErr = error;
            const code = error.response?.data?.error?.code;
            console.warn(`[igTest] POST ${path} failed (${code}):`, error.response?.data?.error?.message || error.message);
            if ([10, 190, 200].includes(code)) break;
        }
    }
    throw lastErr;
}

async function getGraph(paths, token, params) {
    let lastErr;
    for (const path of paths) {
        try {
            const { data } = await axios.get(buildGraphUrl(path), {
                params: { ...params, access_token: token }
            });
            return data;
        } catch (error) {
            lastErr = error;
            const code = error.response?.data?.error?.code;
            console.warn(`[igTest] GET ${path} failed (${code}):`, error.response?.data?.error?.message || error.message);
            if ([10, 190, 200].includes(code)) break;
        }
    }
    throw lastErr;
}

function ensureInstagramImageUrl(url) {
    if (!url || !url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
        return url;
    }
    if (url.includes('/f_jpg') || url.includes('f_jpg,')) return url;
    return url.replace('/image/upload/', '/image/upload/f_jpg,q_auto/');
}

function waitOptionsForMediaType(mediaType) {
    const type = String(mediaType || '').toUpperCase();
    if (type === 'IMAGE') {
        return { intervalMs: 1000, maxAttempts: 20 };
    }
    // Heroku HTTP requests time out at 30s — keep video polling within that budget.
    return { intervalMs: 2000, maxAttempts: 12 };
}

// Create a media container. `payload` may include image_url, video_url,
// media_type, caption, alt_text, is_carousel_item, children, is_ai_generated.
async function createMediaContainer(igUserId, token, payload) {
    return postGraph([`/me/media`, `/${igUserId}/media`], token, payload);
}

async function getContainerStatus(containerId, token) {
    const { data } = await axios.get(buildGraphUrl(`/${containerId}`), {
        params: { fields: 'status_code,status', access_token: token }
    });
    return data;
}

// Poll a container until it is FINISHED (ready to publish).
async function waitForContainer(containerId, token, { intervalMs = 2000, maxAttempts = 12 } = {}) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const data = await getContainerStatus(containerId, token);
        const status = data.status_code;
        if (status === 'FINISHED') return true;
        if (status === 'ERROR' || status === 'EXPIRED') {
            const detail = data.status ? `${status}: ${data.status}` : status;
            throw new Error(`Instagram media processing failed (${detail})`);
        }
        if (attempt < maxAttempts - 1) {
            await new Promise((r) => setTimeout(r, intervalMs));
        }
    }
    throw new Error(`Media processing timed out after ${Math.round((intervalMs * maxAttempts) / 1000)}s`);
}

async function publishContainer(igUserId, token, creationId) {
    return postGraph([`/me/media_publish`, `/${igUserId}/media_publish`], token, { creation_id: creationId });
}

async function getPublishingLimit(igUserId, token) {
    return getGraph(
        [`/me/content_publishing_limit`, `/${igUserId}/content_publishing_limit`],
        token,
        { fields: 'config,quota_usage' }
    );
}

module.exports = {
    formatIgApiError,
    GRAPH_VERSION,
    signState,
    verifyState,
    buildAuthUrl,
    exchangeCodeForToken,
    getLongLivedToken,
    getMeProfile,
    getProfile,
    ensureInstagramImageUrl,
    waitOptionsForMediaType,
    createMediaContainer,
    getContainerStatus,
    waitForContainer,
    publishContainer,
    getPublishingLimit,
};
