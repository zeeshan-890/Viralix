'use client';

import { formatNumber } from '@/lib/utils';
import EngagementPieChart from './EngagementPieChart';

export default function EngagementMetricGrid({ metrics = [], columns = 4 }) {
    const gridClass = {
        2: 'grid-cols-2',
        3: 'grid-cols-2 sm:grid-cols-3',
        4: 'grid-cols-2 sm:grid-cols-4',
        5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    }[columns] || 'grid-cols-2 sm:grid-cols-4';

    return (
        <div className={`grid gap-4 ${gridClass}`}>
            {metrics.map((m) => (
                <div key={m.label} className="dash-card rounded-2xl border border-[var(--viralix-border)] p-5">
                    <div className="flex items-center gap-3 mb-2">
                        {m.icon && (
                            <div className={`p-2 rounded-lg ${m.iconBg || 'bg-gray-100 text-gray-600'}`}>
                                <m.icon className="w-5 h-5" />
                            </div>
                        )}
                        <span className="text-sm font-medium text-gray-500">{m.label}</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 tabular-nums">{formatNumber(m.value)}</div>
                    {m.rate != null && (
                        <p className="text-xs text-gray-500 mt-1">{m.rate}% of views</p>
                    )}
                </div>
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
        { label: 'Shares', value: shares, color: 'bg-green-500', pct: views ? (shares / views) * 100 : 0 },
    ];
    if (saves) bars.push({ label: 'Saves', value: saves, color: 'bg-orange-500', pct: views ? (saves / views) * 100 : 0 });

    return (
        <div className="dash-card rounded-2xl border border-[var(--viralix-border)] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Engagement breakdown</h3>
            <div className="grid gap-6 lg:grid-cols-2">
                <div>
                    <div className="mb-6">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Overall engagement rate</span>
                            <span className="text-sm font-bold text-gray-900">{engagementRate}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#84A98C] to-emerald-600 rounded-full transition-all"
                                style={{ width: `${Math.min(parseFloat(engagementRate), 100)}%` }}
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {bars.map((b) => (
                            <div key={b.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">{b.label}</span>
                                    <span className="font-medium tabular-nums">{formatNumber(b.value)} <span className="text-gray-400">({b.pct.toFixed(2)}%)</span></span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${b.color} rounded-full`} style={{ width: `${Math.min(b.pct * 10, 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {(reach > 0 || totalInteractions > 0) && (
                        <dl className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                            {reach > 0 && (
                                <div>
                                    <dt className="text-gray-500">Reach</dt>
                                    <dd className="text-xl font-bold text-[#354F52]">{formatNumber(reach)}</dd>
                                </div>
                            )}
                            {totalInteractions > 0 && (
                                <div>
                                    <dt className="text-gray-500">Total interactions</dt>
                                    <dd className="text-xl font-bold text-[#354F52]">{formatNumber(totalInteractions)}</dd>
                                </div>
                            )}
                        </dl>
                    )}
                </div>
                <EngagementPieChart
                    embedded
                    likes={likes}
                    comments={comments}
                    shares={shares}
                    saves={saves}
                />
            </div>
        </div>
    );
}
