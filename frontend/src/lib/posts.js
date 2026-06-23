/**
 * Normalize backend Post documents for dashboard UI.
 * Backend uses isDraft/isScheduled/isPublished + platforms[].status;
 * frontend components expect a top-level `status` field.
 */
export function derivePostStatus(post) {
    if (post?.status) return post.status;

    const platformStatuses = (post?.platforms || []).map((p) => p.status).filter(Boolean);
    if (platformStatuses.includes('failed')) return 'failed';
    if (post?.isPublished || (platformStatuses.length && platformStatuses.every((s) => s === 'published'))) {
        return 'published';
    }
    if (post?.isScheduled || platformStatuses.some((s) => s === 'scheduled' || s === 'processing')) {
        return 'scheduled';
    }
    return 'draft';
}

export function normalizePost(post) {
    if (!post) return post;
    return {
        ...post,
        _id: post._id,
        status: derivePostStatus(post),
        scheduledAt: post.scheduledAt || post.scheduledDate,
    };
}

export function normalizePosts(posts) {
    return (posts || []).map(normalizePost);
}
