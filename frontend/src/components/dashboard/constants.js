import { Facebook, Instagram, Music2, Youtube } from 'lucide-react';

export const PLATFORM_CONFIG = {
    facebook: { label: 'Facebook', icon: Facebook, color: '#1877F2', bg: '#EBF3FE' },
    instagram: { label: 'Instagram', icon: Instagram, color: '#E4405F', bg: '#FDEEF1' },
    tiktok: { label: 'TikTok', icon: Music2, color: '#010101', bg: '#F3F3F3' },
    youtube: { label: 'YouTube', icon: Youtube, color: '#FF0000', bg: '#FEECEC' },
};

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
