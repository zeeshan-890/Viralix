'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getPlatform } from '@/config/platforms';
import PlatformIcon from '@/components/ui/PlatformIcon';

export default function PlatformTabs({ post, embedded = false }) {
    const [activeTab, setActiveTab] = useState('facebook');

    const platforms = [
        { id: 'facebook', name: 'Facebook' },
        { id: 'instagram', name: 'Instagram' },
        { id: 'twitter', name: 'Twitter' },
        { id: 'linkedin', name: 'LinkedIn' },
        { id: 'tiktok', name: 'TikTok' },
        { id: 'youtube', name: 'YouTube' },
    ].map((p) => ({ ...p, cfg: getPlatform(p.id) }));

    const availablePlatforms = platforms.filter((platform) =>
        post?.platforms?.some((p) => p.name === platform.id)
    );

    const displayPlatforms = availablePlatforms.length > 0 ? availablePlatforms : platforms.slice(0, 2);
    const currentTab = displayPlatforms.find((p) => p.id === activeTab) ? activeTab : displayPlatforms[0]?.id;

    const renderMediaPreview = (media) => {
        if (!media || media.length === 0) {
            return (
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">📝</div>
                        <p>Text-only post</p>
                    </div>
                </div>
            );
        }

        const firstMedia = media[0];
        if (firstMedia.type === 'video') {
            return (
                <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
                    <video src={firstMedia.url} className="w-full h-full object-cover" controls preload="metadata" />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">VIDEO</div>
                </div>
            );
        }
        return <img src={firstMedia.url} alt={post?.title || 'Post media'} className="w-full h-48 object-cover rounded-lg" />;
    };

    const renderPreview = () => {
        switch (currentTab) {
            case 'facebook':
                return (
                    <div className="dash-card rounded-lg border border-[var(--viralix-border)] max-w-lg mx-auto shadow-sm">
                        <div className="flex items-center p-4 border-b border-gray-200">
                            <div className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center text-white font-bold">AU</div>
                            <div className="ml-3">
                                <p className="font-semibold">AutoReach AI</p>
                                <p className="text-sm text-gray-600">Just now · 🌍</p>
                            </div>
                        </div>
                        <div className="p-4">
                            {post?.content && <p className="mb-4 whitespace-pre-wrap">{post.content}</p>}
                            {post?.hashtags?.length > 0 && (
                                <div className="mb-4">
                                    {post.hashtags.map((tag, idx) => (
                                        <span key={idx} className="text-blue-600 mr-1">#{tag}</span>
                                    ))}
                                </div>
                            )}
                            {renderMediaPreview(post?.media)}
                        </div>
                    </div>
                );
            case 'instagram':
                return (
                    <div className="dash-card rounded-lg border border-[var(--viralix-border)] max-w-md mx-auto shadow-sm">
                        <div className="flex items-center p-3 border-b border-gray-200">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                            <span className="ml-2 font-semibold">autoreach_ai</span>
                        </div>
                        <div className="aspect-square bg-gray-100">
                            {post?.media?.length > 0 ? (
                                post.media[0].type === 'video' ? (
                                    <video src={post.media[0].url} className="w-full h-full object-cover" controls preload="metadata" />
                                ) : (
                                    <img src={post.media[0].url} alt={post?.title} className="w-full h-full object-cover" />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">📷 No media</div>
                            )}
                        </div>
                        <div className="p-3">
                            {post?.content && (
                                <p className="text-sm"><strong>autoreach_ai</strong> {post.content}</p>
                            )}
                        </div>
                    </div>
                );
            case 'tiktok':
                return (
                    <div className="bg-black rounded-lg aspect-[9/16] max-w-sm mx-auto relative overflow-hidden">
                        {post?.media?.[0]?.type === 'video' ? (
                            <video src={post.media[0].url} className="w-full h-full object-cover" controls preload="metadata" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white text-center">
                                <p className="text-lg">TikTok Preview</p>
                            </div>
                        )}
                        {post?.content && (
                            <div className="absolute bottom-4 left-4 right-16 text-white">
                                <p className="text-sm opacity-90 line-clamp-3">{post.content}</p>
                            </div>
                        )}
                    </div>
                );
            case 'youtube':
                return (
                    <div className="bg-black rounded-lg aspect-video relative overflow-hidden max-w-2xl mx-auto">
                        {post?.media?.[0]?.type === 'video' ? (
                            <video src={post.media[0].url} className="w-full h-full object-cover" controls preload="metadata" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white">▶️ YouTube Preview</div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                            <h3 className="text-white font-semibold text-lg">{post?.title || 'Untitled Video'}</h3>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="dash-card rounded-lg border p-6 text-center text-gray-500">
                        Preview for {currentTab} coming soon
                    </div>
                );
        }
    };

    if (!post) {
        return (
            <div className={embedded ? 'p-6 text-center' : 'dash-card rounded-lg border border-[var(--viralix-border)] p-6'}>
                {!embedded && <h3 className="mb-4 text-lg font-semibold">Platform Preview</h3>}
                <p className="text-sm text-gray-500">No post data available</p>
            </div>
        );
    }

    const content = (
        <>
            <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-[var(--viralix-border)] bg-[var(--viralix-inset)] p-1">
                {displayPlatforms.map((platform) => {
                    const active = currentTab === platform.id;
                    const cfg = platform.cfg;
                    return (
                        <button
                            key={platform.id}
                            type="button"
                            onClick={() => setActiveTab(platform.id)}
                            className={cn(
                                'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors',
                                active && cfg
                                    ? cn('shadow-sm text-white', cfg.gradientClass || cfg.buttonClass)
                                    : active
                                      ? 'bg-[var(--viralix-surface)] text-[var(--viralix-accent)] shadow-sm'
                                      : 'text-[var(--viralix-muted)] hover:text-[var(--viralix-accent)]'
                            )}
                        >
                            {cfg ? <PlatformIcon platform={platform.id} size={14} inverted={active && !!cfg.gradientClass} /> : null}
                            {platform.name}
                        </button>
                    );
                })}
            </div>
            <div className="flex min-h-[360px] items-start justify-center py-2">{renderPreview()}</div>
        </>
    );

    if (embedded) return <div className="px-4 pb-5 pt-3 sm:px-5">{content}</div>;

    return (
        <div className="dash-card rounded-lg border border-[var(--viralix-border)] p-6">
            <h3 className="mb-4 text-lg font-semibold">Platform Preview</h3>
            {content}
        </div>
    );
}
