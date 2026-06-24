'use client';

import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function ChartPanel({ title, subtitle, children, className = '' }) {
    return (
        <div className={cn('analytics-panel pa-panel p-4 sm:p-5', className)}>
            <div className="mb-4 border-b pa-border pb-3">
                <h3 className="text-sm font-semibold pa-title">{title}</h3>
                {subtitle && <p className="text-xs pa-muted mt-0.5">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

export function ChartEmpty({ message = 'No data for this chart' }) {
    return (
        <div className="analytics-inset pa-inset flex h-56 items-center justify-center">
            <p className="text-sm pa-muted">{message}</p>
        </div>
    );
}

export function ChartTooltipBox({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="analytics-panel px-3 py-2 text-sm shadow-lg">
            {label && <p className="text-xs text-[var(--viralix-muted)] mb-1">{label}</p>}
            {payload.map((p) => (
                <p key={p.dataKey || p.name} className="font-medium text-[var(--viralix-accent)]" style={{ color: p.color || p.payload?.fill }}>
                    {p.name}: {formatNumber(p.value)}
                </p>
            ))}
        </div>
    );
}

const PIE_COLORS = ['#E4405F', '#84A98C', '#52796F', '#F4A261', '#2A9D8F', '#9B5DE5', '#00BBF9'];

export { PIE_COLORS };
