'use client';

import Link from 'next/link';
import { formatNumber, cn } from '@/lib/utils';
import { getPlatform } from '@/config/platforms';
import PlatformBadge from '@/components/ui/PlatformBadge';
import { RefreshCw } from 'lucide-react';

const PLATFORM_ORDER = ['instagram', 'tiktok', 'youtube', 'facebook'];

const EMPTY_PLATFORM = {
    posts: 0,
    published: 0,
    scheduled: 0,
    engagement: { likes: 0, comments: 0, shares: 0, views: 0 },
};

function PanelLabel({ children }) {
    return (
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--viralix-muted)]">
            {children}
        </p>
    );
}

function engRateFromEngagement(eng = {}) {
    const totalEng = (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
    return eng.views > 0 ? ((totalEng / eng.views) * 100).toFixed(1) : '0.0';
}

function MetricCell({ label, value }) {
    return (
        <div className="analytics-inset flex min-w-0 flex-col items-center justify-center rounded-lg px-1 py-2 text-center">
            <p className="w-full truncate text-[0.5625rem] font-semibold uppercase tracking-wide text-[var(--viralix-muted)]">
                {label}
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums leading-none text-[var(--viralix-accent)]">
                {value}
            </p>
        </div>
    );
}

export default function PlatformBreakdown({
    analytics,
    accounts = [],
    onRefresh,
    refreshing = false,
    demoMode = false,
}) {
    const breakdown = analytics?.platformBreakdown || {};
    const activeAccounts = accounts.filter((a) => a.isActive !== false);
    const connectedIds = PLATFORM_ORDER.filter((platformId) =>
        activeAccounts.some((a) => a.platform === platformId)
    );

    const platforms = connectedIds.map((name) => {
        const data = breakdown[name] || EMPTY_PLATFORM;
        const eng = data.engagement || {};
        return { name, data, eng, rate: engRateFromEngagement(eng) };
    });

    if (!platforms.length) {
        return (
            <div className="dash-card rounded-xl border border-[var(--viralix-border)] p-6 text-center shadow-sm">
                <p className="text-sm text-[var(--viralix-muted)]">Connect platforms to see breakdown</p>
                <Link
                    href="/dashboard/connect-accounts"
                    className="mt-3 inline-flex rounded-lg bg-[var(--viralix-primary)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                >
                    Connect accounts
                </Link>
            </div>
        );
    }

    return (
        <div className="dash-card overflow-hidden rounded-xl border border-[var(--viralix-border)]">
            {demoMode && (
                <div className="border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-[0.6875rem] font-medium text-amber-800">
                    Demo preview — sample platform metrics
                </div>
            )}
            <div className="flex items-center justify-between gap-2 border-b border-[var(--viralix-border)] bg-[var(--viralix-bg)] px-4 py-2.5 sm:px-5">
                <PanelLabel>By platform</PanelLabel>
                {onRefresh && (
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.625rem] font-medium text-[var(--viralix-muted)] transition-colors hover:bg-white hover:text-[var(--viralix-accent)] disabled:opacity-50"
                    >
                        <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
                        Refresh
                    </button>
                )}
            </div>
            <ul className="divide-y divide-[var(--viralix-border)]">
                {platforms.map(({ name, data, eng, rate }) => {
                    const cfg = getPlatform(name);
                    return (
                        <li key={name} className="px-4 py-3 transition-colors hover:bg-[var(--viralix-bg)] sm:px-5">
                            <div className="mb-2 flex items-center gap-2.5">
                                <PlatformBadge platform={name} size="md" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-[var(--viralix-accent)]">
                                        {cfg?.label || name}
                                    </p>
                                    <p className="text-xs text-[var(--viralix-muted)]">
                                        {data.published || 0} live · {data.scheduled || 0} scheduled
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                                <MetricCell label="Views" value={formatNumber(eng.views || 0)} />
                                <MetricCell label="Likes" value={formatNumber(eng.likes || 0)} />
                                <MetricCell label="Comments" value={formatNumber(eng.comments || 0)} />
                                <MetricCell label="Eng. %" value={`${rate}%`} />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
