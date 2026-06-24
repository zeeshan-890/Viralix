const axios = require('axios');
const cloudinary = require('cloudinary').v2;

const GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_VERSION || process.env.IG_TEST_GRAPH_VERSION || 'v21.0';
const GRAPH_BASE = 'https://graph.instagram.com';

function buildGraphUrl(path) {
    return `${GRAPH_BASE}/${GRAPH_VERSION}${path}`;
}

function formatIgApiError(error) {
    const igError = error?.response?.data?.error;
    const code = igError?.code;
    const message = igError?.message || error?.message || 'Instagram API request failed';

    if (code === 10) {
        return [
            'Instagram publishing is not permitted for this app/token.',
            'Enable instagram_business_content_publish in Meta Developer Console and reconnect the account.',
        ].join(' ');
    }
    if (code === 190) {
        return 'Instagram token expired or invalid. Disconnect and reconnect the account.';
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
            console.warn(`[instagramPublish] POST ${path} failed (${code}):`, error.response?.data?.error?.message || error.message);
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
            console.warn(`[instagramPublish] GET ${path} failed (${code}):`, error.response?.data?.error?.message || error.message);
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

const IG_FEED_TRANSFORM = 'c_fill,g_auto,w_1080,h_1080,f_jpg,q_auto:good,fl_progressive';
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
    const versionIndex = segments.findIndex((part) => /^v\d+$/.test(part));
    if (versionIndex === -1) return segments.join('/');
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
    return appendJpgExtension(`${prefix}${instagramTransformChain(mediaType)}/${tail}`);
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
                console.warn('[instagramPublish] Cloudinary SDK URL build failed:', e.message);
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
    if (background) return { intervalMs: 3000, maxAttempts: 100 };
    if (type === 'IMAGE') return { intervalMs: 1000, maxAttempts: 20 };
    return { intervalMs: 2000, maxAttempts: 12 };
}

async function createMediaContainer(igUserId, token, payload) {
    return postGraph([`/me/media`, `/${igUserId}/media`], token, payload);
}

async function getContainerStatus(containerId, token) {
    const { data } = await axios.get(buildGraphUrl(`/${containerId}`), {
        params: { fields: 'status_code,status', access_token: token }
    });
    return data;
}

async function waitForContainer(containerId, token, { intervalMs = 2000, maxAttempts = 12 } = {}) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const data = await getContainerStatus(containerId, token);
        const status = data.status_code;
        if (status === 'FINISHED') return true;
        if (status === 'ERROR' || status === 'EXPIRED') {
            console.error('[instagramPublish] Container failed:', JSON.stringify(data));
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
    GRAPH_VERSION,
    formatIgApiError,
    ensureInstagramImageUrl,
    verifyInstagramImageUrl,
    waitOptionsForMediaType,
    createMediaContainer,
    getContainerStatus,
    waitForContainer,
    publishContainer,
    getPublishingLimit,
};
