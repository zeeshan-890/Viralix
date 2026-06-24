import { createInitialStore } from './fixtures';

const STORAGE_KEY = 'viralix_mock_store';

let memoryStore = null;

function loadFromStorage() {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        // ignore corrupt storage
    }
    return null;
}

function saveToStorage(store) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
        // ignore quota errors
    }
}

const DEMO_STORE_VERSION = 2;

export function getMockStore() {
    if (!memoryStore) {
        memoryStore = loadFromStorage() || createInitialStore();
    }
    if (memoryStore.demoStoreVersion !== DEMO_STORE_VERSION) {
        memoryStore = createInitialStore();
        memoryStore.demoStoreVersion = DEMO_STORE_VERSION;
        saveToStorage(memoryStore);
    }
    return memoryStore;
}

export function resetMockStore() {
    memoryStore = createInitialStore();
    saveToStorage(memoryStore);
    return memoryStore;
}

export function persistMockStore() {
    if (memoryStore) saveToStorage(memoryStore);
}

export function nextMockId(prefix = 'id') {
    const store = getMockStore();
    store.nextId = (store.nextId || 1000) + 1;
    persistMockStore();
    return `${prefix}-${store.nextId}`;
}

export function derivePostStatus(post) {
    if (post.status) return post.status;
    const platforms = post.platforms || [];
    if (platforms.some((p) => p.status === 'failed')) return 'failed';
    if (platforms.some((p) => p.status === 'processing')) return 'processing';
    if (platforms.length && platforms.every((p) => p.status === 'published')) return 'published';
    if (platforms.some((p) => p.status === 'scheduled') || post.isScheduled) return 'scheduled';
    return 'draft';
}

export function enrichPost(post) {
    const status = derivePostStatus(post);
    return {
        ...post,
        status,
        scheduledAt: post.scheduledAt || post.scheduledDate || null,
    };
}

export function getPostsList(params = {}) {
    const store = getMockStore();
    let posts = store.posts.map(enrichPost);

    if (params.status) {
        posts = posts.filter((p) => p.status === params.status);
    }
    if (params.platform) {
        posts = posts.filter((p) => p.platforms?.some((pl) => pl.name === params.platform));
    }
    if (params.month && params.year) {
        const month = parseInt(params.month, 10);
        const year = parseInt(params.year, 10);
        posts = posts.filter((p) => {
            const d = new Date(p.scheduledDate || p.scheduledAt || p.createdAt);
            return d.getMonth() + 1 === month && d.getFullYear() === year;
        });
    }
    if (params.startDate && params.endDate) {
        const start = new Date(params.startDate);
        const end = new Date(params.endDate);
        posts = posts.filter((p) => {
            const d = new Date(p.scheduledDate || p.scheduledAt || p.createdAt);
            return d >= start && d <= end;
        });
    }

    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const limit = parseInt(params.limit, 10) || 20;
    const page = parseInt(params.page, 10) || 1;
    const start = (page - 1) * limit;
    const slice = posts.slice(start, start + limit);

    return {
        posts: slice,
        pagination: { current: page, pages: Math.ceil(posts.length / limit) || 1, total: posts.length },
    };
}

export function buildAnalyticsOverview() {
    const store = getMockStore();
    const posts = store.posts.map(enrichPost);

    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalViews = 0;

    const platformBreakdown = {};
    const accountBreakdown = {};

    const addStats = (bucket, platform) => {
        bucket.posts++;
        if (bucket[platform.status] !== undefined) bucket[platform.status]++;
        if (platform.engagement) {
            bucket.engagement.likes += platform.engagement.likes || 0;
            bucket.engagement.comments += platform.engagement.comments || 0;
            bucket.engagement.shares += platform.engagement.shares || 0;
            bucket.engagement.views += platform.engagement.views || 0;
        }
    };

    posts.forEach((post) => {
        (post.platforms || []).forEach((platform) => {
            if (!platformBreakdown[platform.name]) {
                platformBreakdown[platform.name] = {
                    posts: 0, published: 0, scheduled: 0, draft: 0, failed: 0,
                    engagement: { likes: 0, comments: 0, shares: 0, views: 0 },
                };
            }
            addStats(platformBreakdown[platform.name], platform);

            const accKey = `${platform.name}:${platform.accountId}`;
            if (!accountBreakdown[accKey]) {
                accountBreakdown[accKey] = {
                    platform: platform.name,
                    accountId: platform.accountId,
                    posts: 0, published: 0, scheduled: 0, draft: 0, failed: 0,
                    engagement: { likes: 0, comments: 0, shares: 0, views: 0 },
                };
            }
            addStats(accountBreakdown[accKey], platform);

            if (platform.engagement) {
                totalLikes += platform.engagement.likes || 0;
                totalComments += platform.engagement.comments || 0;
                totalShares += platform.engagement.shares || 0;
                totalViews += platform.engagement.views || 0;
            }
        });
    });

    const totalFollowers = store.accounts.reduce((s, a) => s + (a.followerCount || 0), 0);
    const engagementRate = totalViews > 0
        ? Math.round(((totalLikes + totalComments + totalShares) / totalViews) * 10000) / 100
        : 4.2;

    return {
        overview: {
            totalPosts: posts.length,
            publishedPosts: posts.filter((p) => p.status === 'published').length,
            scheduledPosts: posts.filter((p) => p.status === 'scheduled').length,
            draftPosts: posts.filter((p) => p.status === 'draft').length,
            failedPosts: posts.filter((p) => p.status === 'failed').length,
            totalViews: totalViews || 128400,
            totalLikes: totalLikes || 9840,
            totalComments: totalComments || 742,
            totalShares: totalShares || 389,
            totalReach: 95600,
            totalFollowers,
            totalEngagement: totalLikes + totalComments + totalShares,
            engagementRate,
        },
        platformBreakdown,
        accountBreakdown,
        dateRange: {
            startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
            endDate: new Date().toISOString(),
        },
    };
}

