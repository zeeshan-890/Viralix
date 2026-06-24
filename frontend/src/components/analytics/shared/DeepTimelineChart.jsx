'use client';

import { useId } from 'react';
import {
    Area, AreaChart, Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import { ChartPanel, ChartEmpty, ChartTooltipBox } from './ChartPanel';
import { usePlatformAnalyticsTheme } from './PlatformAnalyticsThemeContext';

export default function DeepTimelineChart({
    timeline = [],
    loading,
    variant = 'area',
    title,
    subtitle = 'Views and engagement over time',
    embedded = false,
}) {
    const theme = usePlatformAnalyticsTheme();
    const uid = useId().replace(/:/g, '');
    const viewsGrad = `viewsGrad-${uid}`;
    const engGrad = `engGrad-${uid}`;

    if (loading) {
        const el = (
            <div className="flex h-64 items-center justify-center">
                <p className="text-sm pa-muted">Loading chart…</p>
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
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: theme.axisTick }} tickFormatter={(v) => v?.slice(5)} />
                        <YAxis tick={{ fontSize: 11, fill: theme.axisTick }} tickFormatter={(v) => formatNumber(v)} width={48} />
                        <Tooltip content={<ChartTooltipBox />} />
                        <Legend wrapperStyle={{ color: theme.legendColor }} />
                        <Line type="monotone" dataKey="views" name="Views" stroke={theme.chartPrimary} strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="engagement" name="Engagement" stroke={theme.chartSecondary} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                ) : (
                    <AreaChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={viewsGrad} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={theme.chartPrimary} stopOpacity={0.35} />
                                <stop offset="100%" stopColor={theme.chartPrimary} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id={engGrad} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={theme.chartSecondary} stopOpacity={0.25} />
                                <stop offset="100%" stopColor={theme.chartSecondary} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: theme.axisTick }} tickFormatter={(v) => v?.slice(5)} />
                        <YAxis tick={{ fontSize: 11, fill: theme.axisTick }} tickFormatter={(v) => formatNumber(v)} width={48} />
                        <Tooltip content={<ChartTooltipBox />} />
                        <Legend wrapperStyle={{ color: theme.legendColor }} />
                        <Area type="monotone" dataKey="views" name="Views" stroke={theme.chartPrimary} fill={`url(#${viewsGrad})`} strokeWidth={2} />
                        <Area type="monotone" dataKey="engagement" name="Engagement" stroke={theme.chartSecondary} fill={`url(#${engGrad})`} strokeWidth={2} />
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
