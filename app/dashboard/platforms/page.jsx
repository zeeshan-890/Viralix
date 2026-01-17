'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Instagram, PlayCircle, Youtube, Facebook } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';

const platforms = [
    {
        id: 'instagram',
        name: 'Instagram',
        description: 'Photos, Stories, and Reels',
        icon: '/instagram.png',
        bgColor: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
        lightBg: 'bg-pink-50'
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        description: 'Short-form videos',
        icon: '/tiktok.png',
        bgColor: 'bg-black',
        lightBg: 'bg-gray-100'
    },
    {
        id: 'youtube',
        name: 'YouTube',
        description: 'Videos and Shorts',
        icon: '/youtube.png',
        bgColor: 'bg-red-600',
        lightBg: 'bg-red-50'
    },
    {
        id: 'facebook',
        name: 'Facebook',
        description: 'Posts, Photos, and Videos',
        icon: '/facebook.png',
        bgColor: 'bg-blue-600',
        lightBg: 'bg-blue-50'
    }
];

export default function PlatformsPage() {
    const { accounts, isLoading } = useAccounts();

    const getAccountsForPlatform = (platformId) => {
        return accounts.filter(a => a.platform === platformId);
    };

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
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-gray-200 rounded-full mx-auto mb-4" style={{ borderTopColor: '#84A98C' }}></div>
                    <p className="text-gray-500">Loading platforms...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {platforms.map((platform) => {
                        const platformAccounts = getAccountsForPlatform(platform.id);
                        const isConnected = platformAccounts.length > 0;
                        const totalFollowers = platformAccounts.reduce((sum, acc) => sum + (acc.followerCount || 0), 0);

                        return (
                            <Link
                                key={platform.id}
                                href={`/dashboard/platforms/${platform.id}`}
                                className="group bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-300"
                            >
                                <div className="flex items-start gap-5">
                                    <div className={`w-16 h-16 ${platform.lightBg} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 border border-gray-100`}>
                                        <Image
                                            src={platform.icon}
                                            alt={platform.name}
                                            width={40}
                                            height={40}
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h2 className="text-xl font-semibold" style={{ color: '#354F52' }}>
                                                {platform.name}
                                            </h2>
                                            {isConnected ? (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
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
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Image src={platform.icon} alt="" width={20} height={20} className="object-contain" />
                                                    <div className="text-sm">
                                                        <span className="font-semibold" style={{ color: '#354F52' }}>
                                                            {formatNumber(totalFollowers)}
                                                        </span>
                                                        <span className="text-gray-500 ml-1">followers</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-600">
                                                <span className="group-hover:underline">Connect account →</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/dashboard/connect-accounts"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium shadow-md hover:shadow-lg transition-all"
                        style={{ backgroundColor: '#84A98C' }}
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
                        href="/dashboard/schedule"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    >
                        Create Post
                    </Link>
                </div>
            </div>
        </div>
    );
}
