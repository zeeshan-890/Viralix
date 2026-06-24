'use client';

import {
    Area, AreaChart, Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import { ChartPanel, ChartEmpty, ChartTooltipBox } from './ChartPanel';

export default function DeepTimelineChart({
    timeline = [],
    loading,
    variant = 'area',
    title,
    subtitle = 'Views and engagement over time',
    embedded = false,
}) {
    if (loading) {
        const el = (
            <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-gray-500">Loading chart…</p>
            </div>
        );
        return embedded ? el : <ChartPanel title={title || 'Performance over time'} subtitle={subtitle}>{el}</ChartPanel>;
    }

    if (!timeline.length) {
        const el = <ChartEmpty message="No timeline data for this period" />;
        return embedded ? el : <ChartPanel title={title || 'Performance over time'} subtitle={subtitle}>{el}</ChartPanel>;
    }

    const chart = (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                {variant === 'line' ? (
                    <LineChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNumber(v)} width={48} />
                        <Tooltip content={<ChartTooltipBox />} />
                        <Legend />
                        <Line type="monotone" dataKey="views" name="Views" stroke="#84A98C" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="engagement" name="Engagement" stroke="#E4405F" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                ) : (
                    <AreaChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#84A98C" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#84A98C" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#E4405F" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#E4405F" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNumber(v)} width={48} />
                        <Tooltip content={<ChartTooltipBox />} />
                        <Legend />
                        <Area type="monotone" dataKey="views" name="Views" stroke="#84A98C" fill="url(#viewsGrad)" strokeWidth={2} />
                        <Area type="monotone" dataKey="engagement" name="Engagement" stroke="#E4405F" fill="url(#engGrad)" strokeWidth={2} />
                    </AreaChart>
                )}
            </ResponsiveContainer>
        </div>
    );

    if (embedded) return chart;

    return (
        <ChartPanel title={title || 'Performance over time'} subtitle={subtitle}>
            {chart}
        </ChartPanel>
    );
}
