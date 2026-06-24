'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAccounts } from '@/hooks/useAccounts';
import { PLATFORM_LIST, platformButtonClass } from '@/config/platforms';
import PlatformIcon from '@/components/ui/PlatformIcon';
import { cn } from '@/lib/utils';

export default function PlatformsPage() {
    const { accounts, isLoading } = useAccounts();

    const getAccountsForPlatform = (platformId) => accounts.filter((a) => a.platform === platformId);

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#354F52' }}>Platform Management</h1>
                <p className="text-gray-600">View and manage your connected social media accounts</p>
            </div>

            {isLoading ? (
                <div className="dash-card dash-card-hover rounded-xl border border-[var(--viralix-border)] p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-gray-200 rounded-full mx-auto mb-4" style={{ borderTopColor: '#84A98C' }} />
                    <p className="text-gray-500">Loading platforms...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PLATFORM_LIST.map((platform) => {
                        const platformAccounts = getAccountsForPlatform(platform.id);
                        const isConnected = platformAccounts.length > 0;
                        const totalFollowers = platformAccounts.reduce((sum, acc) => sum + (acc.followerCount || 0), 0);

                        return (
                            <Link
                                key={platform.id}
                                href={`/dashboard/platforms/${platform.id}`}
                                className="group dash-card rounded-2xl border border-[var(--viralix-border)] p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-300"
                            >
                                <div className="flex items-start gap-5">
                                    <div className={cn(
                                        'w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 border border-gray-100',
                                        platform.lightBg
                                    )}>
                                        <PlatformIcon platform={platform.id} size={40} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h2 className="text-xl font-semibold" style={{ color: '#354F52' }}>
                                                {platform.label}
                                            </h2>
                                            {isConnected ? (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                                    Connected
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                                    Not connected
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4">{platform.description}</p>

                                        {isConnected ? (
                                            <div className="flex items-center gap-2">
                                                <PlatformIcon platform={platform.id} size={20} />
                                                <div className="text-sm">
                                                    <span className="font-semibold" style={{ color: '#354F52' }}>
                                                        {formatNumber(totalFollowers)}
                                                    </span>
                                                    <span className="text-gray-500 ml-1">followers</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className={cn('text-sm font-medium group-hover:underline', platform.textColor)}>
                                                Connect account →
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            <div className="mt-8 dash-card rounded-2xl border border-[var(--viralix-border)] p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/dashboard/connect-accounts"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium shadow-md hover:shadow-lg transition-all"
                        style={{ backgroundColor: '#354F52' }}
                    >
                        Connect New Account
                    </Link>
                    <Link
                        href="/dashboard/analytics"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    >
                        View All Analytics
                    </Link>
                    <Link
                        href="/dashboard/upload"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    >
                        Create Post
                    </Link>
                </div>
            </div>
        </div>
    );
}
