'use client';

import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import { ExternalLink, TrendingUp } from 'lucide-react';

export default function TopContentTable({ posts = [], title = 'Top content', emptyMessage = 'No posts yet' }) {
    if (!posts.length) {
        return (
            <div className="analytics-panel p-10 text-center text-sm text-[var(--viralix-muted)]">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="analytics-panel overflow-hidden">
            <div className="border-b border-[var(--viralix-border)] px-4 py-3.5 flex items-center gap-2 bg-[var(--viralix-inset)]/50">
                <TrendingUp className="h-4 w-4 text-[var(--viralix-primary-dark)]" />
                <h3 className="text-sm font-semibold text-[var(--viralix-accent)]">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="analytics-table-head border-b text-left text-xs uppercase tracking-wide text-[var(--viralix-muted)]">
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
                            <tr key={post.id} className="border-b border-[var(--viralix-border)] last:border-0 hover:bg-[var(--viralix-inset)]/40 transition-colors">
                                <td className="px-4 py-3">
                                    <Link href={post.detailUrl} className="flex items-center gap-3 group">
                                        <span className="text-xs font-bold text-[var(--viralix-muted)] w-5">#{i + 1}</span>
                                        {post.thumbnail ? (
                                            <img src={post.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover border border-[var(--viralix-border)] shadow-sm" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-lg analytics-inset flex items-center justify-center text-lg">📷</div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-medium text-[var(--viralix-accent)] truncate max-w-[200px] group-hover:text-[var(--viralix-primary-dark)]">{post.title}</p>
                                            <p className="text-xs text-[var(--viralix-muted)]">
                                                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                                            </p>
                                        </div>
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums font-semibold text-[var(--viralix-accent)]">{formatNumber(post.metrics?.views)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-[var(--viralix-accent)]">{formatNumber(post.metrics?.likes)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-[var(--viralix-accent)]">{formatNumber(post.metrics?.comments)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-[var(--viralix-primary-dark)] font-semibold">
                                    {post.metrics?.engagementRate?.toFixed(2)}%
                                </td>
                                <td className="px-4 py-3">
                                    <Link href={post.detailUrl} className="text-[var(--viralix-muted)] hover:text-[var(--viralix-accent)]">
                                        <ExternalLink className="h-4 w-4" />
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
