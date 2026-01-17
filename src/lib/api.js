import axios from 'axios';
// let API_BASE_URL = 'https://viralix-b3ff86cb412f.herokuapp.com/api';
let API_BASE_URL = 'https://viralix-b3ff86cb412f.herokuapp.com/api';

// Derive backend URL from current host in browser if not set, falling back to localhost
if (!API_BASE_URL && typeof window !== 'undefined') {
    try {
        const { protocol, hostname } = window.location;
        API_BASE_URL = `${protocol}//${hostname}/api`;
    } catch {
        // ignore
    }
}
if (!API_BASE_URL) {
    API_BASE_URL = 'https://viralix-b3ff86cb412f.herokuapp.com/api';
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
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        if (status === 401 && typeof window !== 'undefined') {
            const path = window.location?.pathname || '';
            const isAuthRoute = path.startsWith('/auth');
            const isPublicRoot = path === '/' || path === '';
            // Only redirect to login if not on auth pages or the public landing page
            if (!isAuthRoute && !isPublicRoot) {
                window.location.href = '/auth/login';
            }
        }
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
};
export const aiAPI = {
    caption: ({ topic, tone, platform }) => api.post('/ai/caption', { topic, tone, platform }),
    hashtags: ({ topic, platform, count }) => api.post('/ai/hashtags', { topic, platform, count }),
    rewrite: ({ text, tone, platform }) => api.post('/ai/rewrite', { text, tone, platform }),
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
};
// Instagram API helpers
export const instagramAPI = {
    status: () => api.get('/instagram/status'),
    profile: (igUserId) => api.get(`/instagram/accounts/${igUserId}/profile`),
    feed: (igUserId, limit) => api.get(`/instagram/accounts/${igUserId}/feed`, { params: { limit } }),
    insights: (igUserId) => api.get(`/instagram/accounts/${igUserId}/insights`),
    publishByUrl: (igUserId, { mediaType, url, caption }) => api.post(`/instagram/accounts/${igUserId}/publish-by-url`, { mediaType, url, caption }),
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
    // Disconnect account
    disconnect: (accountId) => api.delete(`/tiktok-oauth/disconnect/${accountId}`),
    // Refresh access token
    refresh: (accountId) => api.post(`/tiktok-oauth/refresh/${accountId}`),
    // Get user's videos
    videos: (accountId, params = {}) => api.get(`/tiktok-oauth/videos/${accountId}`, { params }),
    // Publish video
    publish: (accountId, { videoUrl, caption, privacyLevel, disableComment, disableDuet, disableStitch, useInbox }) =>
        api.post(`/tiktok-oauth/publish/${accountId}`, {
            videoUrl,
            caption,
            privacyLevel,
            disableComment,
            disableDuet,
            disableStitch,
            useInbox
        }),
    // Check publish status
    publishStatus: (accountId, publishId) => api.get(`/tiktok-oauth/publish-status/${accountId}/${publishId}`),
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
