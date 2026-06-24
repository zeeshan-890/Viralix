'use client';

import {
    BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ChartPanel, ChartEmpty, ChartTooltipBox } from './ChartPanel';

export default function PostsActivityBarChart({
    timeline = [],
    title = 'Publishing activity',
    subtitle = 'Number of posts published per day',
}) {
    const data = timeline.map((d) => ({ date: d.date?.slice(5), posts: d.posts || 0 }));

    const chart = !data.length ? (
        <ChartEmpty message="No publishing activity in this period" />
    ) : (
        <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                    <Tooltip content={<ChartTooltipBox />} />
                    <Bar dataKey="posts" name="Posts" fill="#354F52" radius={[4, 4, 0, 0]} />
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
