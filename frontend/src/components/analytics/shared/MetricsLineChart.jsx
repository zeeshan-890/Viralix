'use client';

import {
    LineChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';
import { ChartPanel, ChartEmpty, ChartTooltipBox } from './ChartPanel';
import { usePlatformAnalyticsTheme } from './PlatformAnalyticsThemeContext';

const LINE_KEYS = [
    { key: 'views', name: 'Views' },
    { key: 'likes', name: 'Likes' },
    { key: 'comments', name: 'Comments' },
    { key: 'shares', name: 'Shares' },
];

export default function MetricsLineChart({
    timeline = [],
    title = 'Metrics trend',
    subtitle = 'Daily breakdown by metric',
    metrics = ['views', 'likes', 'comments'],
}) {
    const theme = usePlatformAnalyticsTheme();
    const colors = [theme.chartPrimary, theme.chartSecondary, theme.chartTertiary, theme.chartColors[3]];
    const activeLines = LINE_KEYS.filter((l) => metrics.includes(l.key));

    const chart = !timeline.length ? (
        <ChartEmpty />
    ) : (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: theme.axisTick }} tickFormatter={(v) => v?.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: theme.axisTick }} width={44} />
                    <Tooltip content={<ChartTooltipBox />} />
                    <Legend wrapperStyle={{ color: theme.legendColor }} />
                    {activeLines.map((l, i) => (
                        <Line
                            key={l.key}
                            type="monotone"
                            dataKey={l.key}
                            name={l.name}
                            stroke={colors[i % colors.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <ChartPanel title={title} subtitle={subtitle}>
            {chart}
        </ChartPanel>
    );
}
