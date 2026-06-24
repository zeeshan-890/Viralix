'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Film, FileText, MoreHorizontal, Eye, Heart } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { statusBadge } from '@/components/calendar/calendarTheme';
import { getPostStatus, STATUS_LABELS, formatRelativeDate, aggregateEngagement } from './postUtils';
import { PLATFORM_CONFIG } from '@/components/dashboard/constants';
import PlatformBadge from '@/components/ui/PlatformBadge';

const STATUS_DOT = {
    scheduled: 'bg-amber-500',
    published: 'bg-emerald-500',
    draft: 'bg-slate-400',
    failed: 'bg-red-500',
    processing: 'bg-violet-500',
};

function PostThumbnail({ post, size = 'md' }) {
    const media = post.media?.[0];
    const dim = size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';

    if (media?.url) {
        return (
            <div className={cn('relative shrink-0 overflow-hidden rounded-lg ring-1 ring-black/5', dim)}>
                <Image src={media.url} alt="" fill className="object-cover" sizes="56px" unoptimized />
                {media.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Film className="h-3.5 w-3.5 text-white" aria-hidden />
                    </div>
                )}
            </div>
        );
    }
    return (
        <div className={cn('flex shrink-0 items-center justify-center rounded-lg bg-[#354F52]/8 ring-1 ring-[#354F52]/10', dim)}>
            <FileText className="h-4 w-4 text-[#52796F]" aria-hidden />
        </div>
    );
}

export default function PostTableRow({ post }) {
    const status = getPostStatus(post);
    const engagement = aggregateEngagement(post);
    const dateLabel =
        status === 'scheduled' && (post.scheduledAt || post.scheduledDate)
            ? new Date(post.scheduledAt || post.scheduledDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
              })
            : formatRelativeDate(post.updatedAt || post.createdAt);

    return (
        <tr className="group border-b border-[var(--viralix-border)] transition-colors last:border-b-0 hover:bg-[var(--viralix-bg)]">
            <td className="px-4 py-3">
                <Link href={`/dashboard/preview/${post._id}`} className="flex items-center gap-3">
                    <PostThumbnail post={post} />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#2F3E46] group-hover:text-[#52796F]">
                            {post.title || 'Untitled Post'}
                        </p>
                        <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-[#52796F]/80">
                            {post.content || 'No caption'}
                        </p>
                    </div>
                </Link>
            </td>
            <td className="hidden px-4 py-3 sm:table-cell">
                <span className="inline-flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[status] || STATUS_DOT.draft)} />
                    <span
                        className={cn(
                            'text-xs font-medium capitalize',
                            status === 'published' && 'text-emerald-700',
                            status === 'scheduled' && 'text-amber-700',
                            status === 'failed' && 'text-red-600',
                            status === 'draft' && 'text-slate-600'
                        )}
                    >
                        {STATUS_LABELS[status]}
                    </span>
                </span>
            </td>
            <td className="hidden px-4 py-3 md:table-cell">
                <div className="flex -space-x-1">
                    {(post.platforms || []).slice(0, 4).map((p) => (
                        <span key={p.name + p.accountId} className="ring-2 ring-white rounded-full" title={PLATFORM_CONFIG[p.name]?.label}>
                            <PlatformBadge platform={p.name} size="xs" rounded="full" />
                        </span>
                    ))}
                </div>
            </td>
            <td className="hidden px-4 py-3 text-xs text-[#52796F] lg:table-cell">
                <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 opacity-60" aria-hidden />
                    {dateLabel}
                </span>
            </td>
            <td className="hidden px-4 py-3 text-xs text-[#52796F] xl:table-cell">
                {status === 'published' ? (
                    <span className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5">
                            <Eye className="h-3 w-3" aria-hidden />
                            {formatNumber(engagement.views)}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                            <Heart className="h-3 w-3" aria-hidden />
                            {formatNumber(engagement.likes)}
                        </span>
                    </span>
                ) : (
                    '—'
                )}
            </td>
            <td className="px-4 py-3 text-right">
                <Link
                    href={`/dashboard/preview/${post._id}`}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#52796F] opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--viralix-surface)] hover:text-[#354F52] hover:shadow-sm"
                >
                    Open
                    <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
                </Link>
            </td>
        </tr>
    );
}

/** Mobile card fallback */
export function PostMobileCard({ post }) {
    const status = getPostStatus(post);
    return (
        <Link
            href={`/dashboard/preview/${post._id}`}
            className="flex gap-3 border-b border-[var(--viralix-border)] px-4 py-4 transition-colors hover:bg-[var(--viralix-bg)] sm:hidden"
        >
            <PostThumbnail post={post} size="lg" />
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#2F3E46]">{post.title || 'Untitled'}</p>
                    <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase', statusBadge[status])}>
                        {STATUS_LABELS[status]}
                    </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-[#52796F]">{post.content}</p>
            </div>
        </Link>
    );
}
