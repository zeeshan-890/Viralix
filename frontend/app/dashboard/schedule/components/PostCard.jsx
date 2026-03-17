'use client';
import { Clock, Facebook, Instagram, Linkedin, Twitter, Youtube, Music2 } from 'lucide-react';

const platformIcons = {
    facebook: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
    instagram: { icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
    twitter: { icon: Twitter, color: 'text-sky-500', bg: 'bg-sky-50' },
    linkedin: { icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
    tiktok: { icon: Music2, color: 'text-gray-900', bg: 'bg-gray-100' },
    youtube: { icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' },
};

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

    // Check platform-level statuses
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
            className="p-2.5 rounded-lg border border-gray-100 bg-white hover:shadow-md hover:border-blue-200 cursor-pointer transition-all duration-150 group"
        >
            {/* Platform icons */}
            <div className="flex items-center gap-1 mb-1.5">
                {post.platforms?.map((p, i) => {
                    const config = platformIcons[p.name] || platformIcons.twitter;
                    const Icon = config.icon;
                    return (
                        <span key={i} className={`w-5 h-5 rounded flex items-center justify-center ${config.bg}`}>
                            <Icon size={12} className={config.color} />
                        </span>
                    );
                })}
                <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase ${statusStyles[status] || statusStyles.draft}`}>
                    {status}
                </span>
            </div>

            {/* Title / Content */}
            <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
                {post.title || post.content?.substring(0, 60) || 'Untitled Post'}
            </p>

            {/* Time */}
            {time && (
                <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400">
                    <Clock size={10} />
                    {time}
                </div>
            )}

            {/* Media indicator */}
            {post.media?.length > 0 && (
                <div className="mt-1 flex gap-1">
                    {post.media.slice(0, 3).map((m, i) => (
                        <div key={i} className="w-6 h-6 rounded bg-gray-100 overflow-hidden">
                            {m.type === 'image' ? (
                                <img src={m.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">▶</div>
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
