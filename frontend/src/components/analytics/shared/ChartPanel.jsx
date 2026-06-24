'use client';

import { formatNumber } from '@/lib/utils';

export function ChartPanel({ title, subtitle, children, className = '' }) {
    return (
        <div className={`rounded-xl border border-[var(--viralix-border)] bg-[var(--viralix-surface)] p-4 ${className}`}>
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#354F52]">{title}</h3>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

export function ChartEmpty({ message = 'No data for this chart' }) {
    return (
        <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/80">
            <p className="text-sm text-gray-500">{message}</p>
        </div>
    );
}

export function ChartTooltipBox({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-[var(--viralix-border)] bg-white px-3 py-2 shadow-md text-sm">
            {label && <p className="text-xs text-gray-500 mb-1">{label}</p>}
            {payload.map((p) => (
                <p key={p.dataKey || p.name} className="font-medium" style={{ color: p.color || p.payload?.fill }}>
                    {p.name}: {formatNumber(p.value)}
                </p>
            ))}
        </div>
    );
}

const PIE_COLORS = ['#E4405F', '#84A98C', '#52796F', '#F4A261', '#2A9D8F', '#9B5DE5', '#00BBF9'];

export { PIE_COLORS };
