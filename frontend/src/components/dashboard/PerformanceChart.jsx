'use client';

import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { analyticsAPI } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { Eye, Heart, Users, Radio } from 'lucide-react';

const METRICS = [
    { key: 'views', label: 'Views', icon: Eye, color: '#84A98C' },
    { key: 'engagement', label: 'Engagement', icon: Heart, color: '#52796F' },
    { key: 'followers', label: 'Followers', icon: Users, color: '#354F52' },
    { key: 'reach', label: 'Reach', icon: Radio, color: '#6B9080' },
];

function ChartTooltip({ active, payload, label, metricKey }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="dash-card rounded-lg border border-[var(--viralix-border)] px-3 py-2 shadow-md">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-[var(--viralix-accent)]">
                {formatNumber(payload[0]?.value ?? 0)} {metricKey}
            </p>
        </div>
    );
}

export default function PerformanceChart() {
    const [period, setPeriod] = useState('7d');
    const [metric, setMetric] = useState('views');
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await analyticsAPI.getPerformance({ period });
                if (!cancelled) setTimeline(res.data?.timeline || []);
            } catch {
                if (!cancelled) setTimeline([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [period]);

    const active = METRICS.find((m) => m.key === metric) || METRICS[0];
    const total = timeline.reduce((s, d) => s + (d[metric] || 0), 0);

    return (
        <section className="dash-card rounded-xl border border-[var(--viralix-border)]">
            <div className="flex flex-col gap-3 border-b border-[var(--viralix-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-[var(--viralix-accent)]">Performance</h2>
                    <p className="text-xs text-gray-400">
                        {loading ? 'Loading…' : `${formatNumber(total)} total ${active.label.toLowerCase()}`}
                    </p>
                </div>
                <div className="flex flex-wrap gap-1 rounded-lg bg-[var(--viralix-bg)] p-1">
                    {['7d', '30d', '90d'].map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPeriod(p)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                period === p
                                    ? 'bg-[var(--viralix-surface)] text-[var(--viralix-accent)] shadow-sm'
                                    : 'text-gray-500 hover:text-[var(--viralix-accent)]'
                            }`}
                        >
                            {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-[var(--viralix-border)] px-4 py-2.5">
                {METRICS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setMetric(key)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            metric === key
                                ? 'bg-[#E8F0ED] text-[var(--viralix-primary-dark)]'
                                : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {label}
                    </button>
                ))}
            </div>

            <div className="h-56 p-4 pt-2">
                {loading ? (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        Loading chart…
                    </div>
                ) : timeline.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        No data for this period
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeline} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={active.color} stopOpacity={0.25} />
                                    <stop offset="100%" stopColor={active.color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--viralix-border)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: '#94A3B8' }}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#94A3B8' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => formatNumber(v)}
                            />
                            <Tooltip content={<ChartTooltip metricKey={metric} />} />
                            <Area
                                type="monotone"
                                dataKey={metric}
                                stroke={active.color}
                                strokeWidth={2}
                                fill="url(#chartFill)"
                                dot={false}
                                activeDot={{ r: 4, fill: active.color }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    );
}
