import axios from 'axios';
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.viralix.dev/api';

// Fallback to relative path if not configured and running in browser
if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== 'undefined') {
    try {
        const { protocol, hostname } = window.location;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
             API_BASE_URL = `${protocol}//${hostname}:5000/api`;
        }
    } catch {
        // ignore
    }
}

// Token (localStorage) auth mode
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
    headers: { 'Content-Type': 'application/json' },
});

// Attach token if present
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for auth errors
// No automatic redirects - let components handle auth state
api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
// API helper functions
export const authAPI = {
    login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const token = res?.data?.token;
        if (token && typeof window !== 'undefined') localStorage.setItem('auth_token', token);
        return res;
    },
    signup: (name, email, password) => api.post('/auth/signup', { name, email, password }),
    verifyOtp: async (email, code) => {
        const res = await api.post('/auth/verify-otp', { email, code });
        const token = res?.data?.token;
        if (token && typeof window !== 'undefined') localStorage.setItem('auth_token', token);
        return res;
    },
    resendOtp: (email) => api.post('/auth/resend-otp', { email }),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
    me: () => api.get('/auth/me'),
    logout: async () => {
        try { await api.post('/auth/logout'); } catch (_) { }
        if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
        return { data: { message: 'Logged out' } };
    },
};
// Posts (scheduling) API
export const postsAPI = {
    getAllPosts: (params) => api.get('/posts', { params }),  // Alias for compatibility
    list: (params) => api.get('/posts', { params }),
    getPost: (id) => api.get(`/posts/${id}`),  // Alias for compatibility  
    get: (id) => api.get(`/posts/${id}`),
    create: (data) => api.post('/posts', data),
    updatePost: (id, data) => api.put(`/posts/${id}`, data),  // Alias for compatibility
    update: (id, data) => api.put(`/posts/${id}`, data),
    remove: (id) => api.delete(`/posts/${id}`),
    publishNow: (id) => api.post(`/posts/${id}/publish`),
    remix: (id, { tone, platform } = {}) => api.post(`/posts/${id}/remix`, { tone, platform }),
};
export const campaignsAPI = {
    getAll: () => api.get('/campaigns'),
    getById: (id) => api.get(`/campaigns/${id}`),
    create: (data) => api.post('/campaigns', data),
    update: (id, data) => api.put(`/campaigns/${id}`, data),
    delete: (id) => api.delete(`/campaigns/${id}`),
    schedule: (id, publishAt) => api.post(`/campaigns/${id}/schedule`, { publishAt }),
};
export const analyticsAPI = {
    getOverview: (params) => api.get('/analytics/overview', { params }),
    getPlatformMetrics: (platform, params) => api.get(`/analytics/platform/${platform}`, { params }),
    getContentPerformance: (params) => api.get('/analytics/content-performance', { params }),
    getPerformance: (params) => api.get('/analytics/performance', { params }),
    refresh: () => api.post('/analytics/refresh'),
    getBestTimes: (params) => api.get('/analytics/best-times', { params }),
};
export const aiAPI = {
    caption: ({ topic, tone, platform }) => api.post('/ai/caption', { topic, tone, platform }),
    hashtags: ({ topic, platform, count }) => api.post('/ai/hashtags', { topic, platform, count }),
    rewrite: ({ text, tone, platform }) => api.post('/ai/rewrite', { text, tone, platform }),
};

// Comment Sentiment API (Feature 2)
export const commentsAPI = {
    getSentimentSummary: (params) => api.get('/comments/sentiment-summary', { params }),
    getRecent: (params) => api.get('/comments/recent', { params }),
    getUrgent: (params) => api.get('/comments/urgent', { params }),
};

// Link Shortener API (Feature 4)
export const linksAPI = {
    create: (data) => api.post('/links', data),
    list: (params) => api.get('/links', { params }),
    getStats: (id) => api.get(`/links/${id}/stats`),
    remove: (id) => api.delete(`/links/${id}`),
};

