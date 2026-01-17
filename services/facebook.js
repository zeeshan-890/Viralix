const axios = require('axios');
const qs = require('querystring');
const FormData = require('form-data');

const FB_API = 'https://graph.facebook.com/v19.0';

function buildAuthUrl(state) {
    const params = {
        client_id: process.env.FACEBOOK_APP_ID,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        response_type: 'code',
        state,
        auth_type: 'rerequest',
        scope: [
            'public_profile',
            'email',
            'pages_show_list',
            'pages_read_engagement',
            'pages_read_user_content',
            'pages_manage_metadata',
            'pages_manage_posts',
            'pages_manage_engagement',
            'business_management',
            // Insights for pages metrics
            'read_insights',
            // Instagram management (access via Page linkage)
            'instagram_basic',
            'instagram_manage_insights',
            'instagram_content_publish',
            'instagram_manage_comments',
        ].join(','),
    };
    return `https://www.facebook.com/v19.0/dialog/oauth?${qs.stringify(params)}`;
}

async function exchangeCodeForToken(code) {
    const url = `${FB_API}/oauth/access_token`;
    const { data } = await axios.get(url, {
        params: {
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
            code,
        },
    });
    return data; // { access_token, token_type, expires_in }
}

async function exchangeForLongLivedToken(shortLivedToken) {
    const url = `${FB_API}/oauth/access_token`;
    const { data } = await axios.get(url, {
        params: {
            grant_type: 'fb_exchange_token',
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            fb_exchange_token: shortLivedToken,
        },
    });
    return data; // { access_token, token_type, expires_in }
}

async function getMe(accessToken) {
    const { data } = await axios.get(`${FB_API}/me`, {
        params: { fields: 'id,name,email,picture', access_token: accessToken },
    });
    return data;
}

async function getPages(accessToken) {
    const { data } = await axios.get(`${FB_API}/me/accounts`, {
        params: { fields: 'id,name,category,access_token,instagram_business_account{id},connected_instagram_account{id}', access_token: accessToken },
    });
    // Map instagram linkage for convenience
    return (data.data || []).map(p => ({
        ...p,
        instagramId: p.instagram_business_account?.id || p.connected_instagram_account?.id || null,
    }));
}

async function getPermissions(accessToken) {
    const { data } = await axios.get(`${FB_API}/me/permissions`, {
        params: { access_token: accessToken },
    });
    return data.data || [];
}

async function getBusinesses(accessToken) {
    const { data } = await axios.get(`${FB_API}/me/businesses`, {
        params: { access_token: accessToken },
    });
    return data.data || [];
}

async function getOwnedPagesForBusiness(businessId, accessToken) {
    const { data } = await axios.get(`${FB_API}/${businessId}/owned_pages`, {
        params: { fields: 'id,name,category,access_token,instagram_business_account{id},connected_instagram_account{id}', access_token: accessToken },
    });
    return (data.data || []).map(p => ({
        ...p,
        instagramId: p.instagram_business_account?.id || p.connected_instagram_account?.id || null,
    }));
}

// Fetch pages with Business Manager fallback
async function getAllPages(accessToken) {
    const direct = await getPages(accessToken);
    if (direct && direct.length) return direct;
    try {
        const businesses = await getBusinesses(accessToken);
        let all = [];
        for (const b of businesses) {
            const owned = await getOwnedPagesForBusiness(b.id, accessToken);
            all = all.concat(owned || []);
        }
        return all;
    } catch (e) {
        return direct || [];
    }
}

// Try to pull Instagram linkage by querying the Page directly with its Page access token
async function getPageInstagramId(pageId, pageAccessToken) {
    try {
        const { data } = await axios.get(`${FB_API}/${pageId}`, {
            params: {
                fields: 'instagram_business_account{id},connected_instagram_account{id}',
                access_token: pageAccessToken,
            },
        });
        const igId = data?.instagram_business_account?.id || data?.connected_instagram_account?.id || null;
        return igId;
    } catch (e) {
        return null;
    }
}

// Enrich a pages array to ensure instagramId is present when possible
async function enrichPagesWithInstagram(pages = []) {
    const result = await Promise.all(
        (pages || []).map(async (p) => {
            if (p.instagramId) return p;
            const pageAccess = p.access_token || p.accessToken;
            if (!pageAccess) return p;
            const igId = await getPageInstagramId(p.id, pageAccess);
            return { ...p, instagramId: igId };
        })
    );
    return result;
}

