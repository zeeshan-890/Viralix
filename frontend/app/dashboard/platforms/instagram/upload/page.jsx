'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function InstagramUploadRedirectInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const qs = searchParams.toString();
        router.replace(qs ? `/dashboard/platforms/instagram?${qs}` : '/dashboard/platforms/instagram?create=1');
    }, [router, searchParams]);

    return null;
}

/** Legacy route — Instagram upload now opens as a modal on the platform page. */
export default function InstagramUploadRedirect() {
    return (
        <Suspense fallback={null}>
            <InstagramUploadRedirectInner />
        </Suspense>
    );
}
