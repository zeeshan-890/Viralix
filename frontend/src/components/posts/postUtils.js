import { formatDistanceToNow } from 'date-fns';

export function getPostStatus(post) {
    if (post?.status) return post.status;
    if (post?.isPublished) return 'published';
    if (post?.isScheduled) return 'scheduled';
    const statuses = (post?.platforms || []).map((p) => p.status);
    if (statuses.includes('failed')) return 'failed';
    if (statuses.includes('processing')) return 'processing';
    if (statuses.includes('published')) return 'published';
    if (statuses.includes('scheduled')) return 'scheduled';
    return 'draft';
}

export function formatRelativeDate(dateString) {
    if (!dateString) return '—';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function aggregateEngagement(post) {
    return (post.platforms || []).reduce(
        (acc, p) => {
            const e = p.engagement || {};
            acc.views += e.views || 0;
            acc.likes += e.likes || 0;
            acc.comments += e.comments || 0;
            acc.shares += e.shares || 0;
            return acc;
        },
        { views: 0, likes: 0, comments: 0, shares: 0 }
    );
}

export const STATUS_LABELS = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    published: 'Published',
    failed: 'Failed',
    processing: 'Processing',
};
