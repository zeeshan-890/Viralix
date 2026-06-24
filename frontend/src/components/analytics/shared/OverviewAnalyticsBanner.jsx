'use client';

import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import { getPlatform } from '@/config/platforms';
import PlatformIcon from '@/components/ui/PlatformIcon';
import CompactMetricTile from './CompactMetricTile';
import { Eye, Heart, MessageCircle, Share2, TrendingUp, Users, BarChart3, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORM_ORDER = ['instagram', 'tiktok', 'youtube', 'facebook'];

const GRID_COLS = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
};

function accountIdFor(account) {
    return String(account.platformAccountId || account.accountId || '');
}

function lookupAccountStats(accountBreakdown, platformId, account) {
    const id = accountIdFor(account);
    if (!id) return {};
    return accountBreakdown[`${platformId}:${id}`] || {};
}

function formatAccountLabel(account) {
    if (account.username != null && account.username !== '') {
        const u = String(account.username).trim().replace(/^@/, '');
        if (u) return `@${u}`;
    }
    const name = account.accountName != null ? String(account.accountName).trim() : '';
    if (name && !/^\d{12,}$/.test(name)) return name;
    return 'Connected account';
}

function engRateFromStats(stats) {
    const eng = stats.engagement || {};
    const totalEng = (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
    return eng.views > 0 ? ((totalEng / eng.views) * 100).toFixed(1) : '0.0';
}

function MiniPlatformStat({ label, value }) {
    return (
        <div className="rounded-md bg-black/20 border border-white/10 px-1.5 py-1 text-center">
            <p className="text-[0.5625rem] font-semibold uppercase tracking-wide text-white/50 leading-none truncate">
                {label}
            </p>
            <p className="mt-0.5 text-xs font-bold tabular-nums text-white leading-none">
                {value}
            </p>
        </div>
    );
}

function AccountMetricsGrid({ followers, stats }) {
    const eng = stats.engagement || {};
    const engRate = engRateFromStats(stats);

    return (
        <div className="grid grid-cols-2 gap-1">
            <MiniPlatformStat label="Followers" value={formatNumber(followers)} />
            <MiniPlatformStat label="Views" value={formatNumber(eng.views || 0)} />
            <MiniPlatformStat label="Posts" value={formatNumber(stats.published || stats.posts || 0)} />
            <MiniPlatformStat label="Eng. %" value={`${engRate}%`} />
        </div>
    );
}

function AccountCard({ account, platformId, accountBreakdown, compact }) {
    const stats = lookupAccountStats(accountBreakdown, platformId, account);
    const label = formatAccountLabel(account);
    const avatar = account.avatar || account.avatarUrl || account.profilePicture;

    return (
        <div
            className={cn(
                'rounded-lg border border-white/10 bg-black/15',
                compact ? 'p-2' : 'p-2.5'
            )}
        >
            <div className="flex items-center gap-2 mb-2 min-w-0">
                {avatar ? (
                    <img src={avatar} alt="" className="h-7 w-7 rounded-md object-cover border border-white/15 shrink-0" />
                ) : (
                    <div className="h-7 w-7 rounded-md bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                        <span className="text-[0.625rem] font-bold text-white/70">
                            {label.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
                <p className="text-[0.6875rem] font-medium text-emerald-400/90 truncate flex-1" title={label}>
                    {label}
                </p>
            </div>
            <AccountMetricsGrid followers={account.followerCount || 0} stats={stats} />
        </div>
    );
}

function PlatformColumn({ platformId, accounts, accountBreakdown }) {
    const config = getPlatform(platformId);
    const connected = accounts.filter((a) => a.platform === platformId && a.isActive !== false);
    const singleAccount = connected.length === 1;

    return (
        <div className="flex h-full flex-col p-2.5 sm:p-3 min-w-0">
            <div className="flex items-center gap-2 mb-2 shrink-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 shadow-sm">
                    <PlatformIcon platform={platformId} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{config?.label}</p>
                    <p className="text-[0.625rem] text-white/45">
                        {connected.length === 1 ? '1 account' : `${connected.length} accounts`}
                    </p>
                </div>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
            </div>

            {singleAccount ? (
                <div className="flex-1 min-w-0">
                    <div className="mb-2 min-w-0">
                        <p className="text-[0.6875rem] font-medium text-emerald-400/90 truncate" title={formatAccountLabel(connected[0])}>
                            {formatAccountLabel(connected[0])}
                        </p>
                    </div>
                    <AccountMetricsGrid
                        followers={connected[0].followerCount || 0}
                        stats={lookupAccountStats(accountBreakdown, platformId, connected[0])}
                    />
                </div>
            ) : (
                <div className="flex-1 space-y-2 min-w-0 max-h-[280px] overflow-y-auto pr-0.5 scrollbar-thin">
                    {connected.map((account) => (
                        <AccountCard
                            key={account._id || accountIdFor(account)}
                            account={account}
                            platformId={platformId}
                            accountBreakdown={accountBreakdown}
                            compact
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function OverviewAnalyticsBanner({
    overview = {},
    accountBreakdown = {},
    accounts = [],
    onRefresh,
    refreshing = false,
    demoMode = false,
}) {
    const o = overview;

    const activeAccounts = accounts.filter((a) => a.isActive !== false);
    const connectedPlatformIds = PLATFORM_ORDER.filter((platformId) =>
        activeAccounts.some((a) => a.platform === platformId)
    );

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

    const platformGridCols = GRID_COLS[connectedPlatformIds.length] || GRID_COLS[4];

    return (
        <div className="analytics-platform-banner overflow-hidden">
            {demoMode && (
                <div className="border-b border-amber-400/30 bg-amber-500/15 px-3 py-1.5 text-center text-[0.6875rem] font-medium text-amber-100">
                    Demo preview — sample multi-account data (2 Instagram · 2 TikTok · YouTube · Facebook)
                </div>
            )}
            {connectedPlatformIds.length > 0 ? (
                <div
                    className={cn(
                        'grid divide-y sm:divide-y-0 sm:divide-x divide-white/10',
                        platformGridCols
                    )}
                >
                    {connectedPlatformIds.map((platformId) => (
                        <PlatformColumn
                            key={platformId}
                            platformId={platformId}
                            accounts={accounts}
                            accountBreakdown={accountBreakdown}
                        />
                    ))}
                </div>
            ) : (
                <div className="px-4 py-8 text-center">
                    <p className="text-sm text-white/70">No platforms connected yet</p>
                    <p className="mt-1 text-xs text-white/45">Connect accounts to see per-platform metrics here</p>
                    <Link
                        href="/dashboard/connect-accounts"
                        className="mt-3 inline-flex rounded-lg bg-[#84A98C] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                    >
                        Connect accounts
                    </Link>
                </div>
            )}

            <div className="border-t border-white/10 bg-black/15 px-2.5 py-2 sm:px-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-white/45">
                        All platforms · {activeAccounts.length} connected
                    </p>
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.625rem] font-medium text-white/55 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-colors"
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
                            variant="dark"
                            className="!p-2"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