const DEEP_MOCK_POSTS = {
    tiktok: [
        { id: 'tt-v-001', accountId: 'tt-open-301', title: 'Summer launch teaser', views: 22100, likes: 2100, comments: 178, shares: 412, mediaType: 'video' },
        { id: 'tt-v-002', accountId: 'tt-open-301', title: 'Tips for creators', views: 18400, likes: 1650, comments: 142, shares: 298, mediaType: 'video' },
        { id: 'tt-v-003', accountId: 'tt-open-302', title: 'Day in the life', views: 1420, likes: 89, comments: 12, shares: 34, mediaType: 'video' },
    ],
    instagram: [
        { id: 'ig-p-001', accountId: 'ig-user-201', title: 'Product launch carousel', views: 8420, likes: 1240, comments: 89, shares: 34, saves: 120, mediaType: 'image' },
        { id: 'ig-p-002', accountId: 'ig-user-202', title: 'Reel: Quick tips', views: 12400, likes: 1840, comments: 92, shares: 48, saves: 86, mediaType: 'reel' },
        { id: 'ig-p-003', accountId: 'ig-user-201', title: 'Behind the scenes', views: 5200, likes: 680, comments: 45, shares: 22, saves: 40, mediaType: 'image' },
    ],
};

function engagementRate(views, engagement) {
    if (!views) return 0;
    return Math.round((engagement / views) * 10000) / 100;
}

