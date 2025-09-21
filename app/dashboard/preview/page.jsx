'use client';
import { useState, useEffect } from 'react';
import { postsAPI } from '@/lib/api';
import Link from 'next/link';

export default function PreviewPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [connectedPlatforms, setConnectedPlatforms] = useState([]);

    useEffect(() => {
        loadPosts();
        // TODO: Load connected platforms from user settings
        setConnectedPlatforms(['facebook', 'instagram']);
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await postsAPI.getAllPosts({ limit: 10 });
            setPosts(response.data?.posts || []);
        } catch (err) {
            setError('Failed to load posts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            scheduled: 'bg-yellow-100 text-yellow-800',
            published: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusText = (status) => {
        const texts = {
            draft: 'Draft',
            scheduled: 'Scheduled',
            published: 'Published',
            failed: 'Failed'
        };
        return texts[status] || 'Unknown';
    };

    const getPlatformIcon = (platform) => {
        const icons = {
            facebook: '💻',
            instagram: '📷',
            twitter: '🐦',
            linkedin: '💼',
            tiktok: '🎵',
            youtube: '📺'
        };
        return icons[platform] || '📱';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));

        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    };

    if (loading) {
        return (
            <div>
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Content Preview</h1>
                    <p className="text-gray-600">Preview your content before publishing across platforms.</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-center py-8 text-gray-500">Loading posts...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Content Preview</h1>
                <p className="text-gray-600">Preview your content before publishing across platforms.</p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Content */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Recent Content</h3>
                            <button
                                onClick={loadPosts}
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                🔄 Refresh
                            </button>
                        </div>

                        {posts.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-4xl mb-4">📝</div>
                                <h3 className="text-lg font-medium mb-2">No content yet</h3>
                                <p>Create your first post to see it here</p>
                                <Link
                                    href="/dashboard/schedule"
                                    className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Create Post
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {posts.map((post) => (
                                    <div
                                        key={post._id}
                                        className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        {/* Thumbnail */}
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                            {post.media?.[0]?.type === 'video' ? (
                                                <span className="text-2xl">🎬</span>
                                            ) : post.media?.[0] ? (
                                                <img
                                                    src={post.media[0].url}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <span className="text-2xl">📝</span>
                                            )}
                                        </div>

                                        {/* Content Info */}
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{post.title || 'Untitled Post'}</h4>
                                            <p className="text-sm text-gray-600 line-clamp-1">{post.content}</p>
                                            <p className="text-sm text-gray-500">
                                                {post.status === 'scheduled' && post.scheduledAt
                                                    ? `Scheduled for ${new Date(post.scheduledAt).toLocaleDateString()}`
                                                    : `Created ${formatDate(post.createdAt)}`
                                                }
                                            </p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(post.status)}`}>
                                                    {getStatusText(post.status)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {post.platforms?.length || 0} platform{post.platforms?.length !== 1 ? 's' : ''}
                                                </span>
                                                <div className="flex space-x-1">
                                                    {post.platforms?.slice(0, 3).map((platform, idx) => (
                                                        <span key={idx} className="text-xs">
                                                            {getPlatformIcon(platform.name)}
                                                        </span>
                                                    ))}
                                                    {post.platforms?.length > 3 && (
                                                        <span className="text-xs text-gray-500">+{post.platforms.length - 3}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex space-x-2">
                                            <Link
                                                href={`/dashboard/preview/${post._id}`}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                Preview
                                            </Link>
                                            {post.status === 'draft' && (
                                                <Link
                                                    href={`/dashboard/schedule?edit=${post._id}`}
                                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                                >
                                                    Edit
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard/upload"
                                className="w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors block"
                            >
                                <div className="flex items-center">
                                    <span className="text-xl mr-3">📤</span>
                                    <div>
                                        <div className="font-medium text-blue-900">Upload New</div>
                                        <div className="text-sm text-blue-700">Add content to preview</div>
                                    </div>
                                </div>
                            </Link>
                            <Link
                                href="/dashboard/schedule"
                                className="w-full text-left p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors block"
                            >
                                <div className="flex items-center">
                                    <span className="text-xl mr-3">📝</span>
                                    <div>
                                        <div className="font-medium text-green-900">Create Post</div>
                                        <div className="text-sm text-green-700">Start with new content</div>
                                    </div>
                                </div>
                            </Link>
                            <Link
                                href="/dashboard/analytics"
                                className="w-full text-left p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors block"
                            >
                                <div className="flex items-center">
                                    <span className="text-xl mr-3">📊</span>
                                    <div>
                                        <div className="font-medium text-purple-900">View Analytics</div>
                                        <div className="text-sm text-purple-700">Check performance</div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">Connected Platforms</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">💻</span>
                                    <span className="text-sm">Facebook</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${connectedPlatforms.includes('facebook') ? 'bg-green-500' : 'bg-gray-300'
                                    }`} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">📷</span>
                                    <span className="text-sm">Instagram</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${connectedPlatforms.includes('instagram') ? 'bg-green-500' : 'bg-gray-300'
                                    }`} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">🐦</span>
                                    <span className="text-sm">Twitter</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${connectedPlatforms.includes('twitter') ? 'bg-green-500' : 'bg-gray-300'
                                    }`} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2">💼</span>
                                    <span className="text-sm">LinkedIn</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${connectedPlatforms.includes('linkedin') ? 'bg-green-500' : 'bg-gray-300'
                                    }`} />
                            </div>
                        </div>
                        <Link
                            href="/dashboard/connect-accounts"
                            className="mt-4 w-full block text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                            Manage Connections
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
