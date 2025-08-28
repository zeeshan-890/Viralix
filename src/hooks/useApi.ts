'use client'

import { useState, useEffect } from 'react'
import api from '../lib/api'

interface UseApiOptions {
    immediate?: boolean
}

interface UseApiReturn<T> {
    data: T | null
    loading: boolean
    error: string | null
    execute: (...args: any[]) => Promise<T>
    reset: () => void
}

export function useApi<T = any>(
    apiFunction: (...args: any[]) => Promise<{ data: T }>,
    options: UseApiOptions = {}
): UseApiReturn<T> {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const execute = async (...args: any[]): Promise<T> => {
        try {
            setLoading(true)
            setError(null)
            const response = await apiFunction(...args)
            setData(response.data)
            return response.data
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'An error occurred'
            setError(errorMessage)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setData(null)
        setError(null)
        setLoading(false)
    }

    useEffect(() => {
        if (options.immediate) {
            execute()
        }
    }, [options.immediate])

    return { data, loading, error, execute, reset }
}

// Specific API hooks
export function useCampaigns() {
    return useApi(() => api.get('/campaigns'), { immediate: true })
}

export function useAnalytics(platform?: string, dateRange?: string) {
    return useApi(
        () => api.get('/analytics/overview', { params: { platform, dateRange } }),
        { immediate: true }
    )
}

export function useConnectedPlatforms() {
    return useApi(() => api.get('/platforms/connected'), { immediate: true })
}
