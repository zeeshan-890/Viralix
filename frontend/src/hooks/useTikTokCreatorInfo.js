'use client';

import { useState, useEffect, useCallback } from 'react';
import { tiktokAPI } from '@/lib/api';

const cache = new Map();
const CACHE_MS = 60_000;

export function useTikTokCreatorInfo(accountId) {
    const [info, setInfo] = useState(() => {
        const hit = cache.get(accountId);
        return hit && Date.now() - hit.at < CACHE_MS ? hit.data : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        if (!accountId) {
            setInfo(null);
            setError(null);
            return;
        }
        const hit = cache.get(accountId);
        if (hit && Date.now() - hit.at < CACHE_MS) {
            setInfo(hit.data);
            setError(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data } = await tiktokAPI.creatorInfo(accountId);
            cache.set(accountId, { data, at: Date.now() });
            setInfo(data);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load TikTok status');
            setInfo(null);
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { info, loading, error, refresh };
}
