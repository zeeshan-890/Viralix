const axios = require('axios');
const IG_VERSION = 'v19.0'; // Adjust if upgrading Graph version
const FB_API = `https://graph.facebook.com/${IG_VERSION}`;
const IG_API_BASE = 'https://graph.instagram.com'; // Direct Instagram Login host (no page linkage required)

function buildIgUrl(path) {
    // Ensure versioned path for consistency with docs: graph.instagram.com/{version}/...
    return `${IG_API_BASE}/${IG_VERSION}${path}`;
}

// ============================================
// DIRECT OAUTH INSTAGRAM API FUNCTIONS
// ============================================

async function createDirectOAuthMediaContainer(igUserId, token, payload) {
    console.log(`[IG Direct] Creating media container for user ${igUserId}`);
    console.log(`[IG Direct] Payload:`, payload);
    // Primary attempt: /{igUserId}/media
    const primaryEndpoint = buildIgUrl(`/${igUserId}/media`);
    const fallbackEndpoint = buildIgUrl(`/me/media`); // legacy/fallback
    try {
        const { data } = await axios.post(primaryEndpoint, null, {
            params: { ...payload, access_token: token },
        });
        console.log(`[IG Direct] Container created (user endpoint):`, data);
        return data; // { id }
    } catch (error) {
        const code = error.response?.data?.error?.code;
        const message = error.response?.data?.error?.message || error.message;
        console.warn(`[IG Direct] Primary create failed (${code}): ${message}`);
        // Fallback only if unsupported request
        if (code === 100 && /Unsupported request/i.test(message)) {
            try {
                const { data: fb } = await axios.post(fallbackEndpoint, null, {
                    params: { ...payload, access_token: token },
                });
                console.log('[IG Direct] Container created (fallback /me):', fb);
                return fb;
            } catch (fallbackErr) {
                console.error('[IG Direct] Fallback create failed:', fallbackErr.response?.data || fallbackErr.message);
                throw fallbackErr;
            }
        }
        console.error('[IG Direct] Create container failed:', error.response?.data || error.message);
        throw error;
    }
}

async function getDirectOAuthContainerStatus(creationId, token) {
    try {
        const { data } = await axios.get(buildIgUrl(`/${creationId}`), {
            params: { fields: 'status_code,status', access_token: token },
        });
        console.log(`[IG Direct] Container ${creationId} status:`, data.status_code, data.status || '');
        if (data.status_code === 'ERROR') {
            console.error('[IG Direct] Container ERROR details:', JSON.stringify(data, null, 2));
        }
        return data.status_code;
    } catch (error) {
        console.error('[IG Direct] Get status failed:', error.response?.data || error.message);
        throw error;
    }
}

async function publishDirectOAuthContainer(igUserId, token, creationId) {
    console.log(`[IG Direct] Publishing container ${creationId}`);
    const primaryEndpoint = buildIgUrl(`/${igUserId}/media_publish`);
    const fallbackEndpoint = buildIgUrl(`/me/media_publish`);
    try {
        const { data } = await axios.post(primaryEndpoint, null, {
            params: { creation_id: creationId, access_token: token },
        });
        console.log('[IG Direct] Publish result (user endpoint):', data);
        return data;
    } catch (error) {
        const code = error.response?.data?.error?.code;
        const message = error.response?.data?.error?.message || error.message;
        console.warn(`[IG Direct] Primary publish failed (${code}): ${message}`);
        if (code === 100 && /Unsupported request/i.test(message)) {
            try {
                const { data: fb } = await axios.post(fallbackEndpoint, null, {
                    params: { creation_id: creationId, access_token: token },
                });
                console.log('[IG Direct] Publish result (fallback /me):', fb);
                return fb;
            } catch (fallbackErr) {
                console.error('[IG Direct] Fallback publish failed:', fallbackErr.response?.data || fallbackErr.message);
                throw fallbackErr;
            }
        }
        console.error('[IG Direct] Publish failed:', error.response?.data || error.message);
        throw error;
    }
}

// ============================================
// FACEBOOK-LINKED INSTAGRAM API FUNCTIONS
// ============================================

async function getIgUser(igUserId, token) {
    const { data } = await axios.get(`${FB_API}/${igUserId}`, {
        params: {
            fields: 'id,username,profile_picture_url,biography,followers_count,follows_count,media_count',
            access_token: token,
        },
    });
    return data;
}

async function getIgFeed(igUserId, token, limit = 12) {
    const { data } = await axios.get(`${FB_API}/${igUserId}/media`, {
        params: {
            fields: 'id,caption,media_type,media_product_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count',
            limit,
            access_token: token,
        },
    });
    return data.data || [];
}

// Get a single media by ID with basic metrics
async function getIgMedia(mediaId, token) {
    const { data } = await axios.get(`${FB_API}/${mediaId}`, {
        params: {
            fields: 'id,media_type,media_product_type,caption,permalink,like_count,comments_count',
            access_token: token,
        },
    });
    return data;
}

// Get insights for a specific media. As of v22+, video_views and plays are deprecated/unsupported for many types.
// Prefer requesting 'views' and optionally 'reach' as a fallback. Other metrics like saved/likes/comments/shares can be requested by callers.
async function getIgMediaInsights(mediaId, token, metrics = 'views,reach,saved') {
    try {
        const { data } = await axios.get(`${FB_API}/${mediaId}/insights`, {
            params: {
                metric: metrics,
                access_token: token,
            },
        });
        return data.data || [];
    } catch (e) {
        // Debug: print why insights failed
        // Note: Do not log tokens
        // eslint-disable-next-line no-console
        console.warn('[IG] Insights fetch failed', {
            mediaId,
            error: e?.response?.data?.error?.message || e.message,
        });
        return [];
    }
}

async function getIgUserInsights(igUserId, token) {
    const { data } = await axios.get(`${FB_API}/${igUserId}/insights`, {
        params: {
            metric: 'impressions,reach,profile_views',
            period: 'day',
            access_token: token,
        },
    });
    return data.data || [];
}

async function createMediaContainer(igUserId, token, payload) {
    const { data } = await axios.post(`${FB_API}/${igUserId}/media`, null, {
        params: { ...payload, access_token: token },
    });
    return data; // { id }
}

async function getContainerStatus(creationId, token) {
    const { data } = await axios.get(`${FB_API}/${creationId}`, {
        params: { fields: 'status_code', access_token: token },
    });
    return data.status_code;
}

async function publishContainer(igUserId, token, creationId) {
    const { data } = await axios.post(`${FB_API}/${igUserId}/media_publish`, null, {
        params: { creation_id: creationId, access_token: token },
    });
    return data;
}

module.exports = {
    getIgUser,
    getIgFeed,
    getIgMedia,
    getIgMediaInsights,
    getIgUserInsights,
    createMediaContainer,
    getContainerStatus,
    publishContainer,
    // Direct OAuth functions
    createDirectOAuthMediaContainer,
    getDirectOAuthContainerStatus,
    publishDirectOAuthContainer,
};
