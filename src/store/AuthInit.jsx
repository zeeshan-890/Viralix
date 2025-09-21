'use client';
import { useEffect } from 'react';
import { useAuthStore } from './authStore';

export default function AuthInit() {
    const init = useAuthStore(s => s.init);
    useEffect(() => {
        // Avoid init on auth pages to prevent redirect loops from 401
        if (typeof window !== 'undefined') {
            const path = window.location?.pathname || '';
            if (path.startsWith('/auth')) return;
        }
        init();
    }, [init]);
    return null;
}
