'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function PlatformTabs({ post }) {
    const [activeTab, setActiveTab] = useState('facebook');

    const PlatformIcon = ({ src, alt }) => (
        <Image src={src} alt={alt} width={16} height={16} className="w-4 h-4 object-contain" />
    );

    const platforms = [
        { id: 'facebook', name: 'Facebook', icon: <PlatformIcon src="/facebook.png" alt="FB" />, color: 'bg-blue-600' },
        { id: 'instagram', name: 'Instagram', icon: <PlatformIcon src="/instagram.png" alt="IG" />, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
        { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'bg-blue-400' },
        { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
        { id: 'tiktok', name: 'TikTok', icon: <PlatformIcon src="/tiktok.png" alt="TT" />, color: 'bg-black' },
        { id: 'youtube', name: 'YouTube', icon: <PlatformIcon src="/youtube.png" alt="YT" />, color: 'bg-red-600' },
    ];

    // Filter platforms to only show those selected for this post
    const availablePlatforms = platforms.filter(platform =>
        post?.platforms?.some(p => p.name === platform.id)
    );

    // Default to first available platform if current selection isn't available
    const displayPlatforms = availablePlatforms.length > 0 ? availablePlatforms : platforms.slice(0, 2);
    const currentTab = displayPlatforms.find(p => p.id === activeTab) ? activeTab : displayPlatforms[0]?.id;

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
                    <video
                        src={firstMedia.url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        VIDEO
                    </div>
                </div>
            );
        } else {
            return (
                <img
                    src={firstMedia.url}
                    alt={post?.title || 'Post media'}
                    className="w-full h-48 object-cover rounded-lg"
                />
            );
        }
    };

    const renderPreview = () => {
        const platform = platforms.find(p => p.id === currentTab);

        switch (currentTab) {
            case 'facebook':
                return (
                    <div className="bg-white rounded-lg border border-gray-200 max-w-lg mx-auto shadow-sm">
                        {/* Facebook Header */}
                        <div className="flex items-center p-4 border-b border-gray-200">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                AU
                            </div>
                            <div className="ml-3">
                                <p className="font-semibold">AutoReach AI</p>
                                <p className="text-sm text-gray-600">Just now · 🌍</p>
                            </div>
                        </div>

                        {/* Facebook Content */}
                        <div className="p-4">
                            {post?.content && (
                                <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
                            )}
                            {post?.hashtags && post.hashtags.length > 0 && (
                                <div className="mb-4">
                                    {post.hashtags.map((tag, idx) => (
                                        <span key={idx} className="text-blue-600 mr-1">#{tag}</span>
                                    ))}
                                </div>
                            )}
                            {renderMediaPreview(post?.media)}
                        </div>

                        {/* Facebook Actions */}
                        <div className="px-4 pb-4 flex justify-between border-t border-gray-200 pt-3">
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                                <span>👍</span><span>Like</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                                <span>💬</span><span>Comment</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                                <span>📤</span><span>Share</span>
                            </button>
                        </div>
                    </div>
                );

            case 'instagram':
                return (
                    <div className="bg-white rounded-lg border border-gray-200 max-w-md mx-auto shadow-sm">
                        {/* Instagram Header */}
                        <div className="flex items-center p-3 border-b border-gray-200">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                            <span className="ml-2 font-semibold">autoreach_ai</span>
                        </div>

                        {/* Instagram Content */}
                        <div className="aspect-square bg-gray-100">
                            {post?.media && post.media.length > 0 ? (
                                post.media[0].type === 'video' ? (
                                    <video
                                        src={post.media[0].url}
                                        className="w-full h-full object-cover"
                                        controls
                                        preload="metadata"
                                    />
                                ) : (
                                    <img
                                        src={post.media[0].url}
                                        alt={post?.title}
                                        className="w-full h-full object-cover"
                                    />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <div className="text-6xl mb-4">📷</div>
                                        <p>No media</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Instagram Actions & Caption */}
                        <div className="p-3">
                            <div className="flex space-x-4 mb-2">
                                <span className="text-xl">❤️</span>
                                <span className="text-xl">💬</span>
                                <span className="text-xl">📤</span>
                            </div>
                            {post?.content && (
                                <p className="text-sm">
                                    <strong>autoreach_ai</strong> {post.content}
                                </p>
                            )}
                            {post?.hashtags && post.hashtags.length > 0 && (
                                <div className="mt-1">
                                    {post.hashtags.map((tag, idx) => (
                                        <span key={idx} className="text-blue-600 text-sm mr-1">#{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'twitter':
                return (
                    <div className="bg-white rounded-lg border border-gray-200 max-w-lg mx-auto shadow-sm">
                        {/* Twitter Header */}
                        <div className="flex items-start p-4">
                            <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                AU
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-bold">AutoReach AI</span>
                                    <span className="text-gray-500">@autoreach_ai</span>
                                    <span className="text-gray-500">·</span>
                                    <span className="text-gray-500">now</span>
                                </div>

                                {post?.content && (
                                    <p className="mb-3 whitespace-pre-wrap">{post.content}</p>
                                )}

                                {post?.hashtags && post.hashtags.length > 0 && (
                                    <div className="mb-3">
                                        {post.hashtags.map((tag, idx) => (
                                            <span key={idx} className="text-blue-400 mr-1">#{tag}</span>
                                        ))}
                                    </div>
                                )}

                                {post?.media && post.media.length > 0 && (
                                    <div className="mb-3 rounded-lg overflow-hidden">
                                        {renderMediaPreview(post.media)}
                                    </div>
                                )}

                                {/* Twitter Actions */}
                                <div className="flex justify-between text-gray-500 mt-3 max-w-md">
                                    <button className="flex items-center space-x-2 hover:text-blue-400">
                                        <span>💬</span><span className="text-sm">Reply</span>
                                    </button>
                                    <button className="flex items-center space-x-2 hover:text-green-400">
                                        <span>🔄</span><span className="text-sm">Retweet</span>
                                    </button>
                                    <button className="flex items-center space-x-2 hover:text-red-400">
                                        <span>❤️</span><span className="text-sm">Like</span>
                                    </button>
                                    <button className="flex items-center space-x-2 hover:text-blue-400">
                                        <span>📤</span><span className="text-sm">Share</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'linkedin':
                return (
                    <div className="bg-white rounded-lg border border-gray-200 max-w-lg mx-auto shadow-sm">
                        {/* LinkedIn Header */}
                        <div className="flex items-center p-4 border-b border-gray-200">
                            <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                                AU
                            </div>
                            <div className="ml-3">
                                <p className="font-semibold">AutoReach AI</p>
                                <p className="text-sm text-gray-600">AI-powered social media automation</p>
                                <p className="text-xs text-gray-500">Just now</p>
                            </div>
                        </div>

                        {/* LinkedIn Content */}
                        <div className="p-4">
                            {post?.content && (
                                <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
                            )}

                            {post?.hashtags && post.hashtags.length > 0 && (
                                <div className="mb-4">
                                    {post.hashtags.map((tag, idx) => (
                                        <span key={idx} className="text-blue-700 mr-1">#{tag}</span>
                                    ))}
                                </div>
                            )}

                            {post?.media && post.media.length > 0 && (
                                <div className="rounded-lg overflow-hidden">
                                    {renderMediaPreview(post.media)}
                                </div>
                            )}
                        </div>

                        {/* LinkedIn Actions */}
                        <div className="px-4 pb-4 flex justify-between border-t border-gray-200 pt-3">
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-700">
                                <span>👍</span><span>Like</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-700">
                                <span>💬</span><span>Comment</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-700">
                                <span>📤</span><span>Share</span>
                            </button>
                        </div>
                    </div>
                );

            case 'tiktok':
                return (
                    <div className="bg-black rounded-lg aspect-[9/16] max-w-sm mx-auto relative overflow-hidden">
                        {post?.media && post.media.length > 0 && post.media[0].type === 'video' ? (
                            <video
                                src={post.media[0].url}
                                className="w-full h-full object-cover"
                                controls
                                preload="metadata"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white text-center">
                                    <div className="text-6xl mb-4">🎥</div>
                                    <p className="text-lg">TikTok Preview</p>
                                    {post?.title && <p className="text-sm opacity-75">{post.title}</p>}
                                </div>
                            </div>
                        )}

                        {/* TikTok UI Elements */}
                        <div className="absolute right-4 bottom-20 space-y-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">❤️</div>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">💬</div>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">📤</div>
                        </div>

                        {/* TikTok Caption */}
                        {post?.content && (
                            <div className="absolute bottom-4 left-4 right-16 text-white">
                                <p className="text-sm opacity-90 line-clamp-3">{post.content}</p>
                                {post?.hashtags && post.hashtags.length > 0 && (
                                    <div className="mt-1">
                                        {post.hashtags.slice(0, 3).map((tag, idx) => (
                                            <span key={idx} className="text-yellow-300 text-sm mr-1">#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 'youtube':
                return (
                    <div className="bg-black rounded-lg aspect-video relative overflow-hidden max-w-2xl mx-auto">
                        {post?.media && post.media.length > 0 && post.media[0].type === 'video' ? (
                            <video
                                src={post.media[0].url}
                                className="w-full h-full object-cover"
                                controls
                                preload="metadata"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white text-center">
                                    <div className="text-6xl mb-4">▶️</div>
                                    <p className="text-lg">YouTube Preview</p>
                                    {post?.title && <p className="text-sm opacity-75">{post.title}</p>}
                                </div>
                            </div>
                        )}

                        {/* YouTube Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                            <h3 className="text-white font-semibold text-lg">{post?.title || 'Untitled Video'}</h3>
                            {post?.content && (
                                <p className="text-gray-300 text-sm mt-1 line-clamp-2">{post.content}</p>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!post) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Platform Preview</h3>
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">📝</div>
                    <p>No post data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Platform Preview</h3>

            {/* Platform Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
                {displayPlatforms.map((platform) => (
                    <button
                        key={platform.id}
                        onClick={() => setActiveTab(platform.id)}
                        className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors whitespace-nowrap ${currentTab === platform.id
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <span>{platform.icon}</span>
                        <span className="font-medium">{platform.name}</span>
                    </button>
                ))}
            </div>

            {/* Available Platforms Notice */}
            {availablePlatforms.length > 0 && availablePlatforms.length < platforms.length && (
                <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    This post is configured for: {availablePlatforms.map(p => p.name).join(', ')}
                </div>
            )}

            {/* Preview Content */}
            <div className="min-h-[400px] flex items-center justify-center">
                {renderPreview()}
            </div>
        </div>
    );
}
