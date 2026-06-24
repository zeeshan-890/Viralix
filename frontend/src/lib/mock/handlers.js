import {
    getMockStore,
    persistMockStore,
    nextMockId,
    enrichPost,
    derivePostStatus,
    getPostsList,
    buildAnalyticsOverview,
    buildDeepAnalyticsMock,
    getConnectedAccountsResponse,
} from './store';
import { MOCK_USER, MOCK_TOKEN } from './fixtures';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80';

function delay(ms = 180) {
    return new Promise((r) => setTimeout(r, ms + Math.random() * 120));
}

function parseBody(data) {
    if (!data) return {};
    if (typeof data === 'string') {
        try { return JSON.parse(data); } catch { return {}; }
    }
    if (data instanceof FormData) return { _formData: data };
    return data;
}

function getPath(config) {
    let path = config.url || '';
    const q = path.indexOf('?');
    if (q >= 0) path = path.slice(0, q);
    if (!path.startsWith('/')) path = '/' + path;
    return path;
}

function mockOrigin() {
    if (typeof window !== 'undefined') return window.location.origin;
    return 'http://localhost:3000';
}

function addAccount(platform, name, accountId, followers = 10000) {
    const store = getMockStore();
    if (store.accounts.some((a) => a.platform === platform && a.platformAccountId === accountId)) return;
    store.accounts.push({
        _id: nextMockId(`acc-${platform}`),
        platform,
        platformAccountId: accountId,
        accountId,
        accountName: name,
        followerCount: followers,
        connectedAt: new Date().toISOString(),
        isActive: true,
    });
    persistMockStore();
}

function removeAccount(platform, accountId) {
    const store = getMockStore();
    store.accounts = store.accounts.filter(
        (a) => !(a.platform === platform && (a.platformAccountId === accountId || a.accountId === accountId))
    );
    persistMockStore();
}

