'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { analyticsAPI } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { PLATFORM_CONFIG } from '@/components/dashboard/constants';
import { Eye, Heart, Loader2 } from 'lucide-react';

function PanelLabel({ children }) {
    return <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#52796F]">{children}</p>;
}

export default function TopPostsTable() {
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [sortBy, setSortBy] = useState('totalEngagement');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await analyticsAPI.getContentPerformance({ limit: 20 });
                setPosts(res.data?.topPerformingPosts || []);
            } catch {
                setPosts([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = posts
        .filter((p) => filter === 'all' || p.platforms?.some((pl) => pl.name === filter))
        .sort((a, b) => {
            if (sortBy === 'publishedAt') return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
            return (b.metrics?.[sortBy] || 0) - (a.metrics?.[sortBy] || 0);
        });

    return (
        <div className="dash-card overflow-hidden rounded-xl border border-[var(--viralix-border)]">
            <div className="flex flex-col gap-3 border-b border-[var(--viralix-border)] bg-[var(--viralix-bg)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <PanelLabel>Top performing posts</PanelLabel>
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-2 py-1 text-xs text-[#52796F] focus:border-[#84A98C] focus:outline-none"
                    >
                        <option value="all">All platforms</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                        <option value="youtube">YouTube</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-2 py-1 text-xs text-[#52796F] focus:border-[#84A98C] focus:outline-none"
                    >
                        <option value="totalEngagement">Engagement</option>
                        <option value="totalViews">Views</option>
                        <option value="engagementRate">Rate</option>
                        <option value="publishedAt">Date</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#52796F]">
                    <Loader2 className="h-5 w-5 animate-spin text-[#84A98C]" />
                    Loading posts…
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-sm text-[#52796F]">No published posts yet</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-[var(--viralix-border)] text-[0.6875rem] font-semibold uppercase tracking-wider text-[#52796F]">
                                <th className="px-4 py-2.5">Post</th>
                                <th className="hidden px-4 py-2.5 sm:table-cell">Platforms</th>
                                <th className="px-4 py-2.5 text-right">Views</th>
                                <th className="px-4 py-2.5 text-right">Engagement</th>
                                <th className="hidden px-4 py-2.5 text-right md:table-cell">Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((post, idx) => (
                                <tr key={post.id} className="border-b border-[var(--viralix-border)] last:border-b-0 hover:bg-[var(--viralix-bg)]">
                                    <td className="px-4 py-3">
                                        <Link href={`/dashboard/preview/${post.id}`} className="flex items-center gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#354F52]/8 text-xs font-bold text-[#52796F]">
                                                {idx + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-[#354F52] hover:text-[#52796F]">
                                                    {post.title || 'Untitled'}
                                                </p>
                                                <p className="text-[0.625rem] text-[#94A3B8]">
                                                    {post.publishedAt
                                                        ? new Date(post.publishedAt).toLocaleDateString()
                                                        : 'Draft'}
                                                </p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="hidden px-4 py-3 sm:table-cell">
                                        <div className="flex -space-x-1">
                                            {(post.platforms || []).slice(0, 4).map((p, i) => {
                                                const cfg = PLATFORM_CONFIG[p.name];
                                                if (!cfg) return null;
                                                const Icon = cfg.icon;
                                                return (
                                                    <span
                                                        key={i}
                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white"
                                                        style={{ backgroundColor: cfg.bg }}
                                                    >
                                                        <Icon className="h-3 w-3" style={{ color: cfg.color }} aria-hidden />
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-[#354F52]">
                                        <span className="inline-flex items-center justify-end gap-1">
                                            <Eye className="h-3 w-3 text-[#94A3B8]" />
                                            {formatNumber(post.metrics?.totalViews || 0)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-[#354F52]">
                                        <span className="inline-flex items-center justify-end gap-1">
                                            <Heart className="h-3 w-3 text-[#94A3B8]" />
                                            {formatNumber(post.metrics?.totalEngagement || 0)}
                                        </span>
                                    </td>
                                    <td className="hidden px-4 py-3 text-right tabular-nums text-emerald-700 md:table-cell">
                                        {post.metrics?.engagementRate || 0}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
