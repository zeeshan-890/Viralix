'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { analyticsAPI, isMockMode } from '@/lib/api';
import { useAccounts } from '@/hooks/useAccounts';
import { DEMO_OVERVIEW_BANNER, buildDemoPlatformBreakdown } from '@/lib/mock/demoOverviewBanner';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import PlatformBreakdown from './PlatformBreakdown';
import TopPostsTable from './TopPostsTable';
import BestTimesPanel from './BestTimesPanel';
import AnalyticsTools from './AnalyticsTools';
import PlatformDeepAnalytics from './PlatformDeepAnalytics';
import OverviewMetricsBanner from './shared/OverviewMetricsBanner';
import { Loader2 } from 'lucide-react';

export default function AnalyticsPage() {
    const searchParams = useSearchParams();
    const platformParam = searchParams.get('platform') || '';
    const accountFilter = searchParams.get('account') || '';
    const demoOverview = searchParams.get('demo') === 'overview';

    const activeTab = ['tiktok', 'instagram'].includes(platformParam) ? platformParam : 'overview';
    const useDemoOverview = demoOverview || (isMockMode() && activeTab === 'overview');

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

    const overviewAnalytics = useDemoOverview
        ? {
              ...(analytics || {}),
              platformBreakdown: buildDemoPlatformBreakdown(DEMO_OVERVIEW_BANNER.accountBreakdown),
          }
        : analytics;

    const overviewAccounts = useDemoOverview ? DEMO_OVERVIEW_BANNER.accounts : accounts;
    const overviewData = useDemoOverview ? DEMO_OVERVIEW_BANNER.overview : (analytics?.overview || {});
    const connectedCount = overviewAccounts.filter((a) => a.isActive !== false).length;

    return (
        <div className="space-y-5 pb-2">
            <div className="space-y-5">
                {activeTab === 'overview' && (
                    <>
                        {loading && !useDemoOverview ? (
                            <div className="analytics-panel flex flex-col items-center justify-center gap-3 py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--viralix-primary)]" />
                                <p className="text-sm text-[var(--viralix-muted)]">Loading analytics…</p>
                            </div>
                        ) : error && !useDemoOverview ? (
                            <div className="analytics-panel border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">{error}</div>
                        ) : (
                            <>
                                <OverviewMetricsBanner
                                    overview={overviewData}
                                    connectedCount={connectedCount}
                                    onRefresh={useDemoOverview ? undefined : handleRefresh}
                                    refreshing={refreshing}
                                    demoMode={useDemoOverview}
                                />

                                <PerformanceChart />

                                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
                                    <TopPostsTable />
                                    <div className="space-y-5">
                                        <PlatformBreakdown
                                            analytics={overviewAnalytics}
                                            accounts={overviewAccounts}
                                            demoMode={useDemoOverview}
                                        />
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