// Page content and publishing helpers
async function getPageFeed(pageId, pageAccessToken, limit = 10) {
    const fields = [
        'id',
        'message',
        'created_time',
        'permalink_url',
        'attachments{media_type,media,url}',
        'shares',
        'likes.summary(true).limit(0)',
        'comments.summary(true).limit(0)'
    ].join(',');
    const { data } = await axios.get(`${FB_API}/${pageId}/feed`, {
        params: { access_token: pageAccessToken, limit, fields },
    });
    return data.data || [];
}

async function getPageInsights(pageId, pageAccessToken, metric = 'page_impressions,page_engaged_users,page_fans') {
    const { data } = await axios.get(`${FB_API}/${pageId}/insights`, {
        params: { access_token: pageAccessToken, metric, period: 'day' },
    });
    return data.data || [];
}

// Fetch metrics for a specific Page post
async function getPostMetrics(postId, pageAccessToken) {
    const fields = [
        'shares',
        'likes.summary(true).limit(0)',
        'comments.summary(true).limit(0)'
    ].join(',');
    const { data } = await axios.get(`${FB_API}/${postId}`, {
        params: { access_token: pageAccessToken, fields },
    });
    const likes = data?.likes?.summary?.total_count || 0;
    const comments = data?.comments?.summary?.total_count || 0;
    const shares = data?.shares?.count || 0;
    // Try to fetch impressions via insights as an approximation for views
    let views = 0;
    try {
        const insights = await axios.get(`${FB_API}/${postId}/insights`, {
            params: { access_token: pageAccessToken, metric: 'post_impressions' },
        });
        const arr = insights?.data?.data || [];
        const series = arr.find(m => m.name === 'post_impressions')?.values || [];
        views = series.length ? (series[series.length - 1].value || 0) : 0;
    } catch (_) {
        // ignore
    }
    return { likes, comments, shares, views };
}

async function createPagePost(pageId, pageAccessToken, message, link) {
    const params = { access_token: pageAccessToken, message };
    if (link) params.link = link;
    const { data } = await axios.post(`${FB_API}/${pageId}/feed`, null, { params });
    return data; // { id: '<pageId>_<postId>' }
}

async function createPagePhoto(pageId, pageAccessToken, url, caption) {
    const params = { access_token: pageAccessToken, url };
    if (caption) params.caption = caption;
    const { data } = await axios.post(`${FB_API}/${pageId}/photos`, null, { params });
    return data; // { id, post_id }
}

async function createPageVideo(pageId, pageAccessToken, fileUrl, description) {
    const params = { access_token: pageAccessToken, file_url: fileUrl };
    if (description) params.description = description;
    const { data } = await axios.post(`${FB_API}/${pageId}/videos`, null, { params });
    return data; // { id }
}

// Upload photo via multipart (Buffer)
async function createPagePhotoUpload(pageId, pageAccessToken, fileBuffer, filename, caption) {
    const form = new FormData();
    form.append('access_token', pageAccessToken);
    if (caption) form.append('caption', caption);
    form.append('source', fileBuffer, { filename });
    const { data } = await axios.post(`${FB_API}/${pageId}/photos`, form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
    });
    return data;
}

// Upload video via multipart (Buffer)
async function createPageVideoUpload(pageId, pageAccessToken, fileBuffer, filename, description) {
    const form = new FormData();
    form.append('access_token', pageAccessToken);
    if (description) form.append('description', description);
    form.append('source', fileBuffer, { filename });
    const { data } = await axios.post(`${FB_API}/${pageId}/videos`, form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
    });
    return data;
}

async function subscribePageToWebhooks(pageId, pageAccessToken) {
    try {
        const { data } = await axios.post(`${FB_API}/${pageId}/subscribed_apps`, null, {
            params: { access_token: pageAccessToken, subscribed_fields: 'feed' },
        });
        return data?.success;
    } catch (e) {
        console.warn(`Failed to subscribe page ${pageId} to webhooks:`, e.message);
        return false;
    }
}

module.exports = {
    buildAuthUrl,
    exchangeCodeForToken,
    exchangeForLongLivedToken,
    getMe,
    getPages,
    getPermissions,
    getAllPages,
    getPageInstagramId,
    enrichPagesWithInstagram,
    getPageFeed,
    getPageInsights,
    createPagePost,
    createPagePhoto,
    createPageVideo,
    createPagePhotoUpload,
    createPageVideoUpload,
    getPostMetrics,
    subscribePageToWebhooks,
};
