import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { PLATFORM_CONFIG } from './constants';
import PlatformBadge from '@/components/ui/PlatformBadge';

export default function PlatformSnapshot({ accounts, platformBreakdown = {} }) {
    const connected = accounts.filter((a) => a.isActive !== false);

    return (
        <section className="dash-card flex h-full flex-col rounded-xl border border-[var(--viralix-border)]">
            <div className="flex items-center justify-between border-b border-[var(--viralix-border)] p-4">
                <div>
                    <h2 className="text-sm font-semibold text-[var(--viralix-accent)]">Platforms</h2>
                    <p className="text-xs text-gray-400">{connected.length} connected</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/platforms"
                        className="text-xs font-medium text-[var(--viralix-primary-dark)] hover:underline"
                    >
                        Hub
                    </Link>
                    <Link
                        href="/dashboard/connect-accounts"
                        className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--viralix-primary-dark)] hover:underline"
                    >
                        Manage
                        <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>

            <div className="flex-1 space-y-2 p-3">
                {connected.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
                        <p className="text-sm font-medium text-[var(--viralix-accent)]">No accounts connected</p>
                        <p className="mt-1 text-xs text-gray-400">Connect platforms to see performance</p>
                        <Link
                            href="/dashboard/connect-accounts"
                            className="mt-3 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                            style={{ backgroundColor: 'var(--viralix-primary)' }}
                        >
                            Connect now
                        </Link>
                    </div>
                ) : (
                    connected.map((account) => {
                        const cfg = PLATFORM_CONFIG[account.platform] || PLATFORM_CONFIG.facebook;
                        const stats = platformBreakdown[account.platform] || {};
                        const views = stats.engagement?.views || 0;
                        const posts = stats.posts || 0;
                        const maxFollowers = Math.max(...connected.map((a) => a.followerCount || 0), 1);
                        const barWidth = ((account.followerCount || 0) / maxFollowers) * 100;

                        return (
                            <div
                                key={account._id}
                                className="rounded-lg border border-[var(--viralix-border)] p-3 transition-colors hover:bg-[var(--viralix-bg)]"
                            >
                                <div className="flex items-center gap-2.5">
                                    <PlatformBadge platform={account.platform} size="sm" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-[var(--viralix-accent)]">
                                            {account.accountName}
                                        </p>
                                        <p className="text-[0.6875rem] text-gray-400">
                                            {formatNumber(account.followerCount || 0)} followers · {posts} posts
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold tabular-nums text-[var(--viralix-primary-dark)]">
                                        {formatNumber(views)}
                                    </span>
                                </div>
                                <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${barWidth}%`, backgroundColor: cfg.color }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}
