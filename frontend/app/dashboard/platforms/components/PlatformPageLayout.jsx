'use client';
import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw, ExternalLink, ArrowLeft, BarChart3 } from 'lucide-react';
import { getPlatform, platformButtonClass } from '@/config/platforms';
import PlatformIcon from '@/components/ui/PlatformIcon';
import TikTokAccountTypeBadge from '@/components/tiktok/TikTokAccountTypeBadge';
import { getTikTokAccountId } from '@/lib/tiktokAccount';
import { cn } from '@/lib/utils';

/** @deprecated Use getPlatform() from @/config/platforms */
export const platformConfig = Object.fromEntries(
    ['facebook', 'instagram', 'tiktok', 'youtube'].map((id) => {
        const p = getPlatform(id);
        return [id, {
            name: p.label,
            icon: p.icon,
            color: p.color,
            bgColor: p.gradientClass || p.buttonClass,
            lightBg: p.lightBg,
            textColor: p.textColor,
        }];
    })
);

export default function PlatformPageLayout({
    platform,
    accounts = [],
    metrics = {},
    content = [],
    loading = false,
    refreshing = false,
    onRefresh,
    children
}) {
    const config = getPlatform(platform) || getPlatform('instagram');
    const hasAccounts = accounts.length > 0;

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <Link href="/dashboard/platforms" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Platforms
                    </Link>
                    <h1 className="text-3xl font-bold" style={{ color: '#354F52' }}>{config.label}</h1>
                </div>
                <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-gray-200 rounded-full mx-auto mb-4" style={{ borderTopColor: '#84A98C' }}></div>
                    <p className="text-gray-500">Loading {config.label} data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link href="/dashboard/platforms" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Platforms
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100', config.lightBg)}>
                            <PlatformIcon platform={platform} size={40} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: '#354F52' }}>{config.label}</h1>
                            <p className="text-gray-600">
                                {hasAccounts ? `${accounts.length} account${accounts.length > 1 ? 's' : ''} connected` : 'No accounts connected'}
                            </p>
                        </div>
                    </div>
                    {hasAccounts && (
                        <div className="flex items-center gap-2">
                            {['tiktok', 'instagram', 'youtube', 'facebook'].includes(platform) && (
                                <Link
                                    href={`/dashboard/analytics?platform=${platform}`}
                                    className="px-5 py-2.5 dash-card rounded-xl border border-[var(--viralix-border)] hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm text-sm font-medium"
                                    style={{ color: '#354F52' }}
                                >
                                    <BarChart3 className="w-4 h-4" style={{ color: '#84A98C' }} />
                                    Analytics
                                </Link>
                            )}
                            <button
                                onClick={onRefresh}
                                disabled={refreshing}
                                className={`px-5 py-2.5 dash-card rounded-xl border border-[var(--viralix-border)] hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm ${refreshing ? 'opacity-50' : ''}`}
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: '#52796F' }} />
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {!hasAccounts ? (
                /* No Accounts Connected State */
                <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-12 text-center shadow-sm">
                    <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6', config.lightBg)}>
                        <PlatformIcon platform={platform} size={40} />
                    </div>
                    <h2 className="text-2xl font-bold mb-3" style={{ color: '#354F52' }}>Connect your {config.label} account</h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Connect your {config.label} account to view your content, track analytics, and manage your posts all in one place.
                    </p>
                    <Link
                        href="/dashboard/connect-accounts"
                        className={cn(
                            'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all',
                            platformButtonClass(platform)
                        )}
                    >
                        <PlatformIcon platform={platform} size={20} inverted />
                        Connect {config.label}
                    </Link>
                </div>
            ) : (
                <>
                    {/* Connected Accounts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {accounts.map((account) => {
                            const accountKey = account.platformAccountId || account._id;
                            const analyticsHref = ['tiktok', 'instagram', 'youtube', 'facebook'].includes(platform)
                                ? `/dashboard/analytics?platform=${platform}&account=${account.platformAccountId || ''}`
                                : null;
                            const cardInner = (
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        {account.avatarUrl ? (
                                            <img src={account.avatarUrl} alt={account.accountName} className="w-14 h-14 rounded-full border-2 border-gray-100 object-cover" />
                                        ) : (
                                            <div className={cn('w-14 h-14 rounded-full flex items-center justify-center border border-gray-100', config.lightBg)}>
                                                <PlatformIcon platform={platform} size={32} />
                                            </div>
                                        )}
                                        <div className={cn('absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-gray-200', config.lightBg)}>
                                            <PlatformIcon platform={platform} size={14} />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate" style={{ color: '#354F52' }}>
                                            {account.accountName || 'Unknown'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {formatNumber(account.followerCount || 0)} followers
                                        </p>
                                        {platform === 'tiktok' && getTikTokAccountId(account) && (
                                            <TikTokAccountTypeBadge
                                                accountId={getTikTokAccountId(account)}
                                                size="sm"
                                                className="mt-1.5"
                                            />
                                        )}
                                    </div>
                                    {account.profileUrl && (
                                        <a
                                            href={account.profileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`p-2 ${config.lightBg} rounded-lg hover:opacity-80 transition-opacity`}
                                        >
                                            <ExternalLink className={`w-4 h-4 ${config.textColor}`} />
                                        </a>
                                    )}
                                </div>
                            );
                            return analyticsHref ? (
                                <Link key={accountKey} href={analyticsHref} className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-5 shadow-sm hover:shadow-md transition-all block">
                                    {cardInner}
                                </Link>
                            ) : (
                                <div key={accountKey} className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-5 shadow-sm hover:shadow-md transition-all">
                                    {cardInner}
                                </div>
                            );
                        })}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Total Views</span>
                                <span className="text-xl">👁️</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                {formatNumber(metrics.totalViews || 0)}
                            </p>
                        </div>
                        <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Total Likes</span>
                                <span className="text-xl">❤️</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                {formatNumber(metrics.totalLikes || 0)}
                            </p>
                        </div>
                        <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Comments</span>
                                <span className="text-xl">💬</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                {formatNumber(metrics.totalComments || 0)}
                            </p>
                        </div>
                        <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Posts</span>
                                <span className="text-xl">📝</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                {metrics.totalPosts || 0}
                            </p>
                        </div>
                    </div>

                    {/* Custom Content Section from children */}
                    {children}

                    {/* Content Grid */}
                    {content.length > 0 && (
                        <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-1" style={{ color: '#354F52' }}>Recent Content</h2>
                            <p className="text-sm text-gray-500 mb-6">Click any post for detailed analytics</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {content.map((item, index) => {
                                    // Create clickable link for Instagram posts
                                    const itemContent = (
                                        <>
                                            {item.thumbnail ? (
                                                <img
                                                    src={item.thumbnail}
                                                    alt={item.title || 'Content'}
                                                    className="w-full h-full absolute inset-0 object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-4xl">📷</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                                    <p className="text-sm font-medium truncate">{item.title || 'Untitled'}</p>
                                                    <div className="flex items-center gap-3 text-xs mt-1">
                                                        <span>👁️ {formatNumber(item.views || 0)}</span>
                                                        <span>❤️ {formatNumber(item.likes || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {item.type === 'video' && (
                                                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                                    🎬 Video
                                                </div>
                                            )}
                                        </>
                                    );

                                    // All platforms have detail pages now
                                    if ((platform === 'instagram' || platform === 'facebook' || platform === 'tiktok' || platform === 'youtube') && item.id) {
                                        return (
                                            <Link
                                                key={item.id || index}
                                                href={`/dashboard/platforms/${platform}/post/${item.id}`}
                                                className={`group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:ring-2 ${platform === 'instagram' ? 'hover:ring-pink-400' :
                                                    platform === 'facebook' ? 'hover:ring-blue-400' :
                                                        platform === 'youtube' ? 'hover:ring-red-600' :
                                                            'hover:ring-black'
                                                    } transition-all`}
                                            >
                                                {itemContent}
                                            </Link>
                                        );
                                    }

                                    return (
                                        <div key={item.id || index} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                            {itemContent}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty Content State */}
                    {content.length === 0 && (
                        <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-12 text-center shadow-sm">
                            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100', config.lightBg)}>
                                <PlatformIcon platform={platform} size={32} />
                            </div>
                            <h3 className="text-lg font-semibold mb-2" style={{ color: '#354F52' }}>No content yet</h3>
                            <p className="text-gray-600 mb-6">
                                Start publishing content to see it here
                            </p>
                            <Link
                                href="/dashboard/upload"
                                className={cn(
                                    'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all',
                                    platformButtonClass(platform)
                                )}
                            >
                                Create Post
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
