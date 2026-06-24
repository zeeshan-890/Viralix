'use client';
import { Clock } from 'lucide-react';
import PlatformIcon from '@/components/ui/PlatformIcon';
import { getPlatform } from '@/config/platforms';

const statusStyles = {
    draft: 'bg-gray-100 text-gray-600',
    scheduled: 'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    processing: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-orange-100 text-orange-700',
};

function getPostStatus(post) {
    if (post.isPublished) return 'published';
    if (post.isScheduled) return 'scheduled';
    if (post.approvalStatus === 'pending') return 'pending';

    const statuses = post.platforms?.map(p => p.status) || [];
    if (statuses.includes('failed')) return 'failed';
    if (statuses.includes('processing')) return 'processing';
    if (statuses.includes('published')) return 'published';
    if (statuses.includes('scheduled')) return 'scheduled';

    return 'draft';
}

export default function PostCard({ post, onClick }) {
    const status = getPostStatus(post);
    const time = post.scheduledDate
        ? new Date(post.scheduledDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : null;

    return (
        <div
            onClick={onClick}
            className="p-2.5 rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-surface)] hover:shadow-md cursor-pointer transition-all duration-150 group"
        >
            <div className="flex items-center gap-1 mb-1.5">
                {post.platforms?.map((p, i) => {
                    const cfg = getPlatform(p.name);
                    return (
                        <span key={i} className={`w-5 h-5 rounded flex items-center justify-center ${cfg?.lightBg || 'bg-gray-100'}`}>
                            <PlatformIcon platform={p.name} size={12} />
                        </span>
                    );
                })}
                <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase ${statusStyles[status] || statusStyles.draft}`}>
                    {status}
                </span>
            </div>

            <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
                {post.title || post.content?.substring(0, 60) || 'Untitled Post'}
            </p>

            {time && (
                <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400">
                    <Clock size={10} />
                    {time}
                </div>
            )}

            {post.media?.length > 0 && (
                <div className="mt-1 flex gap-1">
                    {post.media.slice(0, 3).map((m, i) => (
                        <div key={i} className="h-6 w-6 rounded bg-gray-200 overflow-hidden">
                            {m.url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.url} alt="" className="h-full w-full object-cover" />
                            )}
                        </div>
                    ))}
                    {post.media.length > 3 && (
                        <span className="text-[10px] text-gray-400 self-center">+{post.media.length - 3}</span>
                    )}
                </div>
            )}
        </div>
    );
}
