import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarPlus, BarChart3, RefreshCw, MessageSquare, Upload } from 'lucide-react';
import { getGreeting } from './constants';

export default function DashboardHeader({ userName, onRefresh, refreshing }) {
    const firstName = userName?.split(' ')[0] || 'there';
    const today = format(new Date(), 'EEEE, MMMM d');

    return (
        <header className="dash-card relative overflow-hidden rounded-2xl border border-[var(--viralix-border)]">
            <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                    background: 'linear-gradient(135deg, #84A98C 0%, #354F52 60%, #2F3E46 100%)',
                }}
                aria-hidden
            />
            <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-medium text-[var(--viralix-muted)]">{today}</p>
                    <h1 className="mt-0.5 text-xl font-semibold text-[var(--viralix-accent)] sm:text-2xl">
                        {getGreeting()}, {firstName}
                    </h1>
                    <p className="mt-1 max-w-lg text-sm text-gray-500">
                        Your content performance at a glance — track reach, schedule posts, and respond to your audience.
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-3 py-2 text-xs font-medium text-[var(--viralix-accent)] transition-colors hover:bg-[var(--viralix-bg)] disabled:opacity-60"
                        aria-label="Refresh dashboard data"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <Link
                        href="/dashboard/inbox"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-3 py-2 text-xs font-medium text-[var(--viralix-accent)] transition-colors hover:bg-[var(--viralix-bg)]"
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Inbox
                    </Link>
                    <Link
                        href="/dashboard/analytics"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-3 py-2 text-xs font-medium text-[var(--viralix-accent)] transition-colors hover:bg-[var(--viralix-bg)]"
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Analytics
                    </Link>
                    <Link
                        href="/dashboard/upload"
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                        style={{ backgroundColor: 'var(--viralix-primary)' }}
                    >
                        <Upload className="h-3.5 w-3.5" />
                        Create
                    </Link>
                    <Link
                        href="/dashboard/schedule"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] px-3 py-2 text-xs font-medium text-[var(--viralix-accent)] transition-colors hover:bg-[var(--viralix-bg)]"
                    >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        Calendar
                    </Link>
                </div>
            </div>
        </header>
    );
}
