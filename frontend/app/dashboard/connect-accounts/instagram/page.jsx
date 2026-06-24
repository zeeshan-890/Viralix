'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy FB-linked Instagram list — redirects to Instagram Login (direct OAuth). */
export default function InstagramAccountsRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard/connect-accounts/instagram-oauth');
    }, [router]);
    return (
        <div className="py-12 text-center text-sm text-gray-500">
            Redirecting to Instagram Login…
        </div>
    );
}
