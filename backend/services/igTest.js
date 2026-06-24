const axios = require('axios');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

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
            const body = new URLSearchParams({ ...params, access_token: token });
            const { data } = await axios.post(buildGraphUrl(path), body, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
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

function configureCloudinary() {
    if (!process.env.CLOUDINARY_CLOUD_NAME) return false;
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    return true;
}

// Instagram feed images: 1:1 crop (always within 4:5 – 1.91:1), JPEG, max 1440px.
const IG_FEED_TRANSFORM = 'c_fill,g_auto,w_1080,h_1080,f_jpg,q_auto:good,fl_progressive';
// Instagram story images: 9:16 crop, JPEG.
const IG_STORY_TRANSFORM = 'c_fill,g_auto,ar_9:16,w_1080,f_jpg,q_auto:good,fl_progressive';

function instagramTransformChain(mediaType) {
    return String(mediaType || 'IMAGE').toUpperCase() === 'STORIES'
        ? IG_STORY_TRANSFORM
        : IG_FEED_TRANSFORM;
}

function extractCloudinaryPathAfterUpload(url) {
    const withoutQuery = url.split('?')[0];
    const marker = '/image/upload/';
    const idx = withoutQuery.indexOf(marker);
    if (idx === -1) return null;

    const segments = withoutQuery.slice(idx + marker.length).split('/');
    let versionIndex = segments.findIndex((part) => /^v\d+$/.test(part));
    if (versionIndex === -1) {
        // No version segment — keep everything after any transform prefix.
        return segments.join('/');
    }
    return segments.slice(versionIndex).join('/');
}

function buildCloudinaryInstagramUrl(url, mediaType) {
    const withoutQuery = url.split('?')[0];
    const marker = '/image/upload/';
    const idx = withoutQuery.indexOf(marker);
    if (idx === -1) return null;

    const prefix = withoutQuery.slice(0, idx + marker.length);
    const tail = extractCloudinaryPathAfterUpload(url);
    if (!tail) return null;

    const transform = instagramTransformChain(mediaType);
    const rebuilt = `${prefix}${transform}/${tail}`;
    return appendJpgExtension(rebuilt);
}

function appendJpgExtension(url) {
    const [path, query] = url.split('?');
    if (/\.jpe?g$/i.test(path)) return url;
    const base = path.replace(/\.(webp|png|gif|avif|mp4|mov)$/i, '');
    return `${base}.jpg${query ? `?${query}` : ''}`;
}

function publicIdFromCloudinaryUrl(url) {
    const tail = extractCloudinaryPathAfterUpload(url);
    if (!tail) return null;
    return tail.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
}

function ensureInstagramImageUrl(url, mediaType = 'IMAGE') {
    if (!url) return url;

    if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
        const rebuilt = buildCloudinaryInstagramUrl(url, mediaType);
        if (rebuilt && configureCloudinary()) {
            try {
                const publicId = publicIdFromCloudinaryUrl(url);
                if (publicId) {
                    const type = String(mediaType || 'IMAGE').toUpperCase();
                    const transform = type === 'STORIES'
                        ? { width: 1080, height: 1920, crop: 'fill', gravity: 'auto', aspect_ratio: '9:16', fetch_format: 'jpg', quality: 'auto:good', flags: 'progressive' }
                        : { width: 1080, height: 1080, crop: 'fill', gravity: 'auto', fetch_format: 'jpg', quality: 'auto:good', flags: 'progressive' };
                    return appendJpgExtension(cloudinary.url(publicId, { secure: true, transformation: [transform] }));
                }
            } catch (e) {
                console.warn('[igTest] Cloudinary SDK URL build failed, using manual transform:', e.message);
            }
            return rebuilt;
        }
        if (rebuilt) return rebuilt;
    }

    return appendJpgExtension(url);
}

const CONTAINER_STATUS_HINTS = {
    2207052: 'Instagram could not download the image. The URL must be a public JPEG file.',
    2207004: 'Image is larger than 8 MB.',
    2207027: 'Media is still processing — wait and try again.',
    2207076: 'Instagram could not download the media from the URL.',
    2207082: 'Video transcoding failed on Instagram.',
    ERROR: 'Instagram rejected the media (use JPEG, aspect ratio between 4:5 and 1.91:1, max 8 MB).',
};

function describeContainerFailure(data) {
    const code = data?.status_code;
    const subcode = String(data?.status || '').trim();
    const hint = CONTAINER_STATUS_HINTS[subcode] || CONTAINER_STATUS_HINTS.ERROR;
    if (subcode && subcode !== 'ERROR' && subcode !== code) {
        return `Instagram media processing failed (${code}, subcode ${subcode}). ${hint}`;
    }
    return `Instagram media processing failed (${code}). ${hint}`;
}

async function verifyInstagramImageUrl(url) {
    try {
        const res = await axios.get(url, {
            timeout: 20000,
            maxRedirects: 5,
            responseType: 'arraybuffer',
            maxContentLength: 8 * 1024 * 1024,
            headers: { Accept: 'image/jpeg' },
            validateStatus: (status) => status >= 200 && status < 400,
        });
        const contentType = (res.headers['content-type'] || '').toLowerCase();
        if (contentType && !contentType.includes('jpeg') && !contentType.includes('jpg')) {
            throw new Error(`Processed image returns ${contentType}, expected image/jpeg`);
        }
        if (res.data?.length > 8 * 1024 * 1024) {
            throw new Error('Processed image is larger than 8 MB');
        }
    } catch (error) {
        if (error.message?.includes('expected image/jpeg') || error.message?.includes('larger than')) {
            throw error;
        }
        throw new Error(`Processed image URL is not reachable (${error.message})`);
    }
}

function waitOptionsForMediaType(mediaType, { background = false } = {}) {
    const type = String(mediaType || '').toUpperCase();
    if (background) {
        // Video/reel/story processing can take several minutes on Instagram's side.
        return { intervalMs: 3000, maxAttempts: 100 };
    }
    if (type === 'IMAGE') {
        return { intervalMs: 1000, maxAttempts: 20 };
    }
    // Sync HTTP path — stay within Heroku's ~30s router timeout.
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
            console.error('[igTest] Container failed:', JSON.stringify(data));
            throw new Error(describeContainerFailure(data));
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
    verifyInstagramImageUrl,
    waitOptionsForMediaType,
    createMediaContainer,
    getContainerStatus,
    waitForContainer,
    publishContainer,
    getPublishingLimit,
};
