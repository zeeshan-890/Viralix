'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, Heart, Users, CalendarClock } from 'lucide-react';
import { analyticsAPI, postsAPI, inboxAPI } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useAccounts } from '@/hooks/useAccounts';
import DashboardSkeleton from './DashboardSkeleton';
import DashboardHeader from './DashboardHeader';
import MetricCard from './MetricCard';
import PerformanceChart from './PerformanceChart';
import PlatformSnapshot from './PlatformSnapshot';
import ContentPipeline from './ContentPipeline';
import UpcomingSchedule from './UpcomingSchedule';
import RecentPostsList from './RecentPostsList';
import InboxPreview from './InboxPreview';
import QuickActionsPanel from './QuickActionsPanel';
import AiInsightsPanel from './AiInsightsPanel';

export default function DashboardHome() {
    const user = useAuthStore((s) => s.user);
    const { accounts } = useAccounts();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [overview, setOverview] = useState({});
    const [platformBreakdown, setPlatformBreakdown] = useState({});
    const [posts, setPosts] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [unreadTotal, setUnreadTotal] = useState(0);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError('');

        try {
            if (isRefresh) {
                try { await analyticsAPI.refresh(); } catch { /* best effort */ }
            }

            const [analyticsRes, postsRes, inboxRes] = await Promise.all([
                analyticsAPI.getOverview(),
                postsAPI.getAllPosts({ limit: 20 }),
                inboxAPI.list({ status: 'open', limit: 5 }),
            ]);

            const analytics = analyticsRes.data || {};
            const ov = analytics.overview || {};
            const allPosts = postsRes.data?.posts || [];

            setOverview({
                ...ov,
                failedPosts: ov.failedPosts ?? allPosts.filter((p) => p.status === 'failed').length,
            });
            setPlatformBreakdown(analytics.platformBreakdown || {});
            setPosts(allPosts);
            setConversations(inboxRes.data?.conversations || []);
            setUnreadTotal(inboxRes.data?.unreadTotal || 0);
        } catch (err) {
            setError('Could not load dashboard data. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-5 pb-6">
            <DashboardHeader
                userName={user?.name}
                onRefresh={() => loadData(true)}
                refreshing={refreshing}
            />

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
                >
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard
                    title="Total views"
                    value={formatNumber(overview.totalViews || 0)}
                    change={12}
                    icon={Eye}
                    accent="sage"
                />
                <MetricCard
                    title="Engagement rate"
                    value={`${(overview.engagementRate || 0).toFixed(1)}%`}
                    change={8}
                    icon={Heart}
                    accent="mint"
                />
                <MetricCard
                    title="Total followers"
                    value={formatNumber(overview.totalFollowers || 0)}
                    change={5}
                    icon={Users}
                    accent="forest"
                />
                <MetricCard
                    title="Scheduled"
                    value={overview.scheduledPosts || 0}
                    icon={CalendarClock}
                    accent="slate"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <PerformanceChart />
                </div>
                <div className="lg:col-span-4">
                    <PlatformSnapshot accounts={accounts} platformBreakdown={platformBreakdown} />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <ContentPipeline overview={overview} />
                <UpcomingSchedule posts={posts} />
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7">
                    <RecentPostsList posts={posts} />
                </div>
                <div className="space-y-4 lg:col-span-5">
                    <InboxPreview conversations={conversations} unreadTotal={unreadTotal} />
                    <QuickActionsPanel />
                    <AiInsightsPanel overview={overview} posts={posts} />
                </div>
            </div>
        </div>
    );
}
