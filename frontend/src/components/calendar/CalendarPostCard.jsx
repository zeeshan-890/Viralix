'use client';

import { Clock, GripVertical, Facebook, Instagram, Linkedin, Twitter, Youtube, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPostTime, getPostStatus } from './calendarUtils';
import { statusBorder, statusBadge } from './calendarTheme';

const platformIcons = {
    facebook: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
    instagram: { icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
    twitter: { icon: Twitter, color: 'text-sky-500', bg: 'bg-sky-50' },
    linkedin: { icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
    tiktok: { icon: Music2, color: 'text-gray-900', bg: 'bg-gray-100' },
    youtube: { icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' },
};

export default function CalendarPostCard({ post, onClick, isDragging, dragHandleProps, compact = false }) {
    const status = getPostStatus(post);
    const time = formatPostTime(post);

    return (
        <div
            onClick={onClick}
            className={cn(
                'rounded-md border border-[var(--viralix-border)] border-l-[3px] bg-[var(--viralix-surface)] transition-all',
                statusBorder[status] || statusBorder.draft,
                compact ? 'p-1.5' : 'p-2',
                isDragging && 'shadow-lg ring-2 ring-[#84A98C]/50',
                !isDragging && 'hover:border-[#84A98C] hover:shadow-sm',
                onClick && 'cursor-pointer'
            )}
        >
            <div className="flex items-start gap-1">
                {dragHandleProps && (
                    <button
                        type="button"
                        {...dragHandleProps}
                        className="mt-0.5 shrink-0 rounded p-0.5 text-[var(--viralix-border)] hover:bg-[var(--viralix-inset)] hover:text-[var(--viralix-muted)]"
                        aria-label="Drag to reschedule"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-3.5 w-3.5" />
                    </button>
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                        {(post.platforms || []).slice(0, 3).map((p, i) => {
                            const cfg = platformIcons[p.name] || platformIcons.twitter;
                            const Icon = cfg.icon;
                            return (
                                <span key={i} className={cn('flex h-4 w-4 items-center justify-center rounded', cfg.bg)}>
                                    <Icon className={cn('h-2.5 w-2.5', cfg.color)} aria-hidden />
                                </span>
                            );
                        })}
                        <span
                            className={cn(
                                'ml-auto shrink-0 rounded px-1 py-0.5 text-[0.625rem] font-semibold uppercase',
                                statusBadge[status] || statusBadge.draft
                            )}
                        >
                            {status}
                        </span>
                    </div>
                    <p
                        className={cn(
                            'mt-1 font-medium leading-snug text-[var(--viralix-accent)]',
                            compact ? 'line-clamp-1 text-[0.6875rem]' : 'line-clamp-2 text-xs'
                        )}
                    >
                        {post.title || post.content?.substring(0, 50) || 'Untitled'}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1 text-[0.625rem] text-[var(--viralix-muted)]">
                        <Clock className="h-2.5 w-2.5" aria-hidden />
                        {time}
                    </div>
                </div>
            </div>
        </div>
    );
}
