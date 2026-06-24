'use client';

import { formatNumber } from '@/lib/utils';
import { getPlatform } from '@/config/platforms';
import PlatformIcon from '@/components/ui/PlatformIcon';
import CompactMetricTile from './CompactMetricTile';
import {
    Eye, Heart, MessageCircle, Share2, Bookmark, TrendingUp, BarChart3, Users, Film,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PlatformAnalyticsBanner({
    platform,
    account,
    summary = {},
    accounts = [],
    isAllAccounts = false,
}) {
    const config = getPlatform(platform);
    const s = summary;
    const acc = account;

    const allMetrics = [
        { label: 'Total views', value: formatNumber(s.totalViews), icon: Eye },
        { label: 'Eng. rate', value: `${s.engagementRate || 0}%`, icon: TrendingUp, sub: 'interactions / views' },
        { label: 'Likes', value: formatNumber(s.totalLikes), icon: Heart },
        { label: 'Comments', value: formatNumber(s.totalComments), icon: MessageCircle },
        { label: 'Shares', value: formatNumber(s.totalShares), icon: Share2 },
        { label: 'Posts', value: formatNumber(s.totalPosts), icon: BarChart3 },
        { label: 'Avg views', value: formatNumber(s.avgViewsPerPost), sub: `${s.totalPosts || 0} in period` },
        { label: 'Avg likes', value: formatNumber(s.avgLikesPerPost) },
        { label: 'Like / view', value: `${s.likeToViewRatio || 0}%` },
        { label: 'Comment / view', value: `${s.commentToViewRatio || 0}%` },
        ...(platform === 'instagram' && (s.totalSaves > 0)
            ? [{ label: 'Saves', value: formatNumber(s.totalSaves), icon: Bookmark }]
            : []),
    ];

    return (
        <div className="analytics-platform-banner overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:min-h-[220px]">
                {/* Left — avatar on top, account details below */}
                <div className="lg:w-[34%] xl:w-[32%] lg:max-w-[300px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/15 p-4 sm:p-5">
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                        <div className="relative mb-3">
                            {acc?.avatarUrl ? (
                                <img
                                    src={acc.avatarUrl}
                                    alt=""
                                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg mx-auto lg:mx-0"
                                />
                            ) : (
                                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-lg mx-auto lg:mx-0 bg-white/10">
                                    <PlatformIcon platform={platform} size={36} />
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-md bg-[#2F3E46] border border-white/20 shadow-sm flex items-center justify-center">
                                <PlatformIcon platform={platform} size={14} />
                            </div>
                        </div>

                        <h3 className="font-semibold text-white text-sm sm:text-base truncate w-full">
                            {isAllAccounts ? `All ${config.label} accounts` : (acc?.accountName || config.label)}
                        </h3>

                        {!isAllAccounts && acc?.username != null && acc.username !== '' && (
                            <p className="text-xs text-white/55 mt-0.5 truncate w-full">
                                @{String(acc.username).replace(/^@/, '')}
                            </p>
                        )}
                        {isAllAccounts && (
                            <p className="text-xs text-white/55 mt-0.5">{accounts.length} connected accounts</p>
                        )}

                        <dl className="mt-3 space-y-0 w-full text-sm">
                            {[
                                {
                                    label: 'Followers',
                                    value: formatNumber(isAllAccounts
                                        ? accounts.reduce((n, a) => n + (a.followers || 0), 0)
                                        : acc?.followers),
                                    icon: Users,
                                },
                                {
                                    label: 'Synced posts',
                                    value: formatNumber(isAllAccounts ? s.totalPosts : (acc?.contentStats?.posts ?? s.totalPosts)),
                                },
                                {
                                    label: 'Avg views',
                                    value: formatNumber(isAllAccounts ? s.avgViewsPerPost : (acc?.avgViewsPerPost ?? s.avgViewsPerPost)),
                                },
                                {
                                    label: 'Avg engagement',
                                    value: formatNumber(isAllAccounts ? s.avgEngagementPerPost : (acc?.avgEngagementPerPost ?? s.avgEngagementPerPost)),
                                },
                            ].map((row, i, arr) => (
                                <div
                                    key={row.label}
                                    className={cn(
                                        'flex justify-between items-center py-2',
                                        i < arr.length - 1 && 'border-b border-white/10'
                                    )}
                                >
                                    <dt className="text-white/55 text-xs flex items-center gap-1">
                                        {row.icon && <row.icon className="h-3 w-3" />}
                                        {row.label}
                                    </dt>
                                    <dd className="font-bold tabular-nums text-white text-sm">
                                        {row.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        {!isAllAccounts && platform === 'tiktok' && acc?.videoCount != null && (
                            <p className="mt-2 text-[0.6875rem] text-white/45 flex items-center gap-1 justify-center lg:justify-start">
                                <Film className="h-3 w-3" />
                                {formatNumber(acc.videoCount)} videos on TikTok
                            </p>
                        )}

                        {!isAllAccounts && platform === 'instagram' && acc?.accountInsights && (
                            <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5 text-xs w-full">
                                {acc.accountInsights.reach != null && (
                                    <div className="flex justify-between">
                                        <span className="text-white/45">Reach (24h)</span>
                                        <strong className="text-white">{formatNumber(acc.accountInsights.reach)}</strong>
                                    </div>
                                )}
                                {acc.accountInsights.profile_views != null && (
                                    <div className="flex justify-between">
                                        <span className="text-white/45">Profile views</span>
                                        <strong className="text-white">{formatNumber(acc.accountInsights.profile_views)}</strong>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right — metrics evenly distributed */}
                <div className="flex-1 flex flex-col p-3 sm:p-4 min-w-0">
                    <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-white/45 mb-2 sm:mb-3">
                        Performance summary
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 flex-1 auto-rows-fr">
                        {allMetrics.map((m) => (
                            <CompactMetricTile key={m.label} {...m} variant="dark" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
