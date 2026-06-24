import {
    LayoutDashboard,
    Calendar,
    FileText,
    Upload,
    Sparkles,
    BarChart3,
    MessageSquare,
    LayoutTemplate,
    Layers,
    Link2,
    Settings,
    Bot,
} from 'lucide-react';

/** @typedef {{ name: string, href: string, icon?: import('react').ComponentType<{ className?: string }>, exact?: boolean }} NavItem */
/** @typedef {{ name: string, href: string, exact?: boolean }} TopLink */
/** @typedef {{ id: string, label: string, items: NavItem[], topLinks?: TopLink[], match?: (path: string) => boolean }} NavSection */

/** @type {NavSection[]} */
export const NAV_SECTIONS = [
    {
        id: 'overview',
        label: 'Overview',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
        ],
        topLinks: [],
        match: (path) => path === '/dashboard',
    },
    {
        id: 'content',
        label: 'Content',
        items: [
            { name: 'Calendar', href: '/dashboard/schedule', icon: Calendar },
            { name: 'Posts', href: '/dashboard/preview', icon: FileText },
            { name: 'Upload', href: '/dashboard/upload', icon: Upload },
            { name: 'AI Studio', href: '/dashboard/upload', icon: Sparkles },
        ],
        topLinks: [
            { name: 'Calendar', href: '/dashboard/schedule' },
            { name: 'Posts', href: '/dashboard/preview' },
            { name: 'Upload', href: '/dashboard/upload' },
        ],
        match: (path) =>
            path.startsWith('/dashboard/schedule') ||
            path.startsWith('/dashboard/preview') ||
            path.startsWith('/dashboard/upload'),
    },
    {
        id: 'analytics',
        label: 'Analytics',
        items: [
            { name: 'Overview', href: '/dashboard/analytics', icon: BarChart3 },
        ],
        topLinks: [
            { name: 'Overview', href: '/dashboard/analytics' },
            { name: 'Posts', href: '/dashboard/preview' },
            { name: 'Inbox', href: '/dashboard/inbox' },
        ],
        match: (path) => path.startsWith('/dashboard/analytics'),
    },
    {
        id: 'engagement',
        label: 'Engagement',
        items: [
            { name: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare },
            { name: 'Auto-Reply', href: '/dashboard/inbox/auto-reply', icon: Bot },
            { name: 'Bio Link', href: '/dashboard/bio', icon: LayoutTemplate },
        ],
        topLinks: [
            { name: 'Inbox', href: '/dashboard/inbox' },
            { name: 'Auto-Reply', href: '/dashboard/inbox/auto-reply' },
            { name: 'Bio Link', href: '/dashboard/bio' },
        ],
        match: (path) =>
            path.startsWith('/dashboard/inbox') ||
            path.startsWith('/dashboard/bio') ||
            path.startsWith('/b/'),
    },
    {
        id: 'platforms',
        label: 'Platforms',
        items: [
            { name: 'All Platforms', href: '/dashboard/platforms', icon: Layers, exact: true },
            { name: 'Instagram', href: '/dashboard/platforms/instagram', platform: 'instagram' },
            { name: 'TikTok', href: '/dashboard/platforms/tiktok', platform: 'tiktok' },
            { name: 'YouTube', href: '/dashboard/platforms/youtube', platform: 'youtube' },
            { name: 'Facebook', href: '/dashboard/platforms/facebook', platform: 'facebook' },
            { name: 'IG Publish Test', href: '/dashboard/ig-test', platform: 'instagram' },
        ],
        topLinks: [
            { name: 'All', href: '/dashboard/platforms', exact: true },
            { name: 'Instagram', href: '/dashboard/platforms/instagram' },
            { name: 'TikTok', href: '/dashboard/platforms/tiktok' },
            { name: 'YouTube', href: '/dashboard/platforms/youtube' },
            { name: 'Facebook', href: '/dashboard/platforms/facebook' },
            { name: 'IG Test', href: '/dashboard/ig-test' },
        ],
        match: (path) => path.startsWith('/dashboard/platforms') || path.startsWith('/dashboard/ig-test'),
    },
    {
        id: 'connections',
        label: 'Connections',
        items: [
            { name: 'Connect Accounts', href: '/dashboard/connect-accounts', icon: Link2, exact: true },
            { name: 'Facebook', href: '/dashboard/connect-accounts/facebook', platform: 'facebook' },
            { name: 'Instagram', href: '/dashboard/connect-accounts/instagram-oauth', platform: 'instagram' },
            { name: 'TikTok', href: '/dashboard/connect-accounts/tiktok', platform: 'tiktok' },
            { name: 'YouTube', href: '/dashboard/connect-accounts/youtube', platform: 'youtube' },
        ],
        topLinks: [
            { name: 'Hub', href: '/dashboard/connect-accounts', exact: true },
            { name: 'Facebook', href: '/dashboard/connect-accounts/facebook' },
            { name: 'Instagram', href: '/dashboard/connect-accounts/instagram-oauth' },
            { name: 'TikTok', href: '/dashboard/connect-accounts/tiktok' },
            { name: 'YouTube', href: '/dashboard/connect-accounts/youtube' },
        ],
        match: (path) => path.startsWith('/dashboard/connect-accounts'),
    },
    {
        id: 'settings',
        label: 'Settings',
        items: [
            { name: 'Settings', href: '/dashboard/settings', icon: Settings, exact: true },
        ],
        topLinks: [
            { name: 'Account', href: '/dashboard/settings' },
        ],
        match: (path) => path.startsWith('/dashboard/settings'),
    },
];

const SECTION_TITLES = {
    overview: 'Dashboard',
    content: 'Content',
    analytics: 'Analytics',
    engagement: 'Engagement',
    platforms: 'Platforms',
    connections: 'Connections',
    settings: 'Settings',
};

/**
 * @param {string} pathname
 */
export function resolveNavigation(pathname) {
    let activeSection = NAV_SECTIONS[0];
    for (const section of NAV_SECTIONS) {
        if (section.match?.(pathname)) {
            activeSection = section;
            break;
        }
    }

    // Fallback: match by item href prefix
    if (activeSection.id === 'overview' && pathname !== '/dashboard') {
        for (const section of NAV_SECTIONS) {
            const hit = section.items.some((item) => {
                if (item.exact) return pathname === item.href;
                return pathname === item.href || pathname.startsWith(item.href + '/');
            });
            if (hit) {
                activeSection = section;
                break;
            }
        }
    }

    return {
        section: activeSection,
        sectionTitle: SECTION_TITLES[activeSection.id] || activeSection.label,
        topLinks: activeSection.topLinks || [],
    };
}

/**
 * @param {string} pathname
 * @param {NavItem} item
 */
export function isNavItemActive(pathname, item) {
    if (item.exact) return pathname === item.href;
    if (pathname === item.href) return true;
    return pathname.startsWith(item.href + '/');
}

/**
 * @param {string} pathname
 * @param {TopLink} link
 */
export function isTopLinkActive(pathname, link) {
    if (link.exact) return pathname === link.href;
    if (pathname === link.href) return true;
    return pathname.startsWith(link.href + '/');
}
