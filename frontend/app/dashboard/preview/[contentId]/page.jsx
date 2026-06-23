'use client';

import React from 'react';
import PostDetailView from '@/components/posts/PostDetailView';

export default function PostDetailPage({ params }) {
    const { contentId } = React.use(params);
    return <PostDetailView contentId={contentId} />;
}
