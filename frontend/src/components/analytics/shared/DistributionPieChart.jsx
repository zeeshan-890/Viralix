'use client';

import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { ChartPanel, ChartEmpty, ChartTooltipBox } from './ChartPanel';
import { usePlatformAnalyticsTheme } from './PlatformAnalyticsThemeContext';

export default function DistributionPieChart({
    items = [],
    title,
    subtitle,
    valueKey = 'value',
    nameKey = 'name',
}) {
    const theme = usePlatformAnalyticsTheme();
    const data = items.filter((d) => (d[valueKey] || 0) > 0);

    const chart = !data.length ? (
        <ChartEmpty />
    ) : (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey={valueKey}
                        nameKey={nameKey}
                        label={({ name, percent }) => (percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : '')}
                        labelLine={false}
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={theme.chartColors[i % theme.chartColors.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipBox />} />
                    <Legend formatter={(v) => <span className="text-xs pa-muted capitalize">{v}</span>} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <ChartPanel title={title} subtitle={subtitle}>
            {chart}
        </ChartPanel>
    );
}
