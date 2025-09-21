'use client';
import { useState, useEffect } from 'react';
import { analyticsAPI, postsAPI, facebookAPI, instagramAPI } from '@/lib/api';
import Link from 'next/link';
import StatsCard from './dashboard/components/StatsCard';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/Modal';

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
            draft: 'bg-gray-100 text-gray-800',
            scheduled: 'bg-yellow-100 text-yellow-800',
            published: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div>
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-center py-8 text-gray-500">Loading dashboard data...</div>
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
                            <ModalTitle>Connect your accounts</ModalTitle>
                            <button aria-label="Close" onClick={() => setShowConnectDialog(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <ModalDescription>
                            You haven\'t connected any social accounts yet. Connect your Facebook or Instagram to start publishing and see analytics.
                        </ModalDescription>
                    </ModalHeader>
                    <div className="flex items-center justify-end space-x-3 mt-4">
                        <button onClick={() => setShowConnectDialog(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Not now</button>
                        <Link href="/dashboard/connect-accounts" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                            Go to Connect Accounts
                        </Link>
                    </div>
                </ModalContent>
            </Modal>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening with your content.</p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
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
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Recent Activity</h3>
                            <Link
                                href="/dashboard/schedule"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                View All
                            </Link>
                        </div>

                        {recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="text-4xl mb-4">📝</div>
                                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                                <p className="mb-4">Create your first post to get started</p>
                                <Link
                                    href="/dashboard/schedule"
                                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
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
                                        <div key={post._id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                {post.media?.[0]?.type === 'video' ? '🎬' : post.media?.[0] ? '📷' : '📝'}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{post.title || 'Untitled Post'}</h4>
                                                <p className="text-sm text-gray-600 line-clamp-1">{post.content}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(post.status)}`}>
                                                        {post.status === 'scheduled' ? 'Scheduled' :
                                                            post.status === 'published' ? 'Published' :
                                                                post.status === 'draft' ? 'Draft' : 'Unknown'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(post.createdAt)}
                                                    </span>
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        👍 {metrics.likes} • 👁️ {formatNumber(metrics.views)}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/dashboard/preview/${post._id}`}
                                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
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
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard/upload"
                                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
                            >
                                <div className="flex items-center">
                                    <span className="text-2xl mr-3">📤</span>
                                    <div>
                                        <div className="font-medium">Upload Content</div>
                                        <div className="text-sm text-gray-600">Add new videos or images</div>
                                    </div>
                                </div>
                            </Link>
                            <Link
                                href="/dashboard/analytics"
                                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
                            >
                                <div className="flex items-center">
                                    <span className="text-2xl mr-3">📊</span>
                                    <div>
                                        <div className="font-medium">View Analytics</div>
                                        <div className="text-sm text-gray-600">Check performance metrics</div>
                                    </div>
                                </div>
                            </Link>
                            <Link
                                href="/dashboard/schedule"
                                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
                            >
                                <div className="flex items-center">
                                    <span className="text-2xl mr-3">📅</span>
                                    <div>
                                        <div className="font-medium">Schedule Post</div>
                                        <div className="text-sm text-gray-600">Plan your content calendar</div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* AI Insights */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
                        <div className="space-y-4">
                            {stats.postsThisMonth > 0 ? (
                                <>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <div className="flex items-start">
                                            <span className="text-xl mr-2">💡</span>
                                            <div>
                                                <div className="font-medium text-blue-900">Performance Trend</div>
                                                <div className="text-sm text-blue-700">
                                                    You've posted {stats.postsThisMonth} times this month
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-start">
                                            <span className="text-xl mr-2">📈</span>
                                            <div>
                                                <div className="font-medium text-green-900">Engagement Rate</div>
                                                <div className="text-sm text-green-700">
                                                    Current rate: {stats.engagementRate.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {stats.scheduledPosts > 0 && (
                                        <div className="p-3 bg-purple-50 rounded-lg">
                                            <div className="flex items-start">
                                                <span className="text-xl mr-2">🎯</span>
                                                <div>
                                                    <div className="font-medium text-purple-900">Upcoming Posts</div>
                                                    <div className="text-sm text-purple-700">
                                                        {stats.scheduledPosts} posts scheduled
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-3 bg-gray-50 rounded-lg text-center">
                                    <div className="text-gray-600">
                                        <div className="text-2xl mb-2">🚀</div>
                                        <div className="font-medium">Get Started</div>
                                        <div className="text-sm">Create your first post to see insights</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
