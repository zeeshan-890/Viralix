'use client';
import { useState, useEffect } from 'react';
import { postsAPI } from '@/lib/api';
import Link from 'next/link';
import { Eye, Upload, Calendar, FileText, RefreshCw, BarChart3, Settings, Plus, Search, Filter } from 'lucide-react';
import Image from 'next/image';

export default function PreviewPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [connectedPlatforms, setConnectedPlatforms] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

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
        const p = platform.toLowerCase();
        if (p === 'facebook') return <Image src="/facebook.png" alt="FB" width={16} height={16} className="w-4 h-4 object-contain" />;
        if (p === 'instagram') return <Image src="/instagram.png" alt="IG" width={16} height={16} className="w-4 h-4 object-contain" />;
        if (p === 'tiktok') return <Image src="/tiktok.png" alt="TT" width={16} height={16} className="w-4 h-4 object-contain" />;
        if (p === 'youtube') return <Image src="/youtube.png" alt="YT" width={16} height={16} className="w-4 h-4 object-contain" />;

        const icons = {
            twitter: '🐦',
            linkedin: '💼'
        };
        return icons[p] || '📱';
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

    const filteredPosts = posts.filter(post => {
        const matchesSearch = !searchQuery ||
            post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.content?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: posts.length,
        published: posts.filter(p => p.status === 'published').length,
        scheduled: posts.filter(p => p.status === 'scheduled').length,
        draft: posts.filter(p => p.status === 'draft').length,
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: '#2a3e2e' }}>Content Preview</h1>
                        <p className="text-gray-600 mt-1">Preview and manage your content</p>
                    </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-12 text-center">
                    <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: '#84A98C' }} />
                    <p className="text-gray-600">Loading your content...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: '#2a3e2e' }}>Content Preview</h1>
                    <p className="text-gray-600 mt-1">Preview and manage your content across platforms</p>
                </div>
                <Link
                    href="/dashboard/schedule"
                    className="flex items-center gap-2 px-6 py-3 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}
                >
                    <Plus className="w-5 h-5" />
                    Create Post
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Posts */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                            <Eye className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold" style={{ color: '#2a3e2e' }}>{stats.total}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600">Total Posts</h3>
                </div>

                {/* Published */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-green-600">{stats.published}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600">Published</h3>
                </div>

                {/* Scheduled */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-yellow-600">{stats.scheduled}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600">Scheduled</h3>
                </div>

                {/* Drafts */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-600">{stats.draft}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600">Drafts</h3>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">⚠️</div>
                    <div>{error}</div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search and Filter */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search posts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors"
                                    style={{ borderColor: searchQuery ? '#84A98C' : '' }}
                                />
                            </div>
                            {/* Filter */}
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-12 pl-11 pr-8 border-2 border-gray-200 rounded-xl focus:outline-none transition-colors appearance-none bg-white"
                                    style={{ borderColor: statusFilter !== 'all' ? '#84A98C' : '' }}
                                >
                                    <option value="all">All Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="published">Published</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                            {/* Refresh Button */}
                            <button
                                onClick={loadPosts}
                                className="h-12 px-6 rounded-xl border-2 border-gray-200 hover:border-[#84A98C] transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" style={{ color: '#52796F' }} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Posts List */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
                        {filteredPosts.length === 0 ? (
                            <div className="text-center py-16 px-6">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                    <FileText className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2" style={{ color: '#2a3e2e' }}>
                                    {searchQuery || statusFilter !== 'all' ? 'No posts found' : 'No content yet'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {searchQuery || statusFilter !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'Create your first post to see it here'}
                                </p>
                                {!searchQuery && statusFilter === 'all' && (
                                    <Link
                                        href="/dashboard/schedule"
                                        className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                                        style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}
                                    >
                                        <Plus className="w-5 h-5" />
                                        Create Your First Post
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {filteredPosts.map((post) => (
                                    <div
                                        key={post._id}
                                        className="p-6 hover:bg-gray-50/50 transition-colors"
                                    >
                                        <div className="flex gap-4">
                                            {/* Thumbnail */}
                                            <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-200">
                                                {post.media?.[0]?.type === 'video' ? (
                                                    <div className="w-full h-full flex items-center justify-center"
                                                        style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                                        <span className="text-3xl">🎬</span>
                                                    </div>
                                                ) : post.media?.[0] ? (
                                                    <img
                                                        src={post.media[0].url}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                        <FileText className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <h4 className="font-bold text-lg truncate" style={{ color: '#2a3e2e' }}>
                                                        {post.title || 'Untitled Post'}
                                                    </h4>
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(post.status)}`}>
                                                        {getStatusText(post.status)}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                                    {post.content || 'No description'}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {post.status === 'scheduled' && post.scheduledAt
                                                            ? new Date(post.scheduledAt).toLocaleDateString()
                                                            : formatDate(post.createdAt)
                                                        }
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        {post.platforms?.slice(0, 4).map((platform, idx) => (
                                                            <span key={idx} className="text-base">
                                                                {getPlatformIcon(platform.name)}
                                                            </span>
                                                        ))}
                                                        {post.platforms?.length > 4 && (
                                                            <span className="text-xs">+{post.platforms.length - 4}</span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <Link
                                                        href={`/dashboard/preview/${post._id}`}
                                                        className="px-4 py-2 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium"
                                                        style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}
                                                    >
                                                        Preview
                                                    </Link>
                                                    {post.status === 'draft' && (
                                                        <Link
                                                            href={`/dashboard/editor?id=${post._id}`}
                                                            className="px-4 py-2 border-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                                            style={{ borderColor: '#84A98C', color: '#52796F' }}
                                                        >
                                                            Edit
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4" style={{ color: '#2a3e2e' }}>Quick Actions</h3>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard/upload"
                                className="w-full p-4 rounded-xl transition-all hover:shadow-md block group"
                                style={{ background: 'linear-gradient(135deg, #84A98C15 0%, #52796F15 100%)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)' }}>
                                        <Upload className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="font-semibold" style={{ color: '#2a3e2e' }}>Upload New</div>
                                        <div className="text-xs text-gray-600">Add media content</div>
                                    </div>
                                </div>
                            </Link>
                            <Link
                                href="/dashboard/schedule"
                                className="w-full p-4 rounded-xl transition-all hover:shadow-md block"
                                style={{ background: 'linear-gradient(135deg, #10b98115 0%, #059c6915 100%)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-green-900">Schedule Post</div>
                                        <div className="text-xs text-green-700">Plan your content</div>
                                    </div>
                                </div>
                            </Link>
                            <Link
                                href="/dashboard/analytics"
                                className="w-full p-4 rounded-xl transition-all hover:shadow-md block"
                                style={{ background: 'linear-gradient(135deg, #a855f715 0%, #9333ea15 100%)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-purple-900">Analytics</div>
                                        <div className="text-xs text-purple-700">View insights</div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Connected Platforms */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4" style={{ color: '#2a3e2e' }}>Connected Platforms</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                        <Image src="/facebook.png" alt="FB" width={20} height={20} className="w-5 h-5 object-contain" />
                                    </div>
                                    <span className="font-medium text-gray-900">Facebook</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${connectedPlatforms.includes('facebook') ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                        <Image src="/instagram.png" alt="IG" width={20} height={20} className="w-5 h-5 object-contain" />
                                    </div>
                                    <span className="font-medium text-gray-900">Instagram</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${connectedPlatforms.includes('instagram') ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                        <Image src="/tiktok.png" alt="TT" width={20} height={20} className="w-5 h-5 object-contain" />
                                    </div>
                                    <span className="font-medium text-gray-900">TikTok</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${connectedPlatforms.includes('tiktok') ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                        <Image src="/youtube.png" alt="YT" width={20} height={20} className="w-5 h-5 object-contain" />
                                    </div>
                                    <span className="font-medium text-gray-900">YouTube</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${connectedPlatforms.includes('youtube') ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>
                        </div>
                        <Link
                            href="/dashboard/connect-accounts"
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                            style={{ borderColor: '#84A98C', color: '#52796F' }}
                        >
                            <Settings className="w-4 h-4" />
                            Manage Connections
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
