import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, Film, ImageIcon, FileText, Heart, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/utils';
import { aggregatePostMetrics, STATUS_CONFIG } from './constants';

function PostThumbnail({ post }) {
    const media = post.media?.[0];
    if (media?.url) {
        return (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <Image src={media.url} alt="" fill className="object-cover" sizes="40px" unoptimized />
                {media.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Film className="h-3.5 w-3.5 text-white" aria-hidden />
                    </div>
                )}
            </div>
        );
    }
    const Icon = post.content?.length > 80 ? FileText : ImageIcon;
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F0ED]">
            <Icon className="h-4 w-4 text-[var(--viralix-primary-dark)]" aria-hidden />
        </div>
    );
}

const BADGE_VARIANT = {
    draft: 'default',
    scheduled: 'warning',
    published: 'success',
    failed: 'danger',
};

export default function RecentPostsList({ posts = [] }) {
    const recent = [...posts]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5);

    return (
        <section className="rounded-xl border border-[var(--viralix-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--viralix-border)] p-4">
                <div>
                    <h2 className="text-sm font-semibold text-[var(--viralix-accent)]">Recent posts</h2>
                    <p className="text-xs text-gray-400">Latest activity across platforms</p>
                </div>
                <Link
                    href="/dashboard/preview"
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--viralix-primary-dark)] hover:underline"
                >
                    All posts
                    <ArrowUpRight className="h-3 w-3" />
                </Link>
            </div>

            {recent.length === 0 ? (
                <div className="px-4 py-10 text-center">
                    <p className="text-sm font-medium text-[var(--viralix-accent)]">No posts yet</p>
                    <p className="mt-0.5 text-xs text-gray-400">Create your first post to get started</p>
                    <Link
                        href="/dashboard/schedule"
                        className="mt-3 inline-block rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                        style={{ backgroundColor: 'var(--viralix-primary)' }}
                    >
                        Create post
                    </Link>
                </div>
            ) : (
                <ul className="divide-y divide-[var(--viralix-border)]">
                    {recent.map((post) => {
                        const metrics = aggregatePostMetrics(post);
                        const status = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                        return (
                            <li key={post._id}>
                                <Link
                                    href={`/dashboard/preview/${post._id}`}
                                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--viralix-bg)]"
                                >
                                    <PostThumbnail post={post} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-xs font-medium text-[var(--viralix-accent)]">
                                                {post.title || 'Untitled'}
                                            </p>
                                            <Badge variant={BADGE_VARIANT[post.status] || 'default'} pill>
                                                {status.label}
                                            </Badge>
                                        </div>
                                        <p className="mt-0.5 line-clamp-1 text-[0.6875rem] text-gray-400">
                                            {post.content}
                                        </p>
                                        <div className="mt-1 flex items-center gap-3 text-[0.6875rem] text-gray-400">
                                            <span>
                                                {formatDistanceToNow(new Date(post.updatedAt || post.createdAt), {
                                                    addSuffix: true,
                                                })}
                                            </span>
                                            {post.status === 'published' && (
                                                <>
                                                    <span className="inline-flex items-center gap-0.5">
                                                        <Heart className="h-3 w-3" aria-hidden />
                                                        {formatNumber(metrics.likes)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-0.5">
                                                        <Eye className="h-3 w-3" aria-hidden />
                                                        {formatNumber(metrics.views)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
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
