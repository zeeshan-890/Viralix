import axios from 'axios';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// Response interceptor for error handling
api.interceptors.response.use((response) => response, (error) => {
    var _a;
    if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
    }
    return Promise.reject(error);
});
export default api;
// API helper functions
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    signup: (name, email, password) => api.post('/auth/signup', { name, email, password }),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
    me: () => api.get('/auth/me'),
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
    getOverview: (platform, dateRange) => api.get('/analytics/overview', { params: { platform, dateRange } }),
    getPlatformMetrics: (platform, dateRange) => api.get(`/analytics/platforms/${platform}`, { params: { dateRange } }),
    getInsights: () => api.get('/analytics/insights'),
};
export const platformsAPI = {
    getConnected: () => api.get('/platforms/connected'),
    connect: (platform, authCode) => api.post('/platforms/connect', { platform, authCode }),
    disconnect: (platform) => api.delete(`/platforms/${platform}`),
    sync: (platform) => api.post(`/platforms/${platform}/sync`),
};
export const uploadAPI = {
    uploadFile: (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload', formData, {
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
    deleteFile: (fileId) => api.delete(`/upload/${fileId}`),
};
