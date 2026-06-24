'use client';

import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import { ExternalLink, TrendingUp } from 'lucide-react';

export default function TopContentTable({ posts = [], title = 'Top content', emptyMessage = 'No posts yet' }) {
    if (!posts.length) {
        return (
            <div className="rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-surface)] p-8 text-center text-sm text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-surface)] overflow-hidden">
            <div className="border-b border-[var(--viralix-border)] px-4 py-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#84A98C]" />
                <h3 className="text-sm font-semibold text-[#354F52]">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs uppercase tracking-wide text-gray-500">
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
                            <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="px-4 py-3">
                                    <Link href={post.detailUrl} className="flex items-center gap-3 group">
                                        <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                                        {post.thumbnail ? (
                                            <img src={post.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-100" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">📷</div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-medium text-[#354F52] truncate max-w-[200px] group-hover:text-[#84A98C]">{post.title}</p>
                                            <p className="text-xs text-gray-400">
                                                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                                            </p>
                                        </div>
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums font-medium">{formatNumber(post.metrics?.views)}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(post.metrics?.likes)}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(post.metrics?.comments)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">
                                    {post.metrics?.engagementRate?.toFixed(2)}%
                                </td>
                                <td className="px-4 py-3">
                                    <Link href={post.detailUrl} className="text-gray-400 hover:text-[#354F52]">
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
