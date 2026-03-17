'use client';
import { useEffect } from 'react';
import { useAuthStore } from './authStore';

export default function AuthInit() {
    const init = useAuthStore(s => s.init);

    useEffect(() => {
        init();
    }, [init]);

    // No automatic redirects - users can freely navigate between pages
    // regardless of authentication state

    return null;
}
