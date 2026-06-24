'use client';

import { formatNumber } from '@/lib/utils';
import EngagementPieChart from './EngagementPieChart';
import { cn } from '@/lib/utils';

export default function EngagementMetricGrid({ metrics = [], columns = 4 }) {
    const gridClass = {
        2: 'grid-cols-2',
        3: 'grid-cols-2 sm:grid-cols-3',
        4: 'grid-cols-2 sm:grid-cols-4',
        5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    }[columns] || 'grid-cols-2 sm:grid-cols-4';

    return (
        <div className={cn('grid gap-4', gridClass)}>
            {metrics.map((m) => (
                <article key={m.label} className="analytics-panel analytics-panel-hover p-4">
                    <div className="flex items-center gap-3 mb-2">
                        {m.icon && (
                            <div className={cn('p-2 rounded-lg', m.iconBg || 'bg-[var(--viralix-inset)]')}>
                                <m.icon className={cn('w-5 h-5', m.iconColor || 'text-[var(--viralix-primary-dark)]')} />
                            </div>
                        )}
                        <span className="text-sm font-medium text-[var(--viralix-muted)]">{m.label}</span>
                    </div>
                    <div className="text-2xl font-semibold tabular-nums text-[var(--viralix-accent)]">{formatNumber(m.value)}</div>
                    {m.rate != null && (
                        <p className="text-xs text-[var(--viralix-muted)] mt-1">{m.rate}% of views</p>
                    )}
                </article>
            ))}
        </div>
    );
}

export function EngagementBreakdownPanel({ views = 0, likes = 0, comments = 0, shares = 0, saves = 0, reach = 0, totalInteractions = 0 }) {
    const engagement = likes + comments + shares + saves;
    const engagementRate = views > 0 ? ((engagement / views) * 100).toFixed(2) : '0.00';
    const bars = [
        { label: 'Likes', value: likes, color: 'bg-pink-500', pct: views ? (likes / views) * 100 : 0 },
        { label: 'Comments', value: comments, color: 'bg-blue-500', pct: views ? (comments / views) * 100 : 0 },
        { label: 'Shares', value: shares, color: 'bg-emerald-500', pct: views ? (shares / views) * 100 : 0 },
    ];
    if (saves) bars.push({ label: 'Saves', value: saves, color: 'bg-orange-500', pct: views ? (saves / views) * 100 : 0 });

    return (
        <div className="analytics-panel p-5 sm:p-6">
            <h3 className="text-base font-semibold text-[var(--viralix-accent)] mb-6 pb-3 border-b border-[var(--viralix-border)]">
                Engagement breakdown
            </h3>
            <div className="grid gap-6 lg:grid-cols-2">
                <div>
                    <div className="mb-6">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-[var(--viralix-muted)]">Overall engagement rate</span>
                            <span className="text-sm font-bold text-[var(--viralix-accent)]">{engagementRate}%</span>
                        </div>
                        <div className="h-2.5 analytics-inset overflow-hidden p-px">
                            <div
                                className="h-full bg-gradient-to-r from-[var(--viralix-primary)] to-[var(--viralix-primary-dark)] rounded-[3px] transition-all"
                                style={{ width: `${Math.min(parseFloat(engagementRate), 100)}%` }}
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {bars.map((b) => (
                            <div key={b.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-[var(--viralix-muted)]">{b.label}</span>
                                    <span className="font-medium tabular-nums text-[var(--viralix-accent)]">
                                        {formatNumber(b.value)}{' '}
                                        <span className="text-[var(--viralix-muted)] font-normal">({b.pct.toFixed(2)}%)</span>
                                    </span>
                                </div>
                                <div className="h-1.5 analytics-inset overflow-hidden p-px">
                                    <div className={cn('h-full rounded-[2px]', b.color)} style={{ width: `${Math.min(b.pct * 10, 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {(reach > 0 || totalInteractions > 0) && (
                        <dl className="mt-6 pt-6 border-t border-[var(--viralix-border)] grid grid-cols-2 gap-4 text-sm">
                            {reach > 0 && (
                                <div className="analytics-inset p-3">
                                    <dt className="text-[var(--viralix-muted)] text-xs uppercase tracking-wide">Reach</dt>
                                    <dd className="text-xl font-bold text-[var(--viralix-accent)] mt-1">{formatNumber(reach)}</dd>
                                </div>
                            )}
                            {totalInteractions > 0 && (
                                <div className="analytics-inset p-3">
                                    <dt className="text-[var(--viralix-muted)] text-xs uppercase tracking-wide">Total interactions</dt>
                                    <dd className="text-xl font-bold text-[var(--viralix-accent)] mt-1">{formatNumber(totalInteractions)}</dd>
                                </div>
                            )}
                        </dl>
                    )}
                </div>
                <EngagementPieChart embedded likes={likes} comments={comments} shares={shares} saves={saves} />
            </div>
        </div>
    );
}
