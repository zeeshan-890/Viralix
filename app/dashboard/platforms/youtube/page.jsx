'use client';
import { useState, useEffect } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { platformSyncAPI } from '@/lib/api';
import PlatformPageLayout from '../components/PlatformPageLayout';
import CreateYouTubePost from './components/CreateYouTubePost';
import { Plus } from 'lucide-react';

export default function YouTubePage() {
    const { accounts, isLoading: accountsLoading } = useAccounts();
    const [metrics, setMetrics] = useState({});
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const ytAccounts = accounts.filter(a => a.platform === 'youtube');

    useEffect(() => {
        if (!accountsLoading) {
            loadData();
        }
    }, [accountsLoading, accounts]);

    const loadData = async () => {
        if (ytAccounts.length === 0) {
            setLoading(false);
            return;
        }

        try {
            // Load content from database
            const response = await platformSyncAPI.getContent('youtube', { limit: 50 });
            const data = response.data || {};

            setMetrics({
                totalViews: data.metrics?.totalViews || 0,
                totalLikes: data.metrics?.totalLikes || 0,
                totalComments: data.metrics?.totalComments || 0,
                totalPosts: data.metrics?.count || 0
            });

            // Transform content for display
            const contentItems = (data.content || []).map(item => ({
                id: item.platformContentId,
                title: item.title || 'YouTube Video',
                thumbnail: item.thumbnail,
                type: 'video',
                views: item.views || 0,
                likes: item.likes || 0,
                comments: item.comments || 0,
                permalink: item.permalink
            }));

            setContent(contentItems);
        } catch (e) {
            console.error('Failed to load YouTube data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // Sync from platform to database
            await platformSyncAPI.sync('youtube');
            // Reload data from database
            await loadData();
        } catch (e) {
            console.error('Sync failed:', e);
        } finally {
            setRefreshing(false);
        }
    };

    const handlePostSuccess = () => {
        // Refresh data after successful post
        handleRefresh();
    };

    return (
        <>
            <PlatformPageLayout
                platform="youtube"
                accounts={ytAccounts}
                metrics={metrics}
                content={content}
                loading={loading || accountsLoading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
            >
                {/* Create Post Button */}
                {ytAccounts.length > 0 && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Upload to YouTube
                        </button>
                    </div>
                )}

                {/* YouTube-specific subscriber stats */}
                {ytAccounts.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
                        <h2 className="text-lg font-semibold mb-4" style={{ color: '#354F52' }}>Channel Overview</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-red-50 rounded-xl">
                                <p className="text-2xl font-bold text-red-600">
                                    {ytAccounts.reduce((sum, acc) => sum + (acc.followerCount || 0), 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">Subscribers</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-xl">
                                <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                    {metrics.totalViews?.toLocaleString() || 0}
                                </p>
                                <p className="text-sm text-gray-600">Total Views</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-xl">
                                <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                    {metrics.totalPosts || 0}
                                </p>
                                <p className="text-sm text-gray-600">Videos</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-xl">
                                <p className="text-2xl font-bold" style={{ color: '#354F52' }}>
                                    {metrics.totalLikes?.toLocaleString() || 0}
                                </p>
                                <p className="text-sm text-gray-600">Total Likes</p>
                            </div>
                        </div>
                    </div>
                )}
            </PlatformPageLayout>

            {/* Create Post Modal */}
            <CreateYouTubePost
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                accounts={ytAccounts}
                onSuccess={handlePostSuccess}
            />
        </>
    );
}

