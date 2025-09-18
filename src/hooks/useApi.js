'use client';
import { useState, useEffect } from 'react';
import api from '../lib/api';
export function useApi(apiFunction, options = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const execute = async (...args) => {
        var _a, _b;
        try {
            setLoading(true);
            setError(null);
            const response = await apiFunction(...args);
            setData(response.data);
            return response.data;
        }
        catch (err) {
            const errorMessage = ((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err.message || 'An error occurred';
            setError(errorMessage);
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const reset = () => {
        setData(null);
        setError(null);
        setLoading(false);
    };
    useEffect(() => {
        if (options.immediate) {
            execute();
        }
    }, [options.immediate]);
    return { data, loading, error, execute, reset };
}
// Specific API hooks
export function useCampaigns() {
    return useApi(() => api.get('/campaigns'), { immediate: true });
}
export function useAnalytics(platform, dateRange) {
    return useApi(() => api.get('/analytics/overview', { params: { platform, dateRange } }), { immediate: true });
}
export function useConnectedPlatforms() {
    return useApi(() => api.get('/platforms/connected'), { immediate: true });
}
