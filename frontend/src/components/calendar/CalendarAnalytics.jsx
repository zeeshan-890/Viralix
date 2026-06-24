'use client';

import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts';
import { Calendar, CheckCircle2, Clock, Eye, FileEdit, AlertCircle, Heart } from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import { cal } from './calendarTheme';

const STATUS_META = [
    { key: 'scheduled', label: 'Scheduled', icon: Clock, pill: 'bg-amber-500/25 text-amber-100' },
    { key: 'published', label: 'Published', icon: CheckCircle2, pill: 'bg-emerald-500/25 text-emerald-100' },
    { key: 'draft', label: 'Drafts', icon: FileEdit, pill: 'bg-white/15 text-white/90' },
    { key: 'failed', label: 'Failed', icon: AlertCircle, pill: 'bg-red-500/25 text-red-100' },
];

export default function CalendarAnalytics({ title, analytics, selectedDateKey, onClearSelection }) {
    const chartData = Object.entries(analytics.dailyCounts || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({
            date: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count,
            raw: date,
        }));

    return (
        <section className={cn(cal.surfaceRaised, 'overflow-hidden rounded-xl')}>
            <div className={cn(cal.analyticsHeader, 'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between')}>
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                        <Calendar className="h-4 w-4 text-white" aria-hidden />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white">Timeline analytics</h2>
                        <p className="text-xs text-white/75">
                            {selectedDateKey ? (
                                <>
                                    {new Date(selectedDateKey + 'T12:00:00').toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                    {' · '}
                                    <button
                                        type="button"
                                        onClick={onClearSelection}
                                        className="font-medium text-white underline-offset-2 hover:underline"
                                    >
                                        Show full range
                                    </button>
                                </>
                            ) : (
                                title
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {STATUS_META.map(({ key, label, icon: Icon, pill }) => (
                        <div key={key} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${pill}`}>
                            <Icon className="h-3.5 w-3.5" aria-hidden />
                            <span className="text-xs font-medium">
                                {analytics[key] || 0} {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={cn(cal.analyticsBody, 'grid gap-4 p-4 lg:grid-cols-12')}>
                <div className="grid grid-cols-3 gap-3 lg:col-span-4">
                    {[
                        { label: 'Total posts', value: analytics.total, icon: null },
                        { label: 'Views', value: formatNumber(analytics.totalViews), icon: Eye },
                        { label: 'Engagement', value: formatNumber(analytics.totalEngagement), icon: Heart },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="rounded-lg dash-card border border-[var(--viralix-border)] p-3 shadow-sm">
                            <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-[#52796F]">{label}</p>
                            <p className="mt-1 flex items-center gap-1 text-xl font-semibold tabular-nums text-[#354F52]">
                                {Icon && <Icon className="h-4 w-4 text-[#84A98C]" aria-hidden />}
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="h-28 rounded-lg dash-card border border-[var(--viralix-border)] p-2 shadow-sm lg:col-span-8">
                    {chartData.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-[#52796F]">
                            No posts in this period
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#52796F' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(132, 169, 140, 0.12)' }}
                                    content={({ active, payload }) =>
                                        active && payload?.[0] ? (
                                            <div className="rounded-lg dash-card border border-[var(--viralix-border)] px-2.5 py-1.5 text-xs shadow-md">
                                                <span className="font-medium text-[#354F52]">
                                                    {payload[0].payload.date}: {payload[0].value} posts
                                                </span>
                                            </div>
                                        ) : null
                                    }
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={28}>
                                    {chartData.map((entry) => (
                                        <Cell
                                            key={entry.raw}
                                            fill={entry.raw === selectedDateKey ? '#354F52' : '#84A98C'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </section>
    );
}
