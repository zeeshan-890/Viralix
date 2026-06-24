'use client';

import { cn } from '@/lib/utils';

/** Compact, slightly darker metric tile for analytics banner */
export default function CompactMetricTile({ label, value, sub, icon: Icon, className }) {
    return (
        <div className={cn('analytics-metric-tile p-2.5 sm:p-3', className)}>
            <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0">
                    <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--viralix-muted)] leading-tight truncate">
                        {label}
                    </p>
                    <p className="mt-0.5 text-lg sm:text-xl font-bold tabular-nums text-[var(--viralix-accent)] leading-none">
                        {value}
                    </p>
                    {sub && (
                        <p className="mt-1 text-[0.625rem] text-[var(--viralix-muted)] leading-snug line-clamp-2">{sub}</p>
                    )}
                </div>
                {Icon && (
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--viralix-primary-dark)] opacity-70 mt-0.5" aria-hidden />
                )}
            </div>
        </div>
    );
}
