'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { analyticsAPI } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import PlatformBreakdown from './PlatformBreakdown';
import TopPostsTable from './TopPostsTable';
import BestTimesPanel from './BestTimesPanel';
import AnalyticsTools from './AnalyticsTools';
import PlatformDeepAnalytics from './PlatformDeepAnalytics';
import PlatformIcon from '@/components/ui/PlatformIcon';
import { RefreshCw, Loader2, Eye, Heart, Users, TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'tiktok', label: 'TikTok', platform: 'tiktok' },
    { id: 'instagram', label: 'Instagram', platform: 'instagram' },
];

export default function AnalyticsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialTab = searchParams.get('platform') || 'overview';
    const accountFilter = searchParams.get('account') || '';

    const [activeTab, setActiveTab] = useState(
        ['tiktok', 'instagram'].includes(initialTab) ? initialTab : 'overview'
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            try { await analyticsAPI.refresh(); } catch { /* best effort */ }
            const res = await analyticsAPI.getOverview();
            setAnalytics(res.data);
        } catch {
            setError('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const params = new URLSearchParams();
        if (tabId !== 'overview') params.set('platform', tabId);
        const qs = params.toString();
        router.replace(`/dashboard/analytics${qs ? `?${qs}` : ''}`, { scroll: false });
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await analyticsAPI.refresh();
            await load();
        } finally {
            setRefreshing(false);
        }
    };

    const o = analytics?.overview || {};
    const stats = [
        { label: 'Views', value: formatNumber(o.totalViews || 0), icon: Eye },
        { label: 'Engagement', value: `${o.engagementRate || 0}%`, icon: TrendingUp },
        { label: 'Likes', value: formatNumber(o.totalLikes || 0), icon: Heart },
        { label: 'Followers', value: formatNumber(o.totalFollowers || 0), icon: Users },
    ];

    return (
        <div className="space-y-5 pb-2">
            {/* Dark hero header */}
            <div className="analytics-hero px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-white">Analytics</h1>
                        <p className="mt-1 text-sm text-white/60">
                            {activeTab === 'overview'
                                ? `${o.publishedPosts || 0} published · ${o.scheduledPosts || 0} scheduled`
                                : `Deep ${activeTab === 'tiktok' ? 'TikTok' : 'Instagram'} performance`}
                        </p>
                    </div>
                    {activeTab === 'overview' && !loading && (
                        <div className="flex flex-wrap items-center gap-2">
                            {stats.map(({ label, value, icon: Icon }) => (
                                <div key={label} className="analytics-stat-pill px-3 py-2 text-center min-w-[4.5rem]">
                                    <div className="flex items-center justify-center gap-1">
                                        <Icon className="h-3 w-3 text-white/70" aria-hidden />
                                        <p className="text-base font-bold tabular-nums leading-none text-white">{value}</p>
                                    </div>
                                    <p className="mt-1 text-[0.625rem] font-medium uppercase tracking-wider text-white/55">{label}</p>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="analytics-stat-pill inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-50 transition-colors"
                            >
                                <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                                Refresh
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap gap-1 rounded-xl bg-black/25 p-1 border border-white/10">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                activeTab === tab.id ? 'analytics-tab-active' : 'analytics-tab-inactive'
                            )}
                        >
                            {tab.platform && <PlatformIcon platform={tab.platform} size={16} />}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content on dashboard bg — light elevated cards */}
            <div className="space-y-5">
                {activeTab === 'overview' && (
                    <>
                        {loading ? (
                            <div className="analytics-panel flex flex-col items-center justify-center gap-3 py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--viralix-primary)]" />
                                <p className="text-sm text-[var(--viralix-muted)]">Loading analytics…</p>
                            </div>
                        ) : error ? (
                            <div className="analytics-panel border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">{error}</div>
                        ) : (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Link
                                        href="/dashboard/analytics?platform=tiktok"
                                        className="analytics-panel analytics-panel-hover flex items-center gap-4 p-5 group"
                                    >
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--viralix-inset)] border border-[var(--viralix-border)] shadow-sm">
                                            <PlatformIcon platform="tiktok" size={32} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-[var(--viralix-accent)] group-hover:text-[var(--viralix-primary-dark)]">TikTok deep analytics</p>
                                            <p className="text-xs text-[var(--viralix-muted)] mt-0.5">Views, charts, top videos, account stats</p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-[var(--viralix-muted)] group-hover:text-[var(--viralix-accent)] shrink-0" />
                                    </Link>
                                    <Link
                                        href="/dashboard/analytics?platform=instagram"
                                        className="analytics-panel analytics-panel-hover flex items-center gap-4 p-5 group"
                                    >
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--viralix-inset)] border border-[var(--viralix-border)] shadow-sm">
                                            <PlatformIcon platform="instagram" size={32} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-[var(--viralix-accent)] group-hover:text-[var(--viralix-primary-dark)]">Instagram deep analytics</p>
                                            <p className="text-xs text-[var(--viralix-muted)] mt-0.5">Reach, saves, reels, account insights</p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-[var(--viralix-muted)] group-hover:text-[var(--viralix-accent)] shrink-0" />
                                    </Link>
                                </div>

                                <PerformanceChart />

                                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
                                    <TopPostsTable />
                                    <div className="space-y-5">
                                        <PlatformBreakdown analytics={analytics} />
                                        <BestTimesPanel />
                                    </div>
                                </div>

                                <AnalyticsTools />
                            </>
                        )}
                    </>
                )}

                {activeTab === 'tiktok' && (
                    <PlatformDeepAnalytics platform="tiktok" accountId={accountFilter} />
                )}

                {activeTab === 'instagram' && (
                    <PlatformDeepAnalytics platform="instagram" accountId={accountFilter} />
                )}
            </div>
        </div>
    );
}
