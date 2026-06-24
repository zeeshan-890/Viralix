'use client';

import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import { getPlatform } from '@/config/platforms';
import PlatformIcon from '@/components/ui/PlatformIcon';
import CompactMetricTile from './CompactMetricTile';
import { Eye, Heart, MessageCircle, Share2, TrendingUp, Users, BarChart3, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const OVERVIEW_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'facebook'];

function MiniPlatformStat({ label, value }) {
    return (
        <div className="rounded-md bg-[var(--viralix-inset)]/80 border border-[var(--viralix-border)]/70 px-1.5 py-1 text-center">
            <p className="text-[0.5625rem] font-semibold uppercase tracking-wide text-[var(--viralix-muted)] leading-none truncate">
                {label}
            </p>
            <p className="mt-0.5 text-xs font-bold tabular-nums text-[var(--viralix-accent)] leading-none">
                {value}
            </p>
        </div>
    );
}

function PlatformColumn({ platformId, accounts, breakdown }) {
    const config = getPlatform(platformId);
    const connected = accounts.filter((a) => a.platform === platformId && a.isActive !== false);
    const stats = breakdown[platformId] || {};
    const eng = stats.engagement || {};
    const totalEng = (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
    const engRate = eng.views > 0 ? ((totalEng / eng.views) * 100).toFixed(1) : '0.0';
    const followers = connected.reduce((n, a) => n + (a.followerCount || 0), 0);
    const primaryAccount = connected[0];

    return (
        <div className="flex h-full flex-col p-2.5 sm:p-3">
            <div className="flex items-center gap-2 mb-2">
                <div
                    className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--viralix-border)] shadow-sm',
                        config?.lightBg || 'bg-white'
                    )}
                >
                    <PlatformIcon platform={platformId} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--viralix-accent)] truncate">{config?.label}</p>
                    {connected.length > 0 ? (
                        <p className="text-[0.625rem] text-emerald-600 font-medium truncate">
                            {connected.length === 1
                                ? (primaryAccount?.accountName || `@${primaryAccount?.username || 'Connected'}`)
                                : `${connected.length} accounts`}
                        </p>
                    ) : (
                        <p className="text-[0.625rem] text-[var(--viralix-muted)]">Not connected</p>
                    )}
                </div>
                <span
                    className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        connected.length > 0 ? 'bg-emerald-500' : 'bg-[var(--viralix-border)]'
                    )}
                    aria-hidden
                />
            </div>

            {connected.length > 0 ? (
                <div className="grid grid-cols-2 gap-1 flex-1">
                    <MiniPlatformStat label="Followers" value={formatNumber(followers)} />
                    <MiniPlatformStat label="Views" value={formatNumber(eng.views || 0)} />
                    <MiniPlatformStat label="Posts" value={formatNumber(stats.published || stats.posts || 0)} />
                    <MiniPlatformStat label="Eng. %" value={`${engRate}%`} />
                </div>
            ) : (
                <Link
                    href="/dashboard/connect-accounts"
                    className="mt-auto rounded-md border border-dashed border-[var(--viralix-border)] px-2 py-2 text-center text-[0.625rem] font-medium text-[var(--viralix-muted)] hover:border-[var(--viralix-primary)] hover:text-[var(--viralix-primary-dark)] transition-colors"
                >
                    Connect
                </Link>
            )}
        </div>
    );
}

export default function OverviewAnalyticsBanner({
    overview = {},
    platformBreakdown = {},
    accounts = [],
    onRefresh,
    refreshing = false,
}) {
    const o = overview;

    const aggregateStats = [
        { label: 'Views', value: formatNumber(o.totalViews || 0), icon: Eye },
        { label: 'Eng. rate', value: `${o.engagementRate || 0}%`, icon: TrendingUp },
        { label: 'Likes', value: formatNumber(o.totalLikes || 0), icon: Heart },
        { label: 'Comments', value: formatNumber(o.totalComments || 0), icon: MessageCircle },
        { label: 'Shares', value: formatNumber(o.totalShares || 0), icon: Share2 },
        { label: 'Followers', value: formatNumber(o.totalFollowers || 0), icon: Users },
        { label: 'Published', value: formatNumber(o.publishedPosts || 0), icon: BarChart3 },
        { label: 'Scheduled', value: formatNumber(o.scheduledPosts || 0), icon: BarChart3 },
    ];

    const connectedCount = accounts.filter((a) => a.isActive !== false).length;

    return (
        <div className="analytics-panel overflow-hidden">
            {/* 4 platform columns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[var(--viralix-border)]">
                {OVERVIEW_PLATFORMS.map((platformId) => (
                    <PlatformColumn
                        key={platformId}
                        platformId={platformId}
                        accounts={accounts}
                        breakdown={platformBreakdown}
                    />
                ))}
            </div>

            {/* Aggregate stat row */}
            <div className="border-t border-[var(--viralix-border)] bg-[var(--viralix-inset)]/25 px-2.5 py-2 sm:px-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--viralix-muted)]">
                        All platforms · {connectedCount} connected
                    </p>
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.625rem] font-medium text-[var(--viralix-muted)] hover:bg-[var(--viralix-surface)] hover:text-[var(--viralix-accent)] disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
                            Refresh
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {aggregateStats.map((stat) => (
                        <CompactMetricTile
                            key={stat.label}
                            {...stat}
                            className="!p-2 [&_p:nth-child(2)]:!text-sm [&_p:nth-child(2)]:sm:!text-base"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
