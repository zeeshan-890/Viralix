'use client';

import Link from 'next/link';
import { ArrowUpRight, FileEdit, CalendarClock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

const STAGES = [
    { key: 'draftPosts', label: 'Drafts', icon: FileEdit, color: '#94A3B8', href: '/dashboard/preview?status=draft' },
    { key: 'scheduledPosts', label: 'Scheduled', icon: CalendarClock, color: '#D97706', href: '/dashboard/schedule' },
    { key: 'publishedPosts', label: 'Published', icon: CheckCircle2, color: '#52796F', href: '/dashboard/preview?status=published' },
    { key: 'failedPosts', label: 'Failed', icon: AlertCircle, color: '#DC2626', href: '/dashboard/preview?status=failed' },
];

function PipelineTooltip({ active, payload, total }) {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];
    const pct = total ? Math.round((value / total) * 100) : 0;
    return (
        <div className="dash-card rounded-lg border border-[var(--viralix-border)] px-3 py-2 shadow-md">
            <p className="text-xs font-medium text-[var(--viralix-accent)]">{name}</p>
            <p className="text-sm tabular-nums text-gray-500">
                {value} posts · {pct}%
            </p>
        </div>
    );
}

export default function ContentPipeline({ overview = {} }) {
    const total = STAGES.reduce((s, st) => s + (overview[st.key] || 0), 0);
    const chartData = STAGES.map((stage) => ({
        name: stage.label,
        value: overview[stage.key] || 0,
        color: stage.color,
        key: stage.key,
    })).filter((d) => d.value > 0);

    const hasData = total > 0;

    return (
        <section className="dash-card rounded-xl border border-[var(--viralix-border)]">
            <div className="flex items-center justify-between border-b border-[var(--viralix-border)] p-4">
                <div>
                    <h2 className="text-sm font-semibold text-[var(--viralix-accent)]">Content pipeline</h2>
                    <p className="text-xs text-gray-400">{overview.totalPosts ?? total} total posts</p>
                </div>
                <Link
                    href="/dashboard/upload"
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--viralix-primary-dark)] hover:underline"
                >
                    Create
                    <ArrowUpRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="p-4">
                <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                    {/* Pie chart */}
                    <div className="relative mx-auto h-44 w-full max-w-[220px] sm:max-w-none">
                        {hasData ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={52}
                                            outerRadius={76}
                                            paddingAngle={chartData.length > 1 ? 3 : 0}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.map((entry) => (
                                                <Cell key={entry.key} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={(props) => <PipelineTooltip {...props} total={total} />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-semibold tabular-nums text-[var(--viralix-accent)]">
                                        {total}
                                    </span>
                                    <span className="text-[0.6875rem] text-gray-400">in pipeline</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center">
                                <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-gray-100">
                                    <div className="text-center">
                                        <p className="text-2xl font-semibold tabular-nums text-gray-300">0</p>
                                        <p className="text-[0.6875rem] text-gray-400">in pipeline</p>
                                    </div>
                                </div>
                                <p className="mt-2 text-center text-xs text-gray-400">Create a post to see breakdown</p>
                            </div>
                        )}

                        {hasData && (
                            <ul className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 sm:hidden">
                                {chartData.map((d) => (
                                    <li key={d.key} className="flex items-center gap-1.5 text-[0.6875rem] text-gray-500">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                                        {d.name} ({d.value})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Stage cards + legend on desktop */}
                    <div className="space-y-3">
                        {hasData && (
                            <ul className="hidden flex-wrap gap-x-4 gap-y-1 sm:flex">
                                {STAGES.map((stage) => {
                                    const count = overview[stage.key] || 0;
                                    if (!count) return null;
                                    const pct = Math.round((count / total) * 100);
                                    return (
                                        <li key={stage.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <span
                                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                style={{ backgroundColor: stage.color }}
                                            />
                                            <span>{stage.label}</span>
                                            <span className="tabular-nums text-gray-400">{pct}%</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            {STAGES.map(({ key, label, icon: Icon, color, href }) => (
                                <Link
                                    key={key}
                                    href={href}
                                    className={cn(
                                        'group rounded-lg border border-[var(--viralix-border)] p-3 transition-colors',
                                        'hover:border-[var(--viralix-primary)] hover:bg-[var(--viralix-bg)]'
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" style={{ color }} aria-hidden />
                                        <span className="text-xs text-gray-500">{label}</span>
                                    </div>
                                    <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--viralix-accent)]">
                                        {overview[key] || 0}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
