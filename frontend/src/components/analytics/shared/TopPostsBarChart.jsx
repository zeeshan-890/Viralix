'use client';

import {
    BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import { ChartPanel, ChartEmpty, ChartTooltipBox } from './ChartPanel';
import { usePlatformAnalyticsTheme } from './PlatformAnalyticsThemeContext';

export default function TopPostsBarChart({
    posts = [],
    title = 'Top posts comparison',
    subtitle = 'Views vs engagement',
    maxItems = 8,
}) {
    const theme = usePlatformAnalyticsTheme();
    const data = posts.slice(0, maxItems).map((p, i) => ({
        name: `#${i + 1}`,
        label: (p.title || 'Post').slice(0, 18) + ((p.title?.length || 0) > 18 ? '…' : ''),
        views: p.metrics?.views || 0,
        engagement: p.metrics?.engagement || 0,
        likes: p.metrics?.likes || 0,
    }));

    const chart = !data.length ? (
        <ChartEmpty />
    ) : (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme.axisTick }} />
                    <YAxis tick={{ fontSize: 11, fill: theme.axisTick }} tickFormatter={(v) => formatNumber(v)} width={44} />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const row = payload[0]?.payload;
                            return (
                                <div className="analytics-panel pa-panel px-3 py-2 text-sm shadow-lg">
                                    <p className="font-medium pa-title mb-1">{row?.label}</p>
                                    {payload.map((p) => (
                                        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {formatNumber(p.value)}</p>
                                    ))}
                                </div>
                            );
                        }}
                    />
                    <Legend wrapperStyle={{ color: theme.legendColor }} />
                    <Bar dataKey="views" name="Views" fill={theme.chartPrimary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="engagement" name="Engagement" fill={theme.chartSecondary} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <ChartPanel title={title} subtitle={subtitle}>
            {chart}
        </ChartPanel>
    );
}

export function AccountComparisonBarChart({
    accounts = [],
    title = 'Performance by account',
    subtitle = 'Views and engagement per connected account',
}) {
    const theme = usePlatformAnalyticsTheme();
    const data = accounts.map((a) => ({
        name: String(a.accountName || a.username || 'Account').slice(0, 12),
        views: a.contentStats?.views || 0,
        engagement: a.contentStats?.engagement || 0,
        posts: a.contentStats?.posts || 0,
    }));

    const chart = !data.length ? (
        <ChartEmpty />
    ) : (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: theme.axisTick }} tickFormatter={(v) => formatNumber(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: theme.axisTick }} width={72} />
                    <Tooltip content={<ChartTooltipBox />} />
                    <Legend wrapperStyle={{ color: theme.legendColor }} />
                    <Bar dataKey="views" name="Views" fill={theme.chartPrimary} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="engagement" name="Engagement" fill={theme.chartSecondary} radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <ChartPanel title={title} subtitle={subtitle}>
            {chart}
        </ChartPanel>
    );
}