/** @param {import('axios').InternalAxiosRequestConfig} config */
export async function handleMockRequest(config) {
    await delay();
    const method = (config.method || 'get').toLowerCase();
    const path = getPath(config);
    const body = parseBody(config.data);
    const params = config.params || {};
    const store = getMockStore();

    // ─── Auth ───
    if (method === 'post' && path === '/auth/login') {
        return { token: MOCK_TOKEN, user: store.user, requiresVerification: false };
    }
    if (method === 'post' && path === '/auth/signup') {
        return { user: { ...store.user, name: body.name, email: body.email }, requiresVerification: false, token: MOCK_TOKEN };
    }
    if (method === 'post' && path === '/auth/verify-otp') {
        return { token: MOCK_TOKEN, user: store.user };
    }
    if (method === 'post' && path === '/auth/resend-otp') {
        return { message: 'OTP sent' };
    }
    if (method === 'post' && path === '/auth/forgot-password') {
        return { message: 'Reset link sent' };
    }
    if (method === 'post' && path === '/auth/reset-password') {
        return { message: 'Password reset successful' };
    }
    if (method === 'get' && path === '/auth/me') {
        return store.user;
    }
    if (method === 'post' && path === '/auth/logout') {
        return { message: 'Logged out' };
    }
    if (method === 'put' && path === '/auth/profile') {
        store.user = { ...store.user, ...body };
        persistMockStore();
        return store.user;
    }
    if (method === 'post' && path === '/auth/change-password') {
        return { message: 'Password changed' };
    }
    if (method === 'delete' && path === '/users/account') {
        return { message: 'Account deleted' };
    }

    // ─── Posts ───
    if (method === 'get' && path === '/posts') {
        return getPostsList({ ...params, ...(config.url?.includes('?') ? Object.fromEntries(new URLSearchParams(config.url.split('?')[1])) : {}) });
    }
    if (method === 'get' && path.match(/^\/posts\/[^/]+$/)) {
        const id = path.split('/')[2];
        const post = store.posts.find((p) => p._id === id);
        if (!post) throw mockError(404, 'Post not found');
        return enrichPost(post);
    }
    if (method === 'post' && path === '/posts') {
        const isScheduled = !!body.scheduledDate || body.isScheduled;
        const post = {
            _id: nextMockId('post'),
            title: body.title || 'Untitled',
            content: body.content || body.description || '',
            hashtags: body.hashtags || body.tags || [],
            media: body.media || [],
            platforms: (body.platforms || []).map((p) => ({
                name: p.name,
                accountId: p.accountId,
                status: isScheduled ? 'scheduled' : 'draft',
            })),
            isScheduled,
            isPublished: false,
            isDraft: !isScheduled,
            scheduledDate: body.scheduledDate || null,
            scheduledAt: body.scheduledDate || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        store.posts.unshift(post);
        persistMockStore();
        return enrichPost(post);
    }
    if (method === 'put' && path.match(/^\/posts\/[^/]+$/)) {
        const id = path.split('/')[2];
        const idx = store.posts.findIndex((p) => p._id === id);
        if (idx < 0) throw mockError(404, 'Post not found');
        const updated = { ...store.posts[idx], ...body, updatedAt: new Date().toISOString() };
        if (body.platforms) updated.platforms = body.platforms;
        if (body.scheduledDate) {
            updated.scheduledDate = body.scheduledDate;
            updated.scheduledAt = body.scheduledDate;
            updated.isScheduled = body.isScheduled !== false;
            updated.isDraft = false;
            updated.status = 'scheduled';
            updated.platforms = (updated.platforms || []).map((p) =>
                p.status === 'published' ? p : { ...p, status: 'scheduled' }
            );
        }
        if (body.isScheduled !== undefined && !body.scheduledDate) {
            updated.isScheduled = body.isScheduled;
            updated.scheduledDate = body.scheduledDate || updated.scheduledDate;
            updated.scheduledAt = updated.scheduledDate;
        }
        store.posts[idx] = updated;
        persistMockStore();
        return enrichPost(updated);
    }
    if (method === 'delete' && path.match(/^\/posts\/[^/]+$/)) {
        const id = path.split('/')[2];
        store.posts = store.posts.filter((p) => p._id !== id);
        persistMockStore();
        return { message: 'Post deleted' };
    }
    if (method === 'post' && path.match(/^\/posts\/[^/]+\/publish$/)) {
        const id = path.split('/')[2];
        const post = store.posts.find((p) => p._id === id);
        if (!post) throw mockError(404, 'Post not found');
        post.platforms = (post.platforms || []).map((p) =>
            p.status !== 'published' ? { ...p, status: 'published', publishedAt: new Date().toISOString(), engagement: { views: 1200, likes: 84, comments: 12, shares: 6 } } : p
        );
        post.isPublished = true;
        post.isDraft = false;
        post.isScheduled = false;
        post.status = 'published';
        post.updatedAt = new Date().toISOString();
        persistMockStore();
        return enrichPost(post);
    }
    if (method === 'post' && path.match(/^\/posts\/[^/]+\/remix$/)) {
        const id = path.split('/')[2];
        const post = store.posts.find((p) => p._id === id);
        if (!post) throw mockError(404, 'Post not found');
        return { ...enrichPost(post), content: `${post.content}\n\n✨ Remixed for ${body.platform || 'social'} with a ${body.tone || 'engaging'} tone.` };
    }

    // ─── Analytics ───
    if (method === 'get' && path === '/analytics/overview') return buildAnalyticsOverview();
    if (method === 'get' && path.match(/^\/analytics\/deep\/(tiktok|instagram)$/)) {
        const platform = path.split('/')[3];
        return buildDeepAnalyticsMock(platform, params);
    }
    if (method === 'post' && path === '/analytics/refresh') return { message: 'Analytics refreshed', updated: 6 };
    if (method === 'get' && path === '/analytics/performance') {
        const days = params.period === '7d' ? 7 : params.period === '90d' ? 90 : params.period === '1y' ? 365 : 30;
        const timeline = Array.from({ length: Math.min(days, 30) }, (_, i) => {
            const d = new Date(Date.now() - (Math.min(days, 30) - 1 - i) * 86400000);
            return {
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                views: 800 + Math.floor(Math.random() * 2400),
                engagement: 40 + Math.floor(Math.random() * 120),
                followers: 104000 + i * 120,
                reach: 1200 + Math.floor(Math.random() * 800),
            };
        });
        return { timeline, period: params.period || '30d' };
    }
    if (method === 'get' && path === '/analytics/content-performance') {
        const topPerformingPosts = store.posts
            .filter((p) => derivePostStatus(p) === 'published')
            .map((p) => {
                const eng = p.platforms?.[0]?.engagement || {};
                const totalLikes = eng.likes || 0;
                const totalComments = eng.comments || 0;
                const totalShares = eng.shares || 0;
                const totalViews = eng.views || 0;
                return {
                    id: p._id,
                    title: p.title,
                    content: p.content,
                    platforms: p.platforms,
                    media: p.media,
                    publishedAt: p.platforms?.[0]?.publishedAt || p.updatedAt,
                    metrics: {
                        totalViews,
                        totalLikes,
                        totalEngagement: totalLikes + totalComments + totalShares,
                        engagementRate: totalViews > 0 ? Math.round(((totalLikes + totalComments) / totalViews) * 1000) / 10 : 0,
                        platformCount: p.platforms?.length || 0,
                    },
                };
            });
        return { topPerformingPosts };
    }
    if (method === 'get' && path.match(/^\/analytics\/platform\//)) {
        const platform = path.split('/')[3];
        return { platform, metrics: { followers: 12000, posts: 24, engagementRate: 4.2 } };
    }
    if (method === 'get' && path === '/analytics/best-times') {
        const heatmap = {};
        for (let d = 0; d < 7; d++) {
            heatmap[d] = {};
            for (let h = 0; h < 24; h++) {
                heatmap[d][h] = Math.floor(Math.random() * 100);
            }
        }
        heatmap[2][10] = 95;
        heatmap[4][18] = 88;
        heatmap[5][11] = 82;
        return {
            totalAnalyzedPosts: 24,
            heatmap,
            topSlots: [
                { dayName: 'Tuesday', timeLabel: '10:00 AM', avgEngagement: 92, totalPosts: 8 },
                { dayName: 'Thursday', timeLabel: '6:00 PM', avgEngagement: 88, totalPosts: 6 },
                { dayName: 'Saturday', timeLabel: '11:00 AM', avgEngagement: 85, totalPosts: 5 },
                { dayName: 'Wednesday', timeLabel: '2:00 PM', avgEngagement: 82, totalPosts: 4 },
                { dayName: 'Monday', timeLabel: '9:00 AM', avgEngagement: 78, totalPosts: 3 },
            ],
        };
    }

    // ─── AI ───
    if (method === 'post' && path === '/ai/caption') {
        return { caption: `🚀 ${body.topic || 'Your topic'} — crafted with a ${body.tone || 'professional'} vibe for ${body.platform || 'social media'}. Ready to go viral! #ContentCreation #Viralix` };
    }
    if (method === 'post' && path === '/ai/hashtags') {
        const tags = ['viralix', 'socialmedia', 'contentcreator', 'marketing', 'growth', 'digital', 'brand', 'trending', 'fyp', 'engagement'];
        return { hashtags: tags.slice(0, body.count || 10) };
    }
    if (method === 'post' && path === '/ai/rewrite') {
        return { text: `${body.text}\n\n[Rewritten with ${body.tone || 'engaging'} tone for ${body.platform || 'Instagram'}]` };
    }

    // ─── Platforms / Accounts ───
    if (method === 'get' && path === '/platforms/connected') return getConnectedAccountsResponse();

    // ─── Facebook ───
    if (method === 'get' && path === '/facebook/status') {
        const fb = store.accounts.find((a) => a.platform === 'facebook');
        return { connected: !!fb, account: fb ? { id: fb.platformAccountId, name: fb.accountName } : null, pages: fb ? [{ id: fb.platformAccountId, name: fb.accountName }] : [] };
    }
    if (method === 'get' && path === '/facebook/oauth/start-url') {
        addAccount('facebook', 'Viralix Brand', 'fb-page-101', 12400);
        return { url: `${mockOrigin()}/dashboard/connect-accounts?success=facebook_connected` };
    }
    if (method === 'delete' && path === '/facebook/disconnect') {
        store.accounts = store.accounts.filter((a) => a.platform !== 'facebook');
        persistMockStore();
        return { message: 'Disconnected' };
    }
    if (method === 'get' && path.match(/^\/facebook\/pages\/[^/]+\/feed$/)) {
        return { feed: store.facebookFeed };
    }
    if (method === 'get' && path.match(/^\/facebook\/pages\/[^/]+\/insights$/)) {
        return { insights: store.facebookInsights };
    }
    if (method === 'post' && path.match(/^\/facebook\/pages\/[^/]+\/post$/)) {
        store.facebookFeed.unshift({ id: nextMockId('fb-feed'), message: body.message, created_time: new Date().toISOString(), likes: 0, comments: 0, shares: 0 });
        persistMockStore();
        return { success: true };
    }
    if (method === 'post' && path.match(/^\/facebook\/pages\/[^/]+\/(photo|video)$/)) {
        store.facebookFeed.unshift({ id: nextMockId('fb-feed'), message: body.caption || body.description || 'New media post', created_time: new Date().toISOString(), likes: 0, comments: 0, shares: 0 });
        persistMockStore();
        return { success: true };
    }
    if (method === 'get' && path.match(/^\/facebook\/post\/[^/]+\/insights$/)) {
        return { insights: { views: 3200, likes: 410, comments: 28, shares: 15, reach: 8900 } };
    }

    // ─── Instagram ───
    if (method === 'get' && path === '/instagram/status') {
        const ig = store.accounts.filter((a) => a.platform === 'instagram');
        return { connected: ig.length > 0, accounts: ig };
    }
    if (method === 'get' && path.match(/^\/instagram\/accounts\/[^/]+\/profile$/)) {
        return { username: 'viralix.official', followers_count: 28700, media_count: 142, biography: 'AI social media management' };
    }
    if (method === 'get' && path.match(/^\/instagram\/accounts\/[^/]+\/feed$/)) {
        return { data: store.platformContent.instagram || [] };
    }
    if (method === 'get' && path.match(/^\/instagram\/accounts\/[^/]+\/insights$/)) {
        return { impressions: 45200, reach: 32100, profile_views: 890, follower_count: 28700 };
    }
    if (method === 'get' && path.match(/^\/instagram-insights\/media\/[^/]+\/insights$/)) {
        return { views: 8400, likes: 920, comments: 67, shares: 34, saves: 120 };
    }

    // ─── TikTok ───
    if (method === 'get' && path === '/tiktok-oauth/connect') {
        addAccount('tiktok', 'viralix_creators', 'tt-open-301', 45200);
        return { authUrl: `${mockOrigin()}/dashboard/connect-accounts?success=tiktok_connected` };
    }
    if (method === 'get' && path === '/tiktok-oauth/status') {
        const tt = store.accounts.find((a) => a.platform === 'tiktok');
        return { connected: !!tt, account: tt };
    }
    if (method === 'delete' && path.match(/^\/tiktok-oauth\/disconnect\//)) {
        const id = path.split('/')[3];
        removeAccount('tiktok', id);
        return { message: 'Disconnected' };
    }
    if (method === 'get' && path.match(/^\/tiktok-oauth\/creator-info\//)) {
        return {
            creatorNickname: 'Viralix Creators',
            accountName: 'viralix_creators',
            avatarUrl: PLACEHOLDER_IMG,
            canPost: true,
            isPrivateAccount: false,
            isUnaudited: true,
            requiresSelfOnly: true,
            commentDisabled: false,
            duetDisabled: false,
            stitchDisabled: false,
            privacyLevelOptions: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
        };
    }
    if (method === 'get' && path.match(/^\/tiktok-oauth\/videos\//)) {
        return { videos: store.platformContent.tiktok || [] };
    }
    if (method === 'get' && path.match(/^\/tiktok-oauth\/video\/insights\//)) {
        return { views: 45200, likes: 5200, comments: 312, shares: 890 };
    }

    // ─── YouTube ───
    if (method === 'get' && path === '/youtube-oauth/connect') {
        addAccount('youtube', 'Viralix Media', 'yt-channel-401', 18300);
        return { authUrl: `${mockOrigin()}/dashboard/connect-accounts?success=youtube_connected` };
    }
    if (method === 'get' && path === '/youtube-oauth/status') {
        const yt = store.accounts.find((a) => a.platform === 'youtube');
        return { connected: !!yt, account: yt };
    }
    if (method === 'delete' && path.match(/^\/youtube-oauth\/disconnect\//)) {
        const id = path.split('/')[3];
        removeAccount('youtube', id);
        return { message: 'Disconnected' };
    }
    if (method === 'get' && path.match(/^\/youtube-oauth\/videos\//)) {
        return { videos: store.platformContent.youtube || [] };
    }
    if (method === 'get' && path.match(/^\/youtube-oauth\/video\/insights\//)) {
        return { views: 8900, likes: 620, comments: 84, shares: 45 };
    }
    if (method === 'get' && path.match(/^\/youtube-oauth\/account\//)) {
        return { title: 'Viralix Media', subscriberCount: 18300, videoCount: 48 };
    }

    // ─── Instagram OAuth disconnect ───
    if (method === 'delete' && path.match(/^\/instagram-oauth\/disconnect\//)) {
        const id = path.split('/')[3];
        removeAccount('instagram', id);
        return { message: 'Disconnected' };
    }

    // ─── Upload ───
    if (method === 'get' && path.startsWith('/upload/media')) {
        return { files: store.mediaFiles };
    }
    if (method === 'post' && path === '/upload/media') {
        const file = {
            publicId: `viralix/media/${nextMockId('upload')}`,
            url: PLACEHOLDER_IMG,
            filename: 'uploaded-file.jpg',
            mimetype: 'image/jpeg',
            size: 256000,
            createdAt: new Date().toISOString(),
        };
        store.mediaFiles.unshift(file);
        persistMockStore();
        if (config.onUploadProgress) {
            config.onUploadProgress({ loaded: 100, total: 100 });
        }
        return { files: [file] };
    }
    if (method === 'delete' && path.startsWith('/upload/media/')) {
        const publicId = decodeURIComponent(path.replace('/upload/media/', '').replace(/:/g, '/'));
        store.mediaFiles = store.mediaFiles.filter((f) => f.publicId !== publicId);
        persistMockStore();
        return { message: 'Deleted' };
    }

    // ─── Platform Sync ───
    if (method === 'get' && path.match(/^\/platform-sync\/content\//)) {
        const platform = path.split('/')[3];
        const content = store.platformContent[platform] || [];
        const metrics = {
            count: content.length,
            totalViews: content.reduce((s, c) => s + (c.views || 0), 0),
            totalLikes: content.reduce((s, c) => s + (c.likes || 0), 0),
            totalComments: content.reduce((s, c) => s + (c.comments || 0), 0),
        };
        return { content, metrics };
    }
    if (method === 'post' && path.startsWith('/platform-sync/')) {
        return { message: 'Sync complete', synced: 12 };
    }

    // ─── Inbox ───
    if (method === 'get' && path === '/inbox') {
        let convs = [...store.conversations];
        if (params.status && params.status !== 'all') convs = convs.filter((c) => c.status === params.status);
        if (params.platform) convs = convs.filter((c) => c.platform === params.platform);
        if (params.search) {
            const q = params.search.toLowerCase();
            convs = convs.filter((c) => c.participantName?.toLowerCase().includes(q) || c.lastMessage?.text?.toLowerCase().includes(q));
        }
        return { conversations: convs, total: convs.length, unreadTotal: convs.reduce((s, c) => s + (c.unreadCount || 0), 0), page: 1, pages: 1 };
    }
    if (method === 'get' && path === '/inbox/stats') {
        const convs = store.conversations;
        const sumUnread = (list) => list.reduce((s, c) => s + (c.unreadCount || 0), 0);
        return {
            byStatus: [
                { status: 'open', count: convs.filter((c) => c.status === 'open').length, unread: sumUnread(convs.filter((c) => c.status === 'open')) },
                { status: 'closed', count: convs.filter((c) => c.status === 'closed').length, unread: 0 },
                { status: 'archived', count: convs.filter((c) => c.status === 'archived').length, unread: 0 },
            ],
            byPlatform: ['instagram', 'facebook', 'tiktok', 'youtube'].map((p) => {
                const platformConvs = convs.filter((c) => c.platform === p);
                return {
                    platform: p,
                    count: platformConvs.length,
                    unread: sumUnread(platformConvs),
                };
            }),
        };
    }
    if (method === 'get' && path.match(/^\/inbox\/[^/]+\/messages$/)) {
        const convId = path.split('/')[2];
        return { messages: store.messages[convId] || [] };
    }
    if (method === 'post' && path.match(/^\/inbox\/[^/]+\/reply$/)) {
        const convId = path.split('/')[2];
        const msg = {
            _id: nextMockId('msg'),
            text: body.text,
            direction: 'outbound',
            senderName: 'You',
            createdAt: new Date().toISOString(),
        };
        if (!store.messages[convId]) store.messages[convId] = [];
        store.messages[convId].push(msg);
        persistMockStore();
        return { message: msg };
    }
    if (method === 'patch' && path.match(/^\/inbox\/[^/]+\/status$/)) {
        const convId = path.split('/')[2];
        const conv = store.conversations.find((c) => c._id === convId);
        if (conv) conv.status = body.status;
        persistMockStore();
        return { success: true };
    }
    if (method === 'post' && path.match(/^\/inbox\/[^/]+\/ai-suggest$/)) {
        const convId = path.split('/')[2];
        const conv = store.conversations.find((c) => c._id === convId);
        const msgs = store.messages[convId] || [];
        const lastInbound = [...msgs].reverse().find((m) => m.sender === 'them' || m.direction === 'inbound');
        const tone = body.tone || store.autoReplySettings?.defaultTone || 'friendly';
        const name = conv?.participantName?.split(' ')[0] || 'there';
        const topic = lastInbound?.text || conv?.lastMessage?.text || 'your message';
        const templates = {
            friendly: [
                `Hey ${name}! Thanks for reaching out 😊 ${topic.includes('?') ? 'Great question — ' : ''}I'd love to help you get started with Viralix.`,
                `Hi ${name}! So glad you wrote in. ${topic.includes('start') ? 'The quickest way to begin is our free trial at viralix.dev/signup.' : 'Let me know what you need and I\'ll point you in the right direction!'}`,
            ],
            professional: [
                `Hello ${name}, thank you for your message. Regarding "${topic.slice(0, 60)}${topic.length > 60 ? '…' : ''}" — we'd be happy to assist.`,
                `Hi ${name}, we appreciate you contacting us. A team member will follow up shortly with more details.`,
            ],
            concise: [
                `Hi ${name}! Yes — you can start free at viralix.dev/signup. Let me know if you have questions.`,
                `Thanks ${name}! Happy to help. What platform are you looking to connect first?`,
            ],
            empathetic: [
                `Hi ${name}, I'm sorry you're running into this. Let's get it sorted — can you share which post was affected?`,
                `${name}, totally understand the frustration. We're here to help and will make this right.`,
            ],
        };
        const suggestions = (templates[tone] || templates.friendly).map((text, i) => ({
            id: `sug-${i}`,
            text: store.autoReplySettings?.signOff ? `${text}\n\n${store.autoReplySettings.signOff}` : text,
            tone,
            confidence: 0.88 - i * 0.04,
        }));
        return { suggestions, tone, aiMode: store.autoReplySettings?.aiMode || 'suggest' };
    }

    // ─── Auto-Reply settings & rules ───
    if (method === 'get' && path === '/inbox/auto-reply/settings') {
        return store.autoReplySettings || {};
    }
    if (method === 'patch' && path === '/inbox/auto-reply/settings') {
        store.autoReplySettings = { ...store.autoReplySettings, ...body };
        persistMockStore();
        return store.autoReplySettings;
    }
    if (method === 'get' && path === '/inbox/auto-reply/rules') {
        return { rules: store.autoReplyRules || [] };
    }
    if (method === 'post' && path === '/inbox/auto-reply/rules') {
        const rule = {
            _id: nextMockId('rule'),
            enabled: true,
            stats: { sent: 0, failed: 0 },
            createdAt: new Date().toISOString(),
            keywords: [],
            platforms: ['instagram'],
            triggerType: 'keyword',
            replyType: 'fixed',
            targetAudience: 'anyone',
            ...body,
        };
        if (!store.autoReplyRules) store.autoReplyRules = [];
        store.autoReplyRules.push(rule);
        persistMockStore();
        return { rule };
    }
    if (method === 'put' && path.match(/^\/inbox\/auto-reply\/rules\/[^/]+$/)) {
        const id = path.split('/')[4];
        const idx = (store.autoReplyRules || []).findIndex((r) => r._id === id);
        if (idx < 0) throw mockError(404, 'Rule not found');
        store.autoReplyRules[idx] = { ...store.autoReplyRules[idx], ...body };
        persistMockStore();
        return { rule: store.autoReplyRules[idx] };
    }
    if (method === 'delete' && path.match(/^\/inbox\/auto-reply\/rules\/[^/]+$/)) {
        const id = path.split('/')[4];
        store.autoReplyRules = (store.autoReplyRules || []).filter((r) => r._id !== id);
        persistMockStore();
        return { success: true };
    }
    if (method === 'patch' && path.match(/^\/inbox\/auto-reply\/rules\/[^/]+\/toggle$/)) {
        const id = path.split('/')[4];
        const rule = (store.autoReplyRules || []).find((r) => r._id === id);
        if (!rule) throw mockError(404, 'Rule not found');
        rule.enabled = !rule.enabled;
        persistMockStore();
        return { rule };
    }

    // ─── Links ───
    if (method === 'get' && path === '/links') return { links: store.links };
    if (method === 'post' && path === '/links') {
        const link = { _id: nextMockId('link'), originalUrl: body.originalUrl, shortUrl: `https://vx.link/${nextMockId('s').slice(-6)}`, title: body.title || 'Untitled', clicks: 0, createdAt: new Date().toISOString() };
        store.links.unshift(link);
        persistMockStore();
        return link;
    }
    if (method === 'delete' && path.match(/^\/links\/[^/]+$/)) {
        store.links = store.links.filter((l) => l._id !== path.split('/')[2]);
        persistMockStore();
        return { message: 'Deleted' };
    }
    if (method === 'get' && path.match(/^\/links\/[^/]+\/stats$/)) {
        const link = store.links.find((l) => l._id === path.split('/')[2]);
        return { clicks: link?.clicks || 0, clicksByDay: [{ date: '2026-06-10', count: 42 }, { date: '2026-06-11', count: 58 }] };
    }

    // ─── Keyword Alerts ───
    if (method === 'get' && path === '/keyword-alerts') return { alerts: store.keywordAlerts };
    if (method === 'post' && path === '/keyword-alerts') {
        const alert = { _id: nextMockId('kw'), ...body, isActive: true, matchCount: 0 };
        store.keywordAlerts.push(alert);
        persistMockStore();
        return alert;
    }
    if (method === 'patch' && path.match(/^\/keyword-alerts\/[^/]+\/toggle$/)) {
        const a = store.keywordAlerts.find((x) => x._id === path.split('/')[2]);
        if (a) a.isActive = !a.isActive;
        persistMockStore();
        return a;
    }
    if (method === 'delete' && path.match(/^\/keyword-alerts\/[^/]+$/)) {
        store.keywordAlerts = store.keywordAlerts.filter((a) => a._id !== path.split('/')[2]);
        persistMockStore();
        return { message: 'Deleted' };
    }
    if (method === 'get' && path === '/keyword-alerts/notifications') return { notifications: [] };
    if (method === 'patch' && path === '/keyword-alerts/notifications/read-all') {
        return { success: true };
    }

    // ─── Competitors ───
    if (method === 'get' && path === '/competitors') return { competitors: store.competitors };
    if (method === 'get' && path === '/competitors/compare') {
        return {
            you: { followers: 104600, engagementRate: 4.8 },
            competitors: store.competitors.map((c) => ({ name: c.name, followers: c.followers, engagementRate: c.engagementRate })),
        };
    }
    if (method === 'post' && path === '/competitors') {
        const comp = { _id: nextMockId('comp'), ...body, isActive: true, followers: 50000, engagementRate: 3.2 };
        store.competitors.push(comp);
        persistMockStore();
        return comp;
    }
    if (method === 'delete' && path.match(/^\/competitors\/[^/]+$/)) {
        store.competitors = store.competitors.filter((c) => c._id !== path.split('/')[2]);
        persistMockStore();
        return { message: 'Deleted' };
    }
    if (method === 'post' && path.match(/^\/competitors\/[^/]+\/snapshot$/)) {
        return { snapshot: { followers: 91000, engagementRate: 2.5, capturedAt: new Date().toISOString() } };
    }

    // ─── Hashtag Research ───
    if (method === 'get' && path === '/hashtag-research/performance') {
        return {
            hashtags: [
                { tag: 'viralix', posts: 1240, avgEngagement: 4.2, tier: 'top', trend: 'rising' },
                { tag: 'socialmedia', posts: 89000, avgEngagement: 2.1, tier: 'mid', trend: 'stable' },
                { tag: 'contentcreator', posts: 120000, avgEngagement: 3.8, tier: 'top', trend: 'rising' },
                { tag: 'marketing', posts: 45000, avgEngagement: 1.9, tier: 'mid', trend: 'falling' },
                { tag: 'growth', posts: 32000, avgEngagement: 2.5, tier: 'low', trend: 'stable' },
            ],
        };
    }
    if (method === 'get' && path === '/hashtag-research/trending') {
        return {
            trends: [
                { tag: 'AItools', volume: 45000, change: 24 },
                { tag: 'contentcreator', volume: 120000, change: 12 },
                { tag: 'scheduling', volume: 8900, change: 8 },
            ],
        };
    }
    if (method === 'get' && path === '/hashtag-research/suggest') {
        const topic = params.topic || 'brand';
        return { suggestions: ['viralix', `${topic}tips`, 'marketing', 'growth', 'socialmedia', 'fyp', 'trending'] };
    }
    if (method === 'get' && path === '/hashtag-research/sets') return { sets: store.hashtagSets };
    if (method === 'post' && path === '/hashtag-research/sets') {
        const set = { _id: nextMockId('hs'), ...body };
        store.hashtagSets.push(set);
        persistMockStore();
        return set;
    }
    if (method === 'delete' && path.match(/^\/hashtag-research\/sets\/[^/]+$/)) {
        store.hashtagSets = store.hashtagSets.filter((s) => s._id !== path.split('/')[3]);
        persistMockStore();
        return { message: 'Deleted' };
    }
    if (method === 'post' && path.match(/^\/hashtag-research\/sets\/[^/]+\/copy$/)) {
        const id = path.split('/')[3];
        const orig = store.hashtagSets.find((s) => s._id === id);
        const copy = { ...orig, _id: nextMockId('hs'), name: `${orig?.name || 'Set'} (Copy)` };
        store.hashtagSets.push(copy);
        persistMockStore();
        return copy;
    }

    // ─── AI Calendar ───
    if (method === 'post' && path === '/ai-calendar/analyze') {
        return { analysis: { bestDays: ['Tuesday', 'Thursday'], avgPostsPerWeek: 5, topPlatform: body.platform || 'instagram' } };
    }
    if (method === 'post' && path === '/ai-calendar/generate') {
        const suggestions = Array.from({ length: body.count || 7 }, (_, i) => ({
            date: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
            title: `AI Suggested Post ${i + 1}`,
            content: `Auto-generated content idea for ${body.platform || 'instagram'} — topic ${i + 1}`,
            platform: body.platform || 'instagram',
        }));
        return { suggestions };
    }
    if (method === 'post' && path === '/ai-calendar/confirm') {
        return { created: (body.suggestions || []).length, message: 'Posts scheduled' };
    }

    // ─── Bio Pages ───
    if (method === 'get' && path === '/bio-pages') return { pages: store.bioPages };
    if (method === 'get' && path.match(/^\/bio-pages\/public\//)) {
        const slug = path.split('/')[4];
        const page = store.bioPages.find((p) => p.slug === slug);
        if (!page) throw mockError(404, 'Bio page not found');
        return page;
    }
    if (method === 'post' && path === '/bio-pages') {
        const page = {
            _id: nextMockId('bio'),
            slug: body.slug || 'my-page',
            userId: MOCK_USER._id,
            profile: { title: '', bio: '', image: '' },
            theme: { id: 'simple-light', background: '#ffffff', textColor: '#000', buttonColor: '#84A98C', buttonTextColor: '#fff', buttonStyle: 'rounded' },
            buttons: [],
            socials: [],
        };
        store.bioPages.push(page);
        persistMockStore();
        return { page };
    }
    if (method === 'patch' && path.match(/^\/bio-pages\/[^/]+$/)) {
        const id = path.split('/')[2];
        const idx = store.bioPages.findIndex((p) => p._id === id);
        if (idx >= 0) {
            store.bioPages[idx] = { ...store.bioPages[idx], ...body };
            persistMockStore();
            return store.bioPages[idx];
        }
        throw mockError(404, 'Not found');
    }
    if (method === 'post' && path.match(/^\/bio-pages\/click\//)) {
        return { tracked: true };
    }

    // ─── Team ───
    if (method === 'get' && path === '/team') return store.team;
    if (method === 'get' && path === '/team/posts/pending') return { posts: store.pendingPosts };
    if (method === 'post' && path === '/team/invite') {
        store.team.members.push({ _id: nextMockId('member'), user: { name: body.email.split('@')[0], email: body.email }, role: body.role || 'editor', joinedAt: new Date().toISOString() });
        persistMockStore();
        return { message: 'Invited' };
    }
    if (method === 'patch' && path.match(/^\/team\/[^/]+\/role$/)) {
        const m = store.team.members.find((x) => x._id === path.split('/')[2]);
        if (m) m.role = body.role;
        persistMockStore();
        return m;
    }
    if (method === 'delete' && path.match(/^\/team\/[^/]+$/)) {
        store.team.members = store.team.members.filter((m) => m._id !== path.split('/')[2]);
        persistMockStore();
        return { message: 'Removed' };
    }
    if (method === 'post' && path.match(/^\/team\/posts\/[^/]+\/approve$/)) {
        const postId = path.split('/')[3];
        store.pendingPosts = store.pendingPosts.filter((p) => p._id !== postId);
        persistMockStore();
        return { success: true, postId };
    }
    if (method === 'post' && path.match(/^\/team\/posts\/[^/]+\/reject$/)) {
        const postId = path.split('/')[3];
        store.pendingPosts = store.pendingPosts.filter((p) => p._id !== postId);
        persistMockStore();
        return { success: true, postId };
    }

    // ─── Watermark ───
    if (method === 'get' && path === '/watermark') return store.watermark;
    if (method === 'patch' && path === '/watermark') {
        store.watermark = { ...store.watermark, ...body };
        persistMockStore();
        return store.watermark;
    }
    if (method === 'post' && path === '/watermark/upload') {
        store.watermark.imageUrl = PLACEHOLDER_IMG;
        store.watermark.enabled = true;
        persistMockStore();
        return store.watermark;
    }
    if (method === 'delete' && path === '/watermark') {
        store.watermark = { enabled: false, position: 'bottom-right', opacity: 0.7, imageUrl: null };
        persistMockStore();
        return { message: 'Removed' };
    }

    // ─── Bulk Upload ───
    if (method === 'post' && path === '/bulk-upload/preview') {
        return { rows: [{ title: 'Post 1', content: 'Sample content', platforms: 'instagram,facebook' }, { title: 'Post 2', content: 'Another post', platforms: 'tiktok' }], valid: 2, invalid: 0 };
    }
    if (method === 'post' && path === '/bulk-upload/create') {
        return { created: 2, message: 'Bulk posts created' };
    }

    // ─── Comments / Sentiment ───
    if (method === 'get' && path === '/comments/sentiment-summary') {
        return {
            total: 156, positive: 106, neutral: 34, negative: 16,
            positivePercent: 68, neutralPercent: 22, negativePercent: 10, urgent: 3,
        };
    }
    if (method === 'get' && path === '/comments/recent') {
        return { comments: [{ text: 'Love this!', sentiment: 'positive', platform: 'instagram' }, { text: 'How much does Pro cost?', sentiment: 'neutral', platform: 'facebook' }] };
    }
    if (method === 'get' && path === '/comments/urgent') {
        return { comments: [{ text: 'My post failed to publish', sentiment: 'negative', platform: 'tiktok', priority: 'high' }] };
    }

    // ─── Campaigns (legacy) ───
    if (method === 'get' && path === '/campaigns') return { campaigns: [] };

    // ─── Facebook auto-reply ───
    if (method === 'get' && path === '/facebook-auto-reply/rules') return { rules: [] };
    if (method === 'post' && path === '/facebook-auto-reply/rules') {
        return { rule: { _id: nextMockId('fbr'), ...body, enabled: true, stats: { sent: 0, failed: 0 } } };
    }

    // ─── Instagram auto-reply ───
    if (method === 'get' && path === '/instagram-auto-reply/rules') return { rules: [] };
    if (method === 'get' && path.match(/^\/instagram-auto-reply\/rules\/post\//)) {
        const postId = path.split('/')[4];
        return { rule: { _id: 'rule-ig', postId, enabled: true, triggerType: 'keyword', keywords: ['info'], replyContent: { message: 'Thanks for commenting!' }, stats: { sent: 12, failed: 0 } } };
    }
    if (method === 'post' && path === '/instagram-auto-reply/rules') {
        return { rule: { _id: nextMockId('igr'), ...body, enabled: true, stats: { sent: 0, failed: 0 } } };
    }

    console.warn(`[Mock API] Unhandled: ${method.toUpperCase()} ${path}`);
    return { success: true, mock: true, path };
}

function mockError(status, message) {
    const err = new Error(message);
    err.response = { status, data: { message } };
    err.isAxiosError = true;
    throw err;
}

export { mockError };
