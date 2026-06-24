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
import { RefreshCw, Loader2, Eye, Heart, Users, TrendingUp } from 'lucide-react';
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
        { label: 'Views', value: formatNumber(o.totalViews || 0), icon: Eye, tone: 'bg-white/10' },
        { label: 'Engagement', value: `${o.engagementRate || 0}%`, icon: TrendingUp, tone: 'bg-emerald-500/20 text-emerald-100' },
        { label: 'Likes', value: formatNumber(o.totalLikes || 0), icon: Heart, tone: 'bg-white/10' },
        { label: 'Followers', value: formatNumber(o.totalFollowers || 0), icon: Users, tone: 'bg-white/10' },
    ];

    return (
        <div className="dash-card overflow-hidden rounded-2xl border border-[var(--viralix-border)]">
            <div className="bg-gradient-to-r from-[#354F52] via-[#2F3E46] to-[#354F52] px-5 py-4 text-white sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
                        <p className="mt-0.5 text-sm text-white/60">
                            {activeTab === 'overview'
                                ? `${o.publishedPosts || 0} published · ${o.scheduledPosts || 0} scheduled · deep insights for TikTok & Instagram`
                                : `Detailed ${activeTab === 'tiktok' ? 'TikTok' : 'Instagram'} performance`}
                        </p>
                    </div>
                    {activeTab === 'overview' && (
                        <div className="flex flex-wrap items-center gap-2">
                            {stats.map(({ label, value, icon: Icon, tone }) => (
                                <div key={label} className={cn('rounded-lg px-3 py-1.5 text-center', tone || 'bg-white/10')}>
                                    <div className="flex items-center justify-center gap-1">
                                        <Icon className="h-3 w-3 opacity-70" aria-hidden />
                                        <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
                                    </div>
                                    <p className="mt-0.5 text-[0.625rem] font-medium uppercase tracking-wider opacity-70">{label}</p>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-[var(--viralix-surface)]/20 disabled:opacity-50"
                            >
                                <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                                Refresh
                            </button>
                        </div>
                    )}
                </div>

                {/* Platform tabs */}
                <div className="mt-4 flex flex-wrap gap-1 rounded-xl bg-black/20 p-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                                activeTab === tab.id
                                    ? 'bg-white text-[#354F52] shadow-sm'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                            )}
                        >
                            {tab.platform && <PlatformIcon platform={tab.platform} size={16} />}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-5 p-4 sm:p-5">
                {activeTab === 'overview' && (
                    <>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-[#84A98C]" />
                                <p className="text-sm text-[#52796F]">Loading analytics…</p>
                            </div>
                        ) : error ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                        ) : (
                            <>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Link
                                        href="/dashboard/analytics?platform=tiktok"
                                        className="flex items-center gap-4 rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-surface)] p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                                    >
                                        <PlatformIcon platform="tiktok" size={36} />
                                        <div>
                                            <p className="font-semibold text-[#354F52]">TikTok deep analytics</p>
                                            <p className="text-xs text-gray-500">Views, engagement rates, top videos, account stats</p>
                                        </div>
                                    </Link>
                                    <Link
                                        href="/dashboard/analytics?platform=instagram"
                                        className="flex items-center gap-4 rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-surface)] p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                                    >
                                        <PlatformIcon platform="instagram" size={36} />
                                        <div>
                                            <p className="font-semibold text-[#354F52]">Instagram deep analytics</p>
                                            <p className="text-xs text-gray-500">Reach, saves, reels performance, account insights</p>
                                        </div>
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
