'use client';

import { Suspense } from 'react';
import UploadPage from '@/components/upload/UploadPage';
import { Loader2 } from 'lucide-react';

function UploadFallback() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#84A98C]" />
            <p className="text-sm text-[#52796F]">Loading composer…</p>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<UploadFallback />}>
            <UploadPage />
        </Suspense>
    );
}
