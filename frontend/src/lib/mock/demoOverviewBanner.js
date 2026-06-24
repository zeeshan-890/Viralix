/**
 * Dummy data for previewing overview platform cards.
 * Use: /dashboard/analytics?demo=overview
 * Or enable mock mode (NEXT_PUBLIC_USE_MOCK_DATA=true).
 */

function sumEngagement(target, source = {}) {
    target.likes += source.likes || 0;
    target.comments += source.comments || 0;
    target.shares += source.shares || 0;
    target.views += source.views || 0;
}

export function buildDemoPlatformBreakdown(accountBreakdown) {
    const result = {};
    Object.entries(accountBreakdown).forEach(([key, stats]) => {
        const platformId = stats.platform || key.split(':')[0];
        if (!result[platformId]) {
            result[platformId] = {
                posts: 0,
                published: 0,
                scheduled: 0,
                draft: 0,
                failed: 0,
                engagement: { likes: 0, comments: 0, shares: 0, views: 0 },
            };
        }
        const bucket = result[platformId];
        bucket.posts += stats.posts || 0;
        bucket.published += stats.published || 0;
        bucket.scheduled += stats.scheduled || 0;
        bucket.draft += stats.draft || 0;
        bucket.failed += stats.failed || 0;
        sumEngagement(bucket.engagement, stats.engagement);
    });
    return result;
}

export const DEMO_OVERVIEW_BANNER = {
    overview: {
        totalPosts: 24,
        publishedPosts: 14,
        scheduledPosts: 5,
        draftPosts: 3,
        failedPosts: 2,
        totalViews: 186420,
        totalLikes: 14280,
        totalComments: 934,
        totalShares: 612,
        totalReach: 124500,
        totalFollowers: 104600,
        totalEngagement: 15826,
        engagementRate: 8.49,
    },
    accounts: [
        {
            _id: 'demo-ig-1',
            platform: 'instagram',
            platformAccountId: 'ig-demo-001',
            accountId: 'ig-demo-001',
            accountName: 'Viralix Official',
            username: 'viralix.official',
            followerCount: 28700,
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=VO&backgroundColor=E4405F',
            isActive: true,
        },
        {
            _id: 'demo-ig-2',
            platform: 'instagram',
            platformAccountId: 'ig-demo-002',
            accountId: 'ig-demo-002',
            accountName: 'Viralix Clips',
            username: 'viralix.clips',
            followerCount: 12400,
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=VC&backgroundColor=833AB4',
            isActive: true,
        },
        {
            _id: 'demo-tt-1',
            platform: 'tiktok',
            platformAccountId: 'tt-demo-001',
            accountId: 'tt-demo-001',
            accountName: 'Viralix Creators',
            username: 'viralix_creators',
            followerCount: 45200,
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=VC&backgroundColor=010101',
            isActive: true,
        },
        {
            _id: 'demo-tt-2',
            platform: 'tiktok',
            platformAccountId: 'tt-demo-002',
            accountId: 'tt-demo-002',
            accountName: 'Shani Clips',
            username: 'shaniclips',
            followerCount: 3200,
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=SC&backgroundColor=ff6b35',
            isActive: true,
        },
        {
            _id: 'demo-yt-1',
            platform: 'youtube',
            platformAccountId: 'yt-demo-001',
            accountId: 'yt-demo-001',
            accountName: 'Viralix Media',
            username: 'ViralixMedia',
            followerCount: 18300,
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=VM&backgroundColor=ff0000',
            isActive: true,
        },
        {
            _id: 'demo-fb-1',
            platform: 'facebook',
            platformAccountId: 'fb-demo-001',
            accountId: 'fb-demo-001',
            accountName: 'Viralix Brand',
            username: 'viralixbrand',
            followerCount: 12400,
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=VB&backgroundColor=1877F2',
            isActive: true,
        },
    ],
    accountBreakdown: {
        'instagram:ig-demo-001': {
            platform: 'instagram',
            accountId: 'ig-demo-001',
            posts: 8,
            published: 6,
            scheduled: 1,
            draft: 1,
            failed: 0,
            engagement: { views: 48200, likes: 6200, comments: 412, shares: 198 },
        },
        'instagram:ig-demo-002': {
            platform: 'instagram',
            accountId: 'ig-demo-002',
            posts: 5,
            published: 4,
            scheduled: 1,
            draft: 0,
            failed: 0,
            engagement: { views: 22400, likes: 3100, comments: 186, shares: 94 },
        },
        'tiktok:tt-demo-001': {
            platform: 'tiktok',
            accountId: 'tt-demo-001',
            posts: 6,
            published: 5,
            scheduled: 1,
            draft: 0,
            failed: 0,
            engagement: { views: 68400, likes: 8200, comments: 520, shares: 1240 },
        },
        'tiktok:tt-demo-002': {
            platform: 'tiktok',
            accountId: 'tt-demo-002',
            posts: 2,
            published: 1,
            scheduled: 0,
            draft: 1,
            failed: 0,
            engagement: { views: 1420, likes: 89, comments: 12, shares: 34 },
        },
        'youtube:yt-demo-001': {
            platform: 'youtube',
            accountId: 'yt-demo-001',
            posts: 4,
            published: 3,
            scheduled: 1,
            draft: 0,
            failed: 0,
            engagement: { views: 35600, likes: 2100, comments: 284, shares: 156 },
        },
        'facebook:fb-demo-001': {
            platform: 'facebook',
            accountId: 'fb-demo-001',
            posts: 5,
            published: 4,
            scheduled: 1,
            draft: 0,
            failed: 0,
            engagement: { views: 10400, likes: 1580, comments: 98, shares: 72 },
        },
    },
};
