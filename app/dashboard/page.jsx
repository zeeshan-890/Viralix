'use client';
import { useState, useEffect } from 'react';
import { analyticsAPI, postsAPI, facebookAPI, instagramAPI } from '@/lib/api';
import Link from 'next/link';
import StatsCard from './dashboard/components/StatsCard';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/Modal';
import { Upload, BarChart3, Calendar, Eye, TrendingUp, Clock, X } from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalViews: 0,
        engagementRate: 0,
        postsThisMonth: 0,
        scheduledPosts: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showConnectDialog, setShowConnectDialog] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            // Best-effort refresh so views/followers are populated
            try { await analyticsAPI.refresh(); } catch (_) { }
            // Load analytics overview
            const analyticsResponse = await analyticsAPI.getOverview();
            const analyticsData = analyticsResponse.data || {};
            const overview = analyticsData.overview || {};

            // Load recent posts
            const postsResponse = await postsAPI.getAllPosts({ limit: 5 });
            const postsData = postsResponse.data?.posts || [];

            // Check account connections (Facebook or Instagram)
            let anyConnected = false;
            try {
                const fbStatus = await facebookAPI.status();
                anyConnected = anyConnected || !!fbStatus.data?.connected || (fbStatus.data?.pages?.length > 0);
            } catch { /* ignore */ }
            try {
                const igStatus = await instagramAPI.status();
                const accounts = igStatus.data?.accounts || [];
                anyConnected = anyConnected || accounts.length > 0;
            } catch { /* ignore */ }
            setShowConnectDialog(!anyConnected);

            setStats({
                totalViews: overview.totalViews || 0,
                engagementRate: overview.engagementRate || 0,
                postsThisMonth: overview.totalPosts || 0,
                scheduledPosts: overview.scheduledPosts || 0
            });

            setRecentActivity(postsData);

        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-700',
            scheduled: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
            published: 'bg-green-50 text-green-700 border border-green-200',
            failed: 'bg-red-50 text-red-700 border border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    if (loading) {
        return (
            <div>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: '#354F52' }}>Dashboard</h1>
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                    <div className="text-center py-12">
                        <div className="animate-spin w-12 h-12 border-4 border-gray-200 rounded-full mx-auto mb-4" style={{ borderTopColor: '#84A98C' }}></div>
                        <p className="text-gray-500">Loading dashboard data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Connect Accounts Dialog */}
            <Modal open={showConnectDialog} onOpenChange={setShowConnectDialog}>
                <ModalContent>
                    <ModalHeader>
                        <div className="flex items-start justify-between">
                            <ModalTitle style={{ color: '#354F52' }}>Connect your accounts</ModalTitle>
                            <button
                                aria-label="Close"
                                onClick={() => setShowConnectDialog(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <ModalDescription>
                            You haven't connected any social accounts yet. Connect your Facebook or Instagram to start publishing and see analytics.
                        </ModalDescription>
                    </ModalHeader>
                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button
                            onClick={() => setShowConnectDialog(false)}
                            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                            Not now
                        </button>
                        <Link
                            href="/dashboard/connect-accounts"
                            className="px-5 py-2.5 rounded-lg text-white hover:opacity-90 transition-all font-medium shadow-md"
                            style={{ backgroundColor: '#84A98C' }}
                        >
                            Go to Connect Accounts
                        </Link>
                    </div>
                </ModalContent>
            </Modal>

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#354F52' }}>Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening with your content.</p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Views"
                    value={formatNumber(stats.totalViews)}
                    change={stats.totalViews > 0 ? 12 : 0}
                    icon="👁️"
                    color="blue"
                />
                <StatsCard
                    title="Engagement Rate"
                    value={`${stats.engagementRate.toFixed(1)}%`}
                    change={stats.engagementRate > 0 ? 8 : 0}
                    icon="❤️"
                    color="green"
                />
                <StatsCard
                    title="Posts This Month"
                    value={stats.postsThisMonth}
                    change={stats.postsThisMonth > 0 ? 5 : 0}
                    icon="📝"
                    color="purple"
                />
                <StatsCard
                    title="Scheduled Posts"
                    value={stats.scheduledPosts}
                    icon="📅"
                    color="blue"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold" style={{ color: '#354F52' }}>Recent Activity</h3>
                            <Link
                                href="/dashboard/schedule"
                                className="text-sm font-medium hover:underline transition-colors"
                                style={{ color: '#84A98C' }}
                            >
                                View All →
                            </Link>
                        </div>

                        {recentActivity.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#CAD2C5' }}>
                                    <span className="text-3xl">📝</span>
                                </div>
                                <h3 className="text-lg font-semibold mb-2" style={{ color: '#354F52' }}>No posts yet</h3>
                                <p className="text-gray-600 mb-6">Create your first post to get started</p>
                                <Link
                                    href="/dashboard/schedule"
                                    className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-90 transition-all shadow-md font-medium"
                                    style={{ backgroundColor: '#84A98C' }}
                                >
                                    <Calendar className="w-4 h-4" />
                                    Create Post
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentActivity.map((post) => {
                                    const metrics = (post.platforms || []).reduce((acc, p) => {
                                        const e = p.engagement || {};
                                        acc.likes += e.likes || 0;
                                        acc.comments += e.comments || 0;
                                        acc.shares += e.shares || 0;
                                        acc.views += e.views || 0;
                                        return acc;
                                    }, { likes: 0, comments: 0, shares: 0, views: 0 });
                                    return (
                                        <div key={post._id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300">
                                            <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: '#CAD2C5' }}>
                                                {post.media?.[0]?.type === 'video' ? '🎬' : post.media?.[0] ? '📷' : '📝'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold mb-1" style={{ color: '#354F52' }}>
                                                    {post.title || 'Untitled Post'}
                                                </h4>
                                                <p className="text-sm text-gray-600 line-clamp-1 mb-2">{post.content}</p>
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${getStatusColor(post.status)}`}>
                                                        {post.status === 'scheduled' ? 'Scheduled' :
                                                            post.status === 'published' ? 'Published' :
                                                                post.status === 'draft' ? 'Draft' : 'Unknown'}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(post.createdAt)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        👍 {metrics.likes} • 👁️ {formatNumber(metrics.views)}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/dashboard/preview/${post._id}`}
                                                className="px-4 py-2 text-sm font-medium rounded-lg border-2 hover:bg-opacity-10 transition-all"
                                                style={{
                                                    borderColor: '#84A98C',
                                                    color: '#84A98C'
                                                }}
                                            >
                                                View
                                            </Link>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Takes 1 column */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-xl font-semibold mb-4" style={{ color: '#354F52' }}>Quick Actions</h3>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard/upload"
                                className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 group"
                                style={{
                                    hover: { borderColor: '#84A98C' }
                                }}
                            >
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: '#CAD2C5' }}>
                                    <Upload className="w-6 h-6" style={{ color: '#52796F' }} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold" style={{ color: '#354F52' }}>Upload Content</div>
                                    <div className="text-sm text-gray-600">Add new videos or images</div>
                                </div>
                            </Link>
                            <Link
                                href="/dashboard/analytics"
                                className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 group"
                            >
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: '#CAD2C5' }}>
                                    <BarChart3 className="w-6 h-6" style={{ color: '#52796F' }} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold" style={{ color: '#354F52' }}>View Analytics</div>
                                    <div className="text-sm text-gray-600">Check performance metrics</div>
                                </div>
                            </Link>
                            <Link
                                href="/dashboard/schedule"
                                className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 group"
                            >
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: '#CAD2C5' }}>
                                    <Calendar className="w-6 h-6" style={{ color: '#52796F' }} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold" style={{ color: '#354F52' }}>Schedule Post</div>
                                    <div className="text-sm text-gray-600">Plan your content calendar</div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* AI Insights */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-xl font-semibold mb-4" style={{ color: '#354F52' }}>AI Insights</h3>
                        <div className="space-y-3">
                            {stats.postsThisMonth > 0 ? (
                                <>
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#E8F0ED' }}>
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">💡</span>
                                            <div>
                                                <div className="font-semibold mb-1" style={{ color: '#354F52' }}>Performance Trend</div>
                                                <div className="text-sm text-gray-600">
                                                    You've posted {stats.postsThisMonth} times this month
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-green-50">
                                        <div className="flex items-start gap-3">
                                            <TrendingUp className="w-6 h-6" style={{ color: '#84A98C' }} />
                                            <div>
                                                <div className="font-semibold mb-1" style={{ color: '#354F52' }}>Engagement Rate</div>
                                                <div className="text-sm text-gray-600">
                                                    Current rate: {stats.engagementRate.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {stats.scheduledPosts > 0 && (
                                        <div className="p-4 rounded-xl" style={{ backgroundColor: '#F5F0FF' }}>
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">🎯</span>
                                                <div>
                                                    <div className="font-semibold mb-1" style={{ color: '#354F52' }}>Upcoming Posts</div>
                                                    <div className="text-sm text-gray-600">
                                                        {stats.scheduledPosts} posts scheduled
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-6 rounded-xl text-center" style={{ backgroundColor: '#F7FAF8' }}>
                                    <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: '#CAD2C5' }}>
                                        <span className="text-3xl">🚀</span>
                                    </div>
                                    <div className="font-semibold mb-1" style={{ color: '#354F52' }}>Get Started</div>
                                    <div className="text-sm text-gray-600">Create your first post to see insights</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
