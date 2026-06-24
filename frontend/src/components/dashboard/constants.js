export { PLATFORM_CONFIG, PLATFORMS, PLATFORM_LIST, getPlatform, platformButtonClass, platformButtonStyle } from '@/config/platforms';

export const STATUS_CONFIG = {
    draft: { label: 'Draft', variant: 'default', dot: '#94A3B8' },
    scheduled: { label: 'Scheduled', variant: 'warning', dot: '#D97706' },
    published: { label: 'Published', variant: 'success', dot: '#52796F' },
    failed: { label: 'Failed', variant: 'danger', dot: '#DC2626' },
};

export function aggregatePostMetrics(post) {
    return (post.platforms || []).reduce(
        (acc, p) => {
            const e = p.engagement || {};
            acc.likes += e.likes || 0;
            acc.comments += e.comments || 0;
            acc.shares += e.shares || 0;
            acc.views += e.views || 0;
            return acc;
        },
        { likes: 0, comments: 0, shares: 0, views: 0 }
    );
}

export function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}
