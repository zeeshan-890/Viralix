'use client';

import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { usePlatformAnalyticsTheme } from './PlatformAnalyticsThemeContext';

export default function TopContentTable({ posts = [], title = 'Top content', emptyMessage = 'No posts yet' }) {
    const theme = usePlatformAnalyticsTheme();

    if (!posts.length) {
        return (
            <div className="analytics-panel pa-panel p-10 text-center text-sm pa-muted">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="analytics-panel pa-panel overflow-hidden">
            <div className="analytics-table-header border-b pa-border px-4 py-3.5 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" style={{ color: theme.chartPrimary }} />
                <h3 className="text-sm font-semibold pa-title">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="analytics-table-head pa-table-head border-b text-left text-xs uppercase tracking-wide">
                            <th className="px-4 py-2.5 font-medium">Post</th>
                            <th className="px-4 py-2.5 font-medium text-right">Views</th>
                            <th className="px-4 py-2.5 font-medium text-right">Likes</th>
                            <th className="px-4 py-2.5 font-medium text-right">Comments</th>
                            <th className="px-4 py-2.5 font-medium text-right">Eng. rate</th>
                            <th className="px-4 py-2.5 font-medium w-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map((post, i) => (
                            <tr key={post.id} className="border-b pa-border last:border-0 pa-row-hover transition-colors">
                                <td className="px-4 py-3">
                                    <Link href={post.detailUrl} className="flex items-center gap-3 group">
                                        <span className="text-xs font-bold pa-muted w-5">#{i + 1}</span>
                                        {post.thumbnail ? (
                                            <img src={post.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover border pa-border shadow-sm" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-lg analytics-inset pa-inset flex items-center justify-center text-lg">📷</div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-medium pa-text truncate max-w-[200px] group-hover:opacity-80">{post.title}</p>
                                            <p className="text-xs pa-muted">
                                                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                                            </p>
                                        </div>
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums font-semibold pa-text">{formatNumber(post.metrics?.views)}</td>
                                <td className="px-4 py-3 text-right tabular-nums pa-text">{formatNumber(post.metrics?.likes)}</td>
                                <td className="px-4 py-3 text-right tabular-nums pa-text">{formatNumber(post.metrics?.comments)}</td>
                                <td className="px-4 py-3 text-right tabular-nums font-semibold pa-accent">
                                    {post.metrics?.engagementRate ?? 0}%
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={post.detailUrl} className="pa-muted hover:opacity-100 opacity-70">
                                        <ExternalLink className="h-4 w-4 inline" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
