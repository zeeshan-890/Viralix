'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { analyticsAPI } from '@/lib/api';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import PlatformBreakdown from './PlatformBreakdown';
import TopPostsTable from './TopPostsTable';
import BestTimesPanel from './BestTimesPanel';
import AnalyticsTools from './AnalyticsTools';
import PlatformDeepAnalytics from './PlatformDeepAnalytics';
import PlatformIcon from '@/components/ui/PlatformIcon';
import { RefreshCw, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
    const searchParams = useSearchParams();
    const platformParam = searchParams.get('platform') || '';
    const accountFilter = searchParams.get('account') || '';

    const activeTab = ['tiktok', 'instagram'].includes(platformParam) ? platformParam : 'overview';

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

    return (
        <div className="space-y-5 pb-2">
            {activeTab === 'overview' && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[var(--viralix-muted)]">
                        {!loading && (
                            <>
                                <span className="font-medium text-[var(--viralix-accent)]">{o.publishedPosts || 0} published</span>
                                {' · '}
                                <span>{o.scheduledPosts || 0} scheduled</span>
                            </>
                        )}
                    </p>
                    {!loading && (
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="btn-secondary btn-sm shadow-sm self-start sm:self-auto"
                        >
                            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                            Refresh
                        </button>
                    )}
                </div>
            )}

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
