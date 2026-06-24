import Link from 'next/link';
import { format, isToday, isTomorrow } from 'date-fns';
import { ArrowUpRight, Clock } from 'lucide-react';
import { PLATFORM_CONFIG, STATUS_CONFIG } from './constants';

function formatScheduleDate(dateStr) {
    const d = new Date(dateStr);
    if (isToday(d)) return `Today · ${format(d, 'h:mm a')}`;
    if (isTomorrow(d)) return `Tomorrow · ${format(d, 'h:mm a')}`;
    return format(d, 'MMM d · h:mm a');
}

export default function UpcomingSchedule({ posts = [] }) {
    const scheduled = posts
        .filter((p) => p.status === 'scheduled' && (p.scheduledAt || p.scheduledDate))
        .sort((a, b) => new Date(a.scheduledAt || a.scheduledDate) - new Date(b.scheduledAt || b.scheduledDate))
        .slice(0, 4);

    return (
        <section className="dash-card rounded-xl border border-[var(--viralix-border)]">
            <div className="flex items-center justify-between border-b border-[var(--viralix-border)] p-4">
                <div>
                    <h2 className="text-sm font-semibold text-[var(--viralix-accent)]">Upcoming</h2>
                    <p className="text-xs text-gray-400">{scheduled.length} in queue</p>
                </div>
                <Link
                    href="/dashboard/schedule"
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--viralix-primary-dark)] hover:underline"
                >
                    View all
                    <ArrowUpRight className="h-3 w-3" />
                </Link>
            </div>

            {scheduled.length === 0 ? (
                <div className="px-4 py-10 text-center">
                    <Clock className="mx-auto h-8 w-8 text-gray-300" aria-hidden />
                    <p className="mt-2 text-sm font-medium text-[var(--viralix-accent)]">Nothing scheduled</p>
                    <p className="mt-0.5 text-xs text-gray-400">Plan your next post on the calendar</p>
                    <Link
                        href="/dashboard/schedule"
                        className="mt-3 inline-block rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                        style={{ backgroundColor: 'var(--viralix-primary)' }}
                    >
                        Open calendar
                    </Link>
                </div>
            ) : (
                <ul className="divide-y divide-[var(--viralix-border)]">
                    {scheduled.map((post) => {
                        const platforms = (post.platforms || []).map((p) => p.name);
                        return (
                            <li key={post._id}>
                                <Link
                                    href={`/dashboard/preview/${post._id}`}
                                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--viralix-bg)]"
                                >
                                    <div
                                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[0.625rem] font-bold uppercase"
                                        style={{ backgroundColor: '#E8F0ED', color: '#52796F' }}
                                    >
                                        {format(new Date(post.scheduledAt || post.scheduledDate), 'd')}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-[var(--viralix-accent)]">
                                            {post.title || 'Untitled'}
                                        </p>
                                        <p className="mt-0.5 text-[0.6875rem] text-gray-400">
                                            {formatScheduleDate(post.scheduledAt || post.scheduledDate)}
                                        </p>
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {platforms.map((pl) => {
                                                const cfg = PLATFORM_CONFIG[pl];
                                                if (!cfg) return null;
                                                const Icon = cfg.icon;
                                                return (
                                                    <span
                                                        key={pl}
                                                        className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[0.625rem] font-medium"
                                                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                                                    >
                                                        <Icon className="h-2.5 w-2.5" aria-hidden />
                                                        {cfg.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <span
                                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: STATUS_CONFIG.scheduled.dot }}
                                        aria-label="Scheduled"
                                    />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
