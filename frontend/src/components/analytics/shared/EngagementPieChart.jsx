'use client';

import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import { ChartPanel, ChartEmpty, ChartTooltipBox } from './ChartPanel';
import { usePlatformAnalyticsTheme } from './PlatformAnalyticsThemeContext';

export default function EngagementPieChart({
    likes = 0,
    comments = 0,
    shares = 0,
    saves = 0,
    title = 'Engagement mix',
    subtitle = 'Share of total interactions',
    embedded = false,
}) {
    const theme = usePlatformAnalyticsTheme();
    const palette = theme.chartColors;

    const data = [
        { name: 'Likes', value: likes, color: palette[0] },
        { name: 'Comments', value: comments, color: palette[1] },
        { name: 'Shares', value: shares, color: palette[2] },
        ...(saves > 0 ? [{ name: 'Saves', value: saves, color: palette[3] }] : []),
    ].filter((d) => d.value > 0);

    const total = data.reduce((s, d) => s + d.value, 0);

    const chart = !data.length ? (
        <ChartEmpty message="No engagement data yet" />
    ) : (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                    >
                        {data.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => (
                            <ChartTooltipBox active={active} payload={payload?.map((p) => ({ ...p, name: p.name }))} />
                        )}
                    />
                    <Legend formatter={(value) => <span className="text-xs pa-muted">{value}</span>} />
                </PieChart>
            </ResponsiveContainer>
            <p className="text-center text-xs pa-muted mt-1">{formatNumber(total)} total interactions</p>
        </div>
    );

    if (embedded) return chart;

    return (
        <ChartPanel title={title} subtitle={subtitle}>
            {chart}
        </ChartPanel>
    );
}
