'use client';

import { cn } from '@/lib/utils';

/** Compact metric tile — light (default) or dark (platform banner) */
export default function CompactMetricTile({ label, value, sub, icon: Icon, className, variant = 'light' }) {
    const isDark = variant === 'dark';

    return (
        <div
            className={cn(
                isDark ? 'analytics-metric-tile-dark' : 'analytics-metric-tile',
                'p-2.5 sm:p-3 h-full',
                className
            )}
        >
            <div className="flex h-full items-start justify-between gap-1.5">
                <div className="min-w-0 flex-1">
                    <p
                        className={cn(
                            'text-[0.625rem] font-semibold uppercase tracking-wide leading-tight truncate',
                            isDark ? 'text-white/55' : 'text-[var(--viralix-muted)]'
                        )}
                    >
                        {label}
                    </p>
                    <p
                        className={cn(
                            'mt-0.5 text-base sm:text-lg font-bold tabular-nums leading-none',
                            isDark ? 'text-white' : 'text-[var(--viralix-accent)]'
                        )}
                    >
                        {value}
                    </p>
                    {sub && (
                        <p
                            className={cn(
                                'mt-1 text-[0.625rem] leading-snug line-clamp-2',
                                isDark ? 'text-white/45' : 'text-[var(--viralix-muted)]'
                            )}
                        >
                            {sub}
                        </p>
                    )}
                </div>
                {Icon && (
                    <Icon
                        className={cn(
                            'h-3.5 w-3.5 shrink-0 mt-0.5',
                            isDark ? 'text-white/40' : 'text-[var(--viralix-primary-dark)] opacity-70'
                        )}
                        aria-hidden
                    />
                )}
            </div>
        </div>
    );
}
