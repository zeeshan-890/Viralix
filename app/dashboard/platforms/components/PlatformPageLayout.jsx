'use client';
import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw, ExternalLink, ArrowLeft, AlertCircle } from 'lucide-react';

// Platform configuration with colors and icons
export const platformConfig = {
    instagram: {
        name: 'Instagram',
        icon: '/instagram.png',
        color: '#E4405F',
        bgColor: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
        lightBg: 'bg-pink-50',
        textColor: 'text-pink-600'
    },
    tiktok: {
        name: 'TikTok',
        icon: '/tiktok.png',
        color: '#000000',
        bgColor: 'bg-black',
        lightBg: 'bg-gray-100',
        textColor: 'text-gray-900'
    },
    youtube: {
        name: 'YouTube',
        icon: '/youtube.png',
        color: '#FF0000',
        bgColor: 'bg-red-600',
        lightBg: 'bg-red-50',
        textColor: 'text-red-600'
    },
    facebook: {
        name: 'Facebook',
        icon: '/facebook.png',
        color: '#1877F2',
        bgColor: 'bg-blue-600',
        lightBg: 'bg-blue-50',
        textColor: 'text-blue-600'
    }
};

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
    const config = platformConfig[platform] || platformConfig.instagram;
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
                    <h1 className="text-3xl font-bold" style={{ color: '#354F52' }}>{config.name}</h1>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-gray-200 rounded-full mx-auto mb-4" style={{ borderTopColor: '#84A98C' }}></div>
                    <p className="text-gray-500">Loading {config.name} data...</p>
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
                        <div className={`w-16 h-16 ${config.bgColor} rounded-2xl flex items-center justify-center shadow-lg`}>
                            <Image src={config.icon} alt={config.name} width={36} height={36} className="brightness-0 invert" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: '#354F52' }}>{config.name}</h1>
                            <p className="text-gray-600">
                                {hasAccounts ? `${accounts.length} account${accounts.length > 1 ? 's' : ''} connected` : 'No accounts connected'}
                            </p>
                        </div>
                    </div>
                    {hasAccounts && (
                        <button
                            onClick={onRefresh}
                            disabled={refreshing}
                            className={`px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm ${refreshing ? 'opacity-50' : ''}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: '#52796F' }} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    )}
                </div>
            </div>

            {!hasAccounts ? (
                /* No Accounts Connected State */
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                    <div className={`w-20 h-20 ${config.lightBg} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                        <Image src={config.icon} alt={config.name} width={40} height={40} />
                    </div>
                    <h2 className="text-2xl font-bold mb-3" style={{ color: '#354F52' }}>Connect your {config.name} account</h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Connect your {config.name} account to view your content, track analytics, and manage your posts all in one place.
                    </p>
                    <Link
                        href="/dashboard/connect-accounts"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all"
                        style={{ backgroundColor: '#84A98C' }}
                    >
                        <Image src={config.icon} alt={config.name} width={20} height={20} className="brightness-0 invert" />
                        Connect {config.name}
                    </Link>
                </div>
            ) : (
                <>
                    {/* Connected Accounts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {accounts.map((account) => (
                            <div key={account.platformAccountId || account._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        {account.avatarUrl ? (
                                            <Image src={account.avatarUrl} alt={account.accountName} width={56} height={56} className="rounded-full border-2 border-gray-100" />
                                        ) : (
                                            <div className={`w-14 h-14 ${config.lightBg} rounded-full flex items-center justify-center`}>
                                                <Image src={config.icon} alt={config.name} width={28} height={28} />
                                            </div>
                                        )}
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${config.bgColor} rounded-full flex items-center justify-center`}>
                                            <Image src={config.icon} alt="" width={12} height={12} className="brightness-0 invert" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate" style={{ color: '#354F52' }}>
                                            {account.accountName || 'Unknown'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {formatNumber(account.followerCount || 0)} followers
                                        </p>
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
                            </div>
                        ))}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Total Views</span>
                                <span className="text-xl">👁️</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                {formatNumber(metrics.totalViews || 0)}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Total Likes</span>
                                <span className="text-xl">❤️</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                {formatNumber(metrics.totalLikes || 0)}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Comments</span>
                                <span className="text-xl">💬</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                {formatNumber(metrics.totalComments || 0)}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
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
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-6" style={{ color: '#354F52' }}>Recent Content</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {content.map((item, index) => (
                                    <div key={item.id || index} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                        {item.thumbnail ? (
                                            <Image
                                                src={item.thumbnail}
                                                alt={item.title || 'Content'}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty Content State */}
                    {content.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                            <div className={`w-16 h-16 ${config.lightBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                <AlertCircle className={`w-8 h-8 ${config.textColor}`} />
                            </div>
                            <h3 className="text-lg font-semibold mb-2" style={{ color: '#354F52' }}>No content yet</h3>
                            <p className="text-gray-600 mb-6">
                                Start publishing content to see it here
                            </p>
                            <Link
                                href="/dashboard/schedule"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all"
                                style={{ backgroundColor: '#84A98C' }}
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
