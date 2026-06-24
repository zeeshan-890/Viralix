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

    const primaryMetrics = [
        { label: 'Total views', value: formatNumber(s.totalViews), icon: Eye },
        { label: 'Eng. rate', value: `${s.engagementRate || 0}%`, icon: TrendingUp, sub: 'interactions / views' },
        { label: 'Likes', value: formatNumber(s.totalLikes), icon: Heart },
        { label: 'Comments', value: formatNumber(s.totalComments), icon: MessageCircle },
        { label: 'Shares', value: formatNumber(s.totalShares), icon: Share2 },
        { label: 'Posts', value: formatNumber(s.totalPosts), icon: BarChart3 },
    ];

    const secondaryMetrics = [
        { label: 'Avg views', value: formatNumber(s.avgViewsPerPost), sub: `${s.totalPosts || 0} in period` },
        { label: 'Avg likes', value: formatNumber(s.avgLikesPerPost) },
        { label: 'Like / view', value: `${s.likeToViewRatio || 0}%` },
        { label: 'Comment / view', value: `${s.commentToViewRatio || 0}%` },
        ...(platform === 'instagram' && (s.totalSaves > 0)
            ? [{ label: 'Saves', value: formatNumber(s.totalSaves), icon: Bookmark }]
            : []),
    ];

    return (
        <div className="analytics-panel overflow-hidden">
            <div className="flex flex-col lg:flex-row">
                {/* Left — avatar + account details */}
                <div className="lg:w-[220px] xl:w-[240px] shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--viralix-border)] bg-[var(--viralix-inset)]/40 p-5">
                    <div className="flex flex-col items-center text-center lg:items-stretch lg:text-left">
                        <div className="relative mb-4">
                            {acc?.avatarUrl ? (
                                <img
                                    src={acc.avatarUrl}
                                    alt=""
                                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border-2 border-white shadow-md mx-auto lg:mx-0"
                                />
                            ) : (
                                <div
                                    className={cn(
                                        'h-20 w-20 sm:h-24 sm:w-24 rounded-2xl flex items-center justify-center border-2 border-white shadow-md mx-auto lg:mx-0',
                                        config.lightBg
                                    )}
                                >
                                    <PlatformIcon platform={platform} size={40} />
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 lg:right-auto lg:-right-1 h-7 w-7 rounded-lg bg-white border border-[var(--viralix-border)] shadow-sm flex items-center justify-center">
                                <PlatformIcon platform={platform} size={16} />
                            </div>
                        </div>

                        <h3 className="font-semibold text-[var(--viralix-accent)] text-base truncate">
                            {isAllAccounts ? `All ${config.label} accounts` : (acc?.accountName || config.label)}
                        </h3>

                        {!isAllAccounts && acc?.username && (
                            <p className="text-xs text-[var(--viralix-muted)] mt-0.5">@{acc.username}</p>
                        )}
                        {isAllAccounts && (
                            <p className="text-xs text-[var(--viralix-muted)] mt-0.5">{accounts.length} connected accounts</p>
                        )}

                        <dl className="mt-4 space-y-2.5 w-full text-sm">
                            <div className="flex justify-between items-center py-1.5 border-b border-[var(--viralix-border)]/80">
                                <dt className="text-[var(--viralix-muted)] text-xs flex items-center gap-1">
                                    <Users className="h-3 w-3" /> Followers
                                </dt>
                                <dd className="font-bold tabular-nums text-[var(--viralix-accent)]">
                                    {formatNumber(isAllAccounts
                                        ? accounts.reduce((n, a) => n + (a.followers || 0), 0)
                                        : acc?.followers)}
                                </dd>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-[var(--viralix-border)]/80">
                                <dt className="text-[var(--viralix-muted)] text-xs">Synced posts</dt>
                                <dd className="font-bold tabular-nums text-[var(--viralix-accent)]">
                                    {formatNumber(isAllAccounts ? s.totalPosts : (acc?.contentStats?.posts ?? s.totalPosts))}
                                </dd>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-[var(--viralix-border)]/80">
                                <dt className="text-[var(--viralix-muted)] text-xs">Avg views</dt>
                                <dd className="font-bold tabular-nums text-[var(--viralix-accent)]">
                                    {formatNumber(isAllAccounts ? s.avgViewsPerPost : (acc?.avgViewsPerPost ?? s.avgViewsPerPost))}
                                </dd>
                            </div>
                            <div className="flex justify-between items-center py-1.5">
                                <dt className="text-[var(--viralix-muted)] text-xs">Avg engagement</dt>
                                <dd className="font-bold tabular-nums text-[var(--viralix-accent)]">
                                    {formatNumber(isAllAccounts ? s.avgEngagementPerPost : (acc?.avgEngagementPerPost ?? s.avgEngagementPerPost))}
                                </dd>
                            </div>
                        </dl>

                        {!isAllAccounts && platform === 'tiktok' && acc?.videoCount != null && (
                            <p className="mt-3 text-[0.6875rem] text-[var(--viralix-muted)] flex items-center gap-1 justify-center lg:justify-start">
                                <Film className="h-3 w-3" />
                                {formatNumber(acc.videoCount)} videos on TikTok
                            </p>
                        )}

                        {!isAllAccounts && platform === 'instagram' && acc?.accountInsights && (
                            <div className="mt-3 pt-3 border-t border-[var(--viralix-border)] space-y-1.5 text-xs">
                                {acc.accountInsights.reach != null && (
                                    <div className="flex justify-between">
                                        <span className="text-[var(--viralix-muted)]">Reach (24h)</span>
                                        <strong className="text-[var(--viralix-accent)]">{formatNumber(acc.accountInsights.reach)}</strong>
                                    </div>
                                )}
                                {acc.accountInsights.profile_views != null && (
                                    <div className="flex justify-between">
                                        <span className="text-[var(--viralix-muted)]">Profile views</span>
                                        <strong className="text-[var(--viralix-accent)]">{formatNumber(acc.accountInsights.profile_views)}</strong>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right — compact metric grid */}
                <div className="flex-1 p-4 sm:p-5 bg-[var(--viralix-surface)]">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--viralix-muted)] mb-3">
                        Performance summary
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-2.5">
                        {primaryMetrics.map((m) => (
                            <CompactMetricTile key={m.label} {...m} />
                        ))}
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-2.5">
                        {secondaryMetrics.map((m) => (
                            <CompactMetricTile key={m.label} {...m} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
