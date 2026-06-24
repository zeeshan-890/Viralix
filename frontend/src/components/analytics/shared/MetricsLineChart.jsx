'use client';

import {
    LineChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';
import { ChartPanel, ChartEmpty, ChartTooltipBox } from './ChartPanel';

const LINES = [
    { key: 'views', name: 'Views', color: '#84A98C' },
    { key: 'likes', name: 'Likes', color: '#E4405F' },
    { key: 'comments', name: 'Comments', color: '#52796F' },
    { key: 'shares', name: 'Shares', color: '#F4A261' },
];

export default function MetricsLineChart({
    timeline = [],
    title = 'Metrics trend',
    subtitle = 'Daily breakdown by metric',
    metrics = ['views', 'likes', 'comments'],
}) {
    const activeLines = LINES.filter((l) => metrics.includes(l.key));

    const chart = !timeline.length ? (
        <ChartEmpty />
    ) : (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} width={44} />
                    <Tooltip content={<ChartTooltipBox />} />
                    <Legend />
                    {activeLines.map((l) => (
                        <Line
                            key={l.key}
                            type="monotone"
                            dataKey={l.key}
                            name={l.name}
                            stroke={l.color}
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
