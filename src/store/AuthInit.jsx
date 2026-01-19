'use client';
import { useEffect } from 'react';
import { useAuthStore } from './authStore';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthInit() {
    const init = useAuthStore(s => s.init);
    const { user, loading } = useAuthStore(s => ({ user: s.user, loading: s.loading }));
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        init();
    }, [init]);

    useEffect(() => {
        if (!loading && user) {
            const isPublicPage = pathname === '/' || pathname.startsWith('/auth');
            if (isPublicPage) {
                router.replace('/dashboard');
            }
        }
    }, [user, loading, pathname, router]);

    return null;
}
