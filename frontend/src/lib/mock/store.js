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
