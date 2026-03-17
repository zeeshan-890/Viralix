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
    // NOTE: Per user request we DO NOT call graph.facebook.com for direct tokens.
    // Direct Instagram Login tokens (Basic Display) are read-only; POST attempts
    // to graph.instagram.com will return Unsupported request. We attempt both
    // user and /me instagram endpoints only to confirm capability and provide
    // specific guidance.
    const userEndpoint = buildIgUrl(`/${igUserId}/media`);
    const meEndpoint = buildIgUrl(`/me/media`);

    const attempts = [
        { label: 'instagram-graph-user', url: userEndpoint },
        { label: 'instagram-graph-me', url: meEndpoint },
    ];

    let lastErr;
    for (const attempt of attempts) {
        try {
            console.log(`[IG Direct] Attempting create via ${attempt.label}: ${attempt.url}`);
            const { data } = await axios.post(attempt.url, null, {
                params: { ...payload, access_token: token },
            });
            console.log(`[IG Direct] Container created via ${attempt.label}:`, data);
            return data;
        } catch (error) {
            lastErr = error;
            const code = error.response?.data?.error?.code;
            const message = error.response?.data?.error?.message || error.message;
            console.warn(`[IG Direct] Create attempt failed (${attempt.label}) (${code}): ${message}`);
            if ([10, 190, 200].includes(code)) break; // fatal / permission issues
        }
    }

    const finalCode = lastErr?.response?.data?.error?.code;
    const finalMessage = lastErr?.response?.data?.error?.message || lastErr?.message;
    if (finalCode === 190) {
        const err = new Error('Instagram authentication failed (Invalid Token). Please go to Connect Accounts and Reconnect Instagram.');
        err.code = 'IG_INVALID_TOKEN';
        throw err;
    }
    if (finalCode === 100 && /Unsupported request/i.test(finalMessage)) {
        // Provide actionable guidance.
        const guidance = 'Instagram token / account does not support publishing. Publishing requires a Business or Creator Instagram account connected to a Facebook Page, authorized with the Instagram Graph API (permissions: instagram_basic, instagram_content_publish). Convert your account to Professional, connect it to a Facebook Page, then reconnect inside the platform.';
        const err = new Error(`${finalMessage}. ${guidance}`);
        err.code = 'IG_UNSUPPORTED_PUBLISH';
        throw err;
    }
    console.error('[IG Direct] All create attempts failed:', lastErr?.response?.data || finalMessage);
    throw lastErr;
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
    // Only attempt instagram domain endpoints per user instruction.
    const userEndpoint = buildIgUrl(`/${igUserId}/media_publish`);
    const meEndpoint = buildIgUrl(`/me/media_publish`);
    const attempts = [
        { label: 'instagram-graph-user', url: userEndpoint },
        { label: 'instagram-graph-me', url: meEndpoint },
    ];
    let lastErr;
    for (const attempt of attempts) {
        try {
            console.log(`[IG Direct] Attempting publish via ${attempt.label}: ${attempt.url}`);
            const { data } = await axios.post(attempt.url, null, {
                params: { creation_id: creationId, access_token: token },
            });
            console.log(`[IG Direct] Publish success via ${attempt.label}:`, data);
            return data;
        } catch (error) {
            lastErr = error;
            const code = error.response?.data?.error?.code;
            const message = error.response?.data?.error?.message || error.message;
            console.warn(`[IG Direct] Publish attempt failed (${attempt.label}) (${code}): ${message}`);
            if ([10, 190, 200].includes(code)) break; // permission / token fatal
        }
    }
    const finalCode = lastErr?.response?.data?.error?.code;
    const finalMessage = lastErr?.response?.data?.error?.message || lastErr?.message;
    if (finalCode === 190) {
        const err = new Error('Instagram authentication failed (Invalid Token). Please go to Connect Accounts and Reconnect Instagram.');
        err.code = 'IG_INVALID_TOKEN';
        throw err;
    }
    if (finalCode === 100 && /Unsupported request/i.test(finalMessage)) {
        const guidance = 'This token cannot publish content. Please ensure the Instagram account is a Business or Creator account linked to a Facebook Page and re-authenticate with the required permissions (instagram_basic, pages_show_list, instagram_content_publish).';
        const err = new Error(`${finalMessage}. ${guidance}`);
        err.code = 'IG_UNSUPPORTED_PUBLISH';
        throw err;
    }
    console.error('[IG Direct] All publish attempts failed:', lastErr?.response?.data || finalMessage);
    throw lastErr;
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
    refreshLongLivedToken,
};

// Refresh a long-lived access token.
// The refresher should only be called if the token is at least 24 hours old, but it doesn't hurt to try if close to expiry.
// Returns { access_token, expires_in, token_type }
async function refreshLongLivedToken(accessToken) {
    console.log('[IG Direct] Refreshing long-lived access token');
    try {
        const { data } = await axios.get(`${IG_API_BASE}/refresh_access_token`, {
            params: {
                grant_type: 'ig_refresh_token',
                access_token: accessToken,
            },
        });
        console.log('[IG Direct] Token refresh success');
        return data; // contains access_token, expires_in, token_type
    } catch (error) {
        console.error('[IG Direct] Token refresh failed:', error.response?.data || error.message);
        throw error;
    }
}
