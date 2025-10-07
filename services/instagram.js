const axios = require('axios');
const FB_API = 'https://graph.facebook.com/v19.0';
const IG_API = 'https://graph.instagram.com'; // Direct OAuth Instagram API

// ============================================
// DIRECT OAUTH INSTAGRAM API FUNCTIONS
// ============================================

async function createDirectOAuthMediaContainer(igUserId, token, payload) {
    console.log(`[IG Direct] Creating media container for user ${igUserId}`);
    console.log(`[IG Direct] Payload:`, payload);

    try {
        const { data } = await axios.post(`${IG_API}/me/media`, null, {
            params: { ...payload, access_token: token },
        });
        console.log(`[IG Direct] Container created:`, data);
        return data; // { id }
    } catch (error) {
        console.error(`[IG Direct] Create container failed:`, error.response?.data || error.message);
        throw error;
    }
}

async function getDirectOAuthContainerStatus(creationId, token) {
    try {
        const { data } = await axios.get(`${IG_API}/${creationId}`, {
            params: { fields: 'status_code,status', access_token: token },
        });
        console.log(`[IG Direct] Container ${creationId} status:`, data.status_code, data.status || '');

        // If there's an error, log the full response
        if (data.status_code === 'ERROR') {
            console.error(`[IG Direct] Container ERROR details:`, JSON.stringify(data, null, 2));
        }

        return data.status_code;
    } catch (error) {
        console.error(`[IG Direct] Get status failed:`, error.response?.data || error.message);
        throw error;
    }
}

async function publishDirectOAuthContainer(igUserId, token, creationId) {
    console.log(`[IG Direct] Publishing container ${creationId}`);

    try {
        const { data } = await axios.post(`${IG_API}/me/media_publish`, null, {
            params: { creation_id: creationId, access_token: token },
        });
        console.log(`[IG Direct] Publish result:`, data);
        return data; // { id }
    } catch (error) {
        console.error(`[IG Direct] Publish failed:`, error.response?.data || error.message);
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
