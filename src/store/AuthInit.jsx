'use client';
import { useEffect } from 'react';
import { useAuthStore } from './authStore';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthInit() {
    const init = useAuthStore(s => s.init);
    const user = useAuthStore(s => s.user);
    const loading = useAuthStore(s => s.loading);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        init();
    }, [init]);

    useEffect(() => {
        if (!loading && user) {
            // Pages that should redirect logged-in users to dashboard
            const isLandingOrAuth = pathname === '/' || pathname.startsWith('/auth');
            // Legal/info pages should NOT redirect (must be publicly accessible)
            const isPublicInfoPage = pathname.startsWith('/privacy') ||
                pathname.startsWith('/terms') ||
                pathname.startsWith('/about');

            if (isLandingOrAuth && !isPublicInfoPage) {
                router.replace('/dashboard');
            }
        }
    }, [user, loading, pathname, router]);

    return null;
}
