'use client';

import { formatNumber, cn } from '@/lib/utils';
import CompactMetricTile from './CompactMetricTile';
import {
    Eye,
    Heart,
    MessageCircle,
    Share2,
    TrendingUp,
    Users,
    BarChart3,
    CalendarClock,
    FileEdit,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';

export default function OverviewMetricsBanner({
    overview = {},
    connectedCount = 0,
    onRefresh,
    refreshing = false,
    demoMode = false,
}) {
    const o = overview;

    const metrics = [
        { label: 'Views', value: formatNumber(o.totalViews || 0), icon: Eye },
        { label: 'Eng. rate', value: `${o.engagementRate ?? 0}%`, icon: TrendingUp },
        { label: 'Likes', value: formatNumber(o.totalLikes || 0), icon: Heart },
        { label: 'Comments', value: formatNumber(o.totalComments || 0), icon: MessageCircle },
        { label: 'Shares', value: formatNumber(o.totalShares || 0), icon: Share2 },
        { label: 'Followers', value: formatNumber(o.totalFollowers || 0), icon: Users },
        { label: 'Published', value: formatNumber(o.publishedPosts || 0), icon: BarChart3 },
        { label: 'Scheduled', value: formatNumber(o.scheduledPosts || 0), icon: CalendarClock },
        { label: 'Drafts', value: formatNumber(o.draftPosts || 0), icon: FileEdit },
        { label: 'Failed', value: formatNumber(o.failedPosts || 0), icon: AlertCircle },
    ];

    return (
        <div className="analytics-platform-banner overflow-hidden">
            {demoMode && (
                <div className="border-b border-amber-400/30 bg-amber-500/15 px-3 py-1.5 text-center text-[0.6875rem] font-medium text-amber-100">
                    Demo preview — combined metrics across all platforms
                </div>
            )}

            <div className="px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                        <p className="text-sm font-semibold text-white">Overall performance</p>
                        <p className="text-[0.6875rem] text-white/50">
                            All platforms combined
                            {connectedCount > 0 ? ` · ${connectedCount} account${connectedCount === 1 ? '' : 's'} connected` : ''}
                        </p>
                    </div>
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                            Refresh
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5 lg:grid-cols-10">
                    {metrics.map((stat) => (
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
