'use client';

import { Suspense } from 'react';
import PostsListPage from '@/components/posts/PostsListPage';
import { Loader2 } from 'lucide-react';

function PostsFallback() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#84A98C]" />
            <p className="text-sm text-[#52796F]">Loading posts…</p>
        </div>
    );
}

export default function PreviewPage() {
    return (
        <Suspense fallback={<PostsFallback />}>
            <PostsListPage />
        </Suspense>
    );
}
