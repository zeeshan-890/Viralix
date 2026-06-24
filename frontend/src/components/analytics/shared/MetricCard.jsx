'use client';

import { cn } from '@/lib/utils';

/** Shared panel + metric styles for analytics (dashboard theme) */
export const analyticsPanel = 'analytics-panel';
export const analyticsPanelHover = 'analytics-panel analytics-panel-hover';
export const analyticsInset = 'analytics-inset';

export function AnalyticsPanel({ children, className, hover = false }) {
    return (
        <div className={cn(hover ? analyticsPanelHover : analyticsPanel, className)}>
            {children}
        </div>
    );
}

export default function MetricCard({ label, value, sub, icon: Icon, accent = 'sage', className }) {
    const accents = {
        sage: { iconBg: '#E8F0ED', iconColor: '#52796F' },
        forest: { iconBg: '#DDE8E0', iconColor: '#354F52' },
        mint: { iconBg: '#EEF5F0', iconColor: '#84A98C' },
        pink: { iconBg: '#FCE8EF', iconColor: '#E4405F' },
        blue: { iconBg: '#E8F0FA', iconColor: '#3B82F6' },
        purple: { iconBg: '#F0EBFA', iconColor: '#7C3AED' },
    };
    const style = accents[accent] || accents.sage;

    return (
        <article className={cn('analytics-panel analytics-panel-hover p-4', className)}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--viralix-muted)]">
                        {label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--viralix-accent)]">
                        {value}
                    </p>
                    {sub && <p className="mt-1 text-xs text-[var(--viralix-muted)]">{sub}</p>}
                </div>
                {Icon && (
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: style.iconBg }}
                    >
                        <Icon className="h-5 w-5" style={{ color: style.iconColor }} aria-hidden />
                    </div>
                )}
            </div>
        </article>
    );
}
