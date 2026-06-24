import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, MessageSquare, Bot } from 'lucide-react';
import { PLATFORM_CONFIG } from './constants';
import PlatformBadge from '@/components/ui/PlatformBadge';

export default function InboxPreview({ conversations = [], unreadTotal = 0 }) {
    const open = conversations
        .filter((c) => c.status === 'open')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 3);

    return (
        <section className="dash-card rounded-xl border border-[var(--viralix-border)]">
            <div className="flex items-center justify-between border-b border-[var(--viralix-border)] p-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-[var(--viralix-accent)]">Inbox</h2>
                    {unreadTotal > 0 && (
                        <span className="rounded-full bg-[var(--viralix-primary)] px-1.5 py-0.5 text-[0.625rem] font-semibold text-white">
                            {unreadTotal}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/inbox/auto-reply"
                        className="inline-flex items-center gap-0.5 text-[0.625rem] font-medium text-[var(--viralix-primary-dark)] hover:underline"
                    >
                        <Bot className="h-3 w-3" />
                        Auto-Reply
                    </Link>
                    <Link
                        href="/dashboard/inbox"
                        className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--viralix-primary-dark)] hover:underline"
                    >
                        Open inbox
                        <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>

            {open.length === 0 ? (
                <div className="px-4 py-8 text-center">
                    <MessageSquare className="mx-auto h-7 w-7 text-gray-300" aria-hidden />
                    <p className="mt-2 text-xs text-gray-400">All caught up</p>
                </div>
            ) : (
                <ul className="divide-y divide-[var(--viralix-border)]">
                    {open.map((conv) => {
                        const cfg = PLATFORM_CONFIG[conv.platform] || PLATFORM_CONFIG.instagram;
                        return (
                            <li key={conv._id}>
                                <Link
                                    href={`/dashboard/inbox?conversation=${conv._id}`}
                                    className="flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-[var(--viralix-bg)]"
                                >
                                    <PlatformBadge platform={conv.platform || 'instagram'} size="sm" rounded="full" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate text-xs font-medium text-[var(--viralix-accent)]">
                                                {conv.participantName}
                                            </p>
                                            {(conv.unreadCount || 0) > 0 && (
                                                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--viralix-primary)]" />
                                            )}
                                        </div>
                                        <p className="mt-0.5 line-clamp-1 text-[0.6875rem] text-gray-400">
                                            {conv.lastMessage?.text}
                                        </p>
                                        <p className="mt-0.5 text-[0.625rem] text-gray-300">
                                            {conv.lastMessage?.createdAt &&
                                                formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                                                    addSuffix: true,
                                                })}
                                        </p>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
