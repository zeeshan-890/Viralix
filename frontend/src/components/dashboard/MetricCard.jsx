import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MetricCard({ title, value, change, icon: Icon, accent = 'sage' }) {
    const accents = {
        sage: { iconBg: '#E8F0ED', iconColor: '#52796F' },
        forest: { iconBg: '#DDE8E0', iconColor: '#354F52' },
        mint: { iconBg: '#EEF5F0', iconColor: '#84A98C' },
        slate: { iconBg: '#EDF1EF', iconColor: '#52796F' },
    };
    const style = accents[accent] || accents.sage;
    const positive = change === undefined || change >= 0;

    return (
        <article className="group relative overflow-hidden rounded-xl border border-[var(--viralix-border)] bg-white p-4 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--viralix-muted)]">
                        {title}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--viralix-accent)]">
                        {value}
                    </p>
                    {change !== undefined && (
                        <div className="mt-2 flex items-center gap-1">
                            {positive ? (
                                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                            ) : (
                                <TrendingDown className="h-3.5 w-3.5 text-red-500" aria-hidden />
                            )}
                            <span
                                className={cn(
                                    'text-xs font-medium tabular-nums',
                                    positive ? 'text-emerald-600' : 'text-red-500'
                                )}
                            >
                                {positive ? '+' : ''}
                                {change}%
                            </span>
                            <span className="text-xs text-gray-400">vs last month</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                        style={{ backgroundColor: style.iconBg }}
                    >
                        <Icon className="h-5 w-5" style={{ color: style.iconColor }} aria-hidden />
                    </div>
                )}
            </div>
        </article>
    );
}