/** Mock deep analytics for TikTok / Instagram (matches backend shape) */
export function buildDeepAnalyticsMock(platform, params = {}) {
    const store = getMockStore();
    const { period = '30d', accountId } = params;

    if (!['tiktok', 'instagram'].includes(platform)) {
        throw new Error('Unsupported platform');
    }

    const platformAccounts = store.accounts.filter(
        (a) => a.platform === platform && a.isActive !== false
    );
    const filteredAccounts = accountId
        ? platformAccounts.filter(
            (a) => a.platformAccountId === accountId || a.accountId === accountId
        )
        : platformAccounts;

    const accountIds = new Set(
        filteredAccounts.map((a) => a.platformAccountId || a.accountId)
    );

    let posts = (DEEP_MOCK_POSTS[platform] || []).filter((p) => accountIds.has(p.accountId));
    if (!posts.length && filteredAccounts.length) {
        const accId = filteredAccounts[0].platformAccountId || filteredAccounts[0].accountId;
        posts = [{
            id: `${platform}-demo-1`,
            accountId: accId,
            title: 'Synced content',
            views: 14,
            likes: 0,
            comments: 0,
            shares: 0,
            saves: 0,
            mediaType: platform === 'tiktok' ? 'video' : 'image',
        }];
    }

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalSaves = 0;
    const byAccount = {};
    const byMediaType = {};
    const timeline = {};

    const now = Date.now();
    posts.forEach((p, i) => {
        totalViews += p.views;
        totalLikes += p.likes;
        totalComments += p.comments;
        totalShares += p.shares;
        totalSaves += p.saves || 0;

        if (!byAccount[p.accountId]) {
            byAccount[p.accountId] = { accountId: p.accountId, posts: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, engagement: 0 };
        }
        const eng = p.likes + p.comments + p.shares + (p.saves || 0);
        byAccount[p.accountId].posts += 1;
        byAccount[p.accountId].views += p.views;
        byAccount[p.accountId].likes += p.likes;
        byAccount[p.accountId].comments += p.comments;
        byAccount[p.accountId].shares += p.shares;
        byAccount[p.accountId].saves += p.saves || 0;
        byAccount[p.accountId].engagement += eng;

        const mt = p.mediaType || 'unknown';
        if (!byMediaType[mt]) {
            byMediaType[mt] = { type: mt, count: 0, views: 0, likes: 0, engagement: 0 };
        }
        byMediaType[mt].count += 1;
        byMediaType[mt].views += p.views;
        byMediaType[mt].likes += p.likes;
        byMediaType[mt].engagement += eng;

        const day = new Date(now - i * 3 * 86400000).toISOString().split('T')[0];
        if (!timeline[day]) {
            timeline[day] = { date: day, views: 0, likes: 0, comments: 0, shares: 0, engagement: 0, posts: 0 };
        }
        timeline[day].views += p.views;
        timeline[day].likes += p.likes;
        timeline[day].comments += p.comments;
        timeline[day].shares += p.shares;
        timeline[day].engagement += eng;
        timeline[day].posts += 1;
    });

    const postCount = posts.length;
    const totalEngagement = totalLikes + totalComments + totalShares + totalSaves;

    const mapPost = (p) => {
        const eng = p.likes + p.comments + p.shares + (p.saves || 0);
        return {
            id: p.id,
            accountId: p.accountId,
            title: p.title,
            description: '',
            thumbnail: null,
            mediaType: p.mediaType,
            permalink: null,
            publishedAt: new Date(now - 86400000).toISOString(),
            lastSyncedAt: new Date().toISOString(),
            metrics: {
                views: p.views,
                likes: p.likes,
                comments: p.comments,
                shares: p.shares,
                saves: p.saves || 0,
                engagement: eng,
                engagementRate: engagementRate(p.views, eng),
                likeRate: engagementRate(p.views, p.likes),
                commentRate: engagementRate(p.views, p.comments),
                shareRate: engagementRate(p.views, p.shares),
            },
            detailUrl: `/dashboard/platforms/${platform}/post/${p.id}`,
        };
    };

    const mapped = posts.map(mapPost);
    const topByViews = [...mapped].sort((a, b) => b.metrics.views - a.metrics.views).slice(0, 10);

    const accountMeta = filteredAccounts.map((acc) => {
        const accId = acc.platformAccountId || acc.accountId;
        const stats = byAccount[accId] || { posts: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, engagement: 0 };
        const base = {
            accountId: accId,
            accountName: acc.accountName,
            username: acc.username,
            avatarUrl: acc.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(acc.accountName || accId)}`,
            followers: acc.followerCount || 0,
            contentStats: stats,
            avgViewsPerPost: stats.posts ? Math.round(stats.views / stats.posts) : 0,
            avgEngagementPerPost: stats.posts ? Math.round(stats.engagement / stats.posts) : 0,
        };
        if (platform === 'tiktok') {
            return { ...base, videoCount: stats.posts + 12, following: 120, likes: 45000 };
        }
        return {
            ...base,
            following: 890,
            mediaCount: stats.posts + 8,
            accountInsights: { reach: 4200, profile_views: 890, accounts_engaged: 312, total_interactions: stats.engagement },
        };
    });

    return {
        platform,
        period,
        accountId: accountId || null,
        generatedAt: new Date().toISOString(),
        summary: {
            totalPosts: postCount,
            totalViews,
            totalLikes,
            totalComments,
            totalShares,
            totalSaves,
            totalEngagement,
            engagementRate: engagementRate(totalViews, totalEngagement),
            avgViewsPerPost: postCount ? Math.round(totalViews / postCount) : 0,
            avgLikesPerPost: postCount ? Math.round(totalLikes / postCount) : 0,
            avgCommentsPerPost: postCount ? Math.round(totalComments / postCount) : 0,
            avgEngagementPerPost: postCount ? Math.round(totalEngagement / postCount) : 0,
            likeToViewRatio: engagementRate(totalViews, totalLikes),
            commentToViewRatio: engagementRate(totalViews, totalComments),
            shareToViewRatio: engagementRate(totalViews, totalShares),
        },
        accounts: accountMeta,
        accountBreakdown: Object.values(byAccount),
        mediaTypeBreakdown: Object.values(byMediaType),
        timeline: Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date)),
        topPosts: {
            byViews: topByViews,
            byEngagement: [...mapped].sort((a, b) => b.metrics.engagement - a.metrics.engagement).slice(0, 10),
            byEngagementRate: [...mapped].filter((p) => p.metrics.views >= 100).sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate).slice(0, 10),
        },
        allPosts: mapped,
    };
}

export function getConnectedAccountsResponse() {
    const store = getMockStore();
    const accounts = store.accounts;
    return {
        success: true,
        count: accounts.length,
        accounts,
        byPlatform: {
            facebook: accounts.filter((a) => a.platform === 'facebook'),
            instagram: accounts.filter((a) => a.platform === 'instagram'),
            tiktok: accounts.filter((a) => a.platform === 'tiktok'),
            youtube: accounts.filter((a) => a.platform === 'youtube'),
            twitter: [],
            linkedin: [],
        },
    };
}
