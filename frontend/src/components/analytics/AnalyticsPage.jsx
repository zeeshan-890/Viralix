'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { analyticsAPI } from '@/lib/api';
import { useAccounts } from '@/hooks/useAccounts';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import PlatformBreakdown from './PlatformBreakdown';
import TopPostsTable from './TopPostsTable';
import BestTimesPanel from './BestTimesPanel';
import AnalyticsTools from './AnalyticsTools';
import PlatformDeepAnalytics from './PlatformDeepAnalytics';
import OverviewAnalyticsBanner from './shared/OverviewAnalyticsBanner';
import { Loader2 } from 'lucide-react';

export default function AnalyticsPage() {
    const searchParams = useSearchParams();
    const platformParam = searchParams.get('platform') || '';
    const accountFilter = searchParams.get('account') || '';

    const activeTab = ['tiktok', 'instagram'].includes(platformParam) ? platformParam : 'overview';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const { accounts } = useAccounts();

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
    const platformBreakdown = analytics?.platformBreakdown || {};

    return (
        <div className="space-y-5 pb-2">
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
                                <OverviewAnalyticsBanner
                                    overview={o}
                                    platformBreakdown={platformBreakdown}
                                    accounts={accounts}
                                    onRefresh={handleRefresh}
                                    refreshing={refreshing}
                                />

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
