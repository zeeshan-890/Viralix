import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/auth/login'
        }
        return Promise.reject(error)
    }
)

export default api

// API helper functions
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    signup: (name: string, email: string, password: string) =>
        api.post('/auth/signup', { name, email, password }),
    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) =>
        api.post('/auth/reset-password', { token, password }),
    me: () => api.get('/auth/me'),
}

export const campaignsAPI = {
    getAll: () => api.get('/campaigns'),
    getById: (id: string) => api.get(`/campaigns/${id}`),
    create: (data: any) => api.post('/campaigns', data),
    update: (id: string, data: any) => api.put(`/campaigns/${id}`, data),
    delete: (id: string) => api.delete(`/campaigns/${id}`),
    schedule: (id: string, publishAt: Date) =>
        api.post(`/campaigns/${id}/schedule`, { publishAt }),
}

export const analyticsAPI = {
    getOverview: (platform?: string, dateRange?: string) =>
        api.get('/analytics/overview', { params: { platform, dateRange } }),
    getPlatformMetrics: (platform: string, dateRange?: string) =>
        api.get(`/analytics/platforms/${platform}`, { params: { dateRange } }),
    getInsights: () => api.get('/analytics/insights'),
}

export const platformsAPI = {
    getConnected: () => api.get('/platforms/connected'),
    connect: (platform: string, authCode: string) =>
        api.post('/platforms/connect', { platform, authCode }),
    disconnect: (platform: string) =>
        api.delete(`/platforms/${platform}`),
    sync: (platform: string) => api.post(`/platforms/${platform}/sync`),
}

export const uploadAPI = {
    uploadFile: (file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData()
        formData.append('file', file)

        return api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    )
                    onProgress(progress)
                }
            },
        })
    },
    deleteFile: (fileId: string) => api.delete(`/upload/${fileId}`),
}
