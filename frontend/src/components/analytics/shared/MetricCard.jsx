'use client';

import { cn } from '@/lib/utils';

export default function MetricCard({ label, value, sub, icon: Icon, tone = 'default', className }) {
    const tones = {
        default: 'border-[var(--viralix-border)] bg-[var(--viralix-surface)]',
        accent: 'border-emerald-200 bg-emerald-50',
        pink: 'border-pink-200 bg-pink-50',
        blue: 'border-blue-200 bg-blue-50',
        purple: 'border-purple-200 bg-purple-50',
    };
    const iconTones = {
        default: 'bg-gray-100 text-gray-600',
        accent: 'bg-emerald-100 text-emerald-700',
        pink: 'bg-pink-100 text-pink-600',
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
    };

    return (
        <div className={cn('rounded-xl border p-4 shadow-sm', tones[tone], className)}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-[#354F52]">{value}</p>
                    {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
                </div>
                {Icon && (
                    <div className={cn('rounded-lg p-2 shrink-0', iconTones[tone])}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </div>
        </div>
    );
}
