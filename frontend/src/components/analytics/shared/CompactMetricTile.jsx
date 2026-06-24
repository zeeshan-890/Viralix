'use client';

import { cn } from '@/lib/utils';

/** Compact metric tile — light (default) or dark (platform banner) */
export default function CompactMetricTile({ label, value, sub, icon: Icon, className, variant = 'light' }) {
    const isDark = variant === 'dark';

    if (isDark) {
        return (
            <div
                className={cn(
                    'analytics-metric-tile-dark relative flex flex-col h-full min-h-[4.5rem] p-2 sm:p-2.5',
                    className
                )}
            >
                {Icon && (
                    <Icon className="absolute top-2 right-2 h-3 w-3 text-white/30 shrink-0" aria-hidden />
                )}
                <p className="w-full shrink-0 text-center text-[0.625rem] font-semibold uppercase tracking-wide leading-tight text-white/55 line-clamp-2 px-1">
                    {label}
                </p>
                <div className="flex flex-1 items-center justify-center w-full py-0.5">
                    <p className="text-xl sm:text-2xl lg:text-[1.75rem] font-bold tabular-nums leading-none text-white text-center">
                        {value}
                    </p>
                </div>
                {sub ? (
                    <p className="w-full shrink-0 text-center text-[0.5625rem] leading-snug text-white/40 line-clamp-2 px-1">
                        {sub}
                    </p>
                ) : (
                    <span className="shrink-0 h-0" aria-hidden />
                )}
            </div>
        );
    }

    return (
        <div className={cn('analytics-metric-tile p-2.5 sm:p-3 h-full', className)}>
            <div className="flex h-full items-start justify-between gap-1.5">
                <div className="min-w-0 flex-1">
                    <p className="text-[0.625rem] font-semibold uppercase tracking-wide leading-tight truncate text-[var(--viralix-muted)]">
                        {label}
                    </p>
                    <p className="mt-0.5 text-base sm:text-lg font-bold tabular-nums leading-none text-[var(--viralix-accent)]">
                        {value}
                    </p>
                    {sub && (
                        <p className="mt-1 text-[0.625rem] leading-snug line-clamp-2 text-[var(--viralix-muted)]">
                            {sub}
                        </p>
                    )}
                </div>
                {Icon && (
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--viralix-primary-dark)] opacity-70 mt-0.5" aria-hidden />
                )}
            </div>
        </div>
    );
}
