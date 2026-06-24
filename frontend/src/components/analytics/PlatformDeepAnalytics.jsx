'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { analyticsAPI, platformSyncAPI } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { getPlatform } from '@/config/platforms';
import PlatformIcon from '@/components/ui/PlatformIcon';
import MetricCard from './shared/MetricCard';
import DeepTimelineChart from './shared/DeepTimelineChart';
import MetricsLineChart from './shared/MetricsLineChart';
import EngagementPieChart from './shared/EngagementPieChart';
import DistributionPieChart from './shared/DistributionPieChart';
import TopPostsBarChart, { AccountComparisonBarChart } from './shared/TopPostsBarChart';
import PostsActivityBarChart from './shared/PostsActivityBarChart';
import TopContentTable from './shared/TopContentTable';
import {
    Eye, Heart, MessageCircle, Share2, Bookmark, TrendingUp, BarChart3,
    RefreshCw, Loader2, Video, Image as ImageIcon, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PERIODS = [
    { id: '7d', label: '7 days' },
    { id: '30d', label: '30 days' },
    { id: '90d', label: '90 days' },
    { id: 'all', label: 'All time' },
];

export default function PlatformDeepAnalytics({ platform, accountId: initialAccountId }) {
    const config = getPlatform(platform);
    const [period, setPeriod] = useState('30d');
    const [accountId, setAccountId] = useState(initialAccountId || '');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await analyticsAPI.getDeepAnalytics(platform, {
                period,
                ...(accountId ? { accountId } : {}),
            });
            setData(res.data);
        } catch {
            setError('Failed to load analytics. Try syncing your content first.');
        } finally {
            setLoading(false);
        }
    }, [platform, period, accountId]);

    useEffect(() => { load(); }, [load]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await platformSyncAPI.sync(platform);
            await load();
        } catch {
            setError('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="analytics-panel flex flex-col items-center justify-center gap-3 py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--viralix-primary)]" />
                <p className="text-sm text-[var(--viralix-muted)]">Loading {config.label} analytics…</p>
            </div>
        );
    }

    const s = data?.summary || {};
    const accounts = data?.accounts || [];

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="analytics-panel p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-inset)] shadow-sm', config.lightBg)}>
                        <PlatformIcon platform={platform} size={28} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--viralix-accent)]">{config.label} Analytics</h2>
                        <p className="text-xs text-[var(--viralix-muted)]">Native content synced from {config.label}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {accounts.length > 1 && (
                        <select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-3 py-2 text-sm text-[var(--viralix-accent)] shadow-sm"
                        >
                            <option value="">All accounts</option>
                            {accounts.map((a) => (
                                <option key={a.accountId} value={a.accountId}>{a.accountName || a.username}</option>
                            ))}
                        </select>
                    )}
                    <div className="flex rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-inset)] p-0.5">
                        {PERIODS.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setPeriod(p.id)}
                                className={cn(
                                    'rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
                                    period === p.id
                                        ? 'bg-[var(--viralix-surface)] text-[var(--viralix-accent)] shadow-sm'
                                        : 'text-[var(--viralix-muted)] hover:text-[var(--viralix-accent)]'
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleSync}
                        disabled={syncing}
                        className="btn-secondary btn-sm shadow-sm"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
                        Sync
                    </button>
                    <Link href={`/dashboard/platforms/${platform}`} className="btn-secondary btn-sm shadow-sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Platform
                    </Link>
                </div>
            </div>
            </div>

            {error && (
                <div className="analytics-panel border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">{error}</div>
            )}

            {/* Account cards */}
            {accounts.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((acc) => (
                        <div key={acc.accountId} className="analytics-panel analytics-panel-hover p-5">
                            <div className="flex items-center gap-3 mb-3">
                                {acc.avatarUrl ? (
                                    <img src={acc.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover border border-gray-100" />
                                ) : (
                                    <div className={cn('h-12 w-12 rounded-full flex items-center justify-center', config.lightBg)}>
                                        <PlatformIcon platform={platform} size={24} />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="font-semibold text-[var(--viralix-accent)] truncate">{acc.accountName}</p>
                                    {acc.username && <p className="text-xs text-[var(--viralix-muted)]">@{acc.username}</p>}
                                </div>
                            </div>
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div className="analytics-inset p-2.5">
                                    <dt className="text-[0.625rem] uppercase tracking-wide text-[var(--viralix-muted)]">Followers</dt>
                                    <dd className="font-bold tabular-nums text-[var(--viralix-accent)] mt-0.5">{formatNumber(acc.followers)}</dd>
                                </div>
                                <div className="analytics-inset p-2.5">
                                    <dt className="text-[0.625rem] uppercase tracking-wide text-[var(--viralix-muted)]">Synced posts</dt>
                                    <dd className="font-bold tabular-nums text-[var(--viralix-accent)] mt-0.5">{formatNumber(acc.contentStats?.posts)}</dd>
                                </div>
                                <div className="analytics-inset p-2.5">
                                    <dt className="text-[0.625rem] uppercase tracking-wide text-[var(--viralix-muted)]">Avg views</dt>
                                    <dd className="font-bold tabular-nums text-[var(--viralix-accent)] mt-0.5">{formatNumber(acc.avgViewsPerPost)}</dd>
                                </div>
                                <div className="analytics-inset p-2.5">
                                    <dt className="text-[0.625rem] uppercase tracking-wide text-[var(--viralix-muted)]">Avg engagement</dt>
                                    <dd className="font-bold tabular-nums text-[var(--viralix-accent)] mt-0.5">{formatNumber(acc.avgEngagementPerPost)}</dd>
                                </div>
                            </dl>
                            {platform === 'instagram' && acc.accountInsights && Object.keys(acc.accountInsights).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                                    {acc.accountInsights.reach != null && (
                                        <div><span className="text-gray-500">Reach (24h)</span><br /><strong>{formatNumber(acc.accountInsights.reach)}</strong></div>
                                    )}
                                    {acc.accountInsights.profile_views != null && (
                                        <div><span className="text-gray-500">Profile views</span><br /><strong>{formatNumber(acc.accountInsights.profile_views)}</strong></div>
                                    )}
                                </div>
                            )}
                            {platform === 'tiktok' && acc.videoCount != null && (
                                <p className="mt-2 text-xs text-gray-500">{formatNumber(acc.videoCount)} total videos on TikTok</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Summary metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <MetricCard label="Total views" value={formatNumber(s.totalViews)} icon={Eye} accent="mint" />
                <MetricCard label="Engagement rate" value={`${s.engagementRate || 0}%`} icon={TrendingUp} accent="purple" sub="All interactions / views" />
                <MetricCard label="Likes" value={formatNumber(s.totalLikes)} icon={Heart} accent="pink" />
                <MetricCard label="Comments" value={formatNumber(s.totalComments)} icon={MessageCircle} accent="blue" />
                <MetricCard label="Shares" value={formatNumber(s.totalShares)} icon={Share2} accent="sage" />
                <MetricCard label="Posts" value={formatNumber(s.totalPosts)} icon={BarChart3} accent="forest" />
            </div>

            {/* Secondary rates */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Avg views / post" value={formatNumber(s.avgViewsPerPost)} sub={`${s.totalPosts || 0} posts in period`} />
                <MetricCard label="Avg likes / post" value={formatNumber(s.avgLikesPerPost)} />
                <MetricCard label="Like / view ratio" value={`${s.likeToViewRatio || 0}%`} />
                <MetricCard label="Comment / view ratio" value={`${s.commentToViewRatio || 0}%`} />
            </div>

            {platform === 'instagram' && (s.totalSaves > 0) && (
                <MetricCard label="Total saves" value={formatNumber(s.totalSaves)} icon={Bookmark} accent="forest" className="max-w-xs" />
            )}

            {/* Charts */}
            <div className="space-y-5">
                <div className="analytics-panel px-4 py-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--viralix-inset)]">
                        <BarChart3 className="h-4 w-4 text-[var(--viralix-primary-dark)]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--viralix-accent)]">Visual analytics</h3>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <DeepTimelineChart
                        timeline={data?.timeline || []}
                        loading={loading}
                        variant="area"
                        title="Views & engagement (area)"
                    />
                    <DeepTimelineChart
                        timeline={data?.timeline || []}
                        loading={loading}
                        variant="line"
                        title="Views & engagement (line)"
                    />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <MetricsLineChart
                        timeline={data?.timeline || []}
                        title="Daily metrics breakdown"
                        subtitle="Views, likes, and comments per day"
                        metrics={['views', 'likes', 'comments', ...(platform === 'tiktok' ? ['shares'] : [])]}
                    />
                    <PostsActivityBarChart timeline={data?.timeline || []} />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <EngagementPieChart
                        likes={s.totalLikes}
                        comments={s.totalComments}
                        shares={s.totalShares}
                        saves={s.totalSaves}
                        title="Engagement composition"
                    />
                    {platform === 'instagram' && (data?.mediaTypeBreakdown?.length > 0) ? (
                        <DistributionPieChart
                            title="Content mix by type"
                            subtitle="Posts distribution across media types"
                            items={data.mediaTypeBreakdown.map((mt) => ({
                                name: mt.type,
                                value: mt.count,
                            }))}
                        />
                    ) : (
                        <DistributionPieChart
                            title="Views vs engagement"
                            subtitle="Proportion of views to total interactions"
                            items={[
                                { name: 'Views', value: s.totalViews },
                                { name: 'Engagement', value: s.totalEngagement },
                            ]}
                        />
                    )}
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <TopPostsBarChart
                        posts={data?.topPosts?.byViews || []}
                        title="Top posts — bar comparison"
                        subtitle="Views vs total engagement"
                    />
                    {accounts.length > 1 ? (
                        <AccountComparisonBarChart accounts={accounts} />
                    ) : (
                        <DistributionPieChart
                            title="Interaction split"
                            subtitle="Likes, comments & shares"
                            items={[
                                { name: 'Likes', value: s.totalLikes },
                                { name: 'Comments', value: s.totalComments },
                                { name: 'Shares', value: s.totalShares },
                                ...(s.totalSaves ? [{ name: 'Saves', value: s.totalSaves }] : []),
                            ]}
                        />
                    )}
                </div>
            </div>

            {/* Media type breakdown cards (Instagram) */}
            {platform === 'instagram' && (data?.mediaTypeBreakdown?.length > 0) && (
                <div className="analytics-panel p-4 sm:p-5">
                    <h3 className="text-sm font-semibold text-[var(--viralix-accent)] mb-4 pb-3 border-b border-[var(--viralix-border)]">Content by type</h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {data.mediaTypeBreakdown.map((mt) => (
                            <div key={mt.type} className="analytics-inset p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    {mt.type === 'video' ? <Video className="h-4 w-4 text-[var(--viralix-primary-dark)]" /> : <ImageIcon className="h-4 w-4 text-[var(--viralix-primary-dark)]" />}
                                    <span className="text-sm font-medium capitalize text-[var(--viralix-accent)]">{mt.type}</span>
                                    <span className="text-xs text-[var(--viralix-muted)]">({mt.count})</span>
                                </div>
                                <p className="text-lg font-bold text-[var(--viralix-accent)]">{formatNumber(mt.views)} views</p>
                                <p className="text-xs text-[var(--viralix-muted)]">{formatNumber(mt.engagement)} engagement</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top posts */}
            <div className="grid gap-5 lg:grid-cols-2">
                <TopContentTable posts={data?.topPosts?.byViews || []} title="Top posts by views" />
                <TopContentTable posts={data?.topPosts?.byEngagement || []} title="Top posts by engagement" />
            </div>

            {data?.topPosts?.byEngagementRate?.length > 0 && (
                <TopContentTable
                    posts={data.topPosts.byEngagementRate}
                    title="Highest engagement rate (min. 100 views)"
                />
            )}

            {/* All posts grid */}
            {(data?.allPosts?.length > 0) && (
                <div className="analytics-panel p-4 sm:p-5">
                    <h3 className="text-sm font-semibold text-[var(--viralix-accent)] mb-4 pb-3 border-b border-[var(--viralix-border)]">
                        All content — click for post analytics
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {data.allPosts.map((post) => (
                            <Link
                                key={post.id}
                                href={post.detailUrl}
                                className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-inset)] shadow-sm analytics-panel-hover"
                            >
                                {post.thumbnail ? (
                                    <img src={post.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-3xl">📷</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-xs">
                                        <p className="font-medium truncate">{post.title}</p>
                                        <p className="flex gap-2 mt-0.5 opacity-90">
                                            <span>👁 {formatNumber(post.metrics.views)}</span>
                                            <span>❤ {formatNumber(post.metrics.likes)}</span>
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