// Keyword Alerts API (Feature 5)
export const keywordAlertsAPI = {
    list: () => api.get('/keyword-alerts'),
    create: (data) => api.post('/keyword-alerts', data),
    toggle: (id) => api.patch(`/keyword-alerts/${id}/toggle`),
    remove: (id) => api.delete(`/keyword-alerts/${id}`),
    getNotifications: () => api.get('/keyword-alerts/notifications'),
    markAllRead: () => api.patch('/keyword-alerts/notifications/read-all'),
};

// Team Collaboration API (Feature 6)
export const teamAPI = {
    list: () => api.get('/team'),
    invite: (data) => api.post('/team/invite', data),
    updateRole: (userId, role) => api.patch(`/team/${userId}/role`, { role }),
    remove: (userId) => api.delete(`/team/${userId}`),
    submitPost: (postId, note) => api.post(`/team/posts/${postId}/submit`, { note }),
    approvePost: (postId, note) => api.post(`/team/posts/${postId}/approve`, { note }),
    rejectPost: (postId, note) => api.post(`/team/posts/${postId}/reject`, { note }),
    pendingPosts: () => api.get('/team/posts/pending'),
};

// Watermark API (Feature 7)
export const watermarkAPI = {
    get: () => api.get('/watermark'),
    upload: (formData) => api.post('/watermark/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (data) => api.patch('/watermark', data),
    remove: () => api.delete('/watermark'),
    preview: (imageUrl) => api.get('/watermark/preview', { params: { imageUrl } }),
};

// Bulk Upload API (Feature 8)
export const bulkUploadAPI = {
    preview: (formData) => api.post('/bulk-upload/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    create: (formData) => api.post('/bulk-upload/create', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Unified Inbox API (Feature 9)
export const inboxAPI = {
    list: (params) => api.get('/inbox', { params }),
    stats: () => api.get('/inbox/stats'),
    messages: (conversationId, params) => api.get(`/inbox/${conversationId}/messages`, { params }),
    reply: (conversationId, text) => api.post(`/inbox/${conversationId}/reply`, { text }),
    updateStatus: (conversationId, status) => api.patch(`/inbox/${conversationId}/status`, { status }),
    updateLabels: (conversationId, labels) => api.patch(`/inbox/${conversationId}/labels`, { labels }),
    assign: (conversationId, assignedTo) => api.patch(`/inbox/${conversationId}/assign`, { assignedTo }),
};

// Competitor Analysis API (Feature 10)
export const competitorAPI = {
    list: () => api.get('/competitors'),
    add: (data) => api.post('/competitors', data),
    remove: (id) => api.delete(`/competitors/${id}`),
    toggle: (id) => api.patch(`/competitors/${id}/toggle`),
    snapshot: (id, data) => api.post(`/competitors/${id}/snapshot`, data),
    history: (id, days) => api.get(`/competitors/${id}/history`, { params: { days } }),
    compare: () => api.get('/competitors/compare'),
};

// Hashtag Research API (Feature 9 — Hashtag Tool)
export const hashtagResearchAPI = {
    performance: (params) => api.get('/hashtag-research/performance', { params }),
    suggest: (params) => api.get('/hashtag-research/suggest', { params }),
    trending: (params) => api.get('/hashtag-research/trending', { params }),
    listSets: () => api.get('/hashtag-research/sets'),
    createSet: (data) => api.post('/hashtag-research/sets', data),
    updateSet: (id, data) => api.patch(`/hashtag-research/sets/${id}`, data),
    deleteSet: (id) => api.delete(`/hashtag-research/sets/${id}`),
    copySet: (id) => api.post(`/hashtag-research/sets/${id}/copy`),
};

// AI Content Calendar (Feature 1)
export const aiCalendarAPI = {
    analyze: (data) => api.post('/ai-calendar/analyze', data),
    generate: (data) => api.post('/ai-calendar/generate', data),
    confirm: (data) => api.post('/ai-calendar/confirm', data)
};

// Bio Pages API (Feature 11 — Smart Bio Link)
export const bioPagesAPI = {
    list: () => api.get('/bio-pages'),
    get: (id) => api.get(`/bio-pages/${id}`),
    create: (data) => api.post('/bio-pages', data),
    update: (id, data) => api.patch(`/bio-pages/${id}`, data),
    delete: (id) => api.delete(`/bio-pages/${id}`),
    // Public
    getPublic: (slug) => api.get(`/bio-pages/public/${slug}`),
    trackClick: (id, buttonId) => api.post(`/bio-pages/click/${id}/${buttonId}`)
};

export const platformsAPI = {
    getConnected: () => api.get('/platforms/connected'),
    connect: (platform, authCode) => api.post('/platforms/connect', { platform, authCode }),
    disconnect: (platform) => api.delete(`/platforms/${platform}`),
    sync: (platform) => api.post(`/platforms/${platform}/sync`),
};
export const facebookAPI = {
    status: () => api.get('/facebook/status'),
    startUrl: () => api.get('/facebook/oauth/start-url'),
    disconnect: () => api.delete('/facebook/disconnect'),
    refresh: () => api.post('/facebook/refresh'),
    setDefaultPage: (pageId) => api.post('/facebook/default-page', { pageId }),
    diagnose: () => api.get('/facebook/diagnose'),
    // start uses window.open to /api/facebook/oauth/start directly
    getPageFeed: (pageId, limit) => api.get(`/facebook/pages/${pageId}/feed`, { params: { limit } }),
    getPageInsights: (pageId, metrics) => api.get(`/facebook/pages/${pageId}/insights`, { params: { metrics } }),
    createPagePost: (pageId, { message, link }) => api.post(`/facebook/pages/${pageId}/post`, { message, link }),
    createPagePhoto: (pageId, { url, caption }) => api.post(`/facebook/pages/${pageId}/photo`, { url, caption }),
    createPageVideo: (pageId, { fileUrl, description }) => api.post(`/facebook/pages/${pageId}/video`, { fileUrl, description }),
    uploadPagePhoto: (pageId, file, caption) => {
        const form = new FormData();
        form.append('file', file);
        if (caption) form.append('caption', caption);
        return api.post(`/facebook/pages/${pageId}/photo-upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    uploadPageVideo: (pageId, file, description) => {
        const form = new FormData();
        form.append('file', file);
        if (description) form.append('description', description);
        return api.post(`/facebook/pages/${pageId}/video-upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    // Detailed post insights
    getPostInsights: (postId) => api.get(`/facebook/post/${postId}/insights`),
};

// Facebook Auto-Reply helpers
export const facebookAutoReplyAPI = {
    getRules: () => api.get('/facebook-auto-reply/rules'),
    createRule: (data) => api.post('/facebook-auto-reply/rules', data),
};
// Instagram API helpers
export const instagramAPI = {
    status: () => api.get('/instagram/status'),
    profile: (igUserId) => api.get(`/instagram/accounts/${igUserId}/profile`),
    feed: (igUserId, limit) => api.get(`/instagram/accounts/${igUserId}/feed`, { params: { limit } }),
    insights: (igUserId) => api.get(`/instagram/accounts/${igUserId}/insights`),
    publishByUrl: (igUserId, { mediaType, url, caption }) => api.post(`/instagram/accounts/${igUserId}/publish-by-url`, { mediaType, url, caption }),
    // Get detailed insights for a specific media post
    getMediaInsights: (mediaId) => api.get(`/instagram-insights/media/${mediaId}/insights`),
    // Auto-reply rules
    getAutoReplyRules: () => api.get('/instagram-auto-reply/rules'),
    getAutoReplyRule: (postId) => api.get(`/instagram-auto-reply/rules/post/${postId}`),
    createAutoReplyRule: (data) => api.post('/instagram-auto-reply/rules', data),
    updateAutoReplyRule: (ruleId, data) => api.put(`/instagram-auto-reply/rules/${ruleId}`, data),
    deleteAutoReplyRule: (ruleId) => api.delete(`/instagram-auto-reply/rules/${ruleId}`),
    toggleAutoReplyRule: (ruleId) => api.patch(`/instagram-auto-reply/rules/${ruleId}/toggle`),
};
export const uploadAPI = {
    // Get user's uploaded media
    getMedia: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return api.get(`/upload/media${queryString ? `?${queryString}` : ''}`);
    },
    // Batch Cloudinary upload through server route
    uploadMedia: (files) => {
        const formData = new FormData();
        for (const f of files) formData.append('files', f);
        return api.post('/upload/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    // Convenience single-file upload using the same /upload/media endpoint
    uploadFile: (file, onProgress) => {
        const formData = new FormData();
        formData.append('files', file);
        return api.post('/upload/media', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
        });
    },
    deleteFile: (publicId) => api.delete(`/upload/media/${encodeURIComponent(publicId.replace(/\//g, ':'))}`),
};

// TikTok API helpers
export const tiktokAPI = {
    // Get OAuth connect URL
    connect: () => api.get('/tiktok-oauth/connect'),
    // Get connection status
    status: () => api.get('/tiktok-oauth/status'),
    // Get account profile with stats
    account: (accountId) => api.get(`/tiktok-oauth/account/${accountId}`),
    // Get creator info for posting (privacy options, limits, settings)
    creatorInfo: (accountId) => api.get(`/tiktok-oauth/creator-info/${accountId}`),
    // Disconnect account
    disconnect: (accountId) => api.delete(`/tiktok-oauth/disconnect/${accountId}`),
    // Refresh access token
    refresh: (accountId) => api.post(`/tiktok-oauth/refresh/${accountId}`),
    // Get user's videos
    videos: (accountId, params = {}) => api.get(`/tiktok-oauth/videos/${accountId}`, { params }),
    // Publish video with all TikTok settings
    publish: (accountId, {
        videoUrl,
        caption,
        privacyLevel,
        disableComment,
        disableDuet,
        disableStitch,
        useInbox,
        brandOrganic,
        brandedContent
    }) =>
        api.post(`/tiktok-oauth/publish/${accountId}`, {
            videoUrl,
            caption,
            privacyLevel,
            disableComment,
            disableDuet,
            disableStitch,
            useInbox,
            brandOrganic,
            brandedContent
        }),
    // Check publish status
    publishStatus: (accountId, publishId) => api.get(`/tiktok-oauth/publish-status/${accountId}/${publishId}`),
    // Get live video insights
    getVideoInsights: (videoId) => api.get(`/tiktok-oauth/video/insights/${videoId}`),
};

// YouTube API helpers
export const youtubeAPI = {
    // Get OAuth connect URL
    connect: () => api.get('/youtube-oauth/connect'),
    // Get connection status
    status: () => api.get('/youtube-oauth/status'),
    // Get channel info with stats
    account: (accountId) => api.get(`/youtube-oauth/account/${accountId}`),
    // Disconnect account
    disconnect: (accountId) => api.delete(`/youtube-oauth/disconnect/${accountId}`),
    // Refresh access token
    refresh: (accountId) => api.post(`/youtube-oauth/refresh/${accountId}`),
    // Get live video insights
    getVideoInsights: (videoId) => api.get(`/youtube-oauth/video/insights/${videoId}`),
    // Get user's videos
    videos: (accountId, params = {}) => api.get(`/youtube-oauth/videos/${accountId}`, { params }),
    // Publish video
    publish: (accountId, { videoUrl, title, description, tags, privacyStatus, madeForKids }) =>
        api.post(`/youtube-oauth/publish/${accountId}`, {
            videoUrl,
            title,
            description,
            tags,
            privacyStatus,
            madeForKids
        }),
};

// Platform Sync API helpers
export const platformSyncAPI = {
    // Sync all platforms
    syncAll: () => api.post('/platform-sync/sync-all'),
    // Sync specific platform
    sync: (platform) => api.post(`/platform-sync/sync/${platform}`),
    // Get synced content for platform
    getContent: (platform, params = {}) => api.get(`/platform-sync/content/${platform}`, { params }),
};
