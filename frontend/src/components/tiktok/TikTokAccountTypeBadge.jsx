'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTikTokCreatorInfo } from '@/hooks/useTikTokCreatorInfo';
import { inferTikTokIsPublic } from '@/lib/tiktokAccount';
import { cn } from '@/lib/utils';

/**
 * Prominent Private / Public label for a connected TikTok account.
 * @param {'sm' | 'md' | 'lg'} size
 */
export default function TikTokAccountTypeBadge({ accountId, size = 'md', className }) {
    const { info, loading, error } = useTikTokCreatorInfo(accountId);

    if (!accountId) return null;

    if (loading) {
        return (
            <span className={cn('inline-flex items-center gap-1.5 text-gray-400', className)}>
                <Loader2 className={cn(size === 'lg' ? 'w-4 h-4' : 'w-3 h-3', 'animate-spin')} />
                <span className={size === 'lg' ? 'text-sm' : 'text-xs'}>Checking account…</span>
            </span>
        );
    }

    if (error) {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border bg-red-50 text-red-700 border-red-200',
                    className
                )}
                title={error}
            >
                Status unavailable
            </span>
        );
    }

    if (!info) return null;

    const isPublic = inferTikTokIsPublic(info) !== false;

    const sizes = {
        sm: {
            wrap: 'px-2 py-0.5 text-xs gap-1',
            icon: 'w-3 h-3',
        },
        md: {
            wrap: 'px-2.5 py-1 text-xs gap-1.5 font-semibold',
            icon: 'w-3.5 h-3.5',
        },
        lg: {
            wrap: 'px-4 py-2 text-sm gap-2 font-semibold',
            icon: 'w-4 h-4',
        },
    };

    const s = sizes[size] || sizes.md;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border',
                isPublic
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-slate-100 text-slate-800 border-slate-300',
                s.wrap,
                className
            )}
            title={isPublic ? 'TikTok account is public' : 'TikTok account is private'}
        >
            {isPublic ? (
                <Eye className={s.icon} aria-hidden />
            ) : (
                <EyeOff className={s.icon} aria-hidden />
            )}
            {isPublic ? 'Public account' : 'Private account'}
        </span>
    );
}
