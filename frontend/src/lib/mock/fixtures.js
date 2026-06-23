const IMG = 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80';
const VID = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80';

export const MOCK_USER = {
    _id: 'mock-user-001',
    name: 'Alex Morgan',
    email: 'demo@viralix.dev',
    profilePicture: null,
    settings: {
        timezone: 'America/New_York',
        emailNotifications: true,
        pushNotifications: true,
        weeklyReports: true,
        theme: 'light',
    },
};

export const MOCK_TOKEN = 'mock-jwt-token-viralix-demo';

export function createInitialStore() {
    const now = Date.now();
    const daysAgo = (d) => new Date(now - d * 86400000).toISOString();
    const daysFromNow = (d) => new Date(now + d * 86400000).toISOString();

    return {
        user: { ...MOCK_USER },
        accounts: [
            { _id: 'acc-fb-1', platform: 'facebook', platformAccountId: 'fb-page-101', accountId: 'fb-page-101', accountName: 'Viralix Brand', followerCount: 12400, connectedAt: daysAgo(30), isActive: true },
            { _id: 'acc-ig-1', platform: 'instagram', platformAccountId: 'ig-user-201', accountId: 'ig-user-201', accountName: '@viralix.official', followerCount: 28700, connectedAt: daysAgo(28), isActive: true },
            { _id: 'acc-tt-1', platform: 'tiktok', platformAccountId: 'tt-open-301', accountId: 'tt-open-301', accountName: 'viralix_creators', followerCount: 45200, connectedAt: daysAgo(14), isActive: true },
            { _id: 'acc-yt-1', platform: 'youtube', platformAccountId: 'yt-channel-401', accountId: 'yt-channel-401', accountName: 'Viralix Media', followerCount: 18300, connectedAt: daysAgo(21), isActive: true },
        ],
        posts: [
            {
                _id: 'post-001', title: 'Summer Product Launch Teaser', content: 'Something big is coming this summer! ☀️ Stay tuned for our biggest launch yet. #Viralix #SummerLaunch',
                status: 'published', isPublished: true, isScheduled: false, isDraft: false,
                hashtags: ['Viralix', 'SummerLaunch', 'SocialMedia'],
                media: [{ type: 'image', url: IMG, filename: 'launch-teaser.jpg' }],
                platforms: [
                    { name: 'instagram', accountId: 'ig-user-201', status: 'published', publishedAt: daysAgo(2), engagement: { views: 8420, likes: 1240, comments: 89, shares: 34 } },
                    { name: 'facebook', accountId: 'fb-page-101', status: 'published', publishedAt: daysAgo(2), engagement: { views: 5200, likes: 680, comments: 45, shares: 22 } },
                ],
                createdAt: daysAgo(3), updatedAt: daysAgo(2), scheduledDate: null, scheduledAt: null,
            },
            {
                _id: 'post-002', title: 'Weekly Tips: Engagement Hacks', content: '5 proven ways to boost engagement on your posts this week 📈',
                status: 'scheduled', isPublished: false, isScheduled: true, isDraft: false,
                hashtags: ['MarketingTips', 'Engagement'],
                media: [{ type: 'video', url: VID, filename: 'tips-video.mp4' }],
                platforms: [
                    { name: 'tiktok', accountId: 'tt-open-301', status: 'scheduled' },
                    { name: 'youtube', accountId: 'yt-channel-401', status: 'scheduled' },
                ],
                createdAt: daysAgo(1), updatedAt: daysAgo(1), scheduledDate: daysFromNow(2), scheduledAt: daysFromNow(2),
            },
            {
                _id: 'post-003', title: 'Behind the Scenes', content: 'A peek behind the curtain at how we create content 🎬',
                status: 'draft', isPublished: false, isScheduled: false, isDraft: true,
                hashtags: ['BTS', 'ContentCreation'],
                media: [{ type: 'image', url: IMG, filename: 'bts.jpg' }],
                platforms: [{ name: 'instagram', accountId: 'ig-user-201', status: 'draft' }],
                createdAt: daysAgo(0), updatedAt: daysAgo(0), scheduledDate: null, scheduledAt: null,
            },
            {
                _id: 'post-004', title: 'Customer Spotlight', content: 'Meet Sarah — she grew her audience 3x with Viralix! 🚀',
                status: 'published', isPublished: true, isScheduled: false, isDraft: false,
                hashtags: ['CustomerStory', 'Growth'],
                media: [{ type: 'image', url: IMG, filename: 'spotlight.jpg' }],
                platforms: [
                    { name: 'facebook', accountId: 'fb-page-101', status: 'published', publishedAt: daysAgo(5), engagement: { views: 3100, likes: 420, comments: 31, shares: 18 } },
                ],
                createdAt: daysAgo(6), updatedAt: daysAgo(5), scheduledDate: null, scheduledAt: null,
            },
            {
                _id: 'post-005', title: 'Poll: What content next?', content: 'Vote in comments — tutorials or case studies?',
                status: 'failed', isPublished: false, isScheduled: false, isDraft: false,
                hashtags: ['Poll'],
                media: [],
                platforms: [
                    { name: 'instagram', accountId: 'ig-user-201', status: 'failed', errorMessage: 'Media upload timeout. Please retry.' },
                ],
                createdAt: daysAgo(4), updatedAt: daysAgo(4), scheduledDate: null, scheduledAt: null,
            },
            {
                _id: 'post-006', title: 'Tutorial: Schedule Like a Pro', content: 'Learn to batch-schedule a week of content in 30 minutes ⏰',
                status: 'published', isPublished: true, isScheduled: false, isDraft: false,
                hashtags: ['Tutorial', 'Scheduling'],
                media: [{ type: 'video', url: VID, filename: 'tutorial.mp4' }],
                platforms: [
                    { name: 'youtube', accountId: 'yt-channel-401', status: 'published', publishedAt: daysAgo(7), engagement: { views: 15600, likes: 890, comments: 124, shares: 56 } },
                    { name: 'tiktok', accountId: 'tt-open-301', status: 'published', publishedAt: daysAgo(7), engagement: { views: 22100, likes: 2100, comments: 178, shares: 412 } },
                ],
                createdAt: daysAgo(8), updatedAt: daysAgo(7), scheduledDate: null, scheduledAt: null,
            },
            {
                _id: 'post-007', title: 'Flash Sale Announcement', content: '24-hour flash sale — 30% off Pro plans! ⚡',
                status: 'scheduled', isPublished: false, isScheduled: true, isDraft: false,
                hashtags: ['Sale', 'ProPlan'],
                media: [{ type: 'image', url: IMG, filename: 'sale.jpg' }],
                platforms: [
                    { name: 'facebook', accountId: 'fb-page-101', status: 'scheduled' },
                    { name: 'instagram', accountId: 'ig-user-201', status: 'scheduled' },
                ],
                createdAt: daysAgo(2), updatedAt: daysAgo(1), scheduledDate: daysFromNow(5), scheduledAt: daysFromNow(5),
            },
            {
                _id: 'post-008', title: 'New Feature: AI Calendar', content: 'Introducing AI-powered content calendar autofill ✨',
                status: 'draft', isPublished: false, isScheduled: false, isDraft: true,
                hashtags: ['AI', 'NewFeature'],
                media: [{ type: 'image', url: IMG, filename: 'feature.jpg' }],
                platforms: [
                    { name: 'facebook', accountId: 'fb-page-101', status: 'draft' },
                    { name: 'instagram', accountId: 'ig-user-201', status: 'draft' },
                    { name: 'tiktok', accountId: 'tt-open-301', status: 'draft' },
                ],
                createdAt: daysAgo(0), updatedAt: daysAgo(0), scheduledDate: null, scheduledAt: null,
            },
        ],
        mediaFiles: [
            { publicId: 'viralix/media/launch-teaser', type: 'image', url: IMG, filename: 'launch-teaser.jpg', mimetype: 'image/jpeg', size: 245000, width: 1200, height: 800, createdAt: daysAgo(10) },
            { publicId: 'viralix/media/tips-video', type: 'video', url: VID, filename: 'tips-video.mp4', mimetype: 'video/mp4', size: 4200000, width: 1080, height: 1920, duration: 45, createdAt: daysAgo(8) },
            { publicId: 'viralix/media/bts', type: 'image', url: IMG, filename: 'bts.jpg', mimetype: 'image/jpeg', size: 180000, width: 1200, height: 800, createdAt: daysAgo(5) },
            { publicId: 'viralix/media/tutorial', type: 'video', url: VID, filename: 'tutorial.mp4', mimetype: 'video/mp4', size: 8900000, width: 1920, height: 1080, duration: 312, createdAt: daysAgo(15) },
            { publicId: 'viralix/media/product-shot', type: 'image', url: IMG, filename: 'product-shot.jpg', mimetype: 'image/jpeg', size: 320000, width: 1080, height: 1080, createdAt: daysAgo(3) },
            { publicId: 'viralix/media/reel-clip', type: 'video', url: VID, filename: 'reel-clip.mp4', mimetype: 'video/mp4', size: 6100000, width: 1080, height: 1920, duration: 28, createdAt: daysAgo(2) },
        ],
        conversations: [
            { _id: 'conv-001', platform: 'instagram', participantName: 'Jessica Chen', status: 'open', unreadCount: 2, labels: ['lead'], lastMessage: { text: 'Love your latest post! How do I get started?', createdAt: daysAgo(0) }, updatedAt: daysAgo(0) },
            { _id: 'conv-002', platform: 'facebook', participantName: 'Mike Rodriguez', status: 'open', unreadCount: 0, labels: [], lastMessage: { text: 'Is the Pro plan worth it for a small business?', createdAt: daysAgo(1) }, updatedAt: daysAgo(1) },
            { _id: 'conv-003', platform: 'tiktok', participantName: 'creator_emma', status: 'open', unreadCount: 1, labels: ['support'], lastMessage: { text: 'My scheduled post did not publish', createdAt: daysAgo(0) }, updatedAt: daysAgo(0) },
            { _id: 'conv-004', platform: 'youtube', participantName: 'TechReviews Daily', status: 'closed', unreadCount: 0, labels: [], lastMessage: { text: 'Thanks for the quick reply!', createdAt: daysAgo(3) }, updatedAt: daysAgo(3) },
            { _id: 'conv-005', platform: 'instagram', participantName: 'brandstudio.co', status: 'archived', unreadCount: 0, labels: ['partnership'], lastMessage: { text: 'Let us know if you want to collaborate', createdAt: daysAgo(7) }, updatedAt: daysAgo(7) },
        ],
        messages: {
            'conv-001': [
                { _id: 'msg-001', text: 'Hi! I saw your product launch teaser.', sender: 'them', createdAt: daysAgo(1) },
                { _id: 'msg-002', text: 'Love your latest post! How do I get started?', sender: 'them', createdAt: daysAgo(0) },
            ],
            'conv-002': [
                { _id: 'msg-003', text: 'Is the Pro plan worth it for a small business?', sender: 'them', createdAt: daysAgo(1) },
            ],
            'conv-003': [
                { _id: 'msg-004', text: 'My scheduled post did not publish', sender: 'them', createdAt: daysAgo(0) },
            ],
        },
        autoReplySettings: {
            aiEnabled: true,
            aiMode: 'suggest',
            defaultTone: 'friendly',
            businessHoursOnly: false,
            businessHours: { start: '09:00', end: '18:00', timezone: 'America/New_York' },
            confidenceThreshold: 85,
            includeContext: true,
            signOff: '— The Viralix Team',
            autoReplyEnabled: true,
        },
        autoReplyRules: [
            {
                _id: 'rule-001',
                name: 'Comment → DM (Info keywords)',
                type: 'comment_dm',
                platforms: ['instagram', 'facebook'],
                enabled: true,
                triggerType: 'keyword',
                keywords: ['info', 'link', 'price', 'dm'],
                targetAudience: 'anyone',
                replyType: 'fixed',
                replyMessage: 'Hey! Thanks for commenting 🙌 Here\'s the link you asked for: viralix.dev/signup',
                aiTone: 'friendly',
                stats: { sent: 248, failed: 3 },
                createdAt: daysAgo(30),
            },
            {
                _id: 'rule-002',
                name: 'Support DM — AI assist',
                type: 'dm_keyword',
                platforms: ['instagram', 'tiktok', 'facebook'],
                enabled: true,
                triggerType: 'keyword',
                keywords: ['help', 'support', 'issue', 'broken'],
                targetAudience: 'anyone',
                replyType: 'ai',
                replyMessage: '',
                aiTone: 'empathetic',
                stats: { sent: 89, failed: 1 },
                createdAt: daysAgo(14),
            },
            {
                _id: 'rule-003',
                name: 'After-hours away message',
                type: 'away',
                platforms: ['instagram', 'facebook', 'tiktok', 'youtube'],
                enabled: false,
                triggerType: 'any',
                keywords: [],
                targetAudience: 'anyone',
                replyType: 'fixed',
                replyMessage: 'Thanks for reaching out! We\'re away right now but will get back to you within 24 hours.',
                aiTone: 'professional',
                stats: { sent: 42, failed: 0 },
                createdAt: daysAgo(60),
            },
        ],
        links: [
            { _id: 'link-001', originalUrl: 'https://viralix.dev/pricing', shortUrl: 'https://vx.link/pro24', title: 'Pro Plan Promo', clicks: 342, createdAt: daysAgo(14) },
            { _id: 'link-002', originalUrl: 'https://viralix.dev/blog/engagement-tips', shortUrl: 'https://vx.link/tips', title: 'Engagement Tips Blog', clicks: 128, createdAt: daysAgo(7) },
        ],
        keywordAlerts: [
            { _id: 'kw-001', keyword: 'viralix', platform: 'all', isActive: true, matchCount: 24 },
            { _id: 'kw-002', keyword: 'competitor brand', platform: 'instagram', isActive: true, matchCount: 7 },
        ],
        competitors: [
            { _id: 'comp-001', name: 'SocialBoost Pro', platform: 'instagram', handle: '@socialboostpro', isActive: true, followers: 89000, engagementRate: 2.4 },
            { _id: 'comp-002', name: 'PostMaster', platform: 'tiktok', handle: '@postmaster', isActive: true, followers: 156000, engagementRate: 4.1 },
        ],
        hashtagSets: [
            { _id: 'hs-001', name: 'Launch Campaign', platform: 'instagram', hashtags: ['launch', 'newproduct', 'viralix', 'socialmedia', 'marketing'] },
            { _id: 'hs-002', name: 'Engagement Boost', platform: 'tiktok', hashtags: ['fyp', 'foryou', 'tips', 'growth', 'creator'] },
        ],
        team: {
            owner: MOCK_USER,
            teamId: 'team-001',
            members: [
                { _id: 'member-001', user: { name: 'Jordan Lee', email: 'jordan@viralix.dev' }, role: 'admin', joinedAt: daysAgo(60) },
                { _id: 'member-002', user: { name: 'Sam Patel', email: 'sam@viralix.dev' }, role: 'editor', joinedAt: daysAgo(30) },
            ],
        },
        pendingPosts: [
            { _id: 'post-003', title: 'Behind the Scenes', submittedBy: 'Sam Patel', submittedAt: daysAgo(0) },
        ],
        bioPages: [
            {
                _id: 'bio-001', slug: 'viralix', userId: MOCK_USER._id,
                profile: { title: 'Viralix', bio: 'AI-powered social media management 🚀\nManage. Create. Grow.', image: IMG },
                theme: { id: 'gradient-sage', background: 'linear-gradient(135deg, #2F3E46 0%, #354F52 50%, #52796F 100%)', textColor: '#ffffff', buttonColor: '#84A98C', buttonTextColor: '#ffffff', buttonStyle: 'rounded', font: 'Inter, sans-serif' },
                buttons: [
                    { _id: 'btn-001', label: '🚀 Start Free Trial', url: 'https://viralix.dev/signup', isVisible: true, animation: 'none', icon: '', clicks: 842 },
                    { _id: 'btn-002', label: '📊 View Pricing', url: 'https://viralix.dev/pricing', isVisible: true, animation: 'pulse', icon: '', clicks: 516 },
                    { _id: 'btn-003', label: '📖 Blog & Tips', url: 'https://viralix.dev/blog', isVisible: true, animation: 'none', icon: '', clicks: 312 },
                ],
                stats: { views: 4820 },
                socials: [
                    { platform: 'instagram', url: 'https://instagram.com/viralix', isVisible: true },
                    { platform: 'tiktok', url: 'https://tiktok.com/@viralix', isVisible: true },
                    { platform: 'youtube', url: 'https://youtube.com/@viralix', isVisible: true },
                    { platform: 'twitter', url: 'https://twitter.com/viralix', isVisible: true },
                ],
            },
        ],
        platformContent: {
            instagram: [
                { platformContentId: 'ig-post-1', title: 'Morning motivation ☀️', thumbnail: IMG, mediaUrl: IMG, mediaType: 'image', views: 4200, likes: 680, comments: 42, permalink: '#', createdAt: daysAgo(1) },
                { platformContentId: 'ig-post-2', title: 'Reel: Quick editing tips', thumbnail: VID, mediaUrl: VID, mediaType: 'video', views: 12800, likes: 1420, comments: 98, permalink: '#', createdAt: daysAgo(3) },
            ],
            facebook: [
                { platformContentId: 'fb-post-1', title: 'Community update', thumbnail: IMG, mediaUrl: IMG, mediaType: 'image', views: 2100, likes: 340, comments: 28, permalink: '#', createdAt: daysAgo(2) },
            ],
            tiktok: [
                { platformContentId: 'tt-vid-1', title: 'POV: You discovered Viralix', thumbnail: VID, mediaUrl: VID, mediaType: 'video', views: 45200, likes: 5200, comments: 312, permalink: '#', createdAt: daysAgo(1) },
                { platformContentId: 'tt-vid-2', title: '3 scheduling hacks', thumbnail: VID, mediaUrl: VID, mediaType: 'video', views: 28900, likes: 3100, comments: 189, permalink: '#', createdAt: daysAgo(4) },
            ],
            youtube: [
                { platformContentId: 'yt-vid-1', title: 'Full Platform Walkthrough 2026', thumbnail: VID, mediaUrl: VID, mediaType: 'video', views: 8900, likes: 620, comments: 84, permalink: '#', createdAt: daysAgo(5) },
            ],
        },
        facebookFeed: [
            { id: 'fb-feed-1', message: 'Welcome to our Facebook community! 🎉', created_time: daysAgo(2), likes: 45, comments: 12, shares: 8 },
            { id: 'fb-feed-2', message: 'Check out our latest blog post on engagement strategies.', created_time: daysAgo(5), likes: 32, comments: 7, shares: 4 },
        ],
        facebookInsights: [
            { name: 'page_impressions', value: 12400, period: 'day' },
            { name: 'page_engaged_users', value: 890, period: 'day' },
            { name: 'page_fans', value: 12400, period: 'lifetime' },
        ],
        watermark: { enabled: false, position: 'bottom-right', opacity: 0.7, imageUrl: null },
        nextId: 1000,
    };
}
