import Link from 'next/link';
import { Lightbulb, TrendingUp, Target, Zap } from 'lucide-react';

export default function AiInsightsPanel({ overview = {} }) {
    const failedCount = overview.failedPosts || 0;
    const insights = [];

    if (overview.engagementRate > 0) {
        insights.push({
            icon: TrendingUp,
            title: 'Engagement trending up',
            body: `Your rate is ${overview.engagementRate.toFixed(1)}% — above average for your niche.`,
            accent: '#52796F',
            bg: '#E8F0ED',
            href: '/dashboard/analytics',
        });
    }

    if (overview.scheduledPosts > 0) {
        insights.push({
            icon: Target,
            title: 'Content queue healthy',
            body: `${overview.scheduledPosts} posts scheduled. Keep a 3–5 day buffer for consistency.`,
            accent: '#354F52',
            bg: '#EDF1EF',
            href: '/dashboard/schedule',
        });
    }

    if (failedCount > 0) {
        insights.push({
            icon: Zap,
            title: 'Action needed',
            body: `${failedCount} post${failedCount > 1 ? 's' : ''} failed to publish. Review and retry.`,
            accent: '#DC2626',
            bg: '#FEF2F2',
            href: '/dashboard/preview?status=failed',
        });
    }

    if (insights.length === 0) {
        insights.push({
            icon: Lightbulb,
            title: 'Get started',
            body: 'Connect your accounts and publish your first post to unlock AI-powered insights.',
            accent: '#84A98C',
            bg: '#E8F0ED',
            href: '/dashboard/connect-accounts',
        });
    }

    return (
        <section className="rounded-xl border border-[var(--viralix-border)] bg-white">
            <div className="border-b border-[var(--viralix-border)] p-4">
                <h2 className="text-sm font-semibold text-[var(--viralix-accent)]">AI insights</h2>
                <p className="text-xs text-gray-400">Personalized recommendations</p>
            </div>
            <ul className="space-y-2 p-3">
                {insights.slice(0, 3).map(({ icon: Icon, title, body, accent, bg, href }) => (
                    <li key={title}>
                        <Link
                            href={href}
                            className="flex gap-2.5 rounded-lg p-3 transition-opacity hover:opacity-90"
                            style={{ backgroundColor: bg }}
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80">
                                <Icon className="h-3.5 w-3.5" style={{ color: accent }} aria-hidden />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-[var(--viralix-accent)]">{title}</p>
                                <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-gray-500">{body}</p>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
