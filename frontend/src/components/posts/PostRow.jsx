'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Film, FileText, ChevronRight } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { statusBadge, statusBorder } from '@/components/calendar/calendarTheme';
import { getPostStatus, STATUS_LABELS, formatRelativeDate, aggregateEngagement } from './postUtils';
import { PLATFORM_CONFIG } from '@/components/dashboard/constants';

function PostThumbnail({ post }) {
    const media = post.media?.[0];
    if (media?.url) {
        return (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#D5DFD9] bg-[#F0F4F2]">
                <Image src={media.url} alt="" fill className="object-cover" sizes="64px" unoptimized />
                {media.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Film className="h-4 w-4 text-white" aria-hidden />
                    </div>
                )}
            </div>
        );
    }
    return (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-[#D5DFD9] bg-[#EEF3F0]">
            <FileText className="h-5 w-5 text-[#52796F]" aria-hidden />
        </div>
    );
}

export default function PostRow({ post }) {
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
        <Link
            href={`/dashboard/preview/${post._id}`}
            className={cn(
                'group flex items-center gap-3 border-b border-[#E2E8E4] px-4 py-3 transition-colors last:border-b-0 hover:bg-[#F0F4F2]',
                'border-l-[3px] bg-white',
                statusBorder[status] || statusBorder.draft
            )}
        >
            <PostThumbnail post={post} />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-sm font-semibold text-[#354F52]">
                        {post.title || 'Untitled Post'}
                    </h4>
                    <span
                        className={cn(
                            'rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase',
                            statusBadge[status] || statusBadge.draft
                        )}
                    >
                        {STATUS_LABELS[status] || status}
                    </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-[#52796F]">{post.content || 'No caption'}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[0.6875rem] text-[#52796F]">
                    <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" aria-hidden />
                        {dateLabel}
                    </span>
                    <span className="flex items-center gap-1">
                        {(post.platforms || []).slice(0, 4).map((p) => {
                            const cfg = PLATFORM_CONFIG[p.name];
                            if (!cfg) return null;
                            const Icon = cfg.icon;
                            return (
                                <span
                                    key={p.name + p.accountId}
                                    className="inline-flex h-5 w-5 items-center justify-center rounded"
                                    style={{ backgroundColor: cfg.bg }}
                                >
                                    <Icon className="h-3 w-3" style={{ color: cfg.color }} aria-hidden />
                                </span>
                            );
                        })}
                    </span>
                    {status === 'published' && (
                        <span>{formatNumber(engagement.views)} views · {formatNumber(engagement.likes)} likes</span>
                    )}
                </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#CAD2C5] transition-colors group-hover:text-[#52796F]" aria-hidden />
        </Link>
    );
}
