'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const LABELS = {
    dashboard: 'Dashboard',
    upload: 'Upload',
    preview: 'Posts',
    schedule: 'Calendar',
    analytics: 'Analytics',
    inbox: 'Inbox',
    'auto-reply': 'Auto-Reply',
    bio: 'Bio Link',
    settings: 'Settings',
    platforms: 'Platforms',
    'connect-accounts': 'Connections',
    facebook: 'Facebook',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
};

export default function Breadcrumb() {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length <= 1) return null;

    const crumbs = segments.map((segment, index) => ({
        label: LABELS[segment] || (segment.length > 12 ? `${segment.slice(0, 8)}…` : segment),
        href: '/' + segments.slice(0, index + 1).join('/'),
        isLast: index === segments.length - 1,
    }));

    return (
        <nav className="hidden items-center gap-1 text-[0.6875rem] text-[#52796F] sm:flex" aria-label="Breadcrumb">
            <Link href="/dashboard" className="flex items-center hover:text-[#354F52]">
                <Home className="h-3 w-3" />
            </Link>
            {crumbs.slice(1).map((crumb) => (
                <span key={crumb.href} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 text-[var(--viralix-border)]" />
                    {crumb.isLast ? (
                        <span className="font-medium text-[#354F52]">{crumb.label}</span>
                    ) : (
                        <Link href={crumb.href} className="hover:text-[#354F52]">{crumb.label}</Link>
                    )}
                </span>
            ))}
        </nav>
    );
}
